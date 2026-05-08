function getActivityMultiplier(activityLevel) {
  const level = Number(activityLevel);
  if (!Number.isFinite(level)) return 1.2;
  if (level < 1.2) return 1.2;
  if (level > 1.9) return 1.9;
  return level;
}

function calculateBMR({ gender, weightKg, heightCm, ageYears }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return gender === "female" ? base - 161 : base + 5;
}

function calculateNutritionTargets(userInfo) {
  const weightKg = Number(userInfo.weight || 0);
  const heightCm = Number(userInfo.height || 0);
  const ageYears = Number(userInfo.age || 0);
  const goal = userInfo.healthGoal;
  const gender = userInfo.gender || "male";
  const activityMultiplier = getActivityMultiplier(userInfo.activityLevel || 1.2);

  if (!weightKg || !heightCm || !ageYears || !goal) {
    return null;
  }

  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  const bmr = calculateBMR({ gender, weightKg, heightCm, ageYears });
  const tdee = bmr * activityMultiplier;

  let calorieGoal = tdee;
  if (goal === "lose_weight") calorieGoal -= 400;
  if (goal === "gain_weight") calorieGoal += 300;

  // Simple macro split:
  // lose: 35/35/30, maintain: 30/40/30, gain: 30/50/20 (protein/carbs/fat by calories)
  let proteinPct = 0.3;
  let carbsPct = 0.4;
  let fatPct = 0.3;
  if (goal === "lose_weight") {
    proteinPct = 0.35;
    carbsPct = 0.35;
    fatPct = 0.3;
  } else if (goal === "gain_weight") {
    proteinPct = 0.3;
    carbsPct = 0.5;
    fatPct = 0.2;
  }

  const proteinGoal = (calorieGoal * proteinPct) / 4;
  const carbsGoal = (calorieGoal * carbsPct) / 4;
  const fatGoal = (calorieGoal * fatPct) / 9;

  return {
    bmi,
    bmr,
    tdee,
    calorieGoal: Math.round(calorieGoal),
    proteinGoal: Number(proteinGoal.toFixed(1)),
    carbsGoal: Number(carbsGoal.toFixed(1)),
    fatGoal: Number(fatGoal.toFixed(1)),
    activityMultiplier,
  };
}

module.exports = { calculateNutritionTargets };
