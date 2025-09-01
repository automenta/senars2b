// WebSocket message types
export type WebSocketMessageType =
    | 'ADD_TASK'
    | 'UPDATE_TASK'
    | 'UPDATE_TASK_PRIORITY'
    | 'DELETE_TASK'
    | 'COMPLETE_TASK'
    | 'PAUSE_AGENT'
    | 'RESUME_AGENT'
    | 'FAIL_TASK'
    | 'REORDER_SUBTASKS'
    | 'TASK_LIST_UPDATE'
    | 'TASK_UPDATE'
    | 'TASK_DELETED'
    | 'ERROR'
    | 'WARNING'
    | 'PROMPT_NEW'
    | 'NOTIFICATION'
    | 'STATS_UPDATE';