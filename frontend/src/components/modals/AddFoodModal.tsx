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

interface AddFoodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (food: any) => Promise<void>
}

const CATEGORIES = [
  "EAT AM ARE",
  "อี้จา",
  "โปรตีน",
  "คาร์โบไฮเดรต",
  "ผัก",
  "ผลไม้",
  "ไขมันดี",
  "เครื่องดื่ม",
  "อาหารเสริม",
  "ทั่วไป",
]

export function AddFoodModal({ open, onOpenChange, onSave }: AddFoodModalProps) {
  const [name, setName] = React.useState("")
  const [category, setCategory] = React.useState("โปรตีน")
  const [servingSize, setServingSize] = React.useState("100g")
  const [calories, setCalories] = React.useState<number | "">(150)
  const [protein, setProtein] = React.useState<number | "">(20)
  const [carbs, setCarbs] = React.useState<number | "">(0)
  const [fat, setFat] = React.useState<number | "">(3)
  const [fiber, setFiber] = React.useState<number | "">(0)
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.warning("กรุณาระบุชื่ออาหาร")
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        category,
        servingSize: servingSize.trim(),
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        fiber: Number(fiber) || 0,
        notes: notes.trim(),
      })

      toast.success("บันทึกเมนูใหม่ลงคลังอาหารแล้ว!")
      onOpenChange(false)
      setName("")
      setNotes("")
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#151d2f] border-[#26334d] text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <span>🥗</span> เพิ่มเมนู/วัตถุดิบเข้าคลัง
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">ชื่ออาหาร / วัตถุดิบ *</Label>
            <Input
              placeholder="เช่น อกไก่ต้ม, ข้าวโอ๊ต, เวย์โปรตีน"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">หมวดหมู่</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md bg-[#0b0f19] border border-[#26334d] px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">ขนาดหน่วยบริโภค</Label>
              <Input
                placeholder="เช่น 100g, 1 ฟอง, 1 scoop"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div className="grid grid-cols-3 gap-2">
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
            <div className="space-y-1.5">
              <Label className="text-teal-400 text-xs">ไฟเบอร์ (g)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={fiber}
                onChange={(e) => setFiber(e.target.value === "" ? "" : Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">หมายเหตุ/คุณสมบัติ</Label>
            <Input
              placeholder="เช่น มีโซเดียมต่ำ, อุดมด้วยกรดอะมิโน"
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
              {saving ? "กำลังบันทึก..." : "เพิ่มเข้าคลังอาหาร"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
