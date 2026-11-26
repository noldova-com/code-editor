/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { WorkerJobAnswer, type WorkerJobResponse } from "@noldova/code.editor";
import { DefaultDiffAlgorithm, LineChangeCodec, LineDiffInput, LineDiffJob } from "@noldova/code.editor.diff";
import { describe, expect, it } from "vitest";

import { WorkerEvents } from "../../fixtures/worker-events.fixture.ts";

describe("diff.worker.ts", () => {
  it("loads in a worker, where Angular can't run, and answers the default algorithm's line diff job", async () => {
    const worker: Worker = new Worker(new URL("../../../src/app/workers/diff.worker.ts", import.meta.url), { type: "module" });
    const answered: Promise<WorkerJobResponse<Int32Array> | string> = new Promise<WorkerJobResponse<Int32Array> | string>(resolve => {
      worker.addEventListener(WorkerEvents.error, (event: ErrorEvent) => resolve(event.message), { once: true });
      worker.addEventListener(WorkerEvents.message, (event: MessageEvent<WorkerJobResponse<Int32Array>>) => resolve(event.data), { once: true });
    });

    worker.postMessage({ id: 1, name: new LineDiffJob(new DefaultDiffAlgorithm()).name, input: new LineDiffInput(["a", "b"], ["a", "c"]) });
    const answer: WorkerJobResponse<Int32Array> | string = await answered;
    worker.terminate();

    expect(Object.isString(answer) ? answer : answer.answer).toBe(WorkerJobAnswer.Output);
    const changes: readonly number[][] = !Object.isString(answer) && answer.answer === WorkerJobAnswer.Output
      ? LineChangeCodec.decode(answer.output).select(t => [t.originalStart, t.originalEnd, t.modifiedStart, t.modifiedEnd]).toArray()
      : [];
    expect(changes).toEqual([[1, 2, 1, 2]]);
  });
});
