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

  it("ticks through one MessageChannel of its own, closing it when disposed", async () => {
    const original: typeof MessageChannel = globalThis.MessageChannel;
    const channels: MessageChannel[] = [];
    let closed: number = 0;
    globalThis.MessageChannel = class CountingChannel extends original {
      public constructor() {
        super();
        channels.push(this);
        const close = this.port1.close.bind(this.port1);
        this.port1.close = (): void => {
          closed++;
          close();
        };
      }
    };
    const slices: boolean[] = [];
    let left: number = 3;
    const finished: PromiseWithResolvers<void> = Promise.withResolvers<void>();
    let ticker: BackgroundTicker;
    try {
      ticker = new BackgroundTicker(TextDocument.fromText("text"), hasTime => {
        slices.push(hasTime());
        if (--left === 0)
          finished.resolve();

        return left > 0;
      });
    }
    finally {
      globalThis.MessageChannel = original;
    }
    await finished.promise;
    ticker[Symbol.dispose]();

    expect([channels.length, slices, closed]).toEqual([1, [true, true, true], 1]);
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
