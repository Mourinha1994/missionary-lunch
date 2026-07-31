import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function exportCalendarAsPDF(elementId: string, fileName = 'calendario-almocos.pdf') {
  const el = document.getElementById(elementId)
  if (!el) {
    console.warn(`exportCalendarAsPDF: elemento #${elementId} não encontrado`)
    return
  }

  const canvas = await html2canvas(el, { scale: 2, useCORS: true })
  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const ratio = canvas.width / canvas.height
  let imgW = pageWidth
  let imgH = pageWidth / ratio
  if (imgH > pageHeight) {
    imgH = pageHeight
    imgW = pageHeight * ratio
  }

  const x = (pageWidth - imgW) / 2
  const y = (pageHeight - imgH) / 2

  pdf.addImage(imgData, 'PNG', x, y, imgW, imgH)
  pdf.save(fileName)
}
