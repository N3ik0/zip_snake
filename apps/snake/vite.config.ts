import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build also works inside the Capacitor WebView.
  base: './',
  server: { host: true },
});
