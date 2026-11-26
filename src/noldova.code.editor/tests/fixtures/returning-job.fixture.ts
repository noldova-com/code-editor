/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IBackgroundJob } from "@noldova/code.editor";

export class ReturningJob<TOutput> implements IBackgroundJob<unknown, TOutput> {
  public readonly name: string;
  private readonly output: TOutput;

  public constructor(name: string, output: TOutput) {
    this.name = name;
    this.output = output;
  }

  public *steps(): Generator<void, TOutput, void> {
    yield;

    return this.output;
  }
}
