export interface PersonCalorieSettings {
  maintenance: number // แคลอรี่เผาผลาญต่อวัน (TDEE)
  deficit: number     // เป้าหมายตัดทอนแคลอรี่ต่อวัน
  protein: number     // เป้าหมายโปรตีน (g)
  carbs: number       // เป้าหมายคาร์บ (g)
  fat: number         // เป้าหมายไขมัน (g)
  stepGoal?: number   // เป้าหมายก้าวเดินต่อวัน (ก้าว)
}

export interface AllCalorieSettings {
  male: PersonCalorieSettings
  female: PersonCalorieSettings
}

export const DEFAULT_CALORIE_SETTINGS: AllCalorieSettings = {
  male: {
    maintenance: 2000,
    deficit: 300,
    protein: 120,
    carbs: 210,
    fat: 60,
    stepGoal: 8000,
  },
  female: {
    maintenance: 1700,
    deficit: 300,
    protein: 104,
    carbs: 130,
    fat: 40,
    stepGoal: 8000,
  },
}

const STORAGE_KEY = "finess_calorie_settings_v1"

export function getCalorieSettings(): AllCalorieSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        male: { ...DEFAULT_CALORIE_SETTINGS.male, ...parsed.male },
        female: { ...DEFAULT_CALORIE_SETTINGS.female, ...parsed.female },
      }
    }
  } catch (err) {
    console.error("Error reading calorie settings:", err)
  }
  return DEFAULT_CALORIE_SETTINGS
}

export function saveCalorieSettings(settings: AllCalorieSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error("Error saving calorie settings:", err)
  }
}

export function getIntakeTarget(personSettings: PersonCalorieSettings): number {
  return Math.max(500, (personSettings.maintenance || 2000) - (personSettings.deficit || 0))
}
