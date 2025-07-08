// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Ensure MediaPipe dependencies are pre-bundled
  optimizeDeps: {
    include: ['@mediapipe/hands'],
  },
  // Configure build options
  build: {
    assetsInlineLimit: 0, // Prevent inlining of large .wasm/.data files
    minify: 'terser', // Use Terser for better control over minification
    terserOptions: {
      mangle: {
        reserved: ['Hands'], // Prevent mangling of Hands constructor
      },
      keep_classnames: true, // Preserve class names
      keep_fnames: true, // Preserve function names
    },
    rollupOptions: {
      output: {
        manualChunks: {
          mediapipe: ['@mediapipe/hands'], // Isolate MediaPipe in a separate chunk
        },
      },
    },
  },
  // Include .wasm and .data files as assets
  assetsInclude: ['**/*.wasm', '**/*.data'],
  // Ensure Vite can serve files from the project root
  server: {
    fs: {
      allow: ['.'],
    },
  },
});