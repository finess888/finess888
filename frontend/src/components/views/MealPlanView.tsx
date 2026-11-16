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
  Calendar,
  Utensils,
  ChevronDown,
  User,
} from "lucide-react"
import { formatThaiDate } from "@/lib/utils"

interface MealPlanViewProps {
  meals: any[]
  selectedPerson?: string
  onSelectPerson?: (person: string) => void
  onOpenAddMeal: () => void
  onToggleMealStatus: (id: string, currentStatus: string) => void
  onDeleteMeal: (id: string) => void
}

export function MealPlanView({
  meals,
  selectedPerson = "ฝ่ายชาย",
  onSelectPerson,
  onOpenAddMeal,
  onToggleMealStatus,
  onDeleteMeal,
}: MealPlanViewProps) {
  const [personFilter, setPersonFilter] = React.useState<string>(selectedPerson)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterMealType, setFilterMealType] = React.useState("ALL")
  const [filterDate, setFilterDate] = React.useState("")

  React.useEffect(() => {
    if (selectedPerson) {
      setPersonFilter(selectedPerson)
    }
  }, [selectedPerson])

  const handlePersonChange = (p: string) => {
    setPersonFilter(p)
    if (onSelectPerson && (p === "ฝ่ายชาย" || p === "ฝ่ายหญิง")) {
      onSelectPerson(p)
    }
  }

  // Filter meals
  const filteredMeals = meals.filter((meal) => {
    const foodName = String(meal.foodName || meal.FoodName || "").toLowerCase()
    const mealType = String(meal.mealType || meal.MealType || "")
    const person = String(meal.person || meal.Person || "").trim()
    const dateStr = String(meal.date || meal.Date || "").split("T")[0]

    const matchesSearch = !searchTerm || foodName.includes(searchTerm.toLowerCase())
    const matchesType = filterMealType === "ALL" || mealType.includes(filterMealType) || filterMealType.includes(mealType)
    const matchesPerson =
      personFilter === "ALL" ||
      person === personFilter ||
      person === "ทั้งคู่"
    const matchesDate = !filterDate || dateStr === filterDate

    return matchesSearch && matchesType && matchesPerson && matchesDate
  })

  // Calculate filtered totals
  const totalCals = filteredMeals.reduce((s, m) => s + Number(m.calories || m.Calories || 0), 0)
  const totalP = filteredMeals.reduce((s, m) => s + Number(m.protein || m.Protein || 0), 0)
  const totalC = filteredMeals.reduce((s, m) => s + Number(m.carbs || m.Carbs || 0), 0)
  const totalF = filteredMeals.reduce((s, m) => s + Number(m.fat || m.Fat || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header & Person Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📋</span> แผนการกินและประวัติมื้ออาหาร (Meal Plan)
          </h1>
          <p className="text-slate-400 text-sm">
            ตารางมื้ออาหารที่บันทึกใน Google Sheets (B หน้าจดบันทึก) แยกตามฝ่ายชายและฝ่ายหญิง
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Person Toggle */}
          <div className="flex items-center gap-1.5 bg-[#151d2f] p-1.5 rounded-xl border border-[#26334d]">
            <button
              onClick={() => handlePersonChange("ฝ่ายชาย")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                personFilter === "ฝ่ายชาย"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🏋️‍♂️</span> ฝ่ายชาย
            </button>
            <button
              onClick={() => handlePersonChange("ฝ่ายหญิง")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                personFilter === "ฝ่ายหญิง"
                  ? "bg-pink-600 text-white shadow-md shadow-pink-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🧘‍♀️</span> ฝ่ายหญิง
            </button>
            <button
              onClick={() => handlePersonChange("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                personFilter === "ALL"
                  ? "bg-slate-700 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>👥</span> ทั้งหมด
            </button>
          </div>

          <Button
            onClick={onOpenAddMeal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-950 text-xs h-9"
          >
            <Plus className="h-4 w-4" />
            + บันทึกมื้ออาหาร
          </Button>
        </div>
      </div>

      {/* Summary Bar for Filtered Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#151d2f] border border-[#26334d] p-4 rounded-xl">
        <div>
          <span className="text-xs text-slate-400">รายการที่แสดง ({personFilter === "ALL" ? "รวมทั้งหมด" : personFilter})</span>
          <div className="text-xl font-bold text-white">{filteredMeals.length} มื้อ</div>
        </div>
        <div>
          <span className="text-xs text-slate-400">แคลอรี่รวม</span>
          <div className="text-xl font-bold text-emerald-400">{totalCals.toLocaleString()} kcal</div>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ค้นหาชื่อเมนูอาหาร เช่น Plante, ข้าวสวย, สันคอหมู..."
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
                <option value="มื้อว่างบ่าย">มื้อว่างบ่าย</option>
                <option value="มื้อเย็น">มื้อเย็น</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meals Table */}
      <Card className="bg-[#151d2f] border-[#26334d] overflow-hidden">
        <div className="overflow-x-auto max-h-[550px]">
          <Table>
            <TableHeader className="bg-[#0e1422] border-b border-[#26334d] sticky top-0">
              <TableRow className="border-[#26334d]">
                <TableHead className="w-12 text-center text-slate-400">สถานะ</TableHead>
                <TableHead className="text-slate-300">วันที่</TableHead>
                <TableHead className="text-slate-300">ฝ่าย</TableHead>
                <TableHead className="text-slate-300">มื้ออาหาร</TableHead>
                <TableHead className="text-slate-300">รายการเมนูอาหาร</TableHead>
                <TableHead className="text-slate-300">เสิร์ฟ</TableHead>
                <TableHead className="text-right text-emerald-400 font-semibold">แคลอรี่</TableHead>
                <TableHead className="text-right text-emerald-300">โปรตีน</TableHead>
                <TableHead className="text-right text-amber-300">คาร์บ</TableHead>
                <TableHead className="text-right text-rose-300">ไขมัน</TableHead>
                <TableHead className="text-slate-300">บันทึกเพิ่มเติม</TableHead>
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
                  const id = meal.id || meal.ID
                  const isMaleMeal = meal.person === "ฝ่ายชาย"

                  return (
                    <TableRow
                      key={id}
                      className="border-[#26334d] hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Status */}
                      <TableCell className="text-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                      </TableCell>

                      {/* Date */}
                      <TableCell className="whitespace-nowrap text-xs text-white font-medium">
                        {formatThaiDate(meal.date || meal.Date)}
                      </TableCell>

                      {/* Person Badge */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] whitespace-nowrap ${
                            isMaleMeal
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-pink-500/20 text-pink-300 border-pink-500/30"
                          }`}
                        >
                          {isMaleMeal ? "🏋️‍♂️ ชาย" : "🧘‍♀️ หญิง"}
                        </Badge>
                      </TableCell>

                      {/* Meal Type */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] whitespace-nowrap"
                        >
                          {meal.mealType || meal.MealType}
                        </Badge>
                      </TableCell>

                      {/* Food Name */}
                      <TableCell>
                        <div className="font-semibold text-white text-sm">
                          {meal.foodName || meal.FoodName}
                        </div>
                      </TableCell>

                      {/* Servings */}
                      <TableCell className="text-slate-300 text-xs whitespace-nowrap">
                        {meal.servings || 1}
                      </TableCell>

                      {/* Calories */}
                      <TableCell className="text-right font-semibold text-emerald-400 whitespace-nowrap text-sm">
                        {meal.calories} kcal
                      </TableCell>

                      {/* Protein */}
                      <TableCell className="text-right text-emerald-300 text-xs whitespace-nowrap">
                        {meal.protein}g
                      </TableCell>

                      {/* Carbs */}
                      <TableCell className="text-right text-amber-300 text-xs whitespace-nowrap">
                        {meal.carbs}g
                      </TableCell>

                      {/* Fat */}
                      <TableCell className="text-right text-rose-300 text-xs whitespace-nowrap">
                        {meal.fat}g
                      </TableCell>

                      {/* Notes */}
                      <TableCell className="text-xs text-slate-400 max-w-[180px] truncate">
                        {meal.notes || "-"}
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
