import {ref, computed} from 'vue'
import axios from 'axios'
import type {AuthUser} from '../types'

axios.defaults.baseURL = 'http://localhost/api/v2'

const TOKEN_KEY = 'api_token'

// V2 emite tokens solo-lectura por defecto; pedimos los scopes que necesita el cliente.
const API_SCOPES = [
    'read',
    'articles:store', 'articles:update', 'articles:delete',
    'comments:store',
]

// Estado a nivel de módulo => singleton compartido entre vistas, router guard y recargas.
const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
const user = ref<AuthUser | null>(null)

if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
}

function setToken(value: string): void {
    token.value = value
    localStorage.setItem(TOKEN_KEY, value)
    axios.defaults.headers.common['Authorization'] = `Bearer ${value}`
}

function clearToken(): void {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    delete axios.defaults.headers.common['Authorization']
}

async function fetchUser(): Promise<void> {
    const res = await axios.get('/user')
    user.value = res.data
}

export function useAuth() {
    const isAuthenticated = computed(() => token.value !== null)

    async function login(email: string, password: string): Promise<void> {
        const res = await axios.post('/login', {email, password, scopes: API_SCOPES})
        setToken(res.data.token)
        user.value = res.data.user
    }

    async function logout(): Promise<void> {
        try {
            await axios.post('/logout')
        } finally {
            clearToken()
        }
    }

    // Tras recargar hay token pero aún no usuario; lo cargamos una sola vez.
    // Si el token es inválido, lo limpiamos para forzar un nuevo login.
    async function ensureUser(): Promise<void> {
        if (!token.value || user.value) return
        try {
            await fetchUser()
        } catch {
            clearToken()
        }
    }

    return {token, user, isAuthenticated, login, logout, ensureUser}
}
