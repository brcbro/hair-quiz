import { defineConfig } from 'vite';
import { bookingApiPlugin } from './server/booking-api.js';

export default defineConfig({
  plugins: [bookingApiPlugin()],
  server: {
    port: 5173,
  },
});
