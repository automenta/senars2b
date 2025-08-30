import React from 'react';
import {Line} from 'react-chartjs-2';
import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import {TaskStatistics} from '../types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface PerformanceChartProps {
    statsHistory: { time: Date; stats: TaskStatistics }[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({statsHistory}) => {
    const data = {
        labels: statsHistory.map(entry => entry.time.toLocaleTimeString()),
        datasets: [
            {
                label: 'Total Tasks',
                data: statsHistory.map(entry => entry.stats.total),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Completed Tasks',
                data: statsHistory.map(entry => entry.stats.completed),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
            {
                label: 'Pending Tasks',
                data: statsHistory.map(entry => entry.stats.pending),
                borderColor: 'rgb(255, 205, 86)',
                backgroundColor: 'rgba(255, 205, 86, 0.5)',
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Task Performance Over Time',
            },
        },
    };

    return <Line options={options} data={data}/>;
};

export default PerformanceChart;
