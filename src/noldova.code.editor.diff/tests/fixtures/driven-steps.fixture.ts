/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class DrivenSteps {
  public readonly count: number;
  public readonly output: Int32Array;

  public constructor(steps: Generator<void, Int32Array, void>) {
    let count: number = 0;
    let step: IteratorResult<void, Int32Array> = steps.next();
    while (step.done !== true) {
      count++;
      step = steps.next();
    }
    this.count = count;
    this.output = step.value;
  }
}
