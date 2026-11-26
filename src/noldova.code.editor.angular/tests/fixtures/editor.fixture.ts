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
import { type ILineTokenizer, TextDocument, type TextSelection, UndoHistory } from "@noldova/code.editor";
import type { IReadOnlyList } from "@noldova/context.collections";

import { CodeEditorComponent } from "../../src/app/components/code-editor/code-editor.component.ts";
import { CodeEditorRegistries } from "../../src/app/services/code-editor-registries.ts";
import { DomWait } from "./dom-wait.fixture.ts";
import { FixedHighlighter } from "./fixed-highlighter.fixture.ts";
import { RenderOptions } from "./render-options.fixture.ts";

export class EditorFixture {
  public readonly fixture: ComponentFixture<CodeEditorComponent>;
  public readonly document: TextDocument;
  public readonly history: UndoHistory;
  public readonly changes: IReadOnlyList<TextSelection>[] = [];

  public constructor(fixture: ComponentFixture<CodeEditorComponent>, document: TextDocument, history: UndoHistory) {
    this.fixture = fixture;
    this.document = document;
    this.history = history;
    fixture.componentInstance.selectionsChange.subscribe(t => this.changes.push(t));
  }

  public get host(): HTMLElement {
    return this.fixture.nativeElement;
  }

  public get editor(): CodeEditorComponent {
    return this.fixture.componentInstance;
  }

  public get scroller(): HTMLElement {
    return this.one(".nol-code-editor-scroller");
  }

  public get input(): HTMLTextAreaElement {
    return this.host.querySelector("textarea") ?? EditorFixture.missing("textarea");
  }

  public one(selector: string): HTMLElement {
    return this.host.querySelector<HTMLElement>(selector) ?? EditorFixture.missing(selector);
  }

  public all(selector: string): readonly HTMLElement[] {
    return [...this.host.querySelectorAll<HTMLElement>(selector)];
  }

  public texts(selector: string): readonly string[] {
    return this.all(selector).map(t => t.textContent);
  }

  public carets(): readonly string[] {
    return this.changes.at(-1)?.select(t => `${t.anchor.line}:${t.anchor.column}>${t.head.line}:${t.head.column}`).toArray() ?? [];
  }

  public lineBox(line: number): DOMRect {
    return (this.all(".nol-code-editor-line")[line] ?? EditorFixture.missing(`line ${line}`)).getBoundingClientRect();
  }

  public columnLeft(line: number, column: number): number {
    const node: ChildNode | null = this.all(".nol-code-editor-line")[line]?.querySelector("span")?.firstChild ?? null;
    const text: Text = node instanceof Text ? node : EditorFixture.missing(`text of line ${line}`);
    const range: Range = document.createRange();
    range.setStart(text, column);
    range.setEnd(text, column);

    return range.getBoundingClientRect().left;
  }

  public async stableAsync(): Promise<void> {
    await this.fixture.whenStable();
  }

  public static async renderAsync(text: string, options: RenderOptions = new RenderOptions()): Promise<EditorFixture> {
    return EditorFixture.renderDocumentAsync(TextDocument.fromText(text), options);
  }

  public static async renderDocumentAsync(document: TextDocument, options: RenderOptions = new RenderOptions()): Promise<EditorFixture> {
    const fixture: ComponentFixture<CodeEditorComponent> = TestBed.createComponent(CodeEditorComponent);
    const history: UndoHistory = new UndoHistory(document);
    fixture.nativeElement.style.height = "15rem";
    fixture.nativeElement.style.width = "20rem";
    fixture.componentRef.setInput("document", document);
    fixture.componentRef.setInput("history", history);
    fixture.componentRef.setInput("label", "Code");
    const tokenizer: ILineTokenizer | null = options.tokenizer;
    fixture.componentRef.setInput("language", Object.isNull(tokenizer) ? null
      : FixedHighlighter.register(TestBed.inject(CodeEditorRegistries).registries, () => Promise.resolve(tokenizer)));
    fixture.componentRef.setInput("readOnly", options.readOnly);
    fixture.componentRef.setInput("tabIndents", options.tabIndents);
    const rendered: EditorFixture = new EditorFixture(fixture, document, history);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    await DomWait.untilAsync("the lines render", () => rendered.all(".nol-code-editor-line").length > 0);

    return rendered;
  }

  private static missing(what: string): never {
    throw new Error(`No ${what} in the editor.`);
  }

  public static lines(count: number): string {
    return Array.from({ length: count }, (_, i) => `line ${i}`).join("\n");
  }

  public static nextFrameAsync(): Promise<void> {
    return new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }

  public static code(count: number, first: string): string {
    return [first, ...Array.from({ length: count - 1 }, (_, i) => `const value${i} = ${i};`)].join("\n");
  }

  public static kindsAt(view: EditorFixture, index: number): readonly string[] {
    return [...(view.all(".nol-code-editor-line")[index]?.children ?? [])].map(t => t.className);
  }

  public static effectsOf(data: DataTransfer): readonly string[] {
    const effects: string[] = [];
    Object.defineProperty(data, "dropEffect", {
      get: () => effects.at(-1) ?? "none",
      set: (value: string) => {
        effects.push(value);
      }
    });

    return effects;
  }

  public static pointAt(view: EditorFixture, line: number, column: number): MouseEventInit {
    const left: number = view.columnLeft(line, column);
    const box: DOMRect = view.lineBox(line);

    return { clientX: left + (view.columnLeft(line, column + 1) - left) * 0.2, clientY: box.top + box.height / 2 };
  }
}
