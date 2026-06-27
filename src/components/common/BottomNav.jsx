import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OPERATOR_MENU, LEADER_MENU } from '../../utils/constants';

const BottomNav = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = role === 'operator' ? OPERATOR_MENU : LEADER_MENU.slice(0, 4);

  const handleNav = (id) => {
    navigate(`/${role}/${id}`);
  };

  const isActive = (id) => {
    return location.pathname === `/${role}/${id}`;
  };

  return (
    <div className="bot-nav mob-only">
      <div className="bot-nav-inner">
        {menu.map((item) => (
          <div
            key={item.id}
            className={`bn ${isActive(item.id) ? 'active' : ''}`}
            onClick={() => handleNav(item.id)}
          >
            <div className="bn-ic">{item.icon}</div>
            <div>{item.label.split(' ')[0]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;