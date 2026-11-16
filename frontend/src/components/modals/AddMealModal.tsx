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
import { SearchableSelect } from "@/components/ui/searchable-select"
import { toast } from "sonner"
import { Sparkles, Calculator, Minus, Plus } from "lucide-react"

interface AddMealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (meal: any) => Promise<void>
  foods: any[]
  defaultPerson?: string
  initialFood?: any
}

const MEAL_TYPES = [
  "01. มื้อเช้า",
  "02. มื้อกลางวัน",
  "03. มื้อว่างบ่าย",
  "04. มื้อเย็น",
  "05. อื่นๆ / อาหารเสริม",
]

export function AddMealModal({
  open,
  onOpenChange,
  onSave,
  foods,
  defaultPerson = "ฝ่ายชาย",
  initialFood = null,
}: AddMealModalProps) {
  const todayStr = new Date().toISOString().split("T")[0]
  const [date, setDate] = React.useState(todayStr)
  const [person, setPerson] = React.useState(defaultPerson)
  const [mealType, setMealType] = React.useState("01. มื้อเช้า")
  const [selectedFoodId, setSelectedFoodId] = React.useState("")
  const [foodName, setFoodName] = React.useState("")
  const [servings, setServings] = React.useState<number | string>(1)

  // Base nutrients per 1 serving
  const [baseCalories, setBaseCalories] = React.useState<number | "">(350)
  const [baseProtein, setBaseProtein] = React.useState<number | "">(25)
  const [baseCarbs, setBaseCarbs] = React.useState<number | "">(40)
  const [baseFat, setBaseFat] = React.useState<number | "">(10)

  // Total scaled nutrients for this meal entry (base * servings)
  const [calories, setCalories] = React.useState<number | string>(350)
  const [protein, setProtein] = React.useState<number | string>(25)
  const [carbs, setCarbs] = React.useState<number | string>(40)
  const [fat, setFat] = React.useState<number | string>(10)

  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  // Apply food item data
  const applyFoodItem = React.useCallback((f: any, currentServings: number | string) => {
    const bCal = parseFloat(String(f.calories || f.Calories || 0)) || 0
    const bProt = parseFloat(String(f.protein || f.Protein || 0)) || 0
    const bCarb = parseFloat(String(f.carbs || f.Carbs || 0)) || 0
    const bFat = parseFloat(String(f.fat || f.Fat || 0)) || 0

    setBaseCalories(bCal)
    setBaseProtein(bProt)
    setBaseCarbs(bCarb)
    setBaseFat(bFat)

    const servNum = typeof currentServings === "number" ? currentServings : (parseFloat(String(currentServings)) || 1)
    setCalories(Math.round(bCal * servNum))
    setProtein(Number((bProt * servNum).toFixed(1)))
    setCarbs(Number((bCarb * servNum).toFixed(1)))
    setFat(Number((bFat * servNum).toFixed(1)))

    setFoodName(f.name || f.Name || "")
    if (f.servingSize) {
      setNotes((prev) => (prev ? prev : `ขนาดเสิร์ฟมาตรฐาน: ${f.servingSize}`))
    }
  }, [])

  // Effect when modal opens or initialFood changes
  React.useEffect(() => {
    if (open) {
      setPerson(defaultPerson === "ALL" ? "ฝ่ายชาย" : defaultPerson)
      if (initialFood) {
        const foodId = String(initialFood.id || initialFood.code || initialFood.name || "")
        setSelectedFoodId(foodId)
        applyFoodItem(initialFood, 1)
        setServings(1)
      }
    }
  }, [open, defaultPerson, initialFood, applyFoodItem])

  const foodOptions = React.useMemo(() => {
    return foods.map((f) => ({
      value: String(f.id || f.code || f.name),
      label: `${f.name} [${f.category}] • ${f.calories} kcal (P: ${f.protein}g, C: ${f.carbs}g, F: ${f.fat}g)`
    }))
  }, [foods])

  // Handle food selection from dropdown
  const handleSelectFood = (foodId: string) => {
    setSelectedFoodId(foodId)
    if (!foodId) return
    const f = foods.find((item) => String(item.id || item.code || item.name) === String(foodId))
    if (f) {
      applyFoodItem(f, servings)
    }
  }

  // Handle changing servings (multiplies all macros by servings)
  const handleServingsChange = (newServings: number | string) => {
    setServings(newServings)
    const servNum = typeof newServings === "number" ? newServings : parseFloat(String(newServings))
    if (!isNaN(servNum) && servNum > 0) {
      const curServ = typeof servings === "number" ? servings : (parseFloat(String(servings)) || 1)
      const bCal = baseCalories !== "" ? Number(baseCalories) : (calories !== "" ? Number(calories) / curServ : 0)
      const bProt = baseProtein !== "" ? Number(baseProtein) : (protein !== "" ? Number(protein) / curServ : 0)
      const bCarb = baseCarbs !== "" ? Number(baseCarbs) : (carbs !== "" ? Number(carbs) / curServ : 0)
      const bFat = baseFat !== "" ? Number(baseFat) : (fat !== "" ? Number(fat) / curServ : 0)

      setCalories(Math.round(bCal * servNum))
      setProtein(Number((bProt * servNum).toFixed(1)))
      setCarbs(Number((bCarb * servNum).toFixed(1)))
      setFat(Number((bFat * servNum).toFixed(1)))
    }
  }

  // Direct manual edits to total nutrients update base accordingly
  const handleCaloriesChange = (val: number | string) => {
    setCalories(val)
    const num = Number(val)
    const servNum = typeof servings === "number" ? servings : (parseFloat(String(servings)) || 1)
    if (!isNaN(num) && servNum > 0) {
      setBaseCalories(Math.round(num / servNum))
    } else if (val === "") {
      setBaseCalories("")
    }
  }

  const handleProteinChange = (val: number | string) => {
    setProtein(val)
    const num = Number(val)
    const servNum = typeof servings === "number" ? servings : (parseFloat(String(servings)) || 1)
    if (!isNaN(num) && servNum > 0) {
      setBaseProtein(Number((num / servNum).toFixed(1)))
    } else if (val === "") {
      setBaseProtein("")
    }
  }

  const handleCarbsChange = (val: number | string) => {
    setCarbs(val)
    const num = Number(val)
    const servNum = typeof servings === "number" ? servings : (parseFloat(String(servings)) || 1)
    if (!isNaN(num) && servNum > 0) {
      setBaseCarbs(Number((num / servNum).toFixed(1)))
    } else if (val === "") {
      setBaseCarbs("")
    }
  }

  const handleFatChange = (val: number | string) => {
    setFat(val)
    const num = Number(val)
    const servNum = typeof servings === "number" ? servings : (parseFloat(String(servings)) || 1)
    if (!isNaN(num) && servNum > 0) {
      setBaseFat(Number((num / servNum).toFixed(1)))
    } else if (val === "") {
      setBaseFat("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foodName.trim()) {
      toast.warning("กรุณาระบุชื่ออาหาร")
      return
    }

    const finalServings = typeof servings === "number" ? servings : (parseFloat(String(servings)) || 1)
    const finalCalories = Number(calories) || 0
    const finalProtein = Number(protein) || 0
    const finalCarbs = Number(carbs) || 0
    const finalFat = Number(fat) || 0

    setSaving(true)
    try {
      await onSave({
        date,
        person,
        mealType,
        foodName: foodName.trim(),
        servings: finalServings,
        calories: finalCalories,
        protein: finalProtein,
        carbs: finalCarbs,
        fat: finalFat,
        notes: notes.trim(),
      })

      toast.success("บันทึกมื้ออาหารลงใน Google Sheets สำเร็จ!", {
        description: `${foodName} (${finalServings} เสิร์ฟ) • ${finalCalories} kcal (P: ${finalProtein}g, C: ${finalCarbs}g, F: ${finalFat}g)`
      })
      onOpenChange(false)
      setSelectedFoodId("")
      setFoodName("")
      setNotes("")
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#151d2f] border-[#26334d] text-slate-100 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <span>🍽️</span> บันทึกมื้ออาหารลงชีต (จดบันทึก)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-4 py-2">
          {/* Person Selector */}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">ผู้รับประทาน</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPerson("ฝ่ายชาย")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  person === "ฝ่ายชาย"
                    ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950"
                    : "bg-[#0b0f19] border-[#26334d] text-slate-400 hover:text-white"
                }`}
              >
                <span>🏋️‍♂️</span> ฝ่ายชาย
              </button>
              <button
                type="button"
                onClick={() => setPerson("ฝ่ายหญิง")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  person === "ฝ่ายหญิง"
                    ? "bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-950"
                    : "bg-[#0b0f19] border-[#26334d] text-slate-400 hover:text-white"
                }`}
              >
                <span>🧘‍♀️</span> ฝ่ายหญิง
              </button>
            </div>
          </div>

          {/* Quick select from Food DB with Type to Search */}
          {foods.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <span>🔍</span> เลือกด่วนจากคลังเมนูอาหาร (A หน้าเก็บเมนูอาหาร)
                </Label>
                <span className="text-[10px] text-slate-400">พิมพ์ค้นหาได้</span>
              </div>
              <SearchableSelect
                options={foodOptions}
                value={selectedFoodId}
                onChange={handleSelectFood}
                placeholder="-- พิมพ์ชื่อเมนูอาหารเพื่อค้นหาด่วน --"
                searchPlaceholder="พิมพ์ค้นหา เช่น อกไก่, ข้าวสวย, Plante, ไข่ดาว, หมู..."
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">วันที่</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">มื้ออาหาร</Label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full h-9 rounded-md bg-[#0b0f19] border border-[#26334d] px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-slate-300 text-xs">ชื่อรายการอาหาร *</Label>
              <Input
                placeholder="เช่น ข้าวกล้องอกไก่ต้ม"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                required
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>

            {/* Servings Input with Multiplier Controls */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-xs font-semibold flex items-center gap-1">
                  <Calculator className="h-3 w-3 text-emerald-400" />
                  จำนวน (เสิร์ฟ)
                </Label>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {typeof servings === "number" ? `×${servings}` : "×1"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const current = typeof servings === "number" ? servings : (parseFloat(String(servings)) || 1)
                    const nextVal = Math.max(0.5, Math.round((current - 0.5) * 100) / 100)
                    handleServingsChange(nextVal)
                  }}
                  className="h-9 w-8 p-0 border-[#26334d] bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 shrink-0"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  name="meal_servings"
                  value={servings}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                      handleServingsChange(val)
                    }
                  }}
                  onBlur={() => {
                    if (servings === "" || Number(servings) <= 0) {
                      handleServingsChange(1)
                    }
                  }}
                  className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm text-center font-bold font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const current = typeof servings === "number" ? servings : (parseFloat(String(servings)) || 1)
                    const nextVal = Math.round((current + 0.5) * 100) / 100
                    handleServingsChange(nextVal)
                  }}
                  className="h-9 w-8 p-0 border-[#26334d] bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Quick serving buttons */}
              <div className="flex items-center gap-1 pt-0.5">
                {[0.5, 1, 1.5, 2, 2.5, 3].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleServingsChange(val)}
                    className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${
                      Number(servings) === val
                        ? "bg-emerald-600 text-white shadow-sm font-bold"
                        : "bg-[#0b0f19] text-slate-400 hover:text-white border border-[#26334d]/60"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Calculation & Multiplier Summary Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d1424] to-[#141b2f] border border-emerald-500/30 text-xs space-y-2 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                สารอาหารคำนวณคูณตามจำนวน {servings || 1} เสิร์ฟ:
              </span>
              <span className="text-[10px] text-slate-400">
                {baseCalories !== "" ? `ฐาน: ${baseCalories} kcal / เสิร์ฟ` : "กรอกสารอาหาร"}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="p-1.5 bg-[#0b0f19] rounded-lg border border-[#26334d]">
                <span className="text-[10px] text-slate-400 block font-sans">แคลอรี่รวม</span>
                <span className="text-emerald-400 font-bold text-sm">{calories || 0}</span>
                <span className="text-[9px] text-slate-500 block font-sans">
                  {baseCalories !== "" && servings !== 1 ? `${baseCalories} × ${servings}` : "kcal"}
                </span>
              </div>
              <div className="p-1.5 bg-[#0b0f19] rounded-lg border border-[#26334d]">
                <span className="text-[10px] text-slate-400 block font-sans">โปรตีนรวม</span>
                <span className="text-emerald-300 font-bold text-sm">{protein || 0}</span>
                <span className="text-[9px] text-slate-500 block font-sans">
                  {baseProtein !== "" && servings !== 1 ? `${baseProtein} × ${servings}` : "กรัม"}
                </span>
              </div>
              <div className="p-1.5 bg-[#0b0f19] rounded-lg border border-[#26334d]">
                <span className="text-[10px] text-slate-400 block font-sans">คาร์บรวม</span>
                <span className="text-amber-300 font-bold text-sm">{carbs || 0}</span>
                <span className="text-[9px] text-slate-500 block font-sans">
                  {baseCarbs !== "" && servings !== 1 ? `${baseCarbs} × ${servings}` : "กรัม"}
                </span>
              </div>
              <div className="p-1.5 bg-[#0b0f19] rounded-lg border border-[#26334d]">
                <span className="text-[10px] text-slate-400 block font-sans">ไขมันรวม</span>
                <span className="text-rose-300 font-bold text-sm">{fat || 0}</span>
                <span className="text-[9px] text-slate-500 block font-sans">
                  {baseFat !== "" && servings !== 1 ? `${baseFat} × ${servings}` : "กรัม"}
                </span>
              </div>
            </div>
          </div>

          {/* Macros input fields */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">แคลอรี่รวม (kcal)</Label>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                name="meal_calories"
                value={calories}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "" || /^\d*$/.test(val)) {
                    handleCaloriesChange(val === "" ? "" : Number(val))
                  }
                }}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-emerald-400 text-xs">โปรตีนรวม (g)</Label>
              <Input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                name="meal_protein"
                value={protein}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    handleProteinChange(val === "" ? "" : val)
                  }
                }}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-amber-400 text-xs">คาร์บรวม (g)</Label>
              <Input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                name="meal_carbs"
                value={carbs}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    handleCarbsChange(val === "" ? "" : val)
                  }
                }}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-rose-400 text-xs">ไขมันรวม (g)</Label>
              <Input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                name="meal_fat"
                value={fat}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    handleFatChange(val === "" ? "" : val)
                  }
                }}
                className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">บันทึกเพิ่มเติม</Label>
            <Input
              placeholder="เช่น มื้อเที่ยง 12:00 น., ไม่ใส่น้ำตาล"
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
              {saving ? "กำลังบันทึกลงชีต..." : `บันทึกลงชีต (${servings || 1} เสิร์ฟ • ${calories} kcal)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
