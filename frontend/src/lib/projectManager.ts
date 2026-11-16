export interface FitnessProject {
  id: string
  title: string
  person: "ฝ่ายชาย" | "ฝ่ายหญิง" | "ทั้งคู่"
  targetFatLossKg: number
  targetDeficitKcal: number
  targetDailySteps?: number // เป้าหมายก้าวเดินต่อวัน (เช่น 8,000 หรือ 10,000 ก้าว)
  startDate: string // YYYY-MM-DD
  deadlineDate: string // YYYY-MM-DD
  startWeight: number
  targetWeight: number
  status: "active" | "completed" | "archived"
  notes?: string
  completedAt?: string
  reviewNotes?: string
}

const STORAGE_PROJECTS_KEY = "finess_projects_list_v1"

export const DEFAULT_PROJECTS: FitnessProject[] = [
  {
    id: "proj-male-1",
    title: "โปรเจกต์ที่ 1: ลดไขมัน 10 กก. เฟสแรก",
    person: "ฝ่ายชาย",
    targetFatLossKg: 10,
    targetDeficitKcal: 75000,
    targetDailySteps: 8000,
    startDate: "2026-11-16",
    deadlineDate: "2026-12-31",
    startWeight: 100.0,
    targetWeight: 90.0,
    status: "active",
    notes: "ตัดทอนแคลอรี่รวม 75,000 kcal เน้นคุมอาหารและออกกำลังกายอย่างต่อเนื่อง",
  },
  {
    id: "proj-female-1",
    title: "โปรเจกต์ที่ 1: ลดไขมัน 5 กก. เฟสแรก",
    person: "ฝ่ายหญิง",
    targetFatLossKg: 5,
    targetDeficitKcal: 37500,
    targetDailySteps: 8000,
    startDate: "2026-11-16",
    deadlineDate: "2026-12-31",
    startWeight: 65.0,
    targetWeight: 60.0,
    status: "active",
    notes: "ตัดทอนแคลอรี่รวม 37,500 kcal เน้นโภชนาการคลีนและโปรตีนถึงเป้า",
  },
]

export function getProjects(): FitnessProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error("Error reading projects:", err)
  }
  return DEFAULT_PROJECTS
}

export function saveProjects(projects: FitnessProject[]): void {
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects))
  } catch (err) {
    console.error("Error saving projects:", err)
  }
}

export function getActiveProject(person: string): FitnessProject | null {
  const projects = getProjects()
  const active = projects.find(
    (p) => p.status === "active" && (p.person === person || (person !== "ALL" && p.person === "ทั้งคู่"))
  )
  if (active) return active

  // fallback to default
  const defaultProj = DEFAULT_PROJECTS.find((p) => p.person === person)
  return defaultProj || projects[0] || null
}

export function saveProject(project: FitnessProject): void {
  const projects = getProjects()
  const idx = projects.findIndex((p) => p.id === project.id)
  if (idx >= 0) {
    projects[idx] = project
  } else {
    projects.push(project)
  }
  saveProjects(projects)
}

export function createProject(data: Omit<FitnessProject, "id">): FitnessProject {
  const projects = getProjects()
  // if creating active, set other projects of same person to archived
  if (data.status === "active") {
    projects.forEach((p) => {
      if (p.person === data.person && p.status === "active") {
        p.status = "archived"
      }
    })
  }

  const newProject: FitnessProject = {
    ...data,
    id: "proj-" + Date.now(),
    targetDeficitKcal: data.targetFatLossKg * 7500,
  }

  projects.unshift(newProject)
  saveProjects(projects)
  return newProject
}

export function completeProject(id: string, reviewNotes?: string): void {
  const projects = getProjects()
  const p = projects.find((item) => item.id === id)
  if (p) {
    p.status = "completed"
    p.completedAt = new Date().toISOString()
    if (reviewNotes) {
      p.reviewNotes = reviewNotes
    }
    saveProjects(projects)
  }
}

export function updateProject(id: string, updates: Partial<FitnessProject>): FitnessProject | null {
  const projects = getProjects()
  const p = projects.find((item) => item.id === id)
  if (p) {
    Object.assign(p, updates)
    saveProjects(projects)
    return p
  }
  return null
}

export interface ProjectAnalysis {
  daysTotal: number
  daysElapsed: number
  daysRemaining: number
  isOverdue: boolean
  progressTimePct: number
  startWeight: number
  currentWeight: number
  weightLost: number
  weightRemaining: number
  weightProgressPct: number
  totalDeficitTarget: number
  deficitAchieved: number
  deficitProgressPct: number
  mealsCount: number
  daysCompliant: number
  daysOverIntake: number
  avgDailyIntake: number
  activitiesCount: number
  activitySamples: string[]
  evaluationSummary: string
  nextProjectAdvice: string
}

export function analyzeProject(
  project: FitnessProject,
  meals: any[],
  healthLogs: any[],
  maintenanceCalories: number,
  targetIntakeCalories: number
): ProjectAnalysis {
  // Local current date in YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString("en-CA")

  // Parse YYYY-MM-DD safely into UTC timestamps to avoid timezone shifts
  const parseDateUtc = (dStr: string) => {
    const parts = dStr.split("-").map(Number)
    return Date.UTC(parts[0], parts[1] - 1, parts[2] || 1)
  }

  const startUtc = parseDateUtc(project.startDate)
  const deadlineUtc = parseDateUtc(project.deadlineDate)
  const todayUtc = parseDateUtc(todayStr)
  const msPerDay = 24 * 60 * 60 * 1000

  // Total duration of the project (e.g. 28 days)
  const daysTotal = Math.max(1, Math.round((deadlineUtc - startUtc) / msPerDay))

  // For an ongoing active project, data is bounded by today (we cannot analyze future days)
  const effectiveEndDate = project.completedAt
    ? project.completedAt.split("T")[0]
    : (todayStr < project.deadlineDate ? todayStr : project.deadlineDate)

  // Days elapsed up to today (Day 1 counts as 1 day elapsed)
  const elapsedDiff = Math.round((Math.min(todayUtc, deadlineUtc) - startUtc) / msPerDay)
  const daysElapsed = Math.min(daysTotal, Math.max(1, elapsedDiff + 1))
  const daysRemaining = Math.max(0, Math.round((deadlineUtc - todayUtc) / msPerDay))
  const isOverdue = todayUtc > deadlineUtc
  const progressTimePct = Math.min(100, Math.round((daysElapsed / daysTotal) * 100))

  // Filter healthLogs strictly within project timeframe up to effectiveEndDate (never into future)
  const isMale = project.person === "ฝ่ายชาย"
  const logsInRange = healthLogs.filter((log) => {
    const d = String(log.date || "").split("T")[0]
    return d >= project.startDate && d <= effectiveEndDate
  })

  // Start weight & Latest weight up to today
  const weights = logsInRange
    .map((l) => (isMale ? l.maleWeight : l.femaleWeight))
    .filter((w) => w !== null && w !== undefined && w !== "" && !isNaN(Number(w)))

  const startWeight = project.startWeight || (weights.length > 0 ? Number(weights[0]) : (isMale ? 100.0 : 65.0))
  const currentWeight = weights.length > 0 ? Number(weights[weights.length - 1]) : startWeight
  const weightLost = Math.max(0, Number((startWeight - currentWeight).toFixed(1)))
  const weightRemaining = Math.max(0, Number((project.targetFatLossKg - weightLost).toFixed(1)))
  const weightProgressPct = Math.min(100, Math.round((weightLost / project.targetFatLossKg) * 100))

  // Filter meals strictly in range up to effectiveEndDate (never into future)
  const personMealsInRange = meals.filter((m) => {
    const p = String(m.person || m.Person || "").trim()
    const matchPerson = p === project.person || p === "ทั้งคู่" || project.person === "ทั้งคู่"
    const d = String(m.date || m.Date || "").split("T")[0]
    return matchPerson && d >= project.startDate && d <= effectiveEndDate
  })

  // Daily intakes
  const dayIntakeMap: Record<string, number> = {}
  personMealsInRange.forEach((m) => {
    const d = String(m.date || m.Date || "").split("T")[0]
    if (d) {
      dayIntakeMap[d] = (dayIntakeMap[d] || 0) + Number(m.calories || m.Calories || 0)
    }
  })

  let daysCompliant = 0
  let daysOverIntake = 0
  let totalIntakeCalories = 0
  let accumulatedMealsDeficit = 0

  const loggedDays = Object.keys(dayIntakeMap)
  loggedDays.forEach((d) => {
    const cals = dayIntakeMap[d]
    totalIntakeCalories += cals
    if (cals <= targetIntakeCalories) {
      daysCompliant++
    } else {
      daysOverIntake++
    }
    accumulatedMealsDeficit += Math.max(0, maintenanceCalories - cals)
  })

  const avgDailyIntake = loggedDays.length > 0 ? Math.round(totalIntakeCalories / loggedDays.length) : 0

  // Deficit achieved: combined from weight drop and meals
  const weightBasedDeficit = weightLost * 7500
  const deficitAchieved = Math.max(weightBasedDeficit, accumulatedMealsDeficit)
  const totalDeficitTarget = project.targetDeficitKcal || project.targetFatLossKg * 7500
  const deficitProgressPct = Math.min(100, Math.round((deficitAchieved / totalDeficitTarget) * 100))

  // Activities from healthLogs up to today
  const activities = logsInRange
    .map((l) => String(l.activity || "").trim())
    .filter((a) => a.length > 0 && a !== "-")
  const activitiesCount = activities.length

  // Evaluation & Next Project Advice
  let evaluationSummary = ""
  let nextProjectAdvice = ""

  if (weightProgressPct >= 85 || deficitProgressPct >= 85) {
    evaluationSummary = `ยอดเยี่ยมมาก! บรรลุเป้าหมายโปรเจกต์ได้ถึง ${Math.max(weightProgressPct, deficitProgressPct)}% น้ำหนักลดลง ${weightLost} กก. (ตัดทอนได้ ${deficitAchieved.toLocaleString()} kcal) ควบคุมแคลอรี่ได้ดี ${daysCompliant} วัน`
    nextProjectAdvice = `คำแนะนำสำหรับโปรเจกต์ถัดไป: ผลลัพธ์ดีเยี่ยมมาก สามารถตั้งเป้าหมายในเฟสต่อไปอีก ${Math.min(project.targetFatLossKg, 5)} กก. หรือปรับเข้าสู่ระยะคงที่ (Maintenance / Reverse Dieting) เพื่อรักษาระบบเผาผลาญ`
  } else if (weightProgressPct >= 50 || deficitProgressPct >= 50) {
    evaluationSummary = `ทำได้ดีในระดับปานกลาง สำเร็จ ${Math.max(weightProgressPct, deficitProgressPct)}% (ลดได้ ${weightLost} กก.) มีวันที่กินเกินเป้าหมาย ${daysOverIntake} วัน จากวันที่บันทึกทั้งหมด ${loggedDays.length} วัน`
    nextProjectAdvice = `คำแนะนำสำหรับโปรเจกต์ถัดไป: ควรปรับแผนโควต้าแคลอรี่ให้ยืดหยุ่นขึ้น (Flexible Dieting) เพิ่มวันออกกำลังกาย หรือลดเป้าหมายระยะสั้นลงเป็น 3-5 กก. ต่อโปรเจกต์เพื่อไม่ให้เครียดเกินไป`
  } else {
    evaluationSummary = `โปรเจกต์นี้สำเร็จไปแล้ว ${Math.max(weightProgressPct, deficitProgressPct)}% (ลดได้ ${weightLost} กก. จากเป้า ${project.targetFatLossKg} กก.) พบว่ามีวันที่หลุดโควต้าอาหารหรือขาดการบันทึกต่อเนื่อง`
    nextProjectAdvice = `คำแนะนำสำหรับโปรเจกต์ถัดไป: แนะนำให้ตั้งเป้าหมายตัดทอนแบบเบาสบายก่อน (-200 ถึง -300 kcal/วัน) และเน้นวินัยการจดบันทึกให้ครบทุกมื้อเพื่อสร้างความเคยชิน`
  }

  return {
    daysTotal,
    daysElapsed,
    daysRemaining,
    isOverdue,
    progressTimePct,
    startWeight,
    currentWeight,
    weightLost,
    weightRemaining,
    weightProgressPct,
    totalDeficitTarget,
    deficitAchieved,
    deficitProgressPct,
    mealsCount: personMealsInRange.length,
    daysCompliant,
    daysOverIntake,
    avgDailyIntake,
    activitiesCount,
    activitySamples: activities.slice(0, 5),
    evaluationSummary,
    nextProjectAdvice,
  }
}
