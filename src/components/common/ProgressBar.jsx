const ProgressBar = ({ value, max = 100, label, className = '', color = 'prog-g' }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={className}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span>{label}</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
      )}
      <div className="prog-wrap">
        <div className={`prog-bar ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

export default ProgressBar;