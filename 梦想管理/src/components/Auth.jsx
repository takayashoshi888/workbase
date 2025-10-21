import React, { useState, useEffect } from 'react'
import { supabase, TABLES } from '../lib/supabase'
import { LogIn, UserPlus, Mail, Lock, User } from 'lucide-react'

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  })

  useEffect(() => {
    // 检查当前登录状态
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        onAuthSuccess(user)
      }
    }
    checkUser()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        onAuthSuccess(session.user)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [onAuthSuccess])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // 登录
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })
        
        if (error) throw error
        
      } else {
        // 注册
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username
            }
          }
        })
        
        if (error) throw error
        
        if (data.user) {
          // 创建用户配置
          const { error: profileError } = await supabase
            .from(TABLES.USERS)
            .insert([
              {
                id: data.user.id,
                email: formData.email,
                username: formData.username,
                created_at: new Date().toISOString()
              }
            ])
          
          if (profileError) console.error('创建用户配置失败:', profileError)
        }
      }
    } catch (error) {
      alert(`认证失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (user) {
    return (
      <div className="card text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <User className="text-primary" size={24} />
          <div>
            <div className="font-semibold">{user.user_metadata?.username || user.email}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
        <button 
          onClick={handleSignOut}
          className="w-full btn-primary"
        >
          退出登录
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="card">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isLogin ? '欢迎回来' : '创建账户'}
          </h2>
          <p className="text-gray-600">
            {isLogin ? '登录你的账户继续使用' : '注册新账户开始使用梦想管理'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">邮箱地址</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="password"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                required
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                {isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}
                <span>{isLogin ? '登录' : '注册'}</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin ? '没有账户？立即注册' : '已有账户？立即登录'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Auth