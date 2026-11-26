/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Component, computed, DestroyRef, effect, ElementRef, inject, input, type InputSignal, output, type OutputEmitterRef, signal, type Signal, viewChild,
  type WritableSignal } from "@angular/core";
import { CommandContext, ConditionValues, EditorFeatureSet, EditorRegistries, type ILanguageDefinition, type ILineTokenizer, KeyDispatchResult, KeyPress, type Setting, type TextDocument, TextPosition,
  TextSelection, TokenCache, UndoHistory } from "@noldova/code.editor";
import { BackgroundTicker, CodeEditorComponent, CodeEmbeddedLines, type CodeFold, type CodeInsertedRows, type ICodeDecorations, KeyScope,
  LanguageTokenizer } from "@noldova/code.editor.angular";
import { DiffSide, type DocumentDiff, type LineChange } from "@noldova/code.editor.diff";
import { type Enumerable, HashSet, type IReadOnlyList, type IReadOnlySet, List } from "@noldova/context.collections";

import { Resources } from "../../../resources.ts";
import { DiffLayout } from "../../enums/diff-layout.ts";
import type { IDiffNavigator } from "../../interfaces/i-diff-navigator.ts";
import { DiffFolds } from "../../models/diff-folds.ts";
import { DiffLayer } from "../../models/diff-layer.ts";
import { InlineNumbering } from "../../models/inline-numbering.ts";
import { DiffEditorFeatures } from "../../services/diff-editor-features.ts";
import { DiffEditorRegistries } from "../../services/diff-editor-registries.ts";
import { DiffEditorSettings } from "../../services/diff-editor-settings.ts";

@Component({
  selector: "noldova-diff-editor",
  imports: [CodeEditorComponent],
  providers: [KeyScope],
  templateUrl: "./diff-editor.component.html",
  styleUrl: "./diff-editor.component.css",
  host: {
    "class": Resources.hostClass,
    [Resources.inlineClassBinding]: "inline()"
  }
})
export class DiffEditorComponent implements IDiffNavigator {
  private readonly registries: EditorRegistries = new EditorRegistries(inject(DiffEditorRegistries).registries);
  private readonly conditions: ConditionValues = new ConditionValues(this.registries.conditions);
  private readonly features: EditorFeatureSet = new EditorFeatureSet();
  private readonly keys: KeyScope = inject(KeyScope);
  private readonly settingsVersion: WritableSignal<number> = signal<number>(0);
  private readonly originalView: Signal<CodeEditorComponent | undefined> = viewChild<CodeEditorComponent>("original");
  private readonly modifiedView: Signal<CodeEditorComponent> = viewChild.required<CodeEditorComponent>("modified");
  private readonly version: WritableSignal<number> = signal<number>(0);
  private readonly originalCache: WritableSignal<TokenCache | null> = signal<TokenCache | null>(null);
  private readonly opened: WritableSignal<IReadOnlySet<number>> = signal<IReadOnlySet<number>>(new HashSet<number>());
  private readonly width: WritableSignal<number> = signal<number>(Number.POSITIVE_INFINITY);

  public readonly diff: InputSignal<DocumentDiff> = input.required<DocumentDiff>();
  public readonly history: InputSignal<UndoHistory> = input.required<UndoHistory>();
  public readonly originalHistory: InputSignal<UndoHistory | null> = input<UndoHistory | null>(null);
  public readonly language: InputSignal<string | ILanguageDefinition | null> = input<string | ILanguageDefinition | null>(null);
  public readonly layout: InputSignal<DiffLayout> = input<DiffLayout>(DiffLayout.Automatic);
  public readonly originalLabel: InputSignal<string> = input.required<string>();
  public readonly modifiedLabel: InputSignal<string> = input.required<string>();
  public readonly readOnly: InputSignal<boolean> = input<boolean>(false);
  public readonly originalReadOnly: InputSignal<boolean> = input<boolean>(true);
  public readonly keySequencePending: OutputEmitterRef<string | null> = output<string | null>();

  private readonly tokenizer: Signal<ILineTokenizer | null> = LanguageTokenizer.of(this.language);
  public readonly inline: Signal<boolean> = computed(() => this.layout() === DiffLayout.Inline ||
    this.layout() === DiffLayout.Automatic && this.width() < this.setting(DiffEditorSettings.inlineBreakpoint) * DiffEditorComponent.remPixels());
  protected readonly originalUndo: Signal<UndoHistory> = computed(() => this.originalHistory() ?? new UndoHistory(this.diff().original));
  protected readonly folds: Signal<DiffFolds> = computed(() => {
    this.version();
    const contextLines: number = this.setting(DiffEditorSettings.contextLines);

    return new DiffFolds(this.diff().unchangedRegions(contextLines, this.setting(DiffEditorSettings.minimumHiddenLines)), this.opened());
  });
  protected readonly originalDecorations: Signal<IReadOnlyList<ICodeDecorations>> = computed(() => {
    this.version();

    return new List<ICodeDecorations>([new DiffLayer(this.diff(), DiffSide.Original)]);
  });
  protected readonly modifiedDecorations: Signal<IReadOnlyList<ICodeDecorations>> = computed(() => {
    this.version();

    return new List<ICodeDecorations>([new DiffLayer(this.diff(), DiffSide.Modified)]);
  });
  protected readonly inlineDecorations: Signal<IReadOnlyList<ICodeDecorations>> = computed(() => {
    this.version();
    const diff: DocumentDiff = this.diff();
    const removed: DiffLayer = new DiffLayer(diff, DiffSide.Original, new List<CodeInsertedRows>());
    const rows: IReadOnlyList<CodeInsertedRows> = diff.changes
      .where(t => t.originalLength > 0)
      .select((t): CodeInsertedRows => new CodeEmbeddedLines(t.modifiedStart, diff.original, t.originalStart, t.originalLength, this.originalCache(), removed))
      .toList();

    return new List<ICodeDecorations>([new DiffLayer(diff, DiffSide.Modified, rows, new InlineNumbering(diff))]);
  });
  protected readonly announcement: WritableSignal<string> = signal<string>(Resources.empty);

  public constructor() {
    this.conditions.set(DiffEditorFeatures.inDiffEditor, true);
    this.features.provide(DiffEditorFeatures.navigator, this);
    this.keys.attach(t => this.contextAt(t));
    this.keys.listen(t => this.keySequencePending.emit(t));
    const settingsChange: Disposable = this.registries.settings.onChange(() => this.settingsVersion.update(t => t + 1));
    effect(onCleanup => onCleanup(this.diff().onChange(() => this.version.update(t => t + 1))));
    effect(() => {
      this.diff().characterDiffLimit = this.setting(DiffEditorSettings.characterDiffLimit);
    });
    effect(onCleanup => {
      const tokenizer: ILineTokenizer | null = this.inline() ? this.tokenizer() : null;
      const original: TextDocument = this.diff().original;
      const cache: TokenCache | null = Object.isNull(tokenizer) ? null : new TokenCache(original, tokenizer);
      const ticker: BackgroundTicker | null = Object.isNull(cache) ? null : new BackgroundTicker(original, hasTime => {
        const from: number = cache.validLineCount;
        const more: boolean = cache.advance(hasTime);
        this.onOriginalTokens(from, cache.validLineCount);

        return more;
      });
      this.originalCache.set(cache);
      onCleanup(() => {
        ticker?.[Symbol.dispose]();
        cache?.[Symbol.dispose]();
      });
    });
    const host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const listener: (event: KeyboardEvent) => void = event => this.onKeyDown(event);
    const observer: ResizeObserver = new ResizeObserver(entries => {
      for (const entry of entries)
        this.width.set(entry.contentRect.width);
    });
    observer.observe(host);
    host.addEventListener(Resources.keyDown, listener);
    inject(DestroyRef).onDestroy(() => {
      observer.disconnect();
      host.removeEventListener(Resources.keyDown, listener);
      settingsChange[Symbol.dispose]();
    });
  }

  public nextChange(): boolean {
    return this.moveToChange(true);
  }

  public previousChange(): boolean {
    return this.moveToChange(false);
  }

  protected toggle(fold: CodeFold): void {
    const key: number = this.folds().keyOf(fold);
    this.opened.update(t => DiffEditorComponent.toggled(t, key, fold.collapsed));
  }

  protected reveal(folds: IReadOnlyList<CodeFold>, selections: IReadOnlyList<TextSelection>): void {
    const keys: Enumerable<number> = selections
      .select(t => this.folds().hiding(folds, t.head.line))
      .where((t): t is CodeFold => !Object.isNull(t))
      .select(t => this.folds().keyOf(t));
    if (keys.any())
      this.opened.update(t => new HashSet<number>(t.concat(keys)));
  }

  private onOriginalTokens(from: number, to: number): void {
    if (this.diff().changes.any(t => t.originalLength > 0 && t.originalStart < to && from < t.originalEnd))
      this.modifiedView().refreshTokens();
  }

  private setting(setting: Setting<number>): number {
    this.settingsVersion();

    return this.registries.settings.get(setting);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.isComposing)
      return;
    const press: KeyPress = new KeyPress(event.key, event.code, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey);
    if (this.keys.dispatch(press, this.contextAt(event.timeStamp)) === KeyDispatchResult.None)
      return;
    event.preventDefault();
    event.stopPropagation();
  }

  private contextAt(time: number): CommandContext {
    return new CommandContext(this.registries, this.conditions, this.features, null, time, 0);
  }

  private moveToChange(next: boolean): boolean {
    const original: CodeEditorComponent | undefined = this.originalView();
    const view: CodeEditorComponent = original?.hasFocus() === true ? original : this.modifiedView();
    const side: DiffSide = view === original ? DiffSide.Original : DiffSide.Modified;
    const diff: DocumentDiff = this.diff();
    const line: number = view.caret().line;
    const change: LineChange | null = next ? diff.changeAfter(line, side) : diff.changeBefore(line, side);
    if (Object.isNull(change)) {
      this.announcement.set(Resources.noChanges);

      return false;
    }
    const lineCount: number = side === DiffSide.Original ? diff.original.lineCount : diff.modified.lineCount;
    const position: TextPosition = new TextPosition(Math.min(change.startOf(side), lineCount - 1), 0);
    view.select(new List<TextSelection>([new TextSelection(position, position)]));
    view.focus();
    this.announcement.set(Resources.formatChange(change.index + 1, diff.changes.count(), change.originalLength, change.modifiedLength));

    return true;
  }

  private static toggled(opened: IReadOnlySet<number>, key: number, open: boolean): IReadOnlySet<number> {
    const next: HashSet<number> = new HashSet<number>(opened);
    if (open)
      next.add(key);
    else
      next.remove(key);

    return next;
  }

  private static remPixels(): number {
    return Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
}
