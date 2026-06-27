import React, { useState, useEffect } from 'react';
import { useProductions } from '../../hooks/useProductions';
import { useAuth } from '../../hooks/useAuth';
import StatsCard from '../common/StatsCard';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { getToday } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/helpers';
import { useConstraints } from '../../hooks/useConstraints';
import toast from 'react-hot-toast';

const LDMonitoring = () => {
  const { hourlyOutputs, loadHourlyOutputs, lots, loadLots } = useProductions();
  const { constraints, loadConstraints } = useConstraints();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalOutput, setTotalOutput] = useState(0);
  const [hourlyTotal, setHourlyTotal] = useState(0);
  const [operatorData, setOperatorData] = useState([]);
  const [totalTarget, setTotalTarget] = useState(0);

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
      
      // 🔥 Ambil data real dari DB
      const total = hourlyOutputs.reduce((sum, o) => sum + (o.qty || 0), 0);
      setTotalOutput(total);
      
      const target = lots.reduce((sum, l) => sum + (l.target_total || 0), 0);
      setTotalTarget(target);
      
      // Current hour
      const currentHour = new Date().getHours();
      const currentHourStr = `${String(currentHour).padStart(2, '0')}:00`;
      const hourly = hourlyOutputs.filter(o => o.jam === currentHourStr);
      setHourlyTotal(hourly.reduce((sum, o) => sum + (o.qty || 0), 0));
      
      // 🔥 Group by operator dari data real
      const operatorMap = {};
      hourlyOutputs.forEach(item => {
        const opId = item.operator_id;
        if (!operatorMap[opId]) {
          operatorMap[opId] = {
            id: opId,
            name: item.profiles?.name || 'Unknown',
            employee_id: item.profiles?.employee_id || '-',
            style: item.style || '-',
            total: 0,
            hourly: 0,
            count: 0
          };
        }
        operatorMap[opId].total += (item.qty || 0);
        operatorMap[opId].count += 1;
        if (item.jam === currentHourStr) {
          operatorMap[opId].hourly += (item.qty || 0);
        }
      });
      
      // Hitung efisiensi
      const data = Object.values(operatorMap).map(op => {
        const targetPerOperator = totalTarget > 0 ? Math.round(totalTarget / Object.keys(operatorMap).length) : 405;
        const efficiency = targetPerOperator > 0 ? (op.total / targetPerOperator * 100) : 0;
        const diff = op.total - targetPerOperator;
        return {
          ...op,
          target: targetPerOperator,
          diff,
          efficiency,
          trend: efficiency >= 95 ? 'up' : efficiency >= 75 ? 'neutral' : 'down'
        };
      });
      
      setOperatorData(data);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      toast.error('Gagal memuat data monitoring');
    } finally {
      setLoading(false);
    }
  };

  const activeOperators = operatorData.length;
  const totalOperators = 35;
  const diff = totalOutput - totalTarget;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{ color: 'var(--sub)' }}>Loading data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Monitoring Produksi Real Time</h1>
          <p>Pantau output setiap operator dan selisih terhadap target per jam.</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>LIVE</span>
          <Button variant="outline" size="sm" onClick={fetchData}>🔄</Button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.4 }
        }
      `}</style>

      <div className="stats-grid" style={{ marginBottom: '18px' }}>
        <StatsCard
          label="Output / Jam Ini"
          value={`${formatNumber(hourlyTotal)} Pcs`}
          subtext={`${new Date().getHours()}:00 - ${new Date().getHours() + 1}:00`}
        />
        <StatsCard
          label="Total Output"
          value={formatNumber(totalOutput)}
          subtext={`dari ${formatNumber(totalTarget)} target`}
        />
        <StatsCard
          label="Selisih Target"
          value={diff < 0 ? `-${formatNumber(Math.abs(diff))}` : `+${formatNumber(diff)}`}
          subtext="Shift masih berjalan"
          trend={diff >= 0 ? 'up' : 'dn'}
          trendLabel={diff >= 0 ? 'On Track' : 'Behind Target'}
        />
        <StatsCard
          label="Operator Aktif"
          value={`${activeOperators} / ${totalOperators}`}
          subtext={`${totalOperators - activeOperators} tidak aktif`}
        />
      </div>

      {/* Per operator detail */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>Output Per Operator</div>
          <Button variant="outline" size="sm" onClick={fetchData}>🔄 Refresh</Button>
        </div>
        {operatorData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--sub)' }}>
            Belum ada data operator hari ini.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Operator</th>
                <th>Style</th>
                <th>Jam Ini</th>
                <th>Total Output</th>
                <th>Target</th>
                <th>Selisih</th>
                <th>Efisiensi</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {operatorData.map((op, idx) => {
                const colors = ['#2b6cb0', '#00a87a', '#f6a623', '#805ad5'];
                const initials = op.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                const effClass = op.efficiency >= 95 ? 'eff-hi' : 'eff-lo';
                const diffClass = op.diff >= 0 ? 'var(--accent)' : 'var(--danger)';
                const diffSign = op.diff >= 0 ? '+' : '';
                const trendIcon = op.trend === 'up' ? '↗' : op.trend === 'down' ? '↘' : '→';
                const trendColor = op.trend === 'up' ? 'var(--accent)' : op.trend === 'down' ? 'var(--danger)' : 'var(--warn)';
                
                return (
                  <tr key={op.id || idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="op-av" style={{ background: colors[idx % colors.length] }}>{initials}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{op.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--sub)' }}>{op.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{op.style}</td>
                    <td style={{ fontWeight: 700 }}>{op.hourly || 0}</td>
                    <td>{op.total || 0}</td>
                    <td>{op.target || 0}</td>
                    <td style={{ color: diffClass, fontWeight: 700 }}>{diffSign}{op.diff || 0}</td>
                    <td><span className={`eff-badge ${effClass}`}>{op.efficiency?.toFixed(1) || 0}%</span></td>
                    <td style={{ color: trendColor, fontSize: '18px' }}>{trendIcon}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LDMonitoring;