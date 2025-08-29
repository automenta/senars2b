import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface AttentionParams {
  priorityWeight: number;
  durabilityWeight: number;
}

interface ReflectionParams {
  enabled: boolean;
  someParameter: number; // Placeholder
}

const ConfigurationView: React.FC = () => {
  const [attentionParams, setAttentionParams] = useState<AttentionParams>({ priorityWeight: 0.7, durabilityWeight: 0.3 });
  const [reflectionParams, setReflectionParams] = useState<ReflectionParams>({ enabled: true, someParameter: 0.5 });
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

  const { sendMessage } = useWebSocket(handleMessage);

  useEffect(() => {
    // Request initial stats
    sendMessage({ target: 'attention', method: 'getStatistics', payload: {}, id: 'attention.getStatistics' });
    sendMessage({ target: 'reflection', method: 'getStatistics', payload: {}, id: 'reflection.getStatistics' });
  }, [sendMessage]);

  const handleAttentionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttentionParams({ ...attentionParams, [e.target.name]: parseFloat(e.target.value) });
  };

  const handleReflectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : parseFloat(e.target.value);
    setReflectionParams({ ...reflectionParams, [e.target.name]: value });
  };

  const handleSave = () => {
    sendMessage({ target: 'attention', method: 'setParameters', payload: attentionParams });
    sendMessage({ target: 'reflection', method: 'setParameters', payload: { enabled: reflectionParams.enabled, parameters: { someParameter: reflectionParams.someParameter } } });
    sendMessage({ target: 'reflection', method: 'setEnabled', payload: { enabled: reflectionParams.enabled } });
  };

  return (
    <div>
      <h2>System Configuration</h2>
      <p>Fine-tune the parameters of the cognitive engine.</p>

      <div style={{ border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)', marginBottom: '2rem' }}>
        <h3 style={{ padding: '1rem', margin: 0, background: 'var(--color-card-background)', borderBottom: '1px solid var(--color-card-border)' }}>Attention Module</h3>
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Priority Weight: </label>
            <input type="number" name="priorityWeight" value={attentionParams.priorityWeight} onChange={handleAttentionChange} step="0.1" min="0" max="1" />
          </div>
          <div>
            <label>Durability Weight: </label>
            <input type="number" name="durabilityWeight" value={attentionParams.durabilityWeight} onChange={handleAttentionChange} step="0.1" min="0" max="1" />
          </div>
          {attentionStats && <pre style={{marginTop: '1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>{JSON.stringify(attentionStats, null, 2)}</pre>}
        </div>
      </div>

      <div style={{ border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)', marginBottom: '2rem' }}>
        <h3 style={{ padding: '1rem', margin: 0, background: 'var(--color-card-background)', borderBottom: '1px solid var(--color-card-border)' }}>Reflection Module</h3>
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Enabled: </label>
            <input type="checkbox" name="enabled" checked={reflectionParams.enabled} onChange={handleReflectionChange} />
          </div>
          <div>
            <label>Some Parameter: </label>
            <input type="number" name="someParameter" value={reflectionParams.someParameter} onChange={handleReflectionChange} step="0.1" min="0" max="1" />
          </div>
          {reflectionStats && <pre style={{marginTop: '1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>{JSON.stringify(reflectionStats, null, 2)}</pre>}
        </div>
      </div>

      <button onClick={handleSave} style={{ padding: '0.75rem 1.5rem', border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius)', cursor: 'pointer' }}>
        Save Configuration
      </button>
    </div>
  );
};

export default ConfigurationView;
