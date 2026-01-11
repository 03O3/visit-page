// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/'
  },

  nitro: {
    preset: 'github-pages'
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/hints',
    '@nuxt/image',
    '@nuxt/ui'
  ],

  image: {
    domains: ['placehold.co']
  }
})
