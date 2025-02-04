/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SHAREPOINT_API_BASE: string;
    // Здесь можно добавить другие переменные окружения, например:
    readonly VITE_PROXY_BASE_URL: string;
    readonly VITE_SP_USERNAME: string;
    readonly VITE_SP_PASSWORD: string;
    readonly VITE_SP_DOMAIN?: string;
    readonly DEV: boolean; 
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  console.log("vite-env.d.ts is loaded");
