// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  // Загрузим переменные окружения для текущего режима
  const env = loadEnv(mode, process.cwd(), '');
  if (command === 'serve') {
    console.log('Proxy target:', env.VITE_PROXY_BASE_URL);
    return {
      server: {
        proxy: {
          '/api': {
            target: env.VITE_PROXY_BASE_URL, // используем переменную из env
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/_api/, ''),
          },
        },
      },
    };
  }
  return {};
});
