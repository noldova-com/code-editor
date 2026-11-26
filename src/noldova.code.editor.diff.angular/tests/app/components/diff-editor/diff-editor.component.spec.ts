/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { TestBed } from "@angular/core/testing";
import { BuiltInTokenTypes, CommandContext, ConditionValues, CoreConditions, EditorFeatureSet, type IKeyBindingRule, KeyBindingRule, TextEdit, TextPosition, TextRange,
  TextSelection, UndoHistory } from "@noldova/code.editor";
import { CodeEditorClasses, CodeEditorRegistries } from "@noldova/code.editor.angular";
import { List } from "@noldova/context.collections";
import { describe, expect, it, type MockInstance, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { DiffEditorComponent } from "../../../../src/app/components/diff-editor/diff-editor.component.ts";
import { DiffLayout } from "../../../../src/app/enums/diff-layout.ts";
import { DiffEditorClasses } from "../../../../src/app/services/diff-editor-classes.ts";
import { DiffEditorCommands } from "../../../../src/app/services/diff-editor-commands.ts";
import { DiffEditorFeatures } from "../../../../src/app/services/diff-editor-features.ts";
import { DiffEditorRegistries } from "../../../../src/app/services/diff-editor-registries.ts";
import { DiffEditorSettings } from "../../../../src/app/services/diff-editor-settings.ts";
import { DiffWorker } from "../../../../src/app/services/diff-worker.ts";
import { Resources } from "../../../../src/resources.ts";
import { CommentTokenizer } from "../../../fixtures/comment-tokenizer.fixture.ts";
import { DiffInputs } from "../../../fixtures/diff-inputs.fixture.ts";
import { DiffPresses } from "../../../fixtures/diff-presses.fixture.ts";
import { DiffSelectors } from "../../../fixtures/diff-selectors.fixture.ts";
import { DiffValues } from "../../../fixtures/diff-values.fixture.ts";
import { DiffFixture } from "../../../fixtures/diff.fixture.ts";
import { DomWait } from "../../../fixtures/dom-wait.fixture.ts";
import { KeywordTokenizer } from "../../../fixtures/keyword-tokenizer.fixture.ts";
import { PageStyle } from "../../../fixtures/page-style.fixture.ts";
import { StyleColor } from "../../../fixtures/style-color.fixture.ts";
import { RowKind } from "../../../fixtures/row-kind.fixture.ts";

describe(DiffEditorComponent.name, () => {
  it("shows the two texts side by side, row for row, with removed and added lines, their signs, their changed characters and filler rows", async () => {
    const view: DiffFixture = await DiffFixture.renderAsync("a\nb\nc\nd\ne", "a\nB\nB2\nc\ne", DiffLayout.SideBySide);

    expect(view.texts(0, DiffSelectors.line)).toEqual(["a", "b", "", "c", "d", "e"]);
    expect(view.texts(1, DiffSelectors.line)).toEqual(["a", "B", "B2", "c", "", "e"]);
    expect(view.texts(0, DiffSelectors.lineNumber)).toEqual(["1", "2-", "", "3", "4-", "5"]);
    expect(view.texts(1, DiffSelectors.lineNumber)).toEqual(["1", "2+", "3+", "4", "", "5"]);
    expect(view.kinds(0)).toEqual([RowKind.Plain, RowKind.Removed, RowKind.Spacer, RowKind.Plain, RowKind.Removed, RowKind.Plain]);
    expect(view.kinds(1)).toEqual([RowKind.Plain, RowKind.Added, RowKind.Added, RowKind.Plain, RowKind.Spacer, RowKind.Plain]);
    for (let row: number = 0; row < 6; row++) {
      const top: number = view.box(0, DiffSelectors.line, row).top;
      expect(PageStyle.rem(view.box(1, DiffSelectors.line, row).top - top)).toBe(0);
      expect(PageStyle.rem(view.box(0, DiffSelectors.row, row).top - top)).toBe(0);
      expect(PageStyle.rem(view.box(0, DiffSelectors.lineNumber, row).top - top)).toBe(0);
    }
    const left: HTMLElement = view.pane(0);
    const right: HTMLElement = view.pane(1);
    const removedRow: HTMLElement = view.all(left, DiffSelectors.row)[1] ?? left;
    const addedRow: HTMLElement = view.all(right, DiffSelectors.row)[1] ?? right;
    expect(getComputedStyle(view.one(removedRow, DiffSelectors.paint)).backgroundColor).toBe(PageStyle.paintOf(Resources.removedBackground, left));
    expect(getComputedStyle(view.one(addedRow, DiffSelectors.paint)).backgroundColor).toBe(PageStyle.paintOf(Resources.addedBackground, right));
    expect(PageStyle.rem(view.one(removedRow, DiffSelectors.paint).getBoundingClientRect().height - removedRow.getBoundingClientRect().height)).toBe(0);
    expect(PageStyle.rem(view.one(removedRow, DiffSelectors.paint).getBoundingClientRect().width - removedRow.getBoundingClientRect().width)).toBe(0);
    expect(getComputedStyle(view.all(left, DiffSelectors.row)[2] ?? left).backgroundImage).toContain("repeating-linear-gradient");
    const removedGutter: HTMLElement = view.all(left, DiffSelectors.lineNumber)[1] ?? left;
    const addedGutter: HTMLElement = view.all(right, DiffSelectors.lineNumber)[1] ?? right;
    expect(getComputedStyle(view.one(removedGutter, DiffSelectors.sign)).color).toBe(PageStyle.colorOf(StyleColor.Text, Resources.removedColor, left));
    expect(getComputedStyle(view.one(addedGutter, DiffSelectors.sign)).color).toBe(PageStyle.colorOf(StyleColor.Text, Resources.addedColor, right));
    expect(getComputedStyle(view.one(removedGutter, DiffSelectors.paint)).backgroundColor).toBe(PageStyle.paintOf(Resources.removedBackground, left));

    const removedChange: HTMLElement = view.one(left, DiffSelectors.change);
    expect(view.all(left, DiffSelectors.change).length).toBe(1);
    expect(getComputedStyle(removedChange).backgroundColor).toBe(PageStyle.paintOf(Resources.removedChange, left));
    const removedText: DOMRect = view.box(0, DiffSelectors.lineSpan, 1);
    expect(PageStyle.rem(removedChange.getBoundingClientRect().left - removedText.left)).toBe(0);
    expect(PageStyle.rem(removedChange.getBoundingClientRect().width - removedText.width)).toBeCloseTo(0, 2);
    expect(PageStyle.rem(removedChange.getBoundingClientRect().top - view.box(0, DiffSelectors.line, 1).top)).toBe(0);
    const addedChanges: readonly HTMLElement[] = view.all(right, DiffSelectors.change);
    expect(addedChanges.map(t => PageStyle.rem(t.getBoundingClientRect().top - view.box(1, DiffSelectors.line, 1).top))).toEqual([0, 1.125]);
    expect(getComputedStyle(addedChanges[1] ?? right).backgroundColor).toBe(PageStyle.paintOf(Resources.addedChange, right));
  });

  it("scrolls the two sides together, either way", async () => {
    const before: readonly string[] = DiffFixture.lines(200);
    const changed: readonly string[] = before.map((t, i) => i % 5 === 0 ? t.toUpperCase() : t);
    const added: readonly string[] = Array.from({ length: 50 }, (_, i) => `new ${i}`);
    const view: DiffFixture = await DiffFixture.renderAsync(before.join("\n"), [...changed.slice(0, 100), ...added, ...changed.slice(100)].join("\n"), DiffLayout.SideBySide);
    const left: HTMLElement = view.one(view.pane(0), DiffSelectors.scroller);
    const right: HTMLElement = view.one(view.pane(1), DiffSelectors.scroller);
    const lineHeight: number = view.box(0, DiffSelectors.line, 0).height;

    right.scrollTop = 140 * lineHeight;
    await DomWait.untilEventAsync("the left pane follows the right", left, DiffValues.scroll, () => left.scrollTop === right.scrollTop);
    await view.stableAsync();
    expect(view.texts(0, DiffSelectors.line)).toContain("line 101");
    left.scrollTop = 20 * lineHeight;
    await DomWait.untilEventAsync("the right pane follows the left", right, DiffValues.scroll, () => right.scrollTop === left.scrollTop);
    expect(right.scrollTop).toBe(left.scrollTop);
  });

  it("shows inline the removed lines, highlighted, above the lines that replace them, and puts a click on them at the next line", async () => {
    const view: DiffFixture = await DiffFixture.renderAsync("a\nconst b\nc\nd\ne", "a\nB\nB2\nc\ne", DiffLayout.Inline, new KeywordTokenizer());

    expect(view.all(view.host, DiffSelectors.pane).length).toBe(1);
    expect(view.texts(0, DiffSelectors.line)).toEqual(["a", "const b", "B", "B2", "c", "d", "e"]);
    expect(view.numbers(0)).toEqual(["1|1|", "2||-", "|2|+", "|3|+", "3|4|", "4||-", "5|5|"]);
    const columns: readonly HTMLElement[] = view.all(view.pane(0), DiffSelectors.number);
    const firstRight: number = columns[0]?.getBoundingClientRect().right ?? 0;
    const secondRight: number = columns[1]?.getBoundingClientRect().right ?? 0;
    expect(PageStyle.rem(secondRight - firstRight)).toBeGreaterThan(0);
    for (let row: number = 0; row < 7; row++) {
      expect(PageStyle.rem((columns[row * 2]?.getBoundingClientRect().right ?? 0) - firstRight)).toBe(0);
      expect(PageStyle.rem((columns[row * 2 + 1]?.getBoundingClientRect().right ?? 0) - secondRight)).toBe(0);
      expect(PageStyle.rem(view.box(0, DiffSelectors.line, row).left - view.box(0, DiffSelectors.line, 0).left)).toBe(0);
    }
    expect(view.kinds(0)).toEqual([RowKind.Plain, RowKind.Removed, RowKind.Added, RowKind.Added, RowKind.Plain, RowKind.Removed, RowKind.Plain]);
    expect(view.texts(0, DiffSelectors.keywordToken)).toEqual(["const"]);
    expect(view.all(view.pane(0), DiffSelectors.change).length).toBe(3);

    view.click(0, 5);
    expect(DiffFixture.where(view.view(0).caret())).toBe("4:0");
    view.click(0, 2);
    expect(DiffFixture.where(view.view(0).caret())).toBe("1:0");
  });

  it("collapses long unchanged regions on both sides to a row, and opens one on both sides by a click or when the caret moves into it", async () => {
    const before: readonly string[] = DiffFixture.lines(40);
    const view: DiffFixture = await DiffFixture.renderAsync(before.join("\n"), before.map((t, i) => i === 20 ? "changed" : t).join("\n"), DiffLayout.SideBySide);
    const context: readonly string[] = ["line 17", "line 18", "line 19"];
    const after: readonly string[] = ["line 21", "line 22", "line 23"];

    expect(view.texts(0, DiffSelectors.line)).toEqual(["17 unchanged lines", ...context, "line 20", ...after, "16 unchanged lines"]);
    expect(view.texts(1, DiffSelectors.line)).toEqual(["17 unchanged lines", ...context, "changed", ...after, "16 unchanged lines"]);
    expect(view.numbers(0)).toEqual(["|", "18|", "19|", "20|", "21|-", "22|", "23|", "24|", "|"]);
    expect(view.toggles(0)).toEqual(["chevron_right", "", "", "", "", "", "", "", "chevron_right"]);
    expect(view.kinds(1)).toEqual([RowKind.Fold, RowKind.Plain, RowKind.Plain, RowKind.Plain, RowKind.Added, RowKind.Plain, RowKind.Plain, RowKind.Plain, RowKind.Fold]);
    expect(PageStyle.rem(view.box(1, DiffSelectors.line, 8).top - view.box(0, DiffSelectors.line, 8).top)).toBe(0);
    const collapsed: HTMLElement = view.one(view.pane(0), DiffSelectors.lineFold);
    expect(getComputedStyle(collapsed).color).toBe(PageStyle.colorOf(StyleColor.Text, DiffValues.mutedText, view.pane(0)));
    expect(getComputedStyle(view.one(view.pane(0), DiffSelectors.rowFold)).backgroundColor).toBe(PageStyle.paintOf(DiffValues.foldBackground, view.pane(0)));

    view.click(1, 0);
    await view.stableAsync();
    expect(view.texts(0, DiffSelectors.line).slice(0, 2)).toEqual(["line 0", "line 1"]);
    expect(view.texts(1, DiffSelectors.line).slice(0, 2)).toEqual(["line 0", "line 1"]);
    expect(view.all(view.host, DiffSelectors.lineFold).length).toBe(2);
    expect(view.toggles(1).slice(0, 2)).toEqual(["expand_more", ""]);
    view.one(view.pane(1), DiffSelectors.foldIcon).dispatchEvent(new MouseEvent(DiffValues.mouseDown, { bubbles: true, cancelable: true, button: 0 }));
    await view.stableAsync();
    expect(view.texts(0, DiffSelectors.line)[0]).toBe("17 unchanged lines");
    expect(view.all(view.host, DiffSelectors.lineFold).length).toBe(4);
    view.click(0, 0);
    await view.stableAsync();

    const hidden: TextPosition = new TextPosition(30, 0);
    view.view(1).select(new List<TextSelection>([new TextSelection(hidden, hidden)]));
    await view.stableAsync();
    expect(view.all(view.host, DiffSelectors.lineFold).length).toBe(0);
  });

  it("collapses long unchanged regions inline too, around the removed and added lines", async () => {
    const before: readonly string[] = DiffFixture.lines(40);
    const view: DiffFixture = await DiffFixture.renderAsync(before.join("\n"), before.map((t, i) => i === 20 ? "changed" : t).join("\n"), DiffLayout.Inline);

    expect(view.numbers(0)).toEqual(["||", "18|18|", "19|19|", "20|20|", "21||-", "|21|+", "22|22|", "23|23|", "24|24|", "||"]);
    view.click(0, 9);
    await view.stableAsync();
    expect(view.texts(0, DiffSelectors.line).at(-1)).toBe("line 39");
    expect(view.all(view.host, DiffSelectors.lineFold).length).toBe(1);
  });

  it("searches the modified text inline, marking matches only on its own lines", async () => {
    const view: DiffFixture = await DiffFixture.renderAsync("foo x\nfoo", "foo y\nfoo", DiffLayout.Inline);
    view.view(0).focus();
    await userEvent.keyboard(navigator.platform.startsWith(DiffValues.macPlatform) ? DiffPresses.macFind : DiffPresses.find);
    await view.stableAsync();
    await userEvent.type(view.one(view.host, DiffSelectors.findField), "foo");

    const matches: readonly HTMLElement[] = view.all(view.host, DiffSelectors.match);
    expect(matches.length).toBe(2);
    expect(matches.map(t => PageStyle.rem(t.getBoundingClientRect().top - view.box(0, DiffSelectors.line, 1).top))).toEqual([0, 1.125]);
  });

  it("puts a click on the filler rows after the last line at that line's end", async () => {
    const view: DiffFixture = await DiffFixture.renderAsync("a\nb\nc", "ab", DiffLayout.SideBySide);

    expect(view.kinds(1)).toEqual([RowKind.Added, RowKind.Spacer, RowKind.Spacer]);
    view.click(1, 2);
    expect(DiffFixture.where(view.view(1).caret())).toBe("0:2");
  });

  it("steps through the changes with Alt and Down or Up on either side, naming each, and leaves other keys to the code view", async () => {
    const view: DiffFixture = await DiffFixture.renderAsync("a\nb\nc\nd\ne\nf\ng", "a\nB\nB2\nc\ne\nf\nG", DiffLayout.SideBySide);
    view.view(1).focus();

    await userEvent.keyboard(DiffPresses.otherModifiers);
    expect(view.status).toBe("");
    const start: TextPosition = new TextPosition(0, 0);
    view.view(1).select(new List<TextSelection>([new TextSelection(start, start)]));
    const composing: KeyboardEvent = new KeyboardEvent(DiffValues.keyDown, { key: DiffPresses.arrowDown, code: DiffPresses.arrowDown, altKey: true, isComposing: true, bubbles: true, cancelable: true });
    view.host.querySelectorAll<HTMLElement>(DiffSelectors.input)[1]?.dispatchEvent(composing);
    expect([composing.defaultPrevented, DiffFixture.where(view.view(1).caret()), view.status]).toEqual([false, "0:0", ""]);

    await userEvent.keyboard(DiffPresses.nextChange);
    await view.stableAsync();
    expect(DiffFixture.where(view.view(1).caret())).toBe("1:0");
    expect(view.status).toBe("Change 1 of 3, 1 line removed, 2 added");
    await userEvent.keyboard(DiffPresses.nextChange);
    await view.stableAsync();
    expect(DiffFixture.where(view.view(1).caret())).toBe("4:0");
    expect(view.status).toBe("Change 2 of 3, 1 line removed");
    expect(PageStyle.rem(view.one(view.pane(1), DiffSelectors.caret).getBoundingClientRect().top - view.box(1, DiffSelectors.line, 5).top)).toBe(0);
    await userEvent.keyboard(DiffPresses.previousChange);
    expect([DiffFixture.where(view.view(1).caret()), view.status]).toEqual(["1:0", "Change 1 of 3, 1 line removed, 2 added"]);

    view.view(0).focus();
    await userEvent.keyboard(DiffPresses.nextChange);
    expect(DiffFixture.where(view.view(0).caret())).toBe("1:0");
    expect(view.view(0).hasFocus()).toBe(true);
    expect(view.status).toBe("Change 1 of 3, 1 line removed, 2 added");
  });

  it("names added-only changes, steps inline to a removal past the last line, and says when there are no changes", async () => {
    const added: DiffFixture = await DiffFixture.renderAsync("a", "a\nb", DiffLayout.SideBySide);
    added.view(1).focus();
    await userEvent.keyboard(DiffPresses.previousChange);
    expect(added.status).toBe("Change 1 of 1, 1 line added");
    added.fixture.destroy();

    const removed: DiffFixture = await DiffFixture.renderAsync("a\nb\nc", "a", DiffLayout.Inline);
    removed.view(0).focus();
    await userEvent.keyboard(DiffPresses.nextChange);
    expect(DiffFixture.where(removed.view(0).caret())).toBe("0:0");
    expect(removed.status).toBe("Change 1 of 1, 2 lines removed");
    removed.fixture.destroy();

    const same: DiffFixture = await DiffFixture.renderAsync("a", "a", DiffLayout.SideBySide);
    same.view(1).focus();
    await userEvent.keyboard(DiffPresses.nextChange);
    expect(same.status).toBe("No changes");
  });

  it("follows edits to the modified text, dropping the marks of changes that are gone", async () => {
    const view: DiffFixture = await DiffFixture.renderAsync("a\nab", "a\naX\nb", DiffLayout.SideBySide);

    expect(view.kinds(1)).toEqual([RowKind.Plain, RowKind.Added, RowKind.Added]);
    expect(view.all(view.pane(1), DiffSelectors.change).length).toBe(1);
    expect(view.all(view.pane(0), DiffSelectors.change).length).toBe(0);
    view.diff.modified.apply(new List<TextEdit>([new TextEdit(TextRange.of(1, 1, 2, 0), "")]));
    await view.diff.settledAsync();
    await view.stableAsync();

    expect(view.kinds(0)).toEqual([RowKind.Plain, RowKind.Plain]);
    expect(view.kinds(1)).toEqual([RowKind.Plain, RowKind.Plain]);
    expect(view.all(view.host, DiffSelectors.change).length).toBe(0);
  });

  it("diffs in a worker, marking an edit at once and every change when the result lands", async () => {
    using runner = DiffWorker.create();
    const original: string[] = [...DiffFixture.lines(100001)];
    const modified: string[] = [...original];
    modified[1] = "changed";
    const view: DiffFixture = await DiffFixture.renderAsync(original.join("\n"), modified.join("\n"), DiffLayout.SideBySide, null, runner);

    view.diff.modified.apply(new List<TextEdit>([new TextEdit(TextRange.of(3, 0, 3, 4), "edited")]));
    await view.stableAsync();
    expect([view.diff.pending, view.kinds(1)[3]]).toEqual([true, RowKind.Added]);
    await view.diff.settledAsync();
    await view.stableAsync();

    expect(runner.usesWorker).toBe(true);

    expect(view.kinds(0).slice(0, 5)).toEqual([RowKind.Plain, RowKind.Removed, RowKind.Plain, RowKind.Removed, RowKind.Plain]);
    expect(view.kinds(1).slice(0, 5)).toEqual([RowKind.Plain, RowKind.Added, RowKind.Plain, RowKind.Added, RowKind.Plain]);
  });

  it("shows the two texts inline while the view is narrower than the breakpoint and side by side once it is wider", async () => {
    DiffFixture.useSettings({ [DiffEditorSettings.inlineBreakpoint.id]: 30 });
    const view: DiffFixture = await DiffFixture.renderAsync("a\nb", "a\nc", DiffLayout.Automatic);

    expect([view.panes, view.fixture.componentInstance.inline()]).toEqual([2, false]);
    view.host.style.width = "29rem";
    await DomWait.untilAsync("the view turns inline", () => view.panes === 1);
    expect(view.host.classList.contains(DiffEditorClasses.inline)).toBe(true);
    expect(view.texts(0, DiffSelectors.line)).toEqual(["a", "b", "c"]);
    view.host.style.width = "31rem";
    await DomWait.untilAsync("the view turns side by side", () => view.panes === 2);
    expect(PageStyle.rem(view.pane(1).getBoundingClientRect().left - view.pane(0).getBoundingClientRect().right)).toBeCloseTo(0, 1);
    view.fixture.componentRef.setInput(DiffInputs.layout, DiffLayout.SideBySide);
    view.host.style.width = "20rem";
    await view.stableAsync();
    expect(view.panes).toBe(2);
  });

  it("keeps the original read-only by default, and lets a person edit it with its own undo when asked", async () => {
    const locked: DiffFixture = await DiffFixture.renderAsync("a\nb", "a\nc", DiffLayout.SideBySide);
    locked.view(0).focus();
    await userEvent.keyboard("x");
    expect(locked.diff.original.lineText(0)).toBe("a");
    locked.fixture.destroy();

    const open: DiffFixture = await DiffFixture.renderAsync("a\nb", "a\nc", DiffLayout.SideBySide, null, undefined, { [DiffInputs.originalReadOnly]: false });
    const own: UndoHistory = new UndoHistory(open.diff.original);
    open.fixture.componentRef.setInput(DiffInputs.originalHistory, own);
    await open.stableAsync();
    const start: TextPosition = new TextPosition(1, 1);
    open.view(0).select(new List<TextSelection>([new TextSelection(start, start)]));
    open.view(0).focus();
    await userEvent.keyboard("x");
    await open.diff.settledAsync();
    await open.stableAsync();

    expect([open.diff.original.lineText(1), own.canUndo]).toEqual(["bx", true]);
    expect(open.kinds(0)).toEqual([RowKind.Plain, RowKind.Removed]);
  });

  it("folds with the context and the fewest hidden lines the settings give, and compares by character only within their limit, following a change", async () => {
    const before: readonly string[] = DiffFixture.lines(20);
    const changed: string = before.map((t, i) => i === 10 ? "line 10!" : t).join("\n");
    DiffFixture.useSettings({ [DiffEditorSettings.contextLines.id]: 1, [DiffEditorSettings.minimumHiddenLines.id]: 8, [DiffEditorSettings.characterDiffLimit.id]: 4 });
    const tight: DiffFixture = await DiffFixture.renderAsync(before.join("\n"), changed, DiffLayout.SideBySide);

    expect(tight.texts(0, DiffSelectors.line)).toEqual(["9 unchanged lines", "line 9", "line 10", "line 11", "8 unchanged lines"]);
    expect([tight.diff.characterDiffLimit, tight.all(tight.host, DiffSelectors.change).length]).toEqual([4, 0]);
    DiffFixture.useSettings({ [DiffEditorSettings.contextLines.id]: 1, [DiffEditorSettings.minimumHiddenLines.id]: 9 });
    await tight.stableAsync();
    await tight.diff.settledAsync();
    await tight.stableAsync();

    expect(tight.diff.characterDiffLimit).toBe(20000);

    expect(tight.texts(0, DiffSelectors.line)).toEqual(["9 unchanged lines", "line 9", "line 10", "line 11", ...before.slice(12)]);
    expect(tight.all(tight.host, DiffSelectors.change).length).toBe(1);
  });

  it("binds its commands to Alt with Down and Up in a diff view only, and runs them from a person's own key", async () => {
    const registries: DiffEditorRegistries = TestBed.inject(DiffEditorRegistries);
    const outside: CommandContext = new CommandContext(registries.registries, new ConditionValues(registries.registries.conditions), new EditorFeatureSet(), null, 0, 0);
    const inside: ConditionValues = new ConditionValues(registries.registries.conditions);
    inside.set(DiffEditorFeatures.inDiffEditor, true);
    for (const conditions of [inside, outside.conditions])
      conditions.set(CoreConditions.platform, DiffValues.linux);

    expect(registries.registries.settings.all().where(t => DiffEditorSettings.all.any(s => s.id === t.id)).select(t => [t.id, t.defaultValue]).toArray())
      .toEqual(DiffEditorSettings.all.select(t => [t.id, t.defaultValue]).toArray());
    expect([DiffEditorCommands.nextChange.id, DiffEditorCommands.previousChange.id].map(t => registries.registries.keyBindings.keyOf(t, inside)))
      .toEqual([DiffPresses.nextChangeKey, DiffPresses.previousChangeKey]);
    expect([registries.registries.keyBindings.keyOf(DiffEditorCommands.nextChange.id, outside.conditions),
      registries.registries.commands.run(DiffEditorCommands.nextChange.id, outside)]).toEqual([null, false]);

    TestBed.inject(CodeEditorRegistries).registries.keyBindings.setUserRules(new List<IKeyBindingRule>([new KeyBindingRule(DiffEditorCommands.nextChange.id, DiffPresses.ownKey)]));
    const view: DiffFixture = await DiffFixture.renderAsync("a\nb\nc\nd\ne", "a\nB\nc\nd\nE", DiffLayout.SideBySide);
    view.view(1).focus();
    await userEvent.keyboard(DiffPresses.ownPress);
    await view.stableAsync();

    expect([DiffFixture.where(view.view(1).caret()), view.diff.modified.lineText(0)]).toEqual(["1:0", "a"]);
  });

  it("runs its own command from a key sequence pressed in a pane, through the dispatcher the panes share, and tells its owner the pending chord", async () => {
    TestBed.inject(CodeEditorRegistries).registries.keyBindings.setUserRules(new List<IKeyBindingRule>([new KeyBindingRule(DiffEditorCommands.nextChange.id, DiffPresses.sequenceKey)]));
    const view: DiffFixture = await DiffFixture.renderAsync("a\nb\nc\nd\ne", "a\nB\nc\nd\nE", DiffLayout.SideBySide);
    const pendings: (string | null)[] = [];
    view.fixture.componentInstance.keySequencePending.subscribe(t => pendings.push(t));
    view.view(1).focus();

    await userEvent.keyboard(DiffPresses.sequencePress);
    await view.stableAsync();
    TestBed.inject(CodeEditorRegistries).registries.keyBindings.setUserRules(new List<IKeyBindingRule>());

    expect([DiffFixture.where(view.view(1).caret()), view.diff.modified.lineText(0)]).toEqual(["1:0", "a"]);
    expect(pendings).toEqual([navigator.platform.startsWith("Mac") ? "⌃K" : "Ctrl+K", null]);
  });

  it("runs its own keys pressed outside its panes too, through the same dispatcher", async () => {
    const view: DiffFixture = await DiffFixture.renderAsync("a\nb\nc\nd\ne", "a\nB\nc\nd\nE", DiffLayout.SideBySide);
    const press: KeyboardEvent = new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", altKey: true, bubbles: true, cancelable: true });

    view.host.dispatchEvent(press);
    await view.stableAsync();

    expect([press.defaultPrevented, DiffFixture.where(view.view(1).caret())]).toEqual([true, "1:0"]);
  });

  it("steps to the next and the previous change by its commands too, saying whether there was one", async () => {
    const view: DiffFixture = await DiffFixture.renderAsync("a\nb\nc\nd\ne", "a\nB\nc\nd\nE", DiffLayout.SideBySide);
    const same: DiffFixture = await DiffFixture.renderAsync("a", "a", DiffLayout.SideBySide);

    expect(view.fixture.componentInstance.nextChange()).toBe(true);
    expect(DiffFixture.where(view.view(1).caret())).toBe("1:0");
    expect(view.fixture.componentInstance.nextChange()).toBe(true);
    expect(DiffFixture.where(view.view(1).caret())).toBe("4:0");
    expect(view.fixture.componentInstance.previousChange()).toBe(true);
    expect(DiffFixture.where(view.view(1).caret())).toBe("1:0");
    expect([same.fixture.componentInstance.nextChange(), same.fixture.componentInstance.previousChange()]).toEqual([false, false]);
    await same.stableAsync();
    expect(same.status).toBe("No changes");
  });

  it("settles the colors of a removed line inline once the background tokenizing of the original reaches it", async () => {
    const original: readonly string[] = ["/*", ...Array.from({ length: 199_999 }, (_, i) => `const value${i} = ${i};`)];
    const modified: readonly string[] = [...original.slice(0, 5), "added", ...original.slice(5, 150_000), ...original.slice(150_001)];
    let clock: number = performance.now();
    const now: MockInstance<() => number> = vi.spyOn(performance, "now").mockImplementation(() => clock += 0.00004);
    try {
      const view: DiffFixture = await DiffFixture.renderAsync(original.join("\n"), modified.join("\n"), DiffLayout.Inline, new CommentTokenizer());
      const removed = (): readonly string[] =>
        [...(view.all(view.pane(0), DiffSelectors.line)[view.kinds(0).indexOf(RowKind.Removed)]?.children ?? [])].map(t => t.className);

      await DomWait.untilAsync("the removed line is tokenized as a comment", () => removed().join() === CodeEditorClasses.token(BuiltInTokenTypes.comment.id));
      expect(removed()).toEqual([CodeEditorClasses.token(BuiltInTokenTypes.comment.id)]);
      expect(view.texts(0, DiffSelectors.line)).toContain("const value149998 = 149998;");
    } finally {
      now.mockRestore();
    }
  });
});
