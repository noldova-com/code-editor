/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { WorkerJobAnswer } from "../../enums/worker-job-answer.js";

export interface IWorkerJobOutput<TOutput> {
  readonly id: number;
  readonly answer: WorkerJobAnswer.Output;
  readonly output: TOutput;
}
