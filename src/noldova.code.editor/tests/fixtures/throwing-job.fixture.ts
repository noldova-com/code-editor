/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IBackgroundJob } from "@noldova/code.editor";

export class ThrowingJob implements IBackgroundJob<unknown, never> {
  public readonly name: string;
  private readonly thrown: unknown;

  public constructor(name: string, thrown: unknown) {
    this.name = name;
    this.thrown = thrown;
  }

  public *steps(): Generator<void, never, void> {
    yield;
    throw this.thrown;
  }
}
