import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]

export const THAI_SHORT_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
]

export const THAI_DAYS = [
  "วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"
]

export function formatThaiDate(dateInput: any): string {
  const d = parseDateSafe(dateInput)
  if (!d) return "-"
  const day = d.getDate()
  const month = THAI_SHORT_MONTHS[d.getMonth()]
  const year = d.getFullYear() + 543
  return `${day} ${month} ${year}`
}

export function parseDateSafe(dateInput: any): Date | null {
  if (!dateInput) return null
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput
  if (typeof dateInput === "number") {
    const d = new Date(dateInput)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof dateInput === "string") {
    const s = dateInput.trim()
    if (!s) return null

    // Check for DD/MM/YYYY or DD/MM/BBBB
    if (s.includes("/")) {
      const parts = s.split(" ")[0].split("/")
      if (parts.length === 3) {
        let yr = +parts[2]
        if (yr > 2400) yr -= 543
        const d = new Date(yr, +parts[1] - 1, +parts[0])
        if (!isNaN(d.getTime())) return d
      }
    }

    // Check "YYYY-MM-DD HH:mm:ss"
    const spaceMatch = s.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/)
    if (spaceMatch) {
      const d = new Date(`${spaceMatch[1]}T${spaceMatch[2]}`)
      if (!isNaN(d.getTime())) return d
    }

    const d = new Date(s)
    if (!isNaN(d.getTime())) return d

    const isoDateMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
    if (isoDateMatch) {
      const d2 = new Date(Number(isoDateMatch[1]), Number(isoDateMatch[2]) - 1, Number(isoDateMatch[3]))
      if (!isNaN(d2.getTime())) return d2
    }
  }
  return null
}
