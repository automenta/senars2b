import React, { useState } from 'react';
import { TaskStatus, TaskPriority, TaskType } from '../../types';
import styles from './AdvancedSearch.module.css';
import { FaSearch, FaFilter, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface AdvancedSearchProps {
  onSearch: (searchCriteria: {
    searchTerm: string;
    status: TaskStatus | 'ALL';
    type: TaskType | 'ALL';
    priority: TaskPriority | 'ALL';
  }) => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [type, setType] = useState<TaskType | 'ALL'>('ALL');
  const [priority, setPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ searchTerm, status, type, priority });
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatus('ALL');
    setType('ALL');
    setPriority('ALL');
    onSearch({ searchTerm: '', status: 'ALL', type: 'ALL', priority: 'ALL' });
  };

  // Filter options
  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'awaiting_dependencies', label: 'Awaiting Dependencies' },
    { value: 'decomposing', label: 'Decomposing' },
    { value: 'awaiting_subtasks', label: 'Awaiting Subtasks' },
    { value: 'ready_for_execution', label: 'Ready for Execution' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'deferred', label: 'Deferred' }
  ];

  const typeOptions = [
    { value: 'ALL', label: 'All Types' },
    { value: 'REGULAR', label: 'Regular' },
    { value: 'AGENT', label: 'Agent' }
  ];

  const priorityOptions = [
    { value: 'ALL', label: 'All Priorities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  return (
    <div className={styles.advancedSearchContainer}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <div className={styles.searchInputContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search tasks by title, description, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.searchActions}>
          <button type="submit" className={`btn btn-primary ${styles.searchButton}`}>
            <FaSearch /> Search
          </button>
          <button type="button" onClick={handleReset} className={`btn btn-secondary ${styles.resetButton}`}>
            Reset
          </button>
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`btn btn-outline ${styles.toggleAdvancedButton}`}
          >
            <FaFilter /> Advanced
            {showAdvanced ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </form>
      
      {showAdvanced && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus | 'ALL')}
                className={styles.filterSelect}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label htmlFor="type-filter">Type</label>
              <select
                id="type-filter"
                value={type}
                onChange={(e) => setType(e.target.value as TaskType | 'ALL')}
                className={styles.filterSelect}
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label htmlFor="priority-filter">Priority</label>
              <select
                id="priority-filter"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority | 'ALL')}
                className={styles.filterSelect}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;