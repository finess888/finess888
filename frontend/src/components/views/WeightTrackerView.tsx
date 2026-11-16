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
  weightLogs: any[]
  onOpenAddWeight: () => void
}

export function WeightTrackerView({
  weightLogs,
  onOpenAddWeight,
}: WeightTrackerViewProps) {
  // Sort by date ascending for charts
  const sortedLogs = [...weightLogs].sort((a, b) => {
    const da = new Date(a.Date || a.date).getTime()
    const db = new Date(b.Date || b.date).getTime()
    return da - db
  })

  const latestLog = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1] : null
  const firstLog = sortedLogs.length > 0 ? sortedLogs[0] : null

  // Weight change
  let weightChange = 0
  if (latestLog && firstLog) {
    weightChange = Number(latestLog.Weight || latestLog.weight) - Number(firstLog.Weight || firstLog.weight)
  }

  // Chart data
  const chartLabels = sortedLogs.map((log) => formatThaiDate(log.Date || log.date))
  const chartData = {
    labels: chartLabels.length > 0 ? chartLabels : ["ยังไม่มีข้อมูล"],
    datasets: [
      {
        label: "น้ำหนัก (kg)",
        data: sortedLogs.map((log) => Number(log.Weight || log.weight || 0)),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "#10b981",
        pointRadius: 4,
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>⚖️</span> บันทึกน้ำหนักและสัดส่วน (Weight & Progress)
          </h1>
          <p className="text-slate-400 text-sm">
            ติดตามการเปลี่ยนแปลงของน้ำหนักตัว เปอร์เซ็นต์ไขมัน และมวลกล้ามเนื้อ บันทึกลง Google Sheets
          </p>
        </div>
        <Button
          onClick={onOpenAddWeight}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-emerald-950"
        >
          <Plus className="h-4 w-4" />
          + บันทึกน้ำหนักวันนี้
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#151d2f] border-[#26334d]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">น้ำหนักปัจจุบัน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {latestLog ? `${latestLog.Weight || latestLog.weight} kg` : "-"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {latestLog ? `อัปเดตเมื่อ ${formatThaiDate(latestLog.Date || latestLog.date)}` : "ยังไม่มีข้อมูล"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#151d2f] border-[#26334d]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">การเปลี่ยนแปลงสุทธิ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold flex items-center gap-1 ${
              weightChange < 0 ? "text-emerald-400" : weightChange > 0 ? "text-amber-400" : "text-white"
            }`}>
              {weightChange !== 0 ? (
                <>
                  {weightChange > 0 ? `+${weightChange.toFixed(1)}` : weightChange.toFixed(1)} kg
                  {weightChange < 0 ? <TrendingDown className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
                </>
              ) : (
                "0.0 kg"
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              เทียบกับวันแรกที่เริ่มบันทึก
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#151d2f] border-[#26334d]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">% ไขมัน / กล้ามเนื้อ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-400">
              {latestLog?.BodyFat || latestLog?.bodyfat ? `${latestLog.BodyFat || latestLog.bodyfat}%` : "-"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              กล้ามเนื้อ: {latestLog?.MuscleMass || latestLog?.musclemass ? `${latestLog.MuscleMass || latestLog.musclemass} kg` : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weight Chart */}
      <Card className="bg-[#151d2f] border-[#26334d]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">กราฟแนวโน้มน้ำหนักตัว</CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            ทิศทางการเปลี่ยนแปลงตามช่วงเวลา
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
              plugins: {
                legend: { display: false },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-[#151d2f] border-[#26334d] overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-white">ประวัติการชั่งน้ำหนัก</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#0e1422] border-b border-[#26334d]">
              <TableRow className="border-[#26334d]">
                <TableHead className="text-slate-300">วันที่</TableHead>
                <TableHead className="text-right text-emerald-400 font-semibold">น้ำหนักตัว (kg)</TableHead>
                <TableHead className="text-right text-amber-300">% ไขมัน</TableHead>
                <TableHead className="text-right text-cyan-300">มวลกล้ามเนื้อ (kg)</TableHead>
                <TableHead className="text-slate-300">บันทึกเพิ่มเติม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                    ยังไม่มีข้อมูลประวัติน้ำหนัก คลิก "+ บันทึกน้ำหนักวันนี้" เพื่อเริ่มบันทึก
                  </TableCell>
                </TableRow>
              ) : (
                [...sortedLogs].reverse().map((log) => {
                  const id = log.ID || log.id
                  return (
                    <TableRow
                      key={id}
                      className="border-[#26334d] hover:bg-slate-800/40 transition-colors"
                    >
                      <TableCell className="font-medium text-white whitespace-nowrap">
                        {formatThaiDate(log.Date || log.date)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-400 text-sm whitespace-nowrap">
                        {log.Weight || log.weight} kg
                      </TableCell>
                      <TableCell className="text-right text-slate-300 text-xs whitespace-nowrap">
                        {log.BodyFat || log.bodyfat ? `${log.BodyFat || log.bodyfat}%` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-slate-300 text-xs whitespace-nowrap">
                        {log.MuscleMass || log.musclemass ? `${log.MuscleMass || log.musclemass} kg` : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 max-w-[200px] truncate">
                        {log.Notes || log.notes || "-"}
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
