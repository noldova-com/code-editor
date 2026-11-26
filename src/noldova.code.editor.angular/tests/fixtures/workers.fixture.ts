/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Workers {
  public static sum(): Worker {
    return new Worker(new URL("./sum.worker.ts", import.meta.url), { type: "module" });
  }
}
