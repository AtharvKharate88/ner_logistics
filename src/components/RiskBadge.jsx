import React from 'react';
import './RiskBadge.css';

const RiskBadge = ({ level = 'LOW', score }) => {
  const normalizedLevel = level ? level.toUpperCase() : 'LOW';

  return (
    <span className={`risk-badge risk-badge--${normalizedLevel.toLowerCase()}`}>
      <span className="risk-badge__dot" />
      <span className="risk-badge__label">{normalizedLevel} RISK</span>
      {score !== undefined && <span className="risk-badge__score">({score})</span>}
    </span>
  );
};

export default RiskBadge;