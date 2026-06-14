import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        background: 'background.js',
        content: 'content.js'
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  },
  server: {
    watch: {
        ignored: ['**/node_modules/**', '**/.git/**', '**/System Volume Information/**', '**/$RECYCLE.BIN/**', '**/*.sys']
    }
  }
});
