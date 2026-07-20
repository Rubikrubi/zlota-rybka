import { defineConfig } from 'vite'
// base './' => wzgledne sciezki assetow. Dziala na GitHub Pages (podkatalog
// /zlota-rybka/), pod wlasna domena i lokalnie (npm run dev / preview).
export default defineConfig({ base: './' })
