import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProductions } from '../../hooks/useProductions';
import Button from '../common/Button';
import { getCurrentHour, getToday } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/helpers';
import { supabase } from '../../api/supabase';
import toast from 'react-hot-toast';

const OPInput = () => {
  const { user } = useAuth();
  const { hourlyOutputs, loadHourlyOutputs, createHourlyOutput, styles, loadStyles, lots, loadLots, assignments, loadAssignments } = useProductions();
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayOutputs, setTodayOutputs] = useState([]);
  const [totalOutput, setTotalOutput] = useState(0);
  const [targetPerHour, setTargetPerHour] = useState(135);
  const [activeStyle, setActiveStyle] = useState('');
  const [activeLot, setActiveLot] = useState('');
  const [activeProcess, setActiveProcess] = useState('Finishing');
  const [shiftStatus, setShiftStatus] = useState('offline');
  const currentHour = getCurrentHour();

  // 🔥 Ambil data assignment & status shift operator
  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadStyles();
        await loadLots();
        await loadAssignments();
        
        // Cek status shift operator
        if (user?.id) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('shift_status, current_lot_id')
            .eq('id', user.id)
            .single();
          
          if (!error && profile) {
            setShiftStatus(profile.shift_status || 'offline');
            
            // Ambil lot aktif dari assignment
            if (profile.current_lot_id) {
              const lot = lots.find(l => l.id === profile.current_lot_id);
              if (lot) {
                setActiveLot(lot.lot_number || '');
                const style = styles.find(s => s.id === lot.style_id);
                if (style) {
                  setActiveStyle(style.name || '');
                  setTargetPerHour(style.target_per_hour || 135);
                  setActiveProcess(style.process_type || 'Finishing');
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    fetchData();
  }, [styles.length, lots.length, assignments.length, user?.id]);

  useEffect(() => {
    fetchOutputs();
  }, []);

  useEffect(() => {
    const userOutputs = hourlyOutputs.filter(o => o.operator_id === user?.id);
    setTodayOutputs(userOutputs);
    const total = userOutputs.reduce((sum, o) => sum + (o.qty || 0), 0);
    setTotalOutput(total);
  }, [hourlyOutputs, user?.id]);

  const fetchOutputs = async () => {
    const today = getToday();
    await loadHourlyOutputs(today);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🔥 Cek status shift
    if (shiftStatus !== 'online') {
      toast.error('Anda belum memulai shift! Mulai shift dulu di dashboard.');
      return;
    }
    
    if (!qty || parseInt(qty) <= 0) {
      toast.error('Masukkan jumlah output yang valid');
      return;
    }

    setLoading(true);
    try {
      await createHourlyOutput({
        operator_id: user?.id,
        lot_id: null,
        jam: currentHour,
        qty: parseInt(qty),
        style: activeStyle,
        lot: activeLot,
        remark: '-'
      });
      
      await fetchOutputs();
      setQty('');
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
            {/* 🔥 LOCKED - TIDAK BISA DIGANTI */}
            <div style={{ fontWeight: 700, marginTop: '4px', color: 'var(--text)' }}>
              {activeStyle || '-'}
            </div>
          </div>
          <div>
            <div className="text-label">Lot / Batch</div>
            {/* 🔥 LOCKED - TIDAK BISA DIGANTI */}
            <div style={{ fontWeight: 700, marginTop: '4px', color: 'var(--text)' }}>
              {activeLot || '-'}
            </div>
          </div>
          <div>
            <div className="text-label">Target / Jam</div>
            <div style={{ fontWeight: 700, marginTop: '4px', color: 'var(--accent)' }}>
              {formatNumber(targetPerHour)} Pcs
            </div>
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
              {/* 🔥 STYLE - LOCKED (Hanya Tampilan) */}
              <div className="form-group">
                <label className="field-label">Style</label>
                <div style={{ 
                  padding: '10px 12px', 
                  background: 'var(--bg)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontWeight: 600,
                  color: 'var(--text)'
                }}>
                  {activeStyle || '-'}
                </div>
              </div>

              {/* 🔥 LOT - LOCKED (Hanya Tampilan) */}
              <div className="form-group">
                <label className="field-label">Lot / Batch</label>
                <div style={{ 
                  padding: '10px 12px', 
                  background: 'var(--bg)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontWeight: 600,
                  color: 'var(--text)'
                }}>
                  {activeLot || '-'}
                </div>
              </div>

              {/* 🔥 PROCESS - LOCKED (Hanya Tampilan) */}
              <div className="form-group">
                <label className="field-label">Proses</label>
                <div style={{ 
                  padding: '10px 12px', 
                  background: 'var(--bg)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontWeight: 600,
                  color: 'var(--text)'
                }}>
                  {activeProcess}
                </div>
              </div>

              {/* 🔥 QTY - SATU-SATUNYA YANG BISA DIISI */}
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

              <Button type="submit" variant="primary" size="lg" disabled={loading || shiftStatus !== 'online'}>
                {loading ? 'Menyimpan...' : shiftStatus !== 'online' ? 'Mulai Shift Dulu!' : `💾 SIMPAN INPUT ${currentHour}`}
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
          </div>

          <div className="notice">
            <div style={{ display: 'flex', gap: '8px' }}>
              <span>ℹ</span>
              <div>
                <div className="notice-title">INFO</div>
                <div className="notice-text">
                  Style, Lot, dan Proses diatur oleh Leader. Operator hanya mengisi jumlah output.
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