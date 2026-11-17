import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Scale, TrendingDown, TrendingUp, Calendar, Heart, Users } from "lucide-react"
import { Line } from "react-chartjs-2"
import { formatThaiDate } from "@/lib/utils"

interface WeightTrackerViewProps {
  healthLogs: any[]
  onOpenAddWeight: () => void
}

export function WeightTrackerView({
  healthLogs,
  onOpenAddWeight,
}: WeightTrackerViewProps) {
  const [selectedPerson, setSelectedPerson] = React.useState<"ALL" | "ฝ่ายชาย" | "ฝ่ายหญิง">("ALL")
  const isAll = selectedPerson === "ALL"
  const isMale = selectedPerson === "ฝ่ายชาย"
  const isFemale = selectedPerson === "ฝ่ายหญิง"

  const maleStartWeight = 100.0
  const maleTargetWeight = 70.0
  const femaleStartWeight = 65.0
  const femaleTargetWeight = 50.0

  // Filter logs with weight
  const maleLogs = healthLogs.filter((log) => {
    const w = log.maleWeight
    return w !== null && w !== undefined && w !== "" && !isNaN(Number(w))
  })
  const femaleLogs = healthLogs.filter((log) => {
    const w = log.femaleWeight
    return w !== null && w !== undefined && w !== "" && !isNaN(Number(w))
  })

  const latestMaleLog = maleLogs.length > 0 ? maleLogs[maleLogs.length - 1] : null
  const latestFemaleLog = femaleLogs.length > 0 ? femaleLogs[femaleLogs.length - 1] : null

  const currentMaleWeight = latestMaleLog ? Number(latestMaleLog.maleWeight) : maleStartWeight
  const currentFemaleWeight = latestFemaleLog ? Number(latestFemaleLog.femaleWeight) : femaleStartWeight

  const maleLost = Math.max(0, maleStartWeight - currentMaleWeight)
  const femaleLost = Math.max(0, femaleStartWeight - currentFemaleWeight)
  const totalCoupleLost = Number((maleLost + femaleLost).toFixed(1))
  const totalCoupleTargetLoss = (maleStartWeight - maleTargetWeight) + (femaleStartWeight - femaleTargetWeight) // 30 + 15 = 45 kg

  // Single person active helpers
  const targetWeight = isMale ? maleTargetWeight : femaleTargetWeight
  const startWeight = isMale ? maleStartWeight : femaleStartWeight
  const currentWeight = isMale ? currentMaleWeight : currentFemaleWeight
  const diffFromTarget = currentWeight - targetWeight

  // Base list of logs for chart labels
  const baseChartLogs = healthLogs.length > 0 ? healthLogs.slice(0, 30) : []
  const chartLabels = baseChartLogs.map((log) => formatThaiDate(log.date))

  // Datasets for Chart.js
  const datasets = []
  if (isAll || isMale) {
    datasets.push({
      label: "🏋️‍♂️ ฝ่ายชาย (กก.)",
      data: baseChartLogs.map((log) => {
        const w = log.maleWeight
        return w !== null && w !== undefined && w !== "" && !isNaN(Number(w)) ? Number(w) : null
      }),
      borderColor: "#10b981",
      backgroundColor: "rgba(16, 185, 129, 0.12)",
      fill: isMale,
      tension: 0.3,
      pointBackgroundColor: "#10b981",
      pointRadius: 4,
      pointHoverRadius: 6,
    })
  }
  if (isAll || isFemale) {
    datasets.push({
      label: "🧘‍♀️ ฝ่ายหญิง (กก.)",
      data: baseChartLogs.map((log) => {
        const w = log.femaleWeight
        return w !== null && w !== undefined && w !== "" && !isNaN(Number(w)) ? Number(w) : null
      }),
      borderColor: "#ec4899",
      backgroundColor: "rgba(236, 72, 153, 0.12)",
      fill: isFemale,
      tension: 0.3,
      pointBackgroundColor: "#ec4899",
      pointRadius: 4,
      pointHoverRadius: 6,
    })
  }

  const chartData = {
    labels: chartLabels,
    datasets,
  }

  return (
    <div className="space-y-6">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#151d2f] to-[#151d2f] border border-[#26334d] rounded-2xl p-6 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚖️</span>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
              บันทึกน้ำหนักและสุขภาพรายวัน
              <Badge className="text-xs font-semibold text-emerald-300 bg-emerald-500/20 border-emerald-500/30">
                Google Sheets Synced
              </Badge>
            </h1>
          </div>
          <p className="text-slate-400 text-xs">
            ติดตามน้ำหนักและสุขภาพตามแผน 46 วัน (16 พ.ย. - 31 ธ.ค. 2026) ดูควบคู่ทั้งฝ่ายชายและฝ่ายหญิง
          </p>
        </div>

        {/* Action button & Person Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={onOpenAddWeight}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9 px-3.5 shadow-md shadow-emerald-950 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>+ บันทึกน้ำหนัก</span>
          </Button>

          <div className="flex items-center gap-1 bg-[#0b0f19] p-1 rounded-xl border border-[#26334d]">
            <button
              onClick={() => setSelectedPerson("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isAll
                  ? "bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md shadow-indigo-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Heart className="h-3.5 w-3.5 text-pink-400 fill-pink-400" />
              <span>รวมคู่รัก</span>
            </button>
            <button
              onClick={() => setSelectedPerson("ฝ่ายชาย")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isMale
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🏋️‍♂️ ชาย</span>
            </button>
            <button
              onClick={() => setSelectedPerson("ฝ่ายหญิง")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isFemale
                  ? "bg-pink-600 text-white shadow-md shadow-pink-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🧘‍♀️ หญิง</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {isAll ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: น้ำหนักปัจจุบันของทั้งสองคน */}
          <Card className="bg-[#151d2f] border-[#26334d]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>น้ำหนักปัจจุบัน (ทั้งคู่)</span>
                <Users className="h-3.5 w-3.5 text-indigo-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-[#0b0f19] p-2.5 rounded-lg border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 block font-semibold">🏋️‍♂️ ฝ่ายชาย</span>
                  <div className="text-xl font-extrabold text-white font-mono">
                    {currentMaleWeight}{" "}
                    <span className="text-xs font-normal text-slate-400">กก.</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    เป้า {maleTargetWeight} กก.
                  </span>
                </div>
                <div className="bg-[#0b0f19] p-2.5 rounded-lg border border-pink-500/20">
                  <span className="text-[10px] text-pink-400 block font-semibold">🧘‍♀️ ฝ่ายหญิง</span>
                  <div className="text-xl font-extrabold text-white font-mono">
                    {currentFemaleWeight}{" "}
                    <span className="text-xs font-normal text-slate-400">กก.</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    เป้า {femaleTargetWeight} กก.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: น้ำหนักที่ลดได้รวมคู่รัก */}
          <Card className="bg-[#151d2f] border-[#26334d]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>น้ำหนักที่ลดได้รวมคู่รัก</span>
                <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {totalCoupleLost} <span className="text-sm font-normal text-slate-400">กก.</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                เป้าหมายรวม: ลด {totalCoupleTargetLoss} กก. (ชาย 30 กก. + หญิง 15 กก.)
              </p>
            </CardContent>
          </Card>

          {/* Card 3: ระยะเวลาติดตามแผน */}
          <Card className="bg-[#151d2f] border-[#26334d]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>ระยะเวลาติดตามแผน</span>
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400 font-mono">
                46 <span className="text-sm font-normal text-slate-400">วัน</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                16 พ.ย. ถึง 31 ธ.ค. 2026 (เป้าหมายปีใหม่)
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-[#151d2f] border-[#26334d]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">น้ำหนักปัจจุบัน ({selectedPerson})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white font-mono">
                {currentWeight} <span className="text-sm font-normal text-slate-400">กก.</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                น้ำหนักเริ่มต้น: {startWeight} กก.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#151d2f] border-[#26334d]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">เป้าหมายน้ำหนัก</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold font-mono flex items-center gap-1 ${isMale ? "text-emerald-400" : "text-pink-400"}`}>
                {targetWeight} <span className="text-sm font-normal text-slate-400">กก.</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                เป้าหมายลดอีก: {Math.max(0, diffFromTarget).toFixed(1)} กก.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#151d2f] border-[#26334d]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">ระยะเวลาติดตามแผน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400 font-mono">
                46 <span className="text-sm font-normal text-slate-400">วัน</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                16 พ.ย. ถึง 31 ธ.ค. 2026
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weight Chart */}
      <Card className="bg-[#151d2f] border-[#26334d]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-white">
                กราฟแนวโน้มน้ำหนัก {isAll ? "(เปรียบเทียบทั้งคู่)" : `(${selectedPerson})`}
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                ทิศทางการเปลี่ยนแปลงน้ำหนักตัวตามแผนโภชนาการ
              </CardDescription>
            </div>
            {isAll && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 🏋️‍♂️ ชาย
                </span>
                <span className="flex items-center gap-1.5 text-pink-400 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-pink-500" /> 🧘‍♀️ หญิง
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="h-72 pt-2">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  grid: { color: "rgba(255, 255, 255, 0.05)" },
                  ticks: { color: "#94a3b8" },
                },
                x: {
                  grid: { display: false },
                  ticks: { color: "#94a3b8" },
                },
              },
              plugins: {
                legend: {
                  display: isAll,
                  position: "top" as const,
                  labels: {
                    color: "#cbd5e1",
                    font: { size: 11 },
                    boxWidth: 12,
                  },
                },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Daily Health Log Table */}
      <Card className="bg-[#151d2f] border-[#26334d] overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-white">ตารางสรุปสุขภาพรายวัน (B หน้าจดบันทึก)</CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            ข้อมูลสุขภาพและกิจกรรมตลอด 46 วัน
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto max-h-[450px]">
          <Table>
            <TableHeader className="bg-[#0e1422] border-b border-[#26334d] sticky top-0">
              <TableRow className="border-[#26334d]">
                <TableHead className="text-slate-300">วันที่</TableHead>
                <TableHead className="text-slate-300">วัน</TableHead>
                <TableHead className="text-slate-300">ประเภทวัน</TableHead>
                <TableHead className="text-right text-emerald-400 font-semibold">🏋️ ชาย นน. (กก.)</TableHead>
                <TableHead className="text-right text-emerald-300">🏋️ ชาย แคลอรี่</TableHead>
                <TableHead className="text-right text-pink-400 font-semibold">🧘 หญิง นน. (กก.)</TableHead>
                <TableHead className="text-right text-pink-300">🧘 หญิง แคลอรี่</TableHead>
                <TableHead className="text-slate-300">กิจกรรม / บันทึกสุขภาพ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {healthLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                    ไม่มีข้อมูลสุขภาพในชีต
                  </TableCell>
                </TableRow>
              ) : (
                healthLogs.map((log, idx) => (
                  <TableRow
                    key={idx}
                    className="border-[#26334d] hover:bg-slate-800/40 transition-colors"
                  >
                    <TableCell className="font-medium text-white whitespace-nowrap text-xs">
                      {formatThaiDate(log.date)}
                    </TableCell>
                    <TableCell className="text-slate-300 text-xs whitespace-nowrap">
                      {log.dayName || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          log.dayType === "ออกกำลังกาย"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : log.dayType === "วันพักผ่อน"
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {log.dayType || "วันปกติ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-400 text-xs whitespace-nowrap">
                      {log.maleWeight ? `${log.maleWeight} kg` : "-"}
                    </TableCell>
                    <TableCell className="text-right text-slate-300 text-xs whitespace-nowrap">
                      {log.maleCalories ? `${log.maleCalories} kcal` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-pink-400 text-xs whitespace-nowrap">
                      {log.femaleWeight ? `${log.femaleWeight} kg` : "-"}
                    </TableCell>
                    <TableCell className="text-right text-slate-300 text-xs whitespace-nowrap">
                      {log.femaleCalories ? `${log.femaleCalories} kcal` : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 max-w-[200px] truncate">
                      {log.activity || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
