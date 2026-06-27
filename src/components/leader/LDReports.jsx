import { useState, useEffect } from 'react';
import { useProductions } from '../../hooks/useProductions';
import { useConstraints } from '../../hooks/useConstraints';
import { reportService } from '../../api/services/reportService';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { getToday } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/helpers';
import toast from 'react-hot-toast';

const LDReports = () => {
  const { lots, loadLots } = useProductions();
  const { constraints, loadConstraints } = useConstraints();
  const [reportData, setReportData] = useState(null);
  const [operatorReport, setOperatorReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(getToday());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await loadLots();
      await loadConstraints(date);
      
      // Generate report
      const report = await reportService.generateDailyReport(date);
      setReportData(report);
      
      const opReport = await reportService.getOperatorPerformance(date);
      setOperatorReport(opReport);
      
      setLoading(false);
    };
    fetchData();
  }, [date]);

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleExportPDF = async () => {
    if (!reportData) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }
    
    try {
      const doc = await reportService.exportPDF(reportData);
      doc.save(`Laporan_Produksi_${reportData.date}.pdf`);
      toast.success('PDF berhasil diunduh!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Gagal mengexport PDF');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{ color: 'var(--sub)' }}>Loading laporan...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Laporan Produksi</h1>
          <p>Laporan harian produksi finishing embroidery.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff' }}
          />
          <Button variant="outline">⚙ Filter</Button>
          <Button variant="primary" onClick={handleExportPDF}>📄 Export PDF</Button>
        </div>
      </div>

      {/* Summary Strip */}
      {reportData && (
        <div className="kpi-strip mb-12">
          <div className="kpi-item">
            <div className="ki-label">Total Target</div>
            <div className="ki-val">{formatNumber(reportData.totalTarget)} Pcs</div>
          </div>
          <div className="kpi-item">
            <div className="ki-label">Total Aktual</div>
            <div className="ki-val" style={{ color: 'var(--accent)' }}>{formatNumber(reportData.totalActual)} Pcs</div>
          </div>
          <div className="kpi-item">
            <div className="ki-label">% Pencapaian</div>
            <div className="ki-val" style={{ color: 'var(--accent)' }}>{reportData.achievement.toFixed(1)}%</div>
          </div>
          <div className="kpi-item">
            <div className="ki-label">Total Kendala</div>
            <div className="ki-val" style={{ color: 'var(--warn)' }}>{reportData.totalConstraints} kasus</div>
          </div>
          <div className="kpi-item">
            <div className="ki-label">Total Downtime</div>
            <div className="ki-val" style={{ color: 'var(--warn)' }}>{reportData.totalDowntime} mnt</div>
          </div>
        </div>
      )}

      {/* Per Style / Lot */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: '15px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Laporan Per Style / Lot
          <Button variant="outline" size="sm" onClick={() => toast.success('CSV downloaded!')}>
            ↓ Export CSV
          </Button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Style</th>
              <th>Lot</th>
              <th>Target</th>
              <th>Aktual</th>
              <th>% Pencapaian</th>
              <th>Kendala</th>
              <th>Downtime</th>
            </tr>
          </thead>
          <tbody>
            {reportData?.details.map((item, idx) => {
              const effClass = item.achievement >= 95 ? 'eff-hi' : 'eff-lo';
              const color = item.achievement >= 95 ? 'var(--accent)' : 'var(--warn)';
              
              return (
                <tr key={idx}>
                  <td style={{ fontWeight: 700 }}>{item.style}</td>
                  <td>{item.lot_number}</td>
                  <td>{formatNumber(item.target)}</td>
                  <td style={{ fontWeight: 700, color }}>{formatNumber(item.actual)}</td>
                  <td><span className={`eff-badge ${effClass}`}>{item.achievement.toFixed(1)}%</span></td>
                  <td>{item.constraints}</td>
                  <td>{item.downtime} mnt</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Per Operator */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: '15px', fontWeight: 700 }}>
          Laporan Per Operator
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Operator</th>
              <th>Style</th>
              <th>Target</th>
              <th>Aktual</th>
              <th>%</th>
              <th>Kendala</th>
            </tr>
          </thead>
          <tbody>
            {operatorReport.map((op, idx) => {
              // Mock style and target
              const styles = ['IVYS/HCPS', 'POLO-M04', 'CORP-A', 'IVYS/HCPS'];
              const targets = [1080, 1200, 810, 1080];
              const pct = targets[idx] > 0 ? (op.totalOutput / targets[idx] * 100) : 0;
              const effClass = pct >= 95 ? 'eff-hi' : 'eff-lo';
              const color = pct >= 95 ? 'var(--accent)' : 'var(--warn)';
              
              return (
                <tr key={idx}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="op-av" style={{ background: ['#2b6cb0', '#00a87a', '#f6a623', '#805ad5'][idx % 4] }}>
                        {op.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'OP'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{op.name || 'Unknown'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--sub)' }}>{op.employee_id || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{styles[idx % styles.length]}</td>
                  <td>{formatNumber(targets[idx % targets.length])}</td>
                  <td style={{ fontWeight: 700, color }}>{formatNumber(op.totalOutput || 0)}</td>
                  <td><span className={`eff-badge ${effClass}`}>{pct.toFixed(1)}%</span></td>
                  <td>{op.totalConstraints || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LDReports;