import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProductions } from '../../hooks/useProductions';
import Card from '../common/Card';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import { getIndonesianDate, getToday } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/helpers';

const OPHISTORY = () => {
  const { user } = useAuth();
  const { hourlyOutputs, loadHourlyOutputs } = useProductions();
  const [loading, setLoading] = useState(true);
  const [userOutputs, setUserOutputs] = useState([]);
  const [totalOutput, setTotalOutput] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (hourlyOutputs.length > 0 || !loading) {
      const outputs = hourlyOutputs.filter(o => o.operator_id === user?.id);
      setUserOutputs(outputs);
      const total = outputs.reduce((sum, o) => sum + (o.qty || 0), 0);
      setTotalOutput(total);
      
      // 🔥 HITUNG JAM KERJA & LEMBUR
      const uniqueHours = new Set(outputs.map(o => o.jam?.split(':')[0]));
      const hoursWorked = uniqueHours.size;
      setTotalHours(hoursWorked);
      
      // Lembur jika lebih dari 8 jam
      const overtime = Math.max(0, hoursWorked - 8);
      setOvertimeHours(overtime);
    }
  }, [hourlyOutputs, user?.id, loading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = getToday();
      await loadHourlyOutputs(today);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const targetDaily = 1080;
  const achievement = targetDaily > 0 ? (totalOutput / targetDaily * 100) : 0;
  const isOvertime = overtimeHours > 0;

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Riwayat Produksi</h1>
          <p>Data output yang telah diinput pada hari ini.</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px' }}>
          📅 {getIndonesianDate()}
        </div>
      </div>

      <div className="two-col">
        <div>
          <Card title="Detail Input Per Jam">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--sub)' }}>Loading...</div>
            ) : userOutputs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--sub)' }}>
                Belum ada data input hari ini.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="data-table" style={{ minWidth: '500px' }}>
                  <thead>
                    <tr>
                      <th>Jam</th>
                      <th>Style</th>
                      <th>Output</th>
                      <th>Target</th>
                      <th>Selisih</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOutputs.map((entry, idx) => {
                      const target = 135;
                      const qty = entry.qty || 0;
                      const selisih = qty - target;
                      let status;
                      
                      if (qty === 0) {
                        status = <Badge type="sched">Start Up</Badge>;
                      } else if (qty >= target) {
                        status = <Badge type="prog">Tercapai</Badge>;
                      } else {
                        status = <Badge type="pend">Di Bawah</Badge>;
                      }
                      
                      return (
                        <tr key={entry.id || idx}>
                          <td>{entry.jam || '--:--'}</td>
                          <td>{entry.style || '-'}</td>
                          <td style={{ fontWeight: 700 }}>{qty}</td>
                          <td>{target}</td>
                          <td style={{ 
                            color: selisih >= 0 ? 'var(--accent)' : 'var(--danger)', 
                            fontWeight: 600 
                          }}>
                            {selisih >= 0 ? '+' : ''}{selisih}
                          </td>
                          <td>{status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card title="Rekap Harian">
            <div className="sum-row">
              <span>Total Output</span>
              <span className="sum-val">{formatNumber(totalOutput)} Pcs</span>
            </div>
            <div className="sum-row">
              <span>Jumlah Input</span>
              <span className="sum-val">{userOutputs.length} kali</span>
            </div>
            <div className="sum-row">
              <span>Target Harian</span>
              <span className="sum-val">{formatNumber(targetDaily)} Pcs</span>
            </div>
            <div className="sum-row">
              <span>Pencapaian</span>
              <span className="sum-val" style={{ color: 'var(--warn)' }}>
                {achievement.toFixed(1)}%
              </span>
            </div>
            <div className="sum-row">
              <span>Kendala Tercatat</span>
              <span className="sum-val">0</span>
            </div>
            
            {/* 🆕 JAM KERJA */}
            <div className="sum-row" style={{ borderTop: '2px solid var(--accent)', marginTop: '4px', paddingTop: '12px' }}>
              <span style={{ fontWeight: 600 }}>⏱ Jam Kerja</span>
              <span className="sum-val" style={{ fontSize: '16px' }}>
                {totalHours} Jam
              </span>
            </div>
            
            {/* 🆕 LEMBUR */}
            <div className="sum-row">
              <span style={{ fontWeight: 600, color: isOvertime ? 'var(--danger)' : 'var(--sub)' }}>
                {isOvertime ? '🔴 Lembur' : 'Lembur'}
              </span>
              <span className="sum-val" style={{ 
                fontSize: '16px', 
                color: isOvertime ? 'var(--danger)' : 'var(--sub)' 
              }}>
                {isOvertime ? `${overtimeHours} Jam` : '0 Jam'}
              </span>
            </div>

            <div style={{ marginTop: '12px' }}>
              <ProgressBar 
                value={achievement} 
                label="Progress Harian" 
                color={achievement >= 100 ? 'prog-g' : achievement >= 75 ? 'prog-o' : 'prog-r'} 
              />
            </div>
          </Card>

          <Card title="Kendala Tercatat" className="mt-12">
            <div style={{ color: 'var(--sub)', fontSize: '12px', textAlign: 'center', padding: '10px 0' }}>
              Tidak ada kendala hari ini. ✓
            </div>
          </Card>

          <button 
            className="btn btn-outline w-full mt-12"
            onClick={fetchData}
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default OPHISTORY;