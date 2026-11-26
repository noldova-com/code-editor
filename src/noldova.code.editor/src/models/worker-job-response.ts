/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IWorkerJobFailure } from "../interfaces/background/i-worker-job-failure.js";
import type { IWorkerJobMissing } from "../interfaces/background/i-worker-job-missing.js";
import type { IWorkerJobOutput } from "../interfaces/background/i-worker-job-output.js";

export type WorkerJobResponse<TOutput> = IWorkerJobOutput<TOutput> | IWorkerJobMissing | IWorkerJobFailure;
