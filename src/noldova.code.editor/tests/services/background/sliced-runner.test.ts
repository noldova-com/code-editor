/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { SlicedRunner } from "@noldova/code.editor";

import { CountJob } from "../../fixtures/count-job.fixture.js";
import { Expect } from "../../support/expect.js";

@TestClass
export class SlicedRunnerTests {
  private static readonly EARLY_REASON: string = "before";
  private static readonly LATE_REASON: string = "during";

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
  public async rejectsWithTheSignalsReasonAndRunsNoMoreStepsOnceAborted(): Promise<void> {
    const job: CountJob = new CountJob();
    const early: CountJob = new CountJob();
    const controller: AbortController = new AbortController();
    const stopped: AbortController = new AbortController();
    stopped.abort(SlicedRunnerTests.EARLY_REASON);
    const running: Promise<unknown> = new SlicedRunner(0).runAsync(job, 3, controller.signal).catch((error: unknown) => error);
    const refused: Promise<unknown> = new SlicedRunner(0).runAsync(early, 3, stopped.signal).catch((error: unknown) => error);

    controller.abort(SlicedRunnerTests.LATE_REASON);

    Expect.same([SlicedRunnerTests.LATE_REASON, 1, SlicedRunnerTests.EARLY_REASON, 0], [await running, job.ran, await refused, early.ran]);
  }
}
