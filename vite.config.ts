import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { createHtmlPlugin } from 'vite-plugin-html';
import { VitePWA } from 'vite-plugin-pwa';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return defineConfig({
    build: {
      outDir: 'build',
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
      createHtmlPlugin({
        template: '/index.html',
        inject: {
          data: {
            metaTitle: env.VITE_META_TITLE,
            metaDescription: env.VITE_META_DESCRIPTION,
            metaImage: `${env.VITE_WEB_URL}/img/screen2.png`,
            metaUrl: env.VITE_WEB_URL,
            metaThemeColor: env.VITE_META_THEME_COLOR,
          },
        },
      }),
      VitePWA({
        registerType: null,
        injectRegister: null,
        selfDestroying: true,
        devOptions: { enabled: true },
        manifest: {
          name: env.VITE_META_TITLE,
          short_name: env.VITE_META_TITLE,
          description: env.VITE_META_DESCRIPTION,
          start_url: '.',
          display: 'standalone',
          theme_color: env.VITE_META_THEME_COLOR,
          background_color: env.VITE_META_THEME_COLOR,
          icons: [
            {
              src: '/icons/icon.ico',
              type: 'image/x-icon',
              sizes: '256x256',
            },
            {
              src: '/icons/icon.png',
              type: 'image/png',
              sizes: '812x812',
            },
          ],
          screenshots: [
            {
              src: '/img/screen1.png',
              sizes: '3008x2050',
              type: 'image/png',
              platform: 'wide',
              label: 'Tune view',
            },
            {
              src: '/img/screen2.png',
              sizes: '3008x2050',
              type: 'image/png',
              platform: 'wide',
              label: 'Log viewer',
            },
            {
              src: '/img/screen3.png',
              sizes: '3008x2050',
              type: 'image/png',
              platform: 'wide',
              label: 'Tooth log viewer',
            },
          ],
        },
      }),
    ],
  });
};
