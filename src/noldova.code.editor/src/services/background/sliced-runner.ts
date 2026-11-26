/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { CancellationToken } from "@noldova/context.threading";

import type { IBackgroundJob } from "../../interfaces/background/i-background-job.js";
import type { IBackgroundRunner } from "../../interfaces/background/i-background-runner.js";
import { Resources } from "../../resources.js";

export class SlicedRunner implements IBackgroundRunner {
  public static readonly defaultSliceMilliseconds: number = Resources.defaultSliceMilliseconds;

  public readonly sliceMilliseconds: number;

  public constructor(sliceMilliseconds: number = SlicedRunner.defaultSliceMilliseconds) {
    this.sliceMilliseconds = sliceMilliseconds;
  }

  public async runAsync<TInput, TOutput>(job: IBackgroundJob<TInput, TOutput>, input: TInput, cancellationToken: CancellationToken = CancellationToken.none): Promise<TOutput> {
    cancellationToken.throwIfCancellationRequested();
    const steps: Generator<void, TOutput, void> = job.steps(input);
    for (;;) {
      const deadline: number = performance.now() + this.sliceMilliseconds;
      let step: IteratorResult<void, TOutput> = steps.next();
      while (step.done !== true && performance.now() < deadline)
        step = steps.next();
      if (step.done === true)
        return step.value;
      await SlicedRunner.yieldAsync();
      cancellationToken.throwIfCancellationRequested();
    }
  }

  private static async yieldAsync(): Promise<void> {
    await new Promise<void>(resolve => setTimeout(resolve));
  }
}
