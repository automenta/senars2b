import React from 'react';
import { useStore } from '../store';
import styles from './Inbox.module.css';
import { FaInbox, FaTimes } from 'react-icons/fa';
import PromptCard from './PromptCard';

const Inbox: React.FC<{onClose: () => void}> = ({onClose}) => {
    const { getPendingPrompts, updatePrompt } = useStore();
    const pendingPrompts = getPendingPrompts();

    const handleAnswer = (promptId: string, answer: any) => {
        // Here you would send the answer to the backend via WebSocket
        console.log(`Answering prompt ${promptId} with:`, answer);
        // For now, just mark as answered
        updatePrompt(promptId, { status: 'answered' });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Inbox</h3>
                <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
            </div>
            <div className={styles.list}>
                {pendingPrompts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaInbox />
                        <p>All caught up!</p>
                    </div>
                ) : (
                    pendingPrompts.map(prompt => (
                        <PromptCard key={prompt.id} prompt={prompt} onAnswer={handleAnswer} />
                    ))
                )}
            </div>
        </div>
    );
};

export default Inbox;
