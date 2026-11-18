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
  ExerciseItem,
  WorkoutEntry,
  getExerciseDatabase,
  saveWorkoutLog,
  saveDailyStepLog,
} from "@/lib/exerciseDatabase"
import { callGasApi } from "@/api/gasClient"
import { Activity, Flame, Clock, Dumbbell, Footprints, Search, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface AddWorkoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPerson?: string
  defaultExercise?: ExerciseItem | null
  onSaved?: () => void
}

export function AddWorkoutModal({
  open,
  onOpenChange,
  defaultPerson = "ฝ่ายชาย",
  defaultExercise = null,
  onSaved,
}: AddWorkoutModalProps) {
  const exercises = React.useMemo(() => getExerciseDatabase(), [])
  const todayStr = new Date().toLocaleDateString("en-CA")

  const [date, setDate] = React.useState(todayStr)
  const [person, setPerson] = React.useState<"ฝ่ายชาย" | "ฝ่ายหญิง">(
    defaultPerson === "ฝ่ายหญิง" ? "ฝ่ายหญิง" : "ฝ่ายชาย"
  )
  const [selectedExerciseId, setSelectedExerciseId] = React.useState<string>(defaultExercise?.id || "")
  const [customExerciseName, setCustomExerciseName] = React.useState("")
  const [durationMinutes, setDurationMinutes] = React.useState<number>(30)
  const [burnedCalories, setBurnedCalories] = React.useState<number>(200)
  const [sets, setSets] = React.useState<number | "">("")
  const [reps, setReps] = React.useState<number | "">("")
  const [weightKg, setWeightKg] = React.useState<number | "">("")
  const [distanceKm, setDistanceKm] = React.useState<number | "">("")
  const [steps, setSteps] = React.useState<number | "">("")
  const [intensity, setIntensity] = React.useState<"เบา (Light)" | "ปานกลาง (Moderate)" | "หนัก (High/Intense)">("ปานกลาง (Moderate)")
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setPerson(defaultPerson === "ฝ่ายหญิง" ? "ฝ่ายหญิง" : "ฝ่ายชาย")
      if (defaultExercise) {
        setSelectedExerciseId(defaultExercise.id)
        setCustomExerciseName(defaultExercise.name)
        const estBurn = Math.round(30 * (defaultExercise.burnRateKcalPerMin || 6))
        setBurnedCalories(estBurn)
      } else if (!selectedExerciseId && exercises.length > 0) {
        setSelectedExerciseId(exercises[0].id)
        setCustomExerciseName(exercises[0].name)
        setBurnedCalories(Math.round(30 * (exercises[0].burnRateKcalPerMin || 6)))
      }
    }
  }, [open, defaultPerson, defaultExercise])

  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId)
  const isWeightTraining = selectedExercise?.category.includes("เวทเทรนนิ่ง")
  const isCardio = selectedExercise?.category.includes("คาร์ดิโอ")

  const handleSelectExercise = (ex: ExerciseItem) => {
    setSelectedExerciseId(ex.id)
    setCustomExerciseName(ex.name)
    const rate = ex.burnRateKcalPerMin || 6
    setBurnedCalories(Math.round(durationMinutes * rate))
    setSearchTerm("")
  }

  const handleDurationChange = (mins: number) => {
    setDurationMinutes(mins)
    const rate = selectedExercise?.burnRateKcalPerMin || 6
    setBurnedCalories(Math.round(mins * rate))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const exerciseName = customExerciseName.trim() || selectedExercise?.name || "ออกกำลังกาย"
    const newWorkout: WorkoutEntry = {
      id: "w-" + Date.now(),
      date,
      person,
      exerciseId: selectedExerciseId,
      exerciseName,
      category: selectedExercise?.category || "ทั่วไป",
      durationMinutes: Number(durationMinutes),
      burnedCalories: Number(burnedCalories),
      steps: steps ? Number(steps) : undefined,
      sets: sets ? Number(sets) : undefined,
      reps: reps ? Number(reps) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      distanceKm: distanceKm ? Number(distanceKm) : undefined,
      intensity,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    }

    try {
      // 1. Save in local database
      saveWorkoutLog(newWorkout)

      // 2. If steps entered, also save in daily step logs
      if (steps && Number(steps) > 0) {
        saveDailyStepLog({
          id: "step-" + Date.now(),
          date,
          person,
          steps: Number(steps),
          distanceKm: Number((Number(steps) * 0.00075).toFixed(2)),
          burnedCalories: Math.round(Number(steps) * 0.035),
          stepGoal: 10000,
          notes: notes.trim(),
          createdAt: new Date().toISOString(),
        })
      }

      // 3. Sync to Google Sheets via GAS API
      await callGasApi("ADD_WORKOUT_LOG", {
        date,
        person,
        exerciseName,
        durationMinutes: Number(durationMinutes),
        burnedCalories: Number(burnedCalories),
        steps: steps ? Number(steps) : 0,
        notes: notes.trim(),
      }).catch((err) => {
        console.warn("GAS Sync notice:", err.message)
      })

      toast.success(`บันทึกการออกกำลังกาย "${exerciseName}" เรียบร้อยแล้ว!`, {
        description: `ระยะเวลา ${durationMinutes} นาที | เผาผลาญ ${burnedCalories} kcal ${steps ? `| 🚶 ${Number(steps).toLocaleString()} ก้าว` : ""}`,
      })

      if (onSaved) onSaved()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  // Filtered exercises for search
  const filteredExercises = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#111726] border-[#26334d] text-white p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
            <Activity className="h-5 w-5 text-emerald-400" />
            บันทึกการออกกำลังกาย & กิจกรรม (Log Workout)
          </DialogTitle>
          <p className="text-xs text-slate-400">
            บันทึกกิจกรรมเผาผลาญแคลอรี่และก้าวเดิน เชื่อมโยงลง Google Sheets และสรุปผลโปรเจกต์
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
              <Label className="text-xs text-slate-200 font-medium">วันที่ออกกำลังกาย</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9"
                required
              />
            </div>
          </div>

          {/* Exercise Selector / Searchable */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-200 font-medium flex items-center justify-between">
              <span>เลือกท่า / กิจกรรมจากคลังออกกำลังกาย</span>
              {selectedExercise && (
                <span className="text-[10px] text-emerald-400">
                  {selectedExercise.category}
                </span>
              )}
            </Label>

            {/* Quick search input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="พิมพ์ค้นหาท่า เช่น วิ่ง, สควอท, เบนช์เพรส, เดินชัน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-[#0b0f19] border-[#26334d] text-white text-xs h-9"
              />
            </div>

            {/* Dropdown list if searching */}
            {searchTerm && (
              <div className="max-h-36 overflow-y-auto bg-[#0e1526] border border-[#26334d] rounded-lg divide-y divide-[#26334d] text-xs">
                {filteredExercises.length === 0 ? (
                  <div className="p-2 text-slate-400 text-center">ไม่พบกิจกรรมที่ค้นหา</div>
                ) : (
                  filteredExercises.slice(0, 6).map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => handleSelectExercise(ex)}
                      className="w-full text-left p-2 hover:bg-slate-800/60 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white">{ex.name}</div>
                        <span className="text-[10px] text-slate-400">{ex.category} • ~{ex.burnRateKcalPerMin} kcal/นาที</span>
                      </div>
                      <Badge className="text-[9px] bg-slate-800 border-slate-700">เลือก</Badge>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected Exercise Badge */}
            <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                  {customExerciseName || "ยังไม่ได้เลือกท่า"}
                </span>
                {selectedExercise && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    โฟกัส: {selectedExercise.targetMuscles}
                  </p>
                )}
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">
                ~{selectedExercise?.burnRateKcalPerMin || 6} kcal/นาที
              </Badge>
            </div>
          </div>

          {/* Duration & Burned Calories */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200 font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                ระยะเวลา (นาที)
              </Label>
              <Input
                type="number"
                min={1}
                max={300}
                value={durationMinutes}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9 font-bold text-center"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200 font-medium flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                แคลอรี่ที่เผาผลาญ (kcal)
              </Label>
              <Input
                type="number"
                min={0}
                max={3000}
                value={burnedCalories}
                onChange={(e) => setBurnedCalories(Number(e.target.value))}
                className="bg-[#0b0f19] border-[#26334d] text-amber-300 text-xs h-9 font-bold text-center"
                required
              />
            </div>
          </div>

          {/* Strength details if Weight Training */}
          {isWeightTraining && (
            <div className="p-3 rounded-xl bg-[#0b0f19] border border-[#26334d] space-y-2">
              <Label className="text-xs text-slate-300 font-medium block">
                บันทึกเซ็ตและน้ำหนักที่ยก (Strength Log)
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">เซ็ต (Sets)</span>
                  <Input
                    type="number"
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value))}
                    placeholder="เช่น 4"
                    className="bg-[#111726] border-[#26334d] text-white text-xs h-8 text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">ครั้ง (Reps)</span>
                  <Input
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(Number(e.target.value))}
                    placeholder="เช่น 12"
                    className="bg-[#111726] border-[#26334d] text-white text-xs h-8 text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">น้ำหนัก (กก.)</span>
                  <Input
                    type="number"
                    step={0.5}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    placeholder="เช่น 50"
                    className="bg-[#111726] border-[#26334d] text-white text-xs h-8 text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cardio distance if Cardio */}
          {isCardio && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-200 font-medium">ระยะทาง (กิโลเมตร)</Label>
                <Input
                  type="number"
                  step={0.1}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  placeholder="เช่น 5.2"
                  className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-200 font-medium">ความหนัก (Intensity)</Label>
                <select
                  value={intensity}
                  onChange={(e: any) => setIntensity(e.target.value)}
                  className="w-full h-9 rounded-md bg-[#0b0f19] border border-[#26334d] px-3 text-xs text-white"
                >
                  <option value="เบา (Light)">เบา (Light / โซน 1)</option>
                  <option value="ปานกลาง (Moderate)">ปานกลาง (Moderate / โซน 2)</option>
                  <option value="หนัก (High/Intense)">หนัก (High / โซน 3-4)</option>
                </select>
              </div>
            </div>
          )}

          {/* Quick Step Count Input (Feature request) */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-[#0b1424] to-[#121c2e] border border-indigo-500/30 space-y-1.5">
            <Label className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5">
              <Footprints className="h-4 w-4 text-indigo-400" />
              จดบันทึกก้าวเดินประจำวันนี้ (Daily Steps)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                placeholder="เช่น 8,500 หรือ 10,000 ก้าว"
                className="bg-[#0b0f19] border-[#26334d] text-white text-xs h-9 font-bold"
              />
              <div className="text-[11px] text-slate-400 shrink-0 font-mono">
                {steps && Number(steps) > 0
                  ? `~${(Number(steps) * 0.00075).toFixed(1)} กม. (${Math.round(Number(steps) * 0.035)} kcal)`
                  : "ก้าว"}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-200 font-medium">บันทึกเพิ่มเติม / ความรู้สึก</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น เหงื่อออกเยอะมาก รู้สึกแรงดี หรือเจ็บกล้ามเนื้อเล็กน้อย..."
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
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 shadow-md shadow-emerald-950"
            >
              {saving ? "กำลังบันทึกลงชีต..." : "+ บันทึกการออกกำลังกาย"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
