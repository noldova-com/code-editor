/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { TestClass, TestMethod } from "@noldova/context.testing";

import { LineToken, TokenSegments } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

@TestClass
export class TokenSegmentsTests {
  @TestMethod
  public coversALineWithItsTokensAndPlainGapsSkippingTokensPastItsEndOrBehindAnEarlierOne(): void {
    const segments = TokenSegments.fill(10, new List([
      new LineToken(2, 4, "keyword"), new LineToken(3, 5, "string"), new LineToken(5, 6, "number"),
      new LineToken(4, 5, "type"), new LineToken(8, 12, "comment"), new LineToken(11, 13, "meta")
    ]));

    Expect.same(["0-2:plain", "2-4:keyword", "4-5:string", "5-6:number", "6-8:plain", "8-10:comment"], segments.select(t => `${t.start}-${t.end}:${t.type ?? "plain"}`).toArray());
    Expect.same([], TokenSegments.fill(0, new List<LineToken>()).toArray());
    Expect.same(["0-3"], TokenSegments.fill(3, new List<LineToken>()).select(t => `${t.start}-${t.end}`).toArray());
  }

  @TestMethod
  public carriesEachTokensOpenTypeAndModifiersToItsSegmentAndNoneToAGap(): void {
    const segments = TokenSegments.fill(6, new List([new LineToken(1, 4, "keyword.control.flow", new List(["deprecated", "readonly"]))]));

    Expect.same(["0-1:plain:", "1-4:keyword.control.flow:deprecated,readonly", "4-6:plain:"], segments.select(t => `${t.start}-${t.end}:${t.type ?? "plain"}:${t.modifiers.toArray().join()}`).toArray());
  }
}
