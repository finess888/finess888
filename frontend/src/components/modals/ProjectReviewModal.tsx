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
import { Textarea } from "@/components/ui/textarea"
import {
  FitnessProject,
  ProjectAnalysis,
  getProjects,
  saveProject,
  createProject,
  completeProject,
  analyzeProject,
} from "@/lib/projectManager"
import {
  getWorkoutLogs,
  getDailyStepLogs,
  calculateWorkoutStats,
} from "@/lib/exerciseDatabase"
import { formatThaiDate } from "@/lib/utils"
import {
  Target,
  Calendar,
  Clock,
  Flame,
  Trophy,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Plus,
  History,
  TrendingDown,
  ArrowRight,
  Lightbulb,
  Dumbbell,
  Footprints,
} from "lucide-react"
import { toast } from "sonner"

interface ProjectReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPerson: string
  meals: any[]
  healthLogs: any[]
  maintenanceCalories: number
  targetIntakeCalories: number
  onProjectUpdated: (project: FitnessProject) => void
}

export function ProjectReviewModal({
  open,
  onOpenChange,
  currentPerson = "ฝ่ายชาย",
  meals,
  healthLogs,
  maintenanceCalories,
  targetIntakeCalories,
  onProjectUpdated,
}: ProjectReviewModalProps) {
  const [activeTab, setActiveTab] = React.useState<"review" | "create" | "history">("review")
  const [projectsList, setProjectsList] = React.useState<FitnessProject[]>(getProjects)
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("")

  // Form state for creating new project
  const todayStr = new Date().toISOString().split("T")[0]
  const defaultDeadline = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const isMale = currentPerson === "ฝ่ายชาย"

  const [formTitle, setFormTitle] = React.useState("")
  const [formPerson, setFormPerson] = React.useState<"ฝ่ายชาย" | "ฝ่ายหญิง" | "ทั้งคู่">(
    currentPerson === "ฝ่ายหญิง" ? "ฝ่ายหญิง" : "ฝ่ายชาย"
  )
  const [formKg, setFormKg] = React.useState<number>(isMale ? 10 : 5)
  const [formStartDate, setFormStartDate] = React.useState(todayStr)
  const [formDeadline, setFormDeadline] = React.useState(defaultDeadline)
  const [formStartWeight, setFormStartWeight] = React.useState<number>(isMale ? 100.0 : 65.0)
  const [formNotes, setFormNotes] = React.useState("")
  const [reviewNoteInput, setReviewNoteInput] = React.useState("")

  React.useEffect(() => {
    if (open) {
      const all = getProjects()
      setProjectsList(all)
      const personProj = all.find(
        (p) => p.status === "active" && (p.person === currentPerson || p.person === "ทั้งคู่")
      )
      if (personProj) {
        setSelectedProjectId(personProj.id)
      } else if (all.length > 0) {
        setSelectedProjectId(all[0].id)
      }
      setFormPerson(currentPerson === "ฝ่ายหญิง" ? "ฝ่ายหญิง" : "ฝ่ายชาย")
      setFormStartWeight(currentPerson === "ฝ่ายหญิง" ? 65.0 : 100.0)
      setFormKg(currentPerson === "ฝ่ายหญิง" ? 5 : 10)
      setFormTitle(`โปรเจกต์ลดไขมัน ${currentPerson === "ฝ่ายหญิง" ? "5" : "10"} กก. (เดดไลน์ใหม่)`)
    }
  }, [open, currentPerson])

  const currentProject = projectsList.find((p) => p.id === selectedProjectId) || projectsList[0]

  const analysis: ProjectAnalysis | null = currentProject
    ? analyzeProject(currentProject, meals, healthLogs, maintenanceCalories, targetIntakeCalories)
    : null

  const workoutStats = React.useMemo(() => {
    if (!currentProject) return null
    const allWorkouts = getWorkoutLogs()
    const allSteps = getDailyStepLogs()

    // Filter by project person & date range
    const filteredWorkouts = allWorkouts.filter((w) => {
      const matchPerson = currentProject.person === "ทั้งคู่" || w.person === currentProject.person
      const matchDate =
        (!currentProject.startDate || w.date >= currentProject.startDate) &&
        (!currentProject.deadlineDate || w.date <= currentProject.deadlineDate)
      return matchPerson && matchDate
    })

    const filteredSteps = allSteps.filter((s) => {
      const matchPerson = currentProject.person === "ทั้งคู่" || s.person === currentProject.person
      const matchDate =
        (!currentProject.startDate || s.date >= currentProject.startDate) &&
        (!currentProject.deadlineDate || s.date <= currentProject.deadlineDate)
      return matchPerson && matchDate
    })

    return calculateWorkoutStats(filteredWorkouts, filteredSteps)
  }, [currentProject, open])

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast.warning("กรุณาระบุชื่อโปรเจกต์")
      return
    }

    const targetW = Math.max(30, Number((formStartWeight - formKg).toFixed(1)))
    const newProj = createProject({
      title: formTitle.trim(),
      person: formPerson,
      targetFatLossKg: Number(formKg),
      targetDeficitKcal: Number(formKg) * 7500,
      startDate: formStartDate,
      deadlineDate: formDeadline,
      startWeight: Number(formStartWeight),
      targetWeight: targetW,
      status: "active",
      notes: formNotes.trim(),
    })

    const updated = getProjects()
    setProjectsList(updated)
    setSelectedProjectId(newProj.id)
    setActiveTab("review")
    onProjectUpdated(newProj)
    toast.success(`สร้างโปรเจกต์ "${newProj.title}" สำเร็จ!`, {
      description: `เป้าหมายลด ${newProj.targetFatLossKg} กก. (ตัดทอน ${newProj.targetDeficitKcal.toLocaleString()} kcal) เดดไลน์ ${newProj.deadlineDate}`,
    })
  }

  const handleCompleteCurrentProject = () => {
    if (!currentProject) return
    completeProject(currentProject.id, reviewNoteInput.trim() || analysis?.evaluationSummary)
    const updated = getProjects()
    setProjectsList(updated)
    toast.success(`ปิดสรุปโปรเจกต์ "${currentProject.title}" เรียบร้อยแล้ว!`, {
      description: "ข้อมูลผลสัมฤทธิ์และบทเรียนถูกจัดเก็บในประวัติเรียบร้อย สามารถสร้างโปรเจกต์ใหม่ได้ทันที",
    })
    setActiveTab("create")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#111726] border-[#26334d] text-white p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-emerald-400" />
              โปรเจกต์ลดน้ำหนักและเดดไลน์ (Weight Loss Projects & Retrospective)
            </DialogTitle>
            <Badge
              variant="outline"
              className="text-xs bg-[#0b0f19] border-emerald-500/30 text-emerald-300"
            >
              {currentPerson}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            ระบบตั้งเป้าหมายลดน้ำหนักแบบมีกำหนดเวลา (Deadline) พร้อมสรุปผลย้อนหลังว่าเกิดอะไรขึ้น เพื่อปรับปรุงในโปรเจกต์ถัดไป
          </p>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-[#0b0f19] p-1 border border-[#26334d] my-1">
          <button
            type="button"
            onClick={() => setActiveTab("review")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "review"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            สรุปผลโปรเจกต์ปัจจุบัน (Review)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "create"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            สร้างโปรเจกต์ใหม่ (New Project)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "history"
                ? "bg-slate-700 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            ประวัติโปรเจกต์ ({projectsList.length})
          </button>
        </div>

        {/* TAB 1: REVIEW & RETROSPECTIVE */}
        {activeTab === "review" && currentProject && analysis && (
          <div className="space-y-4 py-2">
            {/* Project Title Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#121c2e] to-[#172138] border border-emerald-500/30 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{currentProject.title}</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                      {currentProject.status === "active" ? "🟢 กำลังดำเนินการ" : "🏁 สิ้นสุดแล้ว"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>เริ่ม: {formatThaiDate(currentProject.startDate)}</span>
                    <span>➔</span>
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-semibold text-amber-300">
                      เดดไลน์: {formatThaiDate(currentProject.deadlineDate)}
                    </span>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-[#26334d] sm:pl-4">
                  <span className="text-[11px] text-slate-400 block">ระยะเวลาที่ใช้ไป</span>
                  <span className="text-base font-bold text-white font-mono">
                    {analysis.daysElapsed} <span className="text-xs font-normal text-slate-400">/ {analysis.daysTotal} วัน</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 block">
                    {analysis.isOverdue ? "⚠️ เลยเดดไลน์แล้ว" : `เหลือเวลาอีก ${analysis.daysRemaining} วัน`}
                  </span>
                </div>
              </div>

              {/* Timeline Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${analysis.progressTimePct}%` }}
                />
              </div>
            </div>

            {/* Core Retrospective Questions (ตอบคำถามที่ผู้ใช้ถามครบถ้วน) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Question 1: กินเกินไหม? (Intake Analysis) */}
              <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#26334d] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-orange-400" />
                    1. กินเกินไหม? (โภชนาการ)
                  </span>
                  <Badge
                    className={`text-[10px] ${
                      analysis.daysOverIntake === 0
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {analysis.daysOverIntake === 0 ? "คุมได้สมบูรณ์แบบ ✨" : `หลุด ${analysis.daysOverIntake} วัน`}
                  </Badge>
                </div>
                <div className="text-xs text-slate-300 space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">วันที่คุมแคลอรี่ได้ตามโควต้า:</span>
                    <strong className="text-emerald-400 font-mono">{analysis.daysCompliant} วัน</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">วันที่กินเกินโควต้าที่ตั้งไว้:</span>
                    <strong className={analysis.daysOverIntake > 0 ? "text-amber-300 font-mono" : "text-slate-400 font-mono"}>
                      {analysis.daysOverIntake} วัน
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">แคลอรี่เฉลี่ยต่อวันที่กิน:</span>
                    <strong className="text-white font-mono">{analysis.avgDailyIntake || "-"} kcal</strong>
                  </div>
                </div>
              </div>

              {/* Question 2: ออกกำลังกายเป็นยังไง? (Activity & Workout Summary) */}
              <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#26334d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    2. ออกกำลังกายเป็นยังไง? (Workout & Steps)
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                    {workoutStats && (workoutStats.totalWorkouts > 0 || workoutStats.totalSteps > 0)
                      ? `${workoutStats.totalWorkouts} ครั้ง • เดินเฉลี่ย ${workoutStats.avgStepsPerDay.toLocaleString()} ก้าว`
                      : `บันทึกชีต ${analysis.activitiesCount} วัน`}
                  </Badge>
                </div>

                <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                  {workoutStats && (workoutStats.totalWorkouts > 0 || workoutStats.totalSteps > 0) ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-[#111726] border border-[#26334d]">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Dumbbell className="h-3 w-3 text-emerald-400" />
                            <span>ออกกำลังกาย</span>
                          </div>
                          <span className="text-sm font-bold text-emerald-400 font-mono">
                            {workoutStats.totalWorkouts} <span className="text-xs font-normal text-slate-400">ครั้ง</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            รวม {workoutStats.totalWorkoutMinutes} นาที (~{workoutStats.totalWorkoutCalories.toLocaleString()} kcal)
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#111726] border border-[#26334d]">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Footprints className="h-3 w-3 text-indigo-400" />
                            <span>ก้าวเดินเฉลี่ย</span>
                          </div>
                          <span className="text-sm font-bold text-indigo-400 font-mono">
                            {workoutStats.avgStepsPerDay.toLocaleString()} <span className="text-xs font-normal text-slate-400">ก้าว/วัน</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            รวม {workoutStats.totalSteps.toLocaleString()} ก้าว (~{workoutStats.totalStepCalories.toLocaleString()} kcal)
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-[#26334d]">
                        <span className="text-slate-400">🔥 เผาผลาญจากการออกกำลัง/ก้าวเดิน:</span>
                        <strong className="text-amber-400 font-mono font-bold">
                          +{workoutStats.totalCombinedCalories.toLocaleString()} kcal
                        </strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-slate-400">
                        {analysis.activitySamples.length > 0
                          ? `ตัวอย่างบันทึก: ${analysis.activitySamples.join(", ")}`
                          : "ยังไม่มีบันทึกกิจกรรมในช่วงโปรเจกต์นี้"}
                      </p>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">ความสม่ำเสมอกิจกรรม:</span>
                        <strong className="text-indigo-300 font-mono">
                          {Math.round((analysis.activitiesCount / Math.max(1, analysis.daysElapsed)) * 100)}%
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Question 3: จากเป้ากี่แคลอรี่ที่ต้องตัดทอน ผลลัพธ์คือยังไง? */}
              <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#26334d] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-amber-400" />
                    3. เป้าตัดทอน vs ผลลัพธ์จริง
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    {analysis.deficitProgressPct}%
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">เป้าแคลอรี่ที่ต้องตัดทอน:</span>
                    <strong className="text-white font-mono">{analysis.totalDeficitTarget.toLocaleString()} kcal</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ตัดทอนสะสมได้จริง:</span>
                    <strong className="text-emerald-400 font-mono">
                      {analysis.deficitAchieved.toLocaleString()} kcal
                    </strong>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full"
                      style={{ width: `${analysis.deficitProgressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Question 4: น้ำหนักเริ่มต้น ➔ ปัจจุบัน ลดไปกี่กิโล? */}
              <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#26334d] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <TrendingDown className="h-4 w-4 text-emerald-400" />
                    4. ผลลัพธ์น้ำหนักตัวจริง
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">
                    ลดได้ {analysis.weightLost} กก.
                  </Badge>
                </div>
                <div className="text-xs text-slate-300 space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">น้ำหนักเริ่มต้นโปรเจกต์:</span>
                    <strong className="text-white font-mono">{analysis.startWeight} กก.</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">น้ำหนักปัจจุบัน:</span>
                    <strong className="text-emerald-300 font-mono">{analysis.currentWeight} กก.</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">เป้าหมายโปรเจกต์นี้:</span>
                    <strong className="text-amber-300 font-mono">{currentProject.targetFatLossKg} กก. (เหลือ {analysis.weightRemaining} กก.)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights & Learnings for Next Project (โปรเจกต์เดดไลน์ต่อไปจะได้ปรับตัวได้ถูก) */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#121c33] to-[#1a1c3d] border-2 border-indigo-500/40 space-y-2 shadow-lg">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <Lightbulb className="h-4 w-4 text-amber-400 animate-bounce" />
                บทเรียนและการปรับตัวสำหรับโปรเจกต์เดดไลน์ต่อไป (Actionable Insights)
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {analysis.evaluationSummary}
              </p>
              <div className="p-2.5 rounded-lg bg-[#0b0f19]/80 border border-[#26334d] text-xs text-amber-200 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{analysis.nextProjectAdvice}</span>
              </div>
            </div>

            {/* Close Project Button & Next Project Prompt */}
            {currentProject.status === "active" && (
              <div className="p-3 bg-[#0b0f19] rounded-xl border border-[#26334d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  ต้องการสรุปปิดโปรเจกต์นี้ เพื่อเริ่มโปรเจกต์ใหม่พร้อมเดดไลน์ถัดไปหรือไม่?
                </div>
                <Button
                  onClick={handleCompleteCurrentProject}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-8 px-3 shrink-0 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  สรุปปิดโปรเจกต์นี้ ➔ สร้างโปรเจกต์ใหม่
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE NEW PROJECT FORM */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateProject} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200 font-medium">ชื่อโปรเจกต์</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="เช่น โปรเจกต์เฟส 2: ลด 5 กก. เตรียมรับซัมเมอร์"
                className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-200 font-medium">บุคคล</Label>
                <select
                  value={formPerson}
                  onChange={(e: any) => setFormPerson(e.target.value)}
                  className="w-full h-9 rounded-md bg-[#0b0f19] border border-[#26334d] px-3 text-xs text-white"
                >
                  <option value="ฝ่ายชาย">🏋️‍♂️ ฝ่ายชาย</option>
                  <option value="ฝ่ายหญิง">🧘‍♀️ ฝ่ายหญิง</option>
                  <option value="ทั้งคู่">👥 ทั้งคู่</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-200 font-medium">เป้าหมายลดกี่กิโลกรัม (kg)</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  step={0.5}
                  value={formKg}
                  onChange={(e) => setFormKg(Number(e.target.value))}
                  className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9"
                  required
                />
              </div>
            </div>

            {/* Quick Kg Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">เลือกด่วน:</span>
              {[3, 5, 10, 15, 20].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFormKg(k)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium border transition-all ${
                    formKg === k
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : "bg-[#0b0f19] text-slate-400 border-[#26334d] hover:text-white"
                  }`}
                >
                  ลด {k} กก.
                </button>
              ))}
            </div>

            {/* Dates & Deadline */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-200 font-medium">วันที่เริ่มต้นโปรเจกต์</Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-200 font-medium text-amber-300">
                  กำหนดเดดไลน์ (Deadline Date)
                </Label>
                <Input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="bg-[#0b0f19] border-amber-500/50 text-white text-xs h-9 font-semibold"
                  required
                />
              </div>
            </div>

            {/* Start Weight */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200 font-medium">น้ำหนักเริ่มต้นโปรเจกต์ (กก.)</Label>
              <Input
                type="number"
                step={0.1}
                value={formStartWeight}
                onChange={(e) => setFormStartWeight(Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9"
                required
              />
            </div>

            {/* Formula Preview Box */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#0b1424] to-[#121c2e] border border-emerald-500/30 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between font-medium">
                <span>🎯 เป้าหมายตัดทอนรวมที่ต้องทำ:</span>
                <strong className="text-emerald-400 font-mono">
                  {(formKg * 7500).toLocaleString()} kcal
                </strong>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>เป้าน้ำหนักที่จะไปให้ถึง:</span>
                <strong className="text-white font-mono">
                  {Math.max(30, Number((formStartWeight - formKg).toFixed(1)))} กก.
                </strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200 font-medium">บันทึกเพิ่มเติม / กลยุทธ์ของโปรเจกต์นี้</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="เช่น เน้นออกกำลังกายสัปดาห์ละ 4 วัน, ลดของหวาน, คุมโควต้าอาหาร 1,700 kcal ทุกวัน..."
                className="bg-[#0b0f19] border-[#26334d] text-white text-xs min-h-[60px]"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 shadow-lg shadow-emerald-950"
            >
              + บันทึกและเริ่มโปรเจกต์นี้ทันที
            </Button>
          </form>
        )}

        {/* TAB 3: PROJECT HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-3 py-2">
            {projectsList.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  setSelectedProjectId(proj.id)
                  setActiveTab("review")
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:border-emerald-500/50 ${
                  selectedProjectId === proj.id
                    ? "bg-[#141e33] border-emerald-500/50"
                    : "bg-[#0b0f19] border-[#26334d]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{proj.title}</span>
                    <Badge
                      className={`text-[10px] ${
                        proj.status === "active"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {proj.status === "active" ? "🟢 ใช้งานอยู่" : "🏁 บันทึกสรุปแล้ว"}
                    </Badge>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    ลด {proj.targetFatLossKg} กก.
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                  <span>
                    {formatThaiDate(proj.startDate)} ➔ เดดไลน์: {formatThaiDate(proj.deadlineDate)}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    ตัดทอน {proj.targetDeficitKcal.toLocaleString()} kcal
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-[#26334d]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#26334d] text-slate-300 hover:text-white text-xs"
          >
            ปิดหน้าต่าง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
