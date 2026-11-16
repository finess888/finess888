import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  WorkoutEntry,
  DailyStepLog,
  getWorkoutLogs,
  getDailyStepLogs,
  deleteWorkoutLog,
  calculateWorkoutStats,
} from "@/lib/exerciseDatabase"
import { formatThaiDate } from "@/lib/utils"
import {
  Activity,
  Footprints,
  Flame,
  Clock,
  Dumbbell,
  Plus,
  Trash2,
  Calendar,
  Navigation,
  Trophy,
  TrendingUp,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

interface WorkoutTrackerViewProps {
  selectedPerson?: string
  onSelectPerson?: (p: string) => void
  onOpenAddWorkout: () => void
  onOpenAddStep: () => void
}

export function WorkoutTrackerView({
  selectedPerson = "ฝ่ายชาย",
  onSelectPerson,
  onOpenAddWorkout,
  onOpenAddStep,
}: WorkoutTrackerViewProps) {
  const [workouts, setWorkouts] = React.useState<WorkoutEntry[]>(getWorkoutLogs)
  const [stepLogs, setStepLogs] = React.useState<DailyStepLog[]>(getDailyStepLogs)
  const [personFilter, setPersonFilter] = React.useState<string>(selectedPerson)
  const [filterDate, setFilterDate] = React.useState<string>("")

  const reloadData = () => {
    setWorkouts(getWorkoutLogs())
    setStepLogs(getDailyStepLogs())
  }

  React.useEffect(() => {
    reloadData()
  }, [])

  React.useEffect(() => {
    if (selectedPerson) {
      setPersonFilter(selectedPerson)
    }
  }, [selectedPerson])

  const handlePersonChange = (p: string) => {
    setPersonFilter(p)
    if (onSelectPerson && (p === "ฝ่ายชาย" || p === "ฝ่ายหญิง")) {
      onSelectPerson(p)
    }
  }

  const handleDeleteWorkout = (id: string, name: string) => {
    if (window.confirm(`คุณต้องการลบบันทึก "${name}" ใช่หรือไม่?`)) {
      deleteWorkoutLog(id)
      reloadData()
      toast.success("ลบบันทึกการออกกำลังกายเรียบร้อยแล้ว")
    }
  }

  // Filter workouts
  const filteredWorkouts = workouts.filter((w) => {
    const matchPerson = personFilter === "ALL" || w.person === personFilter
    const matchDate = !filterDate || w.date === filterDate
    return matchPerson && matchDate
  })

  // Filter steps for today or selected date
  const todayStr = new Date().toISOString().split("T")[0]
  const activeDate = filterDate || todayStr

  const maleTodayStep = stepLogs.find((s) => s.date === activeDate && s.person === "ฝ่ายชาย")
  const femaleTodayStep = stepLogs.find((s) => s.date === activeDate && s.person === "ฝ่ายหญิง")

  const stats = calculateWorkoutStats(
    workouts,
    stepLogs,
    undefined,
    undefined,
    personFilter === "ALL" ? undefined : personFilter
  )

  return (
    <div className="space-y-6">
      {/* Top Header & Person Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-400" />
            บันทึกการออกกำลังกาย & ก้าวเดิน (Workouts & Steps)
          </h1>
          <p className="text-slate-400 text-sm">
            บันทึกกิจกรรมคาร์ดิโอ เวทเทรนนิ่ง และจำนวนก้าวเดินในแต่ละวัน เพื่อสรุปผลโปรเจกต์ได้อย่างละเอียด
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Person Toggle */}
          <div className="flex items-center gap-1.5 bg-[#151d2f] p-1.5 rounded-xl border border-[#26334d]">
            <button
              onClick={() => handlePersonChange("ฝ่ายชาย")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                personFilter === "ฝ่ายชาย"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🏋️‍♂️</span> ฝ่ายชาย
            </button>
            <button
              onClick={() => handlePersonChange("ฝ่ายหญิง")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                personFilter === "ฝ่ายหญิง"
                  ? "bg-pink-600 text-white shadow-md shadow-pink-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🧘‍♀️</span> ฝ่ายหญิง
            </button>
            <button
              onClick={() => handlePersonChange("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                personFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>👥</span> ทั้งหมด
            </button>
          </div>

          <Button
            onClick={onOpenAddStep}
            variant="outline"
            className="border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-600/20 text-xs h-9 px-3 flex items-center gap-1.5"
          >
            <Footprints className="h-4 w-4 text-indigo-400" />
            + บันทึกก้าวเดิน
          </Button>

          <Button
            onClick={onOpenAddWorkout}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 px-3 shadow-md shadow-emerald-950 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            + บันทึกออกกำลังกาย
          </Button>
        </div>
      </div>

      {/* 🚶 DAILY STEP COUNT TRACKER WIDGET */}
      <Card className="bg-gradient-to-br from-[#111a2d] to-[#161d33] border-2 border-indigo-500/40 shadow-xl overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-[#26334d] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Footprints className="h-5 w-5 text-indigo-400" />
              ตัวติดตามก้าวเดินประจำวัน (Daily Step Tracker)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              ประจำวันที่ {formatThaiDate(activeDate)} (เป้าหมายสุขภาพ: 10,000 ก้าว/วัน)
            </CardDescription>
          </div>

          <Button
            onClick={onOpenAddStep}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-3 font-semibold shadow-md shadow-indigo-950 flex items-center gap-1.5"
          >
            <Footprints className="h-3.5 w-3.5" />
            + อัปเดตก้าวเดิน
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Male Steps Box */}
            <div className="p-4 rounded-xl bg-[#0b0f19] border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>🏋️‍♂️</span> ฝ่ายชาย (Male)
                </span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                  {maleTodayStep ? `${Math.round((maleTodayStep.steps / 10000) * 100)}% ของเป้า` : "ยังไม่บันทึก"}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {maleTodayStep ? maleTodayStep.steps.toLocaleString() : "0"}
                </span>
                <span className="text-xs text-slate-400">/ 10,000 ก้าว</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.round(((maleTodayStep?.steps || 0) / 10000) * 100))}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-[#26334d]">
                <span className="flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-indigo-400" />
                  ~{maleTodayStep ? maleTodayStep.distanceKm || (maleTodayStep.steps * 0.00075).toFixed(1) : "0"} กม.
                </span>
                <span className="flex items-center gap-1 text-amber-300 font-mono">
                  <Flame className="h-3 w-3 text-orange-400" />
                  ~{maleTodayStep ? maleTodayStep.burnedCalories : "0"} kcal
                </span>
              </div>
            </div>

            {/* Female Steps Box */}
            <div className="p-4 rounded-xl bg-[#0b0f19] border border-pink-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>🧘‍♀️</span> ฝ่ายหญิง (Female)
                </span>
                <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-[10px]">
                  {femaleTodayStep ? `${Math.round((femaleTodayStep.steps / 10000) * 100)}% ของเป้า` : "ยังไม่บันทึก"}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {femaleTodayStep ? femaleTodayStep.steps.toLocaleString() : "0"}
                </span>
                <span className="text-xs text-slate-400">/ 10,000 ก้าว</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-pink-400 h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.round(((femaleTodayStep?.steps || 0) / 10000) * 100))}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-[#26334d]">
                <span className="flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-pink-400" />
                  ~{femaleTodayStep ? femaleTodayStep.distanceKm || (femaleTodayStep.steps * 0.00075).toFixed(1) : "0"} กม.
                </span>
                <span className="flex items-center gap-1 text-amber-300 font-mono">
                  <Flame className="h-3 w-3 text-orange-400" />
                  ~{femaleTodayStep ? femaleTodayStep.burnedCalories : "0"} kcal
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#151d2f] border border-[#26334d] p-4 rounded-xl">
        <div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            จำนวนครั้งที่ออกกำลังกาย
          </span>
          <div className="text-xl font-bold text-white mt-1">{stats.totalWorkouts} เซสชัน</div>
        </div>
        <div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            เวลารวมที่ออกกำลังกาย
          </span>
          <div className="text-xl font-bold text-amber-300 mt-1">{stats.totalWorkoutMinutes} นาที</div>
        </div>
        <div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            เผาผลาญจากการออกกำลัง
          </span>
          <div className="text-xl font-bold text-orange-400 mt-1">
            {stats.totalWorkoutCalories.toLocaleString()} kcal
          </div>
        </div>
        <div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Footprints className="h-3.5 w-3.5 text-indigo-400" />
            ก้าวเดินเฉลี่ยต่อวัน
          </span>
          <div className="text-xl font-bold text-indigo-300 mt-1">
            {stats.avgStepsPerDay.toLocaleString()} ก้าว
          </div>
        </div>
      </div>

      {/* Workout History Table */}
      <Card className="bg-[#151d2f] border-[#26334d] overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-[#26334d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-emerald-400" />
              ประวัติการออกกำลังกายที่บันทึกไว้ ({filteredWorkouts.length} รายการ)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              ข้อมูลที่เชื่อมโยงและจดบันทึกลงในสเปรดชีต Google (B หน้าจดบันทึก)
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-8 w-36"
              placeholder="กรองตามวันที่"
            />
            {filterDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterDate("")}
                className="text-xs text-slate-400 hover:text-white h-8 px-2"
              >
                ล้างวันที่
              </Button>
            )}
          </div>
        </CardHeader>

        <div className="overflow-x-auto max-h-[500px]">
          <Table>
            <TableHeader className="bg-[#0e1422] border-b border-[#26334d] sticky top-0">
              <TableRow className="border-[#26334d]">
                <TableHead className="text-slate-300">วันที่</TableHead>
                <TableHead className="text-slate-300">บุคคล</TableHead>
                <TableHead className="text-slate-300">ท่า / กิจกรรม</TableHead>
                <TableHead className="text-slate-300">หมวดหมู่</TableHead>
                <TableHead className="text-center text-slate-300">เวลา (นาที)</TableHead>
                <TableHead className="text-right text-orange-400 font-semibold">เผาผลาญ (kcal)</TableHead>
                <TableHead className="text-slate-300">เซ็ต / น้ำหนัก / ระยะทาง</TableHead>
                <TableHead className="text-slate-300">ก้าวเดิน</TableHead>
                <TableHead className="text-slate-300">บันทึก</TableHead>
                <TableHead className="w-10 text-center text-slate-400">ลบ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-slate-400">
                    ยังไม่มีข้อมูลบันทึกการออกกำลังกายสำหรับเงื่อนไขนี้
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkouts.map((w) => {
                  const isMaleEntry = w.person === "ฝ่ายชาย"
                  return (
                    <TableRow key={w.id} className="border-[#26334d] hover:bg-slate-800/40">
                      <TableCell className="text-xs text-white font-medium whitespace-nowrap">
                        {formatThaiDate(w.date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] whitespace-nowrap ${
                            isMaleEntry
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-pink-500/20 text-pink-300 border-pink-500/30"
                          }`}
                        >
                          {isMaleEntry ? "🏋️‍♂️ ชาย" : "🧘‍♀️ หญิง"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-white text-sm whitespace-nowrap">
                        {w.exerciseName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700 whitespace-nowrap">
                          {w.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-xs font-mono text-white">
                        {w.durationMinutes}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold text-orange-400 font-mono whitespace-nowrap">
                        {w.burnedCalories}
                      </TableCell>
                      <TableCell className="text-xs text-slate-300 whitespace-nowrap">
                        {w.sets && w.reps ? (
                          <span>
                            {w.sets} เซ็ต × {w.reps} ครั้ง {w.weightKg ? `(${w.weightKg} kg)` : ""}
                          </span>
                        ) : w.distanceKm ? (
                          <span>{w.distanceKm} กม.</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-indigo-300 font-mono whitespace-nowrap">
                        {w.steps ? `${w.steps.toLocaleString()} ก้าว` : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 max-w-[150px] truncate">
                        {w.notes || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleDeleteWorkout(w.id, w.exerciseName)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="ลบบันทึกนี้"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
