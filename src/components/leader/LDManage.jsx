import { useState, useEffect } from 'react';
import { useProductions } from '../../hooks/useProductions';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import Card from '../common/Card';
import { PRIORITY_OPTIONS, PROCESS_OPTIONS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';
import toast from 'react-hot-toast';

const LDManage = () => {
  const { lots, styles, loadLots, loadStyles, createLot, createAssignment } = useProductions();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    style: '',
    lot_number: '',
    target_total: '',
    priority: 'Normal',
    operator_id: '',
    process: 'Finishing'
  });

  useEffect(() => {
    loadLots();
    loadStyles();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create lot first
      const lot = await createLot({
        style_id: formData.style_id,
        lot_number: formData.lot_number,
        target_total: parseInt(formData.target_total),
        priority: formData.priority,
        status: 'Scheduled'
      });
      
      // Create assignment
      if (formData.operator_id) {
        await createAssignment({
          operator_id: formData.operator_id,
          lot_id: lot.id,
          assigned_date: new Date().toISOString().split('T')[0],
          active: true
        });
      }
      
      setShowForm(false);
      setFormData({
        style: '',
        lot_number: '',
        target_total: '',
        priority: 'Normal',
        operator_id: '',
        process: 'Finishing'
      });
      await loadLots();
      toast.success('Data produksi berhasil ditambahkan!');
    } catch (error) {
      console.error('Error creating production data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock operators list (would come from profiles table)
  const operators = [
    { id: 'op-001', name: 'Ega Selaclevi', employee_id: 'OP-033' },
    { id: 'op-002', name: 'Agus Mahendra', employee_id: 'OP-042' },
    { id: 'op-003', name: 'Siti Dahlia', employee_id: 'OP-085' },
    { id: 'op-004', name: 'Budi Prakoso', employee_id: 'OP-021' },
  ];

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Kelola Data Produksi</h1>
          <p>Tambah dan atur style, lot, target, dan penugasan operator.</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Tutup Form' : '+ Tambah Data Produksi'}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="mb-12" style={{ border: '2px solid var(--accent)' }}>
          <div className="st">Tambah Data Produksi Baru</div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="field-label">Style</label>
                <input
                  type="text"
                  id="style"
                  value={formData.style}
                  onChange={handleInputChange}
                  placeholder="Contoh: IVYS / HCPS"
                  required
                />
              </div>
              <div className="form-group">
                <label className="field-label">Lot / Batch No.</label>
                <input
                  type="text"
                  id="lot_number"
                  value={formData.lot_number}
                  onChange={handleInputChange}
                  placeholder="Contoh: 503 + 568"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="field-label">Target Produksi (Pcs)</label>
                <input
                  type="number"
                  id="target_total"
                  value={formData.target_total}
                  onChange={handleInputChange}
                  placeholder="1000"
                  required
                />
              </div>
              <div className="form-group">
                <label className="field-label">Prioritas</label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="field-label">Operator Ditugaskan</label>
                <select
                  id="operator_id"
                  value={formData.operator_id}
                  onChange={handleInputChange}
                >
                  <option value="">Pilih Operator</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.name} ({op.employee_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="field-label">Proses</label>
                <select
                  id="process"
                  value={formData.process}
                  onChange={handleInputChange}
                >
                  {PROCESS_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setShowForm(false)} type="button">
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <div className="ftab active">Semua</div>
        <div className="ftab">Sedang Berjalan</div>
        <div className="ftab">Selesai</div>
        <div className="ftab">Tertunda</div>
      </div>

      {/* Data Table */}
      <Card className="p-0" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Style</th>
              <th>Lot</th>
              <th>Target</th>
              <th>Prioritas</th>
              <th>Operator</th>
              <th>Progress</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot, idx) => {
              // Mock progress
              const progress = idx === 0 ? 11.6 : idx === 1 ? 70 : idx === 2 ? 75 : 0;
              const status = progress > 0 ? 'Berjalan' : 'Terjadwal';
              const badgeType = progress > 0 ? 'prog' : 'sched';
              const priorityBadge = lot.priority === 'Tinggi' ? 'stop' : 'sched';
              const priorityColor = lot.priority === 'Tinggi' ? { background: '#fff0f0', color: '#c53030' } : {};
              
              return (
                <tr key={lot.id}>
                  <td style={{ fontWeight: 700 }}>{lot.styles?.name || '-'}</td>
                  <td>{lot.lot_number}</td>
                  <td>{formatNumber(lot.target_total)} Pcs</td>
                  <td>
                    <span className="badge badge-sched" style={priorityColor}>
                      {lot.priority || 'Normal'}
                    </span>
                  </td>
                  <td>{lot.operator?.name || '-'}</td>
                  <td>
                    <div className="prog-wrap" style={{ width: '100px' }}>
                      <div className={`prog-bar ${progress >= 100 ? 'prog-g' : progress >= 75 ? 'prog-o' : 'prog-r'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '2px', color: 'var(--sub)' }}>{progress}%</div>
                  </td>
                  <td><Badge type={badgeType} dot={progress > 0}>{status}</Badge></td>
                  <td><button className="act-dots">⋮</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default LDManage;