import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatDate = (date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMMM yyyy', { locale: id });
};

export const formatTime = (date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm', { locale: id });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, HH:mm', { locale: id });
};

export const getRelativeTime = (date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: id });
};

export const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

export const getCurrentHour = () => {
  return format(new Date(), 'HH:00');
};

export const getIndonesianDate = () => {
  return format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id });
};

export const getHours = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:00');
};

export const isToday = (date) => {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};