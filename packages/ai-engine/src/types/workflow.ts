/**
 * 节点类型枚举
 */
export type NodeKind = 'start' | 'llm' | 'http' | 'condition' | 'end' | 'knowledge'

/**
 * 工作流节点定义
 */
export interface WorkflowNode {
    id: string
    type: NodeKind
    data: {
        label?: string
        config?: Record<string, unknown>
    }
}

/**
 * 工作流边定义
 */
export interface WorkflowEdge {
    id: string
    source: string
    sourceHandle?: string // 用于条件节点的多输出句柄
    target: string
}

/**
 * 工作流定义
 */
export interface WorkflowDefinition {
    id: string
    name: string
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
}

/**
 * 工作流执行输入
 */
export type WorkflowInput = Record<string, unknown>

/**
 * 验证结果
 */
export interface ValidationResult {
    valid: boolean
    errors?: string[]
}

/**
 * 工作流执行结果
 */
export interface WorkflowResult {
    success: boolean
    outputs: Record<string, unknown>
    error?: Error
    executionId: string
    duration: number
    logs: import('./logger').ExecutionLogEntry[]
}

/**
 * 工作流执行选项（用于实时回调）
 */
export interface ExecuteOptions {
    /** 节点开始执行回调 */
    onNodeStart?: (nodeId: string, nodeType: NodeKind, nodeName: string) => void
    /** 节点执行完成回调 */
    onNodeEnd?: (nodeId: string, result: import('./logger').NodeExecutionResult) => void
    /** 日志记录回调 */
    onLog?: (entry: import('./logger').ExecutionLogEntry) => void
}
