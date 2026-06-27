import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useConstraints } from '../../hooks/useConstraints';
import { useProductions } from '../../hooks/useProductions';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Card from '../common/Card';
import { CONSTRAINT_TYPES } from '../../utils/constants';
import { getConstraintIcon } from '../../utils/constants';
import { getCurrentHour } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const OPConstraint = () => {
  const { user } = useAuth();
  const { createConstraint, constraints, loadConstraints } = useConstraints();
  const { lots } = useProductions();
  const navigate = useNavigate();
  
  const [selectedType, setSelectedType] = useState('Out Set');
  const [durasi, setDurasi] = useState(15);
  const [keterangan, setKeterangan] = useState('');
  const [jam, setJam] = useState(getCurrentHour());
  const [selectedLot, setSelectedLot] = useState('');
  const [loading, setLoading] = useState(false);

  const userConstraints = (constraints || []).filter(c => c.operator_id === user?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedType) {
      toast.error('Pilih jenis kendala');
      return;
    }

    setLoading(true);
    try {
      await createConstraint({
        operator_id: user?.id,
        lot_id: selectedLot || null,
        jenis: selectedType,
        durasi: parseInt(durasi),
        keterangan: keterangan || '-',
        jam: jam,
        status: 'Pending'
      });
      
      toast.success('✅ Kendala berhasil dilaporkan!');
      navigate('/operator/dashboard');
    } catch (error) {
      console.error('Error saving constraint:', error);
      toast.error('Gagal melaporkan kendala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Laporkan Kendala</h1>
          <p>Pilih jenis kendala yang terjadi pada proses produksi.</p>
        </div>
      </div>

      <div className="two-col">
        <div>
          <Card title="Pilih Jenis Kendala" subtitle="OPSIONAL">
            <div className="issue-grid">
              {CONSTRAINT_TYPES.map((type) => (
                <div
                  key={type}
                  className={`issue-card ${selectedType === type ? 'sel' : ''}`}
                  onClick={() => setSelectedType(type)}
                >
                  <div className="issue-icon">{getConstraintIcon(type)}</div>
                  <div className="issue-name">{type}</div>
                  <div className="issue-desc">
                    {type === 'Out Set' && 'Penyimpangan set mesin'}
                    {type === 'Mesin Rusak' && 'Kerusakan mekanis mesin'}
                    {type === 'Material Habis' && 'Stok benang/bahan habis'}
                    {type === 'Jarum Putus' && 'Patah saat siklus jahit'}
                    {type === 'Lainnya' && 'Kendala tidak terdaftar'}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="field-label">Jam Kendala</label>
                <input
                  type="time"
                  value={jam}
                  onChange={(e) => setJam(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="field-label">Lot / Batch</label>
                <select 
                  value={selectedLot} 
                  onChange={(e) => setSelectedLot(e.target.value)}
                >
                  <option value="">Pilih Lot</option>
                  {lots.map(lot => (
                    <option key={lot.id} value={lot.id}>
                      {lot.lot_number} - {lot.styles?.name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="field-label">Durasi (menit)</label>
                <input
                  type="number"
                  value={durasi}
                  onChange={(e) => setDurasi(e.target.value)}
                  placeholder="0"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="field-label">Keterangan Tambahan</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Jelaskan gejala atau nomor head..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="outline" style={{ flex: 1 }} onClick={() => navigate('/operator/dashboard')} type="button">
                  Batal
                </Button>
                <Button type="submit" variant="primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Mengirim...' : 'Kirim Laporan'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div>
          <div style={{ background: 'var(--primary)', color: '#fff', borderRadius: 'var(--r)', padding: '18px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
              Butuh Bantuan Segera?
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.6)', marginBottom: '14px' }}>
              Panggil teknisi ke lokasi Anda.
            </div>
            <Button variant="accent" className="w-full">
              👥 Panggil Teknisi
            </Button>
          </div>

          <div className="card mt-12">
            <div className="st">Kendala Hari Ini</div>
            {userConstraints.length === 0 ? (
              <div style={{ color: 'var(--sub)', fontSize: '12px', textAlign: 'center', padding: '10px 0' }}>
                Belum ada kendala hari ini.
              </div>
            ) : (
              userConstraints.map((c, idx) => (
                <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                  <strong>{c.jam || '--:--'}</strong> — {c.jenis} ({c.durasi} mnt)
                  {c.keterangan && c.keterangan !== '-' && <div style={{ color: 'var(--sub)', fontSize: '11px' }}>{c.keterangan}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OPConstraint;