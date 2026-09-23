'use client'

import { LayoutGridIcon, ListIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AppCard, AppInfo } from '@/components/app-card'
import { CreateAppDialog } from '@/components/create-app-dialog'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { appService } from '@/lib/services/app-service'

const DEFAULT_PAGE_SIZE = 20

export default function AppsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    const [apps, setApps] = useState<AppInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)

    useEffect(() => {
        let cancelled = false

        const fetchData = async () => {
            try {
                const response = await appService.getList({
                    search: searchQuery || undefined,
                    type: (typeFilter as 'workflow' | 'chatbot' | 'agent' | 'all') || undefined,
                    page,
                    pageSize: DEFAULT_PAGE_SIZE,
                })
                if (!cancelled) {
                    setApps(response.items)
                    setTotal(response.total)
                }
            } catch (error) {
                if (!cancelled) {
                    toast.error(error instanceof Error ? error.message : '加载应用列表失败')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchData()

        return () => {
            cancelled = true
        }
    }, [searchQuery, typeFilter, page])

    return (
        <div className="px-12 py-6">
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="搜索应用..."
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value)
                                setPage(1)
                                setLoading(true)
                            }}
                            className="pl-9 h-9"
                        />
                    </div>
                    <Select
                        value={typeFilter}
                        onValueChange={value => {
                            setTypeFilter(value)
                            setPage(1)
                            setLoading(true)
                        }}
                    >
                        <SelectTrigger className="w-32 h-9">
                            <SelectValue placeholder="全部类型" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部类型</SelectItem>
                            <SelectItem value="workflow">工作流</SelectItem>
                            <SelectItem value="chatbot">聊天助手</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'grid' | 'list')}>
                    <TabsList className="h-9">
                        <TabsTrigger value="grid" className="px-2">
                            <LayoutGridIcon size={16} />
                        </TabsTrigger>
                        <TabsTrigger value="list" className="px-2">
                            <ListIcon size={16} />
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'space-y-3'}>
                <Card
                    className="flex items-center justify-center cursor-pointer border-dashed border-2 border-muted-foreground/20 hover:border-blue-400 hover:bg-blue-50/50 transition-colors min-h-[140px]"
                    onClick={() => setCreateDialogOpen(true)}
                >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <PlusIcon size={20} />
                        </div>
                        <span className="text-sm">创建应用</span>
                    </div>
                </Card>

                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <Card key={i} className="min-h-[140px] animate-pulse bg-muted/50" />)
                    : apps.map(app => (
                          <AppCard
                              key={app.id}
                              app={app}
                              onDelete={() => {
                                  setApps(prev => prev.filter(a => a.id !== app.id))
                                  setTotal(prev => prev - 1)
                              }}
                              onAppUpdated={updated => setApps(prev => prev.map(a => (a.id === updated.id ? updated : a)))}
                          />
                      ))}
            </div>

            <CreateAppDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onAppCreated={newApp => {
                    setApps(prev => [newApp, ...prev])
                    setTotal(prev => prev + 1)
                }}
            />
        </div>
    )
}
