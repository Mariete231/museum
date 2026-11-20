import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Keep the replaceable paintings in public/gallery and copy them into every fresh build.
  publicDir: 'public',
  build: {
    copyPublicDir: true,
  },
});