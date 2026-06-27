import { useState, useEffect } from 'react';
import { useConstraints } from '../../hooks/useConstraints';
import StatsCard from '../common/StatsCard';
import Badge from '../common/Badge';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import { getToday } from '../../utils/dateUtils';
import { getConstraintIcon, getConstraintColor } from '../../utils/constants';

const LDConstraints = () => {
  const { constraints, summary, loadConstraints, loadSummary, updateStatus } = useConstraints();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const today = getToday();
      await loadConstraints(today);
      await loadSummary(today);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    await updateStatus(id, status);
    const today = getToday();
    await loadConstraints(today);
    await loadSummary(today);
  };

  const statusMap = {
    'Pending': 'stop',
    'Proses': 'pend',
    'Selesai': 'prog'
  };

  // Distribution data
  const distribution = Object.entries(summary.byType || {}).map(([type, count]) => ({
    type,
    count,
    percentage: summary.total > 0 ? (count / summary.total * 100) : 0
  }));

  // Downtime per hour (mock)
  const downtimeData = [
    { hour: '07:00–08:00', minutes: 12, severity: 'low' },
    { hour: '08:00–09:00', minutes: 32, severity: 'high' },
    { hour: '09:00–10:00', minutes: 15, severity: 'medium' },
  ];

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Monitoring Kendala Produksi</h1>
          <p>Kendala yang dilaporkan oleh operator hari ini.</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '18px' }}>
        <StatsCard
          label="Total Kendala"
          value={summary.total || 0}
          subtext="Hari ini"
          icon="⚠"
        />
        <StatsCard
          label="Total Downtime"
          value={`${summary.totalDowntime || 0} mnt`}
          subtext={summary.totalDowntime > 0 ? '⏱ Terjadi downtime' : '✅ Tidak ada downtime'}
          icon="⏱"
        />
        <StatsCard
          label="Terbanyak"
          value={distribution.length > 0 ? distribution[0].type : '-'}
          subtext={`${distribution.length > 0 ? distribution[0].count : 0} dari ${summary.total} kejadian`}
        />
      </div>

      <div className="two-col">
        <div>
          <Card title="Daftar Kendala Hari Ini">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--sub)' }}>Loading...</div>
            ) : constraints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--sub)' }}>
                Tidak ada kendala hari ini. ✓
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Jam</th>
                    <th>Operator</th>
                    <th>Jenis Kendala</th>
                    <th>Durasi</th>
                    <th>Keterangan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {constraints.map((c) => (
                    <tr key={c.id}>
                      <td>{c.jam || '--:--'}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.profiles?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--sub)' }}>{c.profiles?.employee_id || '-'}</div>
                      </td>
                      <td>{c.jenis}</td>
                      <td>{c.durasi} mnt</td>
                      <td style={{ fontSize: '12px', color: 'var(--sub)' }}>{c.keterangan || '-'}</td>
                      <td>
                        <select
                          value={c.status || 'Pending'}
                          onChange={(e) => handleStatusUpdate(c.id, e.target.value)}
                          style={{ padding: '2px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px' }}
                        >
                          <option value="Pending">Belum Ditangani</option>
                          <option value="Proses">Proses</option>
                          <option value="Selesai">Selesai</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div>
          <Card title="Distribusi Kendala">
            {distribution.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--sub)' }}>
                Tidak ada data distribusi.
              </div>
            ) : (
              distribution.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span>{item.type}</span>
                    <span style={{ fontWeight: 700 }}>{item.count}</span>
                  </div>
                  <ProgressBar value={item.percentage} color={idx === 0 ? 'prog-r' : idx === 1 ? 'prog-o' : 'prog-g'} />
                </div>
              ))
            )}
          </Card>

          <Card title="Downtime per Jam" className="mt-12">
            {downtimeData.map((item, idx) => {
              const icon = item.severity === 'high' ? '⚙' : item.severity === 'medium' ? '⚠' : '✅';
              const color = item.severity === 'high' ? 'r' : item.severity === 'medium' ? 'o' : 'g';
              const valColor = item.severity === 'high' ? 'r' : item.severity === 'medium' ? 'o' : 'g';
              
              return (
                <div key={idx} className="dt-item">
                  <div className={`dt-ico ${color}`}>{icon}</div>
                  <span className="dt-label">{item.hour}</span>
                  <span className={`dt-val ${valColor}`}>{item.minutes} mnt</span>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LDConstraints;