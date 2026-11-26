/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Enumerable } from "@noldova/context.collections";

import { WorkerJobAnswer } from "../../enums/worker-job-answer.js";
import type { IBackgroundJob } from "../../interfaces/background/i-background-job.js";
import type { IMessageScope } from "../../interfaces/background/i-message-scope.js";
import type { IWorkerJobMessage } from "../../interfaces/background/i-worker-job-message.js";
import type { IWorkerJobRequest } from "../../interfaces/background/i-worker-job-request.js";
import type { WorkerJobResponse } from "../../models/worker-job-response.js";
import { Resources } from "../../resources.js";
import type { BackgroundJobRegistry } from "./background-job-registry.js";

export class WorkerJobHost {
  private readonly jobs: BackgroundJobRegistry;

  public constructor(jobs: BackgroundJobRegistry) {
    this.jobs = jobs;
  }

  public listen(scope: IMessageScope): void {
    scope.addEventListener(Resources.message, (event: IWorkerJobMessage) => {
      const response: WorkerJobResponse<unknown> = this.answer(event.data);
      scope.postMessage(response, { transfer: WorkerJobHost.transferOf(response) });
    });
  }

  public answer(request: IWorkerJobRequest): WorkerJobResponse<unknown> {
    const job: IBackgroundJob<unknown, unknown> | null = this.jobs.find(request.name);
    if (Object.isNull(job))
      return { id: request.id, answer: WorkerJobAnswer.Missing };
    try {
      return { id: request.id, answer: WorkerJobAnswer.Output, output: WorkerJobHost.run(job.steps(request.input)) };
    } catch (error: unknown) {
      return { id: request.id, answer: WorkerJobAnswer.Failed, reason: error instanceof Error ? error.message : String(error) };
    }
  }

  public static transferOf(response: WorkerJobResponse<unknown>): ArrayBuffer[] {
    if (response.answer !== WorkerJobAnswer.Output || !ArrayBuffer.isView(response.output))
      return [];

    return Enumerable.from([response.output.buffer]).where((t: ArrayBufferLike): t is ArrayBuffer => t instanceof ArrayBuffer).toArray();
  }

  private static run(steps: Generator<void, unknown, void>): unknown {
    for (;;) {
      const step: IteratorResult<void, unknown> = steps.next();
      if (step.done === true)
        return step.value;
    }
  }
}
