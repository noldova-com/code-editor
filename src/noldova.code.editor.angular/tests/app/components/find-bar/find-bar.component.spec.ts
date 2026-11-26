/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { ConditionValues, CoreCommands, CoreConditions, CoreContribution, EditorRegistries, KeyPress } from "@noldova/code.editor";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { CodeEditorContribution } from "../../../../src/app/services/code-editor-contribution.ts";
import { DomWait } from "../../../fixtures/dom-wait.fixture.ts";
import { LineReads } from "../../../fixtures/line-reads.fixture.ts";
import { PageStyle } from "../../../fixtures/page-style.fixture.ts";
import { SearchFixture } from "../../../fixtures/search.fixture.ts";

const MAC: boolean = navigator.platform.startsWith("Mac");
const MOD: string = MAC ? "Meta" : "Control";
const FIND: string = `{${MOD}>}f{/${MOD}}`;
const REPLACE: string = MAC ? "{Meta>}{Alt>}f{/Alt}{/Meta}" : "{Control>}h{/Control}";
const MILLION_LINE_TEST_TIMEOUT: number = 60000;
const MILLION_LINE_COUNT_BOUND: number = 45000;

describe("FindBarComponent", () => {
  it("opens with the platform's find key, seeded with the selected text, highlights the matches in view and steps through them", async () => {
    const view: SearchFixture = await SearchFixture.renderAsync("foo bar\nfoo baz foo\nqux");
    view.select(0, 0, 0, 3);
    await userEvent.keyboard(FIND);
    await view.stableAsync();

    const field: HTMLInputElement = view.field("Find");
    expect(document.activeElement).toBe(field);
    expect(field.value).toBe("foo");
    expect(view.status).toBe("1 of 3");
    expect(view.all(".nol-code-editor-match").length).toBe(3);
    const current: DOMRect = view.one(".nol-code-editor-match-current").getBoundingClientRect();
    const line: DOMRect = view.one(".nol-code-editor-line").getBoundingClientRect();
    expect(PageStyle.rem(current.left - view.columnLeft(0, 0))).toBe(0);
    expect(PageStyle.rem(current.right - view.columnLeft(0, 3))).toBeCloseTo(0, 2);
    expect(PageStyle.rem(current.top - line.top)).toBe(0);
    const bar: HTMLElement = view.bar ?? view.host;
    const host: DOMRect = view.host.getBoundingClientRect();
    expect(PageStyle.rem(bar.getBoundingClientRect().top - host.top)).toBe(0);
    expect(PageStyle.rem(host.right - bar.getBoundingClientRect().right)).toBe(PageStyle.rem(Number.parseFloat(getComputedStyle(bar).insetInlineEnd)));
    expect(getComputedStyle(bar).backgroundColor).toBe(PageStyle.paintOf("var(--nol-hover-widget)", view.host));
    expect(getComputedStyle(view.one(".nol-code-editor-match:not(.nol-code-editor-match-current)")).backgroundColor)
      .toBe(PageStyle.paintOf("color-mix(in srgb, var(--nol-list-highlight) 25%, transparent)", view.host));

    await userEvent.keyboard("{Enter}");
    expect([view.status, view.selected]).toEqual(["2 of 3", "1:0>1:3"]);
    await userEvent.keyboard("{Enter}{Enter}");
    expect([view.status, view.selected]).toEqual(["1 of 3", "0:0>0:3"]);
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    expect([view.status, view.selected]).toEqual(["3 of 3", "1:8>1:11"]);
    await userEvent.click(view.button("Previous match"));
    expect(view.status).toBe("2 of 3");
    await userEvent.click(view.button("Next match"));
    expect(view.status).toBe("3 of 3");
    view.select(2, 0, 2, 0);
    await view.stableAsync();
    expect(view.status).toBe("? of 3");
  });

  it("searches by case, whole word and regular expression, says when a pattern is invalid or finds nothing, and closes by its button", async () => {
    const view: SearchFixture = await SearchFixture.renderAsync("Foo foo food\nfoo");
    await userEvent.keyboard(FIND);
    await view.stableAsync();
    expect(view.status).toBe("");

    await userEvent.type(view.field("Find"), "foo");
    expect([view.status, view.selected]).toEqual(["1 of 4", "0:0>0:3"]);
    await userEvent.click(view.button("Match case"));
    expect([view.status, view.selected]).toEqual(["1 of 3", "0:4>0:7"]);
    expect(view.button("Match case").getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(view.button("Match whole word"));
    expect(view.status).toBe("1 of 2");
    await userEvent.click(view.button("Use regular expression"));
    await userEvent.fill(view.field("Find"), "f(");
    expect(view.status).toBe("Invalid pattern");
    expect(view.all(".nol-code-editor-match").length).toBe(0);
    await userEvent.keyboard("{Enter}");
    expect(view.status).toBe("Invalid pattern");
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    expect(view.status).toBe("Invalid pattern");
    await userEvent.fill(view.field("Find"), "zzz");
    expect(view.status).toBe("No results");

    await userEvent.click(view.button("Close"));
    await view.stableAsync();
    expect(view.bar).toBeNull();
    expect(document.activeElement).toBe(view.one("textarea"));
    expect(view.all(".nol-code-editor-match").length).toBe(0);
  });

  it("replaces the current match and moves on, replaces all as one undo step, and does nothing on an invalid pattern", async () => {
    const view: SearchFixture = await SearchFixture.renderAsync("a1 a2 a3");
    await userEvent.keyboard(REPLACE);
    await view.stableAsync();
    await userEvent.type(view.field("Find"), "a");
    await userEvent.type(view.field("Replace"), "b{Enter}");

    expect(view.document.text()).toBe("b1 a2 a3");
    expect([view.status, view.selected]).toEqual(["1 of 2", "0:3>0:4"]);
    await userEvent.click(view.button("Replace all"));
    expect(view.document.text()).toBe("b1 b2 b3");
    expect(view.status).toBe("No results");
    await userEvent.click(view.button("Replace"));
    expect(view.document.text()).toBe("b1 b2 b3");

    await userEvent.click(view.button("Use regular expression"));
    await userEvent.fill(view.field("Find"), "(");
    await userEvent.click(view.button("Replace"));
    await userEvent.click(view.button("Replace all"));
    expect(view.document.text()).toBe("b1 b2 b3");
    await userEvent.type(view.field("Replace"), "{Escape}");
    await view.stableAsync();
    expect(view.bar).toBeNull();
    await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);
    expect(view.document.text()).toBe("b1 a2 a3");
  });

  it("opens without the replace row when read-only", async () => {
    const view: SearchFixture = await SearchFixture.renderAsync("a1", true);
    await userEvent.keyboard(REPLACE);
    await view.stableAsync();

    expect(view.field("Find")).toBeTruthy();
    expect(view.host.querySelector("input[aria-label=\"Replace\"]")).toBeNull();
  });

  it("closes on Escape from the field or the editor, and reopens on the last text or on a new selection while open", async () => {
    const view: SearchFixture = await SearchFixture.renderAsync("foo bar\nbar foo");
    view.select(0, 4, 0, 7);
    await userEvent.keyboard(FIND);
    await view.stableAsync();
    await userEvent.keyboard("{Escape}");
    await view.stableAsync();
    expect(view.bar).toBeNull();
    expect(document.activeElement).toBe(view.one("textarea"));

    view.select(0, 0, 1, 1);
    await userEvent.keyboard(FIND);
    await view.stableAsync();
    expect(view.field("Find").value).toBe("bar");
    view.editor.focus();
    view.select(1, 4, 1, 7);
    await userEvent.keyboard(FIND);
    await view.stableAsync();
    expect(view.field("Find").value).toBe("foo");
    expect(document.activeElement).toBe(view.field("Find"));
    view.editor.focus();
    await userEvent.keyboard("{Escape}");
    await view.stableAsync();
    expect(view.bar).toBeNull();
  });

  it("binds the find and replace keys of each platform as data the registries match", () => {
    const registries: EditorRegistries = new EditorRegistries();
    registries.add(new CoreContribution(), new CodeEditorContribution());
    const conditions: ConditionValues = new ConditionValues(registries.conditions);
    const first = (key: string, code: string, control: boolean, alt: boolean, meta: boolean, platform: string): string => {
      conditions.set(CoreConditions.platform, platform);

      return registries.keyBindings.matches(new KeyPress(key, code, false, control, alt, meta), conditions).firstOrDefault()?.command ?? "none";
    };

    expect(first("f", "KeyF", true, false, false, "windows")).toBe(CodeEditorContribution.find.id);
    expect(first("h", "KeyH", true, false, false, "linux")).toBe(CodeEditorContribution.replace.id);
    expect(first("f", "KeyF", true, true, false, "windows")).toBe("none");
    expect(first("g", "KeyG", true, false, false, "windows")).toBe("none");
    expect(first("f", "KeyF", false, false, true, "linux")).toBe("none");
    expect(first("f", "KeyF", false, false, true, "mac")).toBe(CodeEditorContribution.find.id);
    expect(first("ƒ", "KeyF", false, true, true, "mac")).toBe(CodeEditorContribution.replace.id);
    expect(first("h", "KeyH", false, false, true, "mac")).toBe("none");
    expect(first("f", "KeyF", true, false, false, "mac")).toBe(CoreCommands.cursorRight.id);
    expect(first("Escape", "Escape", false, false, false, "mac")).toBe(CoreCommands.cancelSelection.id);
  });

  it("takes keypresses in the field and the text of a 1,000,000-line document reading only the lines in view, counting the matches in the background", async () => {
    const view: SearchFixture = await SearchFixture.renderAsync(Array.from({ length: 1_000_000 }, (_, i) => `line ${i}`).join("\n"));
    await userEvent.keyboard(FIND);
    await view.stableAsync();
    const field: HTMLInputElement = view.field("Find");
    const input: HTMLElement = view.one("textarea");

    const typed: readonly number[] = ["l", "li", "lin", "line", "line ", "line 5"].map(text => LineReads.count(view.document, () => {
      field.value = text;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      view.fixture.detectChanges();
      view.host.getBoundingClientRect();
    }));
    expect([view.status, view.selected]).toEqual([expect.stringMatching(/^\? of \d+\+$/u), "5:0>5:6"]);
    await DomWait.untilAsync("the search counts every match", () => view.status === "1 of 111111", MILLION_LINE_COUNT_BOUND);
    view.editor.scrollTo(500_000 * view.one(".nol-code-editor-line").getBoundingClientRect().height);
    view.select(500_005, 0, 500_005, 0);
    await view.stableAsync();
    const pressed: readonly number[] = Array.from({ length: 20 }, () => LineReads.count(view.document, () => {
      input.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText", data: "x", cancelable: true }));
      view.fixture.detectChanges();
      view.host.getBoundingClientRect();
    }));
    await view.stableAsync();

    expect(view.document.lineText(500_005)).toBe(`${"x".repeat(20)}line 500005`);
    expect(view.status).toMatch(/^(\?|\d+) of 111111$/u);
    expect(view.all(".nol-code-editor-match").length).toBeGreaterThan(10);
    expect(Math.max(...typed), `Lines read per keypress: ${typed.join(", ")}`).toBeLessThan(1000);
    expect(Math.max(...pressed), `Lines read per keypress: ${pressed.join(", ")}`).toBeLessThan(1000);
  }, MILLION_LINE_TEST_TIMEOUT);
});
