/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class BrokenWorker {
  public readonly script: string = URL.createObjectURL(new Blob(["throw new Error(\"The worker broke.\");"], { type: "text/javascript" }));
  public readonly worker: Worker = new Worker(this.script);
}
