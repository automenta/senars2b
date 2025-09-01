import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { useStore } from '../../store';
import { FaProjectDiagram, FaPlus } from 'react-icons/fa';
import styles from './TaskDependenciesView.module.css';
import TaskDependencies from '../components/task/TaskDependencies';
import InlineAddTaskForm from '../components/InlineAddTaskForm';

interface TaskDependenciesViewProps {
  sendMessage: (message: any) => void;
  onAddTask: (task: {
    title: string;
    description?: string;
    priority: TaskPriority,
    type: 'REGULAR' | 'AGENT'
  }, status?: TaskStatus) => void;
}

const TaskDependenciesView: React.FC<TaskDependenciesViewProps> = ({ sendMessage, onAddTask }) => {
  const { tasks } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <motion.div
      className={styles.dependenciesView}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Task Dependencies</h1>
          <p>Visualize and manage task relationships and dependencies</p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={() => setShowAddForm(true)}
            className={styles.addButton}
          >
            <FaPlus /> Add Task
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className={styles.addFormOverlay}>
          <InlineAddTaskForm
            onAddTask={(task) => {
              onAddTask(task);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      <TaskDependencies 
        tasks={tasks} 
        onAddTask={() => setShowAddForm(true)} 
      />
    </motion.div>
  );
};

export default TaskDependenciesView;