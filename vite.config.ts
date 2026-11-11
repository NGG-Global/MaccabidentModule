import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base is relative so the static build can be hosted from any path
// (organisational server, cloud bucket or an LMS package) without changes.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
});
