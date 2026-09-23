import { NextRequest, NextResponse } from 'next/server'

import { apiError, ErrorCode } from '@/lib/api-response'
import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/apps/[id]/workflow/executions - Get execution history
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: appId } = await params
    const userId = await getCurrentUserId()
    if (!userId) return apiError(ErrorCode.UNAUTHORIZED, '请先登录')

    const app = await prisma.app.findFirst({ where: { id: appId, userId, isDeleted: false } })
    if (!app) return apiError(ErrorCode.APP_NOT_FOUND, '应用不存在')

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const cursor = searchParams.get('cursor')

    const where = { appId }

    const executions = await prisma.workflowExecution.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: limit + 1, // Fetch one extra to determine if there are more
        ...(cursor && {
            cursor: { id: cursor },
            skip: 1, // Skip the cursor item
        }),
        select: {
            id: true,
            executionId: true,
            status: true,
            inputs: true,
            outputs: true,
            error: true,
            duration: true,
            totalTokens: true,
            startedAt: true,
            completedAt: true,
        },
    })

    const hasMore = executions.length > limit
    const results = hasMore ? executions.slice(0, limit) : executions
    const nextCursor = hasMore ? results[results.length - 1]?.id : null

    return NextResponse.json({
        success: true,
        data: { executions: results, hasMore, nextCursor },
    })
}
