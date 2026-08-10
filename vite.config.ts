import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Use VITE_API_URL when provided (local .env) otherwise fall back
        // to the deployed Render backend URL.
        target: process.env.VITE_API_URL || 'https://aaryan-media-course-backend.onrender.com',
        changeOrigin: true,
      }
    }
  }
});