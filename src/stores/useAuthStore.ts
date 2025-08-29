import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  username: string | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  username: null,
  isAuthenticated: false,
  isLoading: true,

  signIn: async (username: string, password: string) => {
    try {
      console.log('Tentando login para:', username)
      
      // Mapear username para email diretamente
      const emailMap: Record<string, string> = {
        'Nadr00J': 'companyjfb@gmail.com',
        'User2': 'user2@dailylevel.local',
        'User3': 'user3@dailylevel.local'
      }

      const email = emailMap[username]
      if (!email) {
        return { success: false, error: 'Usuário não encontrado' }
      }

      console.log('Tentando login com email:', email)
      
      // Fazer login diretamente com o email
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('Resultado do login:', { data, error })

      if (error) {
        console.error('Erro no login:', error)
        return { success: false, error: `Erro: ${error.message}` }
      }

      set({ user: data.user, username, isAuthenticated: true })
      return { success: true }
    } catch (error) {
      console.error('Erro inesperado:', error)
      return { success: false, error: 'Erro inesperado' }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, username: null, isAuthenticated: false })
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Mapear email de volta para username
        const emailMap: Record<string, string> = {
          'companyjfb@gmail.com': 'Nadr00J',
          'user2@dailylevel.local': 'User2',
          'user3@dailylevel.local': 'User3'
        }
        
        const username = emailMap[session.user.email || ''] || 'Usuário'
        set({ user: session.user, username, isAuthenticated: true })
      }
    } catch (error) {
      console.error('Erro ao inicializar auth:', error)
    } finally {
      set({ isLoading: false })
    }
  }
}))

// Listener para mudanças de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.setState((state) => {
    if (event === 'SIGNED_IN' && session?.user) {
      // Mapear email de volta para username
      const emailMap: Record<string, string> = {
        'companyjfb@gmail.com': 'Nadr00J',
        'user2@dailylevel.local': 'User2',
        'user3@dailylevel.local': 'User3'
      }
      
      const username = emailMap[session.user.email || ''] || 'Usuário'
      return { user: session.user, username, isAuthenticated: true }
    } else if (event === 'SIGNED_OUT') {
      return { user: null, username: null, isAuthenticated: false }
    }
    return state
  })
})
