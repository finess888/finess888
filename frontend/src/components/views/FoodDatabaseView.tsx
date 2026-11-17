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
import { Plus, Search, Utensils, Sparkles, BookOpen } from "lucide-react"

interface FoodDatabaseViewProps {
  foods: any[]
  onOpenAddFood: () => void
  onQuickAddMeal: (food: any) => void
}

export function FoodDatabaseView({
  foods,
  onOpenAddFood,
  onQuickAddMeal,
}: FoodDatabaseViewProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("ALL")

  const categories = React.useMemo(() => {
    const list = ["ALL", "EAT AM ARE"]
    const foundCats = new Set<string>()
    foods.forEach((f) => {
      const c = String(f.Category || f.category || "").trim()
      if (c && !list.includes(c)) foundCats.add(c)
    })
    return [...list, ...Array.from(foundCats)]
  }, [foods])

  const filteredFoods = foods.filter((f) => {
    const name = String(f.Name || f.name || "").toLowerCase()
    const category = String(f.Category || f.category || "")
    const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "ALL" || category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🥗</span> คลังข้อมูลอาหารและโภชนาการ (Food Database)
          </h1>
          <p className="text-slate-400 text-sm">
            ฐานข้อมูลเมนูอาหารและวัตถุดิบ พร้อมตารางแคลอรี่และสารอาหารหลัก บันทึกลง Google Sheets
          </p>
        </div>
        <Button
          onClick={onOpenAddFood}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-emerald-950"
        >
          <Plus className="h-4 w-4" />
          + เพิ่มเมนูใหม่ในคลัง
        </Button>
      </div>

      {/* Search and Category Filters */}
      <Card className="bg-[#151d2f] border-[#26334d]">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหาชื่ออาหาร เช่น อกไก่, ข้าวกล้อง, แซลมอน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#0b0f19] border-[#26334d] text-white text-sm h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-white font-medium"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {cat === "ALL" ? "ทั้งหมด" : cat}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Foods Table */}
      <Card className="bg-[#151d2f] border-[#26334d] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#0e1422] border-b border-[#26334d]">
              <TableRow className="border-[#26334d]">
                <TableHead className="text-slate-300">ชื่ออาหาร / เมนู</TableHead>
                <TableHead className="text-slate-300">หมวดหมู่</TableHead>
                <TableHead className="text-slate-300">ขนาดบริโภค</TableHead>
                <TableHead className="text-right text-emerald-400">แคลอรี่</TableHead>
                <TableHead className="text-right text-emerald-300">โปรตีน</TableHead>
                <TableHead className="text-right text-amber-300">คาร์บ</TableHead>
                <TableHead className="text-right text-rose-300">ไขมัน</TableHead>
                <TableHead className="text-right text-teal-300">ไฟเบอร์</TableHead>
                <TableHead className="text-slate-300">คุณสมบัติ / หมายเหตุ</TableHead>
                <TableHead className="w-24 text-center text-slate-400">นำไปใช้</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFoods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-slate-400">
                    ไม่พบรายการอาหารที่ตรงกับคำค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filteredFoods.map((f) => {
                  const id = f.ID || f.id
                  return (
                    <TableRow
                      key={id}
                      className="border-[#26334d] hover:bg-slate-800/40 transition-colors"
                    >
                      <TableCell className="font-semibold text-white whitespace-nowrap">
                        {f.Name || f.name}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-slate-800 text-slate-300 border-slate-700 text-xs whitespace-nowrap"
                        >
                          {f.Category || f.category}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-slate-300 text-xs whitespace-nowrap">
                        {f.ServingSize || f.servingsize || "-"}
                      </TableCell>

                      <TableCell className="text-right font-semibold text-emerald-400 whitespace-nowrap">
                        {f.Calories || f.calories} kcal
                      </TableCell>

                      <TableCell className="text-right text-emerald-300 text-xs whitespace-nowrap">
                        {f.Protein || f.protein}g
                      </TableCell>

                      <TableCell className="text-right text-amber-300 text-xs whitespace-nowrap">
                        {f.Carbs || f.carbs}g
                      </TableCell>

                      <TableCell className="text-right text-rose-300 text-xs whitespace-nowrap">
                        {f.Fat || f.fat}g
                      </TableCell>

                      <TableCell className="text-right text-teal-300 text-xs whitespace-nowrap">
                        {f.Fiber || f.fiber || 0}g
                      </TableCell>

                      <TableCell className="text-xs text-slate-400 max-w-[180px] truncate">
                        {f.Notes || f.notes || "-"}
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onQuickAddMeal(f)}
                          className="text-[11px] h-7 px-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          + เข้าแผน
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
