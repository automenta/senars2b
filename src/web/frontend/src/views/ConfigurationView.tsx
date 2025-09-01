import React from 'react';
import {motion} from 'framer-motion';
import {FaCogs, FaDatabase, FaNetworkWired, FaShieldAlt, FaSync} from 'react-icons/fa';
import styles from './ConfigurationView.module.css';

const ConfigurationView: React.FC = () => {
    return (
        <motion.div
            className={styles.configurationView}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.3}}
        >
            <div className={styles.header}>
                <h1>Configuration</h1>
                <p>System settings and preferences</p>
            </div>

            <div className={styles.settingsGrid}>
                <div className={styles.settingCard}>
                    <div className={styles.cardHeader}>
                        <FaCogs className={styles.cardIcon} />
                        <h2>General Settings</h2>
                    </div>
                    <div className={styles.cardContent}>
                        <div className={styles.settingItem}>
                            <label htmlFor="theme">Theme</label>
                            <select id="theme" className={styles.selectInput}>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                                <option value="auto">Auto</option>
                            </select>
                        </div>
                        <div className={styles.settingItem}>
                            <label htmlFor="language">Language</label>
                            <select id="language" className={styles.selectInput}>
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.settingCard}>
                    <div className={styles.cardHeader}>
                        <FaDatabase className={styles.cardIcon} />
                        <h2>Data Management</h2>
                    </div>
                    <div className={styles.cardContent}>
                        <div className={styles.settingItem}>
                            <label>Auto-save</label>
                            <div className={styles.toggleSwitch}>
                                <input type="checkbox" id="autoSave" defaultChecked />
                                <label htmlFor="autoSave" className={styles.toggleLabel}></label>
                            </div>
                        </div>
                        <div className={styles.settingItem}>
                            <label>Backup Frequency</label>
                            <select className={styles.selectInput}>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.settingCard}>
                    <div className={styles.cardHeader}>
                        <FaNetworkWired className={styles.cardIcon} />
                        <h2>Connection</h2>
                    </div>
                    <div className={styles.cardContent}>
                        <div className={styles.settingItem}>
                            <label>WebSocket Reconnect</label>
                            <div className={styles.toggleSwitch}>
                                <input type="checkbox" id="reconnect" defaultChecked />
                                <label htmlFor="reconnect" className={styles.toggleLabel}></label>
                            </div>
                        </div>
                        <div className={styles.settingItem}>
                            <label>Max Reconnect Attempts</label>
                            <input type="number" defaultValue="5" min="1" max="10" className={styles.numberInput} />
                        </div>
                    </div>
                </div>

                <div className={styles.settingCard}>
                    <div className={styles.cardHeader}>
                        <FaShieldAlt className={styles.cardIcon} />
                        <h2>Security</h2>
                    </div>
                    <div className={styles.cardContent}>
                        <div className={styles.settingItem}>
                            <label>Enable Notifications</label>
                            <div className={styles.toggleSwitch}>
                                <input type="checkbox" id="notifications" defaultChecked />
                                <label htmlFor="notifications" className={styles.toggleLabel}></label>
                            </div>
                        </div>
                        <div className={styles.settingItem}>
                            <label>Session Timeout (minutes)</label>
                            <input type="number" defaultValue="30" min="5" max="120" className={styles.numberInput} />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.actionButtons}>
                <button className={styles.saveButton}>
                    <FaSync className={styles.buttonIcon} />
                    Save Settings
                </button>
                <button className={styles.resetButton}>
                    Reset to Defaults
                </button>
            </div>
        </motion.div>
    );
};

export default ConfigurationView;