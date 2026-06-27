import React, { useState, useEffect } from 'react';
import { useProductions } from '../../hooks/useProductions';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Card from '../common/Card';
import { PRIORITY_OPTIONS, PROCESS_OPTIONS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { supabase } from '../../api/supabase';

const LDManage = () => {
  const { lots, styles, loadLots, loadStyles, createLot, createAssignment } = useProductions();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  
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
      const lot = await createLot({
        style_id: formData.style_id,
        lot_number: formData.lot_number,
        target_total: parseInt(formData.target_total),
        priority: formData.priority,
        status: 'Scheduled'
      });
      
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
      toast.error('Gagal menambah data');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 RESET DATA - KOSONGKAN SEMUA DATA PRODUKSI
  const handleResetData = async () => {
    if (!confirm('⚠️ Yakin ingin menghapus SEMUA data produksi? (Style, Lot, Assignment, Output, Kendala akan dihapus)')) {
      return;
    }

    setResetting(true);
    try {
      // Hapus semua data dari tabel
      await supabase.from('hourly_outputs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('constraints').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('lots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('styles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast.success('✅ Semua data produksi berhasil direset!');
      await loadLots();
      await loadStyles();
    } catch (error) {
      console.error('Error resetting data:', error);
      toast.error('Gagal mereset data: ' + error.message);
    } finally {
      setResetting(false);
    }
  };

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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Tutup Form' : '+ Tambah Data Produksi'}
          </Button>
          {/* 🔥 TOMBOL RESET DATA */}
          <Button variant="danger" onClick={handleResetData} disabled={resetting}>
            {resetting ? 'Merreset...' : '🗑️ Reset Data'}
          </Button>
        </div>
      </div>

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

      <div className="filter-tabs">
        <div className="ftab active">Semua</div>
        <div className="ftab">Sedang Berjalan</div>
        <div className="ftab">Selesai</div>
        <div className="ftab">Tertunda</div>
      </div>

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
            {lots.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--sub)' }}>
                  Belum ada data produksi. Klik "Tambah Data Produksi" untuk menambahkan.
                </td>
              </tr>
            ) : (
              lots.map((lot, idx) => {
                const progress = idx === 0 ? 11.6 : idx === 1 ? 70 : idx === 2 ? 75 : 0;
                const status = progress > 0 ? 'Berjalan' : 'Terjadwal';
                const badgeType = progress > 0 ? 'prog' : 'sched';
                
                return (
                  <tr key={lot.id}>
                    <td style={{ fontWeight: 700 }}>{lot.styles?.name || '-'}</td>
                    <td>{lot.lot_number}</td>
                    <td>{formatNumber(lot.target_total)} Pcs</td>
                    <td>
                      <span className="badge badge-sched">
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
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default LDManage;