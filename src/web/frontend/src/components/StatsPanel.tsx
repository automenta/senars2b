import React, {useState} from 'react';
import {TaskStatistics} from '../types';
import {
    FaCheckCircle,
    FaChevronDown,
    FaChevronRight,
    FaClock,
    FaCogs,
    FaExclamationCircle,
    FaHourglassHalf,
    FaInfoCircle,
    FaProjectDiagram,
    FaRocket,
    FaTasks
} from 'react-icons/fa';
import styles from './StatsPanel.module.css';

interface StatsPanelProps {
    stats: TaskStatistics | null;
}

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: number | undefined; color?: string }> = ({
                                                                                                                     icon,
                                                                                                                     label,
                                                                                                                     value,
                                                                                                                     color
                                                                                                                 }) => (
    <div className={styles.statItem} style={{borderColor: color}}>
        <div className={styles.statIcon} style={{color}}>
            {icon}
        </div>
        <div className={styles.statDetails}>
            <span className={styles.statLabel}>{label}</span>
            <span className={styles.statValue}>{value ?? '...'}</span>
        </div>
    </div>
);

const StatsPanel: React.FC<StatsPanelProps> = ({stats}) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!stats) {
        return (
            <div className={styles.panel}>
                <div className={styles.loading}>Loading stats...</div>
            </div>
        );
    }

    // Group stats by category for better organization
    const mainStats = [
        {icon: <FaTasks/>, label: "Total", value: stats.total, color: "#0d6efd"},
        {icon: <FaCheckCircle/>, label: "Completed", value: stats.completed, color: "#198754"},
        {icon: <FaExclamationCircle/>, label: "Failed", value: stats.failed, color: "#dc3545"},
        {icon: <FaClock/>, label: "Pending", value: stats.pending, color: "#6c757d"},
    ];

    const processingStats = [
        {
            icon: <FaProjectDiagram/>,
            label: "Awaiting Dependencies",
            value: stats.awaiting_dependencies,
            color: "#fd7e14"
        },
        {icon: <FaCogs/>, label: "Decomposing", value: stats.decomposing, color: "#20c997"},
        {icon: <FaHourglassHalf/>, label: "Awaiting Subtasks", value: stats.awaiting_subtasks, color: "#0dcaf0"},
        {icon: <FaRocket/>, label: "Ready for Execution", value: stats.ready_for_execution, color: "#ffc107"},
        {icon: <FaClock/>, label: "Deferred", value: stats.deferred, color: "#6f42c1"},
    ];

    return (
        <div className={styles.panel}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={styles.header}
                aria-expanded={isOpen}
                aria-controls="stats-panel-content"
            >
                <FaInfoCircle/>
                <span>Task Statistics</span>
                <div className={styles.chevron}>
                    {isOpen ? <FaChevronDown/> : <FaChevronRight/>}
                </div>
            </button>
            {isOpen && (
                <div id="stats-panel-content" className={styles.content}>
                    <div className={styles.statsSection}>
                        <h4>Main Statistics</h4>
                        <div className={styles.contentGrid}>
                            {mainStats.map((stat, index) => (
                                <StatItem
                                    key={index}
                                    icon={stat.icon}
                                    label={stat.label}
                                    value={stat.value}
                                    color={stat.color}
                                />
                            ))}
                        </div>
                    </div>
                    <div className={styles.statsSection}>
                        <h4>Processing States</h4>
                        <div className={styles.contentGrid}>
                            {processingStats.map((stat, index) => (
                                <StatItem
                                    key={index}
                                    icon={stat.icon}
                                    label={stat.label}
                                    value={stat.value}
                                    color={stat.color}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsPanel;
