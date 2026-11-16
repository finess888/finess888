import { callGasApi } from "@/api/gasClient"

export type ExerciseCategory =
  | "คาร์ดิโอ (Cardio)"
  | "เวทเทรนนิ่ง - อก & หลังแขน"
  | "เวทเทรนนิ่ง - หลัง & หน้าแขน"
  | "เวทเทรนนิ่ง - ขา & ก้น"
  | "เวทเทรนนิ่ง - ไหล่ & ท้อง"
  | "ก้าวเดิน (Daily Steps)"
  | "ยืดเหยียด & โยคะ"

export interface ExerciseItem {
  id: string
  code: string
  category: ExerciseCategory
  name: string
  burnRateKcalPerMin: number
  targetMuscles: string
  targetGroup: "ฝ่ายชาย" | "ฝ่ายหญิง" | "ทั้งคู่"
  metValue: number
  tips: string
}

export interface WorkoutEntry {
  id: string
  date: string // YYYY-MM-DD
  person: "ฝ่ายชาย" | "ฝ่ายหญิง"
  exerciseId?: string
  exerciseName: string
  category: string
  durationMinutes: number
  burnedCalories: number
  steps?: number
  sets?: number
  reps?: number
  weightKg?: number
  distanceKm?: number
  intensity: "เบา (Light)" | "ปานกลาง (Moderate)" | "หนัก (High/Intense)"
  notes?: string
  createdAt: string
}

export interface DailyStepLog {
  id: string
  date: string // YYYY-MM-DD
  person: "ฝ่ายชาย" | "ฝ่ายหญิง"
  steps: number
  distanceKm?: number
  burnedCalories: number
  stepGoal: number
  notes?: string
  createdAt: string
}

export const DEFAULT_EXERCISES: ExerciseItem[] = [
  // 1. Cardio
  {
    id: "EX-01",
    code: "C01",
    category: "คาร์ดิโอ (Cardio)",
    name: "วิ่งบนลู่ (Treadmill Running)",
    burnRateKcalPerMin: 10,
    targetMuscles: "หัวใจและปอด, ขาทั้งหมด, ก้น",
    targetGroup: "ทั้งคู่",
    metValue: 9.8,
    tips: "วิ่งโซน 2 เพื่อดึงไขมันมาใช้เป็นพลังงานหลัก รักษาท่าหลังตรง",
  },
  {
    id: "EX-02",
    code: "C02",
    category: "คาร์ดิโอ (Cardio)",
    name: "เดินชันบนลู่ (Incline Treadmill Walk)",
    burnRateKcalPerMin: 7,
    targetMuscles: "ก้น, น่อง, หลังขา (Hamstrings)",
    targetGroup: "ทั้งคู่",
    metValue: 6.5,
    tips: "ปรับความชัน 10-12% ความเร็ว 4-5 กม./ชม. ไม่จับราวจับเพื่อเผาผลาญสูงสุด",
  },
  {
    id: "EX-03",
    code: "C03",
    category: "คาร์ดิโอ (Cardio)",
    name: "ปั่นจักรยานฟิตเนส (Stationary Bike)",
    burnRateKcalPerMin: 8,
    targetMuscles: "หน้าขา, น่อง, ระบบไหลเวียนโลหิต",
    targetGroup: "ทั้งคู่",
    metValue: 7.5,
    tips: "เซ็ตเบาะให้พอดีกับความยาวขา เพื่อป้องกันอาการปวดเข่า",
  },
  {
    id: "EX-04",
    code: "C04",
    category: "คาร์ดิโอ (Cardio)",
    name: "กระโดดเชือก (Jump Rope)",
    burnRateKcalPerMin: 12,
    targetMuscles: "น่อง, ไหล่, แกนกลางลำตัว, หัวใจ",
    targetGroup: "ทั้งคู่",
    metValue: 11.0,
    tips: "กระโดดต่ำๆ ใช้ข้อมือหมุนเชือก สวมรองเท้าซับแรงกระแทก",
  },
  {
    id: "EX-05",
    code: "C05",
    category: "คาร์ดิโอ (Cardio)",
    name: "ว่ายน้ำ (Swimming - Freestyle)",
    burnRateKcalPerMin: 9,
    targetMuscles: "ทั่วร่างกาย, หลัง, ไหล่, ปอด",
    targetGroup: "ทั้งคู่",
    metValue: 8.3,
    tips: "แรงกระแทกต่ำ เหมาะสำหรับถนอมข้อต่อและเผาผลาญเต็มรูปแบบ",
  },

  // 2. Chest & Triceps
  {
    id: "EX-06",
    code: "W01",
    category: "เวทเทรนนิ่ง - อก & หลังแขน",
    name: "บาร์เบล เบนช์เพรส (Barbell Bench Press)",
    burnRateKcalPerMin: 6,
    targetMuscles: "อกกลาง, ไหล่หน้า, หลังแขน",
    targetGroup: "ทั้งคู่",
    metValue: 5.5,
    tips: "ดึงสะบักลงติดเบาะ วางเท้าราบพื้น หายใจออกขณะดันขึ้น",
  },
  {
    id: "EX-07",
    code: "W02",
    category: "เวทเทรนนิ่ง - อก & หลังแขน",
    name: "ดัมเบลล์ อินไคลน์เพรส (Incline Dumbbell Press)",
    burnRateKcalPerMin: 6,
    targetMuscles: "อกบน, ไหล่หน้า",
    targetGroup: "ทั้งคู่",
    metValue: 5.5,
    tips: "ปรับเบาะชัน 30-45 องศา โฟกัสการบีบกล้ามเนื้ออกส่วนบน",
  },
  {
    id: "EX-08",
    code: "W03",
    category: "เวทเทรนนิ่ง - อก & หลังแขน",
    name: "วิดพื้น (Push-Ups)",
    burnRateKcalPerMin: 7,
    targetMuscles: "อก, แกนกลางลำตัว, หลังแขน",
    targetGroup: "ทั้งคู่",
    metValue: 6.0,
    tips: "เกร็งหน้าท้องและก้น ลำตัวตรงเป็นระนาบเดียวกันตลอดการเคลื่อนไหว",
  },
  {
    id: "EX-09",
    code: "W04",
    category: "เวทเทรนนิ่ง - อก & หลังแขน",
    name: "เคเบิล ไทรเซ็ป พุชดาวน์ (Cable Tricep Pushdown)",
    burnRateKcalPerMin: 5,
    targetMuscles: "หลังแขน (Triceps)",
    targetGroup: "ทั้งคู่",
    metValue: 4.8,
    tips: "ล็อกข้อศอกแนบลำตัว ดันลงจนแขนตึงแล้วบีบหลังแขน 1 วินาที",
  },

  // 3. Back & Biceps
  {
    id: "EX-10",
    code: "W05",
    category: "เวทเทรนนิ่ง - หลัง & หน้าแขน",
    name: "แลต พูลดาวน์ (Lat Pulldown)",
    burnRateKcalPerMin: 6,
    targetMuscles: "ปีกหลัง (Lats), หลังส่วนบน, หน้าแขน",
    targetGroup: "ทั้งคู่",
    metValue: 5.5,
    tips: "แอ่นอกขึ้น ดึงบาร์ลงมาแตะยอดอก โฟกัสการดึงด้วยข้อศอกไม่ใช่ข้อมือ",
  },
  {
    id: "EX-11",
    code: "W06",
    category: "เวทเทรนนิ่ง - หลัง & หน้าแขน",
    name: "ซีทเต็ด เคเบิลโรว์ (Seated Cable Row)",
    burnRateKcalPerMin: 6,
    targetMuscles: "หลังกลาง (Mid-back), สะบัก, หน้าแขน",
    targetGroup: "ทั้งคู่",
    metValue: 5.5,
    tips: "หลังตรง ไม่โยกตัว ดึงด้ามจับเข้าหาหน้าท้องแล้วบีบสะบักเข้าหากัน",
  },
  {
    id: "EX-12",
    code: "W07",
    category: "เวทเทรนนิ่ง - หลัง & หน้าแขน",
    name: "ดัมเบลล์ ไบเซ็ป เคิร์ล (Dumbbell Bicep Curl)",
    burnRateKcalPerMin: 5,
    targetMuscles: "หน้าแขน (Biceps)",
    targetGroup: "ทั้งคู่",
    metValue: 4.5,
    tips: "ล็อกข้อศอกนิ่ง ไม่เหวี่ยงตัว ยกขึ้นบีบหน้าแขนช้าๆ",
  },

  // 4. Legs & Glutes
  {
    id: "EX-13",
    code: "W08",
    category: "เวทเทรนนิ่ง - ขา & ก้น",
    name: "บาร์เบล สควอท (Barbell Squat)",
    burnRateKcalPerMin: 8,
    targetMuscles: "หน้าขา, ก้น, แกนกลางลำตัว",
    targetGroup: "ทั้งคู่",
    metValue: 7.0,
    tips: "กางขาเท่าช่วงไหล่ หย่อนก้นลงเหมือนนั่งเก้าอี้ เข่าไม่หุบเข้าหากัน",
  },
  {
    id: "EX-14",
    code: "W09",
    category: "เวทเทรนนิ่ง - ขา & ก้น",
    name: "โรมาเนียน เดดลิฟต์ (Romanian Deadlift - RDL)",
    burnRateKcalPerMin: 7,
    targetMuscles: "หลังขา (Hamstrings), ก้น, หลังล่าง",
    targetGroup: "ทั้งคู่",
    metValue: 6.5,
    tips: "งอเข่าเล็กน้อย ดันสะโพกไปข้างหลัง หลังตรง โฟกัสแรงยืดที่หลังขา",
  },
  {
    id: "EX-15",
    code: "W10",
    category: "เวทเทรนนิ่ง - ขา & ก้น",
    name: "เลกเพรส (Leg Press)",
    burnRateKcalPerMin: 7,
    targetMuscles: "หน้าขา, ก้น",
    targetGroup: "ทั้งคู่",
    metValue: 6.0,
    tips: "ดันแผ่นเหล็กขึ้นโดยไม่ล็อกหัวเข่าสุด เพื่อความปลอดภัยของข้อเข่า",
  },
  {
    id: "EX-16",
    code: "W11",
    category: "เวทเทรนนิ่ง - ขา & ก้น",
    name: "ดัมเบลล์ วอล์กกิ้ง ลันจ์ (Walking Lunges)",
    burnRateKcalPerMin: 7,
    targetMuscles: "ก้น, หน้าขา, การทรงตัว",
    targetGroup: "ทั้งคู่",
    metValue: 6.5,
    tips: "ก้าวขายาวพอดี เข่าหน้าทำมุม 90 องศา ลำตัวตั้งตรง",
  },

  // 5. Shoulder & Core
  {
    id: "EX-17",
    code: "W12",
    category: "เวทเทรนนิ่ง - ไหล่ & ท้อง",
    name: "ดัมเบลล์ โชลเดอร์เพรส (Dumbbell Shoulder Press)",
    burnRateKcalPerMin: 6,
    targetMuscles: "ไหล่หน้า, ไหล่กลาง, หลังแขน",
    targetGroup: "ทั้งคู่",
    metValue: 5.5,
    tips: "นั่งหลังตรง ดันดัมเบลล์ขึ้นเหนือศีรษะ ไม่ให้ไหล่ห่อเข้า",
  },
  {
    id: "EX-18",
    code: "W13",
    category: "เวทเทรนนิ่ง - ไหล่ & ท้อง",
    name: "ดัมเบลล์ แลทเทอรัลเรส (Lateral Raise)",
    burnRateKcalPerMin: 5,
    targetMuscles: "หัวไหล่ด้านข้าง (Side Delts)",
    targetGroup: "ทั้งคู่",
    metValue: 4.5,
    tips: "ยกแขนขึ้นด้านข้างระดับเดียวกับไหล่ ศอกงอเล็กน้อย ไม่ใช้แรงเหวี่ยง",
  },
  {
    id: "EX-19",
    code: "W14",
    category: "เวทเทรนนิ่ง - ไหล่ & ท้อง",
    name: "แพลงก์ (Standard Plank)",
    burnRateKcalPerMin: 5,
    targetMuscles: "แกนกลางลำตัวทั้งหมด, หลังล่าง",
    targetGroup: "ทั้งคู่",
    metValue: 4.8,
    tips: "เกร็งหน้าท้องและก้น หลังตรง ไม่ให้สะโพกตกหรือโด่งเกินไป",
  },
  {
    id: "EX-20",
    code: "W15",
    category: "เวทเทรนนิ่ง - ไหล่ & ท้อง",
    name: "ครันช์ (Abdominal Crunches)",
    burnRateKcalPerMin: 5,
    targetMuscles: "กล้ามเนื้อหน้าท้องส่วนบน",
    targetGroup: "ทั้งคู่",
    metValue: 4.5,
    tips: "ยกเฉพาะช่วงสะบักขึ้นจากพื้น โฟกัสการม้วนตัว ไม่ดึงคอ",
  },

  // 6. Walking / Daily Steps
  {
    id: "EX-21",
    code: "S01",
    category: "ก้าวเดิน (Daily Steps)",
    name: "เดินสะสมก้าวประจำวัน (Daily Step Activity)",
    burnRateKcalPerMin: 4,
    targetMuscles: "ขาทั้งหมด, หัวใจ, สุขภาพหลอดเลือด",
    targetGroup: "ทั้งคู่",
    metValue: 3.8,
    tips: "เป้าหมายแนะนำ 8,000 - 10,000 ก้าว/วัน (1,000 ก้าว เผาผลาญ ~35-40 kcal)",
  },
  {
    id: "EX-22",
    code: "S02",
    category: "ก้าวเดิน (Daily Steps)",
    name: "เดินย่อยอาหารหลังมื้อ (Post-Meal Walk)",
    burnRateKcalPerMin: 4,
    targetMuscles: "ระบบย่อยอาหาร, ควบคุมน้ำตาลในเลือด",
    targetGroup: "ทั้งคู่",
    metValue: 3.5,
    tips: "เดินสบายๆ 15-20 นาที หลังมื้ออาหาร ช่วยลดระดับอินซูลินสไปก์",
  },

  // 7. Stretching & Flexibility
  {
    id: "EX-23",
    code: "F01",
    category: "ยืดเหยียด & โยคะ",
    name: "ยืดกล้ามเนื้อทั่วร่างกาย (Full Body Stretching)",
    burnRateKcalPerMin: 3.5,
    targetMuscles: "กล้ามเนื้อทุกมัด, ข้อต่อ",
    targetGroup: "ทั้งคู่",
    metValue: 2.8,
    tips: "ค้างแต่ละท่า 15-30 วินาที หายใจเข้าออกลึกๆ ไม่กระตุก",
  },
  {
    id: "EX-24",
    code: "F02",
    category: "ยืดเหยียด & โยคะ",
    name: "โยคะผ่อนคลาย (Restorative / Flow Yoga)",
    burnRateKcalPerMin: 4,
    targetMuscles: "ความยืดหยุ่น, สมาธิ, การหายใจ",
    targetGroup: "ทั้งคู่",
    metValue: 3.2,
    tips: "เหมาะสำหรับวันพักผ่อน (Rest Day) ช่วยฟื้นฟูกล้ามเนื้อและลดคอร์ติซอล",
  },
]

const STORAGE_EXERCISES_KEY = "finess_custom_exercises_v1"
const STORAGE_WORKOUTS_KEY = "finess_workout_logs_v1"
const STORAGE_STEPS_KEY = "finess_step_logs_v1"

export function getExerciseDatabase(): ExerciseItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_EXERCISES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...DEFAULT_EXERCISES, ...parsed]
      }
    }
  } catch (err) {
    console.error("Error reading custom exercises:", err)
  }
  return DEFAULT_EXERCISES
}

export function saveCustomExercise(item: ExerciseItem): void {
  try {
    const raw = localStorage.getItem(STORAGE_EXERCISES_KEY)
    const existing: ExerciseItem[] = raw ? JSON.parse(raw) : []
    existing.push(item)
    localStorage.setItem(STORAGE_EXERCISES_KEY, JSON.stringify(existing))
  } catch (err) {
    console.error("Error saving custom exercise:", err)
  }
}

export function getWorkoutLogs(): WorkoutEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_WORKOUTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (err) {
    console.error("Error reading workout logs:", err)
  }
  return []
}

export function saveWorkoutLog(entry: WorkoutEntry): void {
  try {
    const logs = getWorkoutLogs()
    logs.unshift(entry)
    localStorage.setItem(STORAGE_WORKOUTS_KEY, JSON.stringify(logs))
    callGasApi("SAVE_WORKOUT_LOGS", logs).catch(() => {})
  } catch (err) {
    console.error("Error saving workout log:", err)
  }
}

export function saveAllWorkoutLogs(logs: WorkoutEntry[]): void {
  try {
    localStorage.setItem(STORAGE_WORKOUTS_KEY, JSON.stringify(logs))
  } catch (err) {
    console.error("Error saving all workout logs:", err)
  }
}

export function deleteWorkoutLog(id: string): void {
  try {
    const logs = getWorkoutLogs().filter((l) => l.id !== id)
    localStorage.setItem(STORAGE_WORKOUTS_KEY, JSON.stringify(logs))
    callGasApi("SAVE_WORKOUT_LOGS", logs).catch(() => {})
  } catch (err) {
    console.error("Error deleting workout log:", err)
  }
}

export function getDailyStepLogs(): DailyStepLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_STEPS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (err) {
    console.error("Error reading step logs:", err)
  }
  return []
}

export function saveDailyStepLog(entry: DailyStepLog): void {
  try {
    const logs = getDailyStepLogs()
    // replace if date + person already exists
    const idx = logs.findIndex((l) => l.date === entry.date && l.person === entry.person)
    if (idx >= 0) {
      logs[idx] = entry
    } else {
      logs.unshift(entry)
    }
    localStorage.setItem(STORAGE_STEPS_KEY, JSON.stringify(logs))
    callGasApi("SAVE_STEP_LOGS", logs).catch(() => {})
  } catch (err) {
    console.error("Error saving step log:", err)
  }
}

export function saveAllStepLogs(logs: DailyStepLog[]): void {
  try {
    localStorage.setItem(STORAGE_STEPS_KEY, JSON.stringify(logs))
  } catch (err) {
    console.error("Error saving all step logs:", err)
  }
}

export function calculateWorkoutStats(
  workouts: WorkoutEntry[],
  stepLogs: DailyStepLog[],
  startDate?: string,
  endDate?: string,
  person?: string
) {
  const filteredWorkouts = workouts.filter((w) => {
    if (person && person !== "ALL" && w.person !== person) return false
    if (startDate && w.date < startDate) return false
    if (endDate && w.date > endDate) return false
    return true
  })

  const filteredSteps = stepLogs.filter((s) => {
    if (person && person !== "ALL" && s.person !== person) return false
    if (startDate && s.date < startDate) return false
    if (endDate && s.date > endDate) return false
    return true
  })

  const totalWorkoutMinutes = filteredWorkouts.reduce((s, w) => s + Number(w.durationMinutes || 0), 0)
  const totalWorkoutCalories = filteredWorkouts.reduce((s, w) => s + Number(w.burnedCalories || 0), 0)

  const totalSteps = filteredSteps.reduce((s, st) => s + Number(st.steps || 0), 0)
  const totalStepCalories = filteredSteps.reduce((s, st) => s + Number(st.burnedCalories || 0), 0)
  const avgStepsPerDay = filteredSteps.length > 0 ? Math.round(totalSteps / filteredSteps.length) : 0

  return {
    totalWorkouts: filteredWorkouts.length,
    totalWorkoutMinutes,
    totalWorkoutCalories,
    totalSteps,
    totalStepCalories,
    avgStepsPerDay,
    totalCombinedCalories: totalWorkoutCalories + totalStepCalories,
    daysActive: new Set([...filteredWorkouts.map((w) => w.date), ...filteredSteps.map((s) => s.date)]).size,
  }
}
