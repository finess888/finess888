import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Flame,
  Beef,
  Wheat,
  Droplet,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  TrendingUp,
  UtensilsCrossed,
  ArrowRight,
  User,
  Users,
} from "lucide-react"
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
  onToggleMealStatus,
  onNavigateToMealPlan,
}: DashboardViewProps) {
  const isMale = selectedPerson === "ฝ่ายชาย"

  // Target macros based on sheet C metadata
  const TARGET_CALORIES = isMale ? 2000 : 1400
  const TARGET_PROTEIN = isMale ? 160 : 104
  const TARGET_CARBS = isMale ? 210 : 130
  const TARGET_FAT = isMale ? 60 : 40
  const TARGET_WEIGHT = isMale ? 70.0 : 50.0

  // Filter meals for the selected person
  const personMeals = meals.filter((m) => {
    const p = String(m.person || m.Person || "").trim()
    return p === selectedPerson || p === "ทั้งคู่"
  })

  // Date selection (default today or latest logged date)
  const todayStr = new Date().toISOString().split("T")[0]
  // Check if today has meals, or take the latest date from meals
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

  // Find health log for the latest entry
  const latestHealth = healthLogs.find((h) => (isMale ? h.maleWeight : h.femaleWeight))
  const currentWeight = isMale ? latestHealth?.maleWeight : latestHealth?.femaleWeight

  // Calorie remaining
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
      {/* Top Banner & Person Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#151d2f] to-[#151d2f] border border-[#26334d] rounded-2xl p-6 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{isMale ? "🏋️‍♂️" : "🧘‍♀️"}</span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              โภชนาการและแผนสุขภาพ: <span className={isMale ? "text-emerald-400" : "text-pink-400"}>{selectedPerson}</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            เป้าหมาย: {TARGET_CALORIES.toLocaleString()} kcal | โปรตีน {TARGET_PROTEIN}g | นน. เป้าหมาย {TARGET_WEIGHT} กก.
          </p>
        </div>

        {/* Toggle Couple View */}
        <div className="flex items-center gap-2 bg-[#0b0f19] p-1.5 rounded-xl border border-[#26334d]">
          <button
            onClick={() => onSelectPerson("ฝ่ายชาย")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedPerson === "ฝ่ายชาย"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🏋️‍♂️</span> ฝ่ายชาย
          </button>
          <button
            onClick={() => onSelectPerson("ฝ่ายหญิง")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedPerson === "ฝ่ายหญิง"
                ? "bg-pink-600 text-white shadow-md shadow-pink-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🧘‍♀️</span> ฝ่ายหญิง
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Calories Card */}
        <Card className="bg-[#151d2f] border-[#26334d] hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400">แคลอรี่วันนี้</CardTitle>
            <div className={`p-2 rounded-xl ${isMale ? "bg-emerald-500/10 text-emerald-400" : "bg-pink-500/10 text-pink-400"}`}>
              <Flame className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalCalories} <span className="text-xs font-normal text-slate-400">/ {TARGET_CALORIES} kcal</span></div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all ${isMale ? "bg-emerald-500" : "bg-pink-500"}`}
                style={{ width: `${Math.min(100, (totalCalories / TARGET_CALORIES) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>{Math.round((totalCalories / TARGET_CALORIES) * 100)}% ของเป้า</span>
              <span className={calorieDiff >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {calorieDiff >= 0 ? `เหลือ ${calorieDiff} kcal` : `เกิน ${Math.abs(calorieDiff)} kcal`}
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
            {currentWeight && (
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                น้ำหนักปัจจุบัน: {currentWeight} kg (เป้า {TARGET_WEIGHT} kg)
              </Badge>
            )}
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
    </div>
  )
}
