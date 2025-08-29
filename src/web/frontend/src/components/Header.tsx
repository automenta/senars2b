import React from 'react';
import { FaPlus } from 'react-icons/fa';

interface HeaderProps {
  title: string;
  onAddTask: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onAddTask }) => {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--color-card-border)', paddingBottom: '1rem' }}>
      <h1>{title}</h1>
      <button
        onClick={onAddTask}
        style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--border-radius)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        }}
      >
        <FaPlus />
        Add Task
      </button>
    </header>
  );
};

export default Header;
