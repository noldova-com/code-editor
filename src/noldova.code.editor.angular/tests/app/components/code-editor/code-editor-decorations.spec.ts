/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TextDocument, TextPosition, TextRange } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";
import { describe, expect, it } from "vitest";

import { FoldShortcut } from "../../../../src/app/enums/fold-shortcut.ts";
import { CodeBar } from "../../../../src/app/models/decorations/code-bar.ts";
import { CodeBarAction } from "../../../../src/app/models/decorations/code-bar-action.ts";
import { CodeDecorations } from "../../../../src/app/models/decorations/code-decorations.ts";
import { CodeEmbeddedLines } from "../../../../src/app/models/rows/code-embedded-lines.ts";
import { CodeFold } from "../../../../src/app/models/folding/code-fold.ts";
import { CodeGutterMarker } from "../../../../src/app/models/decorations/code-gutter-marker.ts";
import type { CodeInsertedRows } from "../../../../src/app/models/rows/code-inserted-rows.ts";
import { CodeLineDecoration } from "../../../../src/app/models/decorations/code-line-decoration.ts";
import { CodeRangeDecoration } from "../../../../src/app/models/decorations/code-range-decoration.ts";
import { CodeSpacer } from "../../../../src/app/models/rows/code-spacer.ts";
import { DecoratedFixture } from "../../../fixtures/decorated.fixture.ts";
import { DomWait } from "../../../fixtures/dom-wait.fixture.ts";
import { OffsetNumbering } from "../../../fixtures/offset-numbering.fixture.ts";
import { PageStyle } from "../../../fixtures/page-style.fixture.ts";
import { StyleColor } from "../../../fixtures/style-color.fixture.ts";

const ROW: number = DecoratedFixture.row;
const RED: string = "rgb(200, 0, 0)";
const BLUE: string = "rgb(0, 0, 200)";
const GREEN: string = "rgb(0, 160, 0)";

describe("CodeEditorComponent's decorations", () => {
  it("paints each set's line backgrounds in the gutter and behind the text, a later set over an earlier one, each paint filling its row", async () => {
    const view: DecoratedFixture = await DecoratedFixture.renderAsync("zero\none\ntwo\nthree", [
      new CodeDecorations(new List<CodeLineDecoration>([new CodeLineDecoration(1, 2, RED)])),
      new CodeDecorations(new List<CodeLineDecoration>([new CodeLineDecoration(2, 1, BLUE), new CodeLineDecoration(3, 0, GREEN)]))
    ]);

    expect(view.kinds()).toEqual(["line", "line", "line", "line"]);
    expect([0, 1, 2, 3].map(t => view.paints(".nol-code-editor-row", t))).toEqual([[], [RED], [RED, BLUE], []]);
    expect([0, 1, 2, 3].map(t => view.paints(".nol-code-editor-line-number", t))).toEqual([[], [RED], [RED, BLUE], []]);
    const row: HTMLElement = view.at(".nol-code-editor-row", 2);
    const top: HTMLElement = view.all(".nol-code-editor-row")[2]?.querySelectorAll<HTMLElement>(".nol-code-editor-paint")[1] ?? row;
    const box: DOMRect = top.getBoundingClientRect();
    expect([PageStyle.rem(box.top - row.getBoundingClientRect().top), PageStyle.rem(box.height - row.getBoundingClientRect().height), PageStyle.rem(box.width - row.getBoundingClientRect().width)])
      .toEqual([0, 0, 0]);
    const text: DOMRect = view.at(".nol-code-editor-line", 2).getBoundingClientRect();
    expect(PageStyle.rem(box.top - text.top)).toBe(0);
    expect(view.signs()).toEqual(["", "", "", ""]);
    expect(view.numbers()).toEqual(["1", "2", "3", "4"]);
  });

  it("marks the gutter with the latest set's marker on a line, in its color, and marks no line of a view without decorations", async () => {
    const view: DecoratedFixture = await DecoratedFixture.renderAsync("a\nb\nc", [
      new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>([new CodeGutterMarker(0, "!", RED), new CodeGutterMarker(1, "?", RED)])),
      new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>([new CodeGutterMarker(1, "x", "var(--nol-warning)")]))
    ]);

    expect(view.signs()).toEqual(["!", "x", ""]);
    const sign: HTMLElement = view.one(view.at(".nol-code-editor-line-number", 1), ".nol-code-editor-sign");
    expect(getComputedStyle(sign).color).toBe(PageStyle.styleOf(StyleColor.Text, "--nol-warning", view.host));
    expect(getComputedStyle(view.one(view.at(".nol-code-editor-line-number", 0), ".nol-code-editor-sign")).color).toBe(RED);
    const gutter: HTMLElement = view.one(view.host, ".nol-code-editor-gutter");
    const number: DOMRect = view.one(view.at(".nol-code-editor-line-number", 1), ".nol-code-editor-number").getBoundingClientRect();
    const box: DOMRect = sign.getBoundingClientRect();
    expect([PageStyle.rem(box.top - view.at(".nol-code-editor-row", 1).getBoundingClientRect().top), PageStyle.rem(box.height),
      PageStyle.rem(box.left - number.right - Number.parseFloat(getComputedStyle(sign).marginInlineStart)),
      PageStyle.rem(gutter.getBoundingClientRect().right - Number.parseFloat(getComputedStyle(gutter).paddingInlineEnd) - box.right)]).toEqual([0, ROW, 0, 0]);

    await view.setDecorationsAsync([]);
    expect(view.all(".nol-code-editor-sign").length).toBe(0);
    expect(view.all(".nol-code-editor-rows").length).toBe(0);
  });

  it("paints a range's characters on each line it covers, from its start column to its end, and nothing on a line it only reaches", async () => {
    const view: DecoratedFixture = await DecoratedFixture.renderAsync("abcdef\nghijkl\nmnopqr\nstu", [
      new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>([new CodeRangeDecoration(new TextRange(new TextPosition(0, 2), new TextPosition(0, 4)), RED)])),
      new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>([new CodeRangeDecoration(new TextRange(new TextPosition(1, 3), new TextPosition(3, 0)), BLUE)]))
    ]);

    const changes: readonly HTMLElement[] = view.all(".nol-code-editor-change");
    expect(changes.map(t => getComputedStyle(t).backgroundColor)).toEqual([RED, BLUE, BLUE]);
    const lines: readonly HTMLElement[] = view.all(".nol-code-editor-line");
    DecoratedFixture.expectCovers(changes[0] ?? view.host, lines[0] ?? view.host, 2, 4);
    DecoratedFixture.expectCovers(changes[1] ?? view.host, lines[1] ?? view.host, 3, 6);
    DecoratedFixture.expectCovers(changes[2] ?? view.host, lines[2] ?? view.host, 0, 6);
  });

  it("draws a bar above its line, in its own colors, with its icon, note and actions, and tells its owner which action was clicked", async () => {
    const take: CodeBarAction = new CodeBarAction("take", "Take", "check");
    const skip: CodeBarAction = new CodeBarAction("skip", "Skip");
    const bar: CodeBar = new CodeBar("first", 1, "Choose one", "warning", new List<CodeBarAction>([take, skip]), RED, BLUE);
    const plain: CodeBar = new CodeBar("second", 3, "Nothing to do", null, new List<CodeBarAction>());
    const view: DecoratedFixture = await DecoratedFixture.renderAsync("a\nb\nc\nd", [new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), new List<CodeInsertedRows>([bar, plain]))]);

    expect(view.kinds()).toEqual(["line", "bar", "line", "line", "bar", "line"]);
    expect(view.texts(".nol-code-editor-line")).toEqual(["a", "", "b", "c", "", "d"]);
    expect(view.numbers()).toEqual(["1", "", "2", "3", "", "4"]);
    const bars: readonly HTMLElement[] = view.all(".nol-code-editor-bar");
    const first: HTMLElement = bars[0] ?? view.host;
    const second: HTMLElement = bars[1] ?? view.host;
    expect(bars.map(t => view.one(t, ".nol-code-editor-bar-note").textContent)).toEqual(["Choose one", "Nothing to do"]);
    expect([getComputedStyle(first).backgroundColor, getComputedStyle(first).color]).toEqual([RED, BLUE]);
    expect([getComputedStyle(second).backgroundColor, getComputedStyle(second).color])
      .toEqual([PageStyle.styleOf(StyleColor.Background, "--nol-code-header", view.host), PageStyle.styleOf(StyleColor.Text, "--nol-text-muted", view.host)]);
    expect(view.one(first, ".nol-code-editor-bar-icon").textContent).toBe("warning");
    expect(second.querySelectorAll(".nol-code-editor-bar-icon, .nol-code-editor-action").length).toBe(0);
    const buttons: readonly HTMLElement[] = [...first.querySelectorAll<HTMLElement>(".nol-code-editor-action")];
    expect(buttons.map(t => t.querySelector(".nol-code-editor-action-icon")?.textContent ?? null)).toEqual(["check", null]);
    for (const [index, element] of [first, second].entries()) {
      const box: DOMRect = element.getBoundingClientRect();
      const row: DOMRect = view.at(".nol-code-editor-row", index === 0 ? 1 : 4).getBoundingClientRect();
      expect([PageStyle.rem(box.top - row.top), PageStyle.rem(box.height - row.height)]).toEqual([0, 0]);
    }

    expect(view.rowGeometry()).toEqual(DecoratedFixture.stacked(6));
    expect(view.sizerHeight()).toBe(6 * ROW);

    buttons[1]?.click();
    buttons[0]?.click();
    expect(view.actions.map(t => [t.bar, t.action])).toEqual([[bar, skip], [bar, take]]);
  });

  it("fills spacer rows with stripes, or paints them and marks them when given a background and a sign", async () => {
    const view: DecoratedFixture = await DecoratedFixture.renderAsync("a\nb\nc", [new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), new List<CodeInsertedRows>([
      new CodeSpacer(0, 1),
      new CodeSpacer(1, 1, RED, "!", BLUE),
      new CodeSpacer(2, 1, null, "?"),
      new CodeSpacer(2, 0, RED)
    ]))]);

    expect(view.kinds()).toEqual(["spacer", "line", "line", "line", "spacer", "line"]);
    expect(view.texts(".nol-code-editor-line")).toEqual(["", "a", "", "b", "", "c"]);
    expect(view.signs()).toEqual(["", "", "!", "", "?", ""]);
    expect(view.rowGeometry()).toEqual(DecoratedFixture.stacked(6));
    expect(view.sizerHeight()).toBe(6 * ROW);
    expect(view.paints(".nol-code-editor-row", 2)).toEqual([RED]);
    expect(getComputedStyle(view.at(".nol-code-editor-row", 0)).backgroundImage).toContain("repeating-linear-gradient");
    expect(getComputedStyle(view.one(view.at(".nol-code-editor-line-number", 2), ".nol-code-editor-sign")).color).toBe(BLUE);
    expect(getComputedStyle(view.one(view.at(".nol-code-editor-line-number", 4), ".nol-code-editor-sign")).color)
      .toBe(getComputedStyle(view.at(".nol-code-editor-line-number", 4)).color);
  });

  it("shows another document's lines inside the view, numbered by their own lines and painted by their own decorations", async () => {
    const other: TextDocument = TextDocument.fromText(Array.from({ length: 120 }, (_, i) => `other ${i}`).join("\n"));
    const view: DecoratedFixture = await DecoratedFixture.renderAsync("a\nb", [new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), new List<CodeInsertedRows>([
      new CodeEmbeddedLines(1, other, 98, 2, null, new CodeDecorations(new List<CodeLineDecoration>([new CodeLineDecoration(99, 1, RED)]))),
      new CodeEmbeddedLines(2, other, 0, 1)
    ]))]);

    expect(view.kinds()).toEqual(["line", "embedded", "embedded", "line", "embedded"]);
    expect(view.texts(".nol-code-editor-line")).toEqual(["a", "other 98", "other 99", "b", "other 0"]);
    expect(view.numbers()).toEqual(["1", "99", "100", "2", "1"]);
    expect(view.rowGeometry()).toEqual(DecoratedFixture.stacked(5));
    expect(view.sizerHeight()).toBe(5 * ROW);
    expect([1, 2].map(t => view.paints(".nol-code-editor-row", t))).toEqual([[], [RED]]);
    expect(getComputedStyle(view.at(".nol-code-editor-sizer", 0)).getPropertyValue("--nol-code-editor-digits").trim()).toBe("3");
  });

  it("numbers its lines by a set's numbering in a second column, sized for its largest number, with no number where it has none", async () => {
    const view: DecoratedFixture = await DecoratedFixture.renderAsync("a\nb", [
      new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), new List<CodeInsertedRows>(), new OffsetNumbering(12345)),
      new CodeDecorations()
    ]);

    expect(view.numbers()).toEqual(["|1", "101|2"]);
    const digits: string = getComputedStyle(view.at(".nol-code-editor-sizer", 0)).getPropertyValue("--nol-code-editor-digits");
    expect(digits.trim()).toBe("5");
  });

  it("collapses a fold to one labeled row with a toggle, hides the rows inside it, and keeps a toggle on an expanded fold's first line", async () => {
    const lines: string = Array.from({ length: 12 }, (_, i) => `line ${i}`).join("\n");
    const named: CodeFold = new CodeFold(1, 3, true, "Imports");
    const counted: CodeFold = new CodeFold(6, 4, true);
    const view: DecoratedFixture = await DecoratedFixture.renderAsync(lines, [new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), new List<CodeInsertedRows>([new CodeSpacer(2, 1), new CodeSpacer(6, 1)]))],
      [named, counted, new CodeFold(11, 0, true), new CodeFold(11, 0, false)]);

    expect(view.texts(".nol-code-editor-line")).toEqual(["line 0", "Imports", "line 4", "line 5", "", "4 unchanged lines", "line 10", "line 11"]);
    expect(view.kinds()).toEqual(["line", "fold", "line", "line", "spacer", "fold", "line", "line"]);
    expect(view.texts(".nol-code-editor-fold-toggle")).toEqual(["", "chevron_right", "", "", "", "chevron_right", "", ""]);
    expect(view.all(".nol-code-editor-line-fold").length).toBe(2);
    expect(view.rowGeometry()).toEqual(DecoratedFixture.stacked(8));
    expect(view.sizerHeight()).toBe(8 * ROW);
    const icon: DOMRect = view.one(view.at(".nol-code-editor-fold-toggle", 1), ".nol-code-editor-fold-icon").getBoundingClientRect();
    const row: DOMRect = view.at(".nol-code-editor-row", 1).getBoundingClientRect();
    expect([PageStyle.rem(icon.top - row.top), PageStyle.rem(icon.height), PageStyle.rem(icon.width)]).toEqual([0, ROW, 1.5]);

    view.pressRow(1);
    view.one(view.at(".nol-code-editor-fold-toggle", 5), ".nol-code-editor-fold-icon")
      .dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }));
    expect(view.toggles).toEqual([named, counted]);

    const opened: CodeFold = new CodeFold(1, 3, false, "Imports");
    await view.setFoldsAsync([opened, counted]);
    expect(view.texts(".nol-code-editor-line").slice(0, 5)).toEqual(["line 0", "line 1", "", "line 2", "line 3"]);
    expect(view.texts(".nol-code-editor-fold-toggle").slice(0, 3)).toEqual(["", "expand_more", ""]);
    view.one(view.at(".nol-code-editor-fold-toggle", 1), ".nol-code-editor-fold-icon")
      .dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }));
    expect(view.toggles.at(-1)).toBe(opened);

    await view.setFoldsAsync([]);
    expect(view.all(".nol-code-editor-fold-toggle").length).toBe(0);
  });

  it("toggles the innermost open fold around the caret, or the closed fold beside it, from the keyboard, each toggle 1.5rem wide and a row high", async () => {
    const lines: string = Array.from({ length: 12 }, (_, i) => `line ${i}`).join("\n");
    const outer: CodeFold = new CodeFold(0, 8, false);
    const inner: CodeFold = new CodeFold(2, 3, false);
    const closed: CodeFold = new CodeFold(9, 2, true);
    const view: DecoratedFixture = await DecoratedFixture.renderAsync(lines, [], [inner, outer, closed]);

    const folded: KeyboardEvent = view.pressFoldKey(FoldShortcut.Fold, 3);
    view.pressFoldKey(FoldShortcut.Fold, 0);
    view.pressFoldKey(FoldShortcut.Unfold, 8);
    view.pressFoldKey(FoldShortcut.Unfold, 11);
    const missed: KeyboardEvent = view.pressFoldKey(FoldShortcut.Fold, 11);

    expect(view.toggles).toEqual([inner, outer, closed, closed]);
    expect([folded.defaultPrevented, missed.defaultPrevented]).toEqual([true, true]);
    const toggle: DOMRect = view.at(".nol-code-editor-fold-icon", 0).getBoundingClientRect();
    const row: DOMRect = view.at(".nol-code-editor-line-number", 0).getBoundingClientRect();
    expect([PageStyle.rem(toggle.width), PageStyle.rem(toggle.height - row.height), PageStyle.rem(toggle.top - row.top)]).toEqual([1.5, 0, 0]);
  });

  it("draws a collapsed fold inside another as part of it, and a fold past the last line up to that line", async () => {
    const lines: string = Array.from({ length: 20 }, (_, i) => `line ${i}`).join("\n");
    const view: DecoratedFixture = await DecoratedFixture.renderAsync(lines, [],
      [new CodeFold(0, 10, true, "Outer"), new CodeFold(2, 3, true, "Inner"), new CodeFold(15, 10, true, "Tail")]);

    expect(view.texts(".nol-code-editor-line")).toEqual(["Outer", "line 10", "line 11", "line 12", "line 13", "line 14", "Tail"]);
    expect(view.kinds()).toEqual(["fold", "line", "line", "line", "line", "line", "fold"]);
    const sizer: DOMRect = view.one(view.host, ".nol-code-editor-sizer").getBoundingClientRect();
    const first: DOMRect = view.at(".nol-code-editor-row", 0).getBoundingClientRect();
    expect(PageStyle.rem(sizer.height)).toBeCloseTo(PageStyle.rem(first.height) * 7, 5);
  });

  it("takes its font size, line height, gutter width and end, signs and text inset from the public custom properties on its element", async () => {
    const variables: ReadonlyMap<string, string> = new Map<string, string>([
      ["--nol-code-editor-font-size", "1rem"], ["--nol-code-editor-line-height", "1.5rem"], ["--nol-code-editor-gutter-width", "5rem"],
      ["--nol-code-editor-gutter-end", "1rem"], ["--nol-code-editor-signs", "none"], ["--nol-code-editor-inset", "0"]]);
    const view: DecoratedFixture = await DecoratedFixture.renderAsync("a\nb\nc", [new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>([new CodeGutterMarker(0, "!", RED)]))], [], variables);

    const line: HTMLElement = view.at(".nol-code-editor-line", 0);
    const gutter: DOMRect = view.one(view.host, ".nol-code-editor-gutter").getBoundingClientRect();
    const number: DOMRect = view.one(view.at(".nol-code-editor-line-number", 0), ".nol-code-editor-number").getBoundingClientRect();
    expect([PageStyle.rem(Number.parseFloat(getComputedStyle(line).fontSize)), PageStyle.rem(line.getBoundingClientRect().height)]).toEqual([1, 1.5]);
    expect(PageStyle.rem(view.one(view.host, ".nol-code-editor-sizer").getBoundingClientRect().height)).toBe(4.5);
    expect([PageStyle.rem(gutter.width), PageStyle.rem(gutter.right - number.right)]).toEqual([5, 1]);
    expect(view.all(".nol-code-editor-sign").map(t => getComputedStyle(t).display)).toEqual(["none", "none", "none"]);
    expect(PageStyle.rem(DecoratedFixture.columnLeft(line, 0) - gutter.right)).toBeCloseTo(0, 2);
  });

  it("lays a bar across the view's visible width, from its left edge, and keeps it there when the text scrolls sideways", async () => {
    const bar: CodeBar = new CodeBar("wide", 1, "Choose one", null, new List<CodeBarAction>());
    const view: DecoratedFixture = await DecoratedFixture.renderAsync(`${"x".repeat(300)}\nb`, [new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), new List<CodeInsertedRows>([bar]))]);
    const scroller: HTMLElement = view.one(view.host, ".nol-code-editor-scroller");
    const element: HTMLElement = view.one(view.host, ".nol-code-editor-bar");
    const edges: () => readonly number[] = () => {
      const box: DOMRect = element.getBoundingClientRect();
      const visible: DOMRect = scroller.getBoundingClientRect();

      return [PageStyle.rem(box.left - visible.left), PageStyle.rem(box.width - scroller.clientWidth), PageStyle.rem(box.top - view.at(".nol-code-editor-row", 1).getBoundingClientRect().top), PageStyle.rem(box.height)];
    };

    expect(edges()).toEqual([0, 0, 0, ROW]);
    scroller.scrollLeft = 160;
    await DomWait.untilAsync("the decoration follows the horizontal scroll", () => element.style.left === `${scroller.scrollLeft}px`);

    expect(scroller.scrollLeft).toBeGreaterThan(0);
    expect(edges()).toEqual([0, 0, 0, ROW]);
    expect(view.rowGeometry()).toEqual(DecoratedFixture.stacked(3));
  });
});
