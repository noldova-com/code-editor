/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Component, computed, DestroyRef, effect, ElementRef, inject, input, type InputSignal, output, type OutputEmitterRef, signal, type Signal,
  untracked, viewChild, type WritableSignal } from "@angular/core";
import { type ILanguageDefinition, Required, TextDocument, type TextPosition, TextSelection, UndoHistory } from "@noldova/code.editor";
import { CodeBarAction, type CodeBarActionEvent, type CodeDecorations, CodeEditorComponent, KeyScope } from "@noldova/code.editor.angular";
import { ConflictChoice, ConflictMarkersException, ConflictState, type MergeConflict, MergeDocument } from "@noldova/code.editor.merge";
import { type IReadOnlyList, List } from "@noldova/context.collections";
import { ButtonComponent, ButtonSize, ButtonVariant, IconButtonComponent } from "@noldova/ui.components.angular";

import { Resources } from "../../../resources.ts";
import { ActiveConflict } from "../../models/active-conflict.ts";
import { ConflictChunk } from "../../models/conflict-chunk.ts";
import { ConflictLines } from "../../models/conflict-lines.ts";
import { MergeMarks } from "../../models/merge-marks.ts";
import { MergeOpening } from "../../models/merge-opening.ts";

@Component({
  selector: "noldova-merge-editor",
  imports: [ButtonComponent, CodeEditorComponent, IconButtonComponent],
  providers: [KeyScope],
  templateUrl: "./merge-editor.component.html",
  styleUrl: "./merge-editor.component.css",
  host: {
    "class": Resources.mergeEditorClass,
    [Resources.panelsClassBinding]: "panels()"
  }
})
export class MergeEditorComponent {
  private static readonly BAR_CHOICES: ReadonlyMap<string, ConflictChoice> = new Map<string, ConflictChoice>([
    [Resources.oursAction, ConflictChoice.Ours],
    [Resources.theirsAction, ConflictChoice.Theirs],
    [Resources.bothAction, ConflictChoice.BothOursFirst]
  ]);
  private readonly resultView: Signal<CodeEditorComponent | undefined> = viewChild<CodeEditorComponent>("result");
  private readonly version: WritableSignal<number> = signal<number>(0);
  private cleanText: string | null = null;
  private reportedStates: string | null = null;

  public readonly base: InputSignal<string | null> = input.required<string | null>();
  public readonly ours: InputSignal<string | null> = input.required<string | null>();
  public readonly theirs: InputSignal<string | null> = input.required<string | null>();
  public readonly merged: InputSignal<string | null> = input<string | null>(null);
  public readonly language: InputSignal<string | ILanguageDefinition | null> = input<string | ILanguageDefinition | null>(null);
  public readonly oursLabel: InputSignal<string> = input.required<string>();
  public readonly theirsLabel: InputSignal<string> = input.required<string>();
  public readonly readOnly: InputSignal<boolean> = input<boolean>(false);
  public readonly toolbar: InputSignal<boolean> = input<boolean>(true);
  public readonly panels: InputSignal<boolean> = input<boolean>(false);
  public readonly showBase: InputSignal<boolean> = input<boolean>(false);
  public readonly resultChange: OutputEmitterRef<string> = output<string>();
  public readonly conflictsChange: OutputEmitterRef<IReadOnlyList<ConflictState>> = output<IReadOnlyList<ConflictState>>();
  public readonly activeConflictChange: OutputEmitterRef<number | null> = output<number | null>();
  public readonly markersFailed: OutputEmitterRef<ConflictMarkersException> = output<ConflictMarkersException>();
  public readonly keySequencePending: OutputEmitterRef<string | null> = output<string | null>();
  public readonly activeConflict: Signal<ActiveConflict | null> = computed(() => {
    this.version();
    const index: number | null = this.active();
    const merge: MergeDocument | null = this.opening().merge;

    return Object.isNull(index) || Object.isNull(merge) ? null : MergeEditorComponent.activeOf(merge, index, this.base());
  });

  protected readonly resources: typeof Resources = Resources;
  protected readonly choices: typeof ConflictChoice = ConflictChoice;
  protected readonly compact: ButtonSize = ButtonSize.Compact;
  protected readonly secondary: ButtonVariant = ButtonVariant.Secondary;
  protected readonly opening: Signal<MergeOpening> = computed(() => MergeEditorComponent.open(this.base(), this.ours(), this.theirs(), this.merged()));
  protected readonly active: WritableSignal<number | null> = signal<number | null>(null);
  protected readonly announcement: WritableSignal<string> = signal<string>(Resources.empty);
  protected readonly oursDocument: Signal<TextDocument> = computed(() => TextDocument.fromText(Required.value(this.ours())));
  protected readonly theirsDocument: Signal<TextDocument> = computed(() => TextDocument.fromText(Required.value(this.theirs())));
  protected readonly oursHistory: Signal<UndoHistory> = computed(() => new UndoHistory(this.oursDocument()));
  protected readonly theirsHistory: Signal<UndoHistory> = computed(() => new UndoHistory(this.theirsDocument()));
  protected readonly oursLines: Signal<IReadOnlyList<number | null>> = computed(() => ConflictLines.of(this.oursDocument(),
    this.conflicts().select(t => t.ours).toList(), this.anchors()));
  protected readonly theirsLines: Signal<IReadOnlyList<number | null>> = computed(() => ConflictLines.of(this.theirsDocument(),
    this.conflicts().select(t => t.theirs).toList(), this.anchors()));
  protected readonly oursDecorations: Signal<IReadOnlyList<CodeDecorations>> = computed(() => new List<CodeDecorations>([
    this.sideDecorations(Resources.oursBackground, ConflictChoice.Ours, this.oursLines())]));
  protected readonly theirsDecorations: Signal<IReadOnlyList<CodeDecorations>> = computed(() => new List<CodeDecorations>([
    this.sideDecorations(Resources.theirsBackground, ConflictChoice.Theirs, this.theirsLines())]));
  protected readonly baseDocument: Signal<TextDocument> = computed(() => TextDocument.fromText(this.base() ?? Resources.empty));
  protected readonly baseHistory: Signal<UndoHistory> = computed(() => new UndoHistory(this.baseDocument()));
  protected readonly baseDecorations: Signal<IReadOnlyList<CodeDecorations>> = computed(() => new List<CodeDecorations>([this.chunkDecorations(null,
    ConflictLines.of(this.baseDocument(), this.conflicts().select(t => t.base).toList(), this.anchors()), t => t.base, new List<CodeBarAction>())]));
  protected readonly survivorIsOurs: Signal<boolean> = computed(() => !Object.isNull(this.ours()));
  protected readonly deletedNote: Signal<string> = computed(() => Resources.formatDeleted(this.survivorIsOurs() ? this.theirsLabel() : this.oursLabel()));
  protected readonly states: Signal<IReadOnlyList<ConflictState>> = computed(() => {
    this.version();
    const merge: MergeDocument | null = this.opening().merge;

    return Object.isNull(merge) ? new List<ConflictState>() : merge.conflicts.select(t => merge.stateOf(t.index)).toList();
  });
  protected readonly summary: Signal<string> = computed(() => {
    const states: IReadOnlyList<ConflictState> = this.states();

    return states.count() === 0 ? Resources.noConflicts : Resources.formatUnresolved(states.count(t => t === ConflictState.Unresolved), states.count());
  });
  protected readonly resultDecorations: Signal<IReadOnlyList<CodeDecorations>> = computed(() => {
    this.version();

    return new List<CodeDecorations>([MergeMarks.resultOf(Required.value(this.opening().merge), !this.readOnly())]);
  });
  protected readonly canChoose: Signal<boolean> = computed(() => !this.readOnly() && !Object.isNull(this.active()));

  public constructor() {
    inject(KeyScope).listen(t => this.keySequencePending.emit(t));
    effect(onCleanup => {
      const opening: MergeOpening = this.opening();
      untracked(() => this.onOpen(opening));
      const merge: MergeDocument | null = opening.merge;
      if (!Object.isNull(merge))
        onCleanup(merge.document.onChange(() => this.onResultChange(merge)));
    });
    effect(() => {
      const states: IReadOnlyList<ConflictState> = this.states();
      const key: string = states.toArray().join();
      if (key !== this.reportedStates) {
        this.reportedStates = key;
        untracked(() => this.conflictsChange.emit(states));
      }
    });
    const host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const listener: (event: KeyboardEvent) => void = event => this.onKeyDown(event);
    host.addEventListener(Resources.keyDown, listener, true);
    inject(DestroyRef).onDestroy(() => host.removeEventListener(Resources.keyDown, listener, true));
  }

  public result(): string | null {
    return this.opening().merge?.document.text() ?? null;
  }

  public unresolvedCount(): number {
    return this.opening().merge?.unresolvedCount() ?? 0;
  }

  public dirty(): boolean {
    return this.result() !== this.cleanText;
  }

  public markClean(): void {
    this.cleanText = this.result();
  }

  public accept(index: number, choice: ConflictChoice): void {
    const merge: MergeDocument | null = this.choosableMerge();
    if (Object.isNull(merge))
      return;
    merge.accept(index, choice, performance.now());
    this.announce(merge, index);
  }

  public acceptAll(choice: ConflictChoice): void {
    this.choosableMerge()?.acceptAll(choice, performance.now());
  }

  public reset(index: number): void {
    const merge: MergeDocument | null = this.choosableMerge();
    if (Object.isNull(merge))
      return;
    merge.reset(index, performance.now());
    this.announce(merge, index);
  }

  public setConflictText(index: number, text: string): void {
    const merge: MergeDocument | null = this.choosableMerge();
    if (Object.isNull(merge))
      return;
    merge.setConflictText(index, text, performance.now());
    this.announce(merge, index);
  }

  public revealConflict(index: number): void {
    const merge: MergeDocument | null = this.opening().merge;
    if (Object.isNull(merge))
      return;
    const conflict: MergeConflict = merge.conflicts.get(index);
    this.view().select(new List<TextSelection>([new TextSelection(merge.document.positionAt(conflict.start))]));
    this.setActive(index);
    this.announce(merge, index);
  }

  public nextConflict(): void {
    this.step(1);
  }

  public previousConflict(): void {
    this.step(-1);
  }

  public undo(): void {
    this.restore(t => t.history.undo());
  }

  public redo(): void {
    this.restore(t => t.history.redo());
  }

  public focus(): void {
    if (!Object.isNull(this.opening().merge))
      this.view().focus();
  }

  protected choose(choice: ConflictChoice): void {
    this.accept(Required.value(this.active()), choice);
  }

  protected resetActive(): void {
    this.reset(Required.value(this.active()));
  }

  protected onSideAction(event: CodeBarActionEvent, choice: ConflictChoice): void {
    this.accept(Number(event.bar.id), choice);
  }

  protected onResultAction(merge: MergeDocument, event: CodeBarActionEvent): void {
    const index: number = Number(event.bar.id);
    if (event.action.id === Resources.suggestedAction)
      this.setConflictText(index, Required.value(merge.conflicts.get(index).suggestion));
    else
      this.accept(index, Required.value(MergeEditorComponent.BAR_CHOICES.get(event.action.id)));
  }

  protected onSelections(merge: MergeDocument, selections: IReadOnlyList<TextSelection>): void {
    this.setActive(merge.conflictAt(merge.document.offsetAt(selections.get(0).head)));
  }

  private conflicts(): IReadOnlyList<MergeConflict> {
    return Required.value(this.opening().merge).conflicts;
  }

  private anchors(): IReadOnlyList<string> {
    const merge: MergeDocument = Required.value(this.opening().merge);

    return merge.conflicts.select(t => {
      const end: TextPosition = merge.document.positionAt(t.end);

      return merge.document.lineText(end.line).slice(end.column);
    }).toList();
  }

  private sideDecorations(background: string, side: ConflictChoice, lines: IReadOnlyList<number | null>): CodeDecorations {
    const actions: IReadOnlyList<CodeBarAction> = this.readOnly() ? new List<CodeBarAction>()
      : new List<CodeBarAction>([new CodeBarAction(Resources.takeAction, Resources.takeLabel, Resources.takeIcon)]);

    return this.chunkDecorations(background, lines, t => t.choiceText(side), actions);
  }

  private chunkDecorations(background: string | null, lines: IReadOnlyList<number | null>, textOf: (conflict: MergeConflict) => string,
    actions: IReadOnlyList<CodeBarAction>): CodeDecorations {
    const states: IReadOnlyList<ConflictState> = this.states();
    const chunks: List<ConflictChunk> = this.conflicts().selectMany((t): ConflictChunk[] => {
      const line: number | null = lines.get(t.index);

      return Object.isNull(line) ? [] : [new ConflictChunk(line, t.index, ConflictLines.countOf(textOf(t)),
        Resources.formatChunk(t.index + 1, states.get(t.index)), actions)];
    }).toList();

    return MergeMarks.sideOf(chunks, background);
  }

  private view(): CodeEditorComponent {
    return Required.value(this.resultView());
  }

  private restore(step: (merge: MergeDocument) => IReadOnlyList<TextSelection> | null): void {
    const merge: MergeDocument | null = this.opening().merge;
    if (Object.isNull(merge))
      return;
    const selections: IReadOnlyList<TextSelection> | null = step(merge);
    if (!Object.isNull(selections))
      this.view().select(selections);
  }

  private onOpen(opening: MergeOpening): void {
    this.cleanText = opening.merge?.document.text() ?? null;
    this.setActive(null);
    this.version.update(t => t + 1);
    if (!Object.isNull(opening.failure))
      this.markersFailed.emit(opening.failure);
  }

  private onResultChange(merge: MergeDocument): void {
    this.version.update(t => t + 1);
    this.resultChange.emit(merge.document.text());
  }

  private setActive(index: number | null): void {
    if (index === this.active())
      return;
    this.active.set(index);
    this.activeConflictChange.emit(index);
  }

  private step(direction: number): void {
    const merge: MergeDocument | null = this.opening().merge;
    if (Object.isNull(merge))
      return;
    const current: number | null = this.active();
    const offset: number = merge.document.offsetAt(this.view().caret());
    const index: number = !Object.isNull(current)
      ? current + direction
      : direction > 0 ? merge.conflicts.firstOrDefault(t => t.start >= offset)?.index ?? -1 : merge.conflicts.lastOrDefault(t => t.end <= offset)?.index ?? -1;
    if (index < 0 || index >= merge.conflicts.count()) {
      this.announcement.set(merge.conflicts.count() === 0 ? Resources.noConflicts : Resources.noMoreConflicts);

      return;
    }
    this.revealConflict(index);
  }

  private choosableMerge(): MergeDocument | null {
    return this.readOnly() ? null : this.opening().merge;
  }

  private announce(merge: MergeDocument, index: number): void {
    this.announcement.set(Resources.formatConflict(index + 1, merge.conflicts.count(), merge.stateOf(index), merge.unresolvedCount()));
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.key !== Resources.keyArrowDown && event.key !== Resources.keyArrowUp)
      return;
    event.preventDefault();
    event.stopPropagation();
    this.step(event.key === Resources.keyArrowDown ? 1 : -1);
    this.focus();
  }

  private static open(base: string | null, ours: string | null, theirs: string | null, merged: string | null): MergeOpening {
    if (Object.isNull(ours) || Object.isNull(theirs))
      return new MergeOpening(null, null);
    if (Object.isNull(merged))
      return new MergeOpening(MergeDocument.fromSides(base ?? Resources.empty, ours, theirs), null);
    const read: MergeDocument | ConflictMarkersException = MergeDocument.readMarkers(merged);

    return read instanceof ConflictMarkersException ? new MergeOpening(null, read) : new MergeOpening(read, null);
  }

  private static activeOf(merge: MergeDocument, index: number, base: string | null): ActiveConflict {
    const conflict: MergeConflict = merge.conflicts.get(index);
    const first: TextPosition = merge.document.positionAt(conflict.start);
    const last: TextPosition = merge.document.positionAt(conflict.end);

    return new ActiveConflict(index, merge.conflicts.count(), Object.isNull(base) ? null : conflict.base, merge.stateOf(index), first.line,
      conflict.end > conflict.start && last.column === 0 ? last.line - 1 : last.line);
  }
}
