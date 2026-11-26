/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TextDocument, TextEdit, TextRange } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";
import { describe, expect, it } from "vitest";

import { BackgroundTicker } from "../../../src/app/services/background-ticker.ts";
import { NextTask } from "../../fixtures/next-task.fixture.ts";

describe("BackgroundTicker", () => {
  it("runs its step in timed slices, one task each, while the step has more, and starts again after an edit", async () => {
    const document: TextDocument = TextDocument.fromText("text");
    const slices: boolean[] = [];
    let left: number = 3;
    const finished: PromiseWithResolvers<void> = Promise.withResolvers<void>();
    using _ticker = new BackgroundTicker(document, hasTime => {
      slices.push(hasTime());
      if (--left === 0)
        finished.resolve();

      return left > 0;
    });

    expect(slices).toEqual([]);
    await finished.promise;
    await NextTask.waitAsync();
    expect(slices).toEqual([true, true, true]);
    left = 1;
    document.apply(new List<TextEdit>([new TextEdit(TextRange.of(0, 0, 0, 0), "x")]));
    document.apply(new List<TextEdit>([new TextEdit(TextRange.of(0, 0, 0, 0), "y")]));
    await NextTask.waitAsync();
    await NextTask.waitAsync();

    expect(slices).toEqual([true, true, true, true]);
  });

  it("stops at once when disposed before its first slice", async () => {
    const document: TextDocument = TextDocument.fromText("text");
    const slices: boolean[] = [];
    const ticker: BackgroundTicker = new BackgroundTicker(document, hasTime => slices.push(hasTime()) > 0);

    ticker[Symbol.dispose]();
    document.apply(new List<TextEdit>([new TextEdit(TextRange.of(0, 0, 0, 0), "x")]));
    await NextTask.waitAsync();

    expect(slices).toEqual([]);
  });
});
