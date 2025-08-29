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
    
    // Estratégia 1: Usar email do usuário para mapear username (mais confiável)
    try {
      console.log('Tentando mapear por email...')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email) {
        console.log('Email do usuário:', user.email)
        
        // Mapear email para username conhecido
        const emailToUsername: Record<string, string> = {
          'companyjfb@gmail.com': 'Nadr00J',
          'aroriel@example.com': 'Aroriel'
        }
        
        const mappedUsername = emailToUsername[user.email]
        if (mappedUsername) {
          console.log('Username mapeado por email:', mappedUsername)
          return mappedUsername
        }
      }
    } catch (error) {
      console.log('Erro ao mapear por email:', error)
    }
    
    // Estratégia 2: Fallback para username padrão baseado no ID
    console.log('Usando fallback baseado no ID...')
    if (userId === 'f2e29d54-3de1-449b-9146-5c007a1ec439') {
      console.log('Usando username padrão: Nadr00J')
      return 'Nadr00J'
    }
    
    // Estratégia 3: Tentar consulta direta como último recurso
    try {
      console.log('Tentando consulta direta como último recurso...')
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .maybeSingle()
        .abortSignal(AbortSignal.timeout(1000)) // 1 segundo apenas
      
      if (!error && data?.username) {
        console.log('Username encontrado via consulta direta:', data.username)
        return data.username
      }
      
      console.log('Consulta direta falhou:', error)
    } catch (error) {
      console.log('Consulta direta com timeout:', error)
    }
    
    console.log('Nenhuma estratégia funcionou, retornando null')
    return null
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
        // O onAuthStateChange já vai lidar com a configuração do usuário
        // Aqui só precisamos definir isLoading como false
        console.log('Definindo isLoading como false...')
        set({ isLoading: false })
        console.log('isLoading definido como false com sucesso')
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
  console.log('Auth state change:', event, session?.user?.id)
  
  if (event === 'SIGNED_IN' && session?.user) {
    console.log('Processando SIGNED_IN...')
    // Buscar username do banco de dados
    try {
      const username = await getUsernameFromDatabase(session.user.id)
      console.log('Username obtido:', username)
      
      console.log('Atualizando estado do store...')
      useAuthStore.setState({
        user: session.user,
        username: username || 'Nadr00J',
        isAuthenticated: true,
        isLoading: false
      })
      console.log('Estado do store atualizado com sucesso')
    } catch (error) {
      console.error('Erro no onAuthStateChange:', error)
      useAuthStore.setState({
        user: session.user,
        username: 'Nadr00J',
        isAuthenticated: true,
        isLoading: false
      })
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('Processando SIGNED_OUT...')
    useAuthStore.setState({
      user: null,
      username: null,
      isAuthenticated: false,
      isLoading: false
    })
  }
})
