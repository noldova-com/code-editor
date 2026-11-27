/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class PatternWatch {
  public static compiledWhile(work: () => void): number {
    const set: Map<unknown, unknown>["set"] = Map.prototype.set;
    let compiled: number = 0;
    Map.prototype.set = function (this: Map<unknown, unknown>, key: unknown, value: unknown): Map<unknown, unknown> {
      if (value instanceof RegExp)
        compiled++;

      return set.call(this, key, value);
    };
    try {
      work();
    }
    finally {
      Map.prototype.set = set;
    }

    return compiled;
  }
}
