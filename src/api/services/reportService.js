import { supabase } from '../supabase';
import { productionService } from './productionService';
import { constraintService } from './constraintService';

export const reportService = {
  // Generate daily report
  async generateDailyReport(date = new Date().toISOString().split('T')[0]) {
    // Get all lots with targets
    const lots = await productionService.getLots();
    const outputs = await productionService.getHourlyOutputs(date);
    const constraints = await constraintService.getConstraints(date);
    
    // Calculate per lot
    const lotReports = lots.map(lot => {
      const lotOutputs = outputs.filter(o => o.lot_id === lot.id);
      const totalActual = lotOutputs.reduce((sum, o) => sum + (o.qty || 0), 0);
      const lotConstraints = constraints.filter(c => c.lot_id === lot.id);
      
      return {
        lot_id: lot.id,
        style: lot.styles?.name || 'Unknown',
        lot_number: lot.lot_number,
        target: lot.target_total,
        actual: totalActual,
        achievement: lot.target_total > 0 ? (totalActual / lot.target_total * 100) : 0,
        constraints: lotConstraints.length,
        downtime: lotConstraints.reduce((sum, c) => sum + (c.durasi || 0), 0)
      };
    });
    
    // Totals
    const totalTarget = lotReports.reduce((sum, r) => sum + r.target, 0);
    const totalActual = lotReports.reduce((sum, r) => sum + r.actual, 0);
    
    return {
      date,
      totalTarget,
      totalActual,
      achievement: totalTarget > 0 ? (totalActual / totalTarget * 100) : 0,
      totalConstraints: constraints.length,
      totalDowntime: constraints.reduce((sum, c) => sum + (c.durasi || 0), 0),
      details: lotReports
    };
  },

  // Get operator performance report
  async getOperatorPerformance(date = new Date().toISOString().split('T')[0]) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, employee_id')
      .eq('role', 'operator');
    
    const outputs = await productionService.getHourlyOutputs(date);
    const constraints = await constraintService.getConstraints(date);
    
    const results = profiles.map(profile => {
      const userOutputs = outputs.filter(o => o.operator_id === profile.id);
      const userConstraints = constraints.filter(c => c.operator_id === profile.id);
      const totalOutput = userOutputs.reduce((sum, o) => sum + (o.qty || 0), 0);
      const totalDowntime = userConstraints.reduce((sum, c) => sum + (c.durasi || 0), 0);
      
      return {
        ...profile,
        totalOutput,
        totalConstraints: userConstraints.length,
        totalDowntime
      };
    });
    
    return results;
  },

  // Get hourly summary
  async getHourlySummary(date = new Date().toISOString().split('T')[0]) {
    const outputs = await productionService.getHourlyOutputs(date);
    
    const hourlyMap = {};
    outputs.forEach(item => {
      const hour = item.jam.split(':')[0];
      if (!hourlyMap[hour]) {
        hourlyMap[hour] = { hour, total: 0, count: 0 };
      }
      hourlyMap[hour].total += (item.qty || 0);
      hourlyMap[hour].count += 1;
    });
    
    return Object.values(hourlyMap).sort((a, b) => a.hour - b.hour);
  },

  // Export report as PDF (using jspdf)
  async exportPDF(reportData) {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor('#0f2027');
    doc.text('Laporan Produksi Finishing Embroidery', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor('#718096');
    doc.text(`Tanggal: ${reportData.date}`, pageWidth / 2, 28, { align: 'center' });
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor('#1a202c');
    doc.text(`Total Target: ${reportData.totalTarget} Pcs`, 20, 40);
    doc.text(`Total Aktual: ${reportData.totalActual} Pcs`, 20, 48);
    doc.text(`Pencapaian: ${reportData.achievement.toFixed(1)}%`, 20, 56);
    doc.text(`Total Kendala: ${reportData.totalConstraints}`, 20, 64);
    doc.text(`Total Downtime: ${reportData.totalDowntime} menit`, 20, 72);
    
    // Table
    const tableData = reportData.details.map(item => [
      item.style,
      item.lot_number,
      item.target,
      item.actual,
      `${item.achievement.toFixed(1)}%`,
      item.constraints,
      `${item.downtime} mnt`
    ]);
    
    autoTable(doc, {
      startY: 80,
      head: [['Style', 'Lot', 'Target', 'Aktual', 'Pencapaian', 'Kendala', 'Downtime']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: '#0f2027', textColor: '#ffffff' }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY || 200;
    doc.setFontSize(10);
    doc.setTextColor('#a0aec0');
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 20, finalY + 20);
    doc.text('SIMPROFE © 2026', pageWidth / 2, finalY + 20, { align: 'center' });
    
    return doc;
  }
};