import React, {useCallback, useEffect, useState} from 'react';
import {TaskStatistics} from '../types';
import {useWebSocket} from '../hooks/useWebSocket';
import PerformanceChart from '../components/PerformanceChart';
import StatsPanel from '../components/StatsPanel';
import SystemStatusPanel from '../components/SystemStatusPanel';
import TasksByStatusPieChart from '../components/TasksByStatusPieChart';
import TasksByPriorityBarChart from '../components/TasksByPriorityBarChart';
import styles from './DashboardView.module.css';

const DashboardView: React.FC = () => {
    const [stats, setStats] = useState<TaskStatistics | null>(null);
    const [systemStatus, setSystemStatus] = useState<any>(null);
    const [statsHistory, setStatsHistory] = useState<{ time: Date; stats: TaskStatistics }[]>([]);

    const handleMessage = useCallback((message: any) => {
        if (message.type === 'STATS_UPDATE') {
            const newStats = message.payload.stats;
            setStats(newStats);
            setStatsHistory(prevHistory => {
                const newEntry = {time: new Date(), stats: newStats};
                const updatedHistory = [...prevHistory, newEntry];
                return updatedHistory.slice(-20);
            });
        } else if (message.type === 'SYSTEM_STATUS_UPDATE' || (message.type === 'response' && message.payload?.agendaSize !== undefined)) {
            setSystemStatus(message.payload.status || message.payload);
        }
    }, []);

    const {sendMessage} = useWebSocket(handleMessage);

    useEffect(() => {
        const interval = setInterval(() => {
            sendMessage({type: 'GET_STATS'});
            sendMessage({target: 'core', method: 'getSystemStatus', payload: {}, id: 'dashboard-status'});
        }, 5000);

        sendMessage({type: 'GET_STATS'});
        sendMessage({target: 'core', method: 'getSystemStatus', payload: {}, id: 'dashboard-status-initial'});

        return () => clearInterval(interval);
    }, [sendMessage]);

    return (
        <div className={styles.container}>
            <h2>Dashboard</h2>
            <StatsPanel stats={stats}/>
            <div className={styles.chartGrid}>
                <div className={styles.chartContainer}>
                    <h3>Tasks by Status</h3>
                    <TasksByStatusPieChart/>
                </div>
                <div className={styles.chartContainer}>
                    <h3>Tasks by Priority</h3>
                    <TasksByPriorityBarChart/>
                </div>
            </div>
            <div className={styles.chartContainer}>
                <PerformanceChart statsHistory={statsHistory}/>
            </div>
            <div className={styles.panelContainer}>
                <SystemStatusPanel systemStatus={systemStatus}/>
            </div>
        </div>
    );
};

export default DashboardView;
