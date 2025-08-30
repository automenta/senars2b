import React, {useEffect, useState} from 'react';
import {useStore} from '../store';
import {TaskPriority} from '../types';
import {z} from 'zod';
import styles from './AddTaskModal.module.css';

interface AddTaskModalProps {
    onAddTask: (task: {
        title: string;
        description?: string;
        priority: TaskPriority,
        type: 'REGULAR' | 'AGENT'
    }) => void;
}

const taskSchema = z.object({
    title: z.string().min(1, {message: "Title is required"}),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    type: z.enum(['REGULAR', 'AGENT']),
});

type TaskFormData = z.infer<typeof taskSchema>;

const AddTaskModal: React.FC<AddTaskModalProps> = ({onAddTask}) => {
    const {isModalOpen, setIsModalOpen} = useStore();
    const [formData, setFormData] = useState<TaskFormData>({
        title: '',
        description: '',
        priority: 'medium',
        type: 'REGULAR',
    });
    const [errors, setErrors] = useState<z.ZodError['formErrors']['fieldErrors'] | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (!isModalOpen) {
            // Reset form when modal closes
            setFormData({
                title: '',
                description: '',
                priority: 'medium',
                type: 'REGULAR',
            });
            setErrors(null);
            setShowDetails(false);
        }
    }, [isModalOpen]);

    if (!isModalOpen) {
        return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = taskSchema.safeParse(formData);
        if (result.success) {
            onAddTask(result.data);
            setIsModalOpen(false);
        } else {
            setErrors(result.error.formErrors.fieldErrors);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add New Task</h2>
                    <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Task Title"
                        className={styles.input}
                    />
                    {errors?.title && <p className={styles.error}>{errors.title[0]}</p>}

                    {showDetails && (
                        <>
              <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description"
                  className={styles.textarea}
              />
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className={styles.select}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className={styles.select}
                            >
                                <option value="REGULAR">Regular</option>
                                <option value="AGENT">Agent</option>
                            </select>
                        </>
                    )}

                    <div className={styles.footer}>
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className={styles.detailsBtn}
                        >
                            {showDetails ? 'Hide Details' : 'Add Details'}
                        </button>
                        <button type="submit" className={styles.submitBtn}>
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;
