import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/void-survivors/',
  build: {
    chunkSizeWarningLimit: 1_600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/phaser/')) return 'phaser';
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
