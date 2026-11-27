/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class PatternWatch {
  public static compiledWhile(work: () => void): number {
    let compiled: number = 0;
    PatternWatch.watch(work, () => {
      compiled++;
    });

    return compiled;
  }

  private static watch(work: () => void, compiled: () => void): void {
    const get: Map<unknown, unknown>["get"] = Map.prototype.get;
    const set: Map<unknown, unknown>["set"] = Map.prototype.set;
    const fetched: WeakSet<RegExp> = new WeakSet<RegExp>();
    Map.prototype.get = function (this: Map<unknown, unknown>, key: unknown): unknown {
      const value: unknown = get.call(this, key);
      if (value instanceof RegExp)
        fetched.add(value);

      return value;
    };
    Map.prototype.set = function (this: Map<unknown, unknown>, key: unknown, value: unknown): Map<unknown, unknown> {
      const map: Map<unknown, unknown> = set.call(this, key, value);
      if (value instanceof RegExp && !fetched.has(value))
        compiled();

      return map;
    };
    try {
      work();
    } finally {
      Map.prototype.get = get;
      Map.prototype.set = set;
    }
  }
}
