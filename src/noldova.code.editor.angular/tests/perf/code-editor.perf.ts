/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { isDevMode } from "@angular/core";
import { TextPosition, TextSelection } from "@noldova/code.editor";
import { TextMateTokenizer } from "@noldova/code.editor.textmate";
import { List } from "@noldova/context.collections";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import { afterAll, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { EditorFixture } from "../fixtures/editor.fixture.ts";
import { PerfReport } from "./perf-report.fixture.ts";
import { PerfView } from "./perf-view.fixture.ts";

const LINES: number = 1_000_000;
const RUNS: number = 5;
const PRESSES: number = 20;
const SCROLL_FRAMES: number = 300;
const TIMEOUT: number = 600_000;
const KEYWORD: string = "nol-code-editor-token-keyword";
const MATCH: string = ".nol-code-editor-match";
const QUERY: string = "line";
const FIND: string = navigator.platform.startsWith("Mac") ? "{Meta>}f{/Meta}" : "{Control>}f{/Control}";
const COUNTED: RegExp = /^\d+ of \d+$/u;
const PLAIN: string = EditorFixture.lines(LINES);
const CODE: string = EditorFixture.code(LINES, "let first = 0;");

describe("Code editor on a 1,000,000-line document", () => {
  afterAll(() => PerfReport.saveAsync("code-editor"));

  it("runs Angular in production mode, as an app's release build does", () => {
    expect(isDevMode()).toBe(false);
  });

  it("opens it plain until its first lines show", async () => {
    for (let run: number = 0; run < RUNS; run++) {
      const start: number = performance.now();
      const view: PerfView = await PerfView.openAsync(PLAIN);
      await PerfReport.paintAsync();
      PerfReport.since("open, plain", start);
      view.destroy();
    }
  }, TIMEOUT);

  it("opens it highlighted until its first lines show colored, the first open with a new tokenizer apart", async () => {
    using tokenizer = await TextMateTokenizer.createAsync("typescript", () => import("@shikijs/langs/typescript"), createJavaScriptRegexEngine());
    for (let run: number = 0; run <= RUNS; run++) {
      const start: number = performance.now();
      const view: PerfView = await PerfView.openAsync(CODE, tokenizer);
      await view.untilAsync("the first line is colored", () => view.kindsAt(0).includes(KEYWORD));
      await PerfReport.paintAsync();
      PerfReport.since(run === 0 ? "open, highlighted, first" : "open, highlighted", start);
      view.destroy();
    }
  }, TIMEOUT);

  it("takes a keypress in its middle until the line is painted", async () => {
    for (let run: number = 0; run < RUNS; run++) {
      const view: PerfView = await PerfView.openAsync(PLAIN);
      view.editor.scrollTo(500_000 * view.lineHeight);
      view.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(500_005, 0))]));
      await view.fixture.whenStable();
      await PerfReport.paintAsync();
      for (let press: number = 0; press < PRESSES; press++) {
        const start: number = performance.now();
        view.input.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText", data: "x", cancelable: true }));
        view.fixture.detectChanges();
        view.host.getBoundingClientRect();
        PerfReport.since("keypress, work before the frame", start);
        await PerfReport.paintAsync();
        PerfReport.since("keypress to paint", start);
      }
      view.destroy();
    }
  }, TIMEOUT);

  it("scrolls it from top to bottom frame by frame", async () => {
    for (let run: number = 0; run < RUNS; run++) {
      const view: PerfView = await PerfView.openAsync(PLAIN);
      const height: number = LINES * view.lineHeight;
      await PerfReport.paintAsync();
      for (let frame: number = 1; frame <= SCROLL_FRAMES; frame++) {
        const start: number = performance.now();
        view.scroller.scrollTop = frame * height / SCROLL_FRAMES;
        view.scroller.dispatchEvent(new Event("scroll"));
        view.fixture.detectChanges();
        view.host.getBoundingClientRect();
        PerfReport.since("scroll, work before the frame", start);
        await PerfReport.paintAsync();
        PerfReport.since("scroll frame", start);
      }
      view.destroy();
    }
  }, TIMEOUT);

  it("searches it until the first matches show, both the work before the frame and until painted, and until it counts the last", async () => {
    for (let run: number = 0; run < RUNS; run++) {
      const view: PerfView = await PerfView.openAsync(PLAIN);
      view.editor.focus();
      await userEvent.keyboard(FIND);
      await view.fixture.whenStable();
      const field: HTMLElement = view.one("input[aria-label=\"Find\"]");
      const status: HTMLElement = view.one("[role=status]");
      const start: number = performance.now();
      if (field instanceof HTMLInputElement)
        field.value = QUERY;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      view.fixture.detectChanges();
      view.host.getBoundingClientRect();
      PerfReport.since("search, work before the frame", start);
      expect(view.all(MATCH).length).toBeGreaterThan(0);
      await PerfReport.paintAsync();
      PerfReport.since("search, first matches painted", start);
      await view.untilAsync("the search counts every match", () => COUNTED.test(status.textContent));
      PerfReport.since("search, last match", start);
      view.destroy();
    }
  }, TIMEOUT);
});
