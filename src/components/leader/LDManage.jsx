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
  const { lots, styles, loadLots, loadStyles, createLot, createAssignment, assignments } = useProductions();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('Semua');
  const [filteredLots, setFilteredLots] = useState([]);
  const [editingLot, setEditingLot] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  
  const [formData, setFormData] = useState({
    style: '',
    style_id: '',
    lot_number: '',
    target_total: '',
    priority: 'Normal',
    operator_ids: [],
    process: 'Finishing'
  });

  const [editData, setEditData] = useState({
    id: '',
    style: '',
    lot_number: '',
    target_total: '',
    priority: 'Normal',
    status: 'Berjalan',
    operator_ids: []
  });

  const [operators, setOperators] = useState([]);

  useEffect(() => {
    loadData();
    fetchOperators();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [lots, filter]);

  const loadData = async () => {
    await loadLots();
    await loadStyles();
  };

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, employee_id')
        .eq('role', 'operator');
      if (error) throw error;
      setOperators(data || []);
    } catch (error) {
      console.error('Error fetching operators:', error);
      toast.error('Gagal memuat daftar operator');
    }
  };

  const applyFilter = () => {
    let filtered = [...lots];
    if (filter === 'Sedang Berjalan') {
      filtered = filtered.filter(l => l.status === 'Berjalan');
    } else if (filter === 'Selesai') {
      filtered = filtered.filter(l => l.status === 'Selesai');
    } else if (filter === 'Tertunda') {
      filtered = filtered.filter(l => l.status === 'Tertunda' || l.status === 'Scheduled');
    }
    setFilteredLots(filtered);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleAddOperator = (operatorId) => {
    if (!formData.operator_ids.includes(operatorId)) {
      setFormData({
        ...formData,
        operator_ids: [...formData.operator_ids, operatorId]
      });
    }
  };

  const handleRemoveOperator = (operatorId) => {
    setFormData({
      ...formData,
      operator_ids: formData.operator_ids.filter(id => id !== operatorId)
    });
  };

  const handleEditAddOperator = (operatorId) => {
    if (!editData.operator_ids.includes(operatorId)) {
      setEditData({
        ...editData,
        operator_ids: [...editData.operator_ids, operatorId]
      });
    }
  };

  const handleEditRemoveOperator = (operatorId) => {
    setEditData({
      ...editData,
      operator_ids: editData.operator_ids.filter(id => id !== operatorId)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: styleData, error: styleError } = await supabase
        .from('styles')
        .insert({
          name: formData.style,
          target_per_hour: 135,
          process_type: formData.process
        })
        .select()
        .single();

      if (styleError) throw styleError;

      const lotData = {
        style_id: styleData.id,
        lot_number: formData.lot_number,
        target_total: parseInt(formData.target_total),
        priority: formData.priority,
        status: 'Berjalan'
      };

      const { data: lotResult, error: lotError } = await supabase
        .from('lots')
        .insert(lotData)
        .select()
        .single();

      if (lotError) throw lotError;

      if (formData.operator_ids.length > 0) {
        const assignmentsData = formData.operator_ids.map(opId => ({
          operator_id: opId,
          lot_id: lotResult.id,
          assigned_date: new Date().toISOString().split('T')[0],
          active: true
        }));

        const { error: assignError } = await supabase
          .from('assignments')
          .insert(assignmentsData);

        if (assignError) throw assignError;
      }

      toast.success(`✅ Produksi berhasil ditambahkan untuk ${formData.operator_ids.length} operator!`);
      setShowForm(false);
      resetForm();
      await loadData();
      await fetchOperators();
    } catch (error) {
      console.error('Error creating production:', error);
      toast.error('Gagal menambah data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndProduction = async (lotId) => {
    if (!confirm('Yakin ingin mengakhiri produksi ini?')) return;

    try {
      const { error } = await supabase
        .from('lots')
        .update({ status: 'Selesai' })
        .eq('id', lotId);

      if (error) throw error;

      await supabase
        .from('assignments')
        .update({ active: false })
        .eq('lot_id', lotId);

      toast.success('✅ Produksi telah diakhiri!');
      await loadData();
    } catch (error) {
      console.error('Error ending production:', error);
      toast.error('Gagal mengakhiri produksi');
    }
  };

  // 🔥 DELETE PRODUKSI
  const handleDeleteProduction = async (lotId) => {
    if (!confirm('⚠️ Yakin ingin menghapus produksi ini? Semua data terkait (output, kendala, assignment) akan ikut terhapus!')) return;

    try {
      // 1. Hapus hourly_outputs terkait
      await supabase
        .from('hourly_outputs')
        .delete()
        .eq('lot_id', lotId);

      // 2. Hapus constraints terkait
      await supabase
        .from('constraints')
        .delete()
        .eq('lot_id', lotId);

      // 3. Hapus assignments
      await supabase
        .from('assignments')
        .delete()
        .eq('lot_id', lotId);

      // 4. Hapus lot
      const { error } = await supabase
        .from('lots')
        .delete()
        .eq('id', lotId);

      if (error) throw error;

      toast.success('🗑️ Produksi berhasil dihapus!');
      await loadData();
      await fetchOperators();
    } catch (error) {
      console.error('Error deleting production:', error);
      toast.error('Gagal menghapus produksi');
    }
  };

  const handleEdit = (lot) => {
    setEditingLot(lot);
    const lotAssignments = assignments.filter(a => a.lot_id === lot.id && a.active);
    setEditData({
      id: lot.id,
      style: lot.styles?.name || '',
      lot_number: lot.lot_number || '',
      target_total: lot.target_total || '',
      priority: lot.priority || 'Normal',
      status: lot.status || 'Berjalan',
      operator_ids: lotAssignments.map(a => a.operator_id)
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: lotError } = await supabase
        .from('lots')
        .update({
          lot_number: editData.lot_number,
          target_total: parseInt(editData.target_total),
          priority: editData.priority,
          status: editData.status
        })
        .eq('id', editData.id);

      if (lotError) throw lotError;

      await supabase
        .from('assignments')
        .delete()
        .eq('lot_id', editData.id);

      if (editData.operator_ids.length > 0) {
        const assignmentsData = editData.operator_ids.map(opId => ({
          operator_id: opId,
          lot_id: editData.id,
          assigned_date: new Date().toISOString().split('T')[0],
          active: true
        }));

        const { error: assignError } = await supabase
          .from('assignments')
          .insert(assignmentsData);

        if (assignError) throw assignError;
      }

      toast.success('✅ Produksi berhasil diperbarui!');
      setShowEditForm(false);
      setEditingLot(null);
      await loadData();
      await fetchOperators();
    } catch (error) {
      console.error('Error editing production:', error);
      toast.error('Gagal mengedit produksi');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      style: '',
      style_id: '',
      lot_number: '',
      target_total: '',
      priority: 'Normal',
      operator_ids: [],
      process: 'Finishing'
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      'Berjalan': <Badge type="prog" dot>Sedang Berjalan</Badge>,
      'Selesai': <Badge type="run">Selesai</Badge>,
      'Tertunda': <Badge type="sched">Tertunda</Badge>,
      'Scheduled': <Badge type="sched">Tertunda</Badge>
    };
    return map[status] || <Badge type="sched">{status || 'Tertunda'}</Badge>;
  };

  const getOperatorName = (id) => {
    const op = operators.find(o => o.id === id);
    return op ? `${op.name} (${op.employee_id})` : id;
  };

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

      {/* FORM TAMBAH PRODUKSI */}
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
                <label className="field-label">Pilih Operator</label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px',
                  padding: '10px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  minHeight: '50px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  background: 'var(--bg)'
                }}>
                  {operators.map(op => (
                    <div
                      key={op.id}
                      onClick={() => handleAddOperator(op.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: formData.operator_ids.includes(op.id) ? 'var(--accent)' : 'var(--border)',
                        color: formData.operator_ids.includes(op.id) ? '#fff' : 'var(--text)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        transition: 'all 0.15s',
                        userSelect: 'none',
                        border: 'none'
                      }}
                    >
                      {op.name} ({op.employee_id})
                    </div>
                  ))}
                  {operators.length === 0 && (
                    <div style={{ color: 'var(--sub)', fontSize: '12px' }}>
                      Belum ada operator. Daftarkan operator dulu.
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--sub)', marginTop: '4px' }}>
                  Klik operator untuk tambah ke daftar
                </div>
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

            {formData.operator_ids.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <label className="field-label">Operator Dipilih</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {formData.operator_ids.map(id => {
                    const op = operators.find(o => o.id === id);
                    return (
                      <div
                        key={id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          background: 'var(--accent)',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        {op ? `${op.name} (${op.employee_id})` : id}
                        <span
                          onClick={() => handleRemoveOperator(id)}
                          style={{
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#fff',
                            opacity: 0.8
                          }}
                        >
                          ✕
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }} type="button">
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* EDIT PRODUKSI MODAL */}
      {showEditForm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="st">Edit Produksi</div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="field-label">Style</label>
                <input
                  type="text"
                  value={editData.style}
                  onChange={(e) => setEditData({ ...editData, style: e.target.value })}
                  placeholder="Style"
                  required
                />
              </div>
              <div className="form-group">
                <label className="field-label">Lot / Batch</label>
                <input
                  type="text"
                  value={editData.lot_number}
                  onChange={(e) => setEditData({ ...editData, lot_number: e.target.value })}
                  placeholder="Lot"
                  required
                />
              </div>
              <div className="form-group">
                <label className="field-label">Target (Pcs)</label>
                <input
                  type="number"
                  value={editData.target_total}
                  onChange={(e) => setEditData({ ...editData, target_total: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="field-label">Prioritas</label>
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                >
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="field-label">Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                >
                  <option value="Berjalan">Sedang Berjalan</option>
                  <option value="Tertunda">Tertunda</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <div className="form-group">
                <label className="field-label">Pilih Operator</label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px',
                  padding: '10px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  minHeight: '50px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  background: 'var(--bg)'
                }}>
                  {operators.map(op => (
                    <div
                      key={op.id}
                      onClick={() => handleEditAddOperator(op.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: editData.operator_ids.includes(op.id) ? 'var(--accent)' : 'var(--border)',
                        color: editData.operator_ids.includes(op.id) ? '#fff' : 'var(--text)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        transition: 'all 0.15s',
                        userSelect: 'none',
                        border: 'none'
                      }}
                    >
                      {op.name} ({op.employee_id})
                    </div>
                  ))}
                </div>
              </div>

              {editData.operator_ids.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <label className="field-label">Operator Dipilih</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {editData.operator_ids.map(id => {
                      const op = operators.find(o => o.id === id);
                      return (
                        <div
                          key={id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            background: 'var(--accent)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          {op ? `${op.name} (${op.employee_id})` : id}
                          <span
                            onClick={() => handleEditRemoveOperator(id)}
                            style={{
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#fff',
                              opacity: 0.8
                            }}
                          >
                            ✕
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={() => { setShowEditForm(false); setEditingLot(null); }} type="button">
                  Batal
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Update Produksi'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* FILTER TABS */}
      <div className="filter-tabs">
        {['Semua', 'Sedang Berjalan', 'Selesai', 'Tertunda'].map((tab) => (
          <div
            key={tab}
            className={`ftab ${filter === tab ? 'active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* DATA TABLE */}
      <Card className="p-0" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
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
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLots.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--sub)' }}>
                    Belum ada data produksi.
                  </td>
                </tr>
              ) : (
                filteredLots.map((lot) => {
                  const lotAssignments = assignments.filter(a => a.lot_id === lot.id);
                  const operatorNames = lotAssignments
                    .filter(a => a.active)
                    .map(a => a.profiles?.name || 'Unknown')
                    .join(', ') || '-';
                  
                  const progress = Math.min(
                    (lotAssignments.reduce((sum, a) => sum + (a.total_output || 0), 0) / lot.target_total * 100),
                    100
                  ) || 0;

                  return (
                    <tr key={lot.id}>
                      <td style={{ fontWeight: 700 }}>{lot.styles?.name || '-'}</td>
                      <td>{lot.lot_number}</td>
                      <td>{formatNumber(lot.target_total)} Pcs</td>
                      <td>
                        <span className={`badge ${lot.priority === 'Tinggi' ? 'badge-stop' : 'badge-sched'}`}>
                          {lot.priority || 'Normal'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>{operatorNames}</td>
                      <td>
                        <div className="prog-wrap" style={{ width: '100px' }}>
                          <div className={`prog-bar ${progress >= 100 ? 'prog-g' : progress >= 75 ? 'prog-o' : 'prog-r'}`} style={{ width: `${progress}%` }}></div>
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '2px', color: 'var(--sub)' }}>{progress.toFixed(1)}%</div>
                      </td>
                      <td>{getStatusBadge(lot.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {lot.status !== 'Selesai' && (
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => handleEndProduction(lot.id)}
                              style={{ fontSize: '10px', padding: '4px 8px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                            >
                              Akhiri
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleEdit(lot)}
                            style={{ fontSize: '10px', padding: '4px 8px' }}
                          >
                            Edit
                          </button>
                          {/* 🔥 TOMBOL DELETE */}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteProduction(lot.id)}
                            style={{ fontSize: '10px', padding: '4px 8px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default LDManage;