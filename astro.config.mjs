import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import assistantDev from './server/dev-assistant.mjs';

export default defineConfig({
  site: "https://zhuddle.com",
  output: "static",
  integrations: [react()],
  vite: { plugins: [assistantDev()] },
  devToolbar: { enabled: false },
});
