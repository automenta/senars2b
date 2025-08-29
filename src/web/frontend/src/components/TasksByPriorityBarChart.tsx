import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { useStore } from '../store';
import { TaskPriority } from '../types';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const priorityOrder: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const TasksByPriorityBarChart: React.FC = () => {
  const { tasks } = useStore();

  const priorityCounts = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<TaskPriority, number>);

  const data = {
    labels: priorityOrder,
    datasets: [
      {
        label: '# of Tasks',
        data: priorityOrder.map(p => priorityCounts[p] || 0),
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(255, 99, 132, 0.2)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return <Bar data={data} />;
};

export default TasksByPriorityBarChart;
