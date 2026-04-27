<script lang="ts">
import {CaseType, deserialize} from 'jsonapi-fractal'

export default {
  data: () => ({
    articles: [] as unknown[],
    email: 'fvasquez@local.com',
    password: 'password',
  }),
  created() {
    fetch('http://localhost/api/v1/articles?include=authors,categories')
        .then(res => res.json())
        .then(data => {
          this.articles = deserialize(data, {changeCase: CaseType.camelCase}) as unknown[]
        })
  },
  methods: {
    login() {
      alert(`${this.email} ${this.password}`)
    }
  }
}
</script>

<template>
  <h1>Login</h1>
  <form @submit.prevent="login">
    <input v-model="email" type="email" placeholder="Email.."/>
    <input v-model="password" type="password" placeholder="Password.."/>
    <input type="submit" value="Login"/>
  </form>

  <h2>Listado de articulos</h2>
  <ul>
    <li v-for="article in articles">
      {{ article.title }}
    </li>
  </ul>

</template>
