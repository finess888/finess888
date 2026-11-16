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
import { Badge } from "@/components/ui/badge"
import { saveDailyStepLog } from "@/lib/exerciseDatabase"
import { callGasApi } from "@/api/gasClient"
import { Footprints, Flame, Navigation, Target } from "lucide-react"
import { toast } from "sonner"

interface AddStepModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPerson?: string
  onSaved?: () => void
}

export function AddStepModal({
  open,
  onOpenChange,
  defaultPerson = "ฝ่ายชาย",
  onSaved,
}: AddStepModalProps) {
  const todayStr = new Date().toISOString().split("T")[0]
  const [date, setDate] = React.useState(todayStr)
  const [person, setPerson] = React.useState<"ฝ่ายชาย" | "ฝ่ายหญิง">(
    defaultPerson === "ฝ่ายหญิง" ? "ฝ่ายหญิง" : "ฝ่ายชาย"
  )
  const [steps, setSteps] = React.useState<number | "">(8000)
  const [stepGoal, setStepGoal] = React.useState<number>(10000)
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setPerson(defaultPerson === "ฝ่ายหญิง" ? "ฝ่ายหญิง" : "ฝ่ายชาย")
      setDate(todayStr)
    }
  }, [open, defaultPerson])

  const stepsNum = Number(steps) || 0
  const estDistanceKm = Number((stepsNum * 0.00075).toFixed(2))
  const estCalories = Math.round(stepsNum * 0.035)
  const progressPct = Math.min(100, Math.round((stepsNum / (stepGoal || 10000)) * 100))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!steps || stepsNum <= 0) {
      toast.warning("กรุณาระบุจำนวนก้าวเดิน")
      return
    }

    setSaving(true)
    try {
      saveDailyStepLog({
        id: "step-" + Date.now(),
        date,
        person,
        steps: stepsNum,
        distanceKm: estDistanceKm,
        burnedCalories: estCalories,
        stepGoal,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      })

      // Sync to Google Sheets
      await callGasApi("ADD_WORKOUT_LOG", {
        date,
        person,
        exerciseName: "ก้าวเดินประจำวัน",
        durationMinutes: Math.round(stepsNum / 100), // ~100 steps per min
        burnedCalories: estCalories,
        steps: stepsNum,
        notes: notes.trim() || `เดินสะสมได้ ${stepsNum.toLocaleString()} ก้าว (~${estDistanceKm} กม.)`,
      }).catch((err) => {
        console.warn("GAS notice:", err.message)
      })

      toast.success(`บันทึกก้าวเดิน ${stepsNum.toLocaleString()} ก้าว สำเร็จ!`, {
        description: `ระยะทาง ~${estDistanceKm} กม. | เผาผลาญ ~${estCalories} kcal (${progressPct}% ของเป้าหมาย)`,
      })

      if (onSaved) onSaved()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกก้าวเดิน")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#111726] border-[#26334d] text-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
            <Footprints className="h-5 w-5 text-indigo-400" />
            บันทึกก้าวเดินประจำวัน (Daily Step Tracker)
          </DialogTitle>
          <p className="text-xs text-slate-400">
            จดจำนวนก้าวเดินเพื่อวิเคราะห์กิจกรรมและการเผาผลาญในโปรเจกต์
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Person & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200 font-medium">บุคคล</Label>
              <div className="flex rounded-lg bg-[#0b0f19] p-1 border border-[#26334d]">
                <button
                  type="button"
                  onClick={() => setPerson("ฝ่ายชาย")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    person === "ฝ่ายชาย"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🏋️‍♂️ ชาย
                </button>
                <button
                  type="button"
                  onClick={() => setPerson("ฝ่ายหญิง")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    person === "ฝ่ายหญิง"
                      ? "bg-pink-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🧘‍♀️ หญิง
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200 font-medium">วันที่</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9"
                required
              />
            </div>
          </div>

          {/* Steps Input */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-200 font-medium">จำนวนก้าวเดิน (Steps)</Label>
            <Input
              type="number"
              min={100}
              max={100000}
              step={100}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              placeholder="เช่น 8000 หรือ 10000"
              className="bg-[#0b0f19] border-[#26334d] text-white text-xl font-extrabold text-center h-12 focus:ring-1 focus:ring-indigo-400 font-mono"
              required
            />

            {/* Quick step presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 mr-1">ปุ่มลัด:</span>
              {[5000, 8000, 10000, 12000, 15000].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSteps(s)}
                  className={`text-[11px] px-2 py-0.5 rounded border transition-all ${
                    steps === s
                      ? "bg-indigo-600 text-white border-indigo-500 font-bold"
                      : "bg-[#0b0f19] text-slate-300 border-[#26334d] hover:text-white"
                  }`}
                >
                  {s.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Stats Highlight Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0b1426] to-[#121d33] border border-indigo-500/30 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-[#0e1628] border border-[#26334d]">
                <span className="text-[10px] text-slate-400 block">ระยะทางโดยประมาณ</span>
                <span className="text-sm font-bold text-white font-mono flex items-center justify-center gap-1">
                  <Navigation className="h-3 w-3 text-indigo-400" />
                  {estDistanceKm} กม.
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#0e1628] border border-[#26334d]">
                <span className="text-[10px] text-slate-400 block">เผาผลาญโดยประมาณ</span>
                <span className="text-sm font-bold text-amber-300 font-mono flex items-center justify-center gap-1">
                  <Flame className="h-3 w-3 text-orange-400" />
                  {estCalories} kcal
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#0e1628] border border-[#26334d]">
                <span className="text-[10px] text-slate-400 block">เทียบกับเป้าหมาย</span>
                <span className="text-sm font-bold text-emerald-400 font-mono flex items-center justify-center gap-1">
                  <Target className="h-3 w-3 text-emerald-400" />
                  {progressPct}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-1.5 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-200 font-medium">บันทึกเพิ่มเติม (ไม่บังคับ)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น เดินไปตลาด, เดินรอบสวนสาธารณะ..."
              className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9"
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
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 shadow-md shadow-indigo-950"
            >
              {saving ? "กำลังบันทึก..." : "+ บันทึกก้าวเดิน"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
