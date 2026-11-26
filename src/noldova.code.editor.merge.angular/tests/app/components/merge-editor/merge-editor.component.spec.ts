/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { CoreCommands, type IKeyBindingRule, type ILanguageDefinition, KeyBindingRule, TextPosition } from "@noldova/code.editor";
import { CodeEditorClasses, CodeEditorComponent, CodeEditorRegistries } from "@noldova/code.editor.angular";
import { ConflictChoice, ConflictState } from "@noldova/code.editor.merge";
import { List } from "@noldova/context.collections";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { ActiveConflict } from "../../../../src/app/models/active-conflict.ts";
import { DomWait } from "../../../fixtures/dom-wait.fixture.ts";
import { MergeBaseHost } from "../../../fixtures/merge-base-host.fixture.ts";
import { MergeHeadsHost } from "../../../fixtures/merge-heads-host.fixture.ts";
import { MergeFixture } from "../../../fixtures/merge.fixture.ts";
import { PageStyle } from "../../../fixtures/page-style.fixture.ts";
import { StyleColor } from "../../../fixtures/style-color.fixture.ts";

const LANGUAGE: string = "merged-language";
const SEQUENCE: string = "ctrl+k ctrl+e";
const ROW_KIND_PREFIX: string = `${CodeEditorClasses.row}-`;
const PANELS: string = "nol-merge-editor-panels";

const OURS: string = MergeFixture.ours;
const THEIRS: string = MergeFixture.theirs;

describe("MergeEditorComponent", () => {
  it("shows ours and theirs read-only side by side above the bar and the editable result, with each side's changes and the conflict marked", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nX\nc\n", "a\nY\nc\n");
    await MergeFixture.linesAsync(view, view.result);

    expect(view.texts(view.side(0), ".nol-code-editor-line")).toEqual(["a", "", "X", "c", ""]);
    expect(view.texts(view.side(1), ".nol-code-editor-line")).toEqual(["a", "", "Y", "c", ""]);
    expect(view.texts(view.result, ".nol-code-editor-line")).toEqual(["a", "", "b", "c", ""]);
    expect(view.kinds(view.side(0))).toEqual(["plain", "bar", "ours", "plain", "plain"]);
    expect(view.kinds(view.result)).toEqual(["plain", "bar", "conflict", "plain", "plain"]);
    expect(view.texts(view.result, ".nol-code-editor-line-number")).toEqual(["1", "", "2!", "3", "4"]);
    expect(view.one(view.side(0), "textarea").getAttribute("aria-label")).toBe("onto main");
    expect(view.one(view.side(1), "textarea").getAttribute("aria-label")).toBe("your commit abc1234");
    expect(view.one(view.result, "textarea").getAttribute("aria-label")).toBe("Result");
    expect(view.all(view.host, ".nol-merge-editor-pane textarea").map(t => t.hasAttribute("readonly"))).toEqual([true, true]);
    expect(view.one(view.result, "textarea").hasAttribute("readonly")).toBe(false);
    expect(view.summary).toBe("1 of 1 conflict unresolved");
    expect(view.conflicts).toEqual([["Unresolved"]]);
    expect(view.editor.unresolvedCount()).toBe(1);
    expect(view.editor.dirty()).toBe(false);

    const host: DOMRect = view.box(view.host);
    const left: DOMRect = view.box(view.column(0));
    const right: DOMRect = view.box(view.column(1));
    const bar: DOMRect = view.box(view.one(view.host, ".nol-merge-editor-bar"));
    const result: DOMRect = view.box(view.result);
    expect(PageStyle.rem(left.left - host.left)).toBe(0);
    expect(PageStyle.rem(right.right - host.right)).toBe(0);
    expect(PageStyle.rem(left.top - right.top)).toBe(0);
    expect(PageStyle.rem(right.left - left.right)).toBe(0);
    expect(PageStyle.rem(Math.abs(right.width - left.width))).toBeLessThanOrEqual(PageStyle.rem(Number.parseFloat(getComputedStyle(view.column(1)).borderInlineStartWidth)));
    expect([getComputedStyle(view.column(0)).borderInlineStartWidth, getComputedStyle(view.column(1)).borderInlineStartStyle]).toEqual(["0px", "solid"]);
    expect([PageStyle.rem(view.box(view.side(0)).top - left.top), PageStyle.rem(view.box(view.side(1)).bottom - right.bottom)]).toEqual([0, 0]);
    expect(PageStyle.rem(bar.top - left.bottom)).toBe(0);
    expect(PageStyle.rem(result.top - bar.bottom)).toBe(0);
    expect(PageStyle.rem(result.bottom - host.bottom)).toBe(0);
    expect(PageStyle.rem(bar.width - host.width)).toBe(0);
    expect(result.height / left.height).toBeCloseTo(1.1, 2);
    const conflictRow: HTMLElement = view.all(view.result, ".nol-code-editor-row")[2] ?? view.result;
    expect(getComputedStyle(conflictRow).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(view.one(view.all(view.result, ".nol-code-editor-line-number")[2] ?? view.result, ".nol-code-editor-sign")).color)
      .toBe(PageStyle.styleOf(StyleColor.Text, "--nol-warning", view.result));
    const barStyle: CSSStyleDeclaration = getComputedStyle(view.one(view.host, ".nol-merge-editor-bar"));
    const summary: DOMRect = view.box(view.one(view.host, ".nol-merge-editor-summary"));
    const reset: DOMRect = view.box(view.button("Reset"));
    expect(PageStyle.rem(summary.left - bar.left)).toBe(PageStyle.rem(Number.parseFloat(barStyle.paddingInlineStart)));
    expect(PageStyle.rem(bar.right - reset.right)).toBe(PageStyle.rem(Number.parseFloat(barStyle.paddingInlineEnd)));
    expect(PageStyle.rem(summary.top + summary.height / 2 - (reset.top + reset.height / 2))).toBeCloseTo(0, 2);
  });

  it("passes its language to every pane, the result's too", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nX\nc\n", "a\nY\nc\n");
    view.fixture.componentRef.setInput("language", LANGUAGE);
    await view.fixture.whenStable();
    const languages: readonly (string | ILanguageDefinition | null)[] = view.fixture.debugElement.queryAll(By.directive(CodeEditorComponent))
      .map(t => t.injector.get(CodeEditorComponent).language());

    expect(languages).toEqual([LANGUAGE, LANGUAGE, LANGUAGE]);
  });

  it("runs a key sequence pressed in a pane and tells its owner the pending chord, through the dispatcher its panes share", async () => {
    TestBed.inject(CodeEditorRegistries).registries.keyBindings.setUserRules(new List<IKeyBindingRule>([new KeyBindingRule(CoreCommands.cursorBottom.id, SEQUENCE)]));
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nZ\nc\n", "a\nY\nc\n");
    await MergeFixture.linesAsync(view, view.result);
    const pendings: (string | null)[] = [];
    view.fixture.componentInstance.keySequencePending.subscribe(t => pendings.push(t));
    view.view(view.result).focus();

    await userEvent.keyboard("{Control>}k{/Control}{Control>}e{/Control}");
    await view.fixture.whenStable();
    TestBed.inject(CodeEditorRegistries).registries.keyBindings.setUserRules(new List<IKeyBindingRule>());

    expect(view.view(view.result).caret().line).toBeGreaterThan(0);
    expect(pendings).toEqual([navigator.platform.startsWith("Mac") ? "⌃K" : "Ctrl+K", null]);
  });

  it("accepts a side, both in either order or the base again for the conflict with the caret, as undoable steps it reports and names", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nX\nc\n", "a\nY\nc\n");
    await MergeFixture.linesAsync(view, view.result);
    expect(view.button("Accept theirs").disabled).toBe(true);

    view.click(view.result, 2);
    await view.stableAsync();
    expect(view.actives).toEqual([0]);
    expect(view.button("Accept theirs").disabled).toBe(false);
    view.button("Accept theirs").click();
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nY\nc\n");
    expect(view.results).toEqual(["a\nY\nc\n"]);
    expect(view.conflicts).toEqual([["Unresolved"], ["Theirs"]]);
    expect(view.status).toBe("Conflict 1 of 1, theirs accepted, 0 unresolved");
    expect(view.summary).toBe("0 of 1 conflict unresolved");
    expect(view.kinds(view.result)).toEqual(["plain", "theirs", "plain", "plain"]);
    expect(view.editor.dirty()).toBe(true);
    view.editor.markClean();
    expect(view.editor.dirty()).toBe(false);

    view.button("Both, ours first").click();
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nX\nY\nc\n");
    view.button("Both, theirs first").click();
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nY\nX\nc\n");
    view.button("Accept ours").click();
    await view.stableAsync();
    expect(view.status).toBe("Conflict 1 of 1, ours accepted, 0 unresolved");
    view.button("Reset").click();
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nb\nc\n");
    expect(view.status).toBe("Conflict 1 of 1, unresolved, 1 unresolved");

    view.editor.undo();
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nX\nc\n");
    view.editor.undo();
    view.editor.undo();
    view.editor.undo();
    view.editor.undo();
    view.editor.undo();
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nb\nc\n");
    expect(view.editor.unresolvedCount()).toBe(1);
    view.editor.redo();
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nY\nc\n");
    view.editor.redo();
    view.editor.redo();
    view.editor.redo();
    view.editor.redo();
    view.editor.redo();
    expect(view.editor.result()).toBe("a\nb\nc\n");
  });

  it("bars each conflict on each side across the pane, in the code header's color, with its number, its state and Take, which takes that side", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nX\nc\n", "a\nY\nc\n");
    await MergeFixture.linesAsync(view, view.side(1));

    expect(view.kinds(view.side(1))).toEqual(["plain", "bar", "theirs", "plain", "plain"]);
    expect(view.texts(view.side(1), ".nol-code-editor-line-number")).toEqual(["1", "", "2", "3", "4"]);
    expect(view.all(view.side(1), ".nol-code-editor-change").length).toBe(0);
    expect(getComputedStyle(view.layer(view.side(1), 2)).backgroundColor).toBe(PageStyle.paintOf(THEIRS, view.side(1)));
    expect(PageStyle.rem(view.box(view.layer(view.side(1), 2)).height - view.box(view.all(view.side(1), ".nol-code-editor-row")[2] ?? view.side(1)).height)).toBe(0);
    expect(view.texts(view.side(1), ".nol-code-editor-bar-note")).toEqual(["Conflict 1 \u00b7 unresolved"]);
    expect(MergeFixture.labels(view.side(1))).toEqual(["Take"]);
    const pane: DOMRect = view.box(view.one(view.side(1), ".nol-code-editor-scroller"));
    const scroller: HTMLElement = view.one(view.side(1), ".nol-code-editor-scroller");
    const barElement: HTMLElement = view.one(view.side(1), ".nol-code-editor-bar");
    const bar: DOMRect = view.box(barElement);
    const row: DOMRect = view.box(view.all(view.side(1), ".nol-code-editor-row")[1] ?? view.side(1));
    const note: DOMRect = view.box(view.one(view.side(1), ".nol-code-editor-bar-note"));
    const takeElement: HTMLElement = view.one(view.side(1), ".nol-code-editor-action");
    const take: DOMRect = view.box(takeElement);
    const icon: HTMLElement = view.one(takeElement, ".nol-code-editor-action-icon");
    expect([PageStyle.rem(bar.left - pane.left), PageStyle.rem(bar.width - scroller.clientWidth), PageStyle.rem(bar.top - row.top), PageStyle.rem(bar.height)]).toEqual([0, 0, 0, 1.25]);
    expect([PageStyle.rem(note.left - bar.left), PageStyle.rem(bar.right - take.right), PageStyle.rem(take.height), PageStyle.rem(take.top - bar.top)]).toEqual([0.75, 0.75, 1.25, 0]);
    expect(PageStyle.rem(take.left - note.right)).toBe(0.375);
    expect([icon.textContent, getComputedStyle(icon).fontSize, getComputedStyle(takeElement).fontSize, getComputedStyle(barElement).fontSize]).toEqual(["add", "14px", "12px", "12px"]);
    expect(getComputedStyle(barElement).backgroundColor).toBe(PageStyle.styleOf(StyleColor.Background, "--nol-code-header", view.side(1)));
    expect(getComputedStyle(barElement).color).toBe(PageStyle.styleOf(StyleColor.Text, "--nol-text-muted", view.side(1)));
    expect(getComputedStyle(takeElement).backgroundColor).toBe(PageStyle.styleOf(StyleColor.Background, "--nol-panel", view.side(1)));
    expect(PageStyle.rem(Number.parseFloat(getComputedStyle(takeElement, "::before").height))).toBe(1.5);

    const caret: TextPosition = view.view(view.side(1)).caret();
    takeElement.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }));
    takeElement.click();
    await view.stableAsync();
    expect(view.view(view.side(1)).caret()).toEqual(caret);
    expect(view.editor.result()).toBe("a\nY\nc\n");
    expect(view.status).toBe("Conflict 1 of 1, theirs accepted, 0 unresolved");
    expect(view.texts(view.side(0), ".nol-code-editor-bar-note")).toEqual(["Conflict 1 \u00b7 theirs accepted"]);
    view.one(view.side(0), ".nol-code-editor-action").click();
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nX\nc\n");
  });

  it("keeps a bar across the pane's visible width when the pane scrolls sideways", async () => {
    const long: string = "x".repeat(400);
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\n", `${long}\nX\n`, `${long}\nY\n`);
    await MergeFixture.linesAsync(view, view.side(0));
    const scroller: HTMLElement = view.one(view.side(0), ".nol-code-editor-scroller");

    scroller.scrollLeft = 200;
    scroller.dispatchEvent(new Event("scroll"));
    await view.stableAsync();

    const pane: DOMRect = view.box(scroller);
    const bar: DOMRect = view.box(view.one(view.side(0), ".nol-code-editor-bar"));
    expect([PageStyle.rem(bar.left - pane.left), PageStyle.rem(bar.width - scroller.clientWidth)]).toEqual([0, 0]);
  });

  it("puts each pane's line numbers in a 2.75rem gutter, 0.75rem before its edge, on 1.25rem lines of 13px text", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nX\nc\n", "a\nY\nc\n");
    await MergeFixture.linesAsync(view, view.result);

    for (const pane of [view.side(0), view.side(1), view.result]) {
      const gutter: DOMRect = view.box(view.one(pane, ".nol-code-editor-gutter"));
      const number: HTMLElement = view.one(pane, ".nol-code-editor-line-number");
      const line: HTMLElement = view.one(pane, ".nol-code-editor-line");
      expect([PageStyle.rem(gutter.width), PageStyle.rem(gutter.right - view.box(number).right), PageStyle.rem(view.box(number).height), PageStyle.rem(view.box(line).height)]).toEqual([2.75, 0.75, 1.25, 1.25]);
      expect(PageStyle.rem(view.box(line).left - gutter.right)).toBe(0);
      expect([getComputedStyle(number).textAlign, getComputedStyle(line).fontSize]).toEqual(["end", "13px"]);
      expect(view.all(pane, ".nol-code-editor-sign").map(t => getComputedStyle(t).display)).toEqual(view.all(pane, ".nol-code-editor-sign").map(() => "none"));
      expect(getComputedStyle(view.one(pane, ".nol-code-editor-gutter")).color).toBe(PageStyle.styleOf(StyleColor.Text, "--nol-text-muted", pane));
    }
    const first: HTMLElement = view.one(view.result, ".nol-code-editor-line");
    const range: Range = document.createRange();
    range.selectNodeContents(first);
    const text: DOMRect = range.getBoundingClientRect();
    view.one(view.result, ".nol-code-editor-scroller").dispatchEvent(new MouseEvent("mousedown",
      { clientX: text.left + text.width * 0.75, clientY: text.top + text.height / 2, bubbles: true, cancelable: true, button: 0 }));
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    expect(view.view(view.result).caret()).toEqual(new TextPosition(0, 1));
  });

  it("colors the result's lines by the side they came from, and bars an open conflict with its choices", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nX\nc\n", "a\nY\nc\n");
    await MergeFixture.linesAsync(view, view.result);
    const row: (index: number) => HTMLElement = index => view.all(view.result, ".nol-code-editor-row")[index] ?? view.result;
    const barElement: HTMLElement = view.one(view.result, ".nol-code-editor-bar");
    expect(getComputedStyle(barElement).backgroundColor).toBe(PageStyle.paintOf("color-mix(in srgb, var(--nol-warning) 18%, transparent)", view.result));
    expect(getComputedStyle(barElement).color).toBe(PageStyle.styleOf(StyleColor.Text, "--nol-text", view.result));
    const warning: HTMLElement = view.one(barElement, ".nol-code-editor-bar-icon");
    expect([warning.textContent, getComputedStyle(warning).color]).toEqual(["warning", PageStyle.styleOf(StyleColor.Text, "--nol-warning", view.result)]);
    expect(view.texts(view.result, ".nol-code-editor-bar-note")).toEqual(["Conflict 1 is open. Take ours, theirs or both, or type the result here."]);
    expect(MergeFixture.labels(view.result)).toEqual(["Ours", "Theirs", "Both"]);
    expect(PageStyle.rem(view.box(view.button("Ours")).top - view.box(row(1)).top)).toBe(0);

    view.button("Both").click();
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nX\nY\nc\n");
    expect(view.kinds(view.result)).toEqual(["plain", "ours", "theirs", "plain", "plain"]);
    expect(getComputedStyle(view.layer(view.result, 1)).backgroundColor).toBe(PageStyle.paintOf(OURS, view.result));
    expect(getComputedStyle(view.layer(view.result, 2)).backgroundColor).toBe(PageStyle.paintOf(THEIRS, view.result));
    expect(view.all(view.result, ".nol-code-editor-bar").length).toBe(0);
    view.editor.accept(0, ConflictChoice.BothTheirsFirst);
    await view.stableAsync();
    expect(view.kinds(view.result)).toEqual(["plain", "theirs", "ours", "plain", "plain"]);
    view.editor.setConflictText(0, "S\n");
    await view.stableAsync();
    expect(view.kinds(view.result)).toEqual(["plain", "mixed", "plain", "plain"]);
    expect(getComputedStyle(view.layer(view.result, 1)).backgroundImage).toContain("linear-gradient");

    view.editor.reset(0);
    await view.stableAsync();
    expect(MergeFixture.labels(view.result)).toEqual(["Ours", "Theirs", "Both", "Suggested"]);
    const suggested: HTMLElement = view.all(view.result, ".nol-code-editor-action")[3] ?? view.result;
    expect(view.one(suggested, ".nol-code-editor-action-icon").textContent).toBe("auto_awesome");
    suggested.click();
    await view.stableAsync();
    expect([view.editor.result(), view.status]).toEqual(["a\nS\nc\n", "Conflict 1 of 1, suggested, 0 unresolved"]);
    view.editor.reset(0);
    await view.stableAsync();
    view.button("Theirs").click();
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nY\nc\n");
    view.editor.reset(0);
    await view.stableAsync();
    view.button("Ours").click();
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nX\nc\n");
  });

  it("puts a side's chunk bar where that side's text starts a line, above the next line where the side deleted it, and none where it lacks it", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "aX\na\nX\nc\n", "a\nZ\nc\n",
      "a\n<<<<<<< HEAD\nX\n||||||| base\nb\n=======\nY\n>>>>>>> topic\nc\n");
    await MergeFixture.linesAsync(view, view.side(0));
    expect(view.texts(view.side(0), ".nol-code-editor-line")).toEqual(["aX", "a", "", "X", "c", ""]);
    expect(view.kinds(view.side(0))).toEqual(["plain", "plain", "bar", "ours", "plain", "plain"]);
    expect(view.kinds(view.side(1))).not.toContain("bar");

    const deleted: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nc\n", "a\nY\nc\n");
    await MergeFixture.linesAsync(deleted, deleted.side(0));
    expect(deleted.texts(deleted.side(0), ".nol-code-editor-line")).toEqual(["a", "", "c", ""]);
    expect(deleted.kinds(deleted.side(0))).toEqual(["plain", "bar", "plain", "plain"]);
  });

  it("marks a text its owner sets as suggested, and accepts one side for every unresolved conflict at once", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\nd\ne\n", "a\nX1\nc\nX2\ne\n", "a\nY1\nc\nY2\ne\n");
    await MergeFixture.linesAsync(view, view.result);
    expect(view.summary).toBe("2 of 2 conflicts unresolved");

    view.editor.setConflictText(1, "Z\n");
    await view.stableAsync();
    expect(view.status).toBe("Conflict 2 of 2, suggested, 1 unresolved");
    view.editor.acceptAll(ConflictChoice.Theirs);
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nY1\nc\nZ\ne\n");
    expect(view.conflicts.at(-1)).toEqual(["Theirs", "Suggested"]);
    expect(view.editor.unresolvedCount()).toBe(0);
  });

  it("steps through the conflicts with Alt and Down or Up, from the caret, naming each, and says when there is none further", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\nd\ne", "a\nX1\nc\nX2\ne", "a\nY1\nc\nY2\ne");
    await MergeFixture.linesAsync(view, view.result);
    const others: readonly KeyboardEventInit[] = [{ ctrlKey: true, key: "ArrowDown" }, { shiftKey: true, key: "ArrowDown" }, { metaKey: true, key: "ArrowDown" },
      { key: "ArrowLeft" }];
    for (const init of others)
      view.host.dispatchEvent(new KeyboardEvent("keydown", { ...init, altKey: true, bubbles: true }));
    expect(view.status).toBe("");
    expect(view.editor.result()).toBe("a\nb\nc\nd\ne");
    view.editor.focus();
    view.caretAt(0, 0);
    await view.stableAsync();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await view.stableAsync();
    expect(view.view(view.result).caret()).toEqual(new TextPosition(1, 0));
    expect(view.status).toBe("Conflict 1 of 2, unresolved, 2 unresolved");
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await view.stableAsync();
    expect(view.view(view.result).caret()).toEqual(new TextPosition(3, 0));
    expect(view.actives).toEqual([0, 1]);
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(view.status).toBe("No more conflicts");
    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    await view.stableAsync();
    expect(view.view(view.result).caret()).toEqual(new TextPosition(1, 0));

    view.caretAt(4, 1);
    await view.stableAsync();
    view.editor.previousConflict();
    await view.stableAsync();
    expect(view.view(view.result).caret()).toEqual(new TextPosition(3, 0));
    view.caretAt(0, 0);
    await view.stableAsync();
    view.editor.previousConflict();
    await view.stableAsync();
    expect(view.status).toBe("No more conflicts");
    view.editor.nextConflict();
    await view.stableAsync();
    expect(view.view(view.result).caret()).toEqual(new TextPosition(1, 0));
    view.editor.revealConflict(1);
    await view.stableAsync();
    expect(view.view(view.result).caret()).toEqual(new TextPosition(3, 0));
    expect(view.status).toBe("Conflict 2 of 2, unresolved, 2 unresolved");

    view.editor.focus();
    view.caretAt(0, 0);
    await view.stableAsync();
    const reported: number = view.conflicts.length;
    await userEvent.keyboard("z");
    await view.stableAsync();
    expect(view.editor.result()).toBe("za\nb\nc\nd\ne");
    expect(view.results).toEqual(["za\nb\nc\nd\ne"]);
    expect(view.conflicts.length).toBe(reported);
  });

  it("exposes the conflict with the caret, its base, its state and the result's lines it covers as they change, and none away from a conflict",
    async () => {
      const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\nd\ne\n", "a\nX1\nc\nX2\nX3\ne\n", "a\nY1\nc\nY2\ne\n");
      await MergeFixture.linesAsync(view, view.result);
      expect(view.editor.activeConflict()).toBeNull();

      view.editor.revealConflict(1);
      await view.stableAsync();
      expect(view.editor.activeConflict()).toEqual(new ActiveConflict(1, 2, "d\n", ConflictState.Unresolved, 3, 3));
      view.editor.accept(1, ConflictChoice.Ours);
      view.editor.revealConflict(1);
      await view.stableAsync();
      expect(view.editor.activeConflict()).toEqual(new ActiveConflict(1, 2, "d\n", ConflictState.Ours, 3, 4));
      view.caretAt(0, 0);
      await view.stableAsync();
      expect([view.editor.activeConflict(), view.actives]).toEqual([null, [1, null]]);
    });

  it("exposes a conflict both sides added with no base as having no base, on the one line it starts at", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync(null, "x\n", "y\n");
    await MergeFixture.linesAsync(view, view.result);

    view.editor.revealConflict(0);
    await view.stableAsync();

    expect(view.editor.activeConflict()).toEqual(new ActiveConflict(0, 1, null, ConflictState.Unresolved, 0, 0));
  });

  it("says there are no conflicts when the sides merge cleanly", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "A\nb\nc\n", "a\nb\nC\n");
    await MergeFixture.linesAsync(view, view.result);

    expect(view.editor.result()).toBe("A\nb\nC\n");
    expect(view.summary).toBe("No conflicts");
    view.editor.nextConflict();
    await view.stableAsync();
    expect(view.status).toBe("No conflicts");
    expect(view.conflicts).toEqual([[]]);
  });

  it("marks a conflict that adds on both sides with no base as an empty row, and the file's last line when it has no break", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync(null, "x\n", "y\n");
    await MergeFixture.linesAsync(view, view.result);

    expect(view.texts(view.result, ".nol-code-editor-line-number")).toEqual(["", "!", "1"]);
    expect(view.kinds(view.result)).toEqual(["bar", "conflict", "plain"]);
    const rows: readonly HTMLElement[] = view.all(view.result, ".nol-code-editor-row");
    expect(PageStyle.rem(view.box(rows[2] ?? view.result).top - view.box(rows[1] ?? view.result).bottom)).toBe(0);
    view.editor.accept(0, ConflictChoice.Ours);
    await view.stableAsync();
    expect(view.kinds(view.result)).toEqual(["ours", "plain"]);

    const last: MergeFixture = await MergeFixture.renderAsync("a\nb", "a\nX", "a\nY");
    await MergeFixture.linesAsync(last, last.result);
    expect(last.kinds(last.result)).toEqual(["plain", "bar", "conflict"]);
    last.editor.accept(0, ConflictChoice.BothOursFirst);
    await last.stableAsync();
    expect([last.editor.result(), last.kinds(last.result)]).toEqual(["a\nX\nY", ["plain", "ours", "theirs"]]);

    const emptied: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nc\n", "a\nY\nc\n");
    await MergeFixture.linesAsync(emptied, emptied.result);
    emptied.editor.accept(0, ConflictChoice.Ours);
    await emptied.stableAsync();
    expect([emptied.editor.result(), emptied.kinds(emptied.result)]).toEqual(["a\nc\n", ["plain", "ours", "plain", "plain"]]);
    expect(emptied.texts(emptied.result, ".nol-code-editor-line-number")).toEqual(["1", "", "2", "3"]);
    const filler: HTMLElement = emptied.all(emptied.result, ".nol-code-editor-row")[1] ?? emptied.result;
    expect(PageStyle.rem(emptied.box(emptied.layer(emptied.result, 1)).height - emptied.box(filler).height)).toBe(0);
  });

  it("takes its conflicts from Git's merged file, and shows the line its markers break at in place of the merge", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nX\nc\n", "a\nY\nc\n",
      "a\n<<<<<<< HEAD\nX\n||||||| base\nb\n=======\nY\n>>>>>>> topic\nc\n");
    await MergeFixture.linesAsync(view, view.result);
    expect(view.editor.result()).toBe("a\nb\nc\n");
    expect(view.editor.unresolvedCount()).toBe(1);

    const broken: MergeFixture = await MergeFixture.renderAsync("a\n", "X\n", "Y\n", "a\n<<<<<<< HEAD\nX\n");
    const alert: HTMLElement = broken.one(broken.host, "[role=alert]");
    expect(alert.textContent).toBe("The conflict markers don't parse at line 2: the conflict that starts here has no end marker.");
    expect(broken.failures.map(t => t.line)).toEqual([2]);
    expect(broken.all(broken.host, "noldova-code-editor").length).toBe(0);
    expect(broken.editor.result()).toBeNull();
    expect(broken.editor.unresolvedCount()).toBe(0);
    expect(getComputedStyle(alert).backgroundColor).toBe(PageStyle.styleOf(StyleColor.Background, "--nol-error-background", broken.host));
    expect(PageStyle.rem(broken.box(alert).width - broken.box(broken.host).width)).toBe(0);
  });

  it("shows the side that is left, read-only, under a note naming the side that deleted the file, and takes no merge actions", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\n", null, "b\n");
    await MergeFixture.linesAsync(view, view.result);

    const note: HTMLElement = view.one(view.host, "[role=note]");
    expect(note.textContent).toBe("onto main: this side deleted the file.");
    expect(view.texts(view.result, ".nol-code-editor-line")).toEqual(["b", ""]);
    expect(view.one(view.result, "textarea").getAttribute("aria-label")).toBe("your commit abc1234");
    expect(view.one(view.result, "textarea").hasAttribute("readonly")).toBe(true);
    expect(view.all(view.host, ".nol-merge-editor-bar").length).toBe(0);
    expect(PageStyle.rem(view.box(view.result).top - view.box(note).bottom)).toBe(0);
    expect(getComputedStyle(note).backgroundColor).toBe(PageStyle.styleOf(StyleColor.Background, "--nol-warning-background", view.host));

    view.editor.accept(0, ConflictChoice.Ours);
    view.editor.acceptAll(ConflictChoice.Ours);
    view.editor.reset(0);
    view.editor.setConflictText(0, "x");
    view.editor.revealConflict(0);
    view.editor.nextConflict();
    view.editor.previousConflict();
    view.editor.undo();
    view.editor.redo();
    view.editor.focus();
    view.view(view.result).focus();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(view.editor.result()).toBeNull();
    expect(view.editor.unresolvedCount()).toBe(0);
    expect(view.editor.dirty()).toBe(false);
    expect(view.status).toBe("");
    expect(view.conflicts).toEqual([[]]);

    const other: MergeFixture = await MergeFixture.renderAsync("a\n", "c\n", null);
    await MergeFixture.linesAsync(other, other.result);
    expect(other.one(other.host, "[role=note]").textContent).toBe("your commit abc1234: this side deleted the file.");
    expect(other.texts(other.result, ".nol-code-editor-line")).toEqual(["c", ""]);
  });

  it("leaves out the bar between the sides and the result when its owner turns the toolbar off", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nX\nc\n", "a\nY\nc\n");
    await MergeFixture.linesAsync(view, view.result);
    expect(view.all(view.host, ".nol-merge-editor-bar").length).toBe(1);

    view.fixture.componentRef.setInput("toolbar", false);
    await view.stableAsync();

    expect(view.all(view.host, ".nol-merge-editor-bar").length).toBe(0);
    expect(PageStyle.rem(view.box(view.result).top - view.box(view.side(0)).bottom)).toBe(0);
    expect(PageStyle.rem(view.box(view.result).bottom - view.box(view.host).bottom)).toBe(0);
    view.button("Theirs").click();
    await view.stableAsync();
    expect(view.editor.result()).toBe("a\nY\nc\n");
  });

  it("puts each projected head at the top of its side and of the result, the full width of its card, with the code right below it", async () => {
    const fixture: ComponentFixture<MergeHeadsHost> = TestBed.createComponent(MergeHeadsHost);
    fixture.nativeElement.style.display = "flex";
    fixture.nativeElement.style.height = "30rem";
    fixture.nativeElement.style.width = "48rem";
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const box = (selector: string): DOMRect => (host.querySelector(selector) ?? host).getBoundingClientRect();
    const edge = (selector: string, side: string): number => Number.parseFloat(getComputedStyle(host.querySelector(selector) ?? host).getPropertyValue(`border-${side}-width`));
    await DomWait.untilAsync("the result's lines render", () => host.querySelectorAll(".nol-merge-editor-result .nol-code-editor-line").length > 0);

    const pairs: readonly (readonly string[])[] = [[".ours-head", ".nol-merge-editor-side:nth-child(1)", ".nol-merge-editor-side:nth-child(1) .nol-merge-editor-pane"],
      [".theirs-head", ".nol-merge-editor-side:nth-child(2)", ".nol-merge-editor-side:nth-child(2) .nol-merge-editor-pane"],
      [".result-head", ".nol-merge-editor-output", ".nol-merge-editor-result"]];
    expect(pairs.map(([head = "", card = "", code = ""]) => [PageStyle.rem(box(head).top - box(card).top), PageStyle.rem(box(head).left - box(card).left - edge(card, "left")), PageStyle.rem(box(head).width - box(card).width + edge(card, "left") + edge(card, "right")),
      PageStyle.rem(box(code).top - box(head).bottom), PageStyle.rem(box(head).height)])).toEqual(pairs.map(() => [0, 0, 0, 0, 2]));
    expect([...host.querySelectorAll(".ours-head, .theirs-head, .result-head")].map(t => t.textContent)).toEqual(["Onto main", "Your commit", "Result"]);
  });

  it("shows the base read-only between ours and theirs when its owner turns it on, each conflict's base lines under a bar with no choice, under its projected head",
    async () => {
      const fixture: ComponentFixture<MergeBaseHost> = TestBed.createComponent(MergeBaseHost);
      fixture.nativeElement.style.display = "flex";
      fixture.nativeElement.style.height = "30rem";
      fixture.nativeElement.style.width = "48rem";
      fixture.autoDetectChanges();
      await fixture.whenStable();
      const host: HTMLElement = fixture.nativeElement;
      const columns = (): readonly HTMLElement[] => [...host.querySelectorAll<HTMLElement>(".nol-merge-editor-side")];
      const before: readonly number[] = [columns().length, host.querySelectorAll(".base-head").length];

      fixture.componentInstance.showBase.set(true);
      await fixture.whenStable();
      const base: HTMLElement = host.querySelector<HTMLElement>(".nol-merge-editor-base") ?? host;
      await DomWait.untilAsync("the base's lines render", () => base.querySelectorAll(".nol-code-editor-line").length > 0);
      const rows: readonly string[] = [...base.querySelectorAll(`.${CodeEditorClasses.row}`)].map(t => [...t.classList].find(c => c.startsWith(ROW_KIND_PREFIX))?.slice(ROW_KIND_PREFIX.length) ?? "");
      const boxes: readonly DOMRect[] = columns().map(t => (t.querySelector(".nol-merge-editor-pane") ?? t).getBoundingClientRect());
      const head: DOMRect = (base.querySelector(".base-head") ?? base).getBoundingClientRect();
      const code: DOMRect = (base.querySelector(".nol-merge-editor-pane") ?? base).getBoundingClientRect();

      expect(before).toEqual([2, 0]);
      expect([columns().indexOf(base), columns().length]).toEqual([1, 3]);
      expect(boxes.map(t => Math.round(t.width - (boxes[0]?.width ?? 0)))).toEqual([0, 0, 0]);
      expect([PageStyle.rem(head.top - base.getBoundingClientRect().top), PageStyle.rem(code.top - head.bottom), base.querySelector(".base-head")?.textContent]).toEqual([0, 0, "Base"]);
      expect(rows).toEqual(["line", "bar", "line", "line", "line"]);
      expect([...base.querySelectorAll(".nol-code-editor-line-number")].map(t => t.textContent)).toEqual(["1", "", "2", "3", "4"]);
      expect([...base.querySelectorAll(".nol-code-editor-bar-note")].map(t => t.textContent)).toEqual(["Conflict 1 \u00b7 unresolved"]);
      expect([MergeFixture.labels(base), base.querySelector(".nol-code-editor-input")?.getAttribute("aria-label")]).toEqual([[], "Base"]);

      fixture.componentInstance.showBase.set(false);
      await fixture.whenStable();
      expect([columns().length, host.querySelector(".nol-merge-editor-base")]).toEqual([2, null]);
    });

  it("shows an empty base when both sides added the text, so there is no base", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync(null, "x\n", "y\n");
    view.fixture.componentRef.setInput("showBase", true);
    await view.stableAsync();
    const base: HTMLElement = view.one(view.host, ".nol-merge-editor-base");
    await MergeFixture.linesAsync(view, base);

    expect([view.view(view.side(1)).document().text(), view.side(1).closest(".nol-merge-editor-base") === base]).toEqual(["", true]);
  });

  it("draws each side and the result as a card on a clear ground with the gap its owner sets, when its owner turns panels on", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nX\nc\n", "a\nY\nc\n");
    await MergeFixture.linesAsync(view, view.result);
    const plain: readonly string[] = [getComputedStyle(view.host).backgroundColor, getComputedStyle(view.column(0)).borderTopWidth, getComputedStyle(view.output).borderTopLeftRadius];

    view.host.style.setProperty("--nol-merge-editor-gap", "0.5rem");
    view.fixture.componentRef.setInput("panels", true);
    await view.stableAsync();

    const cards: readonly HTMLElement[] = [view.column(0), view.column(1), view.output];
    const probe: HTMLElement = document.createElement("span");
    view.host.append(probe);
    probe.style.color = "var(--nol-card-border)";
    const border: string = getComputedStyle(probe).color;
    probe.style.color = "var(--nol-panel)";
    const panel: string = getComputedStyle(probe).color;
    probe.style.color = "var(--nol-code)";
    const code: string = getComputedStyle(probe).color;
    probe.remove();
    const left: DOMRect = view.box(view.column(0));
    const right: DOMRect = view.box(view.column(1));
    const bar: DOMRect = view.box(view.one(view.host, ".nol-merge-editor-bar"));
    const output: DOMRect = view.box(view.output);
    expect(plain).toEqual([code, "0px", "0px"]);
    expect(view.host.classList.contains(PANELS)).toBe(true);
    expect(getComputedStyle(view.host).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(cards.map(t => [getComputedStyle(t).borderTopWidth, getComputedStyle(t).borderBottomColor, getComputedStyle(t).borderTopLeftRadius, getComputedStyle(t).backgroundColor]))
      .toEqual(cards.map(() => ["1px", border, "8px", panel]));
    expect([PageStyle.rem(right.left - left.right), PageStyle.rem(bar.top - left.bottom), PageStyle.rem(output.top - bar.bottom), PageStyle.rem(output.bottom - view.box(view.host).bottom)]).toEqual([0.5, 0.5, 0.5, 0]);
    expect(PageStyle.rem(right.width - left.width)).toBe(0);
  });

  it("keeps the result and the choices closed when read-only", async () => {
    const view: MergeFixture = await MergeFixture.renderAsync("a\nb\nc\n", "a\nX\nc\n", "a\nY\nc\n", null, true);
    await MergeFixture.linesAsync(view, view.result);

    view.click(view.result, 1);
    await view.stableAsync();
    expect(view.actives).toEqual([0]);
    expect(view.one(view.result, "textarea").hasAttribute("readonly")).toBe(true);
    expect(["Accept ours", "Accept theirs", "Both, ours first", "Both, theirs first", "Reset"].map(t => view.button(t).disabled)).toEqual([true, true, true, true, true]);
    expect([view.kinds(view.side(0))[1], view.kinds(view.result)[1], view.all(view.host, ".nol-code-editor-bar").length, view.all(view.host, ".nol-code-editor-action").length])
      .toEqual(["bar", "bar", 3, 0]);

    view.editor.accept(0, ConflictChoice.Ours);
    view.editor.acceptAll(ConflictChoice.Theirs);
    view.editor.setConflictText(0, "Z\n");
    view.editor.reset(0);
    await view.stableAsync();
    expect([view.editor.result(), view.editor.unresolvedCount(), view.editor.dirty()]).toEqual(["a\nb\nc\n", 1, false]);
  });
});
