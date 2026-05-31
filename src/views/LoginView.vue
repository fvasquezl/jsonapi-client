<template>
    <div class="login">
        <h1>Iniciar sesión</h1>
        <form @submit.prevent="onSubmit">
            <input v-model="email" type="email" placeholder="Email.." autocomplete="username"/>
            <input v-model="password" type="password" placeholder="Password.." autocomplete="current-password"/>
            <button type="submit" :disabled="loading">{{ loading ? 'Entrando…' : 'Login' }}</button>
        </form>
        <p v-if="error" class="error">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {useAuth} from '../composables/useAuth'

const router = useRouter()
const {login} = useAuth()

const email = ref('fvasquez@local.com')
const password = ref('password')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
    error.value = ''
    loading.value = true
    try {
        await login(email.value, password.value)
        await router.push({name: 'articles'})
    } catch (err: any) {
        error.value = err.response?.data?.message ?? 'Credenciales inválidas'
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.login {
    max-width: 320px;
    margin: 4rem auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.login form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.error {
    color: #c0392b;
}
</style>
