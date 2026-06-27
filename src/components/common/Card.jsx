const Card = ({ children, className = '', title = '', subtitle = '', ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {title && (
        <div className="st">
          <span>{title}</span>
          {subtitle && <span style={{ fontSize: '12px', color: 'var(--sub)' }}>{subtitle}</span>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;