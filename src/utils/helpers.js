export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
};

export const getRandomColor = (seed) => {
  const colors = ['#2b6cb0', '#00a87a', '#f6a623', '#805ad5', '#e53e3e', '#3182ce'];
  if (!seed) return colors[0];
  const index = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export const formatNumber = (num) => {
  if (!num && num !== 0) return '-';
  return new Intl.NumberFormat('id-ID').format(num);
};

export const formatCurrency = (num) => {
  if (!num && num !== 0) return 'Rp 0';
  return `Rp ${new Intl.NumberFormat('id-ID').format(num)}`;
};

export const getStatusColor = (value) => {
  if (value >= 100) return 'var(--accent)';
  if (value >= 75) return 'var(--warn)';
  return 'var(--danger)';
};

export const getStatusBadge = (value) => {
  if (value >= 100) return 'badge-prog';
  if (value >= 75) return 'badge-pend';
  return 'badge-over';
};

export const getProgressClass = (value) => {
  if (value >= 100) return 'prog-g';
  if (value >= 75) return 'prog-o';
  return 'prog-r';
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

export const truncate = (text, length = 30) => {
  if (!text) return '-';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};