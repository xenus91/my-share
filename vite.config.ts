import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  // Загрузим переменные окружения
  const env = loadEnv(mode, process.cwd(), '');

  console.log("🔹 Vite режим:", mode);
  console.log("🔹 Proxy target:", env.VITE_PROXY_BASE_URL);

  if (command === 'serve') {
    return {
      server: {
        proxy: {
          '/api': {
            target: env.VITE_PROXY_BASE_URL, // используем переменную из .env
            changeOrigin: true,
            secure: false,
            rewrite: (path) => {
              console.log("🔹 Переписываем путь прокси:", path);
              return path.replace(/^\/api/, '');
            },
          },
        },
      },
    };
  }
  return {};
});
