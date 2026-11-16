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
  weightLogs: any[]
  onOpenAddMeal: () => void
  onToggleMealStatus: (id: string, currentStatus: string) => void
  onNavigateToMealPlan: () => void
}

export function DashboardView({
  meals,
  foods,
  weightLogs,
  onOpenAddMeal,
  onToggleMealStatus,
  onNavigateToMealPlan,
}: DashboardViewProps) {
  const todayStr = new Date().toISOString().split("T")[0]

  // Filter today's meals
  const todayMeals = meals.filter((m) => {
    const d = String(m.Date || m.date || "").split("T")[0]
    return d === todayStr
  })

  // Calculate today's totals
  const totalCalories = todayMeals.reduce((sum, m) => sum + Number(m.Calories || m.calories || 0), 0)
  const totalProtein = todayMeals.reduce((sum, m) => sum + Number(m.Protein || m.protein || 0), 0)
  const totalCarbs = todayMeals.reduce((sum, m) => sum + Number(m.Carbs || m.carbs || 0), 0)
  const totalFat = todayMeals.reduce((sum, m) => sum + Number(m.Fat || m.fat || 0), 0)

  const consumedMealsCount = todayMeals.filter(
    (m) => (m.Status || m.status) === "กินแล้ว"
  ).length

  // Standard targets (default 2000 kcal, 140g protein, 220g carbs, 55g fat)
  const TARGET_CALORIES = 2000
  const TARGET_PROTEIN = 140
  const TARGET_CARBS = 220
  const TARGET_FAT = 55

  // Latest weight
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null

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
    return meals
      .filter((m) => String(m.Date || m.date || "").split("T")[0] === isoDate)
      .reduce((sum, m) => sum + Number(m.Calories || m.calories || 0), 0)
  })

  const weeklyBarData = {
    labels: last7DaysLabels,
    datasets: [
      {
        label: "แคลอรี่ (kcal)",
        data: weeklyCalories,
        backgroundColor: "rgba(16, 185, 129, 0.6)",
        borderColor: "#10b981",
        borderRadius: 6,
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🥗</span>
            <h1 className="text-2xl font-bold text-white tracking-tight">ภาพรวมแผนการกินวันนี้</h1>
          </div>
          <p className="text-slate-400 text-sm">
            จัดการเป้าหมายสารอาหาร แคลอรี่ และติดตามมื้ออาหารประจำวันเชื่อมต่อ Google Sheets แบบเรียลไทม์
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={onOpenAddMeal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-emerald-950"
          >
            <Plus className="h-4 w-4" />
            + เพิ่มมื้ออาหาร
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Calories Card */}
        <Card className="bg-[#151d2f] border-[#26334d] hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400">แคลอรี่รวมวันนี้</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Flame className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalCalories} <span className="text-xs font-normal text-slate-400">/ {TARGET_CALORIES} kcal</span></div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalCalories / TARGET_CALORIES) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {Math.round((totalCalories / TARGET_CALORIES) * 100)}% ของเป้าหมายประจำวัน
            </p>
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
              สัดส่วนโปรตีน / คาร์โบไฮเดรต / ไขมัน
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <div className="w-48 h-48 relative">
              <Doughnut
                data={macroChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> โปรตีน ({totalProtein}g)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> คาร์บ ({totalCarbs}g)
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> ไขมัน ({totalFat}g)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend Bar Chart */}
        <Card className="lg:col-span-2 bg-[#151d2f] border-[#26334d]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-white">แนวโน้มแคลอรี่ 7 วันที่ผ่านมา</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                ปริมาณพลังงานที่ได้รับในแต่ละวัน
              </CardDescription>
            </div>
            {latestWeight && (
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                น้ำหนักล่าสุด: {latestWeight.Weight || latestWeight.weight} kg
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
                plugins: {
                  legend: { display: false },
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Today's Meals Timeline / List */}
      <Card className="bg-[#151d2f] border-[#26334d]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-emerald-400" />
              มื้ออาหารประจำวันนี้ ({todayMeals.length} รายการ - กินแล้ว {consumedMealsCount})
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              คลิกที่ไอคอนเพื่อเปลี่ยนสถานะ กินแล้ว / ยังไม่ได้กิน
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            onClick={onNavigateToMealPlan}
            className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1"
          >
            ดูแผนทั้งหมด <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>

        <CardContent>
          {todayMeals.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[#26334d] rounded-xl">
              <p className="text-slate-400 text-sm">ยังไม่มีมื้ออาหารที่บันทึกไว้สำหรับวันนี้</p>
              <Button
                onClick={onOpenAddMeal}
                variant="outline"
                className="mt-3 text-xs border-[#26334d] text-emerald-400 hover:bg-emerald-500/10"
              >
                + วางแผนมื้อแรกของวัน
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-[#26334d]">
              {todayMeals.map((meal) => {
                const id = meal.ID || meal.id
                const isConsumed = (meal.Status || meal.status) === "กินแล้ว"
                return (
                  <div
                    key={id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleMealStatus(id, meal.Status || meal.status)}
                        className="text-slate-400 hover:text-emerald-400 transition-colors"
                        title="คลิกเพื่อเปลี่ยนสถานะ"
                      >
                        {isConsumed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-500 hover:text-slate-300" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              isConsumed ? "text-slate-400 line-through" : "text-white"
                            }`}
                          >
                            {meal.FoodName || meal.foodname}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-slate-800 text-slate-300 border-slate-700"
                          >
                            {meal.MealType || meal.mealtype}
                          </Badge>
                          {meal.Portion && (
                            <span className="text-xs text-slate-400">({meal.Portion || meal.portion})</span>
                          )}
                        </div>
                        {meal.Notes && (
                          <p className="text-xs text-slate-400 mt-0.5">{meal.Notes || meal.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-sm font-semibold text-emerald-400">
                          {meal.Calories || meal.calories} kcal
                        </span>
                        <div className="text-[10px] text-slate-400 space-x-1">
                          <span>P: {meal.Protein || meal.protein}g</span>
                          <span>•</span>
                          <span>C: {meal.Carbs || meal.carbs}g</span>
                          <span>•</span>
                          <span>F: {meal.Fat || meal.fat}g</span>
                        </div>
                      </div>

                      <Badge
                        className={`text-xs ${
                          isConsumed
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {meal.Status || meal.status || "ยังไม่ได้กิน"}
                      </Badge>
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
