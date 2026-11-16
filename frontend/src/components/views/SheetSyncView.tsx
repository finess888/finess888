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
import { Database, FileSpreadsheet, ExternalLink, RefreshCw } from "lucide-react"

interface SheetSyncViewProps {
  rawSheets: any[]
  spreadsheetName?: string
  onRefresh: () => void
  loading?: boolean
}

export function SheetSyncView({
  rawSheets,
  spreadsheetName,
  onRefresh,
  loading,
}: SheetSyncViewProps) {
  const [selectedSheetIndex, setSelectedSheetIndex] = React.useState(0)

  const activeSheet = rawSheets && rawSheets.length > 0 ? rawSheets[selectedSheetIndex] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
            ข้อมูลดิบจาก Google Sheets ({spreadsheetName || "แผนการกิน"})
          </h1>
          <p className="text-slate-400 text-sm">
            แสดงแท็บข้อมูลทั้งหมดที่อ่านได้จากสเปรดชีตต้นฉบับ (Spreadsheet ID: 1yP5DwepfHxGoP0_OYx3zTXZTEdijbIt0aQj_1wTPuGs)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="border-[#26334d] text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            รีเฟรชชีต
          </Button>
          <a
            href="https://docs.google.com/spreadsheets/d/1yP5DwepfHxGoP0_OYx3zTXZTEdijbIt0aQj_1wTPuGs/edit?gid=1001#gid=1001"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
            >
              เปิดชีต Google <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Sheet Tabs Selector */}
      {rawSheets && rawSheets.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#26334d] pb-3">
          {rawSheets.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSheetIndex(idx)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                selectedSheetIndex === idx
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "bg-[#151d2f] text-slate-400 hover:text-white border border-[#26334d]"
              }`}
            >
              <span>📄</span>
              <span>{s.name || `Sheet ${idx + 1}`}</span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0 ${
                  selectedSheetIndex === idx ? "bg-emerald-700 text-emerald-100" : "bg-slate-800 text-slate-400"
                }`}
              >
                {s.rows ? s.rows.length : 0} แถว
              </Badge>
            </button>
          ))}
        </div>
      ) : (
        <Card className="bg-[#151d2f] border-[#26334d] p-8 text-center">
          <p className="text-slate-400 text-sm">
            ยังไม่สามารถดึงแท็บชีตได้ กรุณาตรวจสอบว่าได้ให้สิทธิ์ (Authorize) ใน Google Apps Script Editor แล้วหรือยัง
          </p>
        </Card>
      )}

      {/* Active Sheet Table */}
      {activeSheet && (
        <Card className="bg-[#151d2f] border-[#26334d] overflow-hidden">
          <CardHeader className="bg-[#0e1422] border-b border-[#26334d] py-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  แท็บ: {activeSheet.name} (Sheet ID: {activeSheet.sheetId})
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  จำนวนคอลัมน์: {activeSheet.headers ? activeSheet.headers.length : 0} | จำนวนแถวข้อมูล:{" "}
                  {activeSheet.rows ? activeSheet.rows.length : 0}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="overflow-x-auto max-h-[550px]">
            <Table>
              <TableHeader className="bg-[#0b0f19] sticky top-0 border-b border-[#26334d]">
                <TableRow className="border-[#26334d]">
                  <TableHead className="w-12 text-center text-slate-500">#</TableHead>
                  {activeSheet.headers && activeSheet.headers.length > 0 ? (
                    activeSheet.headers.map((h: string, hIdx: number) => (
                      <TableHead key={hIdx} className="text-slate-200 text-xs font-semibold whitespace-nowrap">
                        {String(h || `Col ${hIdx + 1}`)}
                      </TableHead>
                    ))
                  ) : (
                    <TableHead className="text-slate-400">ไม่มีหัวคอลัมน์</TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {activeSheet.rows && activeSheet.rows.length > 0 ? (
                  activeSheet.rows.slice(0, 100).map((row: any[], rIdx: number) => (
                    <TableRow key={rIdx} className="border-[#26334d] hover:bg-slate-800/40">
                      <TableCell className="text-center text-xs text-slate-500">{rIdx + 1}</TableCell>
                      {row.map((cell: any, cIdx: number) => (
                        <TableCell key={cIdx} className="text-xs text-slate-300 whitespace-nowrap">
                          {cell !== null && cell !== undefined ? String(cell) : "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={(activeSheet.headers?.length || 0) + 1}
                      className="text-center py-8 text-slate-400"
                    >
                      ไม่มีข้อมูลในแท็บนี้
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
