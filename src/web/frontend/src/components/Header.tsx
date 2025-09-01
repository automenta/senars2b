import React from 'react';
import {FaMoon, FaSun, FaWifi, FaWifiSlash, FaBrain, FaChartLine, FaTasks} from 'react-icons/fa';
import styles from './Header.module.css';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    isConnected: boolean;
    onNavigate: (view: string) => void;
}

const Header: React.FC<HeaderProps> = ({theme, toggleTheme, isConnected, onNavigate}) => {
    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <FaBrain className={styles.logoIcon}/>
                <span className={styles.logoText}>Senars3</span>
            </div>

            <nav className={styles.nav}>
                <a href="#" className={`${styles.navItem} ${styles.active}`} onClick={(e) => {
                    e.preventDefault();
                    onNavigate('dashboard');
                }}>
                    <FaChartLine/> Dashboard
                </a>
                <a href="#" className={styles.navItem} onClick={(e) => {
                    e.preventDefault();
                    onNavigate('tasks');
                }}>
                    <FaTasks/> Tasks
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
