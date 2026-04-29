<template>
    <div v-if="isAuthenticated">
        Usuario: {{ user?.name }}
        <button @click="logout">Cerrar sesion</button>
        <br><br>
        <form @submit.prevent="createArticle">
            <h2>Crear un articulo</h2>
            <label>
                Titulo<br>
                <input v-model="newArticleTitle" type="text">
            </label>
            <br>
            <label>
                Slug <br>
                <input v-model="newArticle.slug" type="text">
            </label>
            <br>
            <label>
                Contenido <br>
                <textarea v-model="newArticle.content"></textarea>
            </label>
            <br>
            <label>
                Selecciona una categoria <br>
                <select v-model="newArticle.categories">
                    <option value="">Selecciona</option>
                    <option v-for="category in categories" :value="category.id">
                        {{ category.name }}
                    </option>
                </select><br>
                <input type="submit" value="Crear">
            </label>
        </form>
        <pre>{{ newArticleRequest }}</pre>
    </div>
    <div v-else>
        <h1>Login</h1>
        <form @submit.prevent="login">
            <input v-model="email" type="email" placeholder="Email.."/>
            <input v-model="password" type="password" placeholder="Password.."/>
            <input type="submit" value="Login"/>
        </form>
    </div>

    <h2>Listado de articulos</h2>
    <ul>
        <li v-for="article in articles" :key="article.id">
            {{ article.title }}
        </li>
    </ul>

</template>


<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import axios from 'axios'
import {CaseType, deserialize, serialize} from "jsonapi-fractal";
import slugify from "slugify";

axios.defaults.withCredentials = true
axios.defaults.withXSRFToken = true
axios.defaults.baseURL = 'http://localhost'

interface AuthUser {
    id: string;
    name: string;
}

interface Article {
    id: string;
    title: string;
}

interface Category {
    id: string;
    name: string;
}

const user = ref<AuthUser | null>(null)
const articles = ref<Article[]>([])
const categories = ref<Category[]>([])
const email = ref('fvasquez@local.com')
const password = ref('password')
const newArticle = ref({
    title: 'Nuevo articulo',
    slug: 'nuevo-articulo',
    content: 'Contenido de mi nuevo articulo',
    categories: 'laravel',
})

const isAuthenticated = computed(() => user.value !== null)

const newArticleTitle = computed({
    get() {
        newArticle.value.slug = slugify(newArticle.value.title, {
            lower: true, replacement: '-', strict: true,
        })
        return newArticle.value.title
    },
    set(value: string) {
        newArticle.value.title = value
    },
})

const newArticleRequest = computed(() => {
    const payload = {
        ...newArticle.value,
        categories: newArticle.value.categories
            ? {id: newArticle.value.categories, type: 'categories'}
            : null,
        authors: user.value?.id
            ? {id: user.value.id, type: 'authors'}
            : null,
    }
    return serialize(payload, 'articles', {relationships: ['categories', 'authors']})
})

async function fetchUser() {
    try {
        const res = await axios.get('/api/v1/user')
        user.value = res.data
    } catch {
        console.error('not logged in')
    }
}

async function fetchCategories() {
    try {
        const res = await axios.get('/api/v1/categories?fields[categories]=name')
        const raw = deserialize(res.data, {changeCase: CaseType.camelCase}) as Category[]
        categories.value = raw.map(({id, name}) => ({id, name}))
    } catch {
        console.error('there was an error')
    }
}

async function login() {
    await axios.get('/sanctum/csrf-cookie')
    try {
        await axios.post('/login', {email: email.value, password: password.value})
        await fetchUser()
    } catch (error: any) {
        console.log(error.response?.data)
    }
}

async function logout() {
    await axios.post('/logout')
    user.value = null
}

async function createArticle() {
    try {
        const response = await axios.post('/api/v1/articles', newArticleRequest.value, {
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Accept': 'application/vnd.api+json',
            },
        })
        const article = deserialize(response.data, {changeCase: CaseType.camelCase}) as Article
        articles.value.unshift(article)
    } catch (error: any) {
        console.log(error.response.data.errors)
    }
}

onMounted(async () => {
    await fetchUser()
    await fetchCategories()
    const {data} = await axios.get('/api/v1/articles?sort=-created-at&include=authors,categories')
    articles.value = deserialize(data, {changeCase: CaseType.camelCase}) as Article[]
})
</script>
