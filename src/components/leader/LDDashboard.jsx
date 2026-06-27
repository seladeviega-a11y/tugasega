import React, { useState, useEffect } from 'react';
import { useProductions } from '../../hooks/useProductions';
import { useConstraints } from '../../hooks/useConstraints';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../common/StatsCard';
import ProgressBar from '../common/ProgressBar';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { getIndonesianDate, getToday } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/helpers';
import { getConstraintIcon, getConstraintColor } from '../../utils/constants';
import toast from 'react-hot-toast';

const LDDashboard = () => {
  const { user } = useAuth();
  const { hourlyOutputs, lots, loadHourlyOutputs, loadLots } = useProductions();
  const { constraints, loadConstraints } = useConstraints();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalOutput, setTotalOutput] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const [styleOutputs, setStyleOutputs] = useState({});
  const [activeOperators, setActiveOperators] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = getToday();
      await loadHourlyOutputs(today);
      await loadConstraints(today);
      await loadLots();

      const total = hourlyOutputs.reduce((sum, o) => sum + (o.qty || 0), 0);
      setTotalOutput(total);

      const target = lots.reduce((sum, l) => sum + (l.target_total || 0), 0);
      setTotalTarget(target);

      const styleMap = {};
      hourlyOutputs.forEach(item => {
        const style = item.style || 'Unknown';
        styleMap[style] = (styleMap[style] || 0) + (item.qty || 0);
      });
      setStyleOutputs(styleMap);

      const operators = {};
      hourlyOutputs.forEach(item => {
        const opId = item.operator_id;
        if (!operators[opId]) {
          operators[opId] = {
            id: opId,
            name: item.profiles?.name || 'Unknown',
            style: item.style || '-',
            total: 0,
            jam: item.jam || '--:--',
            lastInput: item.created_at
          };
        }
        operators[opId].total += (item.qty || 0);
        if (item.jam) operators[opId].jam = item.jam;
      });
      setActiveOperators(Object.values(operators));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const achievement = totalTarget > 0 ? (totalOutput / totalTarget * 100) : 0;

  // 🔥 HITUNG PREDIKSI
  const now = new Date();
  const startHour = 7;
  const endHour = 16;
  const currentHour = now.getHours();
  const hoursElapsed = Math.max(0, currentHour - startHour);
  const totalHours = endHour - startHour;
  const hoursRemaining = Math.max(0, totalHours - hoursElapsed);
  const avgPerHour = hoursElapsed > 0 ? totalOutput / hoursElapsed : 0;
  const predictedFinal = totalOutput + (avgPerHour * hoursRemaining);
  const predictedPercentage = totalTarget > 0 ? Math.min((predictedFinal / totalTarget) * 100, 100) : 0;

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Dashboard Monitoring</h1>
          <p>Pantau performa produksi finishing embroidery secara real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px' }}>
            📅 {getIndonesianDate()}
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatsCard
          label="Total Target"
          value={`${formatNumber(totalTarget)} Pcs`}
          subtext="Target produksi hari ini"
          icon="🎯"
        />
        <StatsCard
          label="Total Output"
          value={`${formatNumber(totalOutput)} Pcs`}
          subtext={`Dari ${hourlyOutputs.length} input`}
          icon="📦"
        />
        <StatsCard
          label="% Pencapaian"
          value={`${achievement.toFixed(1)}%`}
          icon="⚡"
        />
        <StatsCard
          label="Status Produksi"
          value={<Badge type={achievement >= 75 ? 'run' : 'idle'} dot>
            {achievement >= 75 ? 'ON TRACK' : 'PERLU PERHATIAN'}
          </Badge>}
          subtext={`${activeOperators.length} operator aktif`}
          icon="🔄"
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <ProgressBar value={achievement} label="Progress Produksi Hari Ini" color={achievement >= 100 ? 'prog-g' : achievement >= 75 ? 'prog-o' : 'prog-r'} />
      </div>

      {/* Operator Aktif */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="st">
          👷 Operator Aktif Saat Ini
          <span style={{ fontSize: '12px', color: 'var(--sub)' }}>
            {activeOperators.length} operator
          </span>
        </div>
        {activeOperators.length === 0 ? (
          <div style={{ color: 'var(--sub)', textAlign: 'center', padding: '20px' }}>
            Belum ada operator yang input data hari ini.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {activeOperators.map((op, idx) => {
              const colors = ['#2b6cb0', '#00a87a', '#f6a623', '#805ad5', '#e53e3e'];
              const initials = op.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={op.id || idx} style={{ 
                  background: 'var(--bg)', 
                  borderRadius: '8px', 
                  padding: '12px 16px',
                  borderLeft: `3px solid ${colors[idx % colors.length]}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="op-av" style={{ background: colors[idx % colors.length] }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{op.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--sub)' }}>
                        Style: {op.style} | Total: {op.total} Pcs
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="two-col-lg">
        <div>
          {/* Output per operator */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="st">
              Output Operator
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/leader/monitoring')}>
                Lihat Semua →
              </span>
            </div>
            {activeOperators.length === 0 ? (
              <div style={{ color: 'var(--sub)', textAlign: 'center', padding: '20px' }}>
                Belum ada data operator hari ini.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Operator</th>
                    <th>Style</th>
                    <th>Output</th>
                    <th>Jam Terakhir</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOperators.slice(0, 5).map((op, idx) => {
                    const colors = ['#2b6cb0', '#00a87a', '#f6a623', '#805ad5'];
                    const initials = op.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                    const isActive = new Date(op.lastInput) > new Date(Date.now() - 3600000);
                    return (
                      <tr key={op.id || idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="op-av" style={{ background: colors[idx % colors.length] }}>{initials}</div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{op.name}</div>
                            </div>
                          </div>
                        </td>
                        <td>{op.style}</td>
                        <td style={{ fontWeight: 700 }}>{op.total}</td>
                        <td>{op.jam}</td>
                        <td>
                          <Badge type={isActive ? 'run' : 'idle'} dot>
                            {isActive ? 'Aktif' : 'Idle'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          {/* Output per style */}
          <div className="card" style={{ marginBottom: '12px' }}>
            <div className="st">Output per Style</div>
            {Object.entries(styleOutputs).length === 0 ? (
              <div style={{ color: 'var(--sub)', textAlign: 'center', padding: '20px' }}>
                Belum ada data style hari ini.
              </div>
            ) : (
              Object.entries(styleOutputs).map(([style, output]) => {
                const lot = lots.find(l => l.styles?.name === style);
                const target = lot?.target_total || 810;
                const pct = target > 0 ? (output / target * 100) : 0;
                const color = pct >= 100 ? 'prog-g' : pct >= 75 ? 'prog-o' : 'prog-r';
                const textColor = pct >= 100 ? 'var(--accent)' : pct >= 75 ? 'var(--warn)' : 'var(--danger)';
                
                return (
                  <div key={style} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{style}</span>
                      <span style={{ color: textColor, fontWeight: 700 }}>
                        {formatNumber(output)} / {formatNumber(target)} Pcs
                      </span>
                    </div>
                    <div className="prog-wrap">
                      <div className={`prog-bar ${color}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--sub)', marginTop: '2px' }}>
                      {pct.toFixed(1)}% tercapai
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 🔥 AI INSIGHT - FIXED */}
          <div className="ai-box" style={{ marginTop: '12px' }}>
            <div className="ai-badge-txt">✦ AI INSIGHTS</div>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
              Prediksi Akhir Shift
            </div>
            
            <div className="ai-big">
              {totalTarget > 0 ? Math.min(Math.round(predictedPercentage), 100) : 0}%
            </div>
            <div className="ai-sub-txt">dari target harian</div>
            
            <div className="ai-stat-grid">
              <div className="ai-sb">
                <div className="ai-sb-l">Estimasi Final</div>
                <div className="ai-sb-v">
                  {Math.round(predictedFinal).toLocaleString()} Pcs
                </div>
              </div>
              <div className="ai-sb">
                <div className="ai-sb-l">Sisa Waktu</div>
                <div className="ai-sb-v" style={{ color: 'var(--accent)' }}>
                  {hoursRemaining > 0 ? `${hoursRemaining} jam` : 'Shift selesai'}
                </div>
              </div>
              <div className="ai-sb" style={{ gridColumn: 'span 2' }}>
                <div className="ai-sb-l">Rata-rata per Jam</div>
                <div className="ai-sb-v">
                  {Math.round(avgPerHour).toLocaleString()} Pcs/jam
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LDDashboard;