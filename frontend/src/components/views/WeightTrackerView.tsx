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
import { Plus, Scale, TrendingDown, TrendingUp, Calendar } from "lucide-react"
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
  const [selectedPerson, setSelectedPerson] = React.useState<"ฝ่ายชาย" | "ฝ่ายหญิง">("ฝ่ายชาย")
  const isMale = selectedPerson === "ฝ่ายชาย"

  const targetWeight = isMale ? 70.0 : 50.0
  const startWeight = isMale ? 100.0 : 65.0

  // Filter logs with weight
  const logsWithWeight = healthLogs.filter((log) => {
    const w = isMale ? log.maleWeight : log.femaleWeight
    return w !== null && w !== undefined && w !== "" && !isNaN(Number(w))
  })

  const latestLog = logsWithWeight.length > 0 ? logsWithWeight[logsWithWeight.length - 1] : null
  const currentWeight = latestLog ? Number(isMale ? latestLog.maleWeight : latestLog.femaleWeight) : startWeight
  const diffFromTarget = currentWeight - targetWeight

  // Chart data
  const chartLabels = (logsWithWeight.length > 0 ? logsWithWeight : healthLogs.slice(0, 14)).map((log) => {
    return formatThaiDate(log.date)
  })

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: `น้ำหนัก ${selectedPerson} (กก.)`,
        data: (logsWithWeight.length > 0 ? logsWithWeight : healthLogs.slice(0, 14)).map((log) => {
          const w = isMale ? log.maleWeight : log.femaleWeight
          return w !== null && w !== undefined && w !== "" ? Number(w) : null
        }),
        borderColor: isMale ? "#10b981" : "#ec4899",
        backgroundColor: isMale ? "rgba(16, 185, 129, 0.15)" : "rgba(236, 72, 153, 0.15)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: isMale ? "#10b981" : "#ec4899",
        pointRadius: 4,
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>⚖️</span> บันทึกน้ำหนักและสุขภาพรายวัน (Health & Weight)
          </h1>
          <p className="text-slate-400 text-sm">
            ติดตามน้ำหนักและสุขภาพตามแผน 46 วัน (16 พ.ย. - 31 ธ.ค. 2026) เชื่อมต่อ Google Sheets
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#151d2f] p-1.5 rounded-xl border border-[#26334d]">
          <button
            onClick={() => setSelectedPerson("ฝ่ายชาย")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isMale
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🏋️‍♂️</span> ฝ่ายชาย (เป้า 70 kg)
          </button>
          <button
            onClick={() => setSelectedPerson("ฝ่ายหญิง")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              !isMale
                ? "bg-pink-600 text-white shadow-md shadow-pink-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🧘‍♀️</span> ฝ่ายหญิง (เป้า 50 kg)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#151d2f] border-[#26334d]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">น้ำหนักปัจจุบัน ({selectedPerson})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
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
            <div className={`text-3xl font-bold flex items-center gap-1 ${isMale ? "text-emerald-400" : "text-pink-400"}`}>
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
            <div className="text-3xl font-bold text-cyan-400">
              46 <span className="text-sm font-normal text-slate-400">วัน</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              16 พ.ย. ถึง 31 ธ.ค. 2026
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weight Chart */}
      <Card className="bg-[#151d2f] border-[#26334d]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">กราฟแนวโน้มน้ำหนัก ({selectedPerson})</CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            ทิศทางการเปลี่ยนแปลงน้ำหนักตัวตามแผนโภชนาการ
          </CardDescription>
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
              plugins: { legend: { display: false } },
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
