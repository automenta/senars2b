import React, {useMemo} from 'react';
import {motion} from 'framer-motion';
import {FaChartBar, FaTasks, FaBrain, FaServer, FaClock, FaExclamationTriangle} from 'react-icons/fa';
import {useStore} from '../store';
import {useDashboardStats} from '../hooks/useDashboardStats';
import StatsPanel from '../components/StatsPanel';
import SystemStatusPanel from '../components/SystemStatusPanel';
import PerformanceChart from '../components/PerformanceChart';
import TasksByStatusPieChart from '../components/TasksByStatusPieChart';
import TasksByPriorityBarChart from '../components/TasksByPriorityBarChart';
import styles from './DashboardView.module.css';

const DashboardView: React.FC = () => {
    const {tasks} = useStore();
    const {stats, systemStatus, statsHistory, isLoading} = useDashboardStats();

    const taskStats = useMemo(() => ({
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => 
            t.status === 'awaiting_dependencies' ||
            t.status === 'decomposing' ||
            t.status === 'awaiting_subtasks' ||
            t.status === 'ready_for_execution'
        ).length,
        completed: tasks.filter(t => t.status === 'completed').length,
        failed: tasks.filter(t => t.status === 'failed').length,
        deferred: tasks.filter(t => t.status === 'deferred').length,
    }), [tasks]);

    const chartData = useMemo(() => {
        return statsHistory.map((stat, index) => ({
            time: new Date(Date.now() - (statsHistory.length - index - 1) * 60000).toLocaleTimeString(),
            tasks: stat.totalTasks,
            completed: stat.completedTasks,
            inProgress: stat.activeTasks,
        }));
    }, [statsHistory]);

    return (
        <motion.div
            className={styles.dashboardView}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.3}}
        >
            <div className={styles.header}>
                <h1>Dashboard</h1>
                <p>System overview and performance metrics</p>
            </div>

            <div className={styles.statsGrid}>
                <StatsPanel 
                    title="Total Tasks" 
                    value={taskStats.total} 
                    icon={<FaTasks/>} 
                    color="var(--color-primary)"
                />
                <StatsPanel 
                    title="In Progress" 
                    value={taskStats.inProgress} 
                    icon={<FaClock/>} 
                    color="var(--color-warning)"
                />
                <StatsPanel 
                    title="Completed" 
                    value={taskStats.completed} 
                    icon={<FaChartBar/>} 
                    color="var(--color-success)"
                />
                <StatsPanel 
                    title="Failed" 
                    value={taskStats.failed} 
                    icon={<FaExclamationTriangle/>} 
                    color="var(--color-danger)"
                />
            </div>

            <div className={styles.chartsSection}>
                <div className={styles.chartContainer}>
                    <h2>Task Distribution</h2>
                    <TasksByStatusPieChart tasks={tasks} />
                </div>
                <div className={styles.chartContainer}>
                    <h2>Priority Distribution</h2>
                    <TasksByPriorityBarChart tasks={tasks} />
                </div>
            </div>

            <div className={styles.systemStatus}>
                <SystemStatusPanel systemStatus={systemStatus} isLoading={isLoading} />
            </div>

            <div className={styles.performanceChart}>
                <h2>Performance Overview</h2>
                <PerformanceChart data={chartData} />
            </div>
        </motion.div>
    );
};

export default DashboardView;