import React from 'react';
import styles from './DashboardPanel.module.css';
import { FaTasks, FaCheck, FaExclamationTriangle, FaPause, FaCog } from 'react-icons/fa';

interface DashboardPanelProps {
  stats: {
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    failedTasks: number;
    deferredTasks: number;
  };
  systemStatus: {
    isRunning: boolean;
    uptime?: number;
    version?: string;
  };
  statsHistory: {
    timestamp: number;
    totalTasks: number;
    completedTasks: number;
  }[];
  isLoading: boolean;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ 
  stats, 
  systemStatus, 
  statsHistory, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className={styles.dashboardPanel}>
        <div className={styles.loading}>Loading dashboard data...</div>
      </div>
    );
  }

  const uptimeHours = systemStatus.uptime ? Math.floor(systemStatus.uptime / 3600000) : 0;
  const uptimeMinutes = systemStatus.uptime ? Math.floor((systemStatus.uptime % 3600000) / 60000) : 0;

  return (
    <div className={styles.dashboardPanel}>
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.totalCard}`}>
          <div className={styles.statIcon}>
            <FaTasks />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.totalTasks}</h3>
            <p>Total Tasks</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.pendingCard}`}>
          <div className={styles.statIcon}>
            <FaCog />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.pendingTasks}</h3>
            <p>Pending</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.completedCard}`}>
          <div className={styles.statIcon}>
            <FaCheck />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.completedTasks}</h3>
            <p>Completed</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.failedCard}`}>
          <div className={styles.statIcon}>
            <FaExclamationTriangle />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.failedTasks}</h3>
            <p>Failed</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.deferredCard}`}>
          <div className={styles.statIcon}>
            <FaPause />
          </div>
          <div className={styles.statContent}>
            <h3>{stats.deferredTasks}</h3>
            <p>Deferred</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.systemCard}`}>
          <div className={styles.statIcon}>
            {systemStatus.isRunning ? (
              <div className={styles.runningIndicator}></div>
            ) : (
              <div className={styles.stoppedIndicator}></div>
            )}
          </div>
          <div className={styles.statContent}>
            <h3>{systemStatus.isRunning ? 'Running' : 'Stopped'}</h3>
            <p>
              {systemStatus.isRunning 
                ? `Uptime: ${uptimeHours}h ${uptimeMinutes}m` 
                : 'System Offline'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;