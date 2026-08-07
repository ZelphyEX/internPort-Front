import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type UserConfig} from 'vite';

export default defineConfig((): UserConfig => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    ssr: {
      // Prevent Vite from externalizing @react-oauth/google during SSR build
      noExternal: ['@react-oauth/google'],
    },
  };
});
