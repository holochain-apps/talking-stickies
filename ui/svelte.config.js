import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  resolve: {
    dedupe: [
      '@holochain-open-dev/elements',
      '@holochain-open-dev/profiles',
      '@holochain-open-dev/stores',
      '@holochain-syn/core',
      'lit',
      '@lit/reactive-element',
    ],
  },
  optimizeDeps: {
    exclude: [
      "@holochain-open-dev/elements/dist/elements/display-error.js"
    ],
  },
}

