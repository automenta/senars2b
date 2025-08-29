import React, { useState, useEffect } from 'react';
import { TaskStatistics } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import PerformanceChart from '../components/PerformanceChart';

// ... (StatsPanel component remains the same)

const StatsPanel: React.FC<{ stats: TaskStatistics | null }> = ({ stats }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!stats) {
    return (
        <div style={{ marginBottom: '2rem', border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)' }}>
            <div style={{ padding: '1rem' }}>Loading stats...</div>
        </div>
    );
  }

  return (
    <div style={{ marginBottom: '2rem', border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'var(--color-card-background)',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        Task Statistics
        {isOpen ? <FaChevronDown /> : <FaChevronRight />}
      </button>
      {isOpen && (
        <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div><strong>Total:</strong> {stats.total}</div>
          <div><strong>Pending:</strong> {stats.pending}</div>
          <div><strong>Completed:</strong> {stats.completed}</div>
          <div><strong>Failed:</strong> {stats.failed}</div>
          <div><strong>Deferred:</strong> {stats.deferred}</div>
          <div><strong>Awaiting Dependencies:</strong> {stats.awaiting_dependencies}</div>
          <div><strong>Decomposing:</strong> {stats.decomposing}</div>
          <div><strong>Awaiting Subtasks:</strong> {stats.awaiting_subtasks}</div>
          <div><strong>Ready for Execution:</strong> {stats.ready_for_execution}</div>
        </div>
      )}
    </div>
  );
};

const SystemStatusPanel: React.FC<{ systemStatus: any }> = ({ systemStatus }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!systemStatus) {
        return <div style={{ padding: '1rem', border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)' }}>Loading system status...</div>;
    }

    return (
        <div style={{ border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)' }}>
            <button onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', padding: '1rem', background: 'var(--color-card-background)', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                System Status
                {isOpen ? <FaChevronDown /> : <FaChevronRight />}
            </button>
            {isOpen && (
                <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div><strong>Agenda Size:</strong> {systemStatus.agendaSize}</div>
                    <div><strong>Workers Running:</strong> {systemStatus.workerStats.running}</div>
                    <div><strong>Workers Idle:</strong> {systemStatus.workerStats.idle}</div>
                    <div><strong>Total Items Processed:</strong> {systemStatus.performance.totalItemsProcessed}</div>
                    <div><strong>Avg. Processing Time:</strong> {systemStatus.performance.averageProcessingTime.toFixed(2)}ms</div>
                    <div><strong>World Model Items:</strong> {systemStatus.worldModelStats.totalItems}</div>
                    <div><strong>World Model Beliefs:</strong> {systemStatus.worldModelStats.beliefCount}</div>
                    <div><strong>World Model Goals:</strong> {systemStatus.worldModelStats.goalCount}</div>
                </div>
            )}
        </div>
    );
};


const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<TaskStatistics | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [statsHistory, setStatsHistory] = useState<{ time: Date; stats: TaskStatistics }[]>([]);

  const handleMessage = useCallback((message: any) => {
    if (message.type === 'STATS_UPDATE') {
      const newStats = message.payload.stats;
      setStats(newStats);
      setStatsHistory(prevHistory => {
        const newEntry = { time: new Date(), stats: newStats };
        const updatedHistory = [...prevHistory, newEntry];
        return updatedHistory.slice(-20);
      });
    } else if (message.type === 'SYSTEM_STATUS_UPDATE' || (message.type === 'response' && message.payload?.agendaSize !== undefined)) {
      setSystemStatus(message.payload.status || message.payload);
    }
  }, []);

  const { sendMessage } = useWebSocket(handleMessage);

  useEffect(() => {
    const interval = setInterval(() => {
        sendMessage({ type: 'GET_STATS' });
        sendMessage({ target: 'core', method: 'getSystemStatus', payload: {}, id: 'dashboard-status' });
    }, 5000);

    sendMessage({ type: 'GET_STATS' });
    sendMessage({ target: 'core', method: 'getSystemStatus', payload: {}, id: 'dashboard-status-initial' });

    return () => clearInterval(interval);
  }, [sendMessage]);

  return (
    <div>
      <h2>Dashboard</h2>
      <StatsPanel stats={stats} />
      <div style={{ marginTop: '2rem' }}>
        <PerformanceChart statsHistory={statsHistory} />
      </div>
      <div style={{ marginTop: '2rem' }}>
        <SystemStatusPanel systemStatus={systemStatus} />
      </div>
    </div>
  );
};

export default DashboardView;
