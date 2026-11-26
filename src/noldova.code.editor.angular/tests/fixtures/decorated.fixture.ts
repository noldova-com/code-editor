/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { TextDocument, TextPosition, TextSelection, UndoHistory } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";
import { expect } from "vitest";

import { CodeEditorComponent } from "../../src/app/components/code-editor/code-editor.component.ts";
import { FoldShortcut } from "../../src/app/enums/fold-shortcut.ts";
import type { CodeBarActionEvent } from "../../src/app/models/decorations/code-bar-action-event.ts";
import type { CodeDecorations } from "../../src/app/models/decorations/code-decorations.ts";
import type { CodeFold } from "../../src/app/models/folding/code-fold.ts";
import { DomWait } from "./dom-wait.fixture.ts";
import { PageStyle } from "./page-style.fixture.ts";

export class DecoratedFixture {
  public static readonly row: number = 1.125;

  public readonly fixture: ComponentFixture<CodeEditorComponent>;
  public readonly actions: CodeBarActionEvent[] = [];
  public readonly toggles: CodeFold[] = [];

  public constructor(fixture: ComponentFixture<CodeEditorComponent>) {
    this.fixture = fixture;
    fixture.componentInstance.barAction.subscribe(t => this.actions.push(t));
    fixture.componentInstance.foldToggle.subscribe(t => this.toggles.push(t));
  }

  public get host(): HTMLElement {
    return this.fixture.nativeElement;
  }

  public one(inside: HTMLElement, selector: string): HTMLElement {
    return inside.querySelector<HTMLElement>(selector) ?? DecoratedFixture.missing(selector);
  }

  public all(selector: string): readonly HTMLElement[] {
    return [...this.host.querySelectorAll<HTMLElement>(selector)];
  }

  public at(selector: string, index: number): HTMLElement {
    return this.all(selector)[index] ?? DecoratedFixture.missing(`${selector} ${index}`);
  }

  public rowGeometry(): readonly string[] {
    const sizer: DOMRect = this.one(this.host, ".nol-code-editor-sizer").getBoundingClientRect();
    const content: DOMRect = this.one(this.host, ".nol-code-editor-content").getBoundingClientRect();
    const lines: readonly HTMLElement[] = this.all(".nol-code-editor-line");
    const numbers: readonly HTMLElement[] = this.all(".nol-code-editor-line-number");

    return this.all(".nol-code-editor-row").map((element, index) => {
      const row: DOMRect = element.getBoundingClientRect();
      const lineTop: number = lines[index]?.getBoundingClientRect().top ?? Number.NaN;
      const numberTop: number = numbers[index]?.getBoundingClientRect().top ?? Number.NaN;

      return [row.top - sizer.top, row.height, row.left - content.left, sizer.right - row.right, lineTop - row.top, numberTop - row.top].map(t => PageStyle.rem(t)).join(" ");
    });
  }

  public sizerHeight(): number {
    return PageStyle.rem(this.one(this.host, ".nol-code-editor-sizer").getBoundingClientRect().height);
  }

  public static stacked(count: number): readonly string[] {
    return Array.from({ length: count }, (_, i) => `${i * DecoratedFixture.row} ${DecoratedFixture.row} 0 0 0 0`);
  }

  public texts(selector: string): readonly string[] {
    return this.all(selector).map(t => t.textContent);
  }

  public kinds(): readonly string[] {
    return this.all(".nol-code-editor-row").map(t => [...t.classList].find(c => c.startsWith("nol-code-editor-row-"))?.slice(20) ?? "");
  }

  public paints(selector: string, index: number): readonly string[] {
    return [...this.at(selector, index).querySelectorAll<HTMLElement>(".nol-code-editor-paint")].map(t => getComputedStyle(t).backgroundColor);
  }

  public numbers(): readonly string[] {
    return this.all(".nol-code-editor-line-number").map(t => [...t.querySelectorAll(".nol-code-editor-number")].map(n => n.textContent).join("|"));
  }

  public signs(): readonly string[] {
    return this.all(".nol-code-editor-line-number").map(t => t.querySelector(".nol-code-editor-sign")?.textContent ?? "");
  }

  public pressRow(row: number): void {
    const box: DOMRect = this.at(".nol-code-editor-line", row).getBoundingClientRect();
    this.one(this.host, ".nol-code-editor-scroller").dispatchEvent(new MouseEvent("mousedown",
      { clientX: box.left + 1, clientY: box.top + box.height / 2, bubbles: true, cancelable: true, button: 0 }));
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  }

  public pressFoldKey(shortcut: FoldShortcut, line: number): KeyboardEvent {
    const mac: boolean = /^Mac/u.test(navigator.platform);
    const code: string = shortcut === FoldShortcut.Fold ? "BracketLeft" : "BracketRight";
    this.fixture.componentInstance.select(new List<TextSelection>([new TextSelection(new TextPosition(line, 0))]));
    const key: KeyboardEvent = new KeyboardEvent("keydown", { code, ctrlKey: !mac, shiftKey: !mac, metaKey: mac, altKey: mac, bubbles: true, cancelable: true });
    this.one(this.host, ".nol-code-editor-input").dispatchEvent(key);

    return key;
  }

  public async setDecorationsAsync(decorations: readonly CodeDecorations[]): Promise<void> {
    this.fixture.componentRef.setInput("decorations", new List<CodeDecorations>(decorations));
    await this.fixture.whenStable();
  }

  public async setFoldsAsync(folds: readonly CodeFold[]): Promise<void> {
    this.fixture.componentRef.setInput("folds", new List<CodeFold>(folds));
    await this.fixture.whenStable();
  }

  public static async renderAsync(text: string, decorations: readonly CodeDecorations[], folds: readonly CodeFold[] = [],
    variables: ReadonlyMap<string, string> = new Map<string, string>()): Promise<DecoratedFixture> {
    const fixture: ComponentFixture<CodeEditorComponent> = TestBed.createComponent(CodeEditorComponent);
    const document: TextDocument = TextDocument.fromText(text);
    fixture.nativeElement.style.height = "20rem";
    fixture.nativeElement.style.width = "30rem";
    for (const [name, value] of variables)
      fixture.nativeElement.style.setProperty(name, value);
    fixture.componentRef.setInput("document", document);
    fixture.componentRef.setInput("history", new UndoHistory(document));
    fixture.componentRef.setInput("label", "Code");
    fixture.componentRef.setInput("readOnly", true);
    fixture.componentRef.setInput("decorations", new List<CodeDecorations>(decorations));
    fixture.componentRef.setInput("folds", new List<CodeFold>(folds));
    const rendered: DecoratedFixture = new DecoratedFixture(fixture);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    await DomWait.untilAsync("the lines render", () => rendered.all(".nol-code-editor-line").length > 0);

    return rendered;
  }

  private static missing(what: string): never {
    throw new Error(`No ${what} in the editor.`);
  }

  public static columnLeft(line: HTMLElement, column: number): number {
    const node: ChildNode | null = line.querySelector("span")?.firstChild ?? null;
    if (!(node instanceof Text))
      throw new Error("No text on the line.");
    const range: Range = document.createRange();
    range.setStart(node, column);
    range.setEnd(node, column);

    return range.getBoundingClientRect().left;
  }

  public static expectCovers(change: HTMLElement, line: HTMLElement, start: number, end: number): void {
    const box: DOMRect = change.getBoundingClientRect();
    expect(PageStyle.rem(box.left - DecoratedFixture.columnLeft(line, start))).toBeCloseTo(0, 2);
    expect(PageStyle.rem(box.right - DecoratedFixture.columnLeft(line, end))).toBeCloseTo(0, 2);
    expect(PageStyle.rem(box.top - line.getBoundingClientRect().top)).toBe(0);
  }
}
