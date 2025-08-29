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

// Função para buscar username do banco de dados
async function getUsernameFromDatabase(userId: string): Promise<string | null> {
  try {
    console.log('Buscando username para userId:', userId)
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Erro ao buscar username:', error)
      return null
    }
    
    console.log('Username encontrado no banco:', data?.username)
    return data?.username || null
  } catch (error) {
    console.error('Erro inesperado ao buscar username:', error)
    return null
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  username: null,
  isAuthenticated: false,
  isLoading: true,

  signIn: async (username: string, password: string) => {
    try {
      console.log('Tentando login para:', username)
      
      // Buscar email do usuário na tabela profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('username', username)
        .single()
      
      if (profileError || !profile) {
        return { success: false, error: 'Usuário não encontrado' }
      }

      if (!profile.email) {
        return { success: false, error: 'Email não configurado para este usuário' }
      }

      console.log('Perfil encontrado:', profile)
      
      // Fazer login com o email do perfil
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password
      })

      console.log('Resultado do login:', { data, error })

      if (error) {
        console.error('Erro no login:', error)
        return { success: false, error: `Erro: ${error.message}` }
      }

      set({ user: data.user, username: profile.username, isAuthenticated: true })
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
      console.log('Inicializando autenticação...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Erro ao obter sessão:', error)
        set({ isLoading: false })
        return
      }
      
      console.log('Sessão obtida:', session)
      
      if (session?.user) {
        console.log('Usuário encontrado na sessão:', session.user.id)
        // Buscar username do banco de dados
        try {
          const username = await getUsernameFromDatabase(session.user.id)
          
          if (username) {
            console.log('Username encontrado:', username)
            set({ user: session.user, username, isAuthenticated: true, isLoading: false })
          } else {
            console.warn('Username não encontrado para o usuário:', session.user.id)
            set({ user: session.user, username: 'Nadr00J', isAuthenticated: true, isLoading: false })
          }
        } catch (usernameError) {
          console.error('Erro ao buscar username:', usernameError)
          set({ user: session.user, username: 'Nadr00J', isAuthenticated: true, isLoading: false })
        }
      } else {
        console.log('Nenhuma sessão ativa')
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Erro ao inicializar auth:', error)
      set({ isLoading: false })
    }
  }
}))

// Listener para mudanças de autenticação
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    // Buscar username do banco de dados
    const username = await getUsernameFromDatabase(session.user.id)
    
    useAuthStore.setState({
      user: session.user,
      username: username || 'Nadr00J',
      isAuthenticated: true
    })
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      username: null,
      isAuthenticated: false
    })
  }
})
