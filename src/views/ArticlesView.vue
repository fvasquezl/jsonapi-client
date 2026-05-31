<template>
    <div class="page">
        <header class="bar">
            <span>Usuario: <strong>{{ user?.name }}</strong></span>
            <button @click="onLogout">Cerrar sesión</button>
        </header>

        <form class="card" @submit.prevent="saveArticle">
            <h2>{{ editingId ? 'Editar' : 'Crear' }} un artículo</h2>
            <label>
                Título
                <input v-model="articleTitle" type="text">
            </label>
            <label>
                Slug
                <input v-model="form.slug" type="text">
            </label>
            <label>
                Contenido
                <textarea v-model="form.content"></textarea>
            </label>
            <label>
                Categoría
                <select v-model="form.categories">
                    <option value="">Selecciona</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.name }}
                    </option>
                </select>
            </label>
            <div class="actions">
                <button type="submit">{{ editingId ? 'Actualizar' : 'Crear' }}</button>
                <button v-if="editingId" type="button" @click="cancelEdit">Cancelar</button>
            </div>
        </form>

        <section>
            <div class="list-head">
                <h2>Listado de artículos</h2>
                <span v-if="page" class="count">{{ page.total }} artículos</span>
            </div>

            <article v-for="article in articles" :key="article.id" class="card">
                <div class="list-head">
                    <h3>{{ article.title }}</h3>
                    <div class="actions">
                        <button @click="editArticle(article)">Editar</button>
                        <button @click="deleteArticle(article)">Borrar</button>
                    </div>
                </div>
                <p>{{ article.content }}</p>

                <h4>Comentarios</h4>
                <ul class="comments">
                    <li v-for="comment in article.comments" :key="comment.id">
                        <strong>{{ comment.author?.name ?? 'Anónimo' }}:</strong> {{ comment.body }}
                    </li>
                    <li v-if="!article.comments?.length" class="muted">Sin comentarios.</li>
                </ul>

                <form class="comment-form" @submit.prevent="addComment(article)">
                    <textarea
                        v-model="commentDrafts[article.id]"
                        placeholder="Escribe un comentario.."
                    ></textarea>
                    <button type="submit">Comentar</button>
                </form>
            </article>

            <nav v-if="page && page.lastPage > 1" class="pager">
                <button :disabled="page.currentPage <= 1" @click="loadArticles(page.currentPage - 1)">
                    ← Anterior
                </button>
                <span>Página {{ page.currentPage }} de {{ page.lastPage }}</span>
                <button :disabled="page.currentPage >= page.lastPage" @click="loadArticles(page.currentPage + 1)">
                    Siguiente →
                </button>
            </nav>
        </section>
    </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import axios from 'axios'
import {CaseType, deserialize, serialize} from 'jsonapi-fractal'
import slugify from 'slugify'
import {useAuth} from '../composables/useAuth'
import type {Article, Category, Comment, PageMeta} from '../types'

const router = useRouter()
const {user, ensureUser, logout} = useAuth()

const PAGE_SIZE = 5
const INCLUDE = 'authors,categories,comments,comments.author'

const jsonApiHeaders = {
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
}

const articles = ref<Article[]>([])
const categories = ref<Category[]>([])
const page = ref<PageMeta | null>(null)

const emptyArticle = () => ({title: '', slug: '', content: '', categories: ''})
const form = ref(emptyArticle())
const editingId = ref<string | null>(null)
const commentDrafts = ref<Record<string, string>>({})

// El slug sigue al título (al crear y al editar).
const articleTitle = computed({
    get: () => form.value.title,
    set(value: string) {
        form.value.title = value
        form.value.slug = slugify(value, {lower: true, replacement: '-', strict: true})
    },
})

const articleRequest = computed(() => serialize(
    {
        ...(editingId.value ? {id: editingId.value} : {}),
        ...form.value,
        categories: form.value.categories
            ? {id: form.value.categories, type: 'categories'}
            : null,
        authors: user.value?.id ? {id: user.value.id, type: 'authors'} : null,
    },
    'articles',
    {relationships: ['categories', 'authors']},
))

async function loadArticles(pageNumber = 1) {
    try {
        const {data} = await axios.get(
            `/articles?page%5Bnumber%5D=${pageNumber}&page%5Bsize%5D=${PAGE_SIZE}&sort=-createdAt&include=${INCLUDE}`,
        )
        articles.value = deserialize(data, {changeCase: CaseType.camelCase}) as Article[]
        page.value = data.meta?.page ?? null
    } catch (error: any) {
        console.error('no se pudo cargar el listado de articulos', error.response?.data ?? error)
    }
}

async function fetchCategories() {
    try {
        const res = await axios.get('/categories?fields[categories]=name')
        const raw = deserialize(res.data, {changeCase: CaseType.camelCase}) as Category[]
        categories.value = raw.map(({id, name}) => ({id, name}))
    } catch {
        console.error('no se pudieron cargar las categorias')
    }
}

async function saveArticle() {
    try {
        if (editingId.value) {
            // El id del recurso es el slug y puede cambiar al editar el título,
            // así que localizamos por el id original antes de reemplazar.
            const originalId = editingId.value
            const response = await axios.patch(
                `/articles/${originalId}?include=authors,categories`,
                articleRequest.value,
                {headers: jsonApiHeaders},
            )
            const updated = deserialize(response.data, {changeCase: CaseType.camelCase}) as Article
            const index = articles.value.findIndex(a => a.id === originalId)
            if (index !== -1) {
                // El PATCH no trae comments; conservamos los ya cargados.
                updated.comments = articles.value[index].comments ?? []
                articles.value[index] = updated
            }
            cancelEdit()
        } else {
            await axios.post(`/articles?include=authors,categories`, articleRequest.value, {headers: jsonApiHeaders})
            cancelEdit()
            // Con sort=-createdAt el nuevo artículo cae en la primera página.
            await loadArticles(1)
        }
    } catch (error: any) {
        console.log(error.response?.data?.errors ?? error.response?.data)
    }
}

function editArticle(article: Article) {
    editingId.value = article.id
    form.value = {
        title: article.title,
        slug: article.slug,
        content: article.content,
        categories: article.categories?.id ?? '',
    }
}

function cancelEdit() {
    editingId.value = null
    form.value = emptyArticle()
}

async function deleteArticle(article: Article) {
    if (!confirm(`¿Borrar el articulo "${article.title}"?`)) return
    try {
        await axios.delete(`/articles/${article.id}`, {headers: jsonApiHeaders})
        if (editingId.value === article.id) cancelEdit()
        // Si la página queda vacía tras borrar, retrocedemos una.
        const current = page.value?.currentPage ?? 1
        const target = articles.value.length === 1 && current > 1 ? current - 1 : current
        await loadArticles(target)
    } catch (error: any) {
        console.log(error.response?.data)
    }
}

async function addComment(article: Article) {
    const body = (commentDrafts.value[article.id] ?? '').trim()
    if (!body || !user.value?.id) return
    try {
        // El API exige ownership: el author declarado debe ser el usuario autenticado.
        // El nombre del relationship es singular (author/article) pero el tipo de
        // recurso es plural; el mapa fija ese tipo.
        const payload = serialize(
            {body, author: {id: user.value.id}, article: {id: article.id}},
            'comments',
            {relationships: {author: 'authors', article: 'articles'}},
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

async function onLogout() {
    await logout()
    await router.push({name: 'login'})
}

onMounted(async () => {
    await ensureUser()
    await Promise.all([fetchCategories(), loadArticles(1)])
})
</script>

<style scoped>
.page {
    max-width: 720px;
    margin: 0 auto;
}

.bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
}

.card label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.list-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.actions {
    display: flex;
    gap: 0.5rem;
}

.comments {
    margin: 0;
    padding-left: 1rem;
}

.comment-form {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
}

.comment-form textarea {
    flex: 1;
}

.pager {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
}

.muted {
    color: #888;
}

.count {
    color: #888;
    font-size: 0.9rem;
}
</style>
