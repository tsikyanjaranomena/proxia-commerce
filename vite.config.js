import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const API_TARGET = process.env.API_TARGET || 'http://localhost:4000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En développement, l'interface (5173) relaie l'API et le WebSocket vers le serveur (4000).
    proxy: {
      '/api': API_TARGET,
      '/socket.io': { target: API_TARGET, ws: true },
    },
  },
});
