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
import { CoreCommands, type IKeyBindingRule, KeyBindingRule, TextDocument, TextPosition, TextSelection, TokenTypeDefinition, type TokenTypeRegistry, UndoHistory } from "@noldova/code.editor";
import { TextMateTokenizer } from "@noldova/code.editor.textmate";
import { List } from "@noldova/context.collections";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import { describe, expect, it, type MockInstance, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { CodeEditorComponent } from "../../../../src/app/components/code-editor/code-editor.component.ts";
import { CodeEditorRegistries } from "../../../../src/app/services/code-editor-registries.ts";
import { DomWait } from "../../../fixtures/dom-wait.fixture.ts";
import { EditorFixture } from "../../../fixtures/editor.fixture.ts";
import { KeywordTokenizer } from "../../../fixtures/keyword-tokenizer.fixture.ts";
import { LineReads } from "../../../fixtures/line-reads.fixture.ts";
import { PageStyle } from "../../../fixtures/page-style.fixture.ts";
import { StyleColor } from "../../../fixtures/style-color.fixture.ts";
import { RenderOptions } from "../../../fixtures/render-options.fixture.ts";
import { TypedTokenizer } from "../../../fixtures/typed-tokenizer.fixture.ts";

const MOD: string = navigator.platform.startsWith("Mac") ? "Meta" : "Control";
const TOP: string = navigator.platform.startsWith("Mac") ? "{Meta>}{ArrowUp}{/Meta}" : "{Control>}{Home}{/Control}";

describe("CodeEditorComponent", () => {
  it("renders only the lines in view of a 1,000,000-line document, in a scroll area as tall as every line, and the lines a scroll reaches", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync(EditorFixture.lines(1_000_000));
    const lineHeight: number = view.lineBox(0).height;

    expect(PageStyle.rem(lineHeight)).toBe(1.125);
    expect(PageStyle.rem(view.one(".nol-code-editor-sizer").getBoundingClientRect().height)).toBe(1_125_000);
    expect(view.all(".nol-code-editor-line").length).toBeLessThan(40);
    view.scroller.scrollTop = 500_000 * lineHeight;
    view.scroller.dispatchEvent(new Event("scroll"));
    await view.stableAsync();

    expect(view.texts(".nol-code-editor-line")[0]).toBe("line 499990");
    expect(view.texts(".nol-code-editor-line-number")[10]).toBe("500001");
    const top: number = view.scroller.getBoundingClientRect().top;
    expect(PageStyle.rem(view.lineBox(10).top - top)).toBe(0);
    expect(PageStyle.rem((view.all(".nol-code-editor-line-number")[10]?.getBoundingClientRect().top ?? 0) - top)).toBe(0);
  });

  it("takes a keypress in the middle of a 1,000,000-line document and updates its view, reading only the lines in view", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync(EditorFixture.lines(1_000_000));
    view.editor.scrollTo(500_000 * view.lineBox(0).height);
    view.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(500_005, 0))]));
    await view.stableAsync();
    const reads: number[] = [];

    for (let press: number = 0; press < 20; press++)
      reads.push(LineReads.count(view.document, () => {
        view.input.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText", data: "x", cancelable: true }));
        view.fixture.detectChanges();
        view.host.getBoundingClientRect();
      }));
    await view.stableAsync();

    expect(view.document.lineText(500_005)).toBe(`${"x".repeat(20)}line 500005`);
    expect(view.texts(".nol-code-editor-line")).toContain(`${"x".repeat(20)}line 500005`);
    expect(Math.min(...reads), `Lines read per keypress: ${reads.join(", ")}`).toBeGreaterThan(0);
    expect(Math.max(...reads), `Lines read per keypress: ${reads.join(", ")}`).toBeLessThan(1000);
  });

  it("opens a 1,000,000-line document in slices of under a million characters and shows it, reading only the lines in view", async () => {
    const text: string = `line 0${"\nconst value = 0;".repeat(999_999)}`;
    let pauses: number = 0;

    const opened: TextDocument = await TextDocument.fromTextAsync(text, () => {
      pauses++;

      return new Promise<void>(resolve => setTimeout(resolve));
    });
    const reads: MockInstance<(line: number) => string> = vi.spyOn(opened, "lineText");
    const view: EditorFixture = await EditorFixture.renderDocumentAsync(opened);
    await EditorFixture.nextFrameAsync();
    const shown: number = reads.mock.calls.length;
    reads.mockRestore();

    expect(view.texts(".nol-code-editor-line")[0]).toBe("line 0");
    expect(opened.lineCount).toBe(1_000_000);
    expect(pauses).toBeGreaterThan(text.length / 1_000_000);
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(1000);
  });

  it("jumps to line 500,000 of a highlighted 1,000,000-line document, coloring the lines in view at once, reading only the lines in view", async () => {
    using tokenizer = await TextMateTokenizer.createAsync("typescript", () => import("@shikijs/langs/typescript"), createJavaScriptRegexEngine());
    const view: EditorFixture = await EditorFixture.renderAsync(EditorFixture.code(1_000_000, "let first = 0;"), new RenderOptions(tokenizer));
    const lineHeight: number = view.lineBox(0).height;
    await EditorFixture.nextFrameAsync();
    let numbers: readonly string[] = [];
    let kinds: readonly string[] = [];

    const read: number = LineReads.count(view.document, () => {
      view.scroller.scrollTop = 500_000 * lineHeight;
      view.scroller.dispatchEvent(new Event("scroll"));
      view.fixture.detectChanges();
      numbers = view.texts(".nol-code-editor-line-number");
      kinds = EditorFixture.kindsAt(view, 10);
    });
    await view.stableAsync();

    expect(numbers[10]).toBe("500001");
    expect(kinds).toContain("nol-code-editor-token-keyword");
    expect(read).toBeGreaterThan(0);
    expect(read).toBeLessThan(1000);
    view.fixture.destroy();
  });

  it("colors a line past the tokenized ones provisionally, then settles its colors once the background tokenizing reaches it", async () => {
    using tokenizer = await TextMateTokenizer.createAsync("typescript", () => import("@shikijs/langs/typescript"), createJavaScriptRegexEngine());
    const view: EditorFixture = await EditorFixture.renderAsync(EditorFixture.code(20_000, "/*"), new RenderOptions(tokenizer));

    view.scroller.scrollTop = 10_000 * view.lineBox(0).height;
    view.scroller.dispatchEvent(new Event("scroll"));
    await view.stableAsync();
    expect(view.texts(".nol-code-editor-line-number")[10]).toBe("10001");
    expect(EditorFixture.kindsAt(view, 10)).toContain("nol-code-editor-token-keyword");

    await DomWait.untilAsync("line 10 is tokenized as a comment", () => EditorFixture.kindsAt(view, 10).join() === "nol-code-editor-token-comment");
    expect(EditorFixture.kindsAt(view, 10)).toEqual(["nol-code-editor-token-comment"]);
    view.fixture.destroy();
  });

  it("scrolls a 1,000,000-line document frame by frame, once open, rendering the lines each frame reaches, reading only the lines in view", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync(EditorFixture.lines(1_000_000));
    const lineHeight: number = view.lineBox(0).height;
    await EditorFixture.nextFrameAsync();
    const reached: string[] = [];
    const reads: number[] = [];

    for (let frame: number = 1; frame <= 60; frame++) {
      reads.push(LineReads.count(view.document, () => {
        view.scroller.scrollTop = frame * 16_000 * lineHeight;
        view.scroller.dispatchEvent(new Event("scroll"));
        view.fixture.detectChanges();
        reached.push(view.texts(".nol-code-editor-line-number")[10] ?? "");
      }));
      await EditorFixture.nextFrameAsync();
      await view.stableAsync();
    }

    expect(reached).toEqual(Array.from({ length: 60 }, (_, i) => String((i + 1) * 16_000 + 1)));
    expect(Math.min(...reads), `Lines read per frame: ${reads.join(", ")}`).toBeGreaterThan(0);
    expect(Math.max(...reads), `Lines read per frame: ${reads.join(", ")}`).toBeLessThan(1000);
  });

  it("lines up each line's number, text and caret, and keeps the numbers in place when the text scrolls sideways", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync(`a\tb\n${"x".repeat(200)}\n\nend`);
    view.editor.focus();
    view.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(0, 2))]));
    await view.stableAsync();

    const numbers: readonly HTMLElement[] = view.all(".nol-code-editor-line-number");
    const rows: readonly HTMLElement[] = view.all(".nol-code-editor-line");
    expect(numbers.map(t => PageStyle.rem(t.getBoundingClientRect().top))).toEqual(rows.map(t => PageStyle.rem(t.getBoundingClientRect().top)));
    expect(PageStyle.rem(numbers[0]?.getBoundingClientRect().right ?? 0)).toBeLessThan(PageStyle.rem(view.columnLeft(0, 0)));
    const caret: DOMRect = view.one(".nol-code-editor-caret").getBoundingClientRect();
    expect(PageStyle.rem(caret.left)).toBeCloseTo(PageStyle.rem(view.columnLeft(0, 2)), 2);
    expect(PageStyle.rem(caret.top)).toBe(PageStyle.rem(view.lineBox(0).top));
    expect(PageStyle.rem(caret.height)).toBe(1.125);
    expect(getComputedStyle(view.host).outlineStyle).toBe("solid");
    const gutter: number = view.one(".nol-code-editor-gutter").getBoundingClientRect().left;

    await userEvent.keyboard("{ArrowDown}{End}");
    await view.stableAsync();

    expect(view.scroller.scrollLeft).toBeGreaterThan(0);
    expect(PageStyle.rem(view.one(".nol-code-editor-gutter").getBoundingClientRect().left)).toBe(PageStyle.rem(gutter));
    expect(view.one(".nol-code-editor-caret").getBoundingClientRect().right).toBeLessThanOrEqual(view.scroller.getBoundingClientRect().right);
    await userEvent.keyboard("{Home}");
    await view.stableAsync();
    expect(view.scroller.scrollLeft).toBe(0);
    view.input.blur();
    await view.stableAsync();
    expect(getComputedStyle(view.one(".nol-code-editor-caret")).visibility).toBe("hidden");
    expect(getComputedStyle(view.host).outlineStyle).toBe("none");
  });

  it("colors each token with the kit's code token color, on the kit's code background, and leaves the rest of the line plain", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("const a = 1;\nlet b", new RenderOptions(new KeywordTokenizer()));

    expect(view.texts(".nol-code-editor-token-keyword")).toEqual(["const"]);
    expect(view.texts(".nol-code-editor-plain")).toEqual([" a = 1;", "let b"]);
    expect(getComputedStyle(view.one(".nol-code-editor-token-keyword")).color).toBe(PageStyle.styleOf(StyleColor.Text, "--nol-code-keyword", view.host));
    expect(getComputedStyle(view.host).backgroundColor).toBe(PageStyle.styleOf(StyleColor.Text, "--nol-code", view.host));
  });

  it("styles its tokens by the app's token types, a type the app lacks plain, with one generated style element for every editor", async () => {
    const tokenTypes: TokenTypeRegistry = TestBed.inject(CodeEditorRegistries).registries.tokenTypes;
    tokenTypes.registerType(new TokenTypeDefinition("keyword.declaration", undefined, "keyword"));
    const view: EditorFixture = await EditorFixture.renderAsync("ab", new RenderOptions(new TypedTokenizer(["keyword.declaration", "made.up"])));
    await EditorFixture.renderAsync("ab", new RenderOptions(new TypedTokenizer(["keyword.declaration"])));
    const sheets: readonly Element[] = [...document.head.querySelectorAll("style[data-nol-code-tokens='nol-code-editor-token-']")];

    expect([view.texts(".nol-code-editor-token-keyword-declaration"), view.texts(".nol-code-editor-plain")]).toEqual([["a"], ["b"]]);
    expect(getComputedStyle(view.one(".nol-code-editor-token-keyword-declaration")).color).toBe(PageStyle.styleOf(StyleColor.Text, "--nol-code-keyword", view.host));
    expect(sheets.length).toBe(1);
  });

  it("types, breaks lines, deletes, moves and undoes with the keyboard, telling its owner each new selection", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("");
    view.editor.focus();

    await userEvent.keyboard("ab{Enter}cd{Backspace}{ArrowLeft}{Shift>}{ArrowUp}{/Shift}");
    await view.stableAsync();
    expect(view.document.text()).toBe("ab\nc");
    expect(view.carets()).toEqual(["1:0>0:0"]);
    expect(view.changes.length).toBeGreaterThan(5);
    await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);
    await view.stableAsync();
    expect(view.document.text()).toBe("ab\ncd");
  });

  it("leaves Tab and Shift+Tab to the page unless its owner lets Tab indent", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("ab");
    view.editor.focus();
    const back: KeyboardEvent = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, cancelable: true });

    view.input.dispatchEvent(back);
    await userEvent.keyboard("{Tab}");
    await view.stableAsync();

    expect(back.defaultPrevented).toBe(false);
    expect(view.document.text()).toBe("ab");
    expect(document.activeElement).not.toBe(view.input);
  });

  it("indents with Tab when its owner allows it, pages by the lines in view, and leaves keys it doesn't use to the page", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync(EditorFixture.lines(100), new RenderOptions(null, false, true));
    view.editor.focus();

    await userEvent.keyboard("{Tab}{PageDown}");
    await view.stableAsync();
    expect(view.document.lineText(0)).toBe("  line 0");
    expect(view.carets()).toEqual(["13:2>13:2"]);
    expect(view.scroller.scrollTop).toBeGreaterThan(0);
    const escape: KeyboardEvent = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    view.input.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(false);
    await userEvent.keyboard(`${TOP}{Shift>}{Tab}{/Shift}`);
    await view.stableAsync();
    expect(view.scroller.scrollTop).toBe(0);
    expect(view.document.lineText(0)).toBe("line 0");
    expect(document.activeElement).toBe(view.input);
  });

  it("runs a host's own key binding from the app's registries, ahead of the default for the same key", async () => {
    TestBed.inject(CodeEditorRegistries).registries.keyBindings.setUserRules(new List<IKeyBindingRule>([new KeyBindingRule(CoreCommands.cursorBottom.id, "mod+a")]));
    const view: EditorFixture = await EditorFixture.renderAsync("ab\ncd");
    view.editor.focus();

    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
    await view.stableAsync();
    TestBed.inject(CodeEditorRegistries).registries.keyBindings.setUserRules(new List<IKeyBindingRule>());

    expect(view.carets()).toEqual(["1:2>1:2"]);
  });

  it("waits for a key sequence's second chord, telling its owner the chord as the platform shows it, and drops it on another key, a click or the loss of focus", async () => {
    TestBed.inject(CodeEditorRegistries).registries.keyBindings.setUserRules(new List<IKeyBindingRule>([new KeyBindingRule(CoreCommands.cursorBottom.id, "ctrl+k ctrl+e")]));
    const view: EditorFixture = await EditorFixture.renderAsync("ab\ncd");
    const pendings: (string | null)[] = [];
    view.editor.keySequencePending.subscribe(t => pendings.push(t));
    view.editor.focus();

    await userEvent.keyboard("{Control>}k{/Control}{Control>}e{/Control}");
    await view.stableAsync();
    const moved: readonly string[] = view.carets();
    await userEvent.keyboard("{Control>}k{/Control}x");
    await userEvent.keyboard("{Control>}k{/Control}");
    view.scroller.dispatchEvent(new MouseEvent("mousedown", { button: 2, bubbles: true }));
    await userEvent.keyboard("{Control>}k{/Control}");
    view.input.blur();
    await view.stableAsync();
    TestBed.inject(CodeEditorRegistries).registries.keyBindings.setUserRules(new List<IKeyBindingRule>());

    const label: string = navigator.platform.startsWith("Mac") ? "⌃K" : "Ctrl+K";
    expect(moved).toEqual(["1:2>1:2"]);
    expect(view.document.text()).toBe("ab\ncd");
    expect(pendings).toEqual([label, null, label, null, label, null, label, null]);
  });

  it("leaves Home and End with Control to the page on Mac and goes to the document's ends with them elsewhere", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("ab\ncd");
    view.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(0, 1))]));
    view.editor.focus();
    const end: KeyboardEvent = new KeyboardEvent("keydown", { key: "End", code: "End", ctrlKey: true, cancelable: true });

    view.input.dispatchEvent(end);
    await view.stableAsync();

    const mac: boolean = navigator.platform.startsWith("Mac");
    expect(end.defaultPrevented).toBe(!mac);
    expect(view.carets()).toEqual([mac ? "0:1>0:1" : "1:2>1:2"]);
  });

  it("takes text, line breaks and replacements from input events, and leaves composing and other input to their own events", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("ab");
    const send = (inputType: string, data: string | null, isComposing: boolean = false): boolean =>
      view.input.dispatchEvent(new InputEvent("beforeinput", { inputType, data, isComposing, cancelable: true }));

    expect(send("insertReplacementText", "X")).toBe(false);
    send("insertParagraph", null);
    send("insertLineBreak", null);
    expect(send("deleteContentBackward", null)).toBe(false);
    expect(send("insertText", "y", true)).toBe(true);
    const composingKey: KeyboardEvent = new KeyboardEvent("keydown", { key: "Backspace", isComposing: true, cancelable: true });
    view.input.dispatchEvent(composingKey);
    await view.stableAsync();

    expect(composingKey.defaultPrevented).toBe(false);
    expect(view.document.text()).toBe("X\n\nab");
  });

  it("shows the composing text underlined at the caret and commits it once, as one step", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("ab");
    view.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(0, 1))]));
    view.input.dispatchEvent(new CompositionEvent("compositionstart", { data: "" }));
    view.input.dispatchEvent(new CompositionEvent("compositionupdate", { data: "に" }));
    await view.stableAsync();

    const shown: HTMLElement = view.one(".nol-code-editor-composition");
    expect(shown.textContent).toBe("に");
    expect(getComputedStyle(shown).textDecorationLine).toBe("underline");
    expect(PageStyle.rem(shown.getBoundingClientRect().left)).toBe(PageStyle.rem(view.one(".nol-code-editor-caret").getBoundingClientRect().left));
    expect(PageStyle.rem(shown.getBoundingClientRect().top)).toBe(PageStyle.rem(view.lineBox(0).top));
    view.input.dispatchEvent(new CompositionEvent("compositionend", { data: "日本" }));
    view.input.dispatchEvent(new CompositionEvent("compositionend", { data: "" }));
    await view.stableAsync();

    expect(view.document.text()).toBe("a日本b");
    expect(view.all(".nol-code-editor-composition")).toHaveLength(0);
    expect(view.input.value).toBe("a日本b");
    view.history.undo();
    expect(view.document.text()).toBe("ab");
  });

  it("copies and cuts the selections and pastes a line at each caret", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("one\ntwo");
    const clipboard = (type: string, text: string = ""): ClipboardEvent => {
      const data: DataTransfer = new DataTransfer();
      data.setData("text/plain", text);
      const event: ClipboardEvent = new ClipboardEvent(type, { clipboardData: data, cancelable: true });
      view.input.dispatchEvent(event);

      return event;
    };

    expect(clipboard("copy").defaultPrevented).toBe(false);
    view.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(0, 0), new TextPosition(0, 1)), new TextSelection(new TextPosition(1, 0), new TextPosition(1, 1))]));
    const copied: ClipboardEvent = clipboard("copy");
    expect(copied.defaultPrevented).toBe(true);
    expect(copied.clipboardData?.getData("text/plain")).toBe("o\nt");
    expect(clipboard("cut").clipboardData?.getData("text/plain")).toBe("o\nt");
    expect(view.document.text()).toBe("ne\nwo");
    expect(clipboard("paste", "1\n2").defaultPrevented).toBe(true);
    await view.stableAsync();

    expect(view.document.text()).toBe("1ne\n2wo");
  });

  it("places, extends, adds and drags carets with the mouse, at the nearer edge of the character clicked, ignoring other buttons", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("hello world\nsecond line\nthird");
    const press = (type: string, line: number, column: number, init: MouseEventInit = {}, fraction: number = 0.2): void => {
      const left: number = view.columnLeft(line, column);
      const box: DOMRect = view.lineBox(line);
      const point: MouseEventInit = { clientX: left + (view.columnLeft(line, column + 1) - left) * fraction, clientY: box.top + box.height / 2 };
      const target: EventTarget = type === "mousedown" ? view.scroller : document;
      target.dispatchEvent(new MouseEvent(type, { ...point, bubbles: true, cancelable: true, button: 0, ...init }));
    };

    press("mousedown", 0, 3, {}, 0.7);
    press("mouseup", 0, 4);
    await view.stableAsync();
    expect(view.carets()).toEqual(["0:4>0:4"]);
    expect(document.activeElement).toBe(view.input);
    press("mousedown", 1, 3, { shiftKey: true });
    press("mousedown", 2, 2, { altKey: true });
    press("mousemove", 2, 4);
    press("mouseup", 2, 4);
    press("mousemove", 0, 0);
    press("mousedown", 0, 0, { button: 2 });
    await view.stableAsync();

    expect(view.carets()).toEqual(["0:4>1:3", "2:2>2:4"]);
    expect(view.all(".nol-code-editor-selection")).toHaveLength(3);
    press("mousedown", 0, 1);
    press("mousemove", 1, 2);
    await view.stableAsync();
    expect(view.carets()).toEqual(["0:1>1:2"]);
    view.scroller.dispatchEvent(new MouseEvent("mousedown", { clientX: 10_000, clientY: 10_000, bubbles: true, cancelable: true }));
    await view.stableAsync();
    expect(view.carets()).toEqual(["2:5>2:5"]);
    view.fixture.destroy();
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 0, clientY: 0 }));
    expect(view.carets()).toEqual(["2:5>2:5"]);
  });

  it("drops a dragged text where the pointer is as one undo step, with a drop caret at that column while the drag is over the text", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("hello\nworld");
    const data: DataTransfer = new DataTransfer();
    data.setData("text/plain", "XY");
    const effects: readonly string[] = EditorFixture.effectsOf(data);
    const over: DragEvent = new DragEvent("dragover", { ...EditorFixture.pointAt(view, 1, 2), dataTransfer: data, bubbles: true, cancelable: true });

    view.scroller.dispatchEvent(over);
    await view.stableAsync();
    const caret: DOMRect = view.one(".nol-code-editor-drop-caret").getBoundingClientRect();
    expect([over.defaultPrevented, effects]).toEqual([true, ["copy"]]);
    expect(PageStyle.rem(caret.left - view.columnLeft(1, 2))).toBeCloseTo(0, 2);
    expect([PageStyle.rem(caret.top - view.lineBox(1).top), PageStyle.rem(caret.height - view.lineBox(1).height)]).toEqual([0, 0]);
    view.scroller.dispatchEvent(new DragEvent("dragleave", { bubbles: true }));
    await view.stableAsync();
    expect(view.all(".nol-code-editor-drop-caret")).toHaveLength(0);
    view.scroller.dispatchEvent(over);
    view.scroller.dispatchEvent(new DragEvent("drop", { ...EditorFixture.pointAt(view, 1, 2), dataTransfer: data, bubbles: true, cancelable: true }));
    await view.stableAsync();

    expect([view.document.text(), view.carets(), view.all(".nol-code-editor-drop-caret").length]).toEqual(["hello\nwoXYrld", ["1:2>1:4"], 0]);
    expect(document.activeElement).toBe(view.input);
    await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);
    expect(view.document.text()).toBe("hello\nworld");
  });

  it("refuses a dropped file, a drop with no plain text and any drop when read-only, keeping the browser from opening what was dropped", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("hello");
    const locked: EditorFixture = await EditorFixture.renderAsync("hello", new RenderOptions(null, true));
    const file: DataTransfer = new DataTransfer();
    file.items.add(new File(["x"], "a.txt", { type: "text/plain" }));
    const markup: DataTransfer = new DataTransfer();
    markup.setData("text/html", "<b>x</b>");
    const text: DataTransfer = new DataTransfer();
    text.setData("text/plain", "x");
    const effects: readonly (readonly string[])[] = [file, markup, text].map(t => EditorFixture.effectsOf(t));
    const events: DragEvent[] = [];
    const send = (target: EditorFixture, data: DataTransfer | null): void => {
      for (const type of ["dragover", "drop"]) {
        const event: DragEvent = new DragEvent(type, { ...EditorFixture.pointAt(target, 0, 1), dataTransfer: data, bubbles: true, cancelable: true });
        events.push(event);
        target.scroller.dispatchEvent(event);
      }
    };

    send(view, file);
    send(view, markup);
    send(view, null);
    send(locked, text);
    await view.stableAsync();
    await locked.stableAsync();

    expect(events.map(t => t.defaultPrevented)).toEqual(Array.from({ length: 8 }, () => true));
    expect(effects).toEqual([["none"], ["none"], ["none"]]);
    expect([view.document.text(), locked.document.text()]).toEqual(["hello", "hello"]);
    expect([...view.all(".nol-code-editor-drop-caret"), ...locked.all(".nol-code-editor-drop-caret")]).toHaveLength(0);
  });

  it("moves the selected text by dragging it within the view as one undo step, with a drop caret, and places the caret on a click inside it", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("hello world\nsecond line");
    const mouse = (target: EventTarget, type: string, line: number, column: number): void => {
      target.dispatchEvent(new MouseEvent(type, { ...EditorFixture.pointAt(view, line, column), bubbles: true, cancelable: true, button: 0 }));
    };
    view.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(0, 0), new TextPosition(0, 5))]));
    await view.stableAsync();

    mouse(view.scroller, "mousedown", 0, 2);
    mouse(document, "mousemove", 1, 6);
    await view.stableAsync();
    const caret: DOMRect = view.one(".nol-code-editor-drop-caret").getBoundingClientRect();
    expect([PageStyle.rem(caret.top - view.lineBox(1).top), view.carets()]).toEqual([0, ["0:0>0:5"]]);
    expect(PageStyle.rem(caret.left - view.columnLeft(1, 6))).toBeCloseTo(0, 2);
    mouse(document, "mouseup", 1, 6);
    await view.stableAsync();
    expect([view.document.text(), view.carets(), view.all(".nol-code-editor-drop-caret").length]).toEqual([" world\nsecondhello line", ["1:6>1:11"], 0]);
    await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);
    await view.stableAsync();
    expect([view.document.text(), view.carets()]).toEqual(["hello world\nsecond line", ["0:0>0:5"]]);

    mouse(view.scroller, "mousedown", 0, 2);
    mouse(document, "mouseup", 0, 2);
    await view.stableAsync();
    expect(view.carets()).toEqual(["0:2>0:2"]);
    view.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(0, 0), new TextPosition(0, 5))]));
    mouse(view.scroller, "mousedown", 0, 2);
    view.fixture.destroy();
    document.dispatchEvent(new MouseEvent("mouseup", { clientX: 0, clientY: 0 }));
    expect(view.document.text()).toBe("hello world\nsecond line");
  });

  it("draws a selection across lines in either direction, past the end of each line it crosses, and not on a line it only touches", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("abc\n\ndef\nghi");
    view.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(2, 1), new TextPosition(0, 1)), new TextSelection(new TextPosition(3, 1), new TextPosition(3, 1))]));
    await view.stableAsync();

    const shapes: readonly DOMRect[] = view.all(".nol-code-editor-selection").map(t => t.getBoundingClientRect());
    expect(shapes).toHaveLength(3);
    expect(shapes.map(t => PageStyle.rem(t.height))).toEqual([1.125, 1.125, 1.125]);
    expect(PageStyle.rem(shapes[0]?.left ?? 0)).toBeCloseTo(PageStyle.rem(view.columnLeft(0, 1)), 2);
    expect(PageStyle.rem(shapes[0]?.right ?? 0)).toBeGreaterThan(PageStyle.rem(view.columnLeft(0, 3)));
    expect(PageStyle.rem(shapes[1]?.left ?? 0)).toBeCloseTo(PageStyle.rem(view.columnLeft(2, 0)), 2);
    expect(PageStyle.rem(shapes[2]?.right ?? 0)).toBeCloseTo(PageStyle.rem(view.columnLeft(2, 1)), 2);
    view.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(0, 1), new TextPosition(1, 0))]));
    await view.stableAsync();
    expect(view.all(".nol-code-editor-selection")).toHaveLength(1);
  });

  it("holds the caret's line and the lines around it in its text field, named by its owner, for screen readers", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync(EditorFixture.lines(20));

    expect(view.input.getAttribute("aria-label")).toBe("Code");
    expect(view.input.value).toBe("line 0\nline 1\nline 2\nline 3");
    view.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(10, 2))]));
    await view.stableAsync();
    expect(view.input.value).toBe("line 7\nline 8\nline 9\nline 10\nline 11\nline 12\nline 13");
    expect(view.input.selectionStart).toBe(23);
    expect(view.one(".nol-code-editor-lines").getAttribute("aria-hidden")).toBe("true");
  });

  it("mirrors the selection into its text field, in its direction, clipped to the lines the field holds", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync(EditorFixture.lines(20));
    const mirrored = async (anchor: TextPosition, head: TextPosition): Promise<readonly (number | string | null)[]> => {
      view.editor.select(new List<TextSelection>([new TextSelection(anchor, head)]));
      await view.stableAsync();

      return [view.input.selectionStart, view.input.selectionEnd, view.input.selectionDirection];
    };

    expect(await mirrored(new TextPosition(10, 2), new TextPosition(11, 3))).toEqual([16, 25, "forward"]);
    expect(await mirrored(new TextPosition(11, 3), new TextPosition(10, 2))).toEqual([23, 32, "backward"]);
    expect(await mirrored(new TextPosition(0, 0), new TextPosition(10, 2))).toEqual([0, 23, "forward"]);
    expect(await mirrored(new TextPosition(19, 0), new TextPosition(10, 2))).toEqual([23, 52, "backward"]);
  });

  it("moves but doesn't edit when read-only", async () => {
    const view: EditorFixture = await EditorFixture.renderAsync("ab", new RenderOptions(null, true));
    view.editor.focus();

    await userEvent.keyboard("x{ArrowRight}{Backspace}");
    await view.stableAsync();

    expect(view.input.readOnly).toBe(true);
    expect(view.document.text()).toBe("ab");
    expect(view.carets()).toEqual(["0:1>0:1"]);
  });

  it("renders more lines when it grows, and tells its owner a selection set before it first renders", async () => {
    const fixture: ComponentFixture<CodeEditorComponent> = TestBed.createComponent(CodeEditorComponent);
    const text: TextDocument = TextDocument.fromText(EditorFixture.lines(200));
    const history: UndoHistory = new UndoHistory(text);
    fixture.componentRef.setInput("document", text);
    fixture.componentRef.setInput("history", history);
    fixture.componentRef.setInput("label", "Code");
    const view: EditorFixture = new EditorFixture(fixture, text, history);
    fixture.componentInstance.select(new List<TextSelection>([new TextSelection(new TextPosition(1, 1))]));
    fixture.nativeElement.style.height = "5rem";
    fixture.autoDetectChanges();
    await fixture.whenStable();
    await DomWait.untilAsync("the lines render", () => view.all(".nol-code-editor-line").length > 0);
    const before: number = view.all(".nol-code-editor-line").length;

    fixture.nativeElement.style.height = "30rem";

    await DomWait.untilAsync("more lines render", () => view.all(".nol-code-editor-line").length > before);
    expect(view.carets()).toEqual(["1:1>1:1"]);
    expect(view.changes).toHaveLength(1);
  });
});
