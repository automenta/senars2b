import React from 'react';
import { Prompt } from '../types';
import styles from './PromptCard.module.css';
import { FaQuestionCircle } from 'react-icons/fa';

interface PromptCardProps {
  prompt: Prompt;
  onAnswer: (promptId: string, answer: any) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onAnswer }) => {
  // Basic form state for user input
  const [inputValue, setInputValue] = React.useState('');

  const renderPromptInput = () => {
    switch (prompt.type) {
      case 'text_input':
        return (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={styles.input}
            placeholder="Type your answer..."
          />
        );
      case 'confirmation':
        return (
          <div className={styles.buttonGroup}>
            <button
              onClick={() => onAnswer(prompt.id, true)}
              className={styles.button}
            >
              Confirm
            </button>
            <button
              onClick={() => onAnswer(prompt.id, false)}
              className={`${styles.button} ${styles.secondary}`}
            >
              Cancel
            </button>
          </div>
        );
      case 'multiple_choice':
        return (
          <div className={styles.buttonGroup}>
            {prompt.options?.map((option) => (
              <button
                key={option}
                onClick={() => onAnswer(prompt.id, option)}
                className={styles.button}
              >
                {option}
              </button>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <FaQuestionCircle className={styles.icon} />
        <h4>Action Required</h4>
      </div>
      <div className={styles.content}>
        <p className={styles.message}>{prompt.message}</p>
        <div className={styles.inputContainer}>{renderPromptInput()}</div>
      </div>
      <div className={styles.footer}>
        <span>Task ID: {prompt.taskId}</span>
        <span>{new Date(prompt.timestamp).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default PromptCard;
