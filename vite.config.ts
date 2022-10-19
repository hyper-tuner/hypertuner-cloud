import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

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
          pako: ['pako'],
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
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      includeAssets: ['logo.ico', 'logo.png'],
      manifest: {
        name: 'HyperTuner Cloud',
        short_name: 'HyperTuner',
        description: 'HyperTuner Cloud - Share your tunes and logs',
        start_url: '.',
        display: 'standalone',
        theme_color: '#191C1E',
        background_color: '#191C1E',
        icons: [
          {
            src: '/icons/icon.ico',
            type: 'image/x-icon',
            sizes: '256x256',
          },
          {
            src: '/icons/icon.png',
            type: 'image/png',
            sizes: '512x512',
          },
        ],
        screenshots: [
          {
            src: '/img/screen2.png',
            sizes: '1920x1194',
            type: 'image/png',
            platform: 'wide',
            label: 'Log viewer',
          },
          {
            src: '/img/screen1.png',
            sizes: '1920x1194',
            type: 'image/png',
            platform: 'wide',
            label: 'VE Table with command palette',
          },
        ],
      },
    }),
  ],
});
