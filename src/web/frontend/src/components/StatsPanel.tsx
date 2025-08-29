import React, { useState } from 'react';
import { TaskStatistics } from '../types';
import {
  FaChevronDown, FaChevronRight, FaInfoCircle, FaTasks, FaCheckCircle,
  FaExclamationCircle, FaClock, FaProjectDiagram, FaCogs, FaHourglassHalf, FaRocket
} from 'react-icons/fa';
import styles from './StatsPanel.module.css';

interface StatsPanelProps {
  stats: TaskStatistics | null;
}

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: number | undefined }> = ({ icon, label, value }) => (
  <div className={styles.statItem}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statDetails}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value ?? '...'}</span>
    </div>
  </div>
);

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!stats) {
    return (
      <div className={styles.panel}>
        <div className={styles.loading}>Loading stats...</div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.header}
        aria-expanded={isOpen}
        aria-controls="stats-panel-content"
      >
        <FaInfoCircle />
        <span>Task Statistics</span>
        <div className={styles.chevron}>
          {isOpen ? <FaChevronDown /> : <FaChevronRight />}
        </div>
      </button>
      {isOpen && (
        <div id="stats-panel-content" className={styles.contentGrid}>
          <StatItem icon={<FaTasks />} label="Total" value={stats.total} />
          <StatItem icon={<FaCheckCircle />} label="Completed" value={stats.completed} />
          <StatItem icon={<FaExclamationCircle />} label="Failed" value={stats.failed} />
          <StatItem icon={<FaClock />} label="Pending" value={stats.pending} />
          <StatItem icon={<FaProjectDiagram />} label="Awaiting Dependencies" value={stats.awaiting_dependencies} />
          <StatItem icon={<FaCogs />} label="Decomposing" value={stats.decomposing} />
          <StatItem icon={<FaHourglassHalf />} label="Awaiting Subtasks" value={stats.awaiting_subtasks} />
          <StatItem icon={<FaRocket />} label="Ready for Execution" value={stats.ready_for_execution} />
          <StatItem icon={<FaClock />} label="Deferred" value={stats.deferred} />
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
