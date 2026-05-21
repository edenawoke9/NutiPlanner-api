// nutrition.ts

export type HealthGoal = 'weight-loss' | 'weight-gain' | 'maintain' | 'diabetes';

export function calculateDailyNeeds(profile: {
  weight: number, 
  height: number, 
  age: number, 
  gender: 'male' | 'female', 
  activity: number,
  goal: HealthGoal
}) {
  const { weight, height, age, gender, activity, goal } = profile;

  // 1. BMR Calculation (Mifflin-St Jeor Equation)
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr = gender === 'male' ? bmr + 5 : bmr - 161;

  // 2. TDEE (Total Daily Energy Expenditure)
  let calories = bmr * activity;

  // 3. Default Macro Ratios (Maintenance)
  let proteinRatio = 0.20; // 20%
  let fatRatio = 0.30;     // 30%
  let carbsRatio = 0.50;    // 50%

  // 4. Adjust based on Goal
  switch (goal) {
    case 'weight-loss':
      calories -= 500;      // Caloric Deficit
      proteinRatio = 0.30;  // High protein to keep muscle
      carbsRatio = 0.40;    // Moderate carbs
      break;

    case 'weight-gain':
      calories += 500;      // Caloric Surplus
      proteinRatio = 0.25;
      carbsRatio = 0.50;
      break;

    case 'diabetes':
      // Maintain weight but shift to Low-Glycemic logic
      proteinRatio = 0.25;
      fatRatio = 0.35;
      carbsRatio = 0.40;    // Controlled carbs to manage glucose spikes
      break;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round((calories * proteinRatio) / 4),
    fat: Math.round((calories * fatRatio) / 9),
    carbs: Math.round((calories * carbsRatio) / 4)
  };
}