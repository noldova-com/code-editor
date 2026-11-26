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
import { type ILineTokenizer, TextDocument, UndoHistory } from "@noldova/code.editor";

import { CodeEditorComponent } from "../../src/app/components/code-editor/code-editor.component.ts";
import { CodeEditorRegistries } from "../../src/app/services/code-editor-registries.ts";
import { DomWait } from "../fixtures/dom-wait.fixture.ts";
import { FixedHighlighter } from "../fixtures/fixed-highlighter.fixture.ts";

export class PerfView {
  public static readonly LINE_SELECTOR: string = ".nol-code-editor-line";
  private static readonly HEIGHT: string = "45rem";
  private static readonly WIDTH: string = "75rem";
  private static readonly BOUND: number = 120_000;

  public readonly fixture: ComponentFixture<CodeEditorComponent>;
  public readonly document: TextDocument;

  private constructor(fixture: ComponentFixture<CodeEditorComponent>, document: TextDocument) {
    this.fixture = fixture;
    this.document = document;
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

  public get input(): HTMLElement {
    return this.one("textarea");
  }

  public get lineHeight(): number {
    return this.one(PerfView.LINE_SELECTOR).getBoundingClientRect().height;
  }

  public all(selector: string): readonly HTMLElement[] {
    return [...this.host.querySelectorAll<HTMLElement>(selector)];
  }

  public one(selector: string): HTMLElement {
    const element: HTMLElement | null = this.host.querySelector<HTMLElement>(selector);
    if (Object.isNull(element))
      throw new Error(`No ${selector} in the editor.`);

    return element;
  }

  public kindsAt(index: number): readonly string[] {
    return [...(this.all(PerfView.LINE_SELECTOR)[index]?.children ?? [])].map(t => t.className);
  }

  public async untilAsync(description: string, condition: () => boolean): Promise<void> {
    await DomWait.untilAsync(description, condition, PerfView.BOUND);
  }

  public destroy(): void {
    this.fixture.destroy();
  }

  public static async openAsync(text: string, tokenizer: ILineTokenizer | null = null): Promise<PerfView> {
    const document: TextDocument = await TextDocument.fromTextAsync(text, () => new Promise<void>(resolve => setTimeout(resolve)));
    const fixture: ComponentFixture<CodeEditorComponent> = TestBed.createComponent(CodeEditorComponent);
    fixture.nativeElement.style.height = PerfView.HEIGHT;
    fixture.nativeElement.style.width = PerfView.WIDTH;
    fixture.componentRef.setInput("document", document);
    fixture.componentRef.setInput("history", new UndoHistory(document));
    fixture.componentRef.setInput("label", "Code");
    fixture.componentRef.setInput("language", Object.isNull(tokenizer) ? null
      : FixedHighlighter.register(TestBed.inject(CodeEditorRegistries).registries, () => Promise.resolve(tokenizer)));
    const view: PerfView = new PerfView(fixture, document);
    fixture.autoDetectChanges();
    await view.untilAsync("the lines render", () => view.all(PerfView.LINE_SELECTOR).length > 0);

    return view;
  }
}
