import React, { useState } from 'react';
import { FaBell, FaCircle, FaCog, FaInbox, FaTerminal } from 'react-icons/fa';
import ThemeSwitcher from './ThemeSwitcher';
import styles from './Header.module.css';
import NotificationCenter from './NotificationCenter';
import Inbox from './Inbox';
import { useStore } from '../store';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  isConnected?: boolean;
  // A real implementation would pass a 'setCurrentView' function
  onNavigate: (view: 'Configuration' | 'CLI') => void;
}

const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  isConnected,
  onNavigate,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  const notifications = useStore((state) => state.notifications);
  const pendingPrompts = useStore((state) => state.getPendingPrompts());
  const notificationCount = notifications.length;
  const promptCount = pendingPrompts.length;

  const handleInboxClick = () => {
    setShowInbox(true);
    setShowNotifications(false);
  };

  const handleNotificationClick = () => {
    setShowNotifications(true);
    setShowInbox(false);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.titleContainer}>
          <h1>Workspace</h1>
          {isConnected !== undefined && (
            <div
              className={`${styles.connectionIndicator} ${isConnected ? styles.connected : styles.disconnected}`}
            >
              <FaCircle />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          )}
        </div>
        <div className={styles.controls}>
          <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
          <button
            className={styles.iconButton}
            aria-label="Notifications"
            onClick={handleNotificationClick}
          >
            <FaBell />
            {notificationCount > 0 && (
              <span className={styles.badge}>{notificationCount}</span>
            )}
          </button>
          <button
            className={styles.iconButton}
            aria-label="Inbox"
            onClick={handleInboxClick}
          >
            <FaInbox />
            {promptCount > 0 && (
              <span className={`${styles.badge} ${styles.primary}`}>
                {promptCount}
              </span>
            )}
          </button>
          <div className={styles.dropdown}>
            <button
              className={styles.iconButton}
              aria-label="Settings and more"
            >
              <FaCog />
            </button>
            <div className={styles.dropdownContent}>
              <a href="#" onClick={() => onNavigate('Configuration')}>
                <FaCog className={styles.dropdownIcon} />
                Configuration
              </a>
              <a href="#" onClick={() => onNavigate('CLI')}>
                <FaTerminal className={styles.dropdownIcon} />
                CLI
              </a>
            </div>
          </div>
        </div>
      </header>
      {showNotifications && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}
      {showInbox && <Inbox onClose={() => setShowInbox(false)} />}
    </>
  );
};

export default Header;
