import React from 'react';
import {Pie} from 'react-chartjs-2';
import {ArcElement, Chart, Legend, Tooltip} from 'chart.js';
import {useStore} from '../store';

Chart.register(ArcElement, Tooltip, Legend);

const TasksByStatusPieChart: React.FC = () => {
    const {tasks, setActiveView, setStatusFilter} = useStore();

    const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const data = {
        labels: Object.keys(statusCounts),
        datasets: [
            {
                label: '# of Tasks',
                data: Object.values(statusCounts),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        onClick: (_: any, elements: any[]) => {
            if (elements.length > 0) {
                const chartElement = elements[0];
                const label = data.labels[chartElement.index];
                setStatusFilter(label.toUpperCase());
                setActiveView('Tasks');
            }
        },
    };

    return <Pie data={data} options={options}/>;
};

export default TasksByStatusPieChart;
