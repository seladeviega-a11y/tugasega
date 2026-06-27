import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProductions } from '../../hooks/useProductions';
import Button from '../common/Button';
import { getCurrentHour, getToday } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/helpers';
import toast from 'react-hot-toast';

const OPInput = () => {
  const { user } = useAuth();
  const { hourlyOutputs, loadHourlyOutputs, createHourlyOutput, lots } = useProductions();
  const [qty, setQty] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedLot, setSelectedLot] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayOutputs, setTodayOutputs] = useState([]);
  const [totalOutput, setTotalOutput] = useState(0);
  const currentHour = getCurrentHour();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const userOutputs = hourlyOutputs.filter(o => o.operator_id === user?.id);
    setTodayOutputs(userOutputs);
    const total = userOutputs.reduce((sum, o) => sum + (o.qty || 0), 0);
    setTotalOutput(total);
  }, [hourlyOutputs, user?.id]);

  const fetchData = async () => {
    const today = getToday();
    await loadHourlyOutputs(today);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!qty || parseInt(qty) <= 0) {
      toast.error('Masukkan jumlah output yang valid');
      return;
    }

    if (!selectedStyle) {
      toast.error('Masukkan style');
      return;
    }

    if (!selectedLot) {
      toast.error('Masukkan lot / batch');
      return;
    }

    setLoading(true);
    try {
      const result = await createHourlyOutput({
        operator_id: user?.id,
        lot_id: null,
        jam: currentHour,
        qty: parseInt(qty),
        style: selectedStyle,
        lot: selectedLot,
        remark: '-'
      });
      
      console.log('✅ Data tersimpan:', result);
      await fetchData();
      setQty('');
      setSelectedStyle('');
      setSelectedLot('');
      toast.success(`✅ Input ${currentHour} berhasil disimpan!`);
      
    } catch (error) {
      console.error('Error saving output:', error);
      toast.error('Gagal menyimpan data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="ph">
        <div>
          <h1>Input Output Produksi</h1>
          <p>Rekam hasil produksi per jam kerja Anda.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px', background: 'var(--bg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <div className="text-label">Operator</div>
            <div style={{ fontWeight: 700, marginTop: '4px' }}>{user?.name || 'User'}</div>
          </div>
          <div>
            <div className="text-label">Style</div>
            <div style={{ fontWeight: 700, marginTop: '4px' }}>{selectedStyle || '-'}</div>
          </div>
          <div>
            <div className="text-label">Lot / Batch</div>
            <div style={{ fontWeight: 700, marginTop: '4px' }}>{selectedLot || '-'}</div>
          </div>
          <div>
            <div className="text-label">Target / Jam</div>
            <div style={{ fontWeight: 700, marginTop: '4px', color: 'var(--accent)' }}>135 Pcs</div>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="st">Riwayat Jam Ini</div>
            {todayOutputs.length === 0 ? (
              <div style={{ color: 'var(--sub)', fontSize: '13px', padding: '12px 0', textAlign: 'center' }}>
                Belum ada data input hari ini.
              </div>
            ) : (
              todayOutputs.map((entry, idx) => (
                <div key={entry.id || idx} className="hourly-row">
                  <div className={`h-time ${entry.jam === currentHour ? 'cur' : ''}`}>
                    {entry.jam || '--:--'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--label)' }}>ACTUAL</div>
                    <div className="h-val">{entry.qty || 0}</div>
                  </div>
                  <div className="h-remark">{entry.remark || '-'}</div>
                  <div className="h-icon" style={{ color: 'var(--accent)' }}>✓</div>
                </div>
              ))
            )}
          </div>

          <div className="active-sess">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>{currentHour}</span>
              <span className="active-badge">SESI AKTIF</span>
            </div>

            <form onSubmit={handleSubmit}>
              {/* 🔥 STYLE MANUAL - TEXT INPUT */}
              <div className="form-group">
                <label className="field-label">Style</label>
                <input
                  type="text"
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  placeholder="Contoh: IVYS / HCPS"
                  className="form-control"
                  required
                />
              </div>

              {/* 🔥 LOT MANUAL - TEXT INPUT */}
              <div className="form-group">
                <label className="field-label">Lot / Batch</label>
                <input
                  type="text"
                  value={selectedLot}
                  onChange={(e) => setSelectedLot(e.target.value)}
                  placeholder="Contoh: 503 + 568"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="field-label">Jumlah Output (Qty)</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  style={{ fontSize: '22px', fontWeight: 700, textAlign: 'right' }}
                  required
                />
              </div>

              <Button type="submit" variant="primary" size="lg" disabled={loading}>
                {loading ? 'Menyimpan...' : `💾 SIMPAN INPUT ${currentHour}`}
              </Button>
            </form>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                Summary Totals
              </div>
              <div style={{ fontSize: '11px', color: 'var(--sub)' }}>Hari ini</div>
            </div>
            <div className="sum-row">
              <span style={{ fontSize: '13px' }}>Total Output</span>
              <span className="sum-val">{formatNumber(totalOutput)}</span>
            </div>
            <div className="sum-row">
              <span style={{ fontSize: '13px' }}>Jumlah Input</span>
              <span className="sum-val">{todayOutputs.length} <span style={{ fontSize: '11px', color: 'var(--sub)' }}>kali</span></span>
            </div>
            <div className="sum-row">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                <span style={{ color: 'var(--accent)' }}>⟳</span> Est. Incentive
              </span>
              <span className="sum-incentive">Rp {formatNumber(totalOutput * 200)}</span>
            </div>
          </div>

          <div className="notice">
            <div style={{ display: 'flex', gap: '8px' }}>
              <span>ℹ</span>
              <div>
                <div className="notice-title">INFO</div>
                <div className="notice-text">
                  Style dan Lot/Batch diisi manual sesuai produksi.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OPInput;