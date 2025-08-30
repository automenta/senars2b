import React from 'react';
import { useStore } from '../store';
import styles from './NotificationCenter.module.css';
import { FaBell, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { NotificationType } from '../types';

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
    switch (type) {
        case 'success':
            return <FaCheckCircle className={`${styles.icon} ${styles.success}`} />;
        case 'error':
            return <FaExclamationCircle className={`${styles.icon} ${styles.error}`} />;
        case 'warning':
            return <FaExclamationCircle className={`${styles.icon} ${styles.warning}`} />;
        case 'info':
        default:
            return <FaInfoCircle className={`${styles.icon} ${styles.info}`} />;
    }
};

const NotificationCenter: React.FC<{onClose: () => void}> = ({onClose}) => {
    const { notifications, removeNotification } = useStore();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Notifications</h3>
                <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
            </div>
            <div className={styles.list}>
                {notifications.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaBell />
                        <p>No new notifications</p>
                    </div>
                ) : (
                    [...notifications].reverse().map(notification => (
                        <div key={notification.id} className={styles.notificationItem}>
                            <NotificationIcon type={notification.type} />
                            <div className={styles.message}>
                                {notification.message}
                                <span className={styles.timestamp}>
                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <button
                                onClick={() => removeNotification(notification.id)}
                                className={styles.dismissButton}
                            >
                                <FaTimes />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;
