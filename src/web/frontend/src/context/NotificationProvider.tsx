import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import styles from './Notification.module.css';
import { useStore } from '../store';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    id: number;
    message: string;
    type: NotificationType;
    duration?: number;
}

interface NotificationContextType {
    addNotification: (message: string, type: NotificationType, duration?: number) => void;
    removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifier = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifier must be used within a NotificationProvider');
    }
    return context;
};

const ICONS: Record<NotificationType, React.ReactNode> = {
    success: <FaCheckCircle />,
    error: <FaExclamationCircle />,
    info: <FaInfoCircle />,
    warning: <FaExclamationCircle />,
};

const TYPE_LABELS: Record<NotificationType, string> = {
    success: 'Success',
    error: 'Error',
    info: 'Info',
    warning: 'Warning',
};

export const NotificationProvider: React.FC = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { notificationsEnabled } = useStore();

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((message: string, type: NotificationType, duration: number = 5000) => {
        if (!notificationsEnabled) return;
        
        const id = Date.now() + Math.floor(Math.random() * 1000);
        const newNotification: Notification = { id, message, type, duration };
        
        setNotifications(prev => [...prev, newNotification]);
    }, [notificationsEnabled]);

    // Clean up notifications when component unmounts
    useEffect(() => {
        return () => {
            setNotifications([]);
        };
    }, []);

    return (
        <NotificationContext.Provider value={{ addNotification, removeNotification }}>
            {children}
            <div className={styles.container}>
                <AnimatePresence>
                    {notifications.map(notification => (
                        <NotificationItem 
                            key={notification.id} 
                            notification={notification} 
                            onRemove={removeNotification} 
                        />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};

interface NotificationItemProps {
    notification: Notification;
    onRemove: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [progress, setProgress] = useState(100);
    
    // Auto-remove notification after duration
    useEffect(() => {
        if (isHovered) return;
        
        const timer = setTimeout(() => {
            onRemove(notification.id);
        }, notification.duration);
        
        // Progress bar animation
        const progressTimer = setInterval(() => {
            setProgress(prev => {
                const decrement = 100 / (notification.duration / 100);
                const newProgress = prev - decrement;
                return newProgress > 0 ? newProgress : 0;
            });
        }, 100);
        
        return () => {
            clearTimeout(timer);
            clearInterval(progressTimer);
        };
    }, [notification.id, notification.duration, onRemove, isHovered]);
    
    return (
        <motion.div
            className={`${styles.notification} ${styles[notification.type]}`}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            layout
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={styles.icon}>{ICONS[notification.type]}</div>
            <div className={styles.content}>
                <div className={styles.header}>
                    <span className={styles.typeLabel}>{TYPE_LABELS[notification.type]}</span>
                    <button 
                        className={styles.closeButton}
                        onClick={() => onRemove(notification.id)}
                        aria-label="Close notification"
                    >
                        <FaTimes />
                    </button>
                </div>
                <p className={styles.message}>{notification.message}</p>
                <div className={styles.progressBar}>
                    <div 
                        className={styles.progressFill} 
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </motion.div>
    );
};
