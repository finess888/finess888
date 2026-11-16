import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  Utensils,
  ChevronDown,
} from "lucide-react"
import { formatThaiDate } from "@/lib/utils"

interface MealPlanViewProps {
  meals: any[]
  onOpenAddMeal: () => void
  onToggleMealStatus: (id: string, currentStatus: string) => void
  onDeleteMeal: (id: string) => void
}

export function MealPlanView({
  meals,
  onOpenAddMeal,
  onToggleMealStatus,
  onDeleteMeal,
}: MealPlanViewProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterMealType, setFilterMealType] = React.useState("ALL")
  const [filterStatus, setFilterStatus] = React.useState("ALL")
  const [filterDate, setFilterDate] = React.useState("")

  // Filter meals
  const filteredMeals = meals.filter((meal) => {
    const foodName = String(meal.FoodName || meal.foodname || "").toLowerCase()
    const mealType = String(meal.MealType || meal.mealtype || "")
    const status = String(meal.Status || meal.status || "")
    const dateStr = String(meal.Date || meal.date || "").split("T")[0]

    const matchesSearch = !searchTerm || foodName.includes(searchTerm.toLowerCase())
    const matchesType = filterMealType === "ALL" || mealType === filterMealType
    const matchesStatus = filterStatus === "ALL" || status === filterStatus
    const matchesDate = !filterDate || dateStr === filterDate

    return matchesSearch && matchesType && matchesStatus && matchesDate
  })

  // Calculate filtered totals
  const totalCals = filteredMeals.reduce((s, m) => s + Number(m.Calories || m.calories || 0), 0)
  const totalP = filteredMeals.reduce((s, m) => s + Number(m.Protein || m.protein || 0), 0)
  const totalC = filteredMeals.reduce((s, m) => s + Number(m.Carbs || m.carbs || 0), 0)
  const totalF = filteredMeals.reduce((s, m) => s + Number(m.Fat || m.fat || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📋</span> แผนการกิน (Meal Plan Management)
          </h1>
          <p className="text-slate-400 text-sm">
            วางแผนมื้ออาหารรายวันและรายสัปดาห์ พร้อมคำนวณสารอาหารและแคลอรี่อัตโนมัติ
          </p>
        </div>
        <Button
          onClick={onOpenAddMeal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-emerald-950"
        >
          <Plus className="h-4 w-4" />
          + เพิ่มมื้ออาหารในแผน
        </Button>
      </div>

      {/* Summary Bar for Filtered Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#151d2f] border border-[#26334d] p-4 rounded-xl">
        <div>
          <span className="text-xs text-slate-400">รายการที่แสดง</span>
          <div className="text-xl font-bold text-white">{filteredMeals.length} มื้อ</div>
        </div>
        <div>
          <span className="text-xs text-slate-400">แคลอรี่รวม</span>
          <div className="text-xl font-bold text-emerald-400">{totalCals} kcal</div>
        </div>
        <div>
          <span className="text-xs text-slate-400">โปรตีนรวม</span>
          <div className="text-xl font-bold text-emerald-300">{totalP.toFixed(1)} g</div>
        </div>
        <div>
          <span className="text-xs text-slate-400">คาร์บ / ไขมัน รวม</span>
          <div className="text-xl font-bold text-amber-300">
            {totalC.toFixed(0)}g / {totalF.toFixed(0)}g
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-[#151d2f] border-[#26334d]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ค้นหาชื่อเมนูอาหาร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#0b0f19] border-[#26334d] text-white text-sm h-9"
              />
            </div>

            <div>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-[#0b0f19] border-[#26334d] text-white text-sm h-9"
              />
            </div>

            <div>
              <select
                value={filterMealType}
                onChange={(e) => setFilterMealType(e.target.value)}
                className="w-full h-9 rounded-md bg-[#0b0f19] border border-[#26334d] px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">ทุกหมวดมื้ออาหาร</option>
                <option value="มื้อเช้า">มื้อเช้า</option>
                <option value="มื้อกลางวัน">มื้อกลางวัน</option>
                <option value="มื้อเย็น">มื้อเย็น</option>
                <option value="ของว่าง / อาหารเสริม">ของว่าง / อาหารเสริม</option>
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-9 rounded-md bg-[#0b0f19] border border-[#26334d] px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">ทุกสถานะ</option>
                <option value="กินแล้ว">กินแล้ว</option>
                <option value="ยังไม่ได้กิน">ยังไม่ได้กิน</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meals Table */}
      <Card className="bg-[#151d2f] border-[#26334d] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#0e1422] border-b border-[#26334d]">
              <TableRow className="border-[#26334d]">
                <TableHead className="w-12 text-center text-slate-400">สถานะ</TableHead>
                <TableHead className="text-slate-300">วันที่ / วัน</TableHead>
                <TableHead className="text-slate-300">มื้อ</TableHead>
                <TableHead className="text-slate-300">รายการอาหาร</TableHead>
                <TableHead className="text-slate-300">ปริมาณ</TableHead>
                <TableHead className="text-right text-emerald-400">แคลอรี่</TableHead>
                <TableHead className="text-right text-slate-300">โปรตีน</TableHead>
                <TableHead className="text-right text-slate-300">คาร์บ</TableHead>
                <TableHead className="text-right text-slate-300">ไขมัน</TableHead>
                <TableHead className="text-slate-300">หมายเหตุ</TableHead>
                <TableHead className="w-16 text-center text-slate-400">ลบ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10 text-slate-400">
                    ไม่พบรายการอาหารที่ตรงกับเงื่อนไขการค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filteredMeals.map((meal) => {
                  const id = meal.ID || meal.id
                  const isConsumed = (meal.Status || meal.status) === "กินแล้ว"

                  return (
                    <TableRow
                      key={id}
                      className="border-[#26334d] hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Status Toggle */}
                      <TableCell className="text-center">
                        <button
                          onClick={() => onToggleMealStatus(id, meal.Status || meal.status)}
                          className="text-slate-400 hover:text-emerald-400 transition-colors"
                          title="คลิกเพื่อสลับสถานะกินแล้ว/ยังไม่ได้กิน"
                        >
                          {isConsumed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-500 hover:text-slate-300" />
                          )}
                        </button>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {formatThaiDate(meal.Date || meal.date)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {meal.DayOfWeek || meal.dayofweek || "-"}
                        </div>
                      </TableCell>

                      {/* Meal Type */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-slate-800 text-slate-300 border-slate-700 text-xs whitespace-nowrap"
                        >
                          {meal.MealType || meal.mealtype}
                        </Badge>
                      </TableCell>

                      {/* Food Name */}
                      <TableCell>
                        <div
                          className={`font-semibold ${
                            isConsumed ? "text-slate-400 line-through" : "text-white"
                          }`}
                        >
                          {meal.FoodName || meal.foodname}
                        </div>
                      </TableCell>

                      {/* Portion */}
                      <TableCell className="text-slate-300 text-xs whitespace-nowrap">
                        {meal.Portion || meal.portion || "-"}
                      </TableCell>

                      {/* Calories */}
                      <TableCell className="text-right font-semibold text-emerald-400 whitespace-nowrap">
                        {meal.Calories || meal.calories} kcal
                      </TableCell>

                      {/* Protein */}
                      <TableCell className="text-right text-slate-300 text-xs whitespace-nowrap">
                        {meal.Protein || meal.protein}g
                      </TableCell>

                      {/* Carbs */}
                      <TableCell className="text-right text-slate-300 text-xs whitespace-nowrap">
                        {meal.Carbs || meal.carbs}g
                      </TableCell>

                      {/* Fat */}
                      <TableCell className="text-right text-slate-300 text-xs whitespace-nowrap">
                        {meal.Fat || meal.fat}g
                      </TableCell>

                      {/* Notes */}
                      <TableCell className="text-xs text-slate-400 max-w-[150px] truncate">
                        {meal.Notes || meal.notes || "-"}
                      </TableCell>

                      {/* Action Delete */}
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteMeal(id)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
