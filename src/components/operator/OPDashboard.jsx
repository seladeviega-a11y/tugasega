import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProductions } from '../../hooks/useProductions';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../common/StatsCard';
import ProgressBar from '../common/ProgressBar';
import Button from '../common/Button';
import { getIndonesianDate, getToday } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/helpers';

const OPDashboard = () => {
  const { user } = useAuth();
  const { hourlyOutputs, loadHourlyOutputs } = useProductions();
  const navigate = useNavigate();
  
  const [totalOutput, setTotalOutput] = useState(0);
  const [targetPerHour, setTargetPerHour] = useState(135);
  const [targetDaily, setTargetDaily] = useState(1080);
  const [loading, setLoading] = useState(true);
  const [userOutputs, setUserOutputs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const outputs = hourlyOutputs.filter(o => o.operator_id === user?.id);
    setUserOutputs(outputs);
    const total = outputs.reduce((sum, o) => sum + (o.qty || 0), 0);
    setTotalOutput(total);
    setLoading(false);
  }, [hourlyOutputs, user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = getToday();
      await loadHourlyOutputs(today);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const achievement = targetDaily > 0 ? (totalOutput / targetDaily * 100) : 0;
  const historyPreview = userOutputs.slice(-3).reverse();

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Dashboard Operator</h1>
          <p>Selamat pagi! Berikut ringkasan produksi Anda hari ini.</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px' }}>
          📅 {getIndonesianDate()}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px', borderLeft: '4px solid var(--accent)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div className="text-label">Nama Operator</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{user?.name || 'User'}</div>
          </div>
          <div>
            <div className="text-label">Style Aktif</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>IVYS / HCPS</div>
          </div>
          <div>
            <div className="text-label">Status Mesin</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }}></div>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>RUNNING</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatsCard label="Target / Jam" value={`${formatNumber(targetPerHour)} Pcs`} icon="" />
        <StatsCard 
          label="Output Hari Ini" 
          value={`${formatNumber(totalOutput)} Pcs`} 
          subtext={`${userOutputs.length} jam terekam`} 
          icon="" 
        />
        <StatsCard label="Target Harian" value={`${formatNumber(targetDaily)} Pcs`} icon="" />
        <StatsCard label="Pencapaian" value={`${achievement.toFixed(1)}%`} icon="" />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <ProgressBar 
          value={achievement} 
          label="Progress Harian" 
          color={achievement >= 100 ? 'prog-g' : achievement >= 75 ? 'prog-o' : 'prog-r'} 
        />
      </div>

      <div className="two-col">
        <div>
          <div className="card">
            <div className="st">
              Riwayat Input Hari Ini
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/operator/riwayat')}>
                Lihat Semua →
              </span>
            </div>
            {loading ? (
              <div style={{ color: 'var(--sub)', fontSize: '13px', padding: '12px 0', textAlign: 'center' }}>Loading...</div>
            ) : historyPreview.length === 0 ? (
              <div style={{ color: 'var(--sub)', fontSize: '13px', padding: '12px 0', textAlign: 'center' }}>Belum ada data input hari ini.</div>
            ) : (
              historyPreview.map((entry, idx) => (
                <div key={entry.id || idx} className="hourly-row" style={{ padding: '8px 0' }}>
                  <div className="h-time">{entry.jam || '--:--'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--sub)' }}>{entry.style || '-'}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>
                    {entry.qty || 0} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--sub)' }}>pcs</span>
                  </div>
                  <div className="h-icon" style={{ color: 'var(--accent)' }}>✓</div>
                </div>
              ))
            )}
            <Button variant="primary" className="w-full mt-12" onClick={() => navigate('/operator/input')}>
              + Input Output Produksi
            </Button>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: '12px' }}>
            <div className="st">Summary Hari Ini</div>
            <div className="sum-row"><span>Total Output</span><span className="sum-val">{formatNumber(totalOutput)} Pcs</span></div>
            <div className="sum-row"><span>Waktu Efektif</span><span className="sum-val">{userOutputs.length * 60} Min</span></div>
            <div className="sum-row"><span>Kendala Tercatat</span><span className="sum-val">0</span></div>
            {/* ❌ ESTIMATED INCENTIVE DIHAPUS */}
          </div>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/operator/kendala')}>
            ⚠ Laporkan Kendala
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OPDashboard;