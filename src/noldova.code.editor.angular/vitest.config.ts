/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { ClassMetadataCoverage } from "./scripts/class-metadata-coverage.ts";

const cacheDir = fileURLToPath(new URL("../../node_modules/.vite", import.meta.url));
const workerFile = /^(?:\/[^?]*)?(\/worker-[\w-]+\.js)\?worker_file&type=module$/u;

export default defineConfig({
  plugins: [
    new ClassMetadataCoverage(),
    { name: "noldova:cache-dir", config: { order: "pre", handler: () => ({ cacheDir }) } },
    {
      name: "noldova:worker-files",
      configureServer: server => {
        server.middlewares.use((request, _response, next) => {
          request.url = request.url?.replace(workerFile, "$1");
          next();
        });
      }
    }
  ],
  optimizeDeps: {
    include: ["@noldova/context.core", "@noldova/context.exceptions", "@noldova/context.collections", "@noldova/context.threading"]
  },
  server: {
    fs: {
      allow: [fileURLToPath(new URL("../..", import.meta.url))]
    }
  },
  test: {
    attachmentsDir: fileURLToPath(new URL("../../_build/code-editor-angular/attachments", import.meta.url)),
    coverage: {
      reportsDirectory: fileURLToPath(new URL("../../_build/code-editor-angular-coverage", import.meta.url))
    }
  }
});
