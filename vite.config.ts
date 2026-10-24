import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// GitHub Pages serves the site at /<repo>/. Set the base for production builds
// so assets resolve correctly; keep '/' for local dev.
const base = process.env.NODE_ENV === 'production' ? '/Imageshop/' : '/';

export default defineConfig({
  base,
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand', 'immer'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
