/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { DebugElement } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { type IBackgroundRunner, type ILineTokenizer, TextDocument, type TextPosition, UndoHistory } from "@noldova/code.editor";
import { CodeEditorClasses, CodeEditorComponent, CodeEditorRegistries } from "@noldova/code.editor.angular";
import { DocumentDiff } from "@noldova/code.editor.diff";
import { Dictionary, KeyValuePair } from "@noldova/context.collections";

import { DiffEditorComponent } from "../../src/app/components/diff-editor/diff-editor.component.ts";
import type { DiffLayout } from "../../src/app/enums/diff-layout.ts";
import { Resources } from "../../src/resources.ts";
import { DiffInputs } from "./diff-inputs.fixture.ts";
import { DiffSelectors } from "./diff-selectors.fixture.ts";
import { DiffValues } from "./diff-values.fixture.ts";
import { DomWait } from "./dom-wait.fixture.ts";
import { FixedHighlighter } from "./fixed-highlighter.fixture.ts";
import { PageStyle } from "./page-style.fixture.ts";
import { RowKind } from "./row-kind.fixture.ts";

export class DiffFixture {
  public readonly fixture: ComponentFixture<DiffEditorComponent>;
  public readonly diff: DocumentDiff;

  public constructor(fixture: ComponentFixture<DiffEditorComponent>, diff: DocumentDiff) {
    this.fixture = fixture;
    this.diff = diff;
  }

  public get panes(): number {
    return this.all(this.host, DiffSelectors.pane).length;
  }

  public get host(): HTMLElement {
    return this.fixture.nativeElement;
  }

  public get status(): string {
    return this.one(this.host, DiffSelectors.status).textContent;
  }

  public pane(index: number): HTMLElement {
    return this.all(this.host, DiffSelectors.pane)[index] ?? DiffFixture.missing(`pane ${index}`);
  }

  public view(index: number): CodeEditorComponent {
    const element: HTMLElement = this.pane(index);
    const debug: DebugElement | undefined = this.fixture.debugElement.queryAll(By.directive(CodeEditorComponent)).find(t => t.nativeElement === element);

    return debug?.injector.get(CodeEditorComponent) ?? DiffFixture.missing(`view ${index}`);
  }

  public one(inside: HTMLElement, selector: string): HTMLElement {
    return inside.querySelector<HTMLElement>(selector) ?? DiffFixture.missing(selector);
  }

  public all(inside: HTMLElement, selector: string): readonly HTMLElement[] {
    return [...inside.querySelectorAll<HTMLElement>(selector)];
  }

  public texts(pane: number, selector: string): readonly string[] {
    return this.all(this.pane(pane), selector).map(t => t.textContent);
  }

  public numbers(pane: number): readonly string[] {
    return this.all(this.pane(pane), DiffSelectors.lineNumber)
      .map(t => [...this.all(t, DiffSelectors.number).map(n => n.textContent), this.one(t, DiffSelectors.sign).textContent].join("|"));
  }

  public kinds(pane: number): readonly string[] {
    const element: HTMLElement = this.pane(pane);
    const named: Dictionary<string, string> = new Dictionary<string, string>([
      new KeyValuePair(PageStyle.paintOf(Resources.addedBackground, element), RowKind.Added),
      new KeyValuePair(PageStyle.paintOf(Resources.removedBackground, element), RowKind.Removed)
    ]);

    return this.all(element, DiffSelectors.row).map(t => {
      if (t.classList.contains(CodeEditorClasses.rowSpacer))
        return RowKind.Spacer;
      if (t.classList.contains(CodeEditorClasses.rowFold))
        return RowKind.Fold;
      const paint: HTMLElement | null = t.querySelector<HTMLElement>(DiffSelectors.paint);
      if (Object.isNull(paint))
        return RowKind.Plain;
      const color: string = getComputedStyle(paint).backgroundColor;

      return named.tryGet(color) ?? color;
    });
  }

  public toggles(pane: number): readonly string[] {
    return this.all(this.pane(pane), DiffSelectors.foldToggle).map(t => t.textContent);
  }

  public box(pane: number, selector: string, index: number): DOMRect {
    return (this.all(this.pane(pane), selector)[index] ?? DiffFixture.missing(`${selector} ${index}`)).getBoundingClientRect();
  }

  public click(pane: number, row: number): void {
    const box: DOMRect = this.box(pane, DiffSelectors.line, row);
    const scroller: HTMLElement = this.one(this.pane(pane), DiffSelectors.scroller);
    scroller.dispatchEvent(new MouseEvent(DiffValues.mouseDown, { clientX: box.left + 1, clientY: box.top + box.height / 2, bubbles: true, cancelable: true, button: 0 }));
    document.dispatchEvent(new MouseEvent(DiffValues.mouseUp, { bubbles: true }));
  }

  public async stableAsync(): Promise<void> {
    await this.fixture.whenStable();
  }

  public static async renderAsync(original: string, modified: string, layout: DiffLayout, tokenizer: ILineTokenizer | null = null,
    runner?: IBackgroundRunner, inputs: Readonly<Record<string, unknown>> = {}): Promise<DiffFixture> {
    const diff: DocumentDiff = new DocumentDiff(TextDocument.fromText(original), TextDocument.fromText(modified), undefined, runner);
    await diff.settledAsync();
    const fixture: ComponentFixture<DiffEditorComponent> = TestBed.createComponent(DiffEditorComponent);
    fixture.nativeElement.style.height = "20rem";
    fixture.nativeElement.style.width = "40rem";
    fixture.componentRef.setInput(DiffInputs.diff, diff);
    fixture.componentRef.setInput(DiffInputs.history, new UndoHistory(diff.modified));
    fixture.componentRef.setInput(DiffInputs.originalLabel, "Original");
    fixture.componentRef.setInput(DiffInputs.modifiedLabel, "Modified");
    fixture.componentRef.setInput(DiffInputs.layout, layout);
    fixture.componentRef.setInput(DiffInputs.language, Object.isNull(tokenizer) ? null
      : FixedHighlighter.register(TestBed.inject(CodeEditorRegistries).registries, () => Promise.resolve(tokenizer)).id);
    for (const [name, value] of Object.entries(inputs))
      fixture.componentRef.setInput(name, value);
    const rendered: DiffFixture = new DiffFixture(fixture, diff);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    await DomWait.untilAsync("the lines render", () => rendered.all(rendered.host, DiffSelectors.line).length > 0);

    return rendered;
  }

  public static useSettings(values: Readonly<Record<string, unknown>>): void {
    TestBed.inject(CodeEditorRegistries).registries.settings.setUserValues(values);
  }

  private static missing(what: string): never {
    throw new Error(`No ${what} in the diff view.`);
  }

  public static lines(count: number): readonly string[] {
    return Array.from({ length: count }, (_, i) => `line ${i}`);
  }

  public static where(position: TextPosition): string {
    return `${position.line}:${position.column}`;
  }
}
