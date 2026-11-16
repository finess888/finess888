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
import { THAI_DAYS } from "@/lib/utils"
import { toast } from "sonner"

interface AddMealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (meal: any) => Promise<void>
  foods: any[]
}

const MEAL_TYPES = ["มื้อเช้า", "มื้อกลางวัน", "มื้อเย็น", "ของว่าง / อาหารเสริม"]

export function AddMealModal({ open, onOpenChange, onSave, foods }: AddMealModalProps) {
  const todayStr = new Date().toISOString().split("T")[0]
  const [date, setDate] = React.useState(todayStr)
  const [mealType, setMealType] = React.useState("มื้อเช้า")
  const [foodName, setFoodName] = React.useState("")
  const [portion, setPortion] = React.useState("1 จาน")
  const [calories, setCalories] = React.useState<number | "">(350)
  const [protein, setProtein] = React.useState<number | "">(25)
  const [carbs, setCarbs] = React.useState<number | "">(40)
  const [fat, setFat] = React.useState<number | "">(10)
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  // When selecting food from DB, auto-fill macros
  const handleSelectFood = (foodId: string) => {
    const f = foods.find((item) => (item.ID || item.id) === foodId)
    if (f) {
      setFoodName(f.Name || f.name || "")
      setPortion(f.ServingSize || f.servingsize || "1 serving")
      setCalories(Number(f.Calories || f.calories || 0))
      setProtein(Number(f.Protein || f.protein || 0))
      setCarbs(Number(f.Carbs || f.carbs || 0))
      setFat(Number(f.Fat || f.fat || 0))
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
      const d = new Date(date)
      const dayOfWeek = THAI_DAYS[d.getDay()] || "วันจันทร์"

      await onSave({
        date,
        dayOfWeek,
        mealType,
        foodName: foodName.trim(),
        portion: portion.trim(),
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        status: "ยังไม่ได้กิน",
        notes: notes.trim(),
      })

      toast.success("เพิ่มมื้ออาหารลงในแผนเรียบร้อย!")
      onOpenChange(false)
      // Reset form
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
            <span>🍽️</span> เพิ่มมื้ออาหารในแผน
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Quick select from Food DB */}
          {foods.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">เลือกด่วนจากคลังอาหาร (ถ้ามี)</Label>
              <select
                className="w-full h-9 rounded-md bg-[#0b0f19] border border-[#26334d] px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                onChange={(e) => handleSelectFood(e.target.value)}
                defaultValue=""
              >
                <option value="">-- เลือกเมนูสำเร็จรูปเพื่อเติมค่าอัตโนมัติ --</option>
                {foods.map((f) => (
                  <option key={f.ID || f.id} value={f.ID || f.id}>
                    {f.Name || f.name} ({f.Category || f.category}) - {f.Calories || f.calories} kcal
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
              <Label className="text-slate-300 text-xs">หมวดหมู่มื้ออาหาร</Label>
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
              <Label className="text-slate-300 text-xs">ปริมาณ/ขนาด</Label>
              <Input
                placeholder="เช่น 1 จาน / 200g"
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
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
            <Label className="text-slate-300 text-xs">หมายเหตุเพิ่มเติม</Label>
            <Input
              placeholder="เช่น ไม่ใส่น้ำตาล, ไม่ใช้น้ำมัน"
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
              {saving ? "กำลังบันทึก..." : "บันทึกลงชีต"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
