# main.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import random
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import os
from dotenv import load_dotenv
import google.generativeai as genai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. LOAD DATA
try:
    df = pd.read_csv("ethiopian_food_nutrition_300.csv")
    features = ['Protein_g', 'Fat_g', 'Carbs_g', 'Fiber_g']
    for col in features + ['Calories_kcal']:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df[features])
except Exception as e:
    print(f"Critical Error loading CSV: {e}")

# 2. MEAL TYPE CONFIGURATION
MEAL_GROUPS = {
    "breakfast": ["Breakfast", "Bread"],
    "lunch": ["Mixed", "Beef Dish", "Chicken Dish", "Lamb Dish", "Seafood", "Legume Stew"],
    "dinner": ["Vegetable", "Salad", "Mixed", "Legume Stew"]
}

def get_stochastic_match(target_nutrients, meal_type, goal):
    allowed_categories = MEAL_GROUPS.get(meal_type, [])
    
    # Base Filter: Category
    filtered_df = df[df['Category'].isin(allowed_categories)].copy()
    
    # Health Goal Filter: Diabetes (Avoid very high carb items > 60g per 100g)
    if goal == "diabetes":
        filtered_df = filtered_df[filtered_df['Carbs_g'] < 60]

    if filtered_df.empty:
        filtered_df = df.copy()

    # AI Match Logic
    target_scaled = scaler.transform([target_nutrients])
    X_filtered_scaled = scaler.transform(filtered_df[features])
    sims = cosine_similarity(target_scaled, X_filtered_scaled)
    
    filtered_df['score'] = sims[0]
    
    # Variety: Pick from top 5 best matches
    top_candidates = filtered_df.sort_values('score', ascending=False).head(5)
    return top_candidates.sample(n=1).iloc[0]

@app.get("/generate_plan")
def generate_plan(
    calories: float, 
    protein: float, 
    fat: float, 
    carbs: float, 
    goal: str = "maintain"
):
    try:
        plan = {}
        splits = {"breakfast": 0.25, "lunch": 0.35, "dinner": 0.40}
        
        for meal, ratio in splits.items():
            targets = [protein * ratio, fat * ratio, carbs * ratio, 2.0]
            match = get_stochastic_match(targets, meal, goal)
            
            # Portion Calculation
            if match['Calories_kcal'] <= 0:
                portion_size = 100.0
            else:
                portion_size = (calories * ratio / match['Calories_kcal']) * 100
                
            plan[meal] = {
                "food_name": match['Food'],
                "category": match['Category'],
                "portion_grams": round(float(portion_size), 1),
                "calories": round(calories * ratio, 1),
                "protein": round(float(match['Protein_g'] * (portion_size/100)), 1),
                "fat": round(float(match['Fat_g'] * (portion_size/100)), 1),
                "carbs": round(float(match['Carbs_g'] * (portion_size/100)), 1)
            }
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze")
def analyze_food(query: str):
    result = df[df['Food'].str.contains(query, case=False, na=False)].head(10)
    return result.to_dict(orient='records')

load_dotenv()
api_key = os.getenv("chatBotKey")

if api_key:
    genai.configure(api_key=api_key)
else:
    print("Error: chatBotKey not found in .env file")

model = genai.GenerativeModel('gemini-1.5-flash')
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)