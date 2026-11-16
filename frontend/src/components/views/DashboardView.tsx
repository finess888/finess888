import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Flame,
  Beef,
  Wheat,
  Droplet,
  Plus,
  CheckCircle2,
  Calendar,
  TrendingUp,
  UtensilsCrossed,
  ArrowRight,
  Scale,
  Target,
  Sparkles,
  Zap,
  Sliders,
} from "lucide-react"
import {
  AllCalorieSettings,
  getCalorieSettings,
  getIntakeTarget,
} from "@/lib/calorieSettings"
import { CalorieSettingsModal } from "@/components/modals/CalorieSettingsModal"
import { Doughnut, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface DashboardViewProps {
  meals: any[]
  foods: any[]
  healthLogs: any[]
  selectedPerson: string
  onSelectPerson: (person: string) => void
  onOpenAddMeal: () => void
  onOpenAddWeight: () => void
  onToggleMealStatus: (id: string, currentStatus: string) => void
  onNavigateToMealPlan: () => void
}

export function DashboardView({
  meals,
  foods,
  healthLogs,
  selectedPerson,
  onSelectPerson,
  onOpenAddMeal,
  onOpenAddWeight,
  onToggleMealStatus,
  onNavigateToMealPlan,
}: DashboardViewProps) {
  const isMale = selectedPerson === "ฝ่ายชาย"

  // Calorie & TDEE Settings from localStorage / Defaults
  const [calorieSettings, setCalorieSettings] = React.useState<AllCalorieSettings>(getCalorieSettings)
  const [calorieModalOpen, setCalorieModalOpen] = React.useState(false)

  React.useEffect(() => {
    setCalorieSettings(getCalorieSettings())
  }, [selectedPerson])

  const currentPersonSettings = isMale ? calorieSettings.male : calorieSettings.female
  const MAINTENANCE_CALORIES = currentPersonSettings.maintenance || (isMale ? 2000 : 1700)
  const DEFICIT_TARGET = currentPersonSettings.deficit || 300
  const TARGET_CALORIES = getIntakeTarget(currentPersonSettings) // Maintenance - Deficit, e.g. 2000 - 300 = 1700
  const TARGET_PROTEIN = currentPersonSettings.protein || (isMale ? 160 : 104)
  const TARGET_CARBS = currentPersonSettings.carbs || (isMale ? 210 : 130)
  const TARGET_FAT = currentPersonSettings.fat || (isMale ? 60 : 40)
  const START_WEIGHT = isMale ? 100.0 : 65.0
  const ULTIMATE_TARGET_WEIGHT = isMale ? 70.0 : 50.0

  // 1. Interactive Fat Loss Goal (User can customize, default 10 kg)
  const storageKey = isMale ? "finess_fatloss_target_male" : "finess_fatloss_target_female"
  const [targetFatLossKg, setTargetFatLossKg] = React.useState<number>(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? Number(saved) : (isMale ? 10 : 5)
  })

  React.useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    setTargetFatLossKg(saved ? Number(saved) : (isMale ? 10 : 5))
  }, [isMale, storageKey])

  const handleUpdateTargetKg = (kg: number) => {
    const valid = Math.max(1, Math.min(50, kg))
    setTargetFatLossKg(valid)
    localStorage.setItem(storageKey, String(valid))
  }

  // 1 kg of fat = 7,500 kcal deficit
  const totalDeficitTargetKcal = targetFatLossKg * 7500

  // Find latest weight logged from healthLogs
  const logsWithWeight = healthLogs.filter((log) => {
    const w = isMale ? log.maleWeight : log.femaleWeight
    return w !== null && w !== undefined && w !== "" && !isNaN(Number(w))
  })
  const latestLog = logsWithWeight.length > 0 ? logsWithWeight[logsWithWeight.length - 1] : null
  const currentWeight = latestLog
    ? Number(isMale ? latestLog.maleWeight : latestLog.femaleWeight)
    : START_WEIGHT

  // Actual weight lost
  const weightLostSoFar = Math.max(0, START_WEIGHT - currentWeight)

  // Calorie deficit calculation:
  // 1) From weight dropped: weightLostSoFar * 7,500 kcal
  // 2) Plus daily intake deficit from meals logged
  const personMeals = meals.filter((m) => {
    const p = String(m.person || m.Person || "").trim()
    return p === selectedPerson || p === "ทั้งคู่"
  })

  // Group meals by date to calculate daily intake deficits
  const dateIntakeMap: Record<string, number> = {}
  personMeals.forEach((m) => {
    const d = String(m.date || m.Date || "").split("T")[0]
    if (d) {
      dateIntakeMap[d] = (dateIntakeMap[d] || 0) + Number(m.calories || m.Calories || 0)
    }
  })

  let accumulatedIntakeDeficit = 0
  Object.values(dateIntakeMap).forEach((dailyIntake) => {
    const deficit = Math.max(0, MAINTENANCE_CALORIES - dailyIntake)
    accumulatedIntakeDeficit += deficit
  })

  // Combined accumulated deficit
  const accumulatedDeficitKcal = Math.max(
    weightLostSoFar * 7500,
    accumulatedIntakeDeficit
  )

  const progressPercent = Math.min(100, (accumulatedDeficitKcal / totalDeficitTargetKcal) * 100)
  const remainingKcal = Math.max(0, totalDeficitTargetKcal - accumulatedDeficitKcal)
  const remainingFatKg = (remainingKcal / 7500).toFixed(1)

  // Date selection (default today or latest logged date)
  const todayStr = new Date().toISOString().split("T")[0]
  const hasTodayMeals = personMeals.some((m) => String(m.date || m.Date || "").split("T")[0] === todayStr)
  const latestDate = personMeals.length > 0 ? personMeals[personMeals.length - 1].date : todayStr
  const activeDate = hasTodayMeals ? todayStr : latestDate

  const activeDateMeals = personMeals.filter((m) => {
    const d = String(m.date || m.Date || "").split("T")[0]
    return d === activeDate
  })

  // Calculate totals for active date
  const totalCalories = activeDateMeals.reduce((sum, m) => sum + Number(m.calories || m.Calories || 0), 0)
  const totalProtein = activeDateMeals.reduce((sum, m) => sum + Number(m.protein || m.Protein || 0), 0)
  const totalCarbs = activeDateMeals.reduce((sum, m) => sum + Number(m.carbs || m.Carbs || 0), 0)
  const totalFat = activeDateMeals.reduce((sum, m) => sum + Number(m.fat || m.Fat || 0), 0)
  const calorieDiff = TARGET_CALORIES - totalCalories

  // Doughnut Chart Data (Macro Breakdown)
  const macroChartData = {
    labels: ["โปรตีน (g)", "คาร์โบไฮเดรต (g)", "ไขมัน (g)"],
    datasets: [
      {
        data: [
          totalProtein > 0 ? totalProtein : 1,
          totalCarbs > 0 ? totalCarbs : 1,
          totalFat > 0 ? totalFat : 1,
        ],
        backgroundColor: [
          "rgba(16, 185, 129, 0.85)", // Emerald
          "rgba(245, 158, 11, 0.85)", // Amber
          "rgba(244, 63, 94, 0.85)",  // Rose
        ],
        borderColor: ["#10b981", "#f59e0b", "#f43f5e"],
        borderWidth: 2,
      },
    ],
  }

  // Weekly Intake Bar Chart
  const last7Days: string[] = []
  const last7DaysLabels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split("T")[0]
    last7Days.push(iso)
    const dayNames = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."]
    last7DaysLabels.push(`${dayNames[d.getDay()]} (${d.getDate()})`)
  }

  const weeklyCalories = last7Days.map((isoDate) => {
    return personMeals
      .filter((m) => String(m.date || m.Date || "").split("T")[0] === isoDate)
      .reduce((sum, m) => sum + Number(m.calories || m.Calories || 0), 0)
  })

  const weeklyBarData = {
    labels: last7DaysLabels,
    datasets: [
      {
        label: "แคลอรี่ (kcal)",
        data: weeklyCalories,
        backgroundColor: isMale ? "rgba(16, 185, 129, 0.6)" : "rgba(236, 72, 153, 0.6)",
        borderColor: isMale ? "#10b981" : "#ec4899",
        borderRadius: 6,
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#151d2f] to-[#151d2f] border border-[#26334d] rounded-2xl p-6 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{isMale ? "🏋️‍♂️" : "🧘‍♀️"}</span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              โภชนาการและแผนสุขภาพ: <span className={isMale ? "text-emerald-400" : "text-pink-400"}>{selectedPerson}</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-1">
            <span>🔥 เผาผลาญ: <strong className="text-white font-mono">{MAINTENANCE_CALORIES.toLocaleString()}</strong> kcal</span>
            <span>•</span>
            <span>🎯 ตัดทอน: <strong className="text-amber-300 font-mono">-{DEFICIT_TARGET.toLocaleString()}</strong> kcal</span>
            <span>•</span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md font-semibold border border-emerald-500/30">
              🍽️ ควรกินไม่เกิน: <span className="font-mono">{TARGET_CALORIES.toLocaleString()}</span> kcal/วัน
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Calorie Settings Button */}
          <Button
            onClick={() => setCalorieModalOpen(true)}
            variant="outline"
            className="border-amber-500/40 text-amber-300 hover:text-white hover:bg-amber-500/20 text-xs font-medium flex items-center gap-1.5 h-9 px-3 shadow-md"
            title="ตั้งค่าแคลอรี่เผาผลาญต่อวัน (TDEE) และเป้าหมายตัดทอนแคลอรี่"
          >
            <Flame className="h-4 w-4 text-amber-400" />
            ตั้งเป้าแคลอรี่ (TDEE)
          </Button>

          {/* Toggle Couple View */}
          <div className="flex items-center gap-1.5 bg-[#0b0f19] p-1 rounded-xl border border-[#26334d]">
            <button
              onClick={() => onSelectPerson("ฝ่ายชาย")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedPerson === "ฝ่ายชาย"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🏋️‍♂️</span> ฝ่ายชาย
            </button>
            <button
              onClick={() => onSelectPerson("ฝ่ายหญิง")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedPerson === "ฝ่ายหญิง"
                  ? "bg-pink-600 text-white shadow-md shadow-pink-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🧘‍♀️</span> ฝ่ายหญิง
            </button>
          </div>

          {/* Action Buttons: Add Weight & Add Meal */}
          <Button
            onClick={onOpenAddWeight}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 h-9 px-3 shadow-md shadow-indigo-950"
          >
            <Scale className="h-4 w-4" />
            + บันทึกน้ำหนัก
          </Button>

          <Button
            onClick={onOpenAddMeal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 h-9 px-3 shadow-md shadow-emerald-950"
          >
            <Plus className="h-4 w-4" />
            + เพิ่มมื้ออาหาร
          </Button>
        </div>
      </div>

      {/* 🎯 FEATURE 1: CUMULATIVE FAT LOSS & CALORIE DEFICIT GOAL WIDGET */}
      <Card className="bg-gradient-to-br from-[#121a2d] to-[#151d2f] border border-emerald-500/30 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-[#26334d] pb-3 bg-[#0d1424]/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-400" />
                เป้าหมายการตัดทอนแคลอรี่และลดไขมันรวม (Total Calorie Deficit & Fat Loss)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                กฎทางโภชนาการ: เพื่อลดไขมัน 1 กิโลกรัม ต้องตัดทอนแคลอรี่ออกประมาณ 7,500 kcal
              </CardDescription>
            </div>

            {/* Quick target selector pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 mr-1">เลือกเป้าหมาย:</span>
              {[5, 10, 15, 20, 30].map((kg) => (
                <button
                  key={kg}
                  onClick={() => handleUpdateTargetKg(kg)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    targetFatLossKg === kg
                      ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950"
                      : "bg-[#0b0f19] text-slate-400 border border-[#26334d] hover:text-white"
                  }`}
                >
                  {kg} กก.
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* Main Target Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#26334d]">
              <span className="text-xs text-slate-400 block mb-1">🎯 เป้าหมายลดไขมัน</span>
              <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                <span>{targetFatLossKg}</span>
                <span className="text-sm font-normal text-slate-400">กิโลกรัม (kg)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">กำหนดเองได้ตามแผนระยะยาว</p>
            </div>

            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#26334d]">
              <span className="text-xs text-slate-400 block mb-1">🔥 ต้องตัดทอนแคลอรี่รวม</span>
              <div className="text-2xl font-bold text-amber-400 flex items-baseline gap-1">
                <span>{totalDeficitTargetKcal.toLocaleString()}</span>
                <span className="text-sm font-normal text-slate-400">kcal</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">คำนวณจาก {targetFatLossKg} × 7,500 kcal</p>
            </div>

            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#26334d]">
              <span className="text-xs text-slate-400 block mb-1">⚡ ตัดทอนสะสมไปแล้ว</span>
              <div className="text-2xl font-bold text-emerald-400 flex items-baseline gap-1">
                <span>{Math.round(accumulatedDeficitKcal).toLocaleString()}</span>
                <span className="text-sm font-normal text-slate-400">kcal</span>
              </div>
              <p className="text-[11px] text-emerald-500/80 mt-1">
                ลดได้แล้ว ~{(accumulatedDeficitKcal / 7500).toFixed(2)} kg
              </p>
            </div>

            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#26334d]">
              <span className="text-xs text-slate-400 block mb-1">⏳ ยังต้องตัดทอนอีก</span>
              <div className="text-2xl font-bold text-rose-400 flex items-baseline gap-1">
                <span>{Math.round(remainingKcal).toLocaleString()}</span>
                <span className="text-sm font-normal text-slate-400">kcal</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">เหลืออีกประมาณ {remainingFatKg} กิโลกรัม</p>
            </div>
          </div>

          {/* Visual Progress Bar & % */}
          <div className="space-y-2 bg-[#0b0f19]/80 p-4 rounded-xl border border-[#26334d]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">ความคืบหน้ารวมต่อเป้าหมาย</span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px]">
                  ทำไปแล้ว {progressPercent.toFixed(1)}%
                </Badge>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {Math.round(accumulatedDeficitKcal).toLocaleString()} / {totalDeficitTargetKcal.toLocaleString()} kcal
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-700 shadow-lg shadow-emerald-500/50"
                style={{ width: `${Math.max(2, Math.min(100, progressPercent))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>จุดเริ่มต้น: 0 kcal (0%)</span>
              <span>เป้าหมายความสำเร็จ: {totalDeficitTargetKcal.toLocaleString()} kcal (100%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Calories Card */}
        <Card className="bg-[#151d2f] border-[#26334d] hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle className="text-xs font-semibold text-white flex items-center gap-1">
                แคลอรี่วันนี้ (โควต้ากิน)
              </CardTitle>
              <span className="text-[10px] text-slate-400">
                เผาผลาญ {MAINTENANCE_CALORIES.toLocaleString()} - ตัดทอน {DEFICIT_TARGET.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => setCalorieModalOpen(true)}
              className={`p-2 rounded-xl transition-all hover:scale-105 cursor-pointer ${
                isMale ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-pink-500/10 text-pink-400 hover:bg-pink-500/20"
              }`}
              title="คลิกเพื่อตั้งค่าแคลอรี่เผาผลาญ (TDEE) และเป้าหมายตัดทอน"
            >
              <Flame className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {totalCalories} <span className="text-xs font-normal text-slate-400">/ ไม่เกิน {TARGET_CALORIES.toLocaleString()} kcal</span>
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  totalCalories > TARGET_CALORIES
                    ? "bg-amber-500"
                    : isMale
                    ? "bg-emerald-500"
                    : "bg-pink-500"
                }`}
                style={{ width: `${Math.min(100, (totalCalories / TARGET_CALORIES) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>{Math.round((totalCalories / TARGET_CALORIES) * 100)}% ของโควต้า</span>
              <span className={calorieDiff >= 0 ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                {calorieDiff >= 0 ? `กินได้อีก ${calorieDiff} kcal` : `เกินโควต้า ${Math.abs(calorieDiff)} kcal`}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#26334d]/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">ตัดทอนวันนี้:</span>
              <span className={`font-mono font-semibold ${
                MAINTENANCE_CALORIES - totalCalories >= DEFICIT_TARGET
                  ? "text-emerald-400"
                  : MAINTENANCE_CALORIES - totalCalories > 0
                  ? "text-amber-300"
                  : "text-rose-400"
              }`}>
                {MAINTENANCE_CALORIES - totalCalories >= 0
                  ? `-${(MAINTENANCE_CALORIES - totalCalories).toLocaleString()} kcal (ตัดทอนสำเร็จ)`
                  : `+${(totalCalories - MAINTENANCE_CALORIES).toLocaleString()} kcal (Caloric Surplus)`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Protein Card */}
        <Card className="bg-[#151d2f] border-[#26334d] hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400">โปรตีน (Protein)</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Beef className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalProtein.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ {TARGET_PROTEIN} g</span></div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalProtein / TARGET_PROTEIN) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {Math.round((totalProtein / TARGET_PROTEIN) * 100)}% เสริมสร้างกล้ามเนื้อ
            </p>
          </CardContent>
        </Card>

        {/* Carbs Card */}
        <Card className="bg-[#151d2f] border-[#26334d] hover:border-amber-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400">คาร์โบไฮเดรต (Carbs)</CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Wheat className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalCarbs.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ {TARGET_CARBS} g</span></div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-400 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalCarbs / TARGET_CARBS) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {Math.round((totalCarbs / TARGET_CARBS) * 100)}% พลังงานหลัก
            </p>
          </CardContent>
        </Card>

        {/* Fat Card */}
        <Card className="bg-[#151d2f] border-[#26334d] hover:border-rose-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400">ไขมันดี (Good Fat)</CardTitle>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Droplet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalFat.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ {TARGET_FAT} g</span></div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-rose-400 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalFat / TARGET_FAT) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {Math.round((totalFat / TARGET_FAT) * 100)}% ฮอร์โมนและเซลล์
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Macro Doughnut */}
        <Card className="bg-[#151d2f] border-[#26334d]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">สัดส่วนสารอาหารวันนี้ (Macros)</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              สัดส่วนโปรตีน / คาร์บ / ไขมัน ของ {selectedPerson}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <div className="w-44 h-44 relative">
              <Doughnut
                data={macroChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="flex items-center justify-center gap-3 mt-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> P: {totalProtein}g
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> C: {totalCarbs}g
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> F: {totalFat}g
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend Bar Chart */}
        <Card className="lg:col-span-2 bg-[#151d2f] border-[#26334d]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-white">แคลอรี่ 7 วันล่าสุด ({selectedPerson})</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                แนวโน้มการรับประทานอาหารเปรียบเทียบเป้าหมาย {TARGET_CALORIES} kcal
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                นน. ล่าสุด: {currentWeight} kg (เป้า {ULTIMATE_TARGET_WEIGHT} kg)
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenAddWeight}
                className="text-[11px] h-7 px-2 text-indigo-300 hover:text-white hover:bg-indigo-600/20 border border-indigo-500/30"
              >
                <Scale className="h-3 w-3 mr-1" />
                ชั่งน้ำหนัก
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <Bar
              data={weeklyBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#94a3b8" },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8" },
                  },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Active Date Meals Timeline */}
      <Card className="bg-[#151d2f] border-[#26334d]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-emerald-400" />
              มื้ออาหารประจำวันที่ {activeDate} ({selectedPerson} - {activeDateMeals.length} รายการ)
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              ข้อมูลที่บันทึกไว้ใน Google Sheets (B หน้าจดบันทึก)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onOpenAddMeal}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              + บันทึกมื้อ
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateToMealPlan}
              className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1"
            >
              ดูแผนทั้งหมด <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {activeDateMeals.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[#26334d] rounded-xl">
              <p className="text-slate-400 text-sm">ยังไม่มีมื้ออาหารที่บันทึกไว้สำหรับ {selectedPerson} ในวันที่ {activeDate}</p>
              <Button
                onClick={onOpenAddMeal}
                variant="outline"
                className="mt-3 text-xs border-[#26334d] text-emerald-400 hover:bg-emerald-500/10"
              >
                + บันทึกมื้ออาหารของวันนี้
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-[#26334d]">
              {activeDateMeals.map((meal) => {
                const id = meal.id || meal.ID
                return (
                  <div
                    key={id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {meal.foodName || meal.FoodName}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-slate-800 text-slate-300 border-slate-700"
                          >
                            {meal.mealType || meal.MealType}
                          </Badge>
                          {meal.servings && (
                            <span className="text-xs text-slate-400">({meal.servings} เสิร์ฟ)</span>
                          )}
                        </div>
                        {meal.notes && (
                          <p className="text-xs text-slate-400 mt-0.5">{meal.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-semibold text-emerald-400">
                        {meal.calories} kcal
                      </span>
                      <div className="text-[10px] text-slate-400 space-x-1">
                        <span>P: {meal.protein}g</span>
                        <span>•</span>
                        <span>C: {meal.carbs}g</span>
                        <span>•</span>
                        <span>F: {meal.fat}g</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calorie & TDEE Settings Modal */}
      <CalorieSettingsModal
        open={calorieModalOpen}
        onOpenChange={setCalorieModalOpen}
        currentPerson={selectedPerson}
        onSaved={setCalorieSettings}
      />
    </div>
  )
}
