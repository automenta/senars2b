import React from 'react';
import {FaCircle, FaPlus} from 'react-icons/fa';
import ThemeSwitcher from './ThemeSwitcher';
import styles from './Header.module.css';

interface HeaderProps {
    title: string;
    onAddTask: () => void;
    theme: string;
    toggleTheme: () => void;
    isConnected?: boolean;
}

const Header: React.FC<HeaderProps> = ({title, onAddTask, theme, toggleTheme, isConnected}) => {
    return (
        <header className={styles.header}>
            <div className={styles.titleContainer}>
                <h1>{title}</h1>
                {isConnected !== undefined && (
                    <div
                        className={`${styles.connectionIndicator} ${isConnected ? styles.connected : styles.disconnected}`}>
                        <FaCircle/>
                        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                )}
            </div>
            <div className={styles.controls}>
                <ThemeSwitcher theme={theme} toggleTheme={toggleTheme}/>
                <button onClick={onAddTask} className={styles.addTaskBtn}>
                    <FaPlus/>
                    Add Task
                </button>
            </div>
        </header>
    );
};

export default Header;
