import type { WorkflowDefinition, WorkflowNode } from '../types'

/**
 * 执行图构建器
 * 负责拓扑排序和分支选择
 */
export class GraphBuilder {
    private workflow: WorkflowDefinition
    private adjacencyList: Map<string, string[]>
    private reverseAdjacencyList: Map<string, string[]>
    private inDegree: Map<string, number>
    private excludedNodes: Set<string>

    constructor(workflow: WorkflowDefinition) {
        this.workflow = workflow
        this.adjacencyList = new Map()
        this.reverseAdjacencyList = new Map()
        this.inDegree = new Map()
        this.excludedNodes = new Set()

        this.buildGraph()
    }

    /**
     * 构建图结构
     */
    private buildGraph(): void {
        // 初始化
        for (const node of this.workflow.nodes) {
            this.adjacencyList.set(node.id, [])
            this.reverseAdjacencyList.set(node.id, [])
            this.inDegree.set(node.id, 0)
        }

        // 添加边
        for (const edge of this.workflow.edges) {
            const targets = this.adjacencyList.get(edge.source) || []
            targets.push(edge.target)
            this.adjacencyList.set(edge.source, targets)

            const sources = this.reverseAdjacencyList.get(edge.target) || []
            sources.push(edge.source)
            this.reverseAdjacencyList.set(edge.target, sources)

            const degree = this.inDegree.get(edge.target) || 0
            this.inDegree.set(edge.target, degree + 1)
        }
    }

    /**
     * 获取执行顺序（拓扑排序）
     */
    getExecutionOrder(): WorkflowNode[] {
        const result: WorkflowNode[] = []
        const visited = new Set<string>()
        const queue: string[] = []

        // 创建入度副本
        const inDegreeCopy = new Map(this.inDegree)

        // 找到所有入度为0的节点（起始节点）
        for (const [nodeId, degree] of inDegreeCopy) {
            if (degree === 0 && !this.excludedNodes.has(nodeId)) {
                queue.push(nodeId)
            }
        }

        while (queue.length > 0) {
            const nodeId = queue.shift()!

            if (visited.has(nodeId) || this.excludedNodes.has(nodeId)) {
                continue
            }

            visited.add(nodeId)

            const node = this.workflow.nodes.find(n => n.id === nodeId)
            if (node) {
                result.push(node)
            }

            // 更新后继节点的入度
            const successors = this.adjacencyList.get(nodeId) || []
            for (const successor of successors) {
                if (this.excludedNodes.has(successor)) continue

                const degree = inDegreeCopy.get(successor)! - 1
                inDegreeCopy.set(successor, degree)

                if (degree === 0) {
                    queue.push(successor)
                }
            }
        }

        return result
    }

    /**
     * 选择分支（用于条件节点）
     * 排除未选中分支的所有后续节点
     */
    selectBranch(conditionNodeId: string, selectedBranchId: string): void {
        const edges = this.workflow.edges.filter(e => e.source === conditionNodeId)

        for (const edge of edges) {
            // 如果不是选中的分支，排除该分支的所有后续节点
            if (edge.sourceHandle !== selectedBranchId) {
                this.excludeSubtree(edge.target)
            }
        }
    }

    /**
     * 排除子树（递归）
     */
    private excludeSubtree(nodeId: string): void {
        if (this.excludedNodes.has(nodeId)) return

        this.excludedNodes.add(nodeId)

        const successors = this.adjacencyList.get(nodeId) || []
        for (const successor of successors) {
            // 检查是否有其他未排除的入边
            const predecessors = this.reverseAdjacencyList.get(successor) || []
            const hasActiveInEdge = predecessors.some(p => !this.excludedNodes.has(p))

            if (!hasActiveInEdge) {
                this.excludeSubtree(successor)
            }
        }
    }

    /**
     * 获取上游节点
     */
    getUpstreamNodes(nodeId: string): string[] {
        return this.reverseAdjacencyList.get(nodeId) || []
    }

    /**
     * 获取所有上游节点（递归）
     */
    getAllUpstreamNodes(nodeId: string): string[] {
        const result = new Set<string>()
        const visited = new Set<string>()

        const dfs = (id: string) => {
            if (visited.has(id)) return
            visited.add(id)

            const predecessors = this.reverseAdjacencyList.get(id) || []
            for (const pred of predecessors) {
                result.add(pred)
                dfs(pred)
            }
        }

        dfs(nodeId)
        return Array.from(result)
    }

    /**
     * 检查是否有环
     */
    hasCycle(): boolean {
        const visited = new Set<string>()
        const inStack = new Set<string>()

        const dfs = (nodeId: string): boolean => {
            if (inStack.has(nodeId)) return true
            if (visited.has(nodeId)) return false

            visited.add(nodeId)
            inStack.add(nodeId)

            const successors = this.adjacencyList.get(nodeId) || []
            for (const successor of successors) {
                if (dfs(successor)) return true
            }

            inStack.delete(nodeId)
            return false
        }

        for (const node of this.workflow.nodes) {
            if (!visited.has(node.id)) {
                if (dfs(node.id)) return true
            }
        }

        return false
    }
}

/**
 * 创建图构建器实例
 */
export function createGraphBuilder(workflow: WorkflowDefinition): GraphBuilder {
    return new GraphBuilder(workflow)
}
