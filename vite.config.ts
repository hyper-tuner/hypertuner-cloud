import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'build', // This changes the out put dir from dist to build
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          antdResult: ['antd/es/result'],
          antdTable: ['antd/es/table'],
          antdIcons: ['@ant-design/icons'],
          uplot: ['uplot'],
          sentry: ['@sentry/react', '@sentry/browser', '@sentry/tracing'],
          kbar: ['kbar'],
          perfectScrollbar: ['perfect-scrollbar'],
        },
      },
    },
  },
  server: {
    open: true,
    host: '0.0.0.0',
  },
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
