import React, { useState } from 'react';
import {
  FaChevronDown, FaChevronRight, FaServer, FaCog, FaCheck,
  FaSync, FaDatabase, FaFileAlt, FaBullseye
} from 'react-icons/fa';
import styles from './SystemStatusPanel.module.css';

interface SystemStatusPanelProps {
  systemStatus: any;
}

const StatusItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number | undefined }> = ({ icon, label, value }) => (
    <div className={styles.statusItem}>
        <div className={styles.statusIcon}>{icon}</div>
        <div className={styles.statusDetails}>
            <span className={styles.statusLabel}>{label}</span>
            <span className={styles.statusValue}>{value ?? '...'}</span>
        </div>
    </div>
);

const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({ systemStatus }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!systemStatus) {
    return (
      <div className={styles.panel}>
        <div className={styles.loading}>Loading system status...</div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.header}
        aria-expanded={isOpen}
        aria-controls="system-status-panel-content"
      >
        <FaServer />
        <span>System Status</span>
        <div className={styles.chevron}>
          {isOpen ? <FaChevronDown /> : <FaChevronRight />}
        </div>
      </button>
      {isOpen && (
        <div id="system-status-panel-content" className={styles.contentGrid}>
          <StatusItem icon={<FaCog />} label="Agenda Size" value={systemStatus.agendaSize} />
          <StatusItem icon={<FaSync />} label="Workers Running" value={systemStatus.workerStats.running} />
          <StatusItem icon={<FaCheck />} label="Workers Idle" value={systemStatus.workerStats.idle} />
          <StatusItem icon={<FaDatabase />} label="Total Items Processed" value={systemStatus.performance.totalItemsProcessed} />
          <StatusItem icon={<FaFileAlt />} label="Avg. Processing Time" value={`${systemStatus.performance.averageProcessingTime.toFixed(2)}ms`} />
          <StatusItem icon={<FaDatabase />} label="World Model Items" value={systemStatus.worldModelStats.totalItems} />
          <StatusItem icon={<FaFileAlt />} label="World Model Beliefs" value={systemStatus.worldModelStats.beliefCount} />
          <StatusItem icon={<FaBullseye />} label="World Model Goals" value={systemStatus.worldModelStats.goalCount} />
        </div>
      )}
    </div>
  );
};

export default SystemStatusPanel;
