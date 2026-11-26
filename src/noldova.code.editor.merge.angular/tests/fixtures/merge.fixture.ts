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
import { TextPosition, TextSelection } from "@noldova/code.editor";
import { CodeEditorClasses, CodeEditorComponent } from "@noldova/code.editor.angular";
import type { ConflictMarkersException, ConflictState } from "@noldova/code.editor.merge";
import { List } from "@noldova/context.collections";

import { MergeEditorComponent } from "../../src/app/components/merge-editor/merge-editor.component.ts";
import { DomWait } from "./dom-wait.fixture.ts";
import { PageStyle } from "./page-style.fixture.ts";

export class MergeFixture {
  public static readonly ours: string = "color-mix(in srgb, var(--nol-author-3) 16%, transparent)";
  public static readonly theirs: string = "color-mix(in srgb, var(--nol-author-5) 16%, transparent)";
  private static readonly ROW_BAR: string = `${CodeEditorClasses.row}-bar`;

  public readonly fixture: ComponentFixture<MergeEditorComponent>;
  public readonly results: string[] = [];
  public readonly conflicts: (readonly ConflictState[])[] = [];
  public readonly actives: (number | null)[] = [];
  public readonly failures: ConflictMarkersException[] = [];

  public constructor(fixture: ComponentFixture<MergeEditorComponent>) {
    this.fixture = fixture;
    const editor: MergeEditorComponent = fixture.componentInstance;
    editor.resultChange.subscribe(t => this.results.push(t));
    editor.conflictsChange.subscribe(t => this.conflicts.push(t.toArray()));
    editor.activeConflictChange.subscribe(t => this.actives.push(t));
    editor.markersFailed.subscribe(t => this.failures.push(t));
  }

  public get editor(): MergeEditorComponent {
    return this.fixture.componentInstance;
  }

  public get host(): HTMLElement {
    return this.fixture.nativeElement;
  }

  public get status(): string {
    return this.one(this.host, "[role=status]").textContent;
  }

  public get summary(): string {
    return this.one(this.host, ".nol-merge-editor-summary").textContent;
  }

  public get result(): HTMLElement {
    return this.one(this.host, ".nol-merge-editor-result");
  }

  public side(index: number): HTMLElement {
    return this.all(this.host, ".nol-merge-editor-pane")[index] ?? MergeFixture.missing(`side ${index}`);
  }

  public column(index: number): HTMLElement {
    return this.all(this.host, ".nol-merge-editor-side")[index] ?? MergeFixture.missing(`column ${index}`);
  }

  public get output(): HTMLElement {
    return this.one(this.host, ".nol-merge-editor-output");
  }

  public view(element: HTMLElement): CodeEditorComponent {
    const debug: DebugElement | undefined = this.fixture.debugElement.queryAll(By.directive(CodeEditorComponent)).find(t => t.nativeElement === element);

    return debug?.injector.get(CodeEditorComponent) ?? MergeFixture.missing("view");
  }

  public button(text: string): HTMLButtonElement {
    const button: HTMLButtonElement | undefined = [...this.host.querySelectorAll<HTMLButtonElement>("button")]
      .find(t => t.textContent.trim() === text || t.getAttribute("aria-label") === text);

    return button ?? MergeFixture.missing(`button ${text}`);
  }

  public one(inside: HTMLElement, selector: string): HTMLElement {
    return inside.querySelector<HTMLElement>(selector) ?? MergeFixture.missing(selector);
  }

  public all(inside: HTMLElement, selector: string): readonly HTMLElement[] {
    return [...inside.querySelectorAll<HTMLElement>(selector)];
  }

  public texts(pane: HTMLElement, selector: string): readonly string[] {
    return this.all(pane, selector).map(t => t.textContent);
  }

  public kinds(pane: HTMLElement): readonly string[] {
    const named: ReadonlyMap<string, string> = new Map<string, string>([
      [PageStyle.paintOf(MergeFixture.ours, pane), "ours"],
      [PageStyle.paintOf(MergeFixture.theirs, pane), "theirs"],
      [PageStyle.paintOf("transparent", pane), "plain"]
    ]);
    const signs: readonly string[] = this.all(pane, ".nol-code-editor-line-number").map(t => t.querySelector(".nol-code-editor-sign")?.textContent ?? "");

    return this.all(pane, ".nol-code-editor-row").map((t, index) => {
      if (t.classList.contains(MergeFixture.ROW_BAR))
        return "bar";
      const layer: HTMLElement | null = t.querySelector<HTMLElement>(".nol-code-editor-paint");
      const style: CSSStyleDeclaration | null = Object.isNull(layer) ? null : getComputedStyle(layer);
      const kind: string = Object.isNull(style) ? "plain" : style.backgroundImage.includes("linear-gradient") ? "mixed" : named.get(style.backgroundColor) ?? style.backgroundColor;

      return kind === "plain" && signs[index] === "!" ? "conflict" : kind;
    });
  }

  public layer(pane: HTMLElement, row: number): HTMLElement {
    return this.one(this.all(pane, ".nol-code-editor-row")[row] ?? MergeFixture.missing(`row ${row}`), ".nol-code-editor-paint");
  }

  public box(element: HTMLElement): DOMRect {
    return element.getBoundingClientRect();
  }

  public click(pane: HTMLElement, row: number): void {
    const line: HTMLElement = this.all(pane, ".nol-code-editor-line")[row] ?? MergeFixture.missing(`line ${row}`);
    const box: DOMRect = line.getBoundingClientRect();
    this.one(pane, ".nol-code-editor-scroller").dispatchEvent(new MouseEvent("mousedown",
      { clientX: box.left + 1, clientY: box.top + box.height / 2, bubbles: true, cancelable: true, button: 0 }));
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  }

  public caretAt(line: number, column: number): void {
    const position: TextPosition = new TextPosition(line, column);
    this.view(this.result).select(new List<TextSelection>([new TextSelection(position, position)]));
  }

  public async stableAsync(): Promise<void> {
    await this.fixture.whenStable();
  }

  public static async renderAsync(base: string | null, ours: string | null, theirs: string | null, merged: string | null = null,
    readOnly: boolean = false): Promise<MergeFixture> {
    const fixture: ComponentFixture<MergeEditorComponent> = TestBed.createComponent(MergeEditorComponent);
    const rendered: MergeFixture = new MergeFixture(fixture);
    fixture.nativeElement.style.height = "30rem";
    fixture.nativeElement.style.width = "48rem";
    fixture.componentRef.setInput("base", base);
    fixture.componentRef.setInput("ours", ours);
    fixture.componentRef.setInput("theirs", theirs);
    fixture.componentRef.setInput("merged", merged);
    fixture.componentRef.setInput("oursLabel", "onto main");
    fixture.componentRef.setInput("theirsLabel", "your commit abc1234");
    fixture.componentRef.setInput("readOnly", readOnly);
    fixture.autoDetectChanges();
    await fixture.whenStable();

    return rendered;
  }

  private static missing(what: string): never {
    throw new Error(`No ${what} in the merge view.`);
  }

  public static labels(pane: HTMLElement): readonly string[] {
    return [...pane.querySelectorAll<HTMLElement>(".nol-code-editor-action")]
      .map(t => [...t.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join("").trim());
  }

  public static async linesAsync(view: MergeFixture, pane: HTMLElement): Promise<void> {
    await DomWait.untilAsync("the pane's lines render", () => view.all(pane, ".nol-code-editor-line").length > 0);
  }
}
