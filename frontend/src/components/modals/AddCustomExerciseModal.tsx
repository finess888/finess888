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
import { Textarea } from "@/components/ui/textarea"
import { ExerciseItem, ExerciseCategory, saveCustomExercise } from "@/lib/exerciseDatabase"
import { Dumbbell } from "lucide-react"
import { toast } from "sonner"

interface AddCustomExerciseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function AddCustomExerciseModal({
  open,
  onOpenChange,
  onSaved,
}: AddCustomExerciseModalProps) {
  const [name, setName] = React.useState("")
  const [category, setCategory] = React.useState<ExerciseCategory>("คาร์ดิโอ (Cardio)")
  const [burnRateKcalPerMin, setBurnRateKcalPerMin] = React.useState<number>(8)
  const [targetMuscles, setTargetMuscles] = React.useState("")
  const [targetGroup, setTargetGroup] = React.useState<"ฝ่ายชาย" | "ฝ่ายหญิง" | "ทั้งคู่">("ทั้งคู่")
  const [tips, setTips] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.warning("กรุณาระบุชื่อท่าหรือกิจกรรมออกกำลังกาย")
      return
    }

    const newItem: ExerciseItem = {
      id: "CUST-EX-" + Date.now(),
      code: "C" + Math.floor(Math.random() * 900 + 100),
      category,
      name: name.trim(),
      burnRateKcalPerMin: Number(burnRateKcalPerMin) || 6,
      targetMuscles: targetMuscles.trim() || "ทั่วไป",
      targetGroup,
      metValue: Number((burnRateKcalPerMin * 0.9).toFixed(1)),
      tips: tips.trim(),
    }

    saveCustomExercise(newItem)
    toast.success(`เพิ่มท่า "${newItem.name}" ลงคลังออกกำลังกายเรียบร้อย!`)
    setName("")
    setTargetMuscles("")
    setTips("")
    if (onSaved) onSaved()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#111726] border-[#26334d] text-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
            <Dumbbell className="h-5 w-5 text-emerald-400" />
            เพิ่มท่าออกกำลังกายใหม่ลงคลัง (Add Exercise)
          </DialogTitle>
          <p className="text-xs text-slate-400">
            เพิ่มท่าหรือกิจกรรมที่ชอบเพื่อเลือกบันทึกได้อย่างสะดวกรวดเร็ว
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-200 font-medium">ชื่อท่า / กิจกรรม</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ดัมเบล สควอท, แอโรบิกแดนซ์, ต่อยมวย..."
              className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200 font-medium">หมวดหมู่</Label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md bg-[#0b0f19] border border-[#26334d] px-3 text-xs text-white"
              >
                <option value="คาร์ดิโอ (Cardio)">คาร์ดิโอ (Cardio)</option>
                <option value="เวทเทรนนิ่ง - อก & หลังแขน">เวท - อก & หลังแขน</option>
                <option value="เวทเทรนนิ่ง - หลัง & หน้าแขน">เวท - หลัง & หน้าแขน</option>
                <option value="เวทเทรนนิ่ง - ขา & ก้น">เวท - ขา & ก้น</option>
                <option value="เวทเทรนนิ่ง - ไหล่ & ท้อง">เวท - ไหล่ & ท้อง</option>
                <option value="ก้าวเดิน (Daily Steps)">ก้าวเดิน (Walking)</option>
                <option value="ยืดเหยียด & โยคะ">ยืดเหยียด & โยคะ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200 font-medium">เผาผลาญ (kcal/นาที)</Label>
              <Input
                type="number"
                step={0.5}
                min={1}
                max={30}
                value={burnRateKcalPerMin}
                onChange={(e) => setBurnRateKcalPerMin(Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9 text-center font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-200 font-medium">กล้ามเนื้อที่เน้น (Target Muscles)</Label>
            <Input
              value={targetMuscles}
              onChange={(e) => setTargetMuscles(e.target.value)}
              placeholder="เช่น อก, หน้าแขน, หัวใจและปอด, ก้น..."
              className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-200 font-medium">คำแนะนำ / ทริคการเล่น</Label>
            <Textarea
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder="เช่น ล็อกข้อมือ, หายใจออกตอนออกแรง..."
              className="bg-[#0b0f19] border-[#26334d] text-white text-xs min-h-[50px]"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-[#26334d]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#26334d] text-slate-300 hover:text-white text-xs"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 shadow-md shadow-emerald-950"
            >
              + บันทึกลงคลัง
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
