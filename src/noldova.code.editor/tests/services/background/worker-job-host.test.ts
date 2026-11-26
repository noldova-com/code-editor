/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackgroundJobRegistry, type IBackgroundJob, WorkerJobAnswer, WorkerJobHost, type WorkerJobResponse } from "@noldova/code.editor";
import { Resources } from "@noldova/code.editor/resources.js";

import { ReturningJob } from "../../fixtures/returning-job.fixture.js";
import { SumJob } from "../../fixtures/sum-job.fixture.js";
import { ThrowingJob } from "../../fixtures/throwing-job.fixture.js";
import { Expect } from "../../support/expect.js";

@TestClass
export class WorkerJobHostTests {
  private static readonly SUM_JOB: string = "test.sum";
  private static readonly OTHER_JOB: string = "test.other";
  private static readonly UNKNOWN_JOB: string = "test.unknown";
  private static readonly PLAIN_JOB: string = "test.plain";
  private static readonly THROWN_JOB: string = "test.thrown";
  private static readonly THROWN_REASON: string = "a string";
  private static readonly PLAIN_OUTPUT: string = "done";

  @TestMethod
  public runsTheJobARequestNamesStraightThroughAndHandsBackItsTypedArraysBufferToTransfer(): void {
    const job: SumJob = new SumJob(WorkerJobHostTests.SUM_JOB);
    const host: WorkerJobHost = new WorkerJobHost(WorkerJobHostTests.registryOf(job, new SumJob(WorkerJobHostTests.OTHER_JOB)));

    const answer: WorkerJobResponse<unknown> = host.answer({ id: 4, name: WorkerJobHostTests.SUM_JOB, input: [1, 2, 3] });

    Expect.same({ id: 4, answer: WorkerJobAnswer.Output, output: Int32Array.of(6) }, answer);
    Assert.areEqual(3, job.ran);
    Assert.areEqual(1, WorkerJobHost.transferOf(answer).length);
  }

  @TestMethod
  public answersAJobItDoesntServeAsMissingAndAJobThatThrowsAsFailedWithItsMessageTransferringNothing(): void {
    const host: WorkerJobHost = new WorkerJobHost(WorkerJobHostTests.registryOf(new SumJob(WorkerJobHostTests.SUM_JOB)));
    const missing: WorkerJobResponse<unknown> = host.answer({ id: 1, name: WorkerJobHostTests.UNKNOWN_JOB, input: [] });
    const failed: WorkerJobResponse<unknown> = host.answer({ id: 2, name: WorkerJobHostTests.SUM_JOB, input: [1, -1] });
    const plain: WorkerJobHost = new WorkerJobHost(WorkerJobHostTests.registryOf(new ReturningJob(WorkerJobHostTests.PLAIN_JOB, WorkerJobHostTests.PLAIN_OUTPUT),
      new ThrowingJob(WorkerJobHostTests.THROWN_JOB, WorkerJobHostTests.THROWN_REASON)));

    Expect.same([{ id: 1, answer: WorkerJobAnswer.Missing }, { id: 2, answer: WorkerJobAnswer.Failed, reason: SumJob.negativeReason }], [missing, failed]);
    Expect.same({ id: 3, answer: WorkerJobAnswer.Failed, reason: WorkerJobHostTests.THROWN_REASON }, plain.answer({ id: 3, name: WorkerJobHostTests.THROWN_JOB, input: null }));
    const output: WorkerJobResponse<unknown> = plain.answer({ id: 4, name: WorkerJobHostTests.PLAIN_JOB, input: null });
    Expect.same({ id: 4, answer: WorkerJobAnswer.Output, output: WorkerJobHostTests.PLAIN_OUTPUT }, output);
    Expect.same([[], [], []], [WorkerJobHost.transferOf(missing), WorkerJobHost.transferOf(failed), WorkerJobHost.transferOf(output)]);
  }

  @TestMethod
  public async answersEachRequestItsScopeReceivesOnTheSameScopeMovingTheOutputsBuffer(): Promise<void> {
    const channel: MessageChannel = new MessageChannel();
    new WorkerJobHost(WorkerJobHostTests.registryOf(new SumJob(WorkerJobHostTests.SUM_JOB))).listen(channel.port1);
    channel.port1.start();
    const answered: Promise<MessageEvent<WorkerJobResponse<Int32Array>>> = new Promise<MessageEvent<WorkerJobResponse<Int32Array>>>(resolve =>
      channel.port2.addEventListener(Resources.message, resolve, { once: true }));
    channel.port2.start();

    channel.port2.postMessage({ id: 7, name: WorkerJobHostTests.SUM_JOB, input: [2, 5] });

    Expect.same({ id: 7, answer: WorkerJobAnswer.Output, output: Int32Array.of(7) }, (await answered).data);
    channel.port1.close();
    channel.port2.close();
  }

  private static registryOf(...jobs: IBackgroundJob<unknown, unknown>[]): BackgroundJobRegistry {
    const registry: BackgroundJobRegistry = new BackgroundJobRegistry();
    for (const job of jobs)
      registry.register(job);

    return registry;
  }
}
