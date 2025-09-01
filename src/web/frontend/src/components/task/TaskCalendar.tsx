import React, { useState, useMemo } from 'react';
import { Task, TaskStatus } from '../../types';
import styles from './TaskCalendar.module.css';
import { FaChevronLeft, FaChevronRight, FaPlus, FaTasks } from 'react-icons/fa';
import StatusBadge from '../StatusBadge';
import PriorityBadge from '../PriorityBadge';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskAction: (action: string, taskId: string) => void;
  onAddTask: (date?: string) => void;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, onTaskAction, onAddTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate calendar days
  const { days, month, year } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    // First day of the calendar (Sunday of the week that includes the first day of the month)
    const startDay = new Date(firstDay);
    startDay.setDate(firstDay.getDate() - firstDay.getDay());
    // Last day of the calendar (Saturday of the week that includes the last day of the month)
    const endDay = new Date(lastDay);
    endDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    // Generate all days to display
    const days = [];
    const day = new Date(startDay);
    while (day <= endDay) {
      days.push(new Date(day));
      day.setDate(day.getDate() + 1);
    }
    
    return { days, month, year };
  }, [currentDate]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      // For now, we'll group by status as a demo
      // In a real implementation, this would be based on due dates or scheduled dates
      const dateKey = task.status;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });
    
    return grouped;
  }, [tasks]);

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Format month and year for display
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Check if a day is today
  const isToday = (day: Date) => {
    const today = new Date();
    return day.getDate() === today.getDate() &&
           day.getMonth() === today.getMonth() &&
           day.getFullYear() === today.getFullYear();
  };

  // Check if a day is in the current month
  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === month;
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    // In a real implementation, this would filter tasks by actual date
    // For now, we'll just return tasks based on status for demonstration
    const statusMap: Record<string, TaskStatus> = {
      '0': 'pending',
      '1': 'awaiting_dependencies',
      '2': 'decomposing',
      '3': 'awaiting_subtasks',
      '4': 'ready_for_execution',
      '5': 'completed',
      '6': 'failed'
    };
    
    const statusKey = date.getDay().toString();
    const status = statusMap[statusKey] || 'pending';
    return tasksByDate[status] || [];
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <div className={styles.calendarNavigation}>
          <button onClick={prevMonth} className={styles.navButton}>
            <FaChevronLeft />
          </button>
          <h2 className={styles.monthYear}>{formatMonthYear(currentDate)}</h2>
          <button onClick={nextMonth} className={styles.navButton}>
            <FaChevronRight />
          </button>
        </div>
        <div className={styles.calendarActions}>
          <button onClick={goToToday} className={styles.todayButton}>
            Today
          </button>
          <button onClick={() => onAddTask()} className="btn btn-primary">
            <FaPlus /> Add Task
          </button>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        {/* Weekday headers */}
        <div className={styles.weekdayHeader}>Sun</div>
        <div className={styles.weekdayHeader}>Mon</div>
        <div className={styles.weekdayHeader}>Tue</div>
        <div className={styles.weekdayHeader}>Wed</div>
        <div className={styles.weekdayHeader}>Thu</div>
        <div className={styles.weekdayHeader}>Fri</div>
        <div className={styles.weekdayHeader}>Sat</div>

        {/* Calendar days */}
        {days.map((day, index) => {
          const dayTasks = getTasksForDate(day);
          const isCurrent = isCurrentMonth(day);
          const isDayToday = isToday(day);
          
          return (
            <div 
              key={index}
              className={`${styles.calendarDay} ${!isCurrent ? styles.otherMonth : ''} ${isDayToday ? styles.today : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              <div className={styles.dayNumber}>{day.getDate()}</div>
              <div className={styles.dayTasks}>
                {dayTasks.slice(0, 3).map(task => (
                  <div key={task.id} className={styles.taskPreview}>
                    <div className={styles.taskPreviewHeader}>
                      <span className={styles.taskPreviewTitle}>{task.title}</span>
                      <div className={styles.taskPreviewBadges}>
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className={styles.moreTasks}>+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className={styles.selectedDatePanel}>
          <div className={styles.panelHeader}>
            <h3>{selectedDate.toDateString()}</h3>
            <button 
              onClick={() => onAddTask(selectedDate.toISOString())} 
              className="btn btn-primary"
            >
              <FaPlus /> Add Task
            </button>
          </div>
          
          <div className={styles.selectedDateTasks}>
            {getTasksForDate(selectedDate).length > 0 ? (
              getTasksForDate(selectedDate).map(task => (
                <div key={task.id} className={styles.selectedTaskCard}>
                  <div className={styles.taskCardContent}>
                    <h4 className={styles.taskCardTitle}>{task.title}</h4>
                    <p className={styles.taskCardDescription}>{task.description}</p>
                    <div className={styles.taskCardBadges}>
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                  <div className={styles.taskCardActions}>
                    {task.status === 'pending' && (
                      <button 
                        className="btn btn-success"
                        onClick={() => onTaskAction('COMPLETE_TASK', task.id)}
                      >
                        Complete
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <span className={styles.completedText}>Completed</span>
                    )}
                    {task.type === 'AGENT' && task.status !== 'completed' && task.status !== 'failed' && (
                      <button 
                        className="btn btn-warning"
                        onClick={() => onTaskAction('PAUSE_AGENT', task.id)}
                      >
                        Pause
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <FaTasks className={styles.emptyStateIcon} />
                <p>No tasks scheduled for this date</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => onAddTask(selectedDate.toISOString())}
                >
                  <FaPlus /> Add Task
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCalendar;