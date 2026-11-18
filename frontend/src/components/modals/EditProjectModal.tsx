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
import { Badge } from "@/components/ui/badge"
import { Target, Scale, Flame, Calendar, Clock, Check, Sparkles, Pencil } from "lucide-react"
import { FitnessProject, updateProject, getProjects, saveProjects, getActiveProject, DEFAULT_PROJECTS } from "@/lib/projectManager"
import { callGasApi } from "@/api/gasClient"
import { toast } from "sonner"

interface EditProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: FitnessProject | null
  onSaved: (updatedProject: FitnessProject) => void
}

export function EditProjectModal({
  open,
  onOpenChange,
  project,
  onSaved,
}: EditProjectModalProps) {
  const effectiveProject = project || getActiveProject("ฝ่ายชาย") || DEFAULT_PROJECTS[0]

  const [title, setTitle] = React.useState("")
  const [targetKg, setTargetKg] = React.useState<number>(10)
  const [startWeight, setStartWeight] = React.useState<number>(100.0)
  const [targetWeight, setTargetWeight] = React.useState<number>(90.0)
  const [targetDeficitKcal, setTargetDeficitKcal] = React.useState<number>(75000)
  const [targetDailySteps, setTargetDailySteps] = React.useState<number>(8000)
  const [startDate, setStartDate] = React.useState("")
  const [deadlineDate, setDeadlineDate] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      const p = project || getActiveProject("ฝ่ายชาย") || DEFAULT_PROJECTS[0]
      setTitle(p.title || "")
      const kg = Number(p.targetFatLossKg) || 10
      setTargetKg(kg)
      const sw = Number(p.startWeight) || 100.0
      setStartWeight(sw)
      const tw = p.targetWeight !== undefined ? Number(p.targetWeight) : Math.max(30, Number((sw - kg).toFixed(1)))
      setTargetWeight(tw)
      setTargetDeficitKcal(p.targetDeficitKcal || kg * 7500)
      setTargetDailySteps(p.targetDailySteps || 8000)
      setStartDate(p.startDate || new Date().toLocaleDateString("en-CA"))
      setDeadlineDate(p.deadlineDate || "")
      setNotes(p.notes || "")
    }
  }, [open, project])

  const handleKgChange = (kgVal: number) => {
    const validKg = Math.max(0.5, Number(kgVal))
    setTargetKg(validKg)
    const newTargetWeight = Math.max(30, Number((startWeight - validKg).toFixed(1)))
    setTargetWeight(newTargetWeight)
    setTargetDeficitKcal(Math.round(validKg * 7500))
  }

  const handleStartWeightChange = (swVal: number) => {
    const validSw = Math.max(30, Number(swVal))
    setStartWeight(validSw)
    setTargetWeight(Math.max(30, Number((validSw - targetKg).toFixed(1))))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.warning("กรุณาระบุชื่อโปรเจกต์")
      return
    }

    if (targetKg <= 0) {
      toast.warning("กรุณาระบุกิโลกรัมที่ต้องการลดมากกว่า 0 กก.")
      return
    }

    setSaving(true)
    try {
      const updates: Partial<FitnessProject> = {
        title: title.trim(),
        targetFatLossKg: Number(targetKg),
        startWeight: Number(startWeight),
        targetWeight: Number(targetWeight),
        targetDeficitKcal: Number(targetDeficitKcal),
        targetDailySteps: Number(targetDailySteps) || 8000,
        startDate: startDate,
        deadlineDate: deadlineDate,
        notes: notes.trim(),
      }

      const pId = project?.id || effectiveProject.id
      const updated = updateProject(pId, updates)
      if (updated) {
        const allProjects = getProjects()
        await callGasApi("SAVE_PROJECTS", allProjects).catch(() => {})
        onSaved(updated)
        toast.success(`อัปเดตโปรเจกต์ลด ${targetKg} กก. เรียบร้อยแล้ว!`, {
          description: `เป้าหมายลด ${targetKg} กก. (เริ่ม ${startWeight} ➔ เป้า ${targetWeight} กก.) • ซิงค์ทุกอุปกรณ์แล้ว`,
        })
        onOpenChange(false)
      }
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกโปรเจกต์")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#111726] border-[#26334d] text-white p-6 rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <Pencil className="h-5 w-5 text-amber-400" />
              แก้ไขเป้าหมายโปรเจกต์ ({effectiveProject.person})
            </DialogTitle>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
              {effectiveProject.person}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            ปรับเปลี่ยนจำนวนกิโลกรัมที่ต้องการลด น้ำหนักตั้งต้น และกำหนดเดดไลน์ของโปรเจกต์นี้
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Project Title */}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-semibold">ชื่อโปรเจกต์</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น โปรเจกต์ลดไขมัน 5 กก. เฟสแรก"
              className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              required
            />
          </div>

          {/* Core Target Weight Loss in Kg */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#111728] to-[#151c33] border-2 border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-emerald-400" />
                ต้องการลดกี่กิโลกรัมในโปรเจกต์นี้? *
              </Label>
              <span className="text-xs text-amber-300 font-mono font-bold">
                ลด {targetKg} กก.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                value={targetKg}
                onChange={(e) => handleKgChange(Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white h-10 text-base font-bold font-mono text-center"
                required
              />
              <span className="text-sm text-slate-300 font-medium shrink-0">กิโลกรัม (kg)</span>
            </div>

            {/* Quick Kg Presets */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <span className="text-[11px] text-slate-400 mr-1">เลือกด่วน:</span>
              {[2, 3, 5, 7, 8, 10, 12, 15].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKgChange(k)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-all font-mono ${
                    targetKg === k
                      ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950"
                      : "bg-[#0b0f19] text-slate-400 hover:text-white border border-[#26334d]"
                  }`}
                >
                  {k} กก.
                </button>
              ))}
            </div>
          </div>

          {/* Start Weight & Target Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold">น้ำหนักเริ่มต้น (กก.)</Label>
              <Input
                type="number"
                step="0.1"
                min="30"
                max="250"
                value={startWeight}
                onChange={(e) => handleStartWeightChange(Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm font-mono"
                required
              />
              <span className="text-[10px] text-slate-400 block">น้ำหนักก่อนเริ่มโปรเจกต์</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-emerald-400 text-xs font-semibold">น้ำหนักเป้าหมาย (กก.)</Label>
              <Input
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                className="bg-[#0b0f19] border-emerald-500/40 text-emerald-300 h-9 text-sm font-mono font-bold"
                required
              />
              <span className="text-[10px] text-emerald-400/90 block font-mono">
                = {startWeight} - {targetKg} กก.
              </span>
            </div>
          </div>

          {/* Deficit Kcal Goal */}
          <div className="p-3 bg-[#0b0f19] rounded-xl border border-[#26334d] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-semibold">
                <Flame className="h-4 w-4 text-amber-400" />
                เป้าหมายแคลอรี่ที่ต้องตัดทอนรวม (Calorie Deficit):
              </span>
              <span className="text-amber-400 font-mono font-bold">
                {targetDeficitKcal.toLocaleString()} kcal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="500"
                min="1000"
                value={targetDeficitKcal}
                onChange={(e) => setTargetDeficitKcal(Number(e.target.value))}
                className="bg-[#121826] border-[#26334d] text-amber-300 h-8 text-xs font-mono"
              />
              <span className="text-[11px] text-slate-400 shrink-0">
                (ฐาน: {targetKg} กก. × 7,500 kcal)
              </span>
            </div>
          </div>

          {/* Timeline & Step Goal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">วันเริ่มโปรเจกต์</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-xs font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-amber-300 text-xs font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-400" />
                วันสิ้นสุดเดดไลน์
              </Label>
              <Input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="bg-[#0b0f19] border-amber-500/40 text-amber-300 h-9 text-xs font-mono font-semibold"
                required
              />
            </div>
          </div>

          {/* Daily Steps Goal */}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">เป้าหมายก้าวเดิน (ก้าว/วัน)</Label>
            <Input
              type="number"
              step="500"
              min="1000"
              max="50000"
              value={targetDailySteps}
              onChange={(e) => setTargetDailySteps(Number(e.target.value))}
              className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-xs font-mono"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">โน้ต / กลยุทธ์ของโปรเจกต์นี้</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น เน้นคุมมื้อเย็นและเดินสะสมก้าวให้ครบ 8,000 ก้าวต่อวัน"
              rows={2}
              className="bg-[#0b0f19] border-[#26334d] text-white text-xs resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#26334d] text-slate-300 hover:bg-slate-800"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              {saving ? "กำลังบันทึก..." : `บันทึกเป้าหมาย (ลด ${targetKg} กก.)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
