import React from 'react';
import {FaMoon, FaSun, FaBrain, FaChartLine, FaTasks, FaCog} from 'react-icons/fa';
import styles from './Header.module.css';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    isConnected: boolean;
    onNavigate: (view: 'dashboard' | 'tasks' | 'configuration') => void;
    currentView?: 'dashboard' | 'tasks' | 'configuration';
}

const Header: React.FC<HeaderProps> = ({theme, toggleTheme, isConnected, onNavigate, currentView = 'dashboard'}) => {
    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <FaBrain className={styles.logoIcon}/>
                <span className={styles.logoText}>Senars3</span>
            </div>

            <nav className={styles.nav}>
                <a 
                    href="#" 
                    className={`${styles.navItem} ${currentView === 'dashboard' ? styles.active : ''}`} 
                    onClick={(e) => {
                        e.preventDefault();
                        onNavigate('dashboard');
                    }}
                >
                    <FaChartLine/> Dashboard
                </a>
                <a 
                    href="#" 
                    className={`${styles.navItem} ${currentView === 'tasks' ? styles.active : ''}`} 
                    onClick={(e) => {
                        e.preventDefault();
                        onNavigate('tasks');
                    }}
                >
                    <FaTasks/> Tasks
                </a>
                <a 
                    href="#" 
                    className={`${styles.navItem} ${currentView === 'configuration' ? styles.active : ''}`} 
                    onClick={(e) => {
                        e.preventDefault();
                        onNavigate('configuration');
                    }}
                >
                    <FaCog/> Configuration
                </a>
            </nav>

            <div className={styles.actions}>
                <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
                    <div
                        className={`${styles.connectionIndicator} ${isConnected ? styles.connected : styles.disconnected}`}></div>
                    {isConnected ? 'Online' : 'Offline'}
                </div>

                <button
                    onClick={toggleTheme}
                    className={styles.themeToggle}
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? <FaMoon/> : <FaSun/>}
                </button>
            </div>
        </header>
    );
};

export default Header;
