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

export const EMPTY_CALORIE_SETTINGS: AllCalorieSettings = {
  male: {
    maintenance: 0,
    deficit: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    stepGoal: 0,
  },
  female: {
    maintenance: 0,
    deficit: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    stepGoal: 0,
  },
}

const STORAGE_KEY = "finess_calorie_settings_v1"

export function getCalorieSettings(): AllCalorieSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        male: { ...EMPTY_CALORIE_SETTINGS.male, ...parsed.male },
        female: { ...EMPTY_CALORIE_SETTINGS.female, ...parsed.female },
      }
    }
  } catch (err) {
    console.error("Error reading calorie settings:", err)
  }
  return EMPTY_CALORIE_SETTINGS
}

export function saveCalorieSettings(settings: AllCalorieSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error("Error saving calorie settings:", err)
  }
}

export function getIntakeTarget(personSettings: PersonCalorieSettings): number {
  return Math.max(0, (personSettings.maintenance || 0) - (personSettings.deficit || 0))
}
