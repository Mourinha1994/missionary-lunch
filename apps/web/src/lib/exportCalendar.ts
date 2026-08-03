import { jsPDF } from 'jspdf'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type CalendarBlockedDate = {
  date: string
  blocked?: boolean
  isException?: boolean
}

type GridCell = { date: string; day: number; inMonth: boolean }

export function exportCalendarAsPDF(
  lunches: ScaleLunch[],
  blockedDates: CalendarBlockedDate[] = [],
  month = '',
  fileName = '',
) {
  const sorted = sortLunches(lunches)
  if (sorted.length === 0) return
  const monthStart = month ? dayjs(month).startOf('month') : dayjs(sorted[0].date).startOf('month')
  const monthEnd = monthStart.endOf('month')
  const monthLunches = sorted.filter((l) => {
    const d = dayjs(l.date)
    return !d.isBefore(monthStart, 'day') && !d.isAfter(monthEnd, 'day')
  })
  if (monthLunches.length === 0) return
  const effective = fileName || `almoco-missionarios-${monthStart.format('MM-YYYY')}.pdf`
  buildCalendarPDF(monthLunches, blockedDates, monthStart, effective)
}

function buildCalendarPDF(
  lunches: ScaleLunch[],
  blockedDates: CalendarBlockedDate[],
  month: dayjs.Dayjs,
  fileName: string,
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 42
  const contentWidth = pageWidth - margin * 2
  const colW = contentWidth / 7

  const byDate = new Map<string, ScaleLunch[]>()
  for (const l of lunches) {
    const key = dayjs(l.date).format('YYYY-MM-DD')
    const arr = byDate.get(key)
    if (arr) arr.push(l)
    else byDate.set(key, [l])
  }

  const blockedSet = new Set(
    blockedDates.filter(b => b.blocked !== false).map(b => String(b.date).slice(0, 10)),
  )
  const liberatedSet = new Set(
    blockedDates.filter(b => b.isException && b.blocked === false).map(b => String(b.date).slice(0, 10)),
  )

  // Grade do mês (a semana começa no domingo, como na tela)
  const start = month.startOf('month')
  const end = month.endOf('month')
  const lead = start.day()
  const firstGridDay = start.subtract(lead, 'day')
  const totalCells = Math.ceil((lead + end.date()) / 7) * 7

  const weeks: Array<Array<GridCell | null>> = []
  let week: Array<GridCell | null> = []
  for (let i = 0; i < totalCells; i++) {
    const d = firstGridDay.add(i, 'day')
    week.push({ date: d.format('YYYY-MM-DD'), day: d.date(), inMonth: d.month() === month.month() })
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  const headerBandH = 54
  const dowY = headerBandH + 28
  const gridTop = dowY + 24
  const bottomLimit = pageHeight - 48
  const footerY = pageHeight - 22
  const MIN_CELL_H = 32
  const NAME_FS = 7.5
  const NAME_LH = 9.5

  let page = 0

  const header = () => {
    page += 1

    // Faixa brand no topo
    doc.setFillColor(...BRAND)
    doc.rect(0, 0, pageWidth, headerBandH, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('Calendário de Almoço dos Missionários - Ala Nilo Wulff', margin, 25)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...BRAND_SOFT)
    doc.text(capitalize(month.format('MMMM [de] YYYY')), margin, 40)

    // Cabeçalho dos dias da semana
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_500)
    WEEK_DAYS.forEach((label, c) => {
      doc.text(label, margin + colW * c + colW / 2, dowY, { align: 'center' })
    })
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.6)
    doc.line(margin, dowY + 9, pageWidth - margin, dowY + 9)

    // Rodapé com número da página
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...TEXT_400)
    doc.text(`Página ${page}`, pageWidth / 2, footerY, { align: 'center' })

    return gridTop
  }

  const measureDay = (cell: GridCell) => {
    const lunchesOfDay = byDate.get(cell.date) ?? []
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(NAME_FS)
    let lines = 0
    for (const l of lunchesOfDay) {
      lines += doc.splitTextToSize(l.familyName, colW - 12).length
    }
    return 11 + lines * NAME_LH + 8
  }

  let y = header()

  // Linhas com altura uniforme para preencher toda a página (sem quebras)
  const weekContent = weeks.map(cells =>
    Math.max(...cells.map(c => (c ? Math.max(MIN_CELL_H, measureDay(c)) : MIN_CELL_H))),
  )
  const maxContent = Math.max(...weekContent)
  const rowH = Math.max((bottomLimit - y) / weeks.length, maxContent)

  weeks.forEach(cells => {
    const weekH = rowH

    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.4)
    doc.line(margin, y, pageWidth - margin, y)

    cells.forEach((cell, ci) => {
      const x = margin + ci * colW

      let fill: [number, number, number]
      if (!cell) fill = [241, 242, 246]
      else if (!cell.inMonth) fill = [248, 250, 252]
      else if (blockedSet.has(cell.date)) fill = [254, 242, 242]
      else if (liberatedSet.has(cell.date)) fill = [222, 232, 255]
      else fill = [255, 255, 255]

      doc.setFillColor(...fill)
      doc.rect(x, y, colW, weekH, 'F')

      if (!cell) return

      const blocked = blockedSet.has(cell.date)
      const liberated = !blocked && liberatedSet.has(cell.date)

      // Número do dia
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      if (blocked) doc.setTextColor(220, 38, 38)
      else if (liberated) doc.setTextColor(37, 83, 224)
      else if (cell.inMonth) doc.setTextColor(...TEXT_700)
      else doc.setTextColor(148, 163, 184)
      doc.text(String(cell.day), x + 6, y + 12)

      if (!cell.inMonth) return

      // Nomes das famílias (completos, sem corte)
      const lunchesOfDay = byDate.get(cell.date) ?? []
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(NAME_FS)
      doc.setTextColor(...TEXT_700)
      let ny = y + 22
      for (const l of lunchesOfDay) {
        const wrapped = doc.splitTextToSize(l.familyName, colW - 12)
        for (const line of wrapped) {
          doc.text(line, x + 6, ny)
          ny += NAME_LH
        }
      }
    })

    y += weekH
  })

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageWidth - margin, y)

  openPrintDialog(doc, fileName)
}

// Paleta do design system (docs/design-system)
const BRAND = [37, 83, 224] as const        // #2553E0 (brand-600)
const BRAND_SOFT = [222, 232, 255] as const  // #DEE8FF (brand-100)
const TEXT_900 = [15, 23, 42] as const       // #0F172A
const TEXT_700 = [60, 70, 88] as const       // #3C4658
const TEXT_500 = [100, 116, 139] as const    // #64748B
const TEXT_400 = [147, 161, 180] as const    // #93A1B4
const SURFACE_2 = [241, 242, 246] as const   // #F1F2F6
const BORDER = [227, 230, 236] as const      // #E3E6EC

function openPrintDialog(doc: jsPDF, fileName: string, win?: Window | null) {
  doc.autoPrint()
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)

  if (win) {
    win.document.title = fileName.replace(/\.pdf$/i, '')
    win.location.href = url
  } else {
    win = window.open(url, '_blank')
  }

  if (!win) {
    // Popup bloqueado pelo navegador: faz o download como fallback
    doc.save(fileName)
  }
}

export type ScaleLunch = {
  date: string
  familyName: string
  familyContact?: string
  missionaries: Array<{ name: string }>
  notes?: string
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function sortLunches(lunches: ScaleLunch[]) {
  return [...lunches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

function buildSchedulePDF(lunches: ScaleLunch[], title: string, subtitle: string, fileName: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 48
  const contentWidth = pageWidth - margin * 2

  const dateX = margin
  const familyX = margin + 104
  const familyW = 210
  const missionariesRightX = pageWidth - margin
  const missionariesW = missionariesRightX - (familyX + familyW)

  const LINE = 13
  const NOTES_LINE = 12
  const bottom = pageHeight - 44

  let page = 0

  const header = () => {
    page += 1

    // Faixa brand no topo
    doc.setFillColor(...BRAND)
    doc.rect(0, 0, pageWidth, 58, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(title, margin, 25)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...BRAND_SOFT)
    doc.text(subtitle, margin, 40)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_500)
    const headerY = 76
    doc.text('DATA', dateX, headerY)
    doc.text('FAMÍLIA', familyX, headerY)
    doc.text('MISSIONÁRIOS', missionariesRightX, headerY, { align: 'right' })

    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.6)
    doc.line(margin, headerY + 7, pageWidth - margin, headerY + 7)

    // Rodapé com número da página atual
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_400)
    doc.text(`Página ${page}`, pageWidth / 2, pageHeight - 24, { align: 'center' })

    return headerY + 20
  }

  let y = header()

  type Row = {
    nameLines: string[]
    contactLines: string[]
    misLines: string[]
    notesLines: string[]
    contentHeight: number
    notesTop: number
    h: number
  }

  const buildRow = (lunch: ScaleLunch): Row => {
    // Família (medida com a mesma fonte usada na renderização)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const nameLines: string[] = doc.splitTextToSize(lunch.familyName, familyW)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    const contactLines: string[] = lunch.familyContact
      ? doc.splitTextToSize(lunch.familyContact, familyW)
      : []

    // Missionários
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    const mis = lunch.missionaries.map((m) => m.name).join(' · ')
    const misLines: string[] = doc.splitTextToSize(mis, missionariesW)

    // Observações
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    const notesLines: string[] = lunch.notes
      ? doc.splitTextToSize(`Obs.: ${lunch.notes}`, contentWidth)
      : []

    const familyBlock = (nameLines.length + contactLines.length) * LINE
    const misBlock = misLines.length * LINE
    const dateBlock = 2 * LINE
    const contentHeight = Math.max(familyBlock, misBlock, dateBlock)
    const notesTop = notesLines.length ? contentHeight + 12 : 0
    const h = notesLines.length
      ? notesTop + notesLines.length * NOTES_LINE
      : contentHeight + 4

    return { nameLines, contactLines, misLines, notesLines, contentHeight, notesTop, h }
  }

  lunches.forEach((lunch, i) => {
    const row = buildRow(lunch)

    if (y + row.h > bottom) {
      y = header()
    }

    // Fundo zebrado
    if (i % 2 === 1) {
      doc.setFillColor(...SURFACE_2)
      doc.rect(margin, y - 13, contentWidth, row.h, 'F')
    }

    // Data
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...TEXT_900)
    doc.text(dayjs(lunch.date).format('DD/MM/YYYY'), dateX, y + 4)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...TEXT_400)
    doc.text(capitalize(dayjs(lunch.date).format('dddd')), dateX, y + 17)

    // Família (todas as linhas)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...TEXT_900)
    row.nameLines.forEach((line, j) => {
      doc.text(line, familyX, y + 4 + j * LINE)
    })

    // Contato da família (todas as linhas, abaixo do nome)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...TEXT_500)
    row.contactLines.forEach((line, j) => {
      doc.text(line, familyX, y + 4 + row.nameLines.length * LINE + j * LINE)
    })

    // Missionários (todas as linhas, alinhadas à direita)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...TEXT_700)
    row.misLines.forEach((line, j) => {
      doc.text(line, missionariesRightX, y + 4 + j * LINE, { align: 'right' })
    })

    // Observações (abaixo de tudo, largura total)
    if (row.notesLines.length) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8.5)
      doc.setTextColor(...TEXT_500)
      row.notesLines.forEach((line, j) => {
        doc.text(line, dateX, y + 4 + row.notesTop + j * NOTES_LINE)
      })
    }

    y += row.h
  })

  openPrintDialog(doc, fileName)
}

export function exportScaleAsPDF(lunches: ScaleLunch[], fileName = 'escala-almocos.pdf') {
  const sorted = sortLunches(lunches)
  if (sorted.length === 0) return
  const first = dayjs(sorted[0].date)
  const last = dayjs(sorted[sorted.length - 1].date)
  const subtitle = `Missionários · ${first.format('DD/MM/YYYY')} – ${last.format('DD/MM/YYYY')} · ${sorted.length} almoço${sorted.length !== 1 ? 's' : ''}`
  buildSchedulePDF(sorted, 'Escala de Almoços', subtitle, fileName)
}
