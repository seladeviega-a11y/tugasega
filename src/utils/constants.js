export const ROLES = {
  OPERATOR: 'operator',
  LEADER: 'leader'
};

export const CONSTRAINT_TYPES = [
  'Out Set',
  'Mesin Rusak',
  'Material Habis',
  'Jarum Putus',
  'Lainnya'
];

export const PRIORITY_OPTIONS = ['Tinggi', 'Normal', 'Rendah'];

export const PROCESS_OPTIONS = ['Finishing', 'Cutting', 'Embroidery'];

export const OPERATOR_MENU = [
  { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { id: 'input', icon: '✏', label: 'Input Output' },
  { id: 'kendala', icon: '⚠', label: 'Laporkan Kendala' },
  { id: 'riwayat', icon: '📋', label: 'Riwayat Produksi' }
];

export const LEADER_MENU = [
  { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { id: 'kelola', icon: '📝', label: 'Kelola Produksi' },
  { id: 'monitoring', icon: '🔴', label: 'Monitoring Real Time' },
  { id: 'kendala', icon: '⚠', label: 'Monitoring Kendala' },
  { id: 'laporan', icon: '📊', label: 'Laporan Produksi' }
];

export const BADGE_STYLES = {
  run: 'badge-run badge-dot',
  idle: 'badge-idle badge-dot',
  stop: 'badge-stop badge-dot',
  prog: 'badge-prog badge-dot',
  pend: 'badge-pend',
  over: 'badge-over',
  sched: 'badge-sched'
};

export const getConstraintIcon = (type) => {
  const icons = {
    'Out Set': '🔧',
    'Mesin Rusak': '⚙',
    'Material Habis': '📦',
    'Jarum Putus': '🪡',
    'Lainnya': '💬'
  };
  return icons[type] || '⚠';
};

export const getConstraintColor = (type) => {
  const colors = {
    'Out Set': 'org',
    'Mesin Rusak': 'red',
    'Material Habis': 'org',
    'Jarum Putus': 'red',
    'Lainnya': 'org'
  };
  return colors[type] || 'org';
};