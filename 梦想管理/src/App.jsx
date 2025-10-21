import React, { useState, useEffect } from 'react'
import { Calendar, DollarSign, Target, FileText, Cloud, Menu, X, User } from 'lucide-react'
import FinanceModule from './components/FinanceModule'
import TodoModule from './components/TodoModule'
import GoalsModule from './components/GoalsModule'
import NotesModule from './components/NotesModule'
import CloudModule from './components/CloudModule'
import Auth from './components/Auth'
import { useUserData } from './hooks/useSupabase'

const modules = [
  { id: 'finance', name: '财务统计', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
  { id: 'todo', name: '日程待办', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'goals', name: '目标管理', icon: Target, color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 'notes', name: '随心记', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100' },
  { id: 'cloud', name: '个人云盘', icon: Cloud, color: 'text-gray-600', bg: 'bg-gray-100' }
]

function App() {
  const [activeModule, setActiveModule] = useState('todo')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const currentUser = useUserData()

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser)
    }
  }, [currentUser])

  const handleAuthSuccess = (userData) => {
    setUser(userData)
  }

  const renderModule = () => {
    if (!user) {
      return <Auth onAuthSuccess={handleAuthSuccess} />
    }

    switch (activeModule) {
      case 'finance': return <FinanceModule user={user} />
      case 'todo': return <TodoModule user={user} />
      case 'goals': return <GoalsModule user={user} />
      case 'notes': return <NotesModule user={user} />
      case 'cloud': return <CloudModule user={user} />
      default: return <TodoModule user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端侧边栏按钮 */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white shadow-md"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex">
        {/* 侧边栏 */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-8">梦想管理</h1>
            
            {/* 用户信息 */}
            {user && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{user.user_metadata?.username || user.email}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                </div>
              </div>
            )}
            
            <nav className="space-y-2">
              {user ? (
                modules.map((module) => {
                  const Icon = module.icon
                  return (
                    <button
                      key={module.id}
                      onClick={() => {
                        setActiveModule(module.id)
                        setSidebarOpen(false)
                      }}
                      className={`
                        w-full flex items-center space-x-3 p-3 rounded-lg transition-colors
                        ${activeModule === module.id 
                          ? 'bg-primary text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{module.name}</span>
                    </button>
                  )
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  请先登录以使用功能模块
                </div>
              )}
            </nav>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 lg:ml-0 min-h-screen">
          <main className="p-6">
            {/* 模块标题 */}
            <div className="mb-6">
              {modules
                .filter(m => m.id === activeModule)
                .map((module) => {
                  const Icon = module.icon
                  return (
                    <div key={module.id} className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${module.bg}`}>
                        <Icon className={module.color} size={24} />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">{module.name}</h2>
                    </div>
                  )
                })}
            </div>

            {/* 模块内容 */}
            {renderModule()}
          </main>
        </div>
      </div>
    </div>
  )
}

export default App