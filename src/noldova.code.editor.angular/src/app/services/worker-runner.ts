/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HashSet } from "@noldova/context.collections";
import { type IBackgroundJob, type IBackgroundRunner, type IWorkerJobRequest, SlicedRunner, WorkerJobAnswer, type WorkerJobResponse } from "@noldova/code.editor";
import { CancellationToken, type CancellationTokenRegistration, OperationCanceledException } from "@noldova/context.threading";

import { Resources } from "../../resources.ts";
import { BackgroundJobFailedException } from "../exceptions/background-job-failed.exception.ts";

export class WorkerRunner implements IBackgroundRunner, Disposable {
  public readonly fallback: IBackgroundRunner;
  private readonly worker: Worker;
  private readonly breaks: HashSet<() => void> = new HashSet<() => void>();
  private nextId: number = 0;
  private broken: boolean = false;
  private disposed: boolean = false;

  public constructor(worker: Worker, fallback: IBackgroundRunner = new SlicedRunner()) {
    this.worker = worker;
    this.fallback = fallback;
    worker.addEventListener(Resources.error, (event: Event) => {
      event.preventDefault();
      this.broken = true;
      this.stopAll();
    });
  }

  public get usesWorker(): boolean {
    return !this.broken && !this.disposed;
  }

  public async runAsync<TInput, TOutput>(job: IBackgroundJob<TInput, TOutput>, input: TInput, cancellationToken: CancellationToken = CancellationToken.none): Promise<TOutput> {
    cancellationToken.throwIfCancellationRequested();
    if (this.disposed)
      throw new BackgroundJobFailedException(job.name, Resources.runnerDisposed);
    if (this.broken)
      return await this.fallback.runAsync(job, input, cancellationToken);
    const id: number = this.nextId++;
    const call: PromiseWithResolvers<TOutput> = Promise.withResolvers<TOutput>();
    const finish = (): void => {
      this.worker.removeEventListener(Resources.message, onMessage);
      registration.unregister();
      this.breaks.remove(onBreak);
    };
    const onMessage = (event: MessageEvent<WorkerJobResponse<TOutput>>): void => {
      const response: WorkerJobResponse<TOutput> = event.data;
      if (response.id !== id)
        return;
      finish();
      if (response.answer === WorkerJobAnswer.Output)
        call.resolve(response.output);
      else if (response.answer === WorkerJobAnswer.Missing)
        call.resolve(this.fallback.runAsync(job, input, cancellationToken));
      else
        call.reject(new BackgroundJobFailedException(job.name, response.reason));
    };
    const onCancel = (): void => {
      finish();
      call.reject(new OperationCanceledException(undefined, cancellationToken));
    };
    const onBreak = (): void => {
      finish();
      if (this.disposed)
        call.reject(new BackgroundJobFailedException(job.name, Resources.runnerDisposed));
      else
        call.resolve(this.fallback.runAsync(job, input, cancellationToken));
    };
    this.worker.addEventListener(Resources.message, onMessage);
    const registration: CancellationTokenRegistration = cancellationToken.register(onCancel);
    this.breaks.add(onBreak);
    const request: IWorkerJobRequest = { id, name: job.name, input };
    this.worker.postMessage(request);

    return await call.promise;
  }

  public [Symbol.dispose](): void {
    this.disposed = true;
    this.worker.terminate();
    this.stopAll();
  }

  private stopAll(): void {
    for (const stop of this.breaks.toArray())
      stop();
  }
}
