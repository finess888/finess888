import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface AddMealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (meal: any) => Promise<void>
  foods: any[]
  defaultPerson?: string
}

const MEAL_TYPES = [
  "01. มื้อเช้า",
  "02. มื้อกลางวัน",
  "03. มื้อว่างบ่าย",
  "04. มื้อเย็น",
  "05. อื่นๆ / อาหารเสริม",
]

export function AddMealModal({
  open,
  onOpenChange,
  onSave,
  foods,
  defaultPerson = "ฝ่ายชาย",
}: AddMealModalProps) {
  const todayStr = new Date().toISOString().split("T")[0]
  const [date, setDate] = React.useState(todayStr)
  const [person, setPerson] = React.useState(defaultPerson)
  const [mealType, setMealType] = React.useState("01. มื้อเช้า")
  const [foodName, setFoodName] = React.useState("")
  const [servings, setServings] = React.useState<number | "">(1)
  const [calories, setCalories] = React.useState<number | "">(350)
  const [protein, setProtein] = React.useState<number | "">(25)
  const [carbs, setCarbs] = React.useState<number | "">(40)
  const [fat, setFat] = React.useState<number | "">(10)
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setPerson(defaultPerson)
  }, [defaultPerson])

  // When selecting food from DB, auto-fill macros
  const handleSelectFood = (foodId: string) => {
    const f = foods.find((item) => (item.id || item.ID || item.code) === foodId)
    if (f) {
      setFoodName(f.name || f.Name || "")
      setCalories(Number(f.calories || f.Calories || 0))
      setProtein(Number(f.protein || f.Protein || 0))
      setCarbs(Number(f.carbs || f.Carbs || 0))
      setFat(Number(f.fat || f.Fat || 0))
      if (f.servingSize) {
        setNotes((prev) => prev || `ขนาดเสิร์ฟ: ${f.servingSize}`)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foodName.trim()) {
      toast.warning("กรุณาระบุชื่ออาหาร")
      return
    }

    setSaving(true)
    try {
      await onSave({
        date,
        person,
        mealType,
        foodName: foodName.trim(),
        servings: Number(servings) || 1,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        notes: notes.trim(),
      })

      toast.success("บันทึกมื้ออาหารลงใน Google Sheets สำเร็จ!")
      onOpenChange(false)
      setFoodName("")
      setNotes("")
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#151d2f] border-[#26334d] text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <span>🍽️</span> บันทึกมื้ออาหารลงชีต (จดบันทึก)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Person Selector */}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">ผู้รับประทาน</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPerson("ฝ่ายชาย")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  person === "ฝ่ายชาย"
                    ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950"
                    : "bg-[#0b0f19] border-[#26334d] text-slate-400 hover:text-white"
                }`}
              >
                <span>🏋️‍♂️</span> ฝ่ายชาย (เป้า 2,000 kcal)
              </button>
              <button
                type="button"
                onClick={() => setPerson("ฝ่ายหญิง")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  person === "ฝ่ายหญิง"
                    ? "bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-950"
                    : "bg-[#0b0f19] border-[#26334d] text-slate-400 hover:text-white"
                }`}
              >
                <span>🧘‍♀️</span> ฝ่ายหญิง (เป้า 1,400 kcal)
              </button>
            </div>
          </div>

          {/* Quick select from Food DB */}
          {foods.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">เลือกด่วนจากคลังเมนูอาหาร (A หน้าเก็บเมนูอาหาร)</Label>
              <select
                className="w-full h-9 rounded-md bg-[#0b0f19] border border-[#26334d] px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                onChange={(e) => handleSelectFood(e.target.value)}
                defaultValue=""
              >
                <option value="">-- เลือกเมนูในคลังเพื่อเติมแคลอรี่และสารอาหารอัตโนมัติ --</option>
                {foods.map((f) => (
                  <option key={f.id || f.code} value={f.id || f.code}>
                    {f.name} ({f.category}) - {f.calories} kcal [P: {f.protein}g]
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">วันที่</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">มื้ออาหาร</Label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full h-9 rounded-md bg-[#0b0f19] border border-[#26334d] px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-slate-300 text-xs">ชื่อรายการอาหาร *</Label>
              <Input
                placeholder="เช่น ข้าวกล้องอกไก่ต้ม"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                required
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">จำนวน (เสิร์ฟ)</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={servings}
                onChange={(e) => setServings(e.target.value === "" ? "" : Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">แคลอรี่ (kcal)</Label>
              <Input
                type="number"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value === "" ? "" : Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-emerald-400 text-xs">โปรตีน (g)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value === "" ? "" : Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-amber-400 text-xs">คาร์บ (g)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value === "" ? "" : Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-rose-400 text-xs">ไขมัน (g)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={fat}
                onChange={(e) => setFat(e.target.value === "" ? "" : Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">บันทึกเพิ่มเติม</Label>
            <Input
              placeholder="เช่น มื้อเที่ยง 12:00 น., ไม่ใส่น้ำตาล"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#26334d] hover:bg-slate-800 text-slate-300"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {saving ? "กำลังบันทึกลงชีต..." : "บันทึกลง Google Sheets"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
