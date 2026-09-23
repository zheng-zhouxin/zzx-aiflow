/* eslint-disable no-console */

import { readFileSync } from 'fs'
import Handlebars from 'handlebars'
import nodemailer from 'nodemailer'
import { join } from 'path'

// ============================================================
// 配置常量
// ============================================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const YEAR = new Date().getFullYear()

/**
 * SMTP 配置
 */
const SMTP_CONFIG = {
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    auth: {
        user: 'zheng_zhouxin@163.com',
        pass: process.env.SMTP_PASSWORD || 'GRwVB3Bs6Dz9ugzX',
    },
} as const

/**
 * 发件人配置
 */
const FROM_CONFIG = {
    name: 'AI 工作流',
    address: 'zheng_zhouxin@163.com',
} as const

/**
 * 收件人配置（开发环境重定向）
 */
const TO_OVERRIDE = process.env.NODE_ENV === 'development' ? process.env.EMAIL_OVERRIDE_TO || 'zheng_zhouxin@163.com' : null
// const TO_OVERRIDE = process.env.NODE_ENV === 'development' ? process.env.EMAIL_OVERRIDE_TO || 'zheng_zhouxin@163.com' : null

// ============================================================
// 类型定义
// ============================================================

/**
 * 邮件发送选项
 */
export interface SendEmailOptions {
    to: string
    subject: string
    html: string
}

/**
 * 邮件模板上下文
 */
export interface TemplateContext {
    [key: string]: unknown
}

/**
 * 邮箱验证模板上下文
 */
export interface VerifyEmailContext extends TemplateContext {
    verifyUrl: string
    email: string
}

// ============================================================
// 模板管理
// ============================================================

/**
 * 模板缓存
 */
const templateCache = new Map<string, HandlebarsTemplateDelegate>()

/**
 * 加载并编译 Handlebars 模板
 */
function loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    // 检查缓存
    if (templateCache.has(templateName)) {
        return templateCache.get(templateName)!
    }

    try {
        const templatePath = join(process.cwd(), 'lib', 'email', 'templates', `${templateName}.hbs`)
        const templateContent = readFileSync(templatePath, 'utf-8')
        const template = Handlebars.compile(templateContent)

        // 缓存模板
        templateCache.set(templateName, template)
        return template
    } catch (error) {
        console.error(`Failed to load template: ${templateName}`, error)
        throw new Error(`模板加载失败: ${templateName}`)
    }
}

/**
 * 渲染布局模板
 */
function renderLayout(content: string, subject: string): string {
    const layoutTemplate = loadTemplate('layout')
    return layoutTemplate({ content, subject, year: YEAR })
}

/**
 * 渲染邮件模板
 */
function renderTemplate(templateName: string, context: TemplateContext): string {
    const template = loadTemplate(templateName)
    return template(context)
}

// ============================================================
// 邮件发送器
// ============================================================

/**
 * 创建 nodemailer 传输器
 */
function createTransporter() {
    return nodemailer.createTransport(SMTP_CONFIG)
}

/**
 * 发送邮件
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    const transporter = createTransporter()

    // 开发环境：重定向到指定邮箱
    const to = TO_OVERRIDE || options.to

    const mailOptions = {
        from: `${FROM_CONFIG.name} <${FROM_CONFIG.address}>`,
        to,
        subject: options.subject,
        html: options.html,
    }

    try {
        const info = await transporter.sendMail(mailOptions)

        console.log('========== EMAIL SENT ==========')
        console.log(`To: ${options.to}${TO_OVERRIDE ? ` -> ${to}` : ''}`)
        console.log(`Subject: ${options.subject}`)
        console.log(`MessageId: ${info.messageId}`)
        console.log('===============================')

        return true
    } catch (error) {
        console.error('Email send failed:', error)
        throw new Error('邮件发送失败')
    }
}

/**
 * 发送模板邮件
 */
export async function sendTemplateEmail<T extends TemplateContext>(
    to: string,
    subject: string,
    templateName: string,
    context: T
): Promise<boolean> {
    const content = renderTemplate(templateName, context)
    const html = renderLayout(content, subject)
    return sendEmail({ to, subject, html })
}

// ============================================================
// 预定义邮件类型
// ============================================================

/**
 * 生成邮箱验证邮件内容
 */
export function generateVerifyEmail(email: string, verifyToken: string): SendEmailOptions {
    const verifyUrl = `${APP_URL}/account/verify?token=${verifyToken}`

    const content = renderTemplate('verify-email', { verifyUrl, email })
    const html = renderLayout(content, '验证您的邮箱')

    return {
        to: email,
        subject: '验证您的邮箱 - AI 工作流',
        html,
    }
}

/**
 * 发送验证邮件
 */
export async function sendVerifyEmail(email: string, verifyToken: string): Promise<boolean> {
    const emailOptions = generateVerifyEmail(email, verifyToken)
    return sendEmail(emailOptions)
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 生成验证令牌
 */
export function generateVerifyToken(): string {
    return crypto.randomUUID()
}

/**
 * 生成验证链接
 */
export function generateVerifyUrl(token: string): string {
    return `${APP_URL}/account/verify?token=${token}`
}
