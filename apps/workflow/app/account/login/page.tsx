'use client'

import { Lock, Mail, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface LoginFormValues {
    email: string
    password: string
    name?: string
}

export default function LoginPage() {
    const form = useForm<LoginFormValues>({
        defaultValues: {
            email: '',
            password: '',
            name: '',
        },
    })
    const [inputType, setInputType] = useState<'login' | 'register'>('login')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (values: LoginFormValues) => {
        setIsLoading(true)

        try {
            if (inputType === 'login') {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: values.email,
                        password: values.password,
                    }),
                })

                const data = await response.json()

                if (!response.ok) {
                    if (data.code === 'EMAIL_NOT_VERIFIED') {
                        toast.error('请先验证您的邮箱后再登录')
                        return
                    }
                    throw new Error(data.error || '登录失败')
                }

                toast.success('登录成功')
                const searchParams = new URLSearchParams(window.location.search)
                const redirectUrl = searchParams.get('redirect') || '/apps'
                router.push(redirectUrl)
            }

            if (inputType === 'register') {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: values.email,
                        password: values.password,
                        name: values.name || undefined,
                    }),
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || '注册失败')
                }

                toast.success('注册成功！请查收验证邮件后登录')
                setInputType('login')
                form.reset()
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '操作失败，请稍后重试')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100">
            {/* 背景装饰 */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
                <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.35]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgb(148 163 184 / 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.12) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="relative z-10 w-[420px] max-w-[calc(100vw-2rem)]">
                {/* 品牌标题 */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6 text-white"
                        >
                            <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
                            <path d="M6 13a6 6 0 0 0 12 0" />
                            <path d="M12 19v3" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">AI 应用引擎平台</h1>
                    <p className="mt-1.5 text-sm text-slate-500">智能工作流编排与知识库管理</p>
                </div>

                {/* 登录卡片 */}
                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
                    {/* 登录 / 注册 切换 */}
                    <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() => {
                                form.clearErrors()
                                form.reset()
                                setInputType('login')
                            }}
                            className={`rounded-md py-2 text-sm font-medium transition-colors ${
                                inputType === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            账号登录
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                form.clearErrors()
                                form.reset()
                                setInputType('register')
                            }}
                            className={`rounded-md py-2 text-sm font-medium transition-colors ${
                                inputType === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            注册账号
                        </button>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            {inputType === 'register' && (
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>姓名</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        {...field}
                                                        placeholder="请输入姓名（可选）"
                                                        disabled={isLoading}
                                                        className="h-10 pl-9"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={form.control}
                                rules={{
                                    required: '请输入邮箱',
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: '请输入有效的邮箱地址',
                                    },
                                }}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>邮箱</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="请输入邮箱"
                                                    disabled={isLoading}
                                                    className="h-10 pl-9"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                rules={{
                                    required: '请输入密码',
                                    minLength: inputType === 'register' ? { value: 8, message: '密码至少需要8个字符' } : undefined,
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>密码</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    {...field}
                                                    type="password"
                                                    placeholder="请输入密码"
                                                    disabled={isLoading}
                                                    className="h-10 pl-9"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="h-10 w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                                {isLoading ? '处理中...' : inputType === 'login' ? '登 录' : '注 册'}
                            </Button>
                        </form>
                    </Form>

                    {inputType === 'login' ? (
                        <div className="mt-5 text-center text-sm text-slate-500">
                            没有账号?{' '}
                            <button
                                type="button"
                                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                onClick={() => {
                                    form.clearErrors()
                                    form.reset()
                                    setInputType('register')
                                }}
                            >
                                立即注册
                            </button>
                        </div>
                    ) : (
                        <div className="mt-5 text-center text-sm text-slate-500">
                            已有账号?{' '}
                            <button
                                type="button"
                                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                onClick={() => {
                                    form.clearErrors()
                                    form.reset()
                                    setInputType('login')
                                }}
                            >
                                返回登录
                            </button>
                        </div>
                    )}
                </div>

                {/* 版权信息 */}
                <p className="mt-6 text-center text-xs text-slate-400">Copyright © {new Date().getFullYear()} ZZX · AI 应用引擎平台</p>
            </div>
        </div>
    )
}
