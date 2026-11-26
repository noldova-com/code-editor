/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IBackgroundJob } from "@noldova/code.editor";

export class NamedJob implements IBackgroundJob<number, number> {
  public readonly name: string;

  public constructor(name: string) {
    this.name = name;
  }

  public *steps(input: number): Generator<void, number, void> {
    yield;

    return input;
  }
}
