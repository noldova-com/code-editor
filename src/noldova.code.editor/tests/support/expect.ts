/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { inspect, isDeepStrictEqual } from "node:util";

import { Assert } from "@noldova/context.testing";

export class Expect {
  private static readonly depth: number = 8;

  public static same(expected: unknown, actual: unknown, message?: string): void {
    if (!isDeepStrictEqual(actual, expected))
      Assert.fail(message ?? `Expected ${inspect(expected, { depth: Expect.depth })}, but got ${inspect(actual, { depth: Expect.depth })}.`);
  }

  public static throwsWhere<TException extends Error>(action: () => void, exceptionType: abstract new (...arguments_: never[]) => TException, check: (error: TException) => boolean): void {
    const error: TException = Assert.throws(action, exceptionType);
    Assert.isTrue(check(error), `The ${exceptionType.name} thrown doesn't match: ${error.message}`);
  }
}
