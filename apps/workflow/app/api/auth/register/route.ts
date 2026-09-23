import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiSuccess, ErrorCode, handleApiError } from '@/lib/api-response'
import { generateVerifyToken, sendVerifyEmail } from '@/lib/email'
import { hashPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'

const registerSchema = z.object({
    email: z.email('请输入有效的邮箱地址'),
    password: z.string().min(8, '密码至少需要8个字符'),
    name: z.string().min(1, '请输入姓名').optional(),
})

type RegisterRequest = z.infer<typeof registerSchema>

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // 验证输入
        const result = registerSchema.safeParse(body)
        if (!result.success) {
            return apiError(ErrorCode.VALIDATION_ERROR, result.error.issues[0].message)
        }

        const { email, password, name } = result.data

        // 检查邮箱是否已存在
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return apiError(ErrorCode.EMAIL_ALREADY_EXISTS)
        }

        // 加密密码
        const hashedPassword = await hashPassword(password)

        // 生成验证令牌
        const verifyToken = generateVerifyToken()

        // 创建用户
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
                verifyToken,
            },
            select: {
                id: true,
                email: true,
                name: true,
            },
        })

        // 发送验证邮件
        await sendVerifyEmail(email, verifyToken)

        return apiSuccess({ userId: user.id }, '注册成功，请查收验证邮件')
    } catch (error) {
        return handleApiError(error)
    }
}
