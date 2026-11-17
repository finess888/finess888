import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Footprints,
  Scale,
  Utensils,
  Plus,
  Trophy,
  Sparkles,
  Info,
  Clock,
  TrendingUp,
  Percent,
  Calendar,
  Beef,
  Wheat,
  Droplet,
} from "lucide-react"
import { formatThaiDate, THAI_MONTHS, THAI_DAYS } from "@/lib/utils"
import { getCalorieSettings, getIntakeTarget } from "@/lib/calorieSettings"
import { getDailyStepLogs, DailyStepLog } from "@/lib/exerciseDatabase"

interface CalendarViewProps {
  meals: any[]
  foods: any[]
  healthLogs: any[]
  selectedPerson?: string
  onSelectPerson?: (person: string) => void
  onOpenAddMeal?: (date?: string) => void
  onOpenAddStep?: (date?: string) => void
  onOpenAddWeight?: (date?: string) => void
}

type CriteriaType = "calories" | "steps" | "protein" | "all"

interface DayData {
  dateStr: string
  dayNum: number
  isToday: boolean
  isFuture: boolean
  dayOfWeek: number
  dayMeals: any[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  stepCount: number
  weight: number | null
  targetCalories: number
  targetSteps: number
  targetProtein: number
  calorieDiff: number // target - actual
  status: "good" | "bad" | "unrecorded" | "future"
  statusLabel: string
  statusReason: string
}

export function CalendarView({
  meals,
  foods,
  healthLogs,
  selectedPerson = "ฝ่ายชาย",
  onSelectPerson,
  onOpenAddMeal,
  onOpenAddStep,
  onOpenAddWeight,
}: CalendarViewProps) {
  const today = new Date()
  const todayStr = today.toLocaleDateString("en-CA") // YYYY-MM-DD in local time

  // Month & Year state (defaults to current month and year)
  const [selectedYear, setSelectedYear] = React.useState<number>(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = React.useState<number>(today.getMonth()) // 0 - 11

  // Person filter
  const [personFilter, setPersonFilter] = React.useState<string>(selectedPerson)

  // Evaluation criteria
  const [criteria, setCriteria] = React.useState<CriteriaType>("calories")

  // Selected day for modal details
  const [selectedDay, setSelectedDay] = React.useState<DayData | null>(null)
  const [dayModalOpen, setDayModalOpen] = React.useState(false)

  // Calorie & Target settings
  const calorieSettings = getCalorieSettings()
  const maleSettings = calorieSettings.male
  const femaleSettings = calorieSettings.female

  const maleTargetIntake = getIntakeTarget(maleSettings) // e.g. 2000 - 300 = 1700
  const femaleTargetIntake = getIntakeTarget(femaleSettings) // e.g. 1700 - 300 = 1400

  const isFemale = personFilter === "ฝ่ายหญิง"
  const isMale = personFilter === "ฝ่ายชาย"
  const isAll = personFilter === "ALL"

  // Base Targets based on person filter
  const targetCalories = isAll
    ? maleTargetIntake + femaleTargetIntake
    : isFemale
    ? femaleTargetIntake
    : maleTargetIntake

  const targetSteps = isAll
    ? (maleSettings.stepGoal || 8000) + (femaleSettings.stepGoal || 8000)
    : isFemale
    ? femaleSettings.stepGoal || 8000
    : maleSettings.stepGoal || 8000

  const targetProtein = isAll
    ? (maleSettings.protein || 120) + (femaleSettings.protein || 104)
    : isFemale
    ? femaleSettings.protein || 104
    : maleSettings.protein || 120

  // Keep person filter in sync
  React.useEffect(() => {
    if (selectedPerson) {
      setPersonFilter(selectedPerson)
    }
  }, [selectedPerson])

  const handlePersonSwitch = (p: string) => {
    setPersonFilter(p)
    if (onSelectPerson && (p === "ฝ่ายชาย" || p === "ฝ่ายหญิง")) {
      onSelectPerson(p)
    }
  }

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  const handleJumpToToday = () => {
    setSelectedYear(today.getFullYear())
    setSelectedMonth(today.getMonth())
  }

  // Generate days in the selected month
  const monthDays: DayData[] = React.useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const allStepLogs = getDailyStepLogs()

    const result: DayData[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`

      const dayDate = new Date(selectedYear, selectedMonth, day)
      const dayOfWeek = dayDate.getDay()
      const isToday = dateStr === todayStr
      const isFuture = dateStr > todayStr

      // Meals on this date
      const dayMeals = meals.filter((m) => {
        const mDate = String(m.date || m.Date || "").split("T")[0]
        const mPerson = String(m.person || m.Person || "").trim()
        const matchesDate = mDate === dateStr
        const matchesPerson = isAll || mPerson === personFilter || mPerson === "ทั้งคู่"
        return matchesDate && matchesPerson
      })

      // Health log on this date
      const dayHealth = healthLogs.find((h) => {
        const hDate = String(h.date || h.Date || "").split("T")[0]
        return hDate === dateStr
      })

      // Step log on this date
      const daySteps = allStepLogs.filter((s) => {
        const matchesDate = s.date === dateStr
        const matchesPerson = isAll || s.person === personFilter
        return matchesDate && matchesPerson
      })

      const totalCalories = dayMeals.reduce(
        (sum, m) => sum + (Number(m.calories || m.Calories) || 0),
        0
      )
      const totalProtein = dayMeals.reduce(
        (sum, m) => sum + (Number(m.protein || m.Protein) || 0),
        0
      )
      const totalCarbs = dayMeals.reduce(
        (sum, m) => sum + (Number(m.carbs || m.Carbs) || 0),
        0
      )
      const totalFat = dayMeals.reduce((sum, m) => sum + (Number(m.fat || m.Fat) || 0), 0)

      const stepCount = daySteps.reduce((sum, s) => sum + (Number(s.steps) || 0), 0)

      const weight = isAll
        ? (dayHealth?.maleWeight || 0) + (dayHealth?.femaleWeight || 0) || null
        : isFemale
        ? dayHealth?.femaleWeight || null
        : dayHealth?.maleWeight || null

      const calorieDiff = targetCalories - totalCalories
      const hasMealData = dayMeals.length > 0
      const hasStepData = stepCount > 0

      // Evaluate Good vs Bad based on selected criteria
      let status: "good" | "bad" | "unrecorded" | "future" = "unrecorded"
      let statusLabel = ""
      let statusReason = ""

      if (isFuture) {
        status = "future"
        statusLabel = "รอสรุป"
        statusReason = "ยังไม่ถึงวัน"
      } else if (!hasMealData && !hasStepData) {
        status = "unrecorded"
        statusLabel = "ยังไม่บันทึก"
        statusReason = "ไม่มีข้อมูลมื้ออาหารหรือกิจกรรมในวันนี้นี้"
      } else {
        // Active evaluations
        if (criteria === "calories") {
          if (!hasMealData) {
            status = "unrecorded"
            statusLabel = "ยังไม่บันทึกอาหาร"
            statusReason = "ยังไม่มีบันทึกมื้ออาหาร"
          } else if (totalCalories <= targetCalories) {
            status = "good"
            statusLabel = "คุมดี ✅"
            statusReason = `อยู่ในโควต้า (เหลือ ${calorieDiff.toLocaleString()} kcal)`
          } else {
            status = "bad"
            statusLabel = "เกินเป้า ⚠️"
            statusReason = `กินเกินโควต้า +${Math.abs(calorieDiff).toLocaleString()} kcal`
          }
        } else if (criteria === "steps") {
          if (!hasStepData) {
            status = "unrecorded"
            statusLabel = "ไม่มีบันทึกก้าว"
            statusReason = "ยังไม่ได้กรอกจำนวนก้าว"
          } else if (stepCount >= targetSteps) {
            status = "good"
            statusLabel = "ครบก้าว ✅"
            statusReason = `เดินได้ ${stepCount.toLocaleString()} / เป้า ${targetSteps.toLocaleString()} ก้าว`
          } else {
            status = "bad"
            statusLabel = "ขาดก้าว ⚠️"
            statusReason = `ขาดอีก ${(targetSteps - stepCount).toLocaleString()} ก้าว`
          }
        } else if (criteria === "protein") {
          if (!hasMealData) {
            status = "unrecorded"
            statusLabel = "ไม่มีบันทึกอาหาร"
            statusReason = "ยังไม่ได้บันทึกอาหาร"
          } else if (totalProtein >= targetProtein) {
            status = "good"
            statusLabel = "โปรตีนถึง ✅"
            statusReason = `ได้โปรตีน ${totalProtein.toFixed(1)}g / เป้า ${targetProtein}g`
          } else {
            status = "bad"
            statusLabel = "โปรตีนขาด ⚠️"
            statusReason = `ขาดโปรตีนอีก ${(targetProtein - totalProtein).toFixed(1)}g`
          }
        } else {
          // Criteria === "all" (Composite)
          if (!hasMealData) {
            status = "unrecorded"
            statusLabel = "ยังไม่บันทึก"
            statusReason = "ไม่มีบันทึกอาหาร"
          } else if (totalCalories <= targetCalories) {
            if (stepCount >= targetSteps || totalProtein >= targetProtein) {
              status = "good"
              statusLabel = "ดีเยี่ยม 🌟"
              statusReason = "คุมแคลอรี่ได้ดี และทำเป้ากิจกรรม/โปรตีนสำเร็จ"
            } else {
              status = "good"
              statusLabel = "คุมดี ✅"
              statusReason = "แคลอรี่อยู่ในโควต้า"
            }
          } else {
            status = "bad"
            statusLabel = "หลุดเป้า ⚠️"
            statusReason = `กินเกินไป +${Math.abs(calorieDiff).toLocaleString()} kcal`
          }
        }
      }

      result.push({
        dateStr,
        dayNum: day,
        isToday,
        isFuture,
        dayOfWeek,
        dayMeals,
        totalCalories,
        totalProtein: Number(totalProtein.toFixed(1)),
        totalCarbs: Number(totalCarbs.toFixed(1)),
        totalFat: Number(totalFat.toFixed(1)),
        stepCount,
        weight,
        targetCalories,
        targetSteps,
        targetProtein,
        calorieDiff,
        status,
        statusLabel,
        statusReason,
      })
    }

    return result
  }, [
    selectedYear,
    selectedMonth,
    todayStr,
    meals,
    healthLogs,
    isAll,
    isFemale,
    personFilter,
    targetCalories,
    targetSteps,
    targetProtein,
    criteria,
  ])

  // Leading empty slots for proper calendar alignment (Sunday = 0, Monday = 1, etc.)
  const firstDayOffset = React.useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1).getDay()
  }, [selectedYear, selectedMonth])

  // Monthly summary stats
  const monthlyStats = React.useMemo(() => {
    let goodDays = 0
    let badDays = 0
    let unrecordedPastDays = 0
    let futureDays = 0
    let totalCalsExceeded = 0
    let longestStreak = 0
    let currentStreakCounter = 0

    monthDays.forEach((d) => {
      if (d.status === "good") {
        goodDays++
        currentStreakCounter++
        if (currentStreakCounter > longestStreak) {
          longestStreak = currentStreakCounter
        }
      } else if (d.status === "bad") {
        badDays++
        currentStreakCounter = 0
        if (d.calorieDiff < 0) {
          totalCalsExceeded += Math.abs(d.calorieDiff)
        }
      } else if (d.status === "future") {
        futureDays++
      } else {
        unrecordedPastDays++
        currentStreakCounter = 0
      }
    })

    const loggedDays = goodDays + badDays
    const adherenceRate = loggedDays > 0 ? Math.round((goodDays / loggedDays) * 100) : 0
    const avgExcessCal = badDays > 0 ? Math.round(totalCalsExceeded / badDays) : 0

    return {
      goodDays,
      badDays,
      unrecordedPastDays,
      futureDays,
      loggedDays,
      adherenceRate,
      longestStreak,
      avgExcessCal,
    }
  }, [monthDays])

  const openDayDetails = (day: DayData) => {
    setSelectedDay(day)
    setDayModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#151d2f] to-[#151d2f] border border-[#26334d] rounded-2xl p-6 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📅</span>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              ปฏิทินความสำเร็จรายเดือน{" "}
              <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ดี vs ร้าย
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            ดูภาพรวมรายเดือน ติ๊กถูกวันคุมดี ✅ สรุปวันที่หลุดเป้า ⚠️ เพื่อประเมินความสม่ำเสมอได้อย่างแม่นยำ
          </p>
        </div>

        {/* Person Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0b0f19] p-1 rounded-xl border border-[#26334d]">
          <button
            onClick={() => handlePersonSwitch("ฝ่ายชาย")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              personFilter === "ฝ่ายชาย"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🏋️‍♂️</span> ฝ่ายชาย
          </button>
          <button
            onClick={() => handlePersonSwitch("ฝ่ายหญิง")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              personFilter === "ฝ่ายหญิง"
                ? "bg-pink-600 text-white shadow-md shadow-pink-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🧘‍♀️</span> ฝ่ายหญิง
          </button>
          <button
            onClick={() => handlePersonSwitch("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              personFilter === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>👥</span> รวมคู่รัก
          </button>
        </div>
      </div>

      {/* 4 Scorecard Summary Cards (ตอบโจทย์: ดีกี่วัน ร้ายกี่วัน) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: วันคุมดี */}
        <Card className="bg-gradient-to-br from-[#0c1c1a] to-[#122325] border border-emerald-500/40 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs text-emerald-300 font-medium">วันคุมได้ดี (Good Days)</span>
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                {monthlyStats.goodDays}
              </span>
              <span className="text-xs text-slate-400 font-sans">วัน</span>
            </div>
            <p className="text-[11px] text-emerald-300/80 mt-1 flex items-center gap-1">
              <span>✅</span> ติ๊กถูกสำเร็จ {monthlyStats.adherenceRate}% ของวันที่จด
            </p>
          </CardContent>
        </Card>

        {/* Card 2: วันหลุดเป้า */}
        <Card className="bg-gradient-to-br from-[#201016] to-[#251520] border border-rose-500/40 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs text-rose-300 font-medium">วันหลุดเป้า (Bad Days)</span>
            <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
              <XCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-400 font-mono">
                {monthlyStats.badDays}
              </span>
              <span className="text-xs text-slate-400 font-sans">วัน</span>
            </div>
            <p className="text-[11px] text-rose-300/80 mt-1">
              {monthlyStats.badDays > 0
                ? `เกินเฉลี่ย +${monthlyStats.avgExcessCal.toLocaleString()} kcal/วันหลุด`
                : "ไม่มีวันหลุดเลย ยอดเยี่ยม! ✨"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: อัตราความสำเร็จ & วันที่เหลือ */}
        <Card className="bg-gradient-to-br from-[#12172a] to-[#161d33] border border-indigo-500/30 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs text-indigo-300 font-medium">ความสม่ำเสมอ (Adherence)</span>
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Percent className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-300 font-mono">
                {monthlyStats.adherenceRate}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              จดบันทึกแล้ว {monthlyStats.loggedDays} วัน (รอ {monthlyStats.futureDays} วัน)
            </p>
          </CardContent>
        </Card>

        {/* Card 4: สถิติคุมดีต่อเนื่อง */}
        <Card className="bg-gradient-to-br from-[#1c1811] to-[#251f15] border border-amber-500/40 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs text-amber-300 font-medium">คุมดีต่อเนื่องสูงสุด (Streak)</span>
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <Flame className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-400 font-mono">
                {monthlyStats.longestStreak}
              </span>
              <span className="text-xs text-slate-400 font-sans">วันติด 🔥</span>
            </div>
            <p className="text-[11px] text-amber-300/80 mt-1">
              {monthlyStats.longestStreak >= 7
                ? "วินัยระดับยอดเยี่ยม 🏆"
                : monthlyStats.longestStreak > 0
                ? "ทำได้ดี พยายามรักษาความต่อเนื่อง!"
                : "เริ่มต้นบันทึกเพื่อสร้างสถิติ!"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Month Navigator & Criteria Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#111726] border border-[#26334d] p-3 rounded-xl">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="border-[#26334d] bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 h-8 px-2.5"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="px-3 py-1 bg-[#0b0f19] border border-[#26334d] rounded-lg text-sm font-bold text-white font-mono flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span>
              {THAI_MONTHS[selectedMonth]} {selectedYear + 543}
            </span>
            <span className="text-xs text-slate-400 font-normal">
              ({new Date(selectedYear, selectedMonth, 1).toLocaleString("en-US", { month: "short" })}{" "}
              {selectedYear})
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="border-[#26334d] bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 h-8 px-2.5"
            title="เดือนถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleJumpToToday}
            className="text-xs text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-2"
          >
            วันนี้
          </Button>
        </div>

        {/* Criteria Selection: แคลอรี่ / ก้าวเดิน / โปรตีน / รวม */}
        <div className="flex items-center gap-1 bg-[#0b0f19] p-1 rounded-lg border border-[#26334d] text-xs">
          <span className="text-[11px] text-slate-400 px-2 font-medium hidden sm:inline">
            เกณฑ์ประเมินดี/ร้าย:
          </span>
          <button
            type="button"
            onClick={() => setCriteria("calories")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
              criteria === "calories"
                ? "bg-emerald-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Utensils className="h-3 w-3" />
            <span>คุมแคลอรี่ (เป้ากิน)</span>
          </button>
          <button
            type="button"
            onClick={() => setCriteria("steps")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
              criteria === "steps"
                ? "bg-indigo-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Footprints className="h-3 w-3" />
            <span>ก้าวเดิน</span>
          </button>
          <button
            type="button"
            onClick={() => setCriteria("protein")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
              criteria === "protein"
                ? "bg-amber-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Beef className="h-3 w-3" />
            <span>โปรตีน</span>
          </button>
          <button
            type="button"
            onClick={() => setCriteria("all")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
              criteria === "all"
                ? "bg-teal-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>ครบสูตร</span>
          </button>
        </div>
      </div>

      {/* Interactive Month Calendar Grid */}
      <Card className="bg-[#111726] border-[#26334d] shadow-xl overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-[#26334d] bg-[#0c1220] text-center text-xs font-semibold text-slate-400 py-2.5">
          <div className="text-rose-400">อาทิตย์ (Sun)</div>
          <div>จันทร์ (Mon)</div>
          <div>อังคาร (Tue)</div>
          <div>พุธ (Wed)</div>
          <div>พฤหัสบดี (Thu)</div>
          <div className="text-cyan-400">ศุกร์ (Fri)</div>
          <div className="text-amber-400">เสาร์ (Sat)</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-px bg-[#26334d]/40 p-px">
          {/* Leading empty cells for calendar alignment */}
          {Array.from({ length: firstDayOffset }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[100px] sm:min-h-[120px] bg-[#0d1424]/30 p-2 opacity-30 cursor-default"
            />
          ))}

          {/* Actual days in month */}
          {monthDays.map((day) => {
            const isGood = day.status === "good"
            const isBad = day.status === "bad"
            const isFuture = day.status === "future"
            const isUnrecorded = day.status === "unrecorded"

            return (
              <div
                key={day.dateStr}
                onClick={() => openDayDetails(day)}
                className={`min-h-[105px] sm:min-h-[125px] p-2 flex flex-col justify-between transition-all cursor-pointer relative group ${
                  day.isToday
                    ? "ring-2 ring-emerald-400 z-10 shadow-lg shadow-emerald-950/40"
                    : ""
                } ${
                  isGood
                    ? "bg-gradient-to-br from-[#0c1c1b] to-[#112423] hover:from-[#0e2423] hover:to-[#152e2c]"
                    : isBad
                    ? "bg-gradient-to-br from-[#201016] to-[#251520] hover:from-[#2a131c] hover:to-[#2e1724]"
                    : isFuture
                    ? "bg-[#0b0f19]/40 opacity-50 hover:opacity-80"
                    : "bg-[#0d1424]/60 hover:bg-[#121b2f]"
                }`}
              >
                {/* Day Header Row: Date number & Status badge */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-sm font-bold font-mono ${
                        day.isToday
                          ? "bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-md font-extrabold"
                          : day.dayOfWeek === 0
                          ? "text-rose-400"
                          : day.dayOfWeek === 6
                          ? "text-amber-400"
                          : "text-slate-200"
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    {day.isToday && (
                      <span className="text-[9px] text-emerald-400 font-semibold hidden sm:inline">
                        วันนี้
                      </span>
                    )}
                  </div>

                  {/* The visual "ติ๊กถูก" Checkmark vs Bad Badge */}
                  {isGood && (
                    <Badge className="bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-1.5 py-0 flex items-center gap-0.5 shadow-sm shadow-emerald-900 border-none">
                      <CheckCircle2 className="h-3 w-3 stroke-[3]" />
                      <span className="hidden sm:inline">ดี</span>
                    </Badge>
                  )}

                  {isBad && (
                    <Badge className="bg-rose-500 text-white font-extrabold text-[10px] px-1.5 py-0 flex items-center gap-0.5 shadow-sm shadow-rose-950 border-none">
                      <XCircle className="h-3 w-3 stroke-[2.5]" />
                      <span className="hidden sm:inline">หลุด</span>
                    </Badge>
                  )}

                  {isUnrecorded && (
                    <span className="text-[10px] text-slate-600 font-mono">--</span>
                  )}
                </div>

                {/* Mid: Core Metric Display (based on criteria) */}
                <div className="my-1 space-y-0.5">
                  {criteria === "calories" && (
                    <>
                      {day.totalCalories > 0 ? (
                        <div>
                          <div
                            className={`text-xs font-mono font-bold leading-tight ${
                              isGood ? "text-emerald-300" : "text-rose-400"
                            }`}
                          >
                            {day.totalCalories.toLocaleString()}
                            <span className="text-[10px] text-slate-400 font-normal">
                              {" "}
                              / {day.targetCalories.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[10px] leading-none">
                            {day.calorieDiff >= 0 ? (
                              <span className="text-emerald-400">
                                เหลือ {day.calorieDiff.toLocaleString()} kcal
                              </span>
                            ) : (
                              <span className="text-rose-400 font-semibold">
                                +{Math.abs(day.calorieDiff).toLocaleString()} kcal
                              </span>
                            )}
                          </div>
                        </div>
                      ) : !isFuture ? (
                        <span className="text-[10px] text-slate-500">ไม่ได้จดอาหาร</span>
                      ) : null}
                    </>
                  )}

                  {criteria === "steps" && (
                    <>
                      {day.stepCount > 0 ? (
                        <div>
                          <div
                            className={`text-xs font-mono font-bold ${
                              isGood ? "text-indigo-300" : "text-amber-400"
                            }`}
                          >
                            {day.stepCount.toLocaleString()}{" "}
                            <span className="text-[10px] text-slate-400 font-normal">ก้าว</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            เป้า {day.targetSteps.toLocaleString()}
                          </span>
                        </div>
                      ) : !isFuture ? (
                        <span className="text-[10px] text-slate-500">ไม่ได้จดก้าว</span>
                      ) : null}
                    </>
                  )}

                  {criteria === "protein" && (
                    <>
                      {day.totalProtein > 0 ? (
                        <div>
                          <div
                            className={`text-xs font-mono font-bold ${
                              isGood ? "text-amber-300" : "text-rose-400"
                            }`}
                          >
                            {day.totalProtein} g{" "}
                            <span className="text-[10px] text-slate-400 font-normal">
                              / {day.targetProtein}g
                            </span>
                          </div>
                        </div>
                      ) : !isFuture ? (
                        <span className="text-[10px] text-slate-500">ไม่ได้จดอาหาร</span>
                      ) : null}
                    </>
                  )}

                  {criteria === "all" && (
                    <div className="text-[10px] font-mono leading-tight space-y-0.5">
                      {day.totalCalories > 0 && (
                        <div className={day.calorieDiff >= 0 ? "text-emerald-300" : "text-rose-400"}>
                          🔥 {day.totalCalories} kcal
                        </div>
                      )}
                      {day.stepCount > 0 && (
                        <div className="text-indigo-300">👟 {day.stepCount.toLocaleString()}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Quick indicator icons for meals / steps / weight */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-[#26334d]/40">
                  {day.dayMeals.length > 0 && (
                    <span className="text-emerald-400 font-mono" title={`${day.dayMeals.length} มื้อ`}>
                      🍽️{day.dayMeals.length}
                    </span>
                  )}
                  {day.stepCount > 0 && (
                    <span className="text-indigo-400 font-mono" title={`${day.stepCount} ก้าว`}>
                      👟
                    </span>
                  )}
                  {day.weight && (
                    <span className="text-cyan-400 font-mono" title={`นน. ${day.weight} กก.`}>
                      ⚖️{day.weight}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Legend / Guidance Note */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#111726] border border-[#26334d] text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-300">คำอธิบายสัญลักษณ์:</span>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
            <span className="text-emerald-300 font-medium">วันคุมได้ดี (✅ ติ๊กถูก)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" />
            <span className="text-rose-300 font-medium">วันหลุดเป้า (❌ กินเกิน)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-slate-600 inline-block" />
            <span>ยังไม่บันทึก</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500">
          💡 คลิกที่ช่องวันที่เพื่อเปิดดูรายการอาหารและสรุปผลประจำวันแบบละเอียด
        </span>
      </div>

      {/* Day Detail Dialog */}
      {selectedDay && (
        <Dialog open={dayModalOpen} onOpenChange={setDayModalOpen}>
          <DialogContent className="max-w-lg bg-[#111726] border-[#26334d] text-white p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {personFilter === "ALL" ? "ภาพรวมคู่รัก" : personFilter}
                </span>
                <span className="text-xs text-emerald-400 font-mono">
                  {selectedDay.dateStr}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                <span>📅</span> {formatThaiDate(selectedDay.dateStr)}
              </DialogTitle>
            </DialogHeader>

            {/* Status Banner */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                selectedDay.status === "good"
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                  : selectedDay.status === "bad"
                  ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                  : "bg-slate-900 border-[#26334d] text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {selectedDay.status === "good" ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                ) : selectedDay.status === "bad" ? (
                  <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
                ) : (
                  <Info className="h-6 w-6 text-slate-400 shrink-0" />
                )}
                <div>
                  <strong className="text-sm block">
                    {selectedDay.status === "good"
                      ? "วันคุมได้ดี (Good Day) ✅"
                      : selectedDay.status === "bad"
                      ? "วันหลุดเป้าหมาย (Bad Day) ⚠️"
                      : selectedDay.isFuture
                      ? "วันข้างหน้า (ยังไม่ถึงวัน)"
                      : "ยังไม่มีการบันทึกข้อมูล"}
                  </strong>
                  <span className="text-xs opacity-90">{selectedDay.statusReason}</span>
                </div>
              </div>
            </div>

            {/* Nutrition & Activity Breakdown */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-slate-300 block">
                สรุปโภชนาการและกิจกรรมของวัน
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                {/* Calories */}
                <div className="p-2.5 rounded-xl bg-[#0b0f19] border border-[#26334d]">
                  <span className="text-[10px] text-slate-400 block font-sans">แคลอรี่ที่กิน</span>
                  <span
                    className={`text-base font-bold ${
                      selectedDay.calorieDiff >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {selectedDay.totalCalories.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-sans">
                    โควต้า {selectedDay.targetCalories.toLocaleString()}
                  </span>
                </div>

                {/* Protein */}
                <div className="p-2.5 rounded-xl bg-[#0b0f19] border border-[#26334d]">
                  <span className="text-[10px] text-slate-400 block font-sans">โปรตีน</span>
                  <span className="text-base font-bold text-emerald-300">
                    {selectedDay.totalProtein}g
                  </span>
                  <span className="text-[10px] text-slate-500 block font-sans">
                    เป้า {selectedDay.targetProtein}g
                  </span>
                </div>

                {/* Steps */}
                <div className="p-2.5 rounded-xl bg-[#0b0f19] border border-[#26334d]">
                  <span className="text-[10px] text-slate-400 block font-sans">ก้าวเดิน</span>
                  <span className="text-base font-bold text-indigo-300">
                    {selectedDay.stepCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-sans">
                    เป้า {selectedDay.targetSteps.toLocaleString()}
                  </span>
                </div>

                {/* Weight */}
                <div className="p-2.5 rounded-xl bg-[#0b0f19] border border-[#26334d]">
                  <span className="text-[10px] text-slate-400 block font-sans">น้ำหนักเช้า</span>
                  <span className="text-base font-bold text-cyan-300">
                    {selectedDay.weight ? `${selectedDay.weight} กก.` : "--"}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-sans">ชั่งเช้า</span>
                </div>
              </div>

              {/* Progress Bar for Calories */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>ความจุโควต้าแคลอรี่</span>
                  <span
                    className={
                      selectedDay.calorieDiff >= 0
                        ? "text-emerald-400 font-semibold"
                        : "text-rose-400 font-semibold"
                    }
                  >
                    {selectedDay.calorieDiff >= 0
                      ? `กินได้อีก ${selectedDay.calorieDiff.toLocaleString()} kcal`
                      : `กินเกิน ${Math.abs(selectedDay.calorieDiff).toLocaleString()} kcal`}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      selectedDay.totalCalories > selectedDay.targetCalories
                        ? "bg-rose-500"
                        : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        selectedDay.targetCalories > 0
                          ? (selectedDay.totalCalories / selectedDay.targetCalories) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* List of meals eaten on this day */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Utensils className="h-3.5 w-3.5 text-emerald-400" />
                  รายการอาหารที่บันทึกในวันนี้ ({selectedDay.dayMeals.length} รายการ)
                </span>
                {onOpenAddMeal && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDayModalOpen(false)
                      onOpenAddMeal(selectedDay.dateStr)
                    }}
                    className="h-7 text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-600 hover:text-white"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    + เพิ่มมื้ออาหารวันนี้
                  </Button>
                )}
              </div>

              {selectedDay.dayMeals.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#26334d] text-center text-xs text-slate-500">
                  ยังไม่มีบันทึกมื้ออาหารสำหรับวันนี้
                </div>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {selectedDay.dayMeals.map((meal: any, idx: number) => (
                    <div
                      key={meal.id || idx}
                      className="p-2.5 rounded-lg bg-[#0b0f19] border border-[#26334d] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{meal.foodName || meal.FoodName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({meal.servings || 1} เสิร์ฟ)
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400">
                          {meal.mealType || meal.MealType} • {meal.person || meal.Person}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-white block">
                          {meal.calories || meal.Calories || 0} kcal
                        </span>
                        <span className="text-[10px] text-slate-400">
                          P: {meal.protein || meal.Protein || 0}g
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDayModalOpen(false)}
                className="border-[#26334d] hover:bg-slate-800 text-slate-300 text-xs"
              >
                ปิดหน้าต่าง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
