/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { TextDocument, type TextPosition, UndoHistory } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";

import { CodeEditorComponent } from "../../src/app/components/code-editor/code-editor.component.ts";
import type { CodeDecorations } from "../../src/app/models/decorations/code-decorations.ts";
import { DomWait } from "./dom-wait.fixture.ts";
import { EmbeddedInputs } from "./embedded-inputs.fixture.ts";
import { EmbeddedSelectors } from "./embedded-selectors.fixture.ts";
import { EmbeddedValues } from "./embedded-values.fixture.ts";

export class EmbeddedFixture {
  public readonly fixture: ComponentFixture<CodeEditorComponent>;

  public constructor(fixture: ComponentFixture<CodeEditorComponent>) {
    this.fixture = fixture;
  }

  public get editor(): CodeEditorComponent {
    return this.fixture.componentInstance;
  }

  public get host(): HTMLElement {
    return this.fixture.nativeElement;
  }

  public all(selector: string): readonly HTMLElement[] {
    return [...this.host.querySelectorAll<HTMLElement>(selector)];
  }

  public texts(selector: string): readonly string[] {
    return this.all(selector).map(t => t.textContent);
  }

  public numbers(): readonly string[] {
    return this.all(EmbeddedSelectors.lineNumber).map(t => [...t.querySelectorAll(EmbeddedSelectors.number)].map(n => n.textContent).join("|"));
  }

  public pressRow(row: number): void {
    const box: DOMRect | undefined = this.all(EmbeddedSelectors.line)[row]?.getBoundingClientRect();
    if (Object.isUndefined(box))
      throw new Error(`No row ${row} in the editor.`);
    this.all(EmbeddedSelectors.scroller)[0]?.dispatchEvent(new MouseEvent(EmbeddedValues.mouseDown,
      { clientX: box.left + 1, clientY: box.top + box.height / 2, bubbles: true, cancelable: true, button: 0 }));
    document.dispatchEvent(new MouseEvent(EmbeddedValues.mouseUp, { bubbles: true }));
  }

  public async stableAsync(): Promise<void> {
    await this.fixture.whenStable();
  }

  public static async renderAsync(text: string, decorations: readonly CodeDecorations[]): Promise<EmbeddedFixture> {
    const fixture: ComponentFixture<CodeEditorComponent> = TestBed.createComponent(CodeEditorComponent);
    const document: TextDocument = TextDocument.fromText(text);
    fixture.nativeElement.style.height = "20rem";
    fixture.nativeElement.style.width = "30rem";
    fixture.componentRef.setInput(EmbeddedInputs.document, document);
    fixture.componentRef.setInput(EmbeddedInputs.history, new UndoHistory(document));
    fixture.componentRef.setInput(EmbeddedInputs.label, "Code");
    fixture.componentRef.setInput(EmbeddedInputs.decorations, new List<CodeDecorations>(decorations));
    const rendered: EmbeddedFixture = new EmbeddedFixture(fixture);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    await DomWait.untilAsync("the lines render", () => rendered.all(EmbeddedSelectors.line).length > 0);

    return rendered;
  }

  public static where(position: TextPosition): string {
    return `${position.line}:${position.column}`;
  }
}
