/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IBackgroundJob, type IBackgroundRunner, Required } from "@noldova/code.editor";

export class ManualRunner implements IBackgroundRunner {
  private readonly answers: ((answer: boolean) => Promise<void>)[] = [];
  private readonly signals: (AbortSignal | undefined)[] = [];

  public get count(): number {
    return this.answers.length;
  }

  public runAsync<TInput, TOutput>(job: IBackgroundJob<TInput, TOutput>, input: TInput, signal?: AbortSignal): Promise<TOutput> {
    const call: PromiseWithResolvers<TOutput> = Promise.withResolvers<TOutput>();
    this.signals.push(signal);
    this.answers.push(async answer => {
      if (answer)
        call.resolve(ManualRunner.drive(job.steps(input)));
      else
        call.reject(new Error("The runner stopped."));
      await call.promise.catch(() => undefined);
      await Promise.resolve();
    });

    return call.promise;
  }

  public aborted(index: number): boolean {
    return this.signals[index]?.aborted === true;
  }

  public async answerAsync(index: number): Promise<void> {
    await Required.at(this.answers, index)(true);
  }

  public async failAsync(index: number): Promise<void> {
    await Required.at(this.answers, index)(false);
  }

  private static drive<TOutput>(steps: Generator<void, TOutput, void>): TOutput {
    for (;;) {
      const step: IteratorResult<void, TOutput> = steps.next();
      if (step.done === true)
        return step.value;
    }
  }
}
