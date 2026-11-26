/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IBackgroundJob, IBackgroundRunner } from "@noldova/code.editor";
import { CancellationToken } from "@noldova/context.threading";

export class CountingRunner implements IBackgroundRunner {
  public readonly names: string[] = [];
  public readonly tokens: CancellationToken[] = [];

  public async runAsync<TInput, TOutput>(job: IBackgroundJob<TInput, TOutput>, input: TInput, cancellationToken: CancellationToken = CancellationToken.none): Promise<TOutput> {
    this.names.push(job.name);
    this.tokens.push(cancellationToken);
    const steps: Generator<void, TOutput, void> = job.steps(input);
    for (;;) {
      const step: IteratorResult<void, TOutput> = steps.next();
      if (step.done === true)
        return await Promise.resolve(step.value);
    }
  }
}
