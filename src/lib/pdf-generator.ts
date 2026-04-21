import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { formatCurrency } from './calculator'

interface ExportData {
  userName: string
  dateRange: { start: string; end: string }
  kpis: { label: string; value: string }[]
  metrics: any[]
  chartIds: string[]
}

export async function generateDashboardPDF({
  userName,
  dateRange,
  kpis,
  metrics,
  chartIds
}: ExportData) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let currentY = 20

  // --- Header ---
  doc.setFillColor(6, 13, 20) // --night
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('ProfitCod', margin, 20)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('REPORTE FINANCIERO DE RENDIMIENTO', margin, 27)
  
  doc.setFontSize(9)
  doc.text(`Usuario: ${userName}`, pageWidth - margin, 20, { align: 'right' })
  doc.text(`Rango: ${dateRange.start} a ${dateRange.end}`, pageWidth - margin, 27, { align: 'right' })
  
  currentY = 50

  // --- KPI Grid ---
  doc.setTextColor(6, 13, 20)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen de Métricas', margin, currentY)
  currentY += 10

  const kpiBoxWidth = (pageWidth - (margin * 2) - 10) / 3
  const kpiBoxHeight = 20
  
  kpis.forEach((kpi, index) => {
    const row = Math.floor(index / 3)
    const col = index % 3
    const x = margin + (col * (kpiBoxWidth + 5))
    const y = currentY + (row * (kpiBoxHeight + 5))
    
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.1)
    doc.roundedRect(x, y, kpiBoxWidth, kpiBoxHeight, 2, 2, 'D')
    
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(kpi.label.toUpperCase(), x + 5, y + 7)
    
    doc.setFontSize(11)
    doc.setTextColor(6, 13, 20)
    doc.text(kpi.value, x + 5, y + 15)
    
    if (index === kpis.length - 1) currentY = y + kpiBoxHeight + 15
  })

  // --- Charts Section ---
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Gráficos de Análisis', margin, currentY)
  currentY += 10

  for (const chartId of chartIds) {
    const element = document.getElementById(chartId)
    if (element) {
      // Ensure the chart is rendered properly for capture
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = pageWidth - (margin * 2)
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      if (currentY + imgHeight > pageHeight - margin) {
        doc.addPage()
        currentY = margin + 10
      }
      
      doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight)
      currentY += imgHeight + 10
    }
  }

  // --- Records Table ---
  doc.addPage()
  currentY = 20
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Detalle de Registros', margin, currentY)
  currentY += 8

  // User requirement: Max 2 months with warning
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
  
  const filteredMetrics = metrics.filter(m => new Date(m.date) >= twoMonthsAgo)
  const isLimited = filteredMetrics.length < metrics.length

  if (isLimited) {
    doc.setFillColor(255, 240, 240)
    doc.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F')
    doc.setTextColor(200, 0, 0)
    doc.setFontSize(8)
    doc.text('AVISO: El listado detallado está limitado a los últimos 2 meses para optimizar el reporte.', margin + 5, currentY + 6.5)
    currentY += 15
  } else {
    currentY += 5
  }

  // Table Header
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, currentY, pageWidth - (margin * 2), 7, 'F')
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  
  const cols = [
    { name: 'Fecha', w: 22 },
    { name: 'Producto', w: 55 },
    { name: 'Pedidos', w: 18 },
    { name: 'Envío', w: 18 },
    { name: 'Entrega', w: 18 },
    { name: 'Revenue', w: 23 },
    { name: 'Profit', w: 23 },
  ]
  
  let xOffset = margin + 2
  cols.forEach(col => {
    doc.text(col.name, xOffset, currentY + 5)
    xOffset += col.w
  })
  
  currentY += 7
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  // Table Rows (using only the last 2 months as per requirement)
  filteredMetrics.reverse().forEach((m, i) => {
    if (currentY > pageHeight - margin) {
      doc.addPage()
      currentY = margin + 10
    }
    
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 252)
      doc.rect(margin, currentY, pageWidth - (margin * 2), 6, 'F')
    }
    
    xOffset = margin + 2
    doc.text(new Date(m.date).toLocaleDateString(), xOffset, currentY + 4.5)
    xOffset += 22
    doc.text(m.productName || 'N/A', xOffset, currentY + 4.5, { maxWidth: 50 })
    xOffset += 55
    doc.text(m.orders.toString(), xOffset, currentY + 4.5)
    xOffset += 18
    doc.text(`${m.shippingRate.toFixed(1)}%`, xOffset, currentY + 4.5)
    xOffset += 18
    doc.text(`${m.deliveryRate.toFixed(1)}%`, xOffset, currentY + 4.5)
    xOffset += 18
    doc.text(formatCurrency(m.revenue), xOffset, currentY + 4.5)
    xOffset += 23
    
    const profit = formatCurrency(m.profit)
    if (m.profit < 0) doc.setTextColor(200, 0, 0)
    doc.text(profit, xOffset, currentY + 4.5)
    doc.setTextColor(0, 0, 0)
    
    currentY += 6
  })

  // Save the PDF
  const filename = `Reporte_ProfitCod_${dateRange.start}_${dateRange.end}.pdf`
  doc.save(filename)
}
