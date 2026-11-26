/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { afterNextRender, Component, computed, DestroyRef, effect, type ElementRef, inject, input, type InputSignal, output, type OutputEmitterRef,
  signal, type Signal, viewChild, type WritableSignal } from "@angular/core";
import { CommandContext, ConditionValues, CoreCommands, CoreConditions, CoreSettings, EditorFeatures, EditorFeatureSet, EditorRegistries, EditorSession,
  type ILanguageDefinition, type ILineTokenizer, KeyDispatchResult, KeyPress, Required, type SearchQuery, SearchResults, type TextDocument, TextPosition, type TextRange,
  type TextSearch, TextSelection, TokenCache, type TokenTypeRegistry, type UndoHistory } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Resources } from "../../../resources.ts";
import { CodeRowKind } from "../../enums/code-row-kind.ts";
import type { FoldShortcut } from "../../enums/fold-shortcut.ts";
import type { ICodeDecorations } from "../../interfaces/i-code-decorations.ts";
import { BarShape } from "../../models/shapes/bar-shape.ts";
import { ChangeShape } from "../../models/shapes/change-shape.ts";
import type { CodeBar } from "../../models/decorations/code-bar.ts";
import type { CodeBarAction } from "../../models/decorations/code-bar-action.ts";
import { CodeBarActionEvent } from "../../models/decorations/code-bar-action-event.ts";
import type { CodeBlock } from "../../models/folding/code-block.ts";
import { CodeBlocks } from "../../models/folding/code-blocks.ts";
import type { CodeFold } from "../../models/folding/code-fold.ts";
import { FoldShortcuts } from "../../models/folding/fold-shortcuts.ts";
import { LanguageTokenizer } from "../../models/language-tokenizer.ts";
import type { CodeRow } from "../../models/rows/code-row.ts";
import { CodeSearch } from "../../models/code-search.ts";
import { CodeShape } from "../../models/shapes/code-shape.ts";
import type { LayoutRow } from "../../models/rows/layout-row.ts";
import type { MatchShape } from "../../models/shapes/match-shape.ts";
import { RowBuilder } from "../../models/rows/row-builder.ts";
import { RowLayout } from "../../models/rows/row-layout.ts";
import { TextMeasure } from "../../models/text-measure.ts";
import { CodeEditorView } from "../../models/code-editor-view.ts";
import { BackgroundTicker } from "../../services/background-ticker.ts";
import { CodeEditorFeatures } from "../../services/code-editor-features.ts";
import { KeyScope } from "../../services/key-scope.ts";
import { CodeEditorRegistries } from "../../services/code-editor-registries.ts";
import { TokenStyleSheet } from "../../services/token-style-sheet.ts";
import { FindBarComponent } from "../find-bar/find-bar.component.ts";

@Component({
  selector: "noldova-code-editor",
  imports: [FindBarComponent],
  providers: [KeyScope],
  templateUrl: "./code-editor.component.html",
  styleUrl: "./code-editor.component.css",
  host: {
    "class": Resources.codeEditorClass,
    [Resources.focusedClassBinding]: "focused()"
  }
})
export class CodeEditorComponent {
  private static readonly NO_DECORATIONS: IReadOnlyList<ICodeDecorations> = new List<ICodeDecorations>();
  private static readonly NO_FOLDS: IReadOnlyList<CodeFold> = new List<CodeFold>();
  private static readonly NO_SELECTIONS: IReadOnlyList<TextSelection> = new List<TextSelection>();
  private readonly scroller: Signal<ElementRef<HTMLDivElement>> = viewChild.required<ElementRef<HTMLDivElement>>("scroller");
  private readonly content: Signal<ElementRef<HTMLDivElement>> = viewChild.required<ElementRef<HTMLDivElement>>("content");
  private readonly textInput: Signal<ElementRef<HTMLTextAreaElement>> = viewChild.required<ElementRef<HTMLTextAreaElement>>("input");
  private readonly probe: Signal<ElementRef<HTMLSpanElement>> = viewChild.required<ElementRef<HTMLSpanElement>>("probe");
  private readonly findBar: Signal<FindBarComponent | undefined> = viewChild(FindBarComponent);
  private readonly registries: EditorRegistries = new EditorRegistries(inject(CodeEditorRegistries).registries);
  private readonly conditions: ConditionValues = new ConditionValues(this.registries.conditions);
  protected readonly tokenTypes: TokenTypeRegistry = this.registries.tokenTypes;
  private readonly view: CodeEditorView = new CodeEditorView(t => this.openSearch(t), () => this.closeSearch(), t => this.toggleFold(t));
  private readonly query: WritableSignal<SearchQuery | null> = signal<SearchQuery | null>(null);
  private readonly cache: WritableSignal<TokenCache | null> = signal<TokenCache | null>(null);
  private readonly searchProgress: WritableSignal<number> = signal<number>(0);
  private readonly measure: WritableSignal<TextMeasure | null> = signal<TextMeasure | null>(null);
  private readonly scrollTop: WritableSignal<number> = signal<number>(0);
  private readonly viewportHeight: WritableSignal<number> = signal<number>(0);
  private readonly scrollLeft: WritableSignal<number> = signal<number>(0);
  private readonly viewportWidth: WritableSignal<number> = signal<number>(0);
  private stopDrag: (() => void) | null = null;
  private readonly keys: KeyScope = inject(KeyScope);

  public readonly document: InputSignal<TextDocument> = input.required<TextDocument>();
  public readonly history: InputSignal<UndoHistory> = input.required<UndoHistory>();
  public readonly language: InputSignal<string | ILanguageDefinition | null> = input<string | ILanguageDefinition | null>(null);
  public readonly label: InputSignal<string> = input.required<string>();
  public readonly readOnly: InputSignal<boolean> = input<boolean>(false);
  public readonly tabIndents: InputSignal<boolean> = input<boolean>(false);
  public readonly decorations: InputSignal<IReadOnlyList<ICodeDecorations>> = input<IReadOnlyList<ICodeDecorations>>(CodeEditorComponent.NO_DECORATIONS);
  public readonly folds: InputSignal<IReadOnlyList<CodeFold>> = input<IReadOnlyList<CodeFold>>(CodeEditorComponent.NO_FOLDS);
  public readonly selectionsChange: OutputEmitterRef<IReadOnlyList<TextSelection>> = output<IReadOnlyList<TextSelection>>();
  public readonly scrollChange: OutputEmitterRef<number> = output<number>();
  public readonly foldToggle: OutputEmitterRef<CodeFold> = output<CodeFold>();
  public readonly barAction: OutputEmitterRef<CodeBarActionEvent> = output<CodeBarActionEvent>();
  public readonly keySequencePending: OutputEmitterRef<string | null> = output<string | null>();

  private readonly tokenizer: Signal<ILineTokenizer | null> = LanguageTokenizer.of(this.language);

  protected readonly version: WritableSignal<number> = signal<number>(0);
  private readonly tokensVersion: WritableSignal<number> = signal<number>(0);
  protected readonly focused: WritableSignal<boolean> = signal<boolean>(false);
  protected readonly composing: WritableSignal<string | null> = signal<string | null>(null);
  protected readonly session: Signal<EditorSession> = computed(() => new EditorSession(this.document(), this.history()));
  protected readonly selections: Signal<IReadOnlyList<TextSelection>> = computed(() => {
    this.version();

    return this.session().selections;
  });
  protected readonly lineHeight: Signal<number> = computed(() => this.measure()?.lineHeight ?? 0);
  protected readonly plan: Signal<CodeBlocks> = computed(() => {
    this.version();

    return new CodeBlocks(this.document().lineCount, this.decorations(), this.folds());
  });
  protected readonly layout: Signal<RowLayout> = computed(() => new RowLayout(this.document().lineCount, this.plan().blocks));
  protected readonly height: Signal<number> = computed(() => this.layout().rowCount * this.lineHeight());
  protected readonly digits: Signal<number> = computed(() => String(this.plan().largestNumber).length);
  protected readonly firstRow: Signal<number> = computed(() => {
    const lineHeight: number = this.lineHeight();

    return lineHeight === 0 ? 0 : Math.max(0, Math.floor(this.scrollTop() / lineHeight) - Resources.marginLines);
  });
  protected readonly lastRow: Signal<number> = computed(() => {
    const lineHeight: number = this.lineHeight();

    return lineHeight === 0 ? 0 : Math.min(this.layout().rowCount, Math.ceil((this.scrollTop() + this.viewportHeight()) / lineHeight) + Resources.marginLines);
  });
  protected readonly offset: Signal<number> = computed(() => this.firstRow() * this.lineHeight());
  protected readonly marked: Signal<boolean> = computed(() => this.decorations().any());
  protected readonly paired: Signal<boolean> = computed(() => this.decorations().any(t => !Object.isNull(t.numbering)));
  protected readonly foldable: Signal<boolean> = computed(() => this.folds().any());
  protected readonly rowed: Signal<boolean> = computed(() => this.marked() || this.foldable());
  private readonly openFolds: Signal<ReadonlyMap<number, CodeFold>> = computed(() => this.openFoldsOf());
  protected readonly rows: Signal<readonly CodeRow[]> = computed(() => this.rowsOf());
  protected readonly changeShapes: Signal<readonly ChangeShape[]> = computed(() => this.changeShapesOf());
  protected readonly barShapes: Signal<readonly BarShape[]> = computed(() => this.barShapesOf());
  protected readonly barLeft: Signal<number> = this.scrollLeft.asReadonly();
  protected readonly barWidth: Signal<number> = this.viewportWidth.asReadonly();
  protected readonly selectionShapes: Signal<readonly CodeShape[]> = computed(() => this.selectionShapesOf());
  protected readonly caretShapes: Signal<readonly CodeShape[]> = computed(() => this.caretShapesOf());
  protected readonly primaryCaret: Signal<CodeShape> = computed(() => {
    this.selections();

    return this.caretOf(this.session().primary);
  });
  protected readonly resources: typeof Resources = Resources;
  protected readonly foldKind: CodeRowKind = CodeRowKind.Fold;
  protected readonly dropCaret: WritableSignal<CodeShape | null> = signal<CodeShape | null>(null);
  protected readonly searchOpen: WritableSignal<boolean> = signal<boolean>(false);
  protected readonly replaceOpen: WritableSignal<boolean> = signal<boolean>(false);
  protected readonly searchSeed: WritableSignal<string> = signal<string>(Resources.empty);
  protected readonly search: Signal<TextSearch | null> = computed(() => CodeSearch.searchOf(this.query()));
  protected readonly results: Signal<SearchResults | null> = computed(() => {
    const search: TextSearch | null = this.search();

    return Object.isNull(search) ? null : new SearchResults(this.document(), search);
  });
  protected readonly searchStatus: Signal<string> = computed(() => {
    this.version();
    this.selections();
    this.searchProgress();

    return CodeSearch.statusOf(this.query(), this.results(), CodeSearch.rangeOf(this.session().primary));
  });
  protected readonly matchShapes: Signal<readonly MatchShape[]> = computed(() => this.matchShapesOf());

  public constructor() {
    const destroyRef: DestroyRef = inject(DestroyRef);
    inject(TokenStyleSheet).apply(inject(CodeEditorRegistries).registries.tokenTypes, Resources.tokenClassPrefix);
    this.keys.listen(t => this.keySequencePending.emit(t));
    effect(onCleanup => onCleanup(this.document().onChange(() => this.version.update(t => t + 1))));
    effect(onCleanup => {
      const tokenizer: ILineTokenizer | null = this.tokenizer();
      const document: TextDocument = this.document();
      const cache: TokenCache | null = Object.isNull(tokenizer) ? null : new TokenCache(document, tokenizer);
      const ticker: BackgroundTicker | null = Object.isNull(cache) ? null : new BackgroundTicker(document, hasTime => {
        const from: number = cache.validLineCount;
        const more: boolean = cache.advance(hasTime);
        this.onTokens(from, cache.validLineCount);

        return more;
      });
      this.cache.set(cache);
      onCleanup(() => {
        ticker?.[Symbol.dispose]();
        cache?.[Symbol.dispose]();
      });
    });
    effect(onCleanup => {
      const results: SearchResults | null = this.results();
      const ticker: BackgroundTicker | null = Object.isNull(results) ? null : new BackgroundTicker(this.document(), hasTime => {
        const more: boolean = results.advance(hasTime);
        this.searchProgress.update(t => t + 1);

        return more;
      });
      onCleanup(() => {
        ticker?.[Symbol.dispose]();
        results?.[Symbol.dispose]();
      });
    });
    effect(() => {
      this.session().readOnly = this.readOnly();
    });
    effect(() => {
      const history: UndoHistory = this.history();
      history.limit = this.registries.settings.get(CoreSettings.undoLimit);
      history.groupMilliseconds = this.registries.settings.get(CoreSettings.undoGroupMilliseconds);
    });
    effect(() => {
      this.selections();
      if (Object.isNull(this.composing()))
        this.syncInput();
    });
    afterNextRender(() => {
      this.measure.set(new TextMeasure(this.probe().nativeElement, this.content().nativeElement));
      const scroller: HTMLDivElement = this.scroller().nativeElement;
      const observer: ResizeObserver = new ResizeObserver(() => this.measureViewport(scroller));
      observer.observe(scroller);
      this.measureViewport(scroller);
      destroyRef.onDestroy(() => observer.disconnect());
    });
    destroyRef.onDestroy(() => this.stopDrag?.());
  }

  public focus(): void {
    this.textInput().nativeElement.focus();
  }

  public select(selections: IReadOnlyList<TextSelection>): void {
    this.session().select(selections);
    this.changed();
  }

  public caret(): TextPosition {
    return this.session().primary.head;
  }

  public hasFocus(): boolean {
    return this.focused();
  }

  public refreshTokens(): void {
    this.tokensVersion.update(t => t + 1);
  }

  public scrollTo(top: number): void {
    const scroller: HTMLDivElement = this.scroller().nativeElement;
    scroller.scrollTop = top;
    this.scrollTop.set(scroller.scrollTop);
  }

  protected onAction(bar: CodeBar, action: CodeBarAction): void {
    this.barAction.emit(new CodeBarActionEvent(bar, action));
  }

  protected onFoldToggle(event: MouseEvent, fold: CodeFold): void {
    event.preventDefault();
    event.stopPropagation();
    this.foldToggle.emit(fold);
  }

  protected onScroll(): void {
    const top: number = this.scroller().nativeElement.scrollTop;
    this.scrollTop.set(top);
    this.scrollLeft.set(this.scroller().nativeElement.scrollLeft);
    this.scrollChange.emit(top);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.isComposing)
      return;
    const before: IReadOnlyList<TextSelection> = this.session().selections;
    const press: KeyPress = new KeyPress(event.key, event.code, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey);
    const result: KeyDispatchResult = this.keys.dispatch(press, this.contextAt(event.timeStamp));
    if (result === KeyDispatchResult.None)
      return;
    event.preventDefault();
    if (this.session().selections !== before)
      this.changed();
  }

  protected onBeforeInput(event: InputEvent): void {
    if (event.isComposing)
      return;
    event.preventDefault();
    switch (event.inputType) {
      case Resources.inputInsertText:
      case Resources.inputInsertReplacementText:
        this.session().type(Required.value(event.data), event.timeStamp);
        break;
      case Resources.inputInsertLineBreak:
      case Resources.inputInsertParagraph:
        this.registries.commands.run(CoreCommands.newLine.id, this.contextAt(event.timeStamp));
        break;
      default:
        return;
    }
    this.changed();
  }

  protected onCompositionStart(): void {
    this.composing.set(Resources.empty);
  }

  protected onCompositionUpdate(event: CompositionEvent): void {
    this.composing.set(event.data);
  }

  protected onCompositionEnd(event: CompositionEvent): void {
    this.composing.set(null);
    if (!String.isNullOrEmpty(event.data))
      this.session().type(event.data, event.timeStamp);
    this.changed();
  }

  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    this.session().paste(Required.value(event.clipboardData).getData(Resources.plainText), event.timeStamp);
    this.changed();
  }

  protected onCopy(event: ClipboardEvent): void {
    this.copyInto(event, this.session().selectedText());
  }

  protected onCut(event: ClipboardEvent): void {
    this.copyInto(event, this.session().cut(event.timeStamp));
    this.changed();
  }

  protected onBlur(): void {
    this.focused.set(false);
    this.keys.cancel();
  }

  protected onMouseDown(event: MouseEvent): void {
    this.keys.cancel();
    if (event.button !== 0)
      return;
    event.preventDefault();
    const block: CodeBlock | null = this.rowAtPoint(event.clientY).block;
    if (!Object.isNull(block) && !Object.isNull(block.fold)) {
      this.foldToggle.emit(block.fold);

      return;
    }
    this.focus();
    const kept: IReadOnlyList<TextSelection> = event.altKey ? this.session().selections : CodeEditorComponent.NO_SELECTIONS;
    const position: TextPosition = this.positionAt(event.clientX, event.clientY);
    const selected: TextRange = CodeSearch.rangeOf(this.session().primary);
    if (!event.altKey && !event.shiftKey && !this.readOnly() && this.session().selections.count() === 1 &&
      position.compareTo(selected.start) > 0 && position.compareTo(selected.end) < 0) {
      this.moveSelected(selected);

      return;
    }
    this.session().placeCaret(position, event.shiftKey, event.altKey);
    this.changed();
    const anchor: TextPosition = event.altKey ? position : this.session().primary.anchor;
    const owner: Document = this.textInput().nativeElement.ownerDocument;
    const move: (moved: MouseEvent) => void = moved => {
      this.session().select(new List<TextSelection>(kept.append(new TextSelection(anchor, this.positionAt(moved.clientX, moved.clientY)))));
      this.changed();
    };
    const stop: () => void = () => {
      owner.removeEventListener(Resources.mouseMove, move);
      owner.removeEventListener(Resources.mouseUp, stop);
      this.stopDrag = null;
    };
    this.stopDrag?.();
    owner.addEventListener(Resources.mouseMove, move);
    owner.addEventListener(Resources.mouseUp, stop);
    this.stopDrag = stop;
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    const data: DataTransfer | null = event.dataTransfer;
    if (Object.isNull(data))
      return;
    const accepted: boolean = !this.readOnly() && CodeEditorComponent.isText(data);
    data.dropEffect = accepted ? Resources.copyEffect : Resources.noEffect;
    this.dropCaret.set(accepted ? this.caretOf(new TextSelection(this.positionAt(event.clientX, event.clientY))) : null);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dropCaret.set(null);
    const data: DataTransfer | null = event.dataTransfer;
    if (Object.isNull(data) || !CodeEditorComponent.isText(data) || !this.session().drop(this.positionAt(event.clientX, event.clientY),
      data.getData(Resources.plainText), event.timeStamp))
      return;
    this.focus();
    this.changed();
  }

  protected onQuery(query: SearchQuery): void {
    this.query.set(query);
    this.searchSeed.set(query.text);
    this.goTo(this.results()?.next(CodeSearch.rangeOf(this.session().primary).start) ?? null);
  }

  protected findNext(): void {
    this.goTo(this.results()?.next(CodeSearch.rangeOf(this.session().primary).end) ?? null);
  }

  protected findPrevious(): void {
    this.goTo(this.results()?.previous(CodeSearch.rangeOf(this.session().primary).start) ?? null);
  }

  protected replaceOne(text: string): void {
    const results: SearchResults | null = this.results();
    if (Object.isNull(results))
      return;
    const range: TextRange = CodeSearch.rangeOf(this.session().primary);
    if (results.indexOf(range) !== -1)
      this.session().replace(results.search.replaceEdits(this.document(), new List<TextRange>([range]), text), performance.now());
    this.changed();
    this.findNext();
  }

  protected replaceEvery(text: string): void {
    const results: SearchResults | null = this.results();
    if (Object.isNull(results))
      return;
    this.session().replace(results.search.replaceEdits(this.document(), results.all(), text), performance.now());
    this.changed();
  }

  protected closeSearch(): void {
    this.searchOpen.set(false);
    this.query.set(null);
    this.focus();
  }

  private copyInto(event: ClipboardEvent, text: string): void {
    if (String.isNullOrEmpty(text))
      return;
    event.preventDefault();
    Required.value(event.clipboardData).setData(Resources.plainText, text);
  }

  private toggleFold(shortcut: FoldShortcut): void {
    const fold: CodeFold | null = FoldShortcuts.foldAt(this.folds(), this.session().primary.head.line, shortcut);
    if (!Object.isNull(fold))
      this.foldToggle.emit(fold);
  }

  private contextAt(time: number): CommandContext {
    const session: EditorSession = this.session();
    const features: EditorFeatureSet = new EditorFeatureSet();
    features.provide(EditorFeatures.session, session);
    features.provide(CodeEditorFeatures.view, this.view);
    this.conditions.set(CoreConditions.readOnly, this.readOnly());
    this.conditions.set(CoreConditions.tabIndents, this.tabIndents());
    this.conditions.set(CoreConditions.hasSelection, session.selections.any(t => !t.anchor.equals(t.head)));
    this.conditions.set(CoreConditions.hasMultipleSelections, session.selections.count() > 1);
    this.conditions.set(CodeEditorFeatures.findVisible, this.searchOpen());

    return new CommandContext(this.registries, this.conditions, features, null, time, Math.floor(this.viewportHeight() / this.lineHeight()));
  }

  private openSearch(replace: boolean): void {
    const selected: string = this.session().selectedText();
    const seed: string = !String.isNullOrEmpty(selected) && !selected.includes(Resources.lineFeed) ? selected : this.searchSeed();
    this.replaceOpen.set(replace && !this.readOnly());
    this.searchSeed.set(seed);
    const bar: FindBarComponent | undefined = this.findBar();
    if (Object.isUndefined(bar))
      this.searchOpen.set(true);
    else
      bar.open(seed);
  }

  private moveSelected(selected: TextRange): void {
    const owner: Document = this.textInput().nativeElement.ownerDocument;
    const listening: AbortController = new AbortController();
    let moved: boolean = false;
    const end: () => void = () => {
      listening.abort();
      this.dropCaret.set(null);
      this.stopDrag = null;
    };
    this.stopDrag?.();
    owner.addEventListener(Resources.mouseMove, event => {
      moved = true;
      this.dropCaret.set(this.caretOf(new TextSelection(this.positionAt(event.clientX, event.clientY))));
    }, { signal: listening.signal });
    owner.addEventListener(Resources.mouseUp, event => {
      end();
      const position: TextPosition = this.positionAt(event.clientX, event.clientY);
      if (moved)
        this.session().moveText(selected, position, event.timeStamp);
      else
        this.session().placeCaret(position, false, false);
      this.changed();
    }, { signal: listening.signal });
    this.stopDrag = end;
  }

  private goTo(match: TextRange | null): void {
    if (Object.isNull(match))
      return;
    this.session().select(new List<TextSelection>([new TextSelection(match.start, match.end)]));
    this.changed();
  }

  private matchShapesOf(): readonly MatchShape[] {
    const results: SearchResults | null = this.results();
    if (Object.isNull(results))
      return [];
    this.version();
    this.selections();
    const rows: readonly number[] = Array.from({ length: this.lastRow() - this.firstRow() }, (_, i) => this.firstRow() + i);

    return CodeSearch.shapesOf(results, this.document(), this.layout(), rows, Required.value(this.measure()), CodeSearch.rangeOf(this.session().primary));
  }

  private changed(): void {
    this.version.update(t => t + 1);
    this.selectionsChange.emit(this.session().selections);
    this.reveal();
  }

  private reveal(): void {
    const measure: TextMeasure | null = this.measure();
    if (Object.isNull(measure))
      return;
    const scroller: HTMLDivElement = this.scroller().nativeElement;
    const caret: CodeShape = this.caretOf(this.session().primary);
    if (caret.top < scroller.scrollTop)
      scroller.scrollTop = caret.top;
    else if (caret.top + caret.height > scroller.scrollTop + scroller.clientHeight)
      scroller.scrollTop = caret.top + caret.height - scroller.clientHeight;
    const start: number = this.content().nativeElement.offsetLeft + measure.inset;
    if (caret.left < scroller.scrollLeft)
      scroller.scrollLeft = caret.left;
    else if (start + caret.left + measure.spaceWidth > scroller.scrollLeft + scroller.clientWidth)
      scroller.scrollLeft = start + caret.left + measure.spaceWidth - scroller.clientWidth;
    this.scrollTop.set(scroller.scrollTop);
  }

  private syncInput(): void {
    const element: HTMLTextAreaElement = this.textInput().nativeElement;
    const document: TextDocument = this.document();
    const primary: TextSelection = this.session().primary;
    const first: number = Math.max(0, primary.head.line - Resources.inputContextLines);
    const last: number = Math.min(document.lineCount - 1, primary.head.line + Resources.inputContextLines);
    const lines: string[] = [];
    for (let line: number = first; line <= last; line++)
      lines.push(document.lineText(line));
    element.value = lines.join(Resources.lineFeed);
    const offsetOf = (position: TextPosition): number => {
      if (position.line < first)
        return 0;
      if (position.line > last)
        return element.value.length;

      return lines.slice(0, position.line - first).reduce((sum, t) => sum + t.length + Resources.lineFeed.length, 0) + position.column;
    };
    const anchor: number = offsetOf(primary.anchor);
    const head: number = offsetOf(primary.head);
    element.setSelectionRange(Math.min(anchor, head), Math.max(anchor, head), anchor > head ? Resources.backward : Resources.forward);
  }

  private positionAt(clientX: number, clientY: number): TextPosition {
    const measure: TextMeasure = Required.value(this.measure());
    const document: TextDocument = this.document();
    const rect: DOMRect = this.content().nativeElement.getBoundingClientRect();
    const item: LayoutRow = this.rowAtPoint(clientY);
    if (Object.isNull(item.block))
      return new TextPosition(item.line, measure.columnAt(document.lineText(item.line), clientX - rect.left - measure.inset));
    const line: number = Math.min(item.line, document.lineCount - 1);

    return new TextPosition(line, line === item.line ? 0 : document.lineText(line).length);
  }

  private rowAtPoint(clientY: number): LayoutRow {
    const layout: RowLayout = this.layout();
    const top: number = this.content().nativeElement.getBoundingClientRect().top;

    return layout.rowAt(Math.min(layout.rowCount - 1, Math.max(0, Math.floor((clientY - top) / Required.value(this.measure()).lineHeight))));
  }

  private isShown(row: number): boolean {
    return row >= this.firstRow() && row < this.lastRow();
  }

  private onTokens(from: number, to: number): void {
    if (this.rows().some(t => !Object.isNull(t.number) && t.number > from && t.number <= to))
      this.refreshTokens();
  }

  private rowsOf(): readonly CodeRow[] {
    this.tokensVersion();
    const layout: RowLayout = this.layout();
    const items: LayoutRow[] = [];
    for (let row: number = this.firstRow(); row < this.lastRow(); row++)
      items.push(layout.rowAt(row));

    return new RowBuilder(this.document(), this.cache(), this.decorations(), this.openFolds()).rowsOf(items);
  }

  private changeShapesOf(): readonly ChangeShape[] {
    const measure: TextMeasure | null = this.measure();
    if (Object.isNull(measure))
      return [];
    const shapes: ChangeShape[] = [];
    this.rows().forEach((row, index) => {
      for (const span of row.spans) {
        const left: number = measure.x(row.text, span.start);
        shapes.push(new ChangeShape((this.firstRow() + index) * measure.lineHeight, left, measure.x(row.text, span.end) - left, span.background));
      }
    });

    return shapes;
  }

  private measureViewport(scroller: HTMLDivElement): void {
    this.viewportHeight.set(scroller.clientHeight);
    this.viewportWidth.set(scroller.clientWidth);
  }

  private barShapesOf(): readonly BarShape[] {
    const shapes: BarShape[] = [];
    this.rows().forEach((row, index) => {
      if (!Object.isNull(row.bar))
        shapes.push(new BarShape((this.firstRow() + index) * this.lineHeight(), row.bar));
    });

    return shapes;
  }

  private selectionShapesOf(): readonly CodeShape[] {
    const measure: TextMeasure | null = this.measure();
    if (Object.isNull(measure))
      return [];
    const document: TextDocument = this.document();
    const layout: RowLayout = this.layout();
    const lineHeight: number = measure.lineHeight;
    const ranges: readonly TextRange[] = Array.from(this.selections(), t => CodeSearch.rangeOf(t));
    const shapes: CodeShape[] = [];
    for (let row: number = this.firstRow(); row < this.lastRow(); row++) {
      const item: LayoutRow = layout.rowAt(row);
      if (!Object.isNull(item.block))
        continue;
      const line: number = item.line;
      const text: string = document.lineText(line);
      for (const range of ranges.filter(t => t.start.line <= line && t.end.line >= line)) {
        const left: number = line === range.start.line ? measure.x(text, range.start.column) : 0;
        const right: number = line === range.end.line ? measure.x(text, range.end.column) : measure.x(text, text.length) + measure.spaceWidth;
        if (right > left)
          shapes.push(new CodeShape(row * lineHeight, left, right - left, lineHeight));
      }
    }

    return shapes;
  }

  private caretShapesOf(): readonly CodeShape[] {
    const shapes: CodeShape[] = [];
    for (const selection of this.selections())
      if (this.isShown(this.layout().rowOfLine(selection.head.line)))
        shapes.push(this.caretOf(selection));

    return shapes;
  }

  private openFoldsOf(): ReadonlyMap<number, CodeFold> {
    const open: Map<number, CodeFold> = new Map<number, CodeFold>();
    for (const fold of this.folds())
      if (!fold.collapsed && fold.lineCount > 0)
        open.set(fold.startLine, fold);

    return open;
  }

  private caretOf(selection: TextSelection): CodeShape {
    const measure: TextMeasure | null = this.measure();
    const left: number = Object.isNull(measure) ? 0 : measure.x(this.document().lineText(selection.head.line), selection.head.column);

    return new CodeShape(this.layout().rowOfLine(selection.head.line) * this.lineHeight(), left, 0, this.lineHeight());
  }

  private static isText(data: DataTransfer): boolean {
    return !data.types.includes(Resources.files) && data.types.includes(Resources.plainText);
  }
}
