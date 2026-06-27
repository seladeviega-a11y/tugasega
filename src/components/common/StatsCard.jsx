const StatsCard = ({ label, value, subtext, icon, trend, trendLabel }) => {
  return (
    <div className="stat-c">
      <div className="sl">
        {label}
        {icon && <span>{icon}</span>}
      </div>
      <div className="sv">{value}</div>
      {subtext && <div className="ss">{subtext}</div>}
      {trend && (
        <div className={`ss ${trend === 'up' ? 'up' : 'dn'}`}>
          {trend === 'up' ? '↑' : '↓'} {trendLabel}
        </div>
      )}
    </div>
  );
};

export default StatsCard;