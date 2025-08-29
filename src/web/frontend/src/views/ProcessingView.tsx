import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { CognitiveItem } from '../types';

const ProcessingResult: React.FC<{ result: any }> = ({ result }) => {
    if (!result.cognitiveItems) {
        return <pre>{JSON.stringify(result, null, 2)}</pre>;
    }

    return (
        <div style={{ border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--color-card-background)', borderBottom: '1px solid var(--color-card-border)' }}>
                <strong>Input:</strong> {result.input}
            </div>
            <div style={{ padding: '1rem' }}>
                {result.cognitiveItems.map((item: CognitiveItem) => (
                    <div key={item.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                        <div><strong>Label:</strong> {item.label}</div>
                        <div><strong>Type:</strong> {item.type}</div>
                        {item.truth && <div><strong>Truth:</strong> F={item.truth.frequency}, C={item.truth.confidence}</div>}
                        {item.attention && <div><strong>Attention:</strong> P={item.attention.priority}, D={item.attention.durability}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
};


const ProcessingView: React.FC = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMessage = useCallback((message: any) => {
    if (message.type === 'response' && message.id?.startsWith('process-')) {
      setResults(prevResults => [message.payload, ...prevResults]);
      setIsProcessing(false);
    }
  }, []);

  const { sendMessage } = useWebSocket(handleMessage);

  const handleProcessInput = () => {
    if (input.trim()) {
      setIsProcessing(true);
      sendMessage({
        target: 'perception',
        method: 'processInput',
        payload: { input },
        id: `process-${Date.now()}`
      });
    }
  };

  return (
    <div>
      <p>Enter natural language text to be processed by the Senars3 cognitive engine.</p>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to process..."
          style={{ flexGrow: 1, height: '100px', padding: '0.75rem', border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)' }}
        />
        <button
          onClick={handleProcessInput}
          disabled={isProcessing}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            backgroundColor: isProcessing ? 'var(--color-secondary)' : 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--border-radius)',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            alignSelf: 'flex-start'
          }}
        >
          {isProcessing ? 'Processing...' : 'Process'}
        </button>
      </div>

      <h3>Processing Results</h3>
      <div>
        {results.length > 0 ? (
          results.map((result, index) => (
            <ProcessingResult key={index} result={result} />
          ))
        ) : (
          <p>No results yet. Process some input to see the results here.</p>
        )}
      </div>
    </div>
  );
};

export default ProcessingView;
