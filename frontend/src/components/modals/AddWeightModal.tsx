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

interface AddWeightModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (entry: any) => Promise<void>
}

export function AddWeightModal({ open, onOpenChange, onSave }: AddWeightModalProps) {
  const todayStr = new Date().toISOString().split("T")[0]
  const [date, setDate] = React.useState(todayStr)
  const [weight, setWeight] = React.useState<number | "">(65.0)
  const [bodyFat, setBodyFat] = React.useState<number | "">("")
  const [muscleMass, setMuscleMass] = React.useState<number | "">("")
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight) {
      toast.warning("กรุณาระบุน้ำหนักตัว")
      return
    }

    setSaving(true)
    try {
      await onSave({
        date,
        weight: Number(weight),
        bodyFat: bodyFat !== "" ? Number(bodyFat) : null,
        muscleMass: muscleMass !== "" ? Number(muscleMass) : null,
        notes: notes.trim(),
      })

      toast.success("บันทึกสถิติน้ำหนักเรียบร้อยแล้ว!")
      onOpenChange(false)
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
            <span>⚖️</span> บันทึกน้ำหนักและสัดส่วน
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">วันที่ชั่งน้ำหนัก</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-emerald-400 text-xs">น้ำหนักตัว (kg) *</Label>
              <Input
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={weight}
                onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                required
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-amber-400 text-xs">% ไขมัน (% BF)</Label>
              <Input
                type="number"
                step="0.1"
                min="1"
                max="60"
                placeholder="เช่น 15.5"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value === "" ? "" : Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-cyan-400 text-xs">กล้ามเนื้อ (kg)</Label>
              <Input
                type="number"
                step="0.1"
                min="1"
                max="100"
                placeholder="เช่น 32.0"
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value === "" ? "" : Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">บันทึกเพิ่มเติม</Label>
            <Input
              placeholder="เช่น ชั่งตอนเช้าหลังตื่นนอน"
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
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
