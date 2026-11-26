/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { type CancellationToken, CancellationTokenSource, OperationCanceledException } from "@noldova/context.threading";

import { SlicedRunner } from "@noldova/code.editor";

import { CountJob } from "../../fixtures/count-job.fixture.js";
import { Expect } from "../../support/expect.js";

@TestClass
export class SlicedRunnerTests {
  @TestMethod
  public slicesForFiveMillisecondsUnlessGivenAnotherLength(): void {
    Expect.same([5, 10], [new SlicedRunner().sliceMilliseconds, new SlicedRunner(10).sliceMilliseconds]);
  }

  @TestMethod
  public async runsEveryStepOfAJobInOneSliceWhileItsTimeLasts(): Promise<void> {
    const job: CountJob = new CountJob();
    const running: Promise<number> = new SlicedRunner(Number.MAX_SAFE_INTEGER).runAsync(job, 3);

    Assert.areEqual(3, job.ran);
    Assert.areEqual(6, await running);
  }

  @TestMethod
  public async yieldsTheThreadAfterAStepThatEndsPastTheSlicesTime(): Promise<void> {
    const job: CountJob = new CountJob();
    const running: Promise<number> = new SlicedRunner(0).runAsync(job, 3);

    Assert.areEqual(1, job.ran);
    Expect.same([6, 3], [await running, job.ran]);
  }

  @TestMethod
  public async rejectsWithAnOperationCanceledExceptionAndRunsNoMoreStepsOnceItsTokenIsCanceled(): Promise<void> {
    const job: CountJob = new CountJob();
    const early: CountJob = new CountJob();
    const source: CancellationTokenSource = new CancellationTokenSource();
    const canceled: CancellationTokenSource = new CancellationTokenSource();
    canceled.cancel();
    const running: Promise<unknown> = new SlicedRunner(0).runAsync(job, 3, source.token).catch((error: unknown) => error);
    const refused: Promise<unknown> = new SlicedRunner(0).runAsync(early, 3, canceled.token).catch((error: unknown) => error);

    source.cancel();

    Expect.same([true, 1, true, 0], [SlicedRunnerTests.canceledBy(await running, source.token), job.ran, SlicedRunnerTests.canceledBy(await refused, canceled.token), early.ran]);
  }

  @TestMethod
  public async keepsItsOutputWhenItsTokenIsCanceledAfterTheRunEnds(): Promise<void> {
    const source: CancellationTokenSource = new CancellationTokenSource();
    const job: CountJob = new CountJob();

    const output: number = await new SlicedRunner(0).runAsync(job, 3, source.token);
    source.cancel();

    Expect.same([6, 3], [output, job.ran]);
  }

  private static canceledBy(error: unknown, token: CancellationToken): boolean {
    return error instanceof OperationCanceledException && error.cancellationToken === token;
  }
}
