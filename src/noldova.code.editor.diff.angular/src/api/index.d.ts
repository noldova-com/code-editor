/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { InputSignal, Signal } from "@angular/core";
import type { ConditionKey, EditorFeature, EditorRegistries, ICommand, IEditorContribution, ILanguageDefinition, Setting, UndoHistory } from "@noldova/code.editor";
import type { WorkerRunner } from "@noldova/code.editor.angular";
import type { DocumentDiff } from "@noldova/code.editor.diff";
import type { IReadOnlyList } from "@noldova/context.collections";

/**
 * Names how {@link DiffEditorComponent} lays out its two texts.
 */
export declare enum DiffLayout {
  /**
   * Side by side while the view is at least as wide as the
   * {@link DiffEditorSettings.inlineBreakpoint} setting, inline while it is
   * narrower.
   */
  Automatic = "Automatic",
  /**
   * Two code views, the original on the left and the modified on the right,
   * whose scrolling is locked by their unchanged regions.
   */
  SideBySide = "SideBySide",
  /**
   * One code view of the modified text, with the removed lines as read-only
   * blocks between its lines and both texts' line numbers in the gutter.
   */
  Inline = "Inline"
}

/**
 * The diff view's settings, declared in its registries: how much unchanged
 * text stays in view, how far the characters of a change are compared, and
 * where the automatic layout turns inline.
 *
 * @example
 * ```ts
 * import { inject } from "@angular/core";
 * import { CodeEditorRegistries } from "@noldova/code.editor.angular";
 * import { DiffEditorSettings } from "@noldova/code.editor.diff.angular";
 *
 * inject(CodeEditorRegistries).registries.settings.setUserValues({ [DiffEditorSettings.contextLines.id]: 5 });
 * ```
 */
export declare class DiffEditorSettings {
  /**
   * `diff.contextLines`, 3: the unchanged lines kept in view next to each
   * change, 0 or more.
   */
  static readonly contextLines: Setting<number>;
  /**
   * `diff.minimumHiddenLines`, 3: the fewest unchanged lines a fold hides,
   * 1 or more.
   */
  static readonly minimumHiddenLines: Setting<number>;
  /**
   * `diff.characterDiffLimit`, 20,000: the most characters of a change, both
   * sides together, compared by character.
   */
  static readonly characterDiffLimit: Setting<number>;
  /**
   * `diff.inlineBreakpoint`, 50: the width, in rem, below which the automatic
   * layout is inline.
   */
  static readonly inlineBreakpoint: Setting<number>;
  /**
   * Every diff view setting.
   */
  static readonly all: IReadOnlyList<Setting<number>>;
}

/**
 * What the diff view's commands move between changes with.
 *
 * @example
 * ```ts
 * import type { IDiffNavigator } from "@noldova/code.editor.diff.angular";
 *
 * declare const navigator: IDiffNavigator;
 * navigator.nextChange();
 * ```
 */
export interface IDiffNavigator {
  /**
   * Moves to the next change.
   *
   * @returns Whether there was a change to move to.
   */
  nextChange(): boolean;

  /**
   * Moves to the previous change.
   *
   * @returns Whether there was a change to move to.
   */
  previousChange(): boolean;
}

/**
 * The diff view's feature and condition, which its commands and key
 * bindings use.
 */
export declare class DiffEditorFeatures {
  /**
   * The diff view a command moves between changes in.
   */
  static readonly navigator: EditorFeature<IDiffNavigator>;
  /**
   * `inDiffEditor`: true while a key goes to a diff view.
   */
  static readonly inDiffEditor: ConditionKey<boolean>;
}

/**
 * The diff view's CSS classes, each the bare class, which a host or a test
 * builds its selectors from.
 *
 * @example
 * ```ts
 * import { DiffEditorClasses } from "@noldova/code.editor.diff.angular";
 *
 * document.querySelectorAll(`.${DiffEditorClasses.pane}`);
 * ```
 */
export declare class DiffEditorClasses {
  /**
   * `nol-diff-editor`: the diff view's host.
   */
  static readonly host: string;
  /**
   * `nol-diff-editor-inline`: added to the host while it shows the change inline.
   */
  static readonly inline: string;
  /**
   * `nol-diff-editor-pane`: a side's code view, or the one inline.
   */
  static readonly pane: string;
  /**
   * `nol-diff-editor-status`: the status that names the change the caret moved to.
   */
  static readonly status: string;
}

/**
 * The diff view's commands, which move its caret to the next or the previous
 * change.
 *
 * @remarks
 * A command returns false outside a diff view, so its key goes on.
 *
 * @example
 * ```ts
 * import { DiffEditorCommands } from "@noldova/code.editor.diff.angular";
 *
 * DiffEditorCommands.nextChange.id; // "diffEditor.nextChange"
 * ```
 */
export declare class DiffEditorCommands {
  /**
   * `diffEditor.nextChange`: moves to the next change, after the last one to the first.
   */
  static readonly nextChange: ICommand;
  /**
   * `diffEditor.previousChange`: moves to the previous change, before the first one to the last.
   */
  static readonly previousChange: ICommand;
  /**
   * Both commands, the next change's first.
   */
  static readonly all: IReadOnlyList<ICommand>;
}

/**
 * The diff view's contribution: the {@link DiffEditorCommands}, on Alt with
 * Down and Up when `inDiffEditor`, the condition and the
 * {@link DiffEditorSettings}.
 *
 * @remarks
 * A command returns false outside a diff view, so its key goes on.
 *
 * @example
 * ```ts
 * import { EditorRegistries } from "@noldova/code.editor";
 * import { DiffEditorContribution } from "@noldova/code.editor.diff.angular";
 *
 * new EditorRegistries().add(new DiffEditorContribution());
 * ```
 */
export declare class DiffEditorContribution implements IEditorContribution {
  /**
   * `"noldova.code.editor.diff.angular"`.
   */
  readonly id: string;

  /**
   * Registers the diff view's entries.
   *
   * @param registries The set to register them in.
   * @example
   * ```ts
   * import { EditorRegistries } from "@noldova/code.editor";
   * import { DiffEditorContribution } from "@noldova/code.editor.diff.angular";
   *
   * new DiffEditorContribution().contribute(new EditorRegistries());
   * ```
   */
  contribute(registries: EditorRegistries): void;
}

/**
 * The registries every {@link DiffEditorComponent} adds its own on top of:
 * the app's `CodeEditorRegistries` with the diff model's `DiffContribution`
 * and the {@link DiffEditorContribution}.
 *
 * @remarks
 * A host sets the diff view's settings and keys in `CodeEditorRegistries`,
 * which these follow.
 *
 * @example
 * ```ts
 * import { inject } from "@angular/core";
 * import { DiffEditorRegistries } from "@noldova/code.editor.diff.angular";
 *
 * inject(DiffEditorRegistries).registries.commands.find("diffEditor.nextChange");
 * ```
 */
export declare class DiffEditorRegistries {
  /**
   * The registries.
   */
  readonly registries: EditorRegistries;

  /**
   * Creates the set over the app's `CodeEditorRegistries`; Angular creates it
   * once per app.
   *
   * @example
   * ```ts
   * import { inject } from "@angular/core";
   * import { DiffEditorRegistries } from "@noldova/code.editor.diff.angular";
   *
   * const registries = inject(DiffEditorRegistries);
   * ```
   */
  constructor();
}

/**
 * Makes the runner a diff runs its line diff on in the browser: a worker
 * that serves the default algorithm's line diff job.
 *
 * @remarks
 * Give it to `DocumentDiff`, so the page never waits for the diff. A host's
 * own algorithm needs a worker script of its own that serves its job; this
 * worker runs it on the calling thread instead. The app's build bundles the
 * package's `diff.worker.ts` through `webWorkerTsConfig`.
 *
 * @example
 * ```ts
 * import { TextDocument } from "@noldova/code.editor";
 * import { DocumentDiff } from "@noldova/code.editor.diff";
 * import { DiffWorker } from "@noldova/code.editor.diff.angular";
 *
 * using runner = DiffWorker.create();
 * using diff = new DocumentDiff(TextDocument.fromText("a"), TextDocument.fromText("b"), undefined, runner);
 * ```
 */
export declare class DiffWorker {
  /**
   * Starts a worker running the package's `diff.worker.ts`.
   *
   * @returns The runner; dispose it to end its worker.
   * @example
   * ```ts
   * import { DiffWorker } from "@noldova/code.editor.diff.angular";
   *
   * using runner = DiffWorker.create();
   * ```
   */
  static create(): WorkerRunner;
}

/**
 * The `noldova-diff-editor` component: the diff view, which compares an
 * original and a modified text, side by side or inline, with the modified
 * side editable unless it is read-only, and the original when asked.
 *
 * @remarks
 * It draws on its code views through their decorations. Unchanged regions
 * collapse to a fold row with a toggle that expands them, an expanded region
 * keeps a toggle on its first line that collapses it again, and Alt with
 * Down or Up, like {@link DiffEditorComponent.nextChange} and
 * {@link DiffEditorComponent.previousChange}, moves the caret between
 * changes, naming each one for screen readers. Its settings and keys come
 * from {@link DiffEditorRegistries}: a key the focused code view doesn't
 * handle goes to the diff view's key bindings.
 */
export declare class DiffEditorComponent implements IDiffNavigator {
  /**
   * The diff of the two documents, which the view follows through every
   * edit; required.
   */
  readonly diff: InputSignal<DocumentDiff>;

  /**
   * The modified document's undo history; required.
   */
  readonly history: InputSignal<UndoHistory>;

  /**
   * The original document's undo history, or null, when not bound, for one
   * of the view's own.
   */
  readonly originalHistory: InputSignal<UndoHistory | null>;

  /**
   * The language that colors both texts: its id in the app's code editor
   * registries, its definition, or null, when not bound, for plain text; the
   * texts show plain until the language's tokenizer is ready.
   */
  readonly language: InputSignal<string | ILanguageDefinition | null>;

  /**
   * Emits the chords of a key sequence the view or one of its panes waits to
   * complete, as the platform shows them, and null once it completes or
   * drops; the panes and the view's own keys share one dispatcher.
   */
  readonly keySequencePending: OutputEmitterRef<string | null>;

  /**
   * How the view lays out the two texts; {@link DiffLayout.Automatic} when
   * not bound.
   */
  readonly layout: InputSignal<DiffLayout>;

  /**
   * The original side's accessible name; required.
   */
  readonly originalLabel: InputSignal<string>;

  /**
   * The modified side's accessible name; required.
   */
  readonly modifiedLabel: InputSignal<string>;

  /**
   * Whether the modified side refuses edits too; false when not bound.
   */
  readonly readOnly: InputSignal<boolean>;

  /**
   * Whether the original side refuses edits; true when not bound.
   */
  readonly originalReadOnly: InputSignal<boolean>;

  /**
   * Whether the view shows the two texts inline now.
   */
  readonly inline: Signal<boolean>;

  /**
   * Creates the view, which Angular does for each `noldova-diff-editor`
   * element.
   *
   * @example
   * ```ts
   * import { Component } from "@angular/core";
   * import { TextDocument, UndoHistory } from "@noldova/code.editor";
   * import { DocumentDiff } from "@noldova/code.editor.diff";
   * import { DiffEditorComponent, DiffWorker } from "@noldova/code.editor.diff.angular";
   *
   * @Component({
   *   selector: "app-changes",
   *   imports: [DiffEditorComponent],
   *   template: "<noldova-diff-editor [diff]=\"diff\" [history]=\"history\" originalLabel=\"main\" modifiedLabel=\"Working tree\" />"
   * })
   * export class ChangesComponent {
   *   protected readonly diff: DocumentDiff = new DocumentDiff(TextDocument.fromText("a"), TextDocument.fromText("b"), undefined, DiffWorker.create());
   *   protected readonly history: UndoHistory = new UndoHistory(this.diff.modified);
   * }
   * ```
   */
  constructor();

  /**
   * Moves the caret of the focused side, or of the modified side, to the
   * next change, wrapping at the end, and names it for screen readers.
   *
   * @returns Whether there was a change to move to.
   * @example
   * ```ts
   * import type { DiffEditorComponent } from "@noldova/code.editor.diff.angular";
   *
   * declare const view: DiffEditorComponent;
   * view.nextChange();
   * ```
   */
  nextChange(): boolean;

  /**
   * Moves the caret of the focused side, or of the modified side, to the
   * previous change, wrapping at the start, and names it for screen readers.
   *
   * @returns Whether there was a change to move to.
   * @example
   * ```ts
   * import type { DiffEditorComponent } from "@noldova/code.editor.diff.angular";
   *
   * declare const view: DiffEditorComponent;
   * view.previousChange();
   * ```
   */
  previousChange(): boolean;
}
