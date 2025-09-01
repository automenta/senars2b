import React from 'react';
import { TaskPriority, TaskStatus } from '../../types';
import { 
  FaClipboardList, 
  FaRobot, 
  FaBug, 
  FaLightbulb, 
  FaBook, 
  FaUsers, 
  FaCode, 
  FaSearch, 
  FaPlus 
} from 'react-icons/fa';
import styles from './TaskTemplates.module.css';

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  priority: TaskPriority;
  type: 'REGULAR' | 'AGENT';
  tags: string[];
  defaultStatus?: TaskStatus;
}

interface TaskTemplatesProps {
  onTemplateSelect: (template: Omit<TaskTemplate, 'id' | 'icon'>) => void;
}

const TaskTemplates: React.FC<TaskTemplatesProps> = ({ onTemplateSelect }) => {
  const templates: TaskTemplate[] = [
    {
      id: 'research',
      title: 'Research Task',
      description: 'Investigate a topic or gather information',
      icon: <FaSearch />,
      priority: 'medium',
      type: 'REGULAR',
      tags: ['research', 'investigation', 'information'],
      defaultStatus: 'pending'
    },
    {
      id: 'agent',
      title: 'Agent Task',
      description: 'Create a task for an AI agent to process',
      icon: <FaRobot />,
      priority: 'medium',
      type: 'AGENT',
      tags: ['ai', 'automation', 'processing'],
      defaultStatus: 'pending'
    },
    {
      id: 'bug',
      title: 'Bug Report',
      description: 'Document and track a software bug',
      icon: <FaBug />,
      priority: 'high',
      type: 'REGULAR',
      tags: ['bug', 'issue', 'debugging'],
      defaultStatus: 'pending'
    },
    {
      id: 'idea',
      title: 'Idea Capture',
      description: 'Record and develop a new idea',
      icon: <FaLightbulb />,
      priority: 'low',
      type: 'REGULAR',
      tags: ['idea', 'innovation', 'creativity'],
      defaultStatus: 'pending'
    },
    {
      id: 'documentation',
      title: 'Documentation',
      description: 'Create or update documentation',
      icon: <FaBook />,
      priority: 'medium',
      type: 'REGULAR',
      tags: ['docs', 'writing', 'reference'],
      defaultStatus: 'pending'
    },
    {
      id: 'meeting',
      title: 'Meeting',
      description: 'Schedule and prepare for a meeting',
      icon: <FaUsers />,
      priority: 'medium',
      type: 'REGULAR',
      tags: ['meeting', 'collaboration', 'planning'],
      defaultStatus: 'pending'
    },
    {
      id: 'development',
      title: 'Development Task',
      description: 'Implement a feature or fix code',
      icon: <FaCode />,
      priority: 'high',
      type: 'REGULAR',
      tags: ['coding', 'development', 'implementation'],
      defaultStatus: 'pending'
    },
    {
      id: 'review',
      title: 'Review Task',
      description: 'Review work or provide feedback',
      icon: <FaClipboardList />,
      priority: 'medium',
      type: 'REGULAR',
      tags: ['review', 'feedback', 'evaluation'],
      defaultStatus: 'pending'
    }
  ];

  return (
    <div className={styles.taskTemplatesContainer}>
      <div className={styles.templatesHeader}>
        <h2>Task Templates</h2>
      </div>
      
      <div className={styles.templatesGrid}>
        {templates.map(template => (
          <div 
            key={template.id}
            className={styles.templateCard}
            onClick={() => onTemplateSelect({
              title: template.title,
              description: template.description,
              priority: template.priority,
              type: template.type,
              tags: template.tags,
              defaultStatus: template.defaultStatus
            })}
          >
            <div className={styles.templateIcon}>
              {template.icon}
            </div>
            <h3 className={styles.templateTitle}>{template.title}</h3>
            <p className={styles.templateDescription}>{template.description}</p>
            <div className={styles.templateTags}>
              {template.tags.map(tag => (
                <span key={tag} className={styles.templateTag}>
                  {tag}
                </span>
              ))}
            </div>
            <button className={styles.createButton}>
              <FaPlus /> Create
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskTemplates;