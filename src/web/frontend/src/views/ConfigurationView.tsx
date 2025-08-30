import React, {useCallback, useEffect, useState} from 'react';
import {useWebSocket} from '../hooks/useWebSocket';
import {useStore} from '../store';
import styles from './ConfigurationView.module.css';

interface AttentionParams {
    priorityWeight: number;
    durabilityWeight: number;
}

interface ReflectionParams {
    enabled: boolean;
    someParameter: number; // Placeholder
}

const ConfigurationView: React.FC = () => {
    const {theme, toggleTheme, notificationsEnabled, toggleNotifications} = useStore();
    const [attentionParams, setAttentionParams] = useState<AttentionParams>({
        priorityWeight: 0.7,
        durabilityWeight: 0.3
    });
    const [reflectionParams, setReflectionParams] = useState<ReflectionParams>({enabled: true, someParameter: 0.5});
    const [attentionStats, setAttentionStats] = useState<any>(null);
    const [reflectionStats, setReflectionStats] = useState<any>(null);

    const handleMessage = useCallback((message: any) => {
        if (message.type === 'response' && message.payload) {
            if (message.id.includes('attention.getStatistics')) {
                setAttentionStats(message.payload);
            } else if (message.id.includes('reflection.getStatistics')) {
                setReflectionStats(message.payload);
            }
        }
    }, []);

    const {sendMessage} = useWebSocket(handleMessage);

    useEffect(() => {
        // Request initial stats
        sendMessage({target: 'attention', method: 'getStatistics', payload: {}, id: 'attention.getStatistics'});
        sendMessage({target: 'reflection', method: 'getStatistics', payload: {}, id: 'reflection.getStatistics'});
    }, [sendMessage]);

    const handleAttentionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAttentionParams({...attentionParams, [e.target.name]: parseFloat(e.target.value)});
    };

    const handleReflectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : parseFloat(e.target.value);
        setReflectionParams({...reflectionParams, [e.target.name]: value});
    };

    const handleSave = () => {
        sendMessage({target: 'attention', method: 'setParameters', payload: attentionParams});
        sendMessage({
            target: 'reflection',
            method: 'setParameters',
            payload: {enabled: reflectionParams.enabled, parameters: {someParameter: reflectionParams.someParameter}}
        });
        sendMessage({target: 'reflection', method: 'setEnabled', payload: {enabled: reflectionParams.enabled}});
    };

    return (
        <div className={styles.container}>
            <h2>System Configuration</h2>
            <p>Fine-tune the parameters of the cognitive engine and UI.</p>

            <div className={styles.card}>
                <h3 className={styles.cardHeader}>UI Settings</h3>
                <div className={styles.cardBody}>
                    <div className={styles.settingRow}>
                        <label>Theme</label>
                        <div className={styles.themeSwitcher}>
                            <button onClick={toggleTheme} disabled={theme === 'light'}>Light</button>
                            <button onClick={toggleTheme} disabled={theme === 'dark'}>Dark</button>
                        </div>
                    </div>
                    <div className={styles.settingRow}>
                        <label>Enable Notifications</label>
                        <label className={styles.switch}>
                            <input type="checkbox" checked={notificationsEnabled} onChange={toggleNotifications}/>
                            <span className={styles.slider}></span>
                        </label>
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <h3 className={styles.cardHeader}>Attention Module</h3>
                <div className={styles.cardBody}>
                    <div className={styles.settingRow}>
                        <label>Priority Weight: </label>
                        <input type="number" name="priorityWeight" value={attentionParams.priorityWeight}
                               onChange={handleAttentionChange} step="0.1" min="0" max="1"/>
                    </div>
                    <div className={styles.settingRow}>
                        <label>Durability Weight: </label>
                        <input type="number" name="durabilityWeight" value={attentionParams.durabilityWeight}
                               onChange={handleAttentionChange} step="0.1" min="0" max="1"/>
                    </div>
                    {attentionStats && <pre>{JSON.stringify(attentionStats, null, 2)}</pre>}
                </div>
            </div>

            <div className={styles.card}>
                <h3 className={styles.cardHeader}>Reflection Module</h3>
                <div className={styles.cardBody}>
                    <div className={styles.settingRow}>
                        <label>Enabled: </label>
                        <input type="checkbox" name="enabled" checked={reflectionParams.enabled}
                               onChange={handleReflectionChange}/>
                    </div>
                    <div className={styles.settingRow}>
                        <label>Some Parameter: </label>
                        <input type="number" name="someParameter" value={reflectionParams.someParameter}
                               onChange={handleReflectionChange} step="0.1" min="0" max="1"/>
                    </div>
                    {reflectionStats && <pre>{JSON.stringify(reflectionStats, null, 2)}</pre>}
                </div>
            </div>

            <button onClick={handleSave} className={styles.saveButton}>
                Save Configuration
            </button>
        </div>
    );
};

export default ConfigurationView;
