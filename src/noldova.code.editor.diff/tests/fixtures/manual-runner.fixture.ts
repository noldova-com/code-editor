/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IBackgroundJob, type IBackgroundRunner, Required } from "@noldova/code.editor";
import { CancellationToken } from "@noldova/context.threading";

export class ManualRunner implements IBackgroundRunner {
  private readonly answers: ((answer: boolean) => Promise<void>)[] = [];
  private readonly tokens: CancellationToken[] = [];
  private readonly failsToCancel: boolean;

  public constructor(failsToCancel: boolean = false) {
    this.failsToCancel = failsToCancel;
  }

  public get count(): number {
    return this.answers.length;
  }

  public runAsync<TInput, TOutput>(job: IBackgroundJob<TInput, TOutput>, input: TInput, cancellationToken: CancellationToken = CancellationToken.none): Promise<TOutput> {
    const call: PromiseWithResolvers<TOutput> = Promise.withResolvers<TOutput>();
    this.tokens.push(cancellationToken);
    if (this.failsToCancel)
      cancellationToken.register(() => {
        throw new Error("The runner failed to stop.");
      });
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

  public canceled(index: number): boolean {
    return Required.at(this.tokens, index).isCancellationRequested;
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
