/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { WorkerRunner } from "@noldova/code.editor.angular";

export class DiffWorker {
  public static create(): WorkerRunner {
    return new WorkerRunner(new Worker(new URL("../workers/diff.worker.ts", import.meta.url), { type: "module" }));
  }
}
