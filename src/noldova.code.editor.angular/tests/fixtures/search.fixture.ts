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
import { TextDocument, TextPosition, TextSelection, UndoHistory } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { CodeEditorComponent } from "../../src/app/components/code-editor/code-editor.component.ts";
import { DomWait } from "./dom-wait.fixture.ts";

export class SearchFixture {
  public readonly fixture: ComponentFixture<CodeEditorComponent>;
  public readonly document: TextDocument;
  public readonly selections: IReadOnlyList<TextSelection>[] = [];

  public constructor(fixture: ComponentFixture<CodeEditorComponent>, document: TextDocument) {
    this.fixture = fixture;
    this.document = document;
    fixture.componentInstance.selectionsChange.subscribe(t => this.selections.push(t));
  }

  public get host(): HTMLElement {
    return this.fixture.nativeElement;
  }

  public get editor(): CodeEditorComponent {
    return this.fixture.componentInstance;
  }

  public get bar(): HTMLElement | null {
    return this.host.querySelector<HTMLElement>("noldova-find-bar");
  }

  public get status(): string {
    return this.one("[role=status]").textContent;
  }

  public get selected(): string {
    const selection: TextSelection | undefined = this.selections.at(-1)?.lastOrDefault();

    return Object.isUndefined(selection) ? "" : `${selection.anchor.line}:${selection.anchor.column}>${selection.head.line}:${selection.head.column}`;
  }

  public field(label: string): HTMLInputElement {
    const field: HTMLInputElement | null = this.host.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);

    return field ?? SearchFixture.missing(`${label} field`);
  }

  public button(label: string): HTMLButtonElement {
    const button: HTMLButtonElement | null = this.host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);

    return button ?? SearchFixture.missing(`${label} button`);
  }

  public one(selector: string): HTMLElement {
    return this.host.querySelector<HTMLElement>(selector) ?? SearchFixture.missing(selector);
  }

  public all(selector: string): readonly HTMLElement[] {
    return [...this.host.querySelectorAll<HTMLElement>(selector)];
  }

  public select(startLine: number, startColumn: number, endLine: number, endColumn: number): void {
    this.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(startLine, startColumn), new TextPosition(endLine, endColumn))]));
  }

  public columnLeft(line: number, column: number): number {
    const node: ChildNode | null = this.all(".nol-code-editor-line")[line]?.querySelector("span")?.firstChild ?? null;
    const text: Text = node instanceof Text ? node : SearchFixture.missing(`text of line ${line}`);
    const range: Range = document.createRange();
    range.setStart(text, column);
    range.setEnd(text, column);

    return range.getBoundingClientRect().left;
  }

  public async stableAsync(): Promise<void> {
    await this.fixture.whenStable();
  }

  public static async renderAsync(text: string, readOnly: boolean = false): Promise<SearchFixture> {
    const fixture: ComponentFixture<CodeEditorComponent> = TestBed.createComponent(CodeEditorComponent);
    const document: TextDocument = TextDocument.fromText(text);
    fixture.nativeElement.style.height = "15rem";
    fixture.nativeElement.style.width = "40rem";
    fixture.componentRef.setInput("document", document);
    fixture.componentRef.setInput("history", new UndoHistory(document));
    fixture.componentRef.setInput("label", "Code");
    fixture.componentRef.setInput("readOnly", readOnly);
    const rendered: SearchFixture = new SearchFixture(fixture, document);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    await DomWait.untilAsync("the lines render", () => rendered.all(".nol-code-editor-line").length > 0);
    rendered.editor.focus();

    return rendered;
  }

  private static missing(what: string): never {
    throw new Error(`No ${what} in the editor.`);
  }
}
