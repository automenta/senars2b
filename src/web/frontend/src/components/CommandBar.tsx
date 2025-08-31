import React, {useCallback, useEffect, useRef, useState} from 'react';
import {motion} from 'framer-motion';
import styles from './CommandBar.module.css';
import {FaChevronDown, FaChevronUp, FaTerminal, FaVial} from 'react-icons/fa';
import {useWebSocket} from "../hooks/useWebSocket";
import {CognitiveItem} from "../types";

const CommandBar: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'CLI' | 'PROCESS'>('CLI');

    // Merged logic from both views
    const [cliHistory, setCliHistory] = useState<string[]>(['Welcome to the Senars3 Web CLI!']);
    const [command, setCommand] = useState('');
    const [processingInput, setProcessingInput] = useState('');
    const [processingResults, setProcessingResults] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const endOfHistoryRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        endOfHistoryRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(scrollToBottom, [cliHistory]);

    const handleMessage = useCallback((message: any) => {
        if (activeTab === 'CLI') {
            setCliHistory(prev => [...prev, `<< ${JSON.stringify(message, null, 2)}`]);
        } else if (activeTab === 'PROCESS') {
            if (message.type === 'response' && message.id?.startsWith('process-')) {
                setProcessingResults(prevResults => [message.payload, ...prevResults]);
                setIsProcessing(false);
            }
        }
    }, [activeTab]);

    const {sendMessage} = useWebSocket(handleMessage);

    const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setCliHistory(prev => [...prev, `>> ${command}`]);

            const [cmd, ...args] = command.split(' ');
            const payload = args.join(' ');

            switch (cmd) {
                case 'status':
                    sendMessage({target: 'core', method: 'getSystemStatus', payload: {}});
                    break;
                case 'stats':
                    sendMessage({target: 'worldModel', method: 'getStatistics', payload: {}});
                    break;
                case 'process':
                    sendMessage({target: 'perception', method: 'processInput', payload: {input: payload}});
                    break;
                case 'clear':
                    setCliHistory([]);
                    break;
                case 'help':
                    setCliHistory(prev => [...prev, 'Available commands: status, stats, process <input>, clear, help']);
                    break;
                default:
                    if (cmd.includes('.')) {
                        const [target, method] = cmd.split('.');
                        try {
                            const jsonPayload = JSON.parse(payload || '{}');
                            sendMessage({target, method, payload: jsonPayload});
                        } catch (err) {
                            setCliHistory(prev => [...prev, 'Error: Invalid JSON payload']);
                        }
                    } else {
                        setCliHistory(prev => [...prev, `Unknown command: ${cmd}`]);
                    }
            }
            setCommand('');
        }
    };

    const handleProcessInput = () => {
        if (processingInput.trim()) {
            setIsProcessing(true);
            sendMessage({
                target: 'perception',
                method: 'processInput',
                payload: {input: processingInput},
                id: `process-${Date.now()}`
            });
        }
    };


    const CliPanel = () => (
        <div className={styles.panelContainer}>
            <div className={styles.history}>
                {cliHistory.map((line, index) => (
                    <div key={index} dangerouslySetInnerHTML={{__html: line.replace(/</g, '&lt;')}}/>
                ))}
                <div ref={endOfHistoryRef}/>
            </div>
            <input
                type="text"
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={handleCommand}
                placeholder="Enter command..."
                className={styles.cliInput}
            />
        </div>
    );

    const ProcessingResult: React.FC<{ result: any }> = ({result}) => {
        if (!result.cognitiveItems) {
            return <pre>{JSON.stringify(result, null, 2)}</pre>;
        }

        return (
            <div className={styles.resultCard}>
                <div className={styles.resultHeader}>
                    <strong>Input:</strong> {result.input}
                </div>
                <div className={styles.resultContent}>
                    {result.cognitiveItems.map((item: CognitiveItem) => (
                        <div key={item.id} className={styles.cognitiveItem}>
                            <div><strong>Label:</strong> {item.label}</div>
                            <div><strong>Type:</strong> {item.type}</div>
                            {item.truth &&
                                <div><strong>Truth:</strong> F={item.truth.frequency}, C={item.truth.confidence}</div>}
                            {item.attention &&
                                <div><strong>Attention:</strong> P={item.attention.priority}, D={item.attention.durability}
                                </div>}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const ProcessingPanel = () => (
        <div className={styles.panelContainer}>
            <div className={styles.processingControls}>
                 <textarea
                     value={processingInput}
                     onChange={(e) => setProcessingInput(e.target.value)}
                     placeholder="Enter text to process..."
                     className={styles.processingTextarea}
                 />
                <button
                    onClick={handleProcessInput}
                    disabled={isProcessing}
                    className={styles.processingButton}
                >
                    {isProcessing ? 'Processing...' : 'Process'}
                </button>
            </div>
            <div className={styles.resultsContainer}>
                {processingResults.length > 0 ? (
                    processingResults.map((result, index) => (
                        <ProcessingResult key={index} result={result}/>
                    ))
                ) : (
                    <p>No results yet. Process some input to see the results here.</p>
                )}
            </div>
        </div>
    );

    const commandBarVariants = {
        collapsed: {
            height: "48px",
            transition: {duration: 0.2, ease: "easeOut"}
        },
        expanded: {
            height: "40vh",
            maxHeight: "300px",
            transition: {duration: 0.3, ease: "easeIn"}
        }
    };

    return (
        <motion.footer
            className={styles.commandBar}
            variants={commandBarVariants}
            initial="collapsed"
            animate={isExpanded ? "expanded" : "collapsed"}
        >
            <div className={styles.header}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'CLI' ? styles.active : ''}`}
                        onClick={() => setActiveTab('CLI')}
                    >
                        <FaTerminal/>
                        <span>CLI</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'PROCESS' ? styles.active : ''}`}
                        onClick={() => setActiveTab('PROCESS')}
                    >
                        <FaVial/>
                        <span>Process</span>
                    </button>
                </div>
                <button className={styles.toggleButton} onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <FaChevronDown/> : <FaChevronUp/>}
                </button>
            </div>
            <div className={styles.content}>
                {activeTab === 'CLI' ? <CliPanel/> : <ProcessingPanel/>}
            </div>
        </motion.footer>
    );
};

export default CommandBar;
