/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { InputSignal, OutputEmitterRef, Signal } from "@angular/core";
import type { ILanguageDefinition } from "@noldova/code.editor";
import type { ConflictChoice, ConflictMarkersException, ConflictState } from "@noldova/code.editor.merge";
import type { IReadOnlyList } from "@noldova/context.collections";

export { ConflictChoice, ConflictState } from "@noldova/code.editor.merge";

/**
 * Describes the merge conflict that holds the caret in a
 * {@link MergeEditorComponent}, as its `activeConflict` signal gives it.
 */
export declare class ActiveConflict {
  /**
   * The conflict's index, from 0.
   */
  readonly index: number;

  /**
   * How many conflicts the merge has.
   */
  readonly count: number;

  /**
   * The conflict's base text, or null when the merge has no base.
   */
  readonly base: string | null;

  /**
   * The conflict's state.
   */
  readonly state: ConflictState;

  /**
   * The first line the conflict covers in the result, from 0.
   */
  readonly firstLine: number;

  /**
   * The last line the conflict covers in the result, from 0; the same as
   * {@link ActiveConflict.firstLine} for a conflict with no text.
   */
  readonly lastLine: number;

  /**
   * Creates the description; {@link MergeEditorComponent} creates one each
   * time the conflict with the caret, or its state, changes.
   *
   * @param index The conflict's index, from 0.
   * @param count How many conflicts the merge has.
   * @param base The conflict's base text, or null when the merge has no base.
   * @param state The conflict's state.
   * @param firstLine The first line the conflict covers in the result, from 0.
   * @param lastLine The last line the conflict covers in the result, from 0.
   * @example
   * ```ts
   * import { ActiveConflict, ConflictState } from "@noldova/code.editor.merge.angular";
   *
   * const conflict = new ActiveConflict(0, 3, "a\n", ConflictState.Unresolved, 4, 4);
   * console.log(`Conflict ${conflict.index + 1} of ${conflict.count}`); // Conflict 1 of 3
   * ```
   */
  constructor(index: number, count: number, base: string | null, state: ConflictState, firstLine: number, lastLine: number);
}

/**
 * The `noldova-merge-editor` component: the merge view, which shows ours and
 * theirs read-only above an editable result, with the choices for each
 * conflict.
 *
 * @remarks
 * It draws its panes through the code view's decorations, and every choice
 * and edit goes through a `MergeDocument`. Without `merged`, its 3-way merge
 * finds the conflicts; with it, the
 * conflicts are the ones its markers mark. When ours or theirs is null, the
 * view shows the side that is left, read-only, with no result and no
 * conflicts. Content marked `nolMergeOursHead`, `nolMergeTheirsHead` and
 * `nolMergeResultHead` is projected at the top of its side and of the
 * result. Alt with Down or Up moves between conflicts.
 */
export declare class MergeEditorComponent {
  /**
   * The base text, or null when the merge has no base, which reads as
   * empty; required.
   */
  readonly base: InputSignal<string | null>;

  /**
   * Our side's text, or null when our side deleted the file; required.
   */
  readonly ours: InputSignal<string | null>;

  /**
   * Their side's text, or null when their side deleted the file; required.
   */
  readonly theirs: InputSignal<string | null>;

  /**
   * Git's merged file with its zdiff3 conflict markers, or null, when not
   * bound, to merge the three texts here.
   */
  readonly merged: InputSignal<string | null>;

  /**
   * The language that colors every pane: its id in the app's code editor
   * registries, its definition, or null, when not bound, for plain text; each
   * pane shows its text plain until the language's tokenizer is ready.
   */
  readonly language: InputSignal<string | ILanguageDefinition | null>;

  /**
   * Emits the chords of a key sequence the view or one of its panes waits to
   * complete, as the platform shows them, and null once it completes or
   * drops; the panes and the view's own keys share one dispatcher.
   */
  readonly keySequencePending: OutputEmitterRef<string | null>;

  /**
   * Our side's name, on its pane and in the choices; required.
   */
  readonly oursLabel: InputSignal<string>;

  /**
   * Their side's name, on its pane and in the choices; required.
   */
  readonly theirsLabel: InputSignal<string>;

  /**
   * Whether the result refuses edits and choices; false when not bound.
   */
  readonly readOnly: InputSignal<boolean>;

  /**
   * Whether the bar between the sides and the result shows, with its count
   * of unresolved conflicts and the choices for the conflict with the caret;
   * true when not bound.
   */
  readonly toolbar: InputSignal<boolean>;

  /**
   * Whether each side and the result are drawn as a card, `--nol-panel`
   * with a `--nol-card-border` border and a `--nol-radius-large` corner;
   * false when not bound.
   */
  readonly panels: InputSignal<boolean>;

  /**
   * Whether the base shows read-only between ours and theirs, with each
   * conflict's base lines under a bar; false when not bound.
   */
  readonly showBase: InputSignal<boolean>;

  /**
   * Emits the result text after every change to it.
   */
  readonly resultChange: OutputEmitterRef<string>;

  /**
   * Emits the conflicts' states, in order, at the start and whenever they
   * change.
   */
  readonly conflictsChange: OutputEmitterRef<IReadOnlyList<ConflictState>>;

  /**
   * Emits the index of the conflict with the caret, from 0, or null when
   * the caret leaves every conflict.
   */
  readonly activeConflictChange: OutputEmitterRef<number | null>;

  /**
   * Emits the exception of a `merged` file whose markers don't parse; the
   * view then shows the line that breaks them in place of the merge.
   */
  readonly markersFailed: OutputEmitterRef<ConflictMarkersException>;

  /**
   * The conflict with the caret, or null when the caret is in none.
   */
  readonly activeConflict: Signal<ActiveConflict | null>;

  /**
   * Creates the view, which Angular does for each `noldova-merge-editor`
   * element.
   *
   * @example
   * ```ts
   * import { Component } from "@angular/core";
   * import { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * @Component({
   *   selector: "app-merge",
   *   imports: [MergeEditorComponent],
   *   template: "<noldova-merge-editor [base]=\"base\" [ours]=\"ours\" [theirs]=\"theirs\" oursLabel=\"main\" theirsLabel=\"feature\" (resultChange)=\"result = $event\" />"
   * })
   * export class MergeComponent {
   *   protected readonly base: string = "a\n";
   *   protected readonly ours: string = "b\n";
   *   protected readonly theirs: string = "c\n";
   *   protected result: string = "";
   * }
   * ```
   */
  constructor();

  /**
   * Gives the result text.
   *
   * @returns The result, or null when a side deleted the file or the
   * markers of `merged` don't parse.
   * @example
   * ```ts
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function resultOf(view: MergeEditorComponent): string {
   *   return view.result() ?? "";
   * }
   * ```
   */
  result(): string | null;

  /**
   * Counts the conflicts still unresolved.
   *
   * @returns The count; 0 when there is no result.
   * @example
   * ```ts
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function canSave(view: MergeEditorComponent): boolean {
   *   return view.unresolvedCount() === 0;
   * }
   * ```
   */
  unresolvedCount(): number;

  /**
   * Tells whether the result differs from the one at the last
   * {@link MergeEditorComponent.markClean}, or from no result before it.
   *
   * @returns True while the result has unsaved changes.
   * @example
   * ```ts
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function shouldAskBeforeClosing(view: MergeEditorComponent): boolean {
   *   return view.dirty();
   * }
   * ```
   */
  dirty(): boolean;

  /**
   * Records the current result as saved, so
   * {@link MergeEditorComponent.dirty} is false until it changes.
   *
   * @example
   * ```ts
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function saved(view: MergeEditorComponent): void {
   *   view.markClean();
   * }
   * ```
   */
  markClean(): void;

  /**
   * Accepts a choice for one conflict, replacing its text in the result as
   * one undoable step; nothing happens when there is no result
   * or the view is read-only.
   *
   * @param index The conflict's index, from 0.
   * @param choice The side, or both sides in an order, to keep.
   * @example
   * ```ts
   * import { ConflictChoice } from "@noldova/code.editor.merge";
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function takeOursForFirst(view: MergeEditorComponent): void {
   *   view.accept(0, ConflictChoice.Ours);
   * }
   * ```
   */
  accept(index: number, choice: ConflictChoice): void;

  /**
   * Accepts a choice for every unresolved conflict as one undoable step;
   * nothing happens when there is no result
   * or the view is read-only.
   *
   * @param choice The side, or both sides in an order, to keep.
   * @example
   * ```ts
   * import { ConflictChoice } from "@noldova/code.editor.merge";
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function takeTheirsForAll(view: MergeEditorComponent): void {
   *   view.acceptAll(ConflictChoice.Theirs);
   * }
   * ```
   */
  acceptAll(choice: ConflictChoice): void;

  /**
   * Puts one conflict back to its base text, unresolved, as one undoable
   * step; nothing happens when there is no result
   * or the view is read-only.
   *
   * @param index The conflict's index, from 0.
   * @example
   * ```ts
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function reopenFirst(view: MergeEditorComponent): void {
   *   view.reset(0);
   * }
   * ```
   */
  reset(index: number): void;

  /**
   * Sets one conflict's text in the result as one undoable step and marks
   * it suggested until the person edits it; nothing happens when there is
   * no result or the view is read-only.
   *
   * @param index The conflict's index, from 0.
   * @param text The conflict's new text.
   * @example
   * ```ts
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function suggest(view: MergeEditorComponent, text: string): void {
   *   view.setConflictText(0, text);
   * }
   * ```
   */
  setConflictText(index: number, text: string): void;

  /**
   * Moves the caret to the start of one conflict in the result and names it
   * for screen readers; nothing happens when there is no result.
   *
   * @param index The conflict's index, from 0.
   * @throws {ArgumentOutOfRangeException} When the merge has no conflict at
   * the index.
   * @example
   * ```ts
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function showFirst(view: MergeEditorComponent): void {
   *   if (view.unresolvedCount() > 0)
   *     view.revealConflict(0);
   * }
   * ```
   */
  revealConflict(index: number): void;

  /**
   * Moves the caret to the next conflict, or, from outside every conflict,
   * to the first one after it; past the last one, it says so for screen
   * readers and stays.
   *
   * @example
   * ```ts
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function onNext(view: MergeEditorComponent): void {
   *   view.nextConflict();
   * }
   * ```
   */
  nextConflict(): void;

  /**
   * Moves the caret to the previous conflict, or, from outside every
   * conflict, to the last one before it; before the first one, it says so
   * for screen readers and stays.
   *
   * @example
   * ```ts
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function onPrevious(view: MergeEditorComponent): void {
   *   view.previousConflict();
   * }
   * ```
   */
  previousConflict(): void;

  /**
   * Undoes the result's last step, choices included; nothing happens when
   * there is no result.
   *
   * @example
   * ```ts
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function onUndo(view: MergeEditorComponent): void {
   *   view.undo();
   * }
   * ```
   */
  undo(): void;

  /**
   * Redoes the result's last undone step; nothing happens when there is no
   * result.
   *
   * @example
   * ```ts
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function onRedo(view: MergeEditorComponent): void {
   *   view.redo();
   * }
   * ```
   */
  redo(): void;

  /**
   * Moves the focus into the result; nothing happens when there is no
   * result.
   *
   * @example
   * ```ts
   * import type { MergeEditorComponent } from "@noldova/code.editor.merge.angular";
   *
   * function startResolving(view: MergeEditorComponent): void {
   *   view.focus();
   * }
   * ```
   */
  focus(): void;
}
