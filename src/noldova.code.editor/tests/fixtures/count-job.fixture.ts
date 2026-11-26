/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IBackgroundJob } from "@noldova/code.editor";

export class CountJob implements IBackgroundJob<number, number> {
  public readonly name: string = "count";
  public ran: number = 0;

  public *steps(input: number): Generator<void, number, void> {
    for (let i: number = 0; i < input; i++) {
      this.ran++;
      yield;
    }

    return input * 2;
  }
}
