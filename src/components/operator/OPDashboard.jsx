import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProductions } from '../../hooks/useProductions';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../common/StatsCard';
import ProgressBar from '../common/ProgressBar';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { getIndonesianDate, getToday, getCurrentHour } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/helpers';
import { supabase } from '../../api/supabase';
import toast from 'react-hot-toast';

const OPDashboard = () => {
  const { user } = useAuth();
  const { hourlyOutputs, loadHourlyOutputs, lots, loadLots, styles, loadStyles, assignments, loadAssignments } = useProductions();
  const navigate = useNavigate();
  
  const [totalOutput, setTotalOutput] = useState(0);
  const [targetPerHour, setTargetPerHour] = useState(135);
  const [targetDaily, setTargetDaily] = useState(1080);
  const [loading, setLoading] = useState(true);
  const [userOutputs, setUserOutputs] = useState([]);
  const [activeStyle, setActiveStyle] = useState('-');
  const [activeLot, setActiveLot] = useState(null);
  const [shiftStatus, setShiftStatus] = useState('offline');
  const [shiftStart, setShiftStart] = useState(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStart, setBreakStart] = useState(null);

  // 🔥 Ambil data operator & shift status
  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadStyles();
        await loadLots();
        await loadAssignments();
        
        // Ambil status shift operator dari database
        if (user?.id) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('shift_status, current_lot_id, shift_start, break_start')
            .eq('id', user.id)
            .single();
          
          if (!error && profile) {
            setShiftStatus(profile.shift_status || 'offline');
            setShiftStart(profile.shift_start);
            setBreakStart(profile.break_start);
            
            // Cek apakah sedang istirahat
            if (profile.shift_status === 'break') {
              setIsOnBreak(true);
            }
            
            // Ambil lot aktif
            if (profile.current_lot_id) {
              const lot = lots.find(l => l.id === profile.current_lot_id);
              if (lot) {
                setActiveLot(lot);
                const style = styles.find(s => s.id === lot.style_id);
                if (style) {
                  setActiveStyle(style.name);
                  setTargetPerHour(style.target_per_hour || 135);
                  setTargetDaily(lot.target_total || 1080);
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
    const outputs = hourlyOutputs.filter(o => o.operator_id === user?.id);
    setUserOutputs(outputs);
    const total = outputs.reduce((sum, o) => sum + (o.qty || 0), 0);
    setTotalOutput(total);
    setLoading(false);
  }, [hourlyOutputs, user?.id]);

  const fetchOutputs = async () => {
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

  // 🔥 MULAI SHIFT
  const handleStartShift = async () => {
    try {
      // Cek apakah ada assignment aktif
      const userAssignment = assignments.find(a => a.operator_id === user?.id && a.active);
      if (!userAssignment) {
        toast.error('Belum ada penugasan dari leader!');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          shift_status: 'online',
          current_lot_id: userAssignment.lot_id,
          shift_start: getCurrentHour(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setShiftStatus('online');
      setShiftStart(getCurrentHour());
      toast.success('✅ Shift dimulai! Selamat bekerja!');
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error starting shift:', error);
      toast.error('Gagal memulai shift');
    }
  };

  // 🔥 ISTIRAHAT
  const handleBreak = async () => {
    try {
      const newStatus = isOnBreak ? 'online' : 'break';
      const updateData = {
        shift_status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (!isOnBreak) {
        updateData.break_start = getCurrentHour();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      
      setIsOnBreak(!isOnBreak);
      setShiftStatus(newStatus);
      toast.success(isOnBreak ? '✅ Kembali bekerja!' : '☕ Istirahat dimulai');
      
      window.location.reload();
    } catch (error) {
      console.error('Error toggling break:', error);
      toast.error('Gagal mengubah status');
    }
  };

  // 🔥 SELESAI SHIFT
  const handleEndShift = async () => {
    if (!confirm('Yakin ingin mengakhiri shift?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          shift_status: 'offline',
          current_lot_id: null,
          shift_start: null,
          break_start: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setShiftStatus('offline');
      toast.success('✅ Shift selesai!');
      
      // Redirect ke login atau logout
      navigate('/login');
    } catch (error) {
      console.error('Error ending shift:', error);
      toast.error('Gagal mengakhiri shift');
    }
  };

  const achievement = targetDaily > 0 ? (totalOutput / targetDaily * 100) : 0;
  const historyPreview = userOutputs.slice(-3).reverse();

  // Status badge
  const getStatusBadge = () => {
    switch (shiftStatus) {
      case 'online': return <Badge type="run" dot>Online</Badge>;
      case 'break': return <Badge type="idle" dot>Istirahat</Badge>;
      default: return <Badge type="sched">Offline</Badge>;
    }
  };

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

      {/* 🔥 STATUS & SHIFT CONTROL */}
      <div className="card" style={{ marginBottom: '16px', borderLeft: `4px solid ${shiftStatus === 'online' ? 'var(--accent)' : shiftStatus === 'break' ? 'var(--warn)' : 'var(--border)'}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <div>
            <div className="text-label">Status</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{getStatusBadge()}</div>
          </div>
          {shiftStart && (
            <div>
              <div className="text-label">Shift Mulai</div>
              <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{shiftStart}</div>
            </div>
          )}
          {shiftStatus === 'break' && breakStart && (
            <div>
              <div className="text-label">Istirahat Mulai</div>
              <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{breakStart}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {shiftStatus === 'offline' && (
              <Button variant="primary" onClick={handleStartShift}>▶️ Mulai Shift</Button>
            )}
            {shiftStatus === 'online' && (
              <>
                <Button variant="outline" onClick={handleBreak}>☕ Istirahat</Button>
                <Button variant="danger" onClick={handleEndShift}>⏹ Akhiri Shift</Button>
              </>
            )}
            {shiftStatus === 'break' && (
              <>
                <Button variant="accent" onClick={handleBreak}>▶️ Kembali</Button>
                <Button variant="danger" onClick={handleEndShift}>⏹ Akhiri Shift</Button>
              </>
            )}
          </div>
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
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{activeStyle}</div>
          </div>
          <div>
            <div className="text-label">Lot / Batch</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{activeLot?.lot_number || '-'}</div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatsCard label="Target / Jam" value={`${formatNumber(targetPerHour)} Pcs`} icon="🎯" />
        <StatsCard 
          label="Output Hari Ini" 
          value={`${formatNumber(totalOutput)} Pcs`} 
          subtext={`${userOutputs.length} jam terekam`} 
          icon="📦" 
        />
        <StatsCard label="Target Harian" value={`${formatNumber(targetDaily)} Pcs`} icon="📋" />
        <StatsCard label="Pencapaian" value={`${achievement.toFixed(1)}%`} icon="⚡" />
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