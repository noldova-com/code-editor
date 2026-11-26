/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IBackgroundJob, IBackgroundRunner } from "@noldova/code.editor";

export class CountingRunner implements IBackgroundRunner {
  public readonly names: string[] = [];

  public async runAsync<TInput, TOutput>(job: IBackgroundJob<TInput, TOutput>, input: TInput): Promise<TOutput> {
    this.names.push(job.name);
    const steps: Generator<void, TOutput, void> = job.steps(input);
    for (;;) {
      const step: IteratorResult<void, TOutput> = steps.next();
      if (step.done === true)
        return await Promise.resolve(step.value);
    }
  }
}
