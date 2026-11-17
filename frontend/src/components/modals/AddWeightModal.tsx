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
  defaultPerson?: string
}

export function AddWeightModal({
  open,
  onOpenChange,
  onSave,
  defaultPerson = "ฝ่ายชาย",
}: AddWeightModalProps) {
  const todayStr = new Date().toISOString().split("T")[0]
  const [date, setDate] = React.useState(todayStr)
  const [person, setPerson] = React.useState(defaultPerson)
  const [weight, setWeight] = React.useState<number | string>(person === "ฝ่ายชาย" ? 100.0 : 65.0)
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setPerson(defaultPerson)
    setWeight(defaultPerson === "ฝ่ายชาย" ? 100.0 : 65.0)
  }, [defaultPerson, open])

  const handlePersonChange = (newPerson: string) => {
    setPerson(newPerson)
    setWeight(newPerson === "ฝ่ายชาย" ? 100.0 : 65.0)
  }

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
        person,
        weight: Number(weight),
        notes: notes.trim(),
      })

      toast.success(`บันทึกน้ำหนักของ ${person} ลง Google Sheets สำเร็จ!`)
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
            <span>⚖️</span> บันทึกน้ำหนักตัวลงชีต (Google Sheets)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Person Selector */}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">ผู้ชั่งน้ำหนัก</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePersonChange("ฝ่ายชาย")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  person === "ฝ่ายชาย"
                    ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950"
                    : "bg-[#0b0f19] border-[#26334d] text-slate-400 hover:text-white"
                }`}
              >
                <span>🏋️‍♂️</span> ฝ่ายชาย (เป้า 70 kg)
              </button>
              <button
                type="button"
                onClick={() => handlePersonChange("ฝ่ายหญิง")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  person === "ฝ่ายหญิง"
                    ? "bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-950"
                    : "bg-[#0b0f19] border-[#26334d] text-slate-400 hover:text-white"
                }`}
              >
                <span>🧘‍♀️</span> ฝ่ายหญิง (เป้า 50 kg)
              </button>
            </div>
          </div>

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

          <div className="space-y-1.5">
            <Label className={`${person === "ฝ่ายชาย" ? "text-emerald-400" : "text-pink-400"} text-xs font-semibold`}>
              น้ำหนักตัว (kg) *
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={weight === "" ? "" : weight}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "")
                setWeight(val === "" ? "" : val)
              }}
              placeholder={person === "ฝ่ายชาย" ? "เช่น 100.0" : "เช่น 65.0"}
              required
              autoFocus
              className="bg-[#0b0f19] border-[#26334d] text-white h-10 text-base font-bold font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">กิจกรรม / บันทึกสุขภาพ</Label>
            <Input
              placeholder="เช่น ชั่งตอนเช้าหลังตื่นนอน, เวทเทรนนิ่งช่วงเย็น"
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
              {saving ? "กำลังบันทึกลงชีต..." : "บันทึกลงชีต B"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
