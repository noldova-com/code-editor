/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IBackgroundJob } from "@noldova/code.editor";

export class SumJob implements IBackgroundJob<readonly number[], Int32Array> {
  public static readonly defaultName: string = "test.sum";
  public static readonly negativeReason: string = "No negative numbers.";

  public readonly name: string;
  public ran: number = 0;

  public constructor(name: string = SumJob.defaultName) {
    this.name = name;
  }

  public *steps(input: readonly number[]): Generator<void, Int32Array, void> {
    let sum: number = 0;
    for (const value of input) {
      if (value < 0)
        throw new Error(SumJob.negativeReason);
      sum += value;
      this.ran++;
      yield;
    }

    return Int32Array.of(sum);
  }
}
