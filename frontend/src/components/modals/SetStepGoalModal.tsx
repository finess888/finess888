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
import { Target, Footprints, Check, Sparkles } from "lucide-react"
import { getCalorieSettings, saveCalorieSettings } from "@/lib/calorieSettings"
import { getProjects, saveProjects, getActiveProject } from "@/lib/projectManager"
import { callGasApi } from "@/api/gasClient"
import { toast } from "sonner"

interface SetStepGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPerson?: string
  currentGoal?: number
  onSaved?: (newGoal: number) => void
}

export function SetStepGoalModal({
  open,
  onOpenChange,
  currentPerson = "ฝ่ายชาย",
  currentGoal,
  onSaved,
}: SetStepGoalModalProps) {
  const isFemale = currentPerson === "ฝ่ายหญิง"
  const [person, setPerson] = React.useState<"ฝ่ายชาย" | "ฝ่ายหญิง">(
    isFemale ? "ฝ่ายหญิง" : "ฝ่ายชาย"
  )
  const [goal, setGoal] = React.useState<number>(currentGoal || 8000)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      const activeP = currentPerson === "ฝ่ายหญิง" ? "ฝ่ายหญิง" : "ฝ่ายชาย"
      setPerson(activeP)
      const settings = getCalorieSettings()
      const existing =
        currentGoal ||
        (activeP === "ฝ่ายหญิง" ? settings.female.stepGoal : settings.male.stepGoal) ||
        8000
      setGoal(existing)
    }
  }, [open, currentPerson, currentGoal])

  const handlePersonSwitch = (newP: "ฝ่ายชาย" | "ฝ่ายหญิง") => {
    setPerson(newP)
    const settings = getCalorieSettings()
    const pGoal =
      (newP === "ฝ่ายหญิง" ? settings.female.stepGoal : settings.male.stepGoal) || 8000
    setGoal(pGoal)
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!goal || goal < 500) {
      toast.warning("กรุณาระบุเป้าหมายก้าวเดินอย่างน้อย 500 ก้าว")
      return
    }

    setSaving(true)
    try {
      // 1. Update Calorie Settings
      const settings = getCalorieSettings()
      const key = person === "ฝ่ายหญิง" ? "female" : "male"
      settings[key].stepGoal = goal
      saveCalorieSettings(settings)

      // 2. Update Active Project for this person if exists
      const projects = getProjects()
      const activeProj = projects.find(
        (p) => p.status === "active" && (p.person === person || p.person === "ทั้งคู่")
      )
      if (activeProj) {
        activeProj.targetDailySteps = goal
        saveProjects(projects)
      }

      // 3. Sync to Google Apps Script & Google Sheet
      await Promise.all([
        callGasApi("SAVE_CALORIE_SETTINGS", settings).catch(() => {}),
        callGasApi("SAVE_PROJECTS", projects).catch(() => {}),
      ])

      toast.success(`บันทึกเป้าหมายก้าวเดิน ${goal.toLocaleString()} ก้าว/วัน สำเร็จ!`, {
        description: `บันทึกลง Google Sheets และซิงค์ทุกอุปกรณ์เรียบร้อย (${person})`,
      })

      if (onSaved) onSaved(goal)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกเป้าหมาย")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#111726] border-[#26334d] text-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-amber-400" />
            บันทึกเป้าหมายก้าวเดิน (Daily Step Goal)
          </DialogTitle>
          <p className="text-xs text-slate-400">
            กำหนดจำนวนก้าวเดินเป้าหมายต่อวัน เพื่อใช้ในการวิเคราะห์ความสม่ำเสมอในโปรเจกต์
          </p>
        </DialogHeader>

        <form onSubmit={handleSave} noValidate autoComplete="off" className="space-y-4 py-2">
          {/* Person Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-200 font-medium">ตั้งเป้าหมายสำหรับ</Label>
            <div className="flex rounded-lg bg-[#0b0f19] p-1 border border-[#26334d]">
              <button
                type="button"
                onClick={() => handlePersonSwitch("ฝ่ายชาย")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  person === "ฝ่ายชาย"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🏋️‍♂️ ฝ่ายชาย
              </button>
              <button
                type="button"
                onClick={() => handlePersonSwitch("ฝ่ายหญิง")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  person === "ฝ่ายหญิง"
                    ? "bg-pink-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🧘‍♀️ ฝ่ายหญิง
              </button>
            </div>
          </div>

          {/* Goal Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                <Footprints className="h-4 w-4 text-indigo-400" />
                จำนวนก้าวเดินเป้าหมายต่อวัน (ก้าว)
              </Label>
              <span className="text-xs font-bold text-amber-400 font-mono">
                {goal.toLocaleString()} ก้าว/วัน
              </span>
            </div>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={goal || ""}
              onChange={(e) => {
                const text = e.target.value.replace(/[^0-9]/g, "")
                setGoal(text === "" ? 0 : Number(text))
              }}
              className="bg-[#0b0f19] border-[#26334d] text-white text-xl font-extrabold text-center h-12 focus:ring-1 focus:ring-amber-400 font-mono"
            />

            {/* Quick preset chips */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <span className="text-[10px] text-slate-400 mr-1">เป้ายอดนิยม:</span>
              {[5000, 6000, 8000, 10000, 12000, 15000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setGoal(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-all font-medium ${
                    goal === preset
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950"
                      : "bg-[#0b0f19] text-slate-300 border border-[#26334d] hover:text-white"
                  }`}
                >
                  {preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Calories & Distance preview */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-[#0b1426] to-[#141d33] border border-amber-500/30 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                ระยะทางเฉลี่ยที่เดินได้:
              </span>
              <strong className="text-white font-mono">~{(goal * 0.00075).toFixed(1)} กม.</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">🔥 เผาผลาญประมาณ:</span>
              <strong className="text-amber-300 font-mono">~{Math.round(goal * 0.035)} kcal / วัน</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-[#26334d]">
              <span>สะสม 30 วัน:</span>
              <strong className="text-emerald-400 font-mono">
                ~{(Math.round(goal * 0.035) * 30).toLocaleString()} kcal (~{((Math.round(goal * 0.035) * 30) / 7500).toFixed(1)} กก.)
              </strong>
            </div>
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
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-4 shadow-md shadow-amber-950"
            >
              <Check className="h-4 w-4 mr-1.5" />
              {saving ? "กำลังบันทึก..." : "💾 บันทึกเป้าหมาย"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
