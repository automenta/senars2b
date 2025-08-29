import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const CliView: React.FC = () => {
  const [history, setHistory] = useState<string[]>(['Welcome to the Senars3 Web CLI!']);
  const [command, setCommand] = useState('');
  const endOfHistoryRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [history]);

  const handleMessage = useCallback((message: any) => {
    setHistory(prev => [...prev, `<< ${JSON.stringify(message, null, 2)}`]);
  }, []);

  const { sendMessage } = useWebSocket(handleMessage);

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setHistory(prev => [...prev, `>> ${command}`]);

      const [cmd, ...args] = command.split(' ');
      const payload = args.join(' ');

      switch (cmd) {
        case 'status':
          sendMessage({ target: 'core', method: 'getSystemStatus', payload: {} });
          break;
        case 'stats':
            sendMessage({ target: 'worldModel', method: 'getStatistics', payload: {} });
            break;
        case 'process':
          sendMessage({ target: 'perception', method: 'processInput', payload: { input: payload } });
          break;
        case 'clear':
          setHistory([]);
          break;
        case 'help':
          setHistory(prev => [...prev, 'Available commands: status, stats, process <input>, clear, help']);
          break;
        default:
          // Support for core.<method> <json>
          if (cmd.includes('.')) {
            const [target, method] = cmd.split('.');
            try {
              const jsonPayload = JSON.parse(payload || '{}');
              sendMessage({ target, method, payload: jsonPayload });
            } catch (err) {
              setHistory(prev => [...prev, 'Error: Invalid JSON payload']);
            }
          } else {
            setHistory(prev => [...prev, `Unknown command: ${cmd}`]);
          }
      }
      setCommand('');
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      <h2>Command Line Interface</h2>
      <div style={{ flexGrow: 1, border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)', background: '#111', padding: '1rem', overflowY: 'auto', fontFamily: 'monospace', color: '#eee' }}>
        {history.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
        <div ref={endOfHistoryRef} />
      </div>
      <input
        type="text"
        value={command}
        onChange={e => setCommand(e.target.value)}
        onKeyDown={handleCommand}
        placeholder="Enter command..."
        style={{ marginTop: '1rem', padding: '0.75rem', border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)', background: '#333', color: '#eee', fontFamily: 'monospace' }}
      />
    </div>
  );
};

export default CliView;
