import React, {useCallback, useEffect, useState} from 'react';
import {TaskStatistics} from '../types';
import {useWebSocket} from '../hooks/useWebSocket';
import PerformanceChart from '../components/PerformanceChart';
import StatsPanel from '../components/StatsPanel';
import SystemStatusPanel from '../components/SystemStatusPanel';
import TasksByStatusPieChart from '../components/TasksByStatusPieChart';
import TasksByPriorityBarChart from '../components/TasksByPriorityBarChart';
import styles from './DashboardView.module.css';
import {FaChartBar, FaChartPie, FaServer, FaTachometerAlt} from 'react-icons/fa';

const DashboardView: React.FC = () => {
    const [stats, setStats] = useState<TaskStatistics | null>(null);
    const [systemStatus, setSystemStatus] = useState<any>(null);
    const [statsHistory, setStatsHistory] = useState<{ time: Date; stats: TaskStatistics }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const handleMessage = useCallback((message: any) => {
        if (message.type === 'STATS_UPDATE') {
            const newStats = message.payload.stats;
            setStats(newStats);
            setStatsHistory(prevHistory => {
                const newEntry = {time: new Date(), stats: newStats};
                const updatedHistory = [...prevHistory, newEntry];
                return updatedHistory.slice(-20);
            });
            setIsLoading(false);
        } else if (message.type === 'SYSTEM_STATUS_UPDATE' || (message.type === 'response' && message.payload?.agendaSize !== undefined)) {
            setSystemStatus(message.payload.status || message.payload);
        } else if (message.type === 'ERROR') {
            console.error('Dashboard error:', message.payload);
            setIsLoading(false);
        }
    }, []);

    const {sendMessage, isConnected} = useWebSocket(handleMessage);

    useEffect(() => {
        const interval = setInterval(() => {
            sendMessage({type: 'GET_STATS'});
            sendMessage({target: 'core', method: 'getSystemStatus', payload: {}, id: 'dashboard-status'});
        }, 5000);

        // Initial data fetch
        sendMessage({type: 'GET_STATS'});
        sendMessage({target: 'core', method: 'getSystemStatus', payload: {}, id: 'dashboard-status-initial'});

        // Set loading to false after a timeout in case of connection issues
        const loadingTimeout = setTimeout(() => {
            setIsLoading(false);
        }, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(loadingTimeout);
        };
    }, [sendMessage]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Dashboard</h2>
                <div className={styles.statusIndicators}>
                    <div
                        className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}>
                        <span className={styles.indicatorDot}></span>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading dashboard data...</p>
                </div>
            ) : (
                <>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <FaTachometerAlt className={styles.sectionIcon}/>
                            <h3>Task Statistics</h3>
                        </div>
                        <StatsPanel stats={stats}/>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <FaChartPie className={styles.sectionIcon}/>
                            <h3>Task Distribution</h3>
                        </div>
                        <div className={styles.chartGrid}>
                            <div className={styles.chartContainer}>
                                <h4>Tasks by Status</h4>
                                <TasksByStatusPieChart/>
                            </div>
                            <div className={styles.chartContainer}>
                                <h4>Tasks by Priority</h4>
                                <TasksByPriorityBarChart/>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <FaChartBar className={styles.sectionIcon}/>
                            <h3>Performance Overview</h3>
                        </div>
                        <div className={styles.chartContainer}>
                            <PerformanceChart statsHistory={statsHistory}/>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <FaServer className={styles.sectionIcon}/>
                            <h3>System Status</h3>
                        </div>
                        <div className={styles.panelContainer}>
                            <SystemStatusPanel systemStatus={systemStatus}/>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardView;
