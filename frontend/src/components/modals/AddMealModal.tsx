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
import { SearchableSelect } from "@/components/ui/searchable-select"
import { toast } from "sonner"
import { Sparkles, Calculator, Minus, Plus, Trash2, Layers, Utensils } from "lucide-react"

interface AddMealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (meal: any) => Promise<void>
  foods: any[]
  defaultPerson?: string
  initialFood?: any
  initialDate?: string
}

const MEAL_TYPES = [
  "01. มื้อเช้า",
  "02. มื้อกลางวัน",
  "03. มื้อว่างบ่าย",
  "04. มื้อเย็น",
  "05. อื่นๆ / อาหารเสริม",
]

interface MealEntryItem {
  id: string
  mealType: string
  selectedFoodId: string
  foodName: string
  servings: number | string
  baseCalories: number | ""
  baseProtein: number | ""
  baseCarbs: number | ""
  baseFat: number | ""
  calories: number | string
  protein: number | string
  carbs: number | string
  fat: number | string
  notes: string
}

const createDefaultEntry = (idSuffix: string | number, mealType = "01. มื้อเช้า"): MealEntryItem => ({
  id: "meal-item-" + Date.now() + "-" + idSuffix,
  mealType,
  selectedFoodId: "",
  foodName: "",
  servings: 1,
  baseCalories: 350,
  baseProtein: 25,
  baseCarbs: 40,
  baseFat: 10,
  calories: 350,
  protein: 25,
  carbs: 40,
  fat: 10,
  notes: "",
})

export function AddMealModal({
  open,
  onOpenChange,
  onSave,
  foods,
  defaultPerson = "ฝ่ายชาย",
  initialFood = null,
  initialDate = "",
}: AddMealModalProps) {
  const todayStr = new Date().toLocaleDateString("en-CA")
  const [date, setDate] = React.useState(initialDate || todayStr)
  const [person, setPerson] = React.useState(defaultPerson)
  const [items, setItems] = React.useState<MealEntryItem[]>([createDefaultEntry(1, "01. มื้อเช้า")])
  const [saving, setSaving] = React.useState(false)

  // Options for Food DB searchable dropdown
  const foodOptions = React.useMemo(() => {
    return foods.map((f) => ({
      value: String(f.id || f.code || f.name),
      label: `${f.name} [${f.category}] • ${f.calories} kcal (P: ${f.protein}g, C: ${f.carbs}g, F: ${f.fat}g)`
    }))
  }, [foods])

  // Helper to update a specific item
  const updateItem = React.useCallback((id: string, updates: Partial<MealEntryItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }, [])

  // Apply food data to an item
  const applyFoodToItem = React.useCallback((itemId: string, f: any, currentServings: number | string) => {
    const bCal = parseFloat(String(f.calories || f.Calories || 0)) || 0
    const bProt = parseFloat(String(f.protein || f.Protein || 0)) || 0
    const bCarb = parseFloat(String(f.carbs || f.Carbs || 0)) || 0
    const bFat = parseFloat(String(f.fat || f.Fat || 0)) || 0
    const servNum = typeof currentServings === "number" ? currentServings : (parseFloat(String(currentServings)) || 1)

    updateItem(itemId, {
      selectedFoodId: String(f.id || f.code || f.name || ""),
      foodName: f.name || f.Name || "",
      baseCalories: bCal,
      baseProtein: bProt,
      baseCarbs: bCarb,
      baseFat: bFat,
      calories: Math.round(bCal * servNum),
      protein: Number((bProt * servNum).toFixed(1)),
      carbs: Number((bCarb * servNum).toFixed(1)),
      fat: Number((bFat * servNum).toFixed(1)),
      notes: f.servingSize ? `ขนาดเสิร์ฟมาตรฐาน: ${f.servingSize}` : "",
    })
  }, [updateItem])

  // Reset or initialize on open
  React.useEffect(() => {
    if (open) {
      setPerson(defaultPerson === "ALL" ? "ฝ่ายชาย" : defaultPerson)
      setDate(initialDate || todayStr)

      if (initialFood) {
        const first = createDefaultEntry(1, "01. มื้อเช้า")
        first.selectedFoodId = String(initialFood.id || initialFood.code || initialFood.name || "")
        const bCal = parseFloat(String(initialFood.calories || initialFood.Calories || 0)) || 0
        const bProt = parseFloat(String(initialFood.protein || initialFood.Protein || 0)) || 0
        const bCarb = parseFloat(String(initialFood.carbs || initialFood.Carbs || 0)) || 0
        const bFat = parseFloat(String(initialFood.fat || initialFood.Fat || 0)) || 0

        first.baseCalories = bCal
        first.baseProtein = bProt
        first.baseCarbs = bCarb
        first.baseFat = bFat
        first.calories = Math.round(bCal)
        first.protein = Number(bProt.toFixed(1))
        first.carbs = Number(bCarb.toFixed(1))
        first.fat = Number(bFat.toFixed(1))
        first.foodName = initialFood.name || initialFood.Name || ""
        if (initialFood.servingSize) {
          first.notes = `ขนาดเสิร์ฟมาตรฐาน: ${initialFood.servingSize}`
        }
        setItems([first])
      } else {
        setItems([createDefaultEntry(1, "01. มื้อเช้า")])
      }
    }
  }, [open, defaultPerson, initialFood, initialDate, todayStr])

  // Add new food item entry (for logging multiple meals / foods together)
  const handleAddItem = (presetMealType?: string) => {
    const lastItem = items[items.length - 1]
    let nextMealType = presetMealType
    if (!nextMealType && lastItem) {
      const idx = MEAL_TYPES.indexOf(lastItem.mealType)
      if (idx >= 0 && idx < MEAL_TYPES.length - 1) {
        nextMealType = MEAL_TYPES[idx + 1]
      } else {
        nextMealType = lastItem.mealType
      }
    }
    const newItem = createDefaultEntry(items.length + 1, nextMealType || "02. มื้อกลางวัน")
    setItems((prev) => [...prev, newItem])
    toast.info(`เพิ่มกล่องรายการอาหารที่ #${items.length + 1} แล้ว`, {
      description: "สามารถเลือกเมนูหรือกรอกหลายมื้อพร้อมกันได้ทันที",
      duration: 2500,
    })
  }

  // Remove an item entry
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.warning("ต้องมีรายการอาหารอย่างน้อย 1 รายการ")
      return
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Handle food selection from dropdown for a specific item
  const handleSelectFoodForItem = (itemId: string, foodId: string) => {
    if (!foodId) {
      updateItem(itemId, { selectedFoodId: "" })
      return
    }
    const f = foods.find((item) => String(item.id || item.code || item.name) === String(foodId))
    if (f) {
      const curItem = items.find((it) => it.id === itemId)
      const servNum = curItem ? (typeof curItem.servings === "number" ? curItem.servings : (parseFloat(String(curItem.servings)) || 1)) : 1
      applyFoodToItem(itemId, f, servNum)
    }
  }

  // Handle changing servings for a specific item
  const handleServingsChangeForItem = (itemId: string, newServings: number | string) => {
    const curItem = items.find((it) => it.id === itemId)
    if (!curItem) return

    const servNum = typeof newServings === "number" ? newServings : parseFloat(String(newServings))
    if (!isNaN(servNum) && servNum > 0) {
      const curServ = typeof curItem.servings === "number" ? curItem.servings : (parseFloat(String(curItem.servings)) || 1)
      const bCal = curItem.baseCalories !== "" ? Number(curItem.baseCalories) : (curItem.calories !== "" ? Number(curItem.calories) / curServ : 0)
      const bProt = curItem.baseProtein !== "" ? Number(curItem.baseProtein) : (curItem.protein !== "" ? Number(curItem.protein) / curServ : 0)
      const bCarb = curItem.baseCarbs !== "" ? Number(curItem.baseCarbs) : (curItem.carbs !== "" ? Number(curItem.carbs) / curServ : 0)
      const bFat = curItem.baseFat !== "" ? Number(curItem.baseFat) : (curItem.fat !== "" ? Number(curItem.fat) / curServ : 0)

      updateItem(itemId, {
        servings: newServings,
        calories: Math.round(bCal * servNum),
        protein: Number((bProt * servNum).toFixed(1)),
        carbs: Number((bCarb * servNum).toFixed(1)),
        fat: Number((bFat * servNum).toFixed(1)),
      })
    } else {
      updateItem(itemId, { servings: newServings })
    }
  }

  // Direct manual edits to total nutrients update base accordingly
  const handleNutrientChange = (
    itemId: string,
    field: "calories" | "protein" | "carbs" | "fat",
    val: number | string
  ) => {
    const curItem = items.find((it) => it.id === itemId)
    if (!curItem) return
    const servNum = typeof curItem.servings === "number" ? curItem.servings : (parseFloat(String(curItem.servings)) || 1)
    const num = Number(val)

    if (field === "calories") {
      const baseVal = (!isNaN(num) && servNum > 0) ? Math.round(num / servNum) : ""
      updateItem(itemId, { calories: val === "" ? "" : num, baseCalories: baseVal })
    } else if (field === "protein") {
      const baseVal = (!isNaN(num) && servNum > 0) ? Number((num / servNum).toFixed(1)) : ""
      updateItem(itemId, { protein: val === "" ? "" : val, baseProtein: baseVal })
    } else if (field === "carbs") {
      const baseVal = (!isNaN(num) && servNum > 0) ? Number((num / servNum).toFixed(1)) : ""
      updateItem(itemId, { carbs: val === "" ? "" : val, baseCarbs: baseVal })
    } else if (field === "fat") {
      const baseVal = (!isNaN(num) && servNum > 0) ? Number((num / servNum).toFixed(1)) : ""
      updateItem(itemId, { fat: val === "" ? "" : val, baseFat: baseVal })
    }
  }

  // Combined totals of all items in this modal
  const totalCalories = items.reduce((sum, it) => sum + (Number(it.calories) || 0), 0)
  const totalProtein = Number(items.reduce((sum, it) => sum + (Number(it.protein) || 0), 0).toFixed(1))
  const totalCarbs = Number(items.reduce((sum, it) => sum + (Number(it.carbs) || 0), 0).toFixed(1))
  const totalFat = Number(items.reduce((sum, it) => sum + (Number(it.fat) || 0), 0).toFixed(1))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that all items have a food name
    const invalidIndex = items.findIndex((it) => !it.foodName.trim())
    if (invalidIndex >= 0) {
      toast.warning(`กรุณาระบุชื่ออาหารในรายการที่ #${invalidIndex + 1}`)
      return
    }

    setSaving(true)
    try {
      const mealEntries = items.map((it) => {
        const finalServings = typeof it.servings === "number" ? it.servings : (parseFloat(String(it.servings)) || 1)
        return {
          date,
          person,
          mealType: it.mealType,
          foodName: it.foodName.trim(),
          servings: finalServings,
          calories: Number(it.calories) || 0,
          protein: Number(it.protein) || 0,
          carbs: Number(it.carbs) || 0,
          fat: Number(it.fat) || 0,
          notes: it.notes.trim(),
        }
      })

      // If 1 item, pass single object or array
      if (mealEntries.length === 1) {
        await onSave(mealEntries[0])
      } else {
        await onSave(mealEntries)
      }

      toast.success(
        mealEntries.length > 1
          ? `บันทึกครบทั้ง ${mealEntries.length} รายการอาหารลง Google Sheets สำเร็จ!`
          : `บันทึกมื้ออาหารลงใน Google Sheets สำเร็จ!`,
        {
          description: `รวม ${totalCalories} kcal (P: ${totalProtein}g, C: ${totalCarbs}g, F: ${totalFat}g)`
        }
      )

      onOpenChange(false)
      setItems([createDefaultEntry(1, "01. มื้อเช้า")])
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#151d2f] border-[#26334d] text-slate-100 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <span>🍽️</span> บันทึกมื้ออาหารลงชีต (จดบันทึก)
            </DialogTitle>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
              {items.length > 1 ? `${items.length} รายการ (บันทึกพร้อมกัน)` : "1 รายการ"}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-4 py-2">
          {/* Top Controls: Person and Date */}
          <div className="p-3 bg-[#0b0f19] rounded-xl border border-[#26334d] space-y-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">ผู้รับประทาน</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPerson("ฝ่ายชาย")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    person === "ฝ่ายชาย"
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950"
                      : "bg-[#111726] border-[#26334d] text-slate-400 hover:text-white"
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
                      : "bg-[#111726] border-[#26334d] text-slate-400 hover:text-white"
                  }`}
                >
                  <span>🧘‍♀️</span> ฝ่ายหญิง
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">วันที่รับประทาน</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="bg-[#111726] border-[#26334d] text-white h-9 text-sm font-mono"
              />
            </div>
          </div>

          {/* Quick Add Another Meal Button Header (ตำแหน่งในภาพที่ผู้ใช้วงกรอบสีแดง!) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                รายการอาหาร ({items.length} รายการ)
              </span>
            </div>

            {/* BUTTON EXACTLY IN RED BOX REGION */}
            <Button
              type="button"
              size="sm"
              onClick={() => handleAddItem()}
              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/60 border border-emerald-400/40 transition-all rounded-lg"
              title="เพิ่มกล่องรายการอาหารอีก เผื่อกรอกหลายมื้อตอนเย็นทีเดียว"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>+ เพิ่มมื้อ/รายการอาหารอีก</span>
            </Button>
          </div>

          {/* Dynamic List of Meal Entry Items */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-gradient-to-br from-[#0e1526] to-[#12192c] border border-emerald-500/30 space-y-3.5 shadow-md relative"
              >
                {/* Item Card Header */}
                <div className="flex items-center justify-between border-b border-[#26334d]/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                      #{index + 1}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-200">
                      {item.foodName || "รายการใหม่"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Meal Type Selector for each item */}
                    <select
                      value={item.mealType}
                      onChange={(e) => updateItem(item.id, { mealType: e.target.value })}
                      className="h-8 rounded-lg bg-[#0b0f19] border border-[#26334d] px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      {MEAL_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>

                    {/* Delete Item Button (shows when > 1 item) */}
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Quick select from Food DB with Type to Search */}
                {foods.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <span>🔍</span> เลือกด่วนจากคลังเมนูอาหาร:
                      </Label>
                      <span className="text-[10px] text-slate-400">พิมพ์ค้นหาได้</span>
                    </div>
                    <SearchableSelect
                      options={foodOptions}
                      value={item.selectedFoodId}
                      onChange={(val) => handleSelectFoodForItem(item.id, val)}
                      placeholder="-- พิมพ์ชื่อเมนูอาหารเพื่อเลือกด่วน --"
                      searchPlaceholder="พิมพ์ค้นหา เช่น อกไก่, ข้าวสวย, ไข่เจียว, หมาล่าอี้จา..."
                    />
                  </div>
                )}

                {/* Food Name & Servings Multiplier */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-slate-300 text-xs">ชื่อรายการอาหาร *</Label>
                    <Input
                      placeholder="เช่น ข้าวกล้องอกไก่ต้ม"
                      value={item.foodName}
                      onChange={(e) => updateItem(item.id, { foodName: e.target.value })}
                      required
                      className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm"
                    />
                  </div>

                  {/* Servings Multiplier */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 text-xs font-semibold flex items-center gap-1">
                        <Calculator className="h-3 w-3 text-emerald-400" />
                        จำนวน (เสิร์ฟ)
                      </Label>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        {typeof item.servings === "number" ? `×${item.servings}` : "×1"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const current = typeof item.servings === "number" ? item.servings : (parseFloat(String(item.servings)) || 1)
                          const nextVal = Math.max(0.5, Math.round((current - 0.5) * 100) / 100)
                          handleServingsChangeForItem(item.id, nextVal)
                        }}
                        className="h-9 w-8 p-0 border-[#26334d] bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 shrink-0"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={item.servings}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === "" || /^\d*\.?\d*$/.test(val)) {
                            handleServingsChangeForItem(item.id, val)
                          }
                        }}
                        onBlur={() => {
                          if (item.servings === "" || Number(item.servings) <= 0) {
                            handleServingsChangeForItem(item.id, 1)
                          }
                        }}
                        className="bg-[#0b0f19] border-[#26334d] text-white h-9 text-sm text-center font-bold font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const current = typeof item.servings === "number" ? item.servings : (parseFloat(String(item.servings)) || 1)
                          const nextVal = Math.round((current + 0.5) * 100) / 100
                          handleServingsChangeForItem(item.id, nextVal)
                        }}
                        className="h-9 w-8 p-0 border-[#26334d] bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Quick serving presets */}
                    <div className="flex items-center gap-1 pt-0.5">
                      {[0.5, 1, 1.5, 2, 2.5, 3].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleServingsChangeForItem(item.id, val)}
                          className={`flex-1 py-0.5 text-[10px] font-semibold rounded transition-all ${
                            Number(item.servings) === val
                              ? "bg-emerald-600 text-white font-bold"
                              : "bg-[#0b0f19] text-slate-400 hover:text-white border border-[#26334d]/60"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Multiplied Nutrients for this item */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-[11px]">แคลอรี่ (kcal)</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={item.calories}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || /^\d*$/.test(val)) {
                          handleNutrientChange(item.id, "calories", val)
                        }
                      }}
                      className="bg-[#0b0f19] border-[#26334d] text-white h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-emerald-400 text-[11px]">โปรตีน (g)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={item.protein}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          handleNutrientChange(item.id, "protein", val)
                        }
                      }}
                      className="bg-[#0b0f19] border-[#26334d] text-white h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-amber-400 text-[11px]">คาร์บ (g)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={item.carbs}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          handleNutrientChange(item.id, "carbs", val)
                        }
                      }}
                      className="bg-[#0b0f19] border-[#26334d] text-white h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-rose-400 text-[11px]">ไขมัน (g)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={item.fat}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          handleNutrientChange(item.id, "fat", val)
                        }
                      }}
                      className="bg-[#0b0f19] border-[#26334d] text-white h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Notes for this item */}
                <div className="space-y-1">
                  <Input
                    placeholder="บันทึกเพิ่มเติมของรายการนี้ (เช่น กินเที่ยงครึ่ง, ไม่ใส่น้ำตาล)"
                    value={item.notes}
                    onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                    className="bg-[#0b0f19] border-[#26334d] text-slate-300 h-8 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Add Another Meal Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleAddItem()}
            className="w-full border-dashed border-emerald-500/50 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-600 hover:text-white h-9 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ เพิ่มรายการอาหารอีก (สำหรับกรอกหลายมื้อตอนเย็นทีเดียว)</span>
          </Button>

          {/* Overall Total Summary Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0d1424] to-[#141b2f] border-2 border-emerald-500/40 text-xs space-y-2 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                สรุปสารอาหารรวมทั้งหมด ({items.length} รายการ):
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono">
                {person} • {date}
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2 bg-[#0b0f19] rounded-lg border border-[#26334d]">
                <span className="text-[10px] text-slate-400 block font-sans">แคลอรี่รวม</span>
                <span className="text-emerald-400 font-bold text-base">{totalCalories}</span>
                <span className="text-[9px] text-slate-500 block font-sans">kcal</span>
              </div>
              <div className="p-2 bg-[#0b0f19] rounded-lg border border-[#26334d]">
                <span className="text-[10px] text-slate-400 block font-sans">โปรตีนรวม</span>
                <span className="text-emerald-300 font-bold text-base">{totalProtein}</span>
                <span className="text-[9px] text-slate-500 block font-sans">กรัม</span>
              </div>
              <div className="p-2 bg-[#0b0f19] rounded-lg border border-[#26334d]">
                <span className="text-[10px] text-slate-400 block font-sans">คาร์บรวม</span>
                <span className="text-amber-300 font-bold text-base">{totalCarbs}</span>
                <span className="text-[9px] text-slate-500 block font-sans">กรัม</span>
              </div>
              <div className="p-2 bg-[#0b0f19] rounded-lg border border-[#26334d]">
                <span className="text-[10px] text-slate-400 block font-sans">ไขมันรวม</span>
                <span className="text-rose-300 font-bold text-base">{totalFat}</span>
                <span className="text-[9px] text-slate-500 block font-sans">กรัม</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
            >
              {saving
                ? "กำลังบันทึกลงชีต..."
                : `บันทึกลงชีต (ทั้งหมด ${items.length} รายการ • ${totalCalories} kcal)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
