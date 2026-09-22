import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { Request, Response } from 'express'

import { ApiKeyGuard } from '../../common/guards/api-key.guard'
import { RunWorkflowDto, WorkflowExecutionResultDto } from './dto/run-workflow.dto'
import { type ExecutionContext, type SSEEvent, WorkflowService } from './workflow.service'

@Controller('v1/apps')
@UseGuards(ApiKeyGuard)
export class WorkflowController {
    constructor(private readonly workflowService: WorkflowService) {}

    /**
     * 运行工作流
     * POST /api/v1/apps/run
     *
     * 通过 API Key 鉴权后，自动获取对应的应用信息并执行工作流
     * 支持两种模式：
     * - stream=false（默认）：同步返回执行结果
     * - stream=true：SSE 流式返回执行过程
     */
    @Post('run')
    async runWorkflow(
        @Body() dto: RunWorkflowDto,
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response
    ): Promise<WorkflowExecutionResultDto | void> {
        // 构建执行上下文
        const context: ExecutionContext = {
            appId: request.appContext!.id,
            activePublishedId: request.appContext!.activePublishedId,
            apiKeyId: request.apiKeyContext!.id,
        }

        // 流式模式：SSE 响应
        if (dto.stream) {
            // 设置 SSE 响应头
            response.setHeader('Content-Type', 'text/event-stream')
            response.setHeader('Cache-Control', 'no-cache')
            response.setHeader('Connection', 'keep-alive')
            response.setHeader('X-Accel-Buffering', 'no') // 禁用 nginx 缓冲
            response.flushHeaders()

            // SSE 事件发送函数
            const sendEvent = (event: SSEEvent) => {
                response.write(`event: ${event.type}\n`)
                response.write(`data: ${JSON.stringify(event.data)}\n\n`)
            }

            // 执行工作流并流式返回
            await this.workflowService.runWorkflowStream(context, dto, sendEvent)

            // 结束 SSE 连接
            response.end()
            return
        }

        // 同步模式：直接返回结果
        return this.workflowService.runWorkflow(context, dto)
    }
}
