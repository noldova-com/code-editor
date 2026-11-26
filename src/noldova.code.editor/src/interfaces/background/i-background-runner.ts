/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CancellationToken } from "@noldova/context.threading";

import type { IBackgroundJob } from "./i-background-job.js";

export interface IBackgroundRunner {
  runAsync<TInput, TOutput>(job: IBackgroundJob<TInput, TOutput>, input: TInput, cancellationToken?: CancellationToken): Promise<TOutput>;
}
