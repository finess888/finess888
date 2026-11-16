import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Code2,
  GitBranch,
  Flame,
  Target,
  Utensils,
} from "lucide-react"
import {
  AllCalorieSettings,
  getCalorieSettings,
  getIntakeTarget,
} from "@/lib/calorieSettings"
import { CalorieSettingsModal } from "@/components/modals/CalorieSettingsModal"
import {
  getGasUrl,
  setGasUrl,
  DEFAULT_GAS_URL,
  getSavedPasscode,
  setSavedPasscode,
  callGasApi,
} from "@/api/gasClient"
import { toast } from "sonner"

interface SettingsViewProps {
  onLogout: () => void
}

export function SettingsView({ onLogout }: SettingsViewProps) {
  const [gasUrlInput, setGasUrlInput] = React.useState(getGasUrl())
  const [passcodeInput, setPasscodeInput] = React.useState(getSavedPasscode())
  const [testing, setTesting] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null)
  const [calorieSettings, setCalorieSettings] = React.useState<AllCalorieSettings>(getCalorieSettings)
  const [calorieModalOpen, setCalorieModalOpen] = React.useState(false)
  const [selectedPersonForModal, setSelectedPersonForModal] = React.useState("ฝ่ายชาย")

  const handleSaveGasUrl = () => {
    if (!gasUrlInput.trim()) {
      toast.error("URL เซิร์ฟเวอร์ไม่สามารถเว้นว่างได้")
      return
    }
    setGasUrl(gasUrlInput.trim())
    toast.success("บันทึก URL เซิร์ฟเวอร์ GAS แล้ว!")
  }

  const handleResetGasUrl = () => {
    setGasUrlInput(DEFAULT_GAS_URL)
    setGasUrl(DEFAULT_GAS_URL)
    toast.info("รีเซ็ต URL เป็นค่าเริ่มต้นแล้ว")
  }

  const handleSavePasscode = () => {
    setSavedPasscode(passcodeInput.trim())
    toast.success("บันทึกรหัสผ่านในเครื่องแล้ว!")
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await callGasApi<{ valid: boolean }>("VERIFY_PASSCODE", {
        passcode: passcodeInput.trim(),
      })
      if (res && res.valid) {
        setTestResult({
          success: true,
          message: "เชื่อมต่อเซิร์ฟเวอร์ GAS สำเร็จ และรหัสผ่านถูกต้อง!",
        })
        toast.success("เชื่อมต่อสำเร็จ!")
      } else {
        setTestResult({
          success: false,
          message: "เชื่อมต่อได้ แต่รหัสผ่านไม่ถูกต้อง (ค่าเริ่มต้น: 1234)",
        })
        toast.warning("รหัสผ่านไม่ตรงกับเซิร์ฟเวอร์")
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "ไม่สามารถเชื่อมต่อกับ Google Apps Script Web App ได้",
      })
      toast.error("การเชื่อมต่อล้มเหลว")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-400" />
          ตั้งค่าระบบและการเชื่อมต่อ (Settings)
        </h1>
        <p className="text-slate-400 text-sm">
          จัดการ URL ของ Google Apps Script, รหัสผ่าน และดูข้อมูลเวอร์ชันของระบบ
        </p>
      </div>

      {/* GAS URL Settings */}
      <Card className="bg-[#151d2f] border-[#26334d]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Code2 className="h-5 w-5 text-emerald-400" />
            การเชื่อมต่อ Google Apps Script Web App
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            URL ปลายทางของ Web App ที่ใช้ในการอ่านและเขียนข้อมูลลงสเปรดชีต
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200 text-xs">GAS Web App Exec URL</Label>
            <div className="flex gap-2">
              <Input
                value={gasUrlInput}
                onChange={(e) => setGasUrlInput(e.target.value)}
                className="bg-[#0b0f19] border-[#26334d] text-white font-mono text-xs"
              />
              <Button
                onClick={handleSaveGasUrl}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4"
              >
                บันทึก URL
              </Button>
              <Button
                variant="outline"
                onClick={handleResetGasUrl}
                className="border-[#26334d] text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
              >
                รีเซ็ต
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleTestConnection}
              disabled={testing}
              variant="secondary"
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? "animate-spin" : ""}`} />
              {testing ? "กำลังทดสอบ..." : "ทดสอบการเชื่อมต่อ (Ping Server)"}
            </Button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                testResult.success
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calorie & TDEE Deficit Settings Card */}
      <Card className="bg-[#151d2f] border-[#26334d]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-400" />
                เป้าหมายแคลอรี่และอัตราเผาผลาญ (TDEE & Calorie Deficit)
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                กำหนดแคลอรี่เผาผลาญต่อวันและเป้าตัดทอน เพื่อคำนวณโควต้าอาหารที่ควรกินไม่เกินในแต่ละวัน
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setSelectedPersonForModal("ฝ่ายชาย")
                setCalorieModalOpen(true)
              }}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs flex items-center gap-1.5 h-8 px-3 shadow-md shadow-amber-950 shrink-0"
            >
              <Flame className="h-3.5 w-3.5" />
              ตั้งค่าเป้าแคลอรี่ (TDEE)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Male Settings Box */}
            <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🏋️‍♂️</span> ฝ่ายชาย (Male)
                </span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                  ควรกินไม่เกิน {getIntakeTarget(calorieSettings.male).toLocaleString()} kcal/วัน
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-slate-300">
                <div>
                  <span className="text-slate-400 text-[11px] block">อัตราเผาผลาญ (TDEE):</span>
                  <span className="font-mono font-bold text-white">{calorieSettings.male.maintenance.toLocaleString()} kcal</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">เป้าตัดทอนต่อวัน:</span>
                  <span className="font-mono font-bold text-amber-300">-{calorieSettings.male.deficit.toLocaleString()} kcal</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-mono bg-[#111726] p-1.5 rounded border border-[#26334d]">
                สูตร: {calorieSettings.male.maintenance} - {calorieSettings.male.deficit} = กินไม่เกิน {getIntakeTarget(calorieSettings.male)} kcal
              </p>
            </div>

            {/* Female Settings Box */}
            <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-pink-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🧘‍♀️</span> ฝ่ายหญิง (Female)
                </span>
                <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-[10px]">
                  ควรกินไม่เกิน {getIntakeTarget(calorieSettings.female).toLocaleString()} kcal/วัน
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-slate-300">
                <div>
                  <span className="text-slate-400 text-[11px] block">อัตราเผาผลาญ (TDEE):</span>
                  <span className="font-mono font-bold text-white">{calorieSettings.female.maintenance.toLocaleString()} kcal</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">เป้าตัดทอนต่อวัน:</span>
                  <span className="font-mono font-bold text-pink-300">-{calorieSettings.female.deficit.toLocaleString()} kcal</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-mono bg-[#111726] p-1.5 rounded border border-[#26334d]">
                สูตร: {calorieSettings.female.maintenance} - {calorieSettings.female.deficit} = กินไม่เกิน {getIntakeTarget(calorieSettings.female)} kcal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passcode Settings */}
      <Card className="bg-[#151d2f] border-[#26334d]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-emerald-400" />
            รหัสผ่านเข้าใช้งาน (Passcode)
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            รหัสผ่านที่จัดเก็บในเบราว์เซอร์สำหรับส่งยืนยันตัวตนกับเซิร์ฟเวอร์
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200 text-xs">รหัสผ่านปัจจุบัน</Label>
            <div className="flex gap-2 max-w-sm">
              <Input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="ค่าเริ่มต้น: 1234"
                className="bg-[#0b0f19] border-[#26334d] text-white text-xs"
              />
              <Button
                onClick={handleSavePasscode}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4"
              >
                บันทึกรหัส
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* External Resources Links */}
      <Card className="bg-[#151d2f] border-[#26334d]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">ลิงก์แหล่งข้อมูลที่เกี่ยวข้อง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b0f19] border border-[#26334d]">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              <div>
                <div className="text-sm font-medium text-white">Google Sheets (แผนการกิน)</div>
                <div className="text-xs text-slate-400 font-mono">1yP5DwepfHxGoP0_OYx3zTXZTEdijbIt0aQj_1wTPuGs (gid=1001)</div>
              </div>
            </div>
            <a
              href="https://docs.google.com/spreadsheets/d/1yP5DwepfHxGoP0_OYx3zTXZTEdijbIt0aQj_1wTPuGs/edit?gid=1001#gid=1001"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="border-[#26334d] text-xs flex items-center gap-1">
                เปิดสเปรดชีต <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b0f19] border border-[#26334d]">
            <div className="flex items-center gap-2.5">
              <Code2 className="h-5 w-5 text-indigo-400" />
              <div>
                <div className="text-sm font-medium text-white">Apps Script Editor</div>
                <div className="text-xs text-slate-400 font-mono">19tA_zqiXDq_n4n4wLm7d4RcPg-sUFyf26LBAs9nrtv6E3CAryMSfBGxC</div>
              </div>
            </div>
            <a
              href="https://script.google.com/u/0/home/projects/19tA_zqiXDq_n4n4wLm7d4RcPg-sUFyf26LBAs9nrtv6E3CAryMSfBGxC/edit"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="border-[#26334d] text-xs flex items-center gap-1">
                เปิดโปรเจกต์ Script <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b0f19] border border-[#26334d]">
            <div className="flex items-center gap-2.5">
              <GitBranch className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-sm font-medium text-white">GitHub Repository & Pages Settings</div>
                <div className="text-xs text-slate-400 font-mono">finess888 / finess888</div>
              </div>
            </div>
            <a
              href="https://github.com/finess888/finess888.github.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="border-[#26334d] text-xs flex items-center gap-1">
                เปิด GitHub Repo <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* System info */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-[#26334d] text-xs text-slate-400">
        <div>
          <span>เวอร์ชันระบบ: 1.0.0 • finess888.github.io • สแตก: React 18, Vite 6, Tailwind 4, Google Apps Script</span>
        </div>
        <Button
          onClick={onLogout}
          variant="ghost"
          size="sm"
          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
        >
          ออกจากระบบ (Logout)
        </Button>
      </div>

      <CalorieSettingsModal
        open={calorieModalOpen}
        onOpenChange={setCalorieModalOpen}
        currentPerson={selectedPersonForModal}
        onSaved={setCalorieSettings}
      />
    </div>
  )
}
