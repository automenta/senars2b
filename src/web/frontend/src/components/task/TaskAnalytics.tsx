import React, { useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import styles from './TaskAnalytics.module.css';
import { FaChartBar, FaChartPie, FaTasks, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface TaskAnalyticsProps {
  tasks: Task[];
}

const TaskAnalytics: React.FC<TaskAnalyticsProps> = ({ tasks }) => {
  const analytics = useMemo(() => {
    const statusCounts: Record<TaskStatus, number> = {
      pending: 0,
      awaiting_dependencies: 0,
      decomposing: 0,
      awaiting_subtasks: 0,
      ready_for_execution: 0,
      completed: 0,
      failed: 0,
      deferred: 0
    };

    const priorityCounts: Record<TaskPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const typeCounts = {
      REGULAR: 0,
      AGENT: 0
    };

    let totalCompletionPercentage = 0;
    let taskWithProgressCount = 0;

    tasks.forEach(task => {
      statusCounts[task.status]++;
      
      priorityCounts[task.priority]++;
      
      typeCounts[task.type]++;
      
      if (task.completion_percentage !== undefined && task.completion_percentage > 0) {
        totalCompletionPercentage += task.completion_percentage;
        taskWithProgressCount++;
      }
    });

    const averageCompletion = taskWithProgressCount > 0 
      ? Math.round(totalCompletionPercentage / taskWithProgressCount) 
      : 0;

    return {
      statusCounts,
      priorityCounts,
      typeCounts,
      totalTasks: tasks.length,
      completedTasks: statusCounts.completed,
      failedTasks: statusCounts.failed,
      pendingTasks: statusCounts.pending,
      averageCompletion
    };
  }, [tasks]);

  // Status distribution chart data
  const statusChartData = {
    labels: Object.keys(analytics.statusCounts).map(status => 
      status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    ),
    datasets: [
      {
        label: 'Tasks by Status',
        data: Object.values(analytics.statusCounts),
        backgroundColor: [
          'rgba(247, 181, 0, 0.7)',  // pending - yellow
          'rgba(255, 149, 0, 0.7)',  // awaiting_dependencies - orange
          'rgba(175, 82, 222, 0.7)', // decomposing - purple
          'rgba(255, 149, 0, 0.7)',  // awaiting_subtasks - orange
          'rgba(48, 176, 199, 0.7)', // ready_for_execution - teal
          'rgba(76, 201, 240, 0.7)', // completed - blue
          'rgba(230, 57, 70, 0.7)',  // failed - red
          'rgba(108, 117, 125, 0.7)' // deferred - gray
        ],
        borderColor: [
          'rgba(247, 181, 0, 1)',
          'rgba(255, 149, 0, 1)',
          'rgba(175, 82, 222, 1)',
          'rgba(255, 149, 0, 1)',
          'rgba(48, 176, 199, 1)',
          'rgba(76, 201, 240, 1)',
          'rgba(230, 57, 70, 1)',
          'rgba(108, 117, 125, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Priority distribution chart data
  const priorityChartData = {
    labels: Object.keys(analytics.priorityCounts).map(priority => 
      priority.charAt(0).toUpperCase() + priority.slice(1)
    ),
    datasets: [
      {
        label: 'Tasks by Priority',
        data: Object.values(analytics.priorityCounts),
        backgroundColor: [
          'rgba(230, 57, 70, 0.7)',  // critical - red
          'rgba(255, 149, 0, 0.7)',  // high - orange
          'rgba(247, 181, 0, 0.7)',  // medium - yellow
          'rgba(72, 149, 239, 0.7)'  // low - blue
        ],
        borderColor: [
          'rgba(230, 57, 70, 1)',
          'rgba(255, 149, 0, 1)',
          'rgba(247, 181, 0, 1)',
          'rgba(72, 149, 239, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Type distribution chart data
  const typeChartData = {
    labels: ['Regular', 'Agent'],
    datasets: [
      {
        label: 'Tasks by Type',
        data: [analytics.typeCounts.REGULAR, analytics.typeCounts.AGENT],
        backgroundColor: [
          'rgba(72, 149, 239, 0.7)', // blue
          'rgba(175, 82, 222, 0.7)'  // purple
        ],
        borderColor: [
          'rgba(72, 149, 239, 1)',
          'rgba(175, 82, 222, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
      },
    },
  };

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.analyticsHeader}>
        <h2>Task Analytics</h2>
        <p>Insights into your task management</p>
      </div>

      <div className={styles.summaryCards}>
        <div className={`${styles.card} ${styles.totalCard}`}>
          <div className={styles.cardIcon}>
            <FaTasks />
          </div>
          <div className={styles.cardContent}>
            <h3>{analytics.totalTasks}</h3>
            <p>Total Tasks</p>
          </div>
        </div>

        <div className={`${styles.card} ${styles.completedCard}`}>
          <div className={styles.cardIcon}>
            <FaCheck />
          </div>
          <div className={styles.cardContent}>
            <h3>{analytics.completedTasks}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className={`${styles.card} ${styles.pendingCard}`}>
          <div className={styles.cardIcon}>
            <FaCalendarAlt />
          </div>
          <div className={styles.cardContent}>
            <h3>{analytics.pendingTasks}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className={`${styles.card} ${styles.progressCard}`}>
          <div className={styles.cardIcon}>
            <FaChartBar />
          </div>
          <div className={styles.cardContent}>
            <h3>{analytics.averageCompletion}%</h3>
            <p>Avg. Progress</p>
          </div>
        </div>
      </div>

      <div className={styles.chartsContainer}>
        <div className={styles.chartCard}>
          <h3>Tasks by Status</h3>
          <Bar data={statusChartData} options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                ...chartOptions.plugins.title,
                text: 'Tasks by Status'
              }
            }
          }} />
        </div>

        <div className={styles.chartCard}>
          <h3>Tasks by Priority</h3>
          <Pie data={priorityChartData} options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                ...chartOptions.plugins.title,
                text: 'Tasks by Priority'
              }
            }
          }} />
        </div>

        <div className={styles.chartCard}>
          <h3>Tasks by Type</h3>
          <Pie data={typeChartData} options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                ...chartOptions.plugins.title,
                text: 'Tasks by Type'
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
};

export default TaskAnalytics;