/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from "vitest";

import { BackgroundJobFailedException } from "../../../src/app/exceptions/background-job-failed.exception.ts";
import { WorkerRunner } from "../../../src/app/services/worker-runner.ts";
import { CountingRunner } from "../../fixtures/counting-runner.fixture.ts";
import { SumJob } from "../../fixtures/sum-job.fixture.ts";
import { WorkerValues } from "../../fixtures/worker-values.fixture.ts";
import { BrokenWorker } from "../../fixtures/broken-worker.fixture.ts";
import { Workers } from "../../fixtures/workers.fixture.ts";

describe(WorkerRunner.name, () => {
  it("runs each job in its worker and answers each run with its own output, leaving the page's copy of the job untouched", async () => {
    const fallback: CountingRunner = new CountingRunner();
    using runner = new WorkerRunner(Workers.sum(), fallback);
    const job: SumJob = new SumJob();

    const [first, second] = await Promise.all([runner.runAsync(job, [1, 2]), runner.runAsync(job, [10, 20, 30])]);

    expect([[...first], [...second], job.ran, fallback.names, runner.usesWorker]).toEqual([[3], [60], 0, [], true]);
  });

  it("runs a job its worker doesn't serve on its fallback and rejects a job that fails in the worker", async () => {
    const fallback: CountingRunner = new CountingRunner();
    using runner = new WorkerRunner(Workers.sum(), fallback);

    const other: Int32Array = await runner.runAsync(new SumJob(WorkerValues.otherJob), [4, 5]);
    const failed: Promise<void> = expect(runner.runAsync(new SumJob(), [1, -1])).rejects.toSatisfy((t: unknown) =>
      t instanceof BackgroundJobFailedException && t.name === BackgroundJobFailedException.name &&
      t.message === `The background job ${SumJob.defaultName} failed in the worker: No negative numbers.`);

    expect([[...other], fallback.names]).toEqual([[9], [WorkerValues.otherJob]]);
    await failed;
  });

  it("moves the runs still out, and every later run, to its fallback once its worker fails or doesn't load", async () => {
    const fallback: CountingRunner = new CountingRunner();
    const failing: BrokenWorker = new BrokenWorker();
    using broken = new WorkerRunner(failing.worker, fallback);
    using missing = new WorkerRunner(new Worker(new URL("/missing-worker.js", location.href), { type: "module" }), fallback);

    const results: readonly Int32Array[] = await Promise.all([broken.runAsync(new SumJob(), [1]), missing.runAsync(new SumJob(), [2])]);
    const later: Int32Array = await broken.runAsync(new SumJob(), [3]);

    expect([results.map(t => [...t]), [...later], fallback.names.length, broken.usesWorker, missing.usesWorker]).toEqual([[[1], [2]], [3], 3, false, false]);
    URL.revokeObjectURL(failing.script);
  });

  it("rejects with the signal's reason when a run is aborted, before or while it runs, and rejects every run once disposed", async () => {
    const runner: WorkerRunner = new WorkerRunner(Workers.sum());
    const before: AbortController = new AbortController();
    before.abort(WorkerValues.earlyReason);
    const during: AbortController = new AbortController();

    const refused: Promise<void> = expect(runner.runAsync(new SumJob(), [1], before.signal)).rejects.toBe(WorkerValues.earlyReason);
    const stopped: Promise<void> = expect(runner.runAsync(new SumJob(), [1], during.signal)).rejects.toBe(WorkerValues.lateReason);
    during.abort(WorkerValues.lateReason);
    const running: Promise<void> = expect(runner.runAsync(new SumJob(), [1])).rejects.toThrow(`The background job ${SumJob.defaultName} failed in the worker: the runner was disposed.`);
    runner[Symbol.dispose]();

    await refused;
    await stopped;
    await running;
    await expect(runner.runAsync(new SumJob(), [1])).rejects.toBeInstanceOf(BackgroundJobFailedException);
    expect(runner.usesWorker).toBe(false);
  });
});
