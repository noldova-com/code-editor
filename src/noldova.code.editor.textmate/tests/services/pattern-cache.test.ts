/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { TestClass, TestMethod } from "@noldova/context.testing";
import { PatternCache } from "@noldova/code.editor.textmate/services/pattern-cache.js";

import { Expect } from "../support/expect.js";

@TestClass
export class PatternCacheTests {
  @TestMethod
  public dropsThePatternReadLeastRecentlyOnceFullSoAReadKeepsAPatternThatWasAddedFirst(): void {
    const cache = new PatternCache(3);
    cache.set("a", /a/u);
    cache.set("b", /b/u);
    cache.set("c", /c/u);
    cache.get("a");
    cache.set("d", /d/u);

    Expect.same(["c", "a", "d"], [...cache.keys()]);
  }

  @TestMethod
  public keepsAPatternThatFailedToCompileAsAnEntryLikeAnyOther(): void {
    const cache = new PatternCache(2);
    const failed = new Error("(?<= unsupported");
    cache.set("(?<=", failed);
    cache.set("b", /b/u);
    const read: RegExp | Error | undefined = cache.get("(?<=");
    cache.set("c", /c/u);

    Expect.same([true, ["(?<=", "c"]], [read === failed, [...cache.keys()]]);
  }

  @TestMethod
  public leavesTheOrderAsItIsOnAMiss(): void {
    const cache = new PatternCache(2);
    cache.set("a", /a/u);
    cache.set("b", /b/u);
    const read: RegExp | Error | undefined = cache.get("z");
    cache.set("c", /c/u);

    Expect.same([undefined, ["b", "c"]], [read, [...cache.keys()]]);
  }
}
