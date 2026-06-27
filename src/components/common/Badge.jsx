const Badge = ({ children, type = 'sched', dot = false, className = '' }) => {
  const badgeClasses = {
    run: 'badge-run',
    idle: 'badge-idle',
    stop: 'badge-stop',
    prog: 'badge-prog',
    pend: 'badge-pend',
    over: 'badge-over',
    sched: 'badge-sched'
  };

  return (
    <span className={`badge ${badgeClasses[type] || 'badge-sched'} ${dot ? 'badge-dot' : ''} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;