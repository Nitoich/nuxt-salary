// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
      '@vite-pwa/nuxt'
  ],
  build: {
    typescript: {
      typeCheck: {
        memoryLimit: 512
      }
    }
  },
  pwa: {
    manifest: {
      name: "Рассчет зарплаты для Настюши",
      short_name: "Salary-Calc",
      description: "Рассчет зарплаты по месяцам",
      theme_color: "white",
      form_factor: "wide",
      icons: [
        {
          src: 'icons/icon-64x64.png',
          sizes: "64x64",
          type: "image/png"
        },
        {
          src: 'icons/icon-144x144.png',
          sizes: "144x144",
          type: "image/png"
        },
        {
          src: 'icons/icon-192x192.png',
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: 'icons/icon-512x512.png',
          sizes: "512x512",
          type: "image/png"
        },
      ]
    },
    workbox: {
      navigateFallback: "/"
    },
    devOptions: {
      enabled: true,
      type: "module"
    }
  }
})
