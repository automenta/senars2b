import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  percentage: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, className = '' }) => {
  // Ensure percentage is between 0 and 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  
  return (
    <div className={`${styles.progressBarContainer} ${className}`}>
      <div 
        className={styles.progressBar} 
        style={{ width: `${clampedPercentage}%` }}
      >
        <div className={styles.progressBarFill}></div>
      </div>
      <span className={styles.percentage}>{Math.round(clampedPercentage)}%</span>
    </div>
  );
};

export default ProgressBar;