const fs = require("fs");
const path = require("path");

const FEATURES = ["Protein_g", "Fat_g", "Carbs_g", "Fiber_g"];
const NUMERIC_COLS = [...FEATURES, "Calories_kcal"];

const DEFAULT_CSV_PATH = path.join(
  __dirname,
  "../../../ethiopian_food_nutrition_300.csv"
);

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function resolveCsvPath(explicitPath) {
  if (explicitPath) return explicitPath;
  if (process.env.FOOD_CSV_PATH) return process.env.FOOD_CSV_PATH;

  const candidates = [
    DEFAULT_CSV_PATH,
    path.join(process.cwd(), "ethiopian_food_nutrition_300.csv"),
    path.join(__dirname, "../../../ethiopian_food_nutrition_300.csv"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return DEFAULT_CSV_PATH;
}

function loadFoodCsv(csvPath) {
  const resolved = resolveCsvPath(csvPath);
  const raw = fs.readFileSync(resolved, "utf8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  const headers = parseCsvLine(lines[0]);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      const value = values[idx] ?? "";
      if (NUMERIC_COLS.includes(header)) {
        const num = Number(value);
        row[header] = Number.isFinite(num) ? num : 0;
      } else {
        row[header] = value;
      }
    });
    rows.push(row);
  }

  return rows;
}

module.exports = { loadFoodCsv, FEATURES, NUMERIC_COLS, DEFAULT_CSV_PATH };
