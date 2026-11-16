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
import { Flame, Target, Utensils, Sparkles, RefreshCcw } from "lucide-react"
import {
  AllCalorieSettings,
  PersonCalorieSettings,
  getCalorieSettings,
  saveCalorieSettings,
  DEFAULT_CALORIE_SETTINGS,
  getIntakeTarget,
} from "@/lib/calorieSettings"
import { callGasApi } from "@/api/gasClient"
import { toast } from "sonner"

interface CalorieSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPerson?: string
  onSaved?: (newSettings: AllCalorieSettings) => void
}

export function CalorieSettingsModal({
  open,
  onOpenChange,
  currentPerson = "ฝ่ายชาย",
  onSaved,
}: CalorieSettingsModalProps) {
  const [activeTab, setActiveTab] = React.useState<"male" | "female">(
    currentPerson === "ฝ่ายหญิง" ? "female" : "male"
  )
  const [settings, setSettings] = React.useState<AllCalorieSettings>(getCalorieSettings)

  React.useEffect(() => {
    if (open) {
      setSettings(getCalorieSettings())
      setActiveTab(currentPerson === "ฝ่ายหญิง" ? "female" : "male")
    }
  }, [open, currentPerson])

  const currentPersonSettings: PersonCalorieSettings = settings[activeTab]

  const updateCurrentPerson = (fields: Partial<PersonCalorieSettings>) => {
    setSettings((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        ...fields,
      },
    }))
  }

  const handleMaintenanceChange = (val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0)
    updateCurrentPerson({ maintenance: num })
  }

  const handleDeficitChange = (val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0)
    updateCurrentPerson({ deficit: num })
  }

  const handleDeficitPreset = (presetDeficit: number) => {
    updateCurrentPerson({ deficit: presetDeficit })
  }

  const intakeLimit = getIntakeTarget(currentPersonSettings)
  const weeklyDeficit = currentPersonSettings.deficit * 7
  const monthlyDeficit = currentPersonSettings.deficit * 30
  const monthlyFatKg = (monthlyDeficit / 7500).toFixed(2)

  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    setSaving(true)
    saveCalorieSettings(settings)
    try {
      await callGasApi("SAVE_CALORIE_SETTINGS", settings)
      toast.success(`บันทึกเป้าหมายลง Google Sheets และซิงค์ทุกอุปกรณ์สำเร็จ!`, {
        description: `ฝ่ายชาย: เป้าโปรตีน ${settings.male.protein}g | ฝ่ายหญิง: เป้าโปรตีน ${settings.female.protein}g`,
      })
    } catch (err) {
      toast.info("บันทึกในเครื่องเรียบร้อย (ซิงค์ชีตเบื้องหลัง)")
    } finally {
      setSaving(false)
      if (onSaved) {
        onSaved(settings)
      }
      onOpenChange(false)
    }
  }

  const handleReset = () => {
    const defaultVal = DEFAULT_CALORIE_SETTINGS[activeTab]
    updateCurrentPerson(defaultVal)
    toast.info(`คืนค่าเริ่มต้นสำหรับ ${activeTab === "male" ? "ฝ่ายชาย" : "ฝ่ายหญิง"}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#111726] border-[#26334d] text-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
            <Flame className="h-5 w-5 text-amber-400" />
            ตั้งค่าแคลอรี่เผาผลาญและเป้าหมายตัดทอน (TDEE & Deficit)
          </DialogTitle>
          <p className="text-xs text-slate-400">
            กำหนดอัตราเผาผลาญต่อวันและเป้าตัดทอนแคลอรี่ เพื่อคำนวณโควต้าอาหารที่ควรกินในแต่ละวัน
          </p>
        </DialogHeader>

        {/* Person Selector Tabs */}
        <div className="flex rounded-xl bg-[#0b0f19] p-1 border border-[#26334d] my-1">
          <button
            type="button"
            onClick={() => setActiveTab("male")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "male"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🏋️‍♂️</span> ฝ่ายชาย (Male)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("female")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "female"
                ? "bg-pink-600 text-white shadow-md shadow-pink-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🧘‍♀️</span> ฝ่ายหญิง (Female)
          </button>
        </div>

        <div className="space-y-4 py-2">
          {/* 1. Maintenance Calories (TDEE) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                แคลอรี่เผาผลาญต่อวัน (Daily Maintenance / TDEE)
              </Label>
              <span className="text-[11px] text-slate-400 font-mono">kcal / วัน</span>
            </div>
            <Input
              type="number"
              min={800}
              max={5000}
              step={50}
              value={currentPersonSettings.maintenance || ""}
              onChange={(e) => handleMaintenanceChange(e.target.value)}
              placeholder="เช่น 2000"
              className="bg-[#0b0f19] border-[#26334d] text-white text-base font-bold text-center h-11 focus:ring-1 focus:ring-amber-400"
            />
            <p className="text-[11px] text-slate-400">
              พลังงานที่ร่างกายเผาผลาญทั้งหมดต่อวัน (BMR + ทำงาน + ออกกำลังกาย)
            </p>
          </div>

          {/* 2. Calorie Deficit Target */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-400" />
                เป้าหมายตัดทอนแคลอรี่ต่อวัน (Daily Deficit Target)
              </Label>
              <span className="text-[11px] text-slate-400 font-mono">kcal / วัน</span>
            </div>
            <Input
              type="number"
              min={0}
              max={2000}
              step={50}
              value={currentPersonSettings.deficit || ""}
              onChange={(e) => handleDeficitChange(e.target.value)}
              placeholder="เช่น 300"
              className="bg-[#0b0f19] border-[#26334d] text-white text-base font-bold text-center h-11 focus:ring-1 focus:ring-emerald-400"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 mr-1">เลือกด่วน:</span>
              {[200, 300, 500, 750].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDeficitPreset(d)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all ${
                    currentPersonSettings.deficit === d
                      ? "bg-emerald-600 text-white font-bold shadow-sm"
                      : "bg-[#0b0f19] text-slate-300 hover:text-white border border-[#26334d]"
                  }`}
                >
                  -{d} {d === 300 ? "✨" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Live Highlight Box (The User's Core Equation) */}
          <div className="bg-gradient-to-br from-[#0c1626] to-[#121e33] border border-emerald-500/30 p-4 rounded-xl space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Utensils className="h-4 w-4 text-emerald-400" />
                เป้าหมายการกินที่แนะนำต่อวัน
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-semibold">
                โควต้าควรกินไม่เกิน
              </Badge>
            </div>

            <div className="flex items-baseline justify-center gap-2 py-1">
              <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                {intakeLimit.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-slate-300">kcal / วัน</span>
            </div>

            <div className="text-center text-xs text-slate-400 font-mono bg-[#0b0f19]/70 py-1.5 px-3 rounded-lg border border-[#26334d]">
              เผาผลาญ {currentPersonSettings.maintenance.toLocaleString()} - ตัดทอน{" "}
              {currentPersonSettings.deficit.toLocaleString()} ={" "}
              <strong className="text-emerald-300">กินไม่เกิน {intakeLimit.toLocaleString()} kcal</strong>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" />
                ตัดทอนสะสม 30 วัน:
              </span>
              <span className="font-semibold text-emerald-400 font-mono">
                -{monthlyDeficit.toLocaleString()} kcal (~{monthlyFatKg} กก.)
              </span>
            </div>
          </div>

          {/* 4. Macros breakdown */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs text-slate-300 font-medium">
              เป้าหมายสารอาหารหลัก (Macros Targets)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-emerald-400 block mb-0.5">โปรตีน (g)</span>
                <Input
                  type="number"
                  value={currentPersonSettings.protein || ""}
                  onChange={(e) => updateCurrentPerson({ protein: Number(e.target.value) || 0 })}
                  className="bg-[#0b0f19] border-[#26334d] text-white text-xs text-center h-8"
                />
              </div>
              <div>
                <span className="text-[10px] text-amber-400 block mb-0.5">คาร์โบไฮเดรต (g)</span>
                <Input
                  type="number"
                  value={currentPersonSettings.carbs || ""}
                  onChange={(e) => updateCurrentPerson({ carbs: Number(e.target.value) || 0 })}
                  className="bg-[#0b0f19] border-[#26334d] text-white text-xs text-center h-8"
                />
              </div>
              <div>
                <span className="text-[10px] text-rose-400 block mb-0.5">ไขมัน (g)</span>
                <Input
                  type="number"
                  value={currentPersonSettings.fat || ""}
                  onChange={(e) => updateCurrentPerson({ fat: Number(e.target.value) || 0 })}
                  className="bg-[#0b0f19] border-[#26334d] text-white text-xs text-center h-8"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-2 border-t border-[#26334d]">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            คืนค่าเริ่มต้น
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#26334d] text-slate-300 hover:text-white text-xs"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 shadow-md shadow-emerald-950"
            >
              บันทึกการตั้งค่า
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
