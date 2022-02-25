import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  // This changes the out put dir from dist to build
  build: { outDir: 'build' },
  server: { open: true },
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true },
    },
  },
  plugins: [
    react(),
    visualizer(),
  ],
});
