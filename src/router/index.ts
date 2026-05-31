import {createRouter, createWebHistory} from 'vue-router'
import {useAuth} from '../composables/useAuth'
import LoginView from '../views/LoginView.vue'
import ArticlesView from '../views/ArticlesView.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', redirect: '/articles'},
        {path: '/login', name: 'login', component: LoginView},
        {path: '/articles', name: 'articles', component: ArticlesView, meta: {requiresAuth: true}},
    ],
})

router.beforeEach((to) => {
    const {isAuthenticated} = useAuth()
    if (to.meta.requiresAuth && !isAuthenticated.value) {
        return {name: 'login'}
    }
    if (to.name === 'login' && isAuthenticated.value) {
        return {name: 'articles'}
    }
})

export default router
