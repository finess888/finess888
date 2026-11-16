import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Toaster, toast } from "sonner"
import {
  callGasApi,
  getSavedPasscode,
  setSavedPasscode,
} from "@/api/gasClient"
import { PasscodeGate } from "@/components/views/PasscodeGate"
import { DashboardView } from "@/components/views/DashboardView"
import { MealPlanView } from "@/components/views/MealPlanView"
import { FoodDatabaseView } from "@/components/views/FoodDatabaseView"
import { WeightTrackerView } from "@/components/views/WeightTrackerView"
import { SheetSyncView } from "@/components/views/SheetSyncView"
import { SettingsView } from "@/components/views/SettingsView"
import { AddMealModal } from "@/components/modals/AddMealModal"
import { AddFoodModal } from "@/components/modals/AddFoodModal"
import { AddWeightModal } from "@/components/modals/AddWeightModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  CalendarDays,
  Utensils,
  Scale,
  FileSpreadsheet,
  Settings,
  Menu,
  X,
  LogOut,
  RefreshCw,
  Plus,
  ExternalLink,
} from "lucide-react"

type ViewKey = "dashboard" | "mealplan" | "fooddb" | "weight" | "sheetsync" | "settings"

export default function App() {
  const queryClient = useQueryClient()
  const [passcode, setPasscode] = React.useState<string>(getSavedPasscode())
  const [currentView, setCurrentView] = React.useState<ViewKey>("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  // Modals state
  const [addMealOpen, setAddMealOpen] = React.useState(false)
  const [addFoodOpen, setAddFoodOpen] = React.useState(false)
  const [addWeightOpen, setAddWeightOpen] = React.useState(false)

  // Fetch initial data from GAS Backend
  const {
    data: initialData,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["initialData", passcode],
    queryFn: async () => {
      return await callGasApi<{
        spreadsheetName: string
        meals: any[]
        foods: any[]
        weightLogs: any[]
        rawSheets: any[]
      }>("GET_INITIAL_DATA")
    },
    enabled: !!passcode,
    retry: 1,
  })

  // Handle logout
  const handleLogout = () => {
    setSavedPasscode("")
    setPasscode("")
    toast.info("ออกจากระบบแล้ว")
  }

  // Handle add meal
  const handleSaveMeal = async (newMeal: any) => {
    await callGasApi("ADD_MEAL", newMeal)
    await refetch()
  }

  // Handle toggle meal status
  const handleToggleMealStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "กินแล้ว" ? "ยังไม่ได้กิน" : "กินแล้ว"
    try {
      // Optimistic update
      queryClient.setQueryData(["initialData", passcode], (old: any) => {
        if (!old || !old.meals) return old
        return {
          ...old,
          meals: old.meals.map((m: any) =>
            (m.ID || m.id) === id ? { ...m, Status: nextStatus, status: nextStatus } : m
          ),
        }
      })
      await callGasApi("UPDATE_MEAL_STATUS", { id, status: nextStatus })
      toast.success(`อัปเดตสถานะเป็น "${nextStatus}" เรียบร้อย`)
    } catch (err: any) {
      toast.error("ไม่สามารถอัปเดตสถานะได้: " + err.message)
      refetch()
    }
  }

  // Handle delete meal
  const handleDeleteMeal = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบมื้ออาหารนี้ออกจากแผน?")) return
    try {
      queryClient.setQueryData(["initialData", passcode], (old: any) => {
        if (!old || !old.meals) return old
        return {
          ...old,
          meals: old.meals.filter((m: any) => (m.ID || m.id) !== id),
        }
      })
      await callGasApi("DELETE_MEAL", { id })
      toast.success("ลบมื้ออาหารออกจากแผนแล้ว")
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาดในการลบ: " + err.message)
      refetch()
    }
  }

  // Handle add food item
  const handleSaveFood = async (newFood: any) => {
    await callGasApi("ADD_FOOD_ITEM", newFood)
    await refetch()
  }

  // Handle add weight log
  const handleSaveWeight = async (newWeight: any) => {
    await callGasApi("ADD_WEIGHT_LOG", newWeight)
    await refetch()
  }

  // Quick add from food database to today's meal plan
  const handleQuickAddMealFromFood = (food: any) => {
    setAddMealOpen(true)
  }

  // Fallback data if offline or first load before sheet auth
  const meals = initialData?.meals || []
  const foods = initialData?.foods || []
  const weightLogs = initialData?.weightLogs || []
  const rawSheets = initialData?.rawSheets || []

  // If not authenticated with passcode
  if (!passcode) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <PasscodeGate
          onAuthenticated={(code) => {
            setSavedPasscode(code)
            setPasscode(code)
          }}
        />
      </>
    )
  }

  // Navigation Items
  const navItems: { key: ViewKey; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: "dashboard", label: "ภาพรวมโภชนาการ", icon: <LayoutDashboard className="h-4 w-4" /> },
    {
      key: "mealplan",
      label: "แผนการกิน",
      icon: <CalendarDays className="h-4 w-4" />,
      badge: meals.length > 0 ? `${meals.length}` : undefined,
    },
    {
      key: "fooddb",
      label: "คลังข้อมูลอาหาร",
      icon: <Utensils className="h-4 w-4" />,
      badge: foods.length > 0 ? `${foods.length}` : undefined,
    },
    { key: "weight", label: "บันทึกน้ำหนัก", icon: <Scale className="h-4 w-4" /> },
    {
      key: "sheetsync",
      label: "Google Sheets",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      badge: rawSheets.length > 0 ? `${rawSheets.length} แท็บ` : undefined,
    },
    { key: "settings", label: "ตั้งค่าระบบ", icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Toaster position="top-right" richColors />

      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-[#26334d] bg-[#111726]/80 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div
            onClick={() => setCurrentView("dashboard")}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950 font-bold text-lg">
              🥗
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                แผนการกิน <span className="text-emerald-400 text-xs font-normal">Finess Meal</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                Google Sheets & Apps Script Architecture
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
            className="h-8 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 border border-[#26334d]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isRefetching || isLoading ? "animate-spin text-emerald-400" : ""}`}
            />
            <span className="hidden sm:inline">ซิงค์ชีต</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setAddMealOpen(true)}
            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">เพิ่มมื้อ</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
            title="ออกจากระบบ"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-[#26334d] bg-[#111726] p-4 shrink-0 justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase px-3 py-1.5">
              เมนูหลัก (Navigation)
            </div>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  currentView === item.key
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 ${
                      currentView === item.key
                        ? "bg-emerald-700 text-emerald-100"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Sidebar Footer Link */}
          <div className="pt-4 border-t border-[#26334d]/60 space-y-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1yP5DwepfHxGoP0_OYx3zTXZTEdijbIt0aQj_1wTPuGs/edit?gid=1001#gid=1001"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs text-slate-400 hover:text-emerald-400 p-2 rounded-lg hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                <span>Google Sheets</span>
              </div>
              <ExternalLink className="h-3 w-3" />
            </a>

            <div className="text-[10px] text-slate-500 px-2">
              GitHub Pages • finess888/finess888
            </div>
          </div>
        </aside>

        {/* Mobile Slide-over Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
            <div className="w-64 bg-[#111726] border-r border-[#26334d] h-full p-4 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between pb-3 border-b border-[#26334d] mb-2">
                  <span className="font-bold text-white text-sm">เมนูระบบ</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setCurrentView(item.key)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      currentView === item.key
                        ? "bg-emerald-600 text-white font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-[#26334d] text-xs text-slate-500">
                แผนการกิน v1.0.0
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">⚠️ สเปรดชีตต้องการสิทธิ์เข้าถึง (Authorization Required)</p>
                <p className="text-xs text-amber-300/80 mt-1">
                  กรุณาเปิด Apps Script Editor แล้วกด "เรียกใช้ (Run)" บนฟังก์ชัน <code>inspectSpreadsheet</code> สัก 1 ครั้งเพื่ออนุญาตให้ Web App เข้าถึง Google Sheets
                </p>
              </div>
              <a
                href="https://script.google.com/u/0/home/projects/19tA_zqiXDq_n4n4wLm7d4RcPg-sUFyf26LBAs9nrtv6E3CAryMSfBGxC/edit"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-200 text-xs shrink-0">
                  เปิด Apps Script
                </Button>
              </a>
            </div>
          )}

          {currentView === "dashboard" && (
            <DashboardView
              meals={meals}
              foods={foods}
              weightLogs={weightLogs}
              onOpenAddMeal={() => setAddMealOpen(true)}
              onToggleMealStatus={handleToggleMealStatus}
              onNavigateToMealPlan={() => setCurrentView("mealplan")}
            />
          )}

          {currentView === "mealplan" && (
            <MealPlanView
              meals={meals}
              onOpenAddMeal={() => setAddMealOpen(true)}
              onToggleMealStatus={handleToggleMealStatus}
              onDeleteMeal={handleDeleteMeal}
            />
          )}

          {currentView === "fooddb" && (
            <FoodDatabaseView
              foods={foods}
              onOpenAddFood={() => setAddFoodOpen(true)}
              onQuickAddMeal={handleQuickAddMealFromFood}
            />
          )}

          {currentView === "weight" && (
            <WeightTrackerView
              weightLogs={weightLogs}
              onOpenAddWeight={() => setAddWeightOpen(true)}
            />
          )}

          {currentView === "sheetsync" && (
            <SheetSyncView
              rawSheets={rawSheets}
              spreadsheetName={initialData?.spreadsheetName}
              onRefresh={() => refetch()}
              loading={isRefetching || isLoading}
            />
          )}

          {currentView === "settings" && <SettingsView onLogout={handleLogout} />}
        </main>
      </div>

      {/* Modals */}
      <AddMealModal
        open={addMealOpen}
        onOpenChange={setAddMealOpen}
        onSave={handleSaveMeal}
        foods={foods}
      />

      <AddFoodModal
        open={addFoodOpen}
        onOpenChange={setAddFoodOpen}
        onSave={handleSaveFood}
      />

      <AddWeightModal
        open={addWeightOpen}
        onOpenChange={setAddWeightOpen}
        onSave={handleSaveWeight}
      />
    </div>
  )
}
