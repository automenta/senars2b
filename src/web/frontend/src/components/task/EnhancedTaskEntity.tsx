import React, {useState, useCallback, useRef, useEffect} from 'react';
import {Task, TaskPriority, TaskStatus} from '../../types';
import {
    FaGripVertical,
    FaCheck,
    FaEdit,
    FaTrash,
    FaPlay,
    FaPause,
    FaStop,
    FaEllipsisV,
    FaArrowUp,
    FaArrowDown,
    FaClone,
    FaTag,
    FaCalendarAlt,
    FaClock,
    FaUser,
    FaLink,
    FaPlus,
    FaChevronDown,
    FaChevronRight
} from 'react-icons/fa';
import styles from './TaskEntity.module.css';
import {useTaskActions} from '../../hooks/useTaskActions';
import {crdtTaskManager} from '../../crdtTaskManager';
import PriorityBadge from '../PriorityBadge';
import StatusBadge from '../StatusBadge';
import ProgressBar from '../ProgressBar';
import TaskContextMenu from './TaskContextMenu';

interface EnhancedTaskEntityProps {
    task: Task;
    isSelected?: boolean;
    isEditing?: boolean;
    isDraggable?: boolean;
    hasSubtasks?: boolean;
    isExpanded?: boolean;
    onEditStart?: (taskId: string) => void;
    onEditEnd?: (taskId: string) => void;
    onToggleSelect?: (taskId: string) => void;
    onToggleExpand?: (taskId: string) => void;
    onDragStart?: (e: React.DragEvent, taskId: string) => void;
    onDragOver?: (e: React.DragEvent, taskId: string) => void;
    onDrop?: (e: React.DragEvent, taskId: string) => void;
    onReorder?: (taskId: string, direction: 'up' | 'down') => void;
    onFocus?: (taskId: string) => void;
    onClone?: (task: Task) => void;
}

const EnhancedTaskEntity: React.FC<EnhancedTaskEntityProps> = ({
                                                                   task,
                                                                   isSelected = false,
                                                                   isEditing = false,
                                                                   isDraggable = false,
                                                                   hasSubtasks = false,
                                                                   isExpanded = false,
                                                                   onEditStart,
                                                                   onEditEnd,
                                                                   onToggleSelect,
                                                                   onToggleExpand,
                                                                   onDragStart,
                                                                   onDragOver,
                                                                   onDrop,
                                                                   onReorder,
                                                                   onFocus,
                                                                   onClone
                                                               }) => {
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [editedDescription, setEditedDescription] = useState(task.description || '');
    const [showActions, setShowActions] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const {updateTask, deleteTask, completeTask, pauseTask, resumeTask, failTask} = useTaskActions();

    const isAgentTask = task.type === 'AGENT';
    const isCompleted = task.status === 'completed';
    const isFailed = task.status === 'failed';
    const isDeferred = task.status === 'deferred';
    const isInProgress = task.status === 'ready_for_execution' || task.status === 'decomposing';

    useEffect(() => {
        if (isEditing && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditing]);

    const handleEditStart = useCallback(() => {
        if (onEditStart) {
            onEditStart(task.id);
        }
    }, [onEditStart, task.id]);

    const handleEditSave = useCallback(() => {
        if (editedTitle.trim() !== task.title || editedDescription !== (task.description || '')) {
            // Update via CRDT manager for proper synchronization
            crdtTaskManager.updateTask(task.id, {
                title: editedTitle.trim(),
                description: editedDescription
            });
        }
        if (onEditEnd) {
            onEditEnd(task.id);
        }
    }, [editedTitle, editedDescription, task, onEditEnd]);

    const handleEditCancel = useCallback(() => {
        setEditedTitle(task.title);
        setEditedDescription(task.description || '');
        if (onEditEnd) {
            onEditEnd(task.id);
        }
    }, [task, onEditEnd]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleEditSave();
        }
        if (e.key === 'Escape') {
            handleEditCancel();
        }
    }, [handleEditSave, handleEditCancel]);

    const handleToggleSelectClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleSelect) {
            onToggleSelect(task.id);
        }
    }, [onToggleSelect, task.id]);

    const handleToggleExpandClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleExpand) {
            onToggleExpand(task.id);
        }
    }, [onToggleExpand, task.id]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        // Delete via CRDT manager for proper synchronization
        crdtTaskManager.removeTask(task.id);
    }, [task.id]);

    const handleComplete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        // Update via CRDT manager for proper synchronization
        crdtTaskManager.updateTask(task.id, {status: 'completed'});
    }, [task.id]);

    const handlePause = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        // Update via CRDT manager for proper synchronization
        crdtTaskManager.updateTask(task.id, {status: 'paused'});
    }, [task.id]);

    const handleResume = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        // Update via CRDT manager for proper synchronization
        crdtTaskManager.updateTask(task.id, {status: 'pending'});
    }, [task.id]);

    const handleFail = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        // Update via CRDT manager for proper synchronization
        crdtTaskManager.updateTask(task.id, {status: 'failed'});
    }, [task.id]);

    const handleDragStartInternal = useCallback((e: React.DragEvent) => {
        if (isDraggable && onDragStart) {
            onDragStart(e, task.id);
        }
    }, [isDraggable, onDragStart, task.id]);

    const handleDragOverInternal = useCallback((e: React.DragEvent) => {
        if (onDragOver) {
            onDragOver(e, task.id);
        }
    }, [onDragOver, task.id]);

    const handleDropInternal = useCallback((e: React.DragEvent) => {
        if (onDrop) {
            onDrop(e, task.id);
        }
    }, [onDrop, task.id]);

    const handleReorder = useCallback((direction: 'up' | 'down') => {
        if (onReorder) {
            onReorder(task.id, direction);
        }
    }, [onReorder, task.id]);

    const handleFocus = useCallback(() => {
        if (onFocus) {
            onFocus(task.id);
        }
    }, [onFocus, task.id]);

    const handlePriorityChange = useCallback((priority: TaskPriority) => {
        // Update via CRDT manager for proper synchronization
        crdtTaskManager.updateTask(task.id, {priority});
    }, [task.id]);

    const handleStatusChange = useCallback((status: TaskStatus) => {
        // Update via CRDT manager for proper synchronization
        crdtTaskManager.updateTask(task.id, {status});
    }, [task.id]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Close any existing context menus
        document.dispatchEvent(new CustomEvent('close-context-menus'));

        // Position context menu near the click
        setContextMenuPosition({
            x: e.clientX,
            y: e.clientY
        });
    }, []);

    const handleCloseContextMenu = useCallback(() => {
        setContextMenuPosition(null);
    }, []);

    const handleCloneTask = useCallback(() => {
        if (onClone) {
            onClone(task);
        }
        handleCloseContextMenu();
    }, [onClone, task, handleCloseContextMenu]);

    // Listen for global close context menu events
    useEffect(() => {
        const closeHandler = () => handleCloseContextMenu();
        document.addEventListener('close-context-menus', closeHandler);
        return () => {
            document.removeEventListener('close-context-menus', closeHandler);
        };
    }, [handleCloseContextMenu]);

    const entityClasses = [
        styles.taskEntity,
        isSelected ? styles.selected : '',
        isEditing ? styles.editing : '',
        isCompleted ? styles.completed : '',
        isFailed ? styles.failed : '',
        showActions ? styles.showActions : '',
        showDetails ? styles.showDetails : ''
    ].filter(Boolean).join(' ');

    return (
        <div
            className={entityClasses}
            draggable={isDraggable}
            onDragStart={handleDragStartInternal}
            onDragOver={handleDragOverInternal}
            onDrop={handleDropInternal}
            onClick={handleToggleSelectClick}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onFocus={handleFocus}
            onContextMenu={handleContextMenu}
            tabIndex={0}
        >
            <div className={styles.taskEntityHeader}>
                {isDraggable && (
                    <div
                        className={styles.dragHandle}
                        aria-label="Drag to reorder"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <FaGripVertical/>
                    </div>
                )}

                <div
                    className={`${styles.checkbox} ${isCompleted ? styles.checked : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isCompleted) {
                            // Reopen task if completed
                            crdtTaskManager.updateTask(task.id, {status: 'pending'});
                        } else {
                            crdtTaskManager.updateTask(task.id, {status: 'completed'});
                        }
                    }}
                >
                    {isCompleted && <FaCheck/>}
                </div>

                <div className={styles.taskTitle}>
                    {isEditing ? (
                        <div className={styles.editing}>
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={styles.titleInput}
                                placeholder="Task title"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <textarea
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={styles.descriptionInput}
                                placeholder="Task description"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div className={styles.editActions}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditSave();
                                    }}
                                    className={styles.saveButton}
                                >
                                    Save
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditCancel();
                                    }}
                                    className={styles.cancelButton}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.titleContent}>
                                <div>{task.title}</div>
                                <div className={styles.taskDescription}>
                                    {task.description ||
                                        <span className={styles.emptyDescription}>No description</span>}
                                </div>
                            </div>

                            <div className={styles.taskMeta}>
                                <PriorityBadge priority={task.priority}/>
                                <StatusBadge status={task.status}/>
                            </div>

                            <div className={styles.progressBarContainer}>
                                <ProgressBar percentage={task.completion_percentage || 0}/>
                            </div>

                            <div className={styles.taskIndicators}>
                                {task.tags && task.tags.length > 0 && (
                                    <div className={styles.tagIndicator} title={`${task.tags.length} tags`}>
                                        <FaTag/>
                                        <span>{task.tags.length}</span>
                                    </div>
                                )}
                                {task.deadline && (
                                    <div className={styles.deadlineIndicator}
                                         title={`Due: ${new Date(task.deadline).toLocaleDateString()}`}>
                                        <FaCalendarAlt/>
                                    </div>
                                )}
                                {task.estimated_effort && (
                                    <div className={styles.effortIndicator}
                                         title={`Estimated effort: ${task.estimated_effort} hours`}>
                                        <FaClock/>
                                    </div>
                                )}
                                {task.assignee && (
                                    <div className={styles.assigneeIndicator} title={`Assigned to: ${task.assignee}`}>
                                        <FaUser/>
                                    </div>
                                )}
                                {hasSubtasks && (
                                    <div className={styles.subtaskIndicator} title={`${task.subtasks.length} subtasks`}>
                                        <FaLink/>
                                        <span>{task.subtasks.length}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.taskActions}>
                    {showActions && !isEditing && (
                        <>
                            <button
                                className={styles.actionButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditStart();
                                }}
                                aria-label="Edit task"
                                title="Edit task"
                            >
                                <FaEdit/>
                            </button>

                            {hasSubtasks && (
                                <button
                                    className={styles.actionButton}
                                    onClick={handleToggleExpandClick}
                                    aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                                    title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                                >
                                    {isExpanded ? <FaChevronDown/> : <FaChevronRight/>}
                                </button>
                            )}

                            <button
                                className={styles.actionButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDetails(!showDetails);
                                }}
                                aria-label="Toggle details"
                                title="Toggle details"
                            >
                                <FaEllipsisV/>
                            </button>

                            <div className={styles.moreActions}>
                                <button
                                    className={styles.actionButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReorder('up');
                                    }}
                                    aria-label="Move up"
                                    title="Move up"
                                >
                                    <FaArrowUp/>
                                </button>

                                <button
                                    className={styles.actionButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReorder('down');
                                    }}
                                    aria-label="Move down"
                                    title="Move down"
                                >
                                    <FaArrowDown/>
                                </button>

                                <button
                                    className={styles.actionButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCloneTask();
                                    }}
                                    aria-label="Clone task"
                                    title="Clone task"
                                >
                                    <FaClone/>
                                </button>

                                {isAgentTask ? (
                                    <>
                                        {task.status === 'deferred' || task.status === 'paused' ? (
                                            <button
                                                className={styles.actionButton}
                                                onClick={handleResume}
                                                aria-label="Resume task"
                                                title="Resume task"
                                            >
                                                <FaPlay/>
                                            </button>
                                        ) : (
                                            <button
                                                className={styles.actionButton}
                                                onClick={handlePause}
                                                aria-label="Pause task"
                                                title="Pause task"
                                            >
                                                <FaPause/>
                                            </button>
                                        )}
                                        <button
                                            className={styles.actionButton}
                                            onClick={handleFail}
                                            aria-label="Stop task"
                                            title="Stop task"
                                        >
                                            <FaStop/>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className={styles.actionButton}
                                        onClick={handleComplete}
                                        aria-label="Complete task"
                                        title="Complete task"
                                    >
                                        <FaCheck/>
                                    </button>
                                )}

                                <button
                                    className={styles.actionButton}
                                    onClick={handleDelete}
                                    aria-label="Delete task"
                                    title="Delete task"
                                >
                                    <FaTrash/>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {showDetails && !isEditing && (
                <div className={styles.taskDetails}>
                    <div className={styles.detailSection}>
                        <h4>Priority</h4>
                        <div className={styles.prioritySelector}>
                            {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map(priority => (
                                <button
                                    key={priority}
                                    className={`${styles.priorityButton} ${task.priority === priority ? styles.selected : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePriorityChange(priority);
                                    }}
                                    aria-pressed={task.priority === priority}
                                >
                                    <PriorityBadge priority={priority}/>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.detailSection}>
                        <h4>Status</h4>
                        <div className={styles.statusSelector}>
                            {([
                                'pending',
                                'awaiting_dependencies',
                                'decomposing',
                                'awaiting_subtasks',
                                'ready_for_execution',
                                'completed',
                                'failed',
                                'deferred'
                            ] as TaskStatus[]).map(status => (
                                <button
                                    key={status}
                                    className={`${styles.statusButton} ${task.status === status ? styles.selected : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(status);
                                    }}
                                    aria-pressed={task.status === status}
                                >
                                    <StatusBadge status={status}/>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.detailSection}>
                        <h4>Tags</h4>
                        <div className={styles.tagsContainer}>
                            {task.tags && task.tags.map((tag, index) => (
                                <span key={index} className={styles.tag}>{tag}</span>
                            ))}
                            <button className={styles.addTagButton}>
                                <FaPlus/> Add Tag
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {contextMenuPosition && (
                <TaskContextMenu
                    task={task}
                    onClose={handleCloseContextMenu}
                    onEdit={handleEditStart}
                    onClone={handleCloneTask}
                    position={contextMenuPosition}
                />
            )}
        </div>
    );
};

export default EnhancedTaskEntity;