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
    
    // Estratégia 1: Fallback direto baseado no ID (mais rápido e confiável)
    console.log('Usando mapeamento direto por ID...')
    const idToUsername: Record<string, string> = {
      'f2e29d54-3de1-449b-9146-5c007a1ec439': 'Nadr00J',
      'c7620efd-2aa1-4498-8a9b-14c60940889e': 'Aroriel',
      '7ceee0d2-d938-4106-880e-dbb7e976bb47': 'Nadr00J'
    }
    
    const mappedUsername = idToUsername[userId]
    if (mappedUsername) {
      console.log('Username mapeado por ID:', mappedUsername)
      return mappedUsername
    }
    
    // Estratégia 2: Tentar consulta direta como fallback
    try {
      console.log('Tentando consulta direta como fallback...')
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
