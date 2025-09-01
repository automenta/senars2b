import React from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import styles from './DashboardPanel.module.css';
import {FaChartBar, FaChartPie, FaChevronDown, FaServer, FaTachometerAlt} from 'react-icons/fa';
import StatsPanel from './StatsPanel';
import TasksByStatusPieChart from './TasksByStatusPieChart';
import TasksByPriorityBarChart from './TasksByPriorityBarChart';
import PerformanceChart from './PerformanceChart';
import SystemStatusPanel from './SystemStatusPanel';
import {TaskStatistics} from '../types';

interface DashboardPanelProps {
    stats: TaskStatistics | null;
    systemStatus: any;
    statsHistory: { time: Date; stats: TaskStatistics }[];
    isLoading: boolean;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({stats, systemStatus, statsHistory, isLoading}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading dashboard data...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <button className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
                <h2>Dashboard</h2>
                <motion.div
                    animate={{rotate: isExpanded ? 180 : 0}}
                    transition={{duration: 0.2}}
                >
                    <FaChevronDown className={styles.chevron}/>
                </motion.div>
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: {opacity: 1, height: 'auto'},
                            collapsed: {opacity: 0, height: 0}
                        }}
                        transition={{duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98]}}
                        className={styles.contentWrapper}
                    >
                        <div className={styles.content}>
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardPanel;
