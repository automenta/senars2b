import { useCallback, useEffect, useState } from 'react';
import { TaskStatistics } from '../types';
import { useWebSocket } from './useWebSocket';

export function useDashboardStats() {
  const [stats, setStats] = useState<TaskStatistics | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [statsHistory, setStatsHistory] = useState<
    { time: Date; stats: TaskStatistics }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleMessage = useCallback((message: any) => {
    if (message.type === 'STATS_UPDATE') {
      const newStats = message.payload.stats;
      setStats(newStats);
      setStatsHistory((prevHistory) => {
        const newEntry = { time: new Date(), stats: newStats };
        const updatedHistory = [...prevHistory, newEntry];
        return updatedHistory.slice(-20);
      });
      setIsLoading(false);
    } else if (
      message.type === 'SYSTEM_STATUS_UPDATE' ||
      (message.type === 'response' && message.payload?.agendaSize !== undefined)
    ) {
      setSystemStatus(message.payload.status || message.payload);
    } else if (message.type === 'ERROR') {
      console.error('Dashboard error:', message.payload);
      setIsLoading(false);
    }
  }, []);

  const { sendMessage } = useWebSocket(handleMessage);

  useEffect(() => {
    const interval = setInterval(() => {
      sendMessage({ type: 'GET_STATS' });
      sendMessage({
        target: 'core',
        method: 'getSystemStatus',
        payload: {},
        id: 'dashboard-status',
      });
    }, 5000);

    // Initial data fetch
    sendMessage({ type: 'GET_STATS' });
    sendMessage({
      target: 'core',
      method: 'getSystemStatus',
      payload: {},
      id: 'dashboard-status-initial',
    });

    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(loadingTimeout);
    };
  }, [sendMessage, isLoading]);

  return { stats, systemStatus, statsHistory, isLoading };
}
