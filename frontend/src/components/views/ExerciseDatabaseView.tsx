import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ExerciseItem,
  getExerciseDatabase,
} from "@/lib/exerciseDatabase"
import { AddCustomExerciseModal } from "@/components/modals/AddCustomExerciseModal"
import {
  Dumbbell,
  Search,
  Plus,
  Flame,
  Activity,
  Zap,
  Target,
  Sparkles,
  Info,
} from "lucide-react"

interface ExerciseDatabaseViewProps {
  onQuickLogWorkout: (exercise: ExerciseItem) => void
  onOpenAddWorkout: () => void
}

export function ExerciseDatabaseView({
  onQuickLogWorkout,
  onOpenAddWorkout,
}: ExerciseDatabaseViewProps) {
  const [exercises, setExercises] = React.useState<ExerciseItem[]>(getExerciseDatabase)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL")
  const [addCustomModalOpen, setAddCustomModalOpen] = React.useState(false)

  const reloadExercises = () => {
    setExercises(getExerciseDatabase())
  }

  // Filter exercises
  const filtered = exercises.filter((ex) => {
    const matchSearch =
      !searchTerm ||
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.targetMuscles.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.tips.toLowerCase().includes(searchTerm.toLowerCase())

    const matchCategory =
      selectedCategory === "ALL" || ex.category.includes(selectedCategory)

    return matchSearch && matchCategory
  })

  const categories = [
    { key: "ALL", label: "ทั้งหมด" },
    { key: "คาร์ดิโอ", label: "🏃 คาร์ดิโอ" },
    { key: "อก", label: "💪 เวท - อก" },
    { key: "หลัง", label: "🏋️ เวท - หลัง" },
    { key: "ขา", label: "🦵 เวท - ขา & ก้น" },
    { key: "ไหล่", label: "🛡️ เวท - ไหล่ & ท้อง" },
    { key: "ก้าวเดิน", label: "🚶 ก้าวเดิน" },
    { key: "ยืดเหยียด", label: "🧘 ยืดเหยียด & โยคะ" },
  ]

  const getCategoryBadgeClass = (cat: string) => {
    if (cat.includes("คาร์ดิโอ")) return "bg-orange-500/20 text-orange-300 border-orange-500/30"
    if (cat.includes("อก")) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    if (cat.includes("หลัง")) return "bg-blue-500/20 text-blue-300 border-blue-500/30"
    if (cat.includes("ขา")) return "bg-purple-500/20 text-purple-300 border-purple-500/30"
    if (cat.includes("ไหล่")) return "bg-amber-500/20 text-amber-300 border-amber-500/30"
    if (cat.includes("ก้าวเดิน")) return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
    return "bg-teal-500/20 text-teal-300 border-teal-500/30"
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-emerald-400" />
            คลังข้อมูลออกกำลังกาย (Exercise Library)
          </h1>
          <p className="text-slate-400 text-sm">
            รวบรวมท่าเวทเทรนนิ่ง คาร์ดิโอ และกิจกรรมนับก้าว พร้อมอัตราการเผาผลาญแคลอรี่และกล้ามเนื้อเป้าหมาย
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setAddCustomModalOpen(true)}
            variant="outline"
            className="border-[#26334d] text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-9 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            + เพิ่มท่าใหม่ลงคลัง
          </Button>

          <Button
            onClick={onOpenAddWorkout}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 px-3 shadow-md shadow-emerald-950 flex items-center gap-1.5"
          >
            <Activity className="h-3.5 w-3.5" />
            + บันทึกการออกกำลังกาย
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-[#151d2f] border-[#26334d]">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหาชื่อท่า, กล้ามเนื้อที่เน้น (เช่น อก, ขา, ก้น, วิ่ง, สควอท)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#0b0f19] border-[#26334d] text-white text-sm h-9"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCategory === c.key
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950 font-semibold"
                    : "bg-[#0b0f19] text-slate-400 border border-[#26334d] hover:text-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-[#26334d] rounded-2xl">
            <p className="text-sm">ไม่พบท่าหรือกิจกรรมออกกำลังกายที่ตรงกับเงื่อนไข</p>
            <Button
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("ALL")
              }}
              variant="link"
              className="text-xs text-emerald-400 mt-1"
            >
              ล้างการค้นหาทั้งหมด
            </Button>
          </div>
        ) : (
          filtered.map((item) => (
            <Card
              key={item.id}
              className="bg-[#151d2f] border-[#26334d] hover:border-emerald-500/40 transition-all flex flex-col justify-between overflow-hidden shadow-md group"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge className={`text-[10px] px-2 py-0.5 border ${getCategoryBadgeClass(item.category)}`}>
                    {item.category}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <Flame className="h-3 w-3 text-orange-400" />
                    ~{item.burnRateKcalPerMin} kcal/นาที
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-white pt-2 group-hover:text-emerald-400 transition-colors">
                  {item.name}
                </CardTitle>
                <div className="text-xs text-slate-300 flex items-center gap-1 pt-1">
                  <Target className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">กล้ามเนื้อ: {item.targetMuscles}</span>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-1 space-y-3">
                {item.tips && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 bg-[#0b0f19] p-2 rounded-lg border border-[#26334d]/70 flex items-start gap-1.5">
                    <Info className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item.tips}</span>
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-[#26334d]/60">
                  <span className="text-[10px] text-slate-500 font-mono">
                    30 นาที ~ {item.burnRateKcalPerMin * 30} kcal
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onQuickLogWorkout(item)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-2.5 font-medium flex items-center gap-1 shadow-sm"
                  >
                    <Zap className="h-3 w-3" />
                    บันทึกกิจกรรมนี้
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Custom Exercise Modal */}
      <AddCustomExerciseModal
        open={addCustomModalOpen}
        onOpenChange={setAddCustomModalOpen}
        onSaved={reloadExercises}
      />
    </div>
  )
}
