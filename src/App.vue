<template>
    <div v-if="isAuthenticated">
        Usuario: {{ user?.name }}
        <button @click="logout">Cerrar sesion</button>
        <br><br>
        <form @submit.prevent="saveArticle">
            <h2>{{ editingId ? 'Editar' : 'Crear' }} un articulo</h2>
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
                <input type="submit" :value="editingId ? 'Actualizar' : 'Crear'">
                <button v-if="editingId" type="button" @click="cancelEdit">Cancelar</button>
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
            <template v-if="isAuthenticated">
                <button @click="editArticle(article)">Editar</button>
                <button @click="deleteArticle(article)">Borrar</button>
            </template>

            <h4>Comentarios</h4>
            <ul>
                <li v-for="comment in article.comments" :key="comment.id">
                    <strong>{{ comment.author?.name ?? 'Anonimo' }}:</strong>
                    {{ comment.body }}
                </li>
                <li v-if="!article.comments?.length">Sin comentarios.</li>
            </ul>

            <form v-if="isAuthenticated" @submit.prevent="addComment(article)">
                <textarea
                    v-model="commentDrafts[article.id]"
                    placeholder="Escribe un comentario.."
                ></textarea>
                <br>
                <input type="submit" value="Comentar">
            </form>
        </li>
    </ul>

</template>


<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import axios from 'axios'
import {CaseType, deserialize, serialize} from "jsonapi-fractal";
import slugify from "slugify";

axios.defaults.baseURL = 'http://localhost/api/v2'

const TOKEN_KEY = 'api_token'

// V2 emite tokens solo-lectura por defecto; pedimos los scopes que necesita el cliente.
const API_SCOPES = [
    'read',
    'articles:store', 'articles:update', 'articles:delete',
    'comments:store',
]

function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
    delete axios.defaults.headers.common['Authorization']
}

interface AuthUser {
    id: string;
    name: string;
}

interface Comment {
    id: string;
    body: string;
    createdAt?: string;
    author?: { id: string; name?: string } | null;
}

interface Article {
    id: string;
    title: string;
    slug: string;
    content: string;
    categories?: { id: string; name?: string } | null;
    authors?: { id: string; name?: string } | null;
    comments?: Comment[];
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
const emptyArticle = () => ({
    title: '',
    slug: '',
    content: '',
    categories: '',
})

const newArticle = ref(emptyArticle())
const editingId = ref<string | null>(null)

// Borrador de comentario por artículo (clave = id del artículo).
const commentDrafts = ref<Record<string, string>>({})

const isAuthenticated = computed(() => user.value !== null)

const newArticleTitle = computed({
    get() {
        return newArticle.value.title
    },
    set(value: string) {
        newArticle.value.title = value
        // Al crear, el slug sigue al título; al editar se deja independiente.
        if (!editingId.value) {
            newArticle.value.slug = slugify(value, {
                lower: true, replacement: '-', strict: true,
            })
        }
    },
})

const newArticleRequest = computed(() => {
    const payload = {
        ...(editingId.value ? {id: editingId.value} : {}),
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
        const res = await axios.get('/user')
        user.value = res.data
    } catch {
        console.error('not logged in')
    }
}

async function fetchCategories() {
    try {
        const res = await axios.get('/categories?fields[categories]=name')
        const raw = deserialize(res.data, {changeCase: CaseType.camelCase}) as Category[]
        categories.value = raw.map(({id, name}) => ({id, name}))
    } catch {
        console.error('there was an error')
    }
}

async function login() {
    try {
        const res = await axios.post('/login', {
            email: email.value,
            password: password.value,
            scopes: API_SCOPES,
        })
        setToken(res.data.token)
        user.value = res.data.user
    } catch (error: any) {
        console.log(error.response?.data)
    }
}

async function logout() {
    try {
        await axios.post('/logout')
    } finally {
        clearToken()
        user.value = null
    }
}

const jsonApiHeaders = {
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
}

async function saveArticle() {
    try {
        if (editingId.value) {
            // El id del recurso es el slug y puede cambiar al editar el título,
            // así que localizamos por el id original antes de reemplazar.
            const originalId = editingId.value
            const response = await axios.patch(
                `/articles/${originalId}?include=authors,categories`,
                newArticleRequest.value,
                {headers: jsonApiHeaders},
            )
            const updated = deserialize(response.data, {changeCase: CaseType.camelCase}) as Article
            const index = articles.value.findIndex(a => a.id === originalId)
            if (index !== -1) {
                // El PATCH no trae comments; conservamos los ya cargados.
                updated.comments = articles.value[index].comments ?? []
                articles.value[index] = updated
            }
        } else {
            const response = await axios.post('/articles?include=authors,categories', newArticleRequest.value, {
                headers: jsonApiHeaders,
            })
            const article = deserialize(response.data, {changeCase: CaseType.camelCase}) as Article
            articles.value.unshift(article)
        }
        cancelEdit()
    } catch (error: any) {
        console.log(error.response?.data.errors)
    }
}

function editArticle(article: Article) {
    editingId.value = article.id
    newArticle.value = {
        title: article.title,
        slug: article.slug,
        content: article.content,
        categories: article.categories?.id ?? '',
    }
}

function cancelEdit() {
    editingId.value = null
    newArticle.value = emptyArticle()
}

async function deleteArticle(article: Article) {
    if (!confirm(`¿Borrar el articulo "${article.title}"?`)) return
    try {
        await axios.delete(`/articles/${article.id}`, {headers: jsonApiHeaders})
        articles.value = articles.value.filter(a => a.id !== article.id)
        if (editingId.value === article.id) cancelEdit()
    } catch (error: any) {
        console.log(error.response?.data)
    }
}

async function addComment(article: Article) {
    const body = (commentDrafts.value[article.id] ?? '').trim()
    if (!body || !user.value?.id) return
    try {
        // El API exige ownership: el author declarado debe ser el usuario autenticado.
        const payload = serialize(
            {
                body,
                author: {id: user.value.id, type: 'authors'},
                article: {id: article.id, type: 'articles'},
            },
            'comments',
            {relationships: ['author', 'article']},
        )
        const response = await axios.post('/comments?include=author', payload, {headers: jsonApiHeaders})
        const comment = deserialize(response.data, {changeCase: CaseType.camelCase}) as Comment
        if (!article.comments) article.comments = []
        article.comments.push(comment)
        commentDrafts.value[article.id] = ''
    } catch (error: any) {
        console.log(error.response?.data?.errors ?? error.response?.data)
    }
}

onMounted(async () => {
    const saved = localStorage.getItem(TOKEN_KEY)
    if (saved) {
        setToken(saved)
        await fetchUser()
    }
    await fetchCategories()
    try {
        const {data} = await axios.get('/articles?sort=-createdAt&include=authors,categories,comments,comments.author')
        articles.value = deserialize(data, {changeCase: CaseType.camelCase}) as Article[]
    } catch (error: any) {
        console.error('no se pudo cargar el listado de articulos', error.response?.data ?? error)
    }
})
</script>
