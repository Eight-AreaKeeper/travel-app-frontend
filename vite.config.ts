import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      // Uploaded images are served by the backend; proxy them so relative /uploads/... URLs also work
      '/uploads': 'http://localhost:8080',
    },
  },
});
