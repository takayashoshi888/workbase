import { createClient } from '@supabase/supabase-js'

// 配置Supabase连接（需要替换为你的实际配置）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// 数据库表结构常量
export const TABLES = {
  USERS: 'users',
  FINANCE: 'finance_records',
  TODO: 'todos',
  GOALS: 'goals',
  NOTES: 'notes',
  FILES: 'files'
}

// 财务分类常量
export const FINANCE_CATEGORIES = {
  INCOME: ['工资', '奖金', '投资', '其他收入'],
  EXPENSE: ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '住房', '其他支出']
}