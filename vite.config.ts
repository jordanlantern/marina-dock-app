import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path" // <--- ADD THIS LINE

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { // <--- ADD THIS WHOLE 'resolve' SECTION
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
})