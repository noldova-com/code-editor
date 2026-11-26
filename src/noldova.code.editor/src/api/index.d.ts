/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { IReadOnlyList } from "@noldova/context.collections";
import { ArgumentException, Exception, type ExceptionOptions } from "@noldova/context.exceptions";
import type { CancellationToken } from "@noldova/context.threading";

/**
 * Classifies an edit transaction for undo grouping.
 *
 * @remarks
 * {@link UndoHistory} merges a transaction into the previous undo step only
 * when both have the same kind, that kind is not {@link EditKind.Other}, it
 * follows within {@link UndoHistory.groupMilliseconds}, and the selections continue from where
 * the previous step left them.
 */
export declare enum EditKind {
  /**
   * Text typed at the selections, a new line, or an indent of carets and
   * single-line selections; consecutive typing groups into one step.
   */
  Typing = "Typing",
  /**
   * Text deleted from the selections; consecutive deletes group into one step.
   */
  Deleting = "Deleting",
  /**
   * Any other edit, such as a paste, an indent or outdent of whole lines, or
   * a replacement; each one is its own undo step.
   */
  Other = "Other"
}

/**
 * What a {@link KeyDispatcher} did with a press.
 */
export declare enum KeyDispatchResult {
  /**
   * No binding took the press; the view leaves it to the browser.
   */
  None = "None",
  /**
   * A command ran for the press.
   */
  Handled = "Handled",
  /**
   * The press began, or went on with, a key sequence; the dispatcher waits
   * for the next chord.
   */
  Pending = "Pending",
  /**
   * The press ended a pending sequence that no binding completes, so the
   * sequence is dropped and the press is used up.
   */
  Cancelled = "Cancelled"
}

/**
 * Reports two edits in one {@link TextDocument.apply} call whose ranges
 * overlap. Edits that only touch, where one ends where the next starts, are
 * allowed.
 */
export declare class EditsOverlapException extends ArgumentException {
  /**
   * `EditsOverlapException`.
   */
  readonly name: string;

  /**
   * The earlier of the two overlapping ranges, in document order.
   */
  readonly first: TextRange;
  /**
   * The later range, which starts before {@link EditsOverlapException.first}
   * ends.
   */
  readonly second: TextRange;
  /**
   * Creates the exception for the `edits` parameter, with a message naming
   * both ranges' start positions.
   *
   * @param first The earlier range, in document order.
   * @param second The later range, which starts inside `first`.
   * @example
   * ```ts
   * import { EditsOverlapException, TextDocument, TextEdit, TextRange } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("abcdef");
   * try {
   *   document.apply(new List([new TextEdit(TextRange.of(0, 0, 0, 3), "X"), new TextEdit(TextRange.of(0, 2, 0, 4), "Y")]));
   * }
   * catch (error) {
   *   if (error instanceof EditsOverlapException)
   *     console.log(error.second.start.column); // 2
   * }
   * ```
   */
  constructor(first: TextRange, second: TextRange);
}

/**
 * Reports a search pattern that isn't a valid regular expression.
 *
 * @remarks
 * The {@link TextSearch} constructor throws it while compiling its
 * {@link SearchQuery}, with the `RegExp` error as the cause.
 */
export declare class SearchPatternException extends Exception {
  /**
   * `SearchPatternException`.
   */
  readonly name: string;

  /**
   * The query text exactly as given, before escaping or whole-word wrapping.
   */
  readonly pattern: string;
  /**
   * Creates the exception with the message
   * "The search pattern `pattern` isn't a valid regular expression: `reason`".
   *
   * @param pattern The query text that failed to compile.
   * @param reason Why it failed, usually the `RegExp` error's text.
   * @param options Optional exception options, such as the original error as
   * the cause.
   * @example
   * ```ts
   * import { SearchPatternException, SearchQuery, TextSearch } from "@noldova/code.editor";
   *
   * try {
   *   new TextSearch(new SearchQuery("(a", true));
   * }
   * catch (error) {
   *   if (error instanceof SearchPatternException)
   *     console.log(error.pattern); // "(a"
   * }
   * ```
   */
  constructor(pattern: string, reason: string, options?: ExceptionOptions);
}

/**
 * Reports a value that is `null` or `undefined` where one is required.
 *
 * @remarks
 * {@link Required.value} throws it.
 */
export declare class ValueMissingException extends Exception {
  /**
   * `ValueMissingException`.
   */
  readonly name: string;

  /**
   * Creates the exception with the message
   * "A value is missing where one is required."
   *
   * @example
   * ```ts
   * import { Required, ValueMissingException } from "@noldova/code.editor";
   *
   * try {
   *   Required.value(null);
   * }
   * catch (error) {
   *   console.log(error instanceof ValueMissingException); // true
   * }
   * ```
   */
  constructor();
}

/**
 * A highlighting engine, such as TextMate's in `@noldova/code.editor.textmate`,
 * a Tree-sitter one, or a host's own.
 *
 * @remarks
 * A {@link HighlighterRegistry} asks {@link IHighlighter.supports} before
 * {@link IHighlighter.createAsync}, and makes each language's tokenizer once.
 */
export interface IHighlighter {
  /**
   * The highlighter's unique id, such as `textmate`, which
   * {@link HighlighterRegistry.assign} pins a language to.
   */
  readonly id: string;
  /**
   * Whether the highlighter can color the language.
   *
   * @param language The language.
   * @returns True when {@link IHighlighter.createAsync} can make its tokenizer.
   */
  supports(language: ILanguageDefinition): boolean;
  /**
   * Makes the language's tokenizer, loading what it needs, such as a grammar,
   * only now.
   *
   * @param language A language the highlighter supports.
   * @param registries The set the tokenizer is made for, whose settings it may
   * read.
   * @returns The tokenizer.
   * @example
   * ```ts
   * import type { EditorRegistries, IHighlighter, ILanguageDefinition, ILineTokenizer } from "@noldova/code.editor";
   *
   * declare const highlighter: IHighlighter;
   * declare const language: ILanguageDefinition;
   * declare const registries: EditorRegistries;
   * const tokenizer: ILineTokenizer = await highlighter.createAsync(language, registries);
   * ```
   */
  createAsync(language: ILanguageDefinition, registries: EditorRegistries): Promise<ILineTokenizer>;
}

/**
 * A language, as plain data: its id, the names, file names and first line it
 * is found by, and its comments, brackets and word characters, so a host can
 * load one from a file.
 *
 * @remarks
 * Every field but `id` is optional. A file's language is found by
 * {@link LanguageRegistry.forFile}; the language's indent comes from the
 * settings' language defaults under `"[id]"`.
 */
export interface ILanguageDefinition {
  /**
   * The language's unique id, in lower case, such as `typescript`.
   */
  readonly id: string;
  /**
   * Other names it is found by, such as `ts`.
   */
  readonly aliases?: IReadOnlyList<string> | undefined;
  /**
   * File name endings, with the dot, such as `.ts` or `.d.ts`; the longest
   * match wins.
   */
  readonly extensions?: IReadOnlyList<string> | undefined;
  /**
   * Whole file names, such as `Dockerfile` or `.bashrc`.
   */
  readonly filenames?: IReadOnlyList<string> | undefined;
  /**
   * Globs on the file name, such as `Dockerfile.*`, or on the path's end when
   * they hold a slash, such as `**\/.git/config`.
   */
  readonly filenamePatterns?: IReadOnlyList<string> | undefined;
  /**
   * A regular expression's source, tested on the file's first line, such as
   * `^#!.*\\bnode\\b`.
   */
  readonly firstLine?: string | undefined;
  /**
   * The text that starts a line comment, such as `//`.
   */
  readonly lineComment?: string | undefined;
  /**
   * The texts that open and close a block comment.
   */
  readonly blockComment?: BlockComment | undefined;
  /**
   * The language's bracket pairs.
   */
  readonly brackets?: IReadOnlyList<BracketPair> | undefined;
  /**
   * Characters that count as word characters besides letters, digits and
   * `_`, such as `-` for CSS.
   */
  readonly wordCharacters?: string | undefined;
}

/**
 * A diff algorithm: the changes between two line sequences, and between two
 * strings by character.
 *
 * @remarks
 * Both calls are pure and synchronous, so they run on any thread. A worker
 * runs a host's own algorithm only when its worker script serves a
 * `code.editor.diff` line diff job of the same `id`; elsewhere the job runs on the
 * runner's fallback, on the calling thread.
 *
 * @example
 * ```ts
 * import { DiffSpan, type IDiffAlgorithm } from "@noldova/code.editor";
 * import { type IReadOnlyList, List } from "@noldova/context.collections";
 *
 * class WholeAlgorithm implements IDiffAlgorithm {
 *   public readonly id: string = "whole";
 *
 *   public lines(original: IReadOnlyList<string>, modified: IReadOnlyList<string>): IReadOnlyList<DiffSpan> {
 *     return new List([new DiffSpan(0, original.count(), 0, modified.count())]);
 *   }
 *
 *   public characters(original: string, modified: string): IReadOnlyList<DiffSpan> {
 *     return new List([new DiffSpan(0, original.length, 0, modified.length)]);
 *   }
 * }
 * ```
 */
export interface IDiffAlgorithm {
  /**
   * The algorithm's id, such as `noldova.diff`, which also names its line
   * diff job.
   */
  readonly id: string;

  /**
   * Finds the changed line ranges.
   *
   * @param original The lines before.
   * @param modified The lines after.
   * @returns The changes in order and apart; none for equal sequences.
   */
  lines(original: IReadOnlyList<string>, modified: IReadOnlyList<string>): IReadOnlyList<DiffSpan>;

  /**
   * Finds the changed character ranges, as UTF-16 offsets.
   *
   * @param original The text before.
   * @param modified The text after.
   * @returns The changes in order and apart; none for equal strings.
   */
  characters(original: string, modified: string): IReadOnlyList<DiffSpan>;
}

/**
 * Tokenizes source text one line at a time, carrying state from each line
 * to the next.
 *
 * @remarks
 * {@link TokenCache} starts at {@link ILineTokenizer.initialState}, passes
 * each line's end state to the next line, and stops re-tokenizing after an
 * edit once a line's new end state equals its old one.
 */
export interface ILineTokenizer {
  /**
   * The state before the document's first line.
   */
  readonly initialState: ITokenizerState;
  /**
   * Tokenizes one line.
   *
   * @param text The line's text, without its line ending.
   * @param state The end state of the line before, or
   * {@link ILineTokenizer.initialState} for the first line.
   * @returns The line's tokens and the state at the line's end.
   * @example
   * ```ts
   * import type { ILineTokenizer, LineTokens } from "@noldova/code.editor";
   *
   * declare const tokenizer: ILineTokenizer;
   * const first: LineTokens = tokenizer.tokenizeLine("const a = 1;", tokenizer.initialState);
   * const second: LineTokens = tokenizer.tokenizeLine("a++;", first.endState);
   * ```
   */
  tokenizeLine(text: string, state: ITokenizerState): LineTokens;
}

/**
 * A token modifier, such as `deprecated`, which a token carries beside its
 * type and a view styles with a class of its own.
 */
export interface ITokenModifierDefinition {
  /**
   * The modifier's unique id.
   */
  readonly id: string;
  /**
   * What the modifier means, for a person.
   */
  readonly description?: string | undefined;
}

/**
 * A token type: an open dotted name with an optional parent it falls back to.
 */
export interface ITokenTypeDefinition {
  /**
   * The type's unique id, such as `keyword.control`.
   */
  readonly id: string;
  /**
   * What the type means, for a person.
   */
  readonly description?: string | undefined;
  /**
   * The type it falls back to for styles; when left out, the type its id has
   * before its last dot, if any.
   */
  readonly parent?: string | undefined;
}

/**
 * A tokenizer's opaque state at a line boundary.
 */
export interface ITokenizerState {
  /**
   * Compares two states.
   *
   * @param other The state to compare with, usually from the same tokenizer.
   * @returns True when tokenizing the next line from either state gives the
   * same result. States from a different tokenizer type return false.
   * @example
   * ```ts
   * import { ILineTokenizer } from "@noldova/code.editor";
   *
   * declare const tokenizer: ILineTokenizer;
   * const end = tokenizer.tokenizeLine("/* open", tokenizer.initialState).endState;
   * end.equals(tokenizer.initialState); // false: inside a comment.
   * ```
   */
  equals(other: ITokenizerState): boolean;
}

/**
 * One edit as a {@link TextDocument} applied it, with the text it replaced
 * and where it landed.
 *
 * @remarks
 * A {@link TextChange} lists its applied edits in document order. All
 * members are read-only and set once by the constructor.
 */
export declare class AppliedEdit {
  /**
   * The replaced range, in the document before the change.
   */
  readonly oldRange: TextRange;
  /**
   * The inserted text's range, in the document after the whole change,
   * including the shifts made by earlier edits of the same change.
   */
  readonly newRange: TextRange;
  /**
   * The text that {@link AppliedEdit.oldRange} held before the change.
   */
  readonly oldText: string;
  /**
   * The text inserted in its place.
   */
  readonly text: string;
  /**
   * The zero-based UTF-16 offset of {@link AppliedEdit.oldRange}'s start, in
   * the document before the change.
   */
  readonly oldOffset: number;
  /**
   * Creates an applied edit; {@link TextDocument.apply} creates these for
   * each change it reports.
   *
   * @param oldRange The replaced range, before the change.
   * @param newRange The inserted text's range, after the change.
   * @param oldText The replaced text.
   * @param text The inserted text.
   * @param oldOffset The zero-based UTF-16 offset of `oldRange`'s start,
   * before the change.
   * @example
   * ```ts
   * import { AppliedEdit, TextRange } from "@noldova/code.editor";
   *
   * const edit = new AppliedEdit(TextRange.of(0, 1, 0, 3), TextRange.of(0, 1, 0, 2), "bc", "X", 1);
   * edit.text.length - edit.oldText.length; // -1
   * ```
   */
  constructor(oldRange: TextRange, newRange: TextRange, oldText: string, text: string, oldOffset: number);
}

/**
 * The texts that open and close a block comment.
 */
export declare class BlockComment {
  /**
   * The opening text, such as `/*`.
   */
  readonly open: string;
  /**
   * The closing text.
   */
  readonly close: string;
  /**
   * Creates a block comment's texts.
   *
   * @param open The opening text.
   * @param close The closing text.
   * @example
   * ```ts
   * import { BlockComment } from "@noldova/code.editor";
   *
   * const comment = new BlockComment("<!--", "-->");
   * ```
   */
  constructor(open: string, close: string);
}

/**
 * A language's bracket pair.
 */
export declare class BracketPair {
  /**
   * The opening bracket.
   */
  readonly open: string;
  /**
   * The closing bracket.
   */
  readonly close: string;
  /**
   * Creates a bracket pair.
   *
   * @param open The opening bracket.
   * @param close The closing bracket.
   * @example
   * ```ts
   * import { BracketPair } from "@noldova/code.editor";
   *
   * const pair = new BracketPair("{", "}");
   * ```
   */
  constructor(open: string, close: string);
}

/**
 * A language definition as a class, for a host that builds one in code.
 *
 * @remarks
 * Every field but `id` is optional and left out by default; see
 * {@link ILanguageDefinition} for what each one means.
 */
export declare class LanguageDefinition implements ILanguageDefinition {
  /**
   * The language's unique id, in lower case, such as `typescript`.
   */
  readonly id: string;
  /**
   * Other names it is found by, such as `ts`.
   */
  readonly aliases: IReadOnlyList<string> | undefined;
  /**
   * File name endings, with the dot, such as `.ts` or `.d.ts`.
   */
  readonly extensions: IReadOnlyList<string> | undefined;
  /**
   * Whole file names, such as `Dockerfile` or `.bashrc`.
   */
  readonly filenames: IReadOnlyList<string> | undefined;
  /**
   * Globs on the file name, or on the path's end when they hold a slash.
   */
  readonly filenamePatterns: IReadOnlyList<string> | undefined;
  /**
   * A regular expression's source, tested on the file's first line.
   */
  readonly firstLine: string | undefined;
  /**
   * The text that starts a line comment, such as `//`.
   */
  readonly lineComment: string | undefined;
  /**
   * The texts that open and close a block comment.
   */
  readonly blockComment: BlockComment | undefined;
  /**
   * The language's bracket pairs.
   */
  readonly brackets: IReadOnlyList<BracketPair> | undefined;
  /**
   * Characters that count as word characters besides letters, digits and
   * `_`.
   */
  readonly wordCharacters: string | undefined;
  /**
   * Creates a language definition.
   *
   * @param id The language's unique id.
   * @param aliases Other names it is found by.
   * @param extensions File name endings, with the dot.
   * @param filenames Whole file names.
   * @param filenamePatterns Globs on the file name or the path's end.
   * @param firstLine A regular expression's source, tested on the first line.
   * @param lineComment The text that starts a line comment.
   * @param blockComment The texts that open and close a block comment.
   * @param brackets The language's bracket pairs.
   * @param wordCharacters Extra word characters.
   * @example
   * ```ts
   * import { LanguageDefinition } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const ini = new LanguageDefinition("ini", undefined, new List([".ini"]), undefined, undefined, undefined, ";");
   * ```
   */
  constructor(id: string, aliases?: IReadOnlyList<string>, extensions?: IReadOnlyList<string>, filenames?: IReadOnlyList<string>,
    filenamePatterns?: IReadOnlyList<string>, firstLine?: string, lineComment?: string, blockComment?: BlockComment, brackets?: IReadOnlyList<BracketPair>,
    wordCharacters?: string);
}

/**
 * The span of one change between two sequences, of lines or of characters:
 * the original side's `[originalStart, originalEnd)` becomes the modified
 * side's `[modifiedStart, modifiedEnd)`.
 *
 * @remarks
 * `@noldova/diff`'s `DiffChange` has this shape, so its results pass as they
 * are.
 *
 * @example
 * ```ts
 * import { DiffSpan } from "@noldova/code.editor";
 *
 * new DiffSpan(1, 2, 1, 3).modifiedEnd; // 3
 * ```
 */
export declare class DiffSpan {
  /**
   * The first index on the original side.
   */
  readonly originalStart: number;

  /**
   * The index after the last on the original side.
   */
  readonly originalEnd: number;

  /**
   * The first index on the modified side.
   */
  readonly modifiedStart: number;

  /**
   * The index after the last on the modified side.
   */
  readonly modifiedEnd: number;

  /**
   * Holds the span.
   *
   * @param originalStart The first index on the original side.
   * @param originalEnd The index after the last on the original side.
   * @param modifiedStart The first index on the modified side.
   * @param modifiedEnd The index after the last on the modified side.
   * @example
   * ```ts
   * import { DiffSpan } from "@noldova/code.editor";
   *
   * new DiffSpan(0, 0, 0, 1);
   * ```
   */
  constructor(originalStart: number, originalEnd: number, modifiedStart: number, modifiedEnd: number);
}

/**
 * One undoable step: the edits to apply, what kind of edit it is, when it
 * happened, and the selections before and after it.
 *
 * @remarks
 * {@link TextEditing} builds these and {@link UndoHistory} applies them.
 * Consecutive transactions of the same typing or deleting kind that come
 * close together in time are grouped into one undo step.
 */
export declare class EditTransaction {
  /**
   * The edits to apply together, with ranges in the document before the
   * transaction.
   */
  readonly edits: IReadOnlyList<TextEdit>;
  /**
   * The kind of edit, which decides whether it can group with the previous
   * step.
   */
  readonly kind: EditKind;
  /**
   * When the edit happened, in milliseconds, from the same clock for every
   * transaction of one history.
   */
  readonly time: number;
  /**
   * The selections to restore when the step is undone.
   */
  readonly selectionsBefore: IReadOnlyList<TextSelection>;
  /**
   * The selections to restore when the step is redone, and to show after it
   * is applied.
   */
  readonly selectionsAfter: IReadOnlyList<TextSelection>;
  /**
   * Creates a transaction. The lists are stored as given, not copied.
   *
   * @param edits The edits, with ranges in the document before the change.
   * @param kind The kind of edit.
   * @param time The time of the edit, in milliseconds.
   * @param selectionsBefore The selections before the edit.
   * @param selectionsAfter The selections after the edit.
   * @example
   * ```ts
   * import { EditKind, EditTransaction, TextEdit, TextPosition, TextRange, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const transaction = new EditTransaction(
   *   new List([new TextEdit(TextRange.of(0, 0, 0, 0), "a")]),
   *   EditKind.Typing,
   *   Date.now(),
   *   new List([new TextSelection(new TextPosition(0, 0))]),
   *   new List([new TextSelection(new TextPosition(0, 1))]));
   * ```
   */
  constructor(edits: IReadOnlyList<TextEdit>, kind: EditKind, time: number, selectionsBefore: IReadOnlyList<TextSelection>, selectionsAfter: IReadOnlyList<TextSelection>);
}

/**
 * A key press with its modifier keys, independent of the browser's event.
 *
 * @remarks
 * {@link KeyBindingRegistry.matches} matches it against the key text of each
 * binding.
 */
export declare class KeyPress {
  /**
   * The key's name, as a keyboard event's `key` gives it, such as
   * `"ArrowLeft"` or `"a"`.
   */
  readonly key: string;
  /**
   * The physical key, as a keyboard event's `code` gives it, such as
   * `"KeyA"` or `"BracketLeft"`; empty when unknown.
   */
  readonly code: string;
  /**
   * True when Shift was held.
   */
  readonly shift: boolean;
  /**
   * True when Control was held.
   */
  readonly control: boolean;
  /**
   * True when Alt, or Option on a Mac, was held.
   */
  readonly alt: boolean;
  /**
   * True when Meta, Command on a Mac, was held.
   */
  readonly meta: boolean;
  /**
   * Creates a key press.
   *
   * @param key The key's name, as a keyboard event's `key` gives it.
   * @param code The physical key, as a keyboard event's `code` gives it.
   * @param shift Whether Shift was held.
   * @param control Whether Control was held.
   * @param alt Whether Alt or Option was held.
   * @param meta Whether Meta or Command was held.
   * @example
   * ```ts
   * import { KeyPress } from "@noldova/code.editor";
   *
   * const press = new KeyPress("ArrowLeft", "ArrowLeft", true, true, false, false);
   * ```
   */
  constructor(key: string, code: string, shift: boolean, control: boolean, alt: boolean, meta: boolean);
}

/**
 * One chord of a binding's key text, such as `ctrl+k`: a key with the
 * modifiers held with it.
 */
export declare class KeyChord {
  /**
   * The chord's text as the rule writes it.
   */
  readonly text: string;
  /**
   * Reads a chord's text.
   *
   * @param text The text: modifiers and a key joined by `+`, such as
   * `"ctrl+shift+k"`; `mod` is Command on a Mac and Control elsewhere.
   * @param primary The modifier `mod` stands for, `"cmd"` or `"ctrl"`.
   * @returns The chord.
   * @throws {KeySyntaxException} When the text names an unknown modifier or
   * no key.
   * @example
   * ```ts
   * import { KeyChord } from "@noldova/code.editor";
   *
   * KeyChord.parse("mod+k", "cmd").label("mac"); // "⌘K"
   * ```
   */
  static parse(text: string, primary: string): KeyChord;
  /**
   * Tells whether a press is this chord.
   *
   * @param press The press.
   * @returns True when the key and every modifier match.
   */
  matches(press: KeyPress): boolean;
  /**
   * Tells whether another chord has the same key and modifiers.
   *
   * @param other The other chord.
   * @returns True when they match.
   */
  equals(other: KeyChord): boolean;
  /**
   * The chord as a platform shows it to the user.
   *
   * @param platform The `platform` condition's value: `"mac"`, `"windows"`
   * or `"linux"`.
   * @returns On a Mac the modifier symbols and the key, such as `"⇧⌘K"`;
   * elsewhere the modifiers' names and the key joined by `+`, such as
   * `"Ctrl+Shift+K"`.
   * @example
   * ```ts
   * import { KeyChord } from "@noldova/code.editor";
   *
   * KeyChord.parse("ctrl+k", "ctrl").label("windows"); // "Ctrl+K"
   * ```
   */
  label(platform: string): string;
}

/**
 * A binding's whole key text: one chord, or a sequence of chords pressed
 * one after another, such as `ctrl+k ctrl+c`.
 */
export declare class KeySequence {
  /**
   * The text as the rule writes it.
   */
  readonly text: string;
  /**
   * The chords, in the order they are pressed.
   */
  readonly chords: IReadOnlyList<KeyChord>;
  /**
   * The first chord.
   */
  get first(): KeyChord;
  /**
   * Reads a binding's key text.
   *
   * @param text The chords' texts separated by spaces, at most two of them.
   * @param primary The modifier `mod` stands for, `"cmd"` or `"ctrl"`.
   * @returns The sequence.
   * @throws {KeySyntaxException} When a chord names an unknown modifier or no
   * key.
   * @throws {ArgumentException} When the text has more than two chords.
   * @example
   * ```ts
   * import { KeySequence } from "@noldova/code.editor";
   *
   * KeySequence.parse("ctrl+k ctrl+c", "ctrl").chords.count(); // 2
   * ```
   */
  static parse(text: string, primary: string): KeySequence;
  /**
   * Tells whether another sequence has the same chords.
   *
   * @param other The other sequence.
   * @returns True when every chord matches, in order.
   */
  equals(other: KeySequence): boolean;
  /**
   * The sequence as a platform shows it, each chord's
   * {@link KeyChord.label} separated by a space.
   *
   * @param platform The `platform` condition's value.
   * @returns The label, such as `"Ctrl+K Ctrl+C"`.
   */
  label(platform: string): string;
}

/**
 * One view's key dispatch, which holds a key sequence while it waits for
 * the sequence's next chord.
 *
 * @remarks
 * A press that begins a sequence a binding holds makes the dispatcher wait,
 * even when a single-chord binding has the same key, as sequences win. While
 * it waits, a modifier key alone is ignored; the next chord runs the binding
 * it completes, and any other press, Escape too, drops the sequence and is
 * used up. The view drops it too on a click or when it loses the focus,
 * with {@link KeyDispatcher.cancel}. One dispatcher may serve views nested
 * in each other, such as a diff view and its panes: each press goes through
 * the contexts the innermost view gives, its own and then its hosts', so a
 * sequence may begin in one view's bindings and a host's binding may complete
 * it.
 *
 * @example
 * ```ts
 * import { type CommandContext, KeyDispatcher, KeyDispatchResult, KeyPress } from "@noldova/code.editor";
 * import { List } from "@noldova/context.collections";
 *
 * declare const context: CommandContext;
 * const dispatcher = new KeyDispatcher();
 * const result = dispatcher.dispatch(new KeyPress("k", "KeyK", false, true, false, false), new List([context]));
 * if (result === KeyDispatchResult.Pending)
 *   dispatcher.pendingLabel(context.conditions); // "Ctrl+K" on Windows and Linux
 * ```
 */
export declare class KeyDispatcher {
  /**
   * True while a sequence waits for its next chord.
   */
  get pending(): boolean;
  /**
   * The chords pressed so far, as the platform shows them.
   *
   * @param conditions The view's condition values, `platform` among them.
   * @returns The label, or null when no sequence is pending.
   */
  pendingLabel(conditions: ConditionValues): string | null;
  /**
   * Dispatches a press through each context in turn: the first whose rules
   * go on with a sequence makes the dispatcher wait, else the first whose
   * command handles the press runs it.
   *
   * @param press The press.
   * @param contexts The views and moment the commands run in, the innermost
   * view's first.
   * @returns What the dispatcher did with the press.
   */
  dispatch(press: KeyPress, contexts: IReadOnlyList<CommandContext>): KeyDispatchResult;
  /**
   * Drops the pending sequence.
   *
   * @returns True when a sequence was pending.
   */
  cancel(): boolean;
}

/**
 * A text cut into its lines, each with the line break that ends it.
 *
 * @remarks
 * A line ends at `\r\n`, `\r` or `\n`; the last line has no break, so
 * a text that ends with a break has an empty last line. Joining each text
 * with its ending gives the text back.
 */
export declare class LineSplit {
  /**
   * Each line's text, without its line break.
   */
  readonly texts: IReadOnlyList<string>;
  /**
   * Each line's break, the same length as {@link LineSplit.texts}; the last
   * is always empty.
   */
  readonly endings: IReadOnlyList<string>;
  private constructor();
  /**
   * Cuts a text into its lines.
   *
   * @param text The text to cut.
   * @returns The lines and their breaks.
   * @example
   * ```ts
   * import { LineSplit } from "@noldova/code.editor";
   *
   * const split = LineSplit.of("a\r\nb\n");
   * split.texts.toArray(); // ["a", "b", ""]
   * split.endings.toArray(); // ["\r\n", "\n", ""]
   * ```
   */
  static of(text: string): LineSplit;
}

/**
 * A span of one line to draw in one style.
 *
 * @remarks
 * {@link TokenSegments.fill} produces segments that cover a line from its
 * first column to its end, without gaps or overlaps.
 */
export declare class LineSegment {
  /**
   * The zero-based column where the span starts.
   */
  readonly start: number;
  /**
   * The column after the span's last character, exclusive.
   */
  readonly end: number;
  /**
   * The token type that styles the span, such as `keyword.control`, or `null`
   * for plain text.
   */
  readonly type: string | null;
  /**
   * The token's modifiers, such as `deprecated`; empty for plain text.
   */
  readonly modifiers: IReadOnlyList<string>;
  /**
   * Creates a segment.
   *
   * @param start The zero-based start column.
   * @param end The exclusive end column.
   * @param type The token type, or `null` for plain text.
   * @param modifiers The token's modifiers; none when left out.
   * @example
   * ```ts
   * import { LineSegment } from "@noldova/code.editor";
   *
   * const segment = new LineSegment(0, 5, "keyword");
   * ```
   */
  constructor(start: number, end: number, type: string | null, modifiers?: IReadOnlyList<string>);
}

/**
 * A highlighted token on one line.
 */
export declare class LineToken {
  /**
   * The zero-based column where the token starts.
   */
  readonly start: number;
  /**
   * The column after the token's last character, exclusive.
   */
  readonly end: number;
  /**
   * The token's type, an open dotted name such as `keyword.control`; a type
   * no registry knows is styled as its nearest registered one along its dots,
   * as {@link TokenTypeRegistry.resolve} finds it.
   */
  readonly type: string;
  /**
   * The token's modifiers, such as `deprecated` or `readonly`.
   */
  readonly modifiers: IReadOnlyList<string>;
  /**
   * Creates a token.
   *
   * @param start The zero-based start column.
   * @param end The exclusive end column.
   * @param type The token's type.
   * @param modifiers The token's modifiers; none when left out.
   * @example
   * ```ts
   * import { LineToken } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const token = new LineToken(0, 5, "keyword", new List(["readonly"]));
   * ```
   */
  constructor(start: number, end: number, type: string, modifiers?: IReadOnlyList<string>);
}

/**
 * The tokens of one line and the tokenizer state at its end.
 *
 * @remarks
 * The end state is what tokenizing the next line starts from.
 */
export declare class LineTokens {
  /**
   * The line's highlighted tokens, in column order; text without a token is
   * plain.
   */
  readonly tokens: IReadOnlyList<LineToken>;
  /**
   * The tokenizer state after the line, to pass when tokenizing the next one.
   */
  readonly endState: ITokenizerState;
  /**
   * Creates a line's tokens. The list is stored as given, not copied.
   *
   * @param tokens The line's tokens, in column order.
   * @param endState The state at the line's end.
   * @example
   * ```ts
   * import { LineToken, LineTokens, type ITokenizerState } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * declare const state: ITokenizerState;
   * const line = new LineTokens(new List([new LineToken(0, 5, "keyword")]), state);
   * ```
   */
  constructor(tokens: IReadOnlyList<LineToken>, endState: ITokenizerState);
}

/**
 * What to search for in a document and how to match it.
 */
export declare class SearchQuery {
  /**
   * The text to find, or the pattern when {@link SearchQuery.isRegex} is true.
   */
  readonly text: string;
  /**
   * True when the text is a regular expression rather than literal text.
   */
  readonly isRegex: boolean;
  /**
   * True when letter case must match.
   */
  readonly isCaseSensitive: boolean;
  /**
   * True when a match must be a whole word, not part of a longer word.
   */
  readonly isWholeWord: boolean;
  /**
   * Creates a query. A pattern is not checked here; an invalid one fails when
   * the search compiles it.
   *
   * @param text The literal text or the pattern to find.
   * @param isRegex Whether the text is a regular expression. Defaults to false.
   * @param isCaseSensitive Whether case must match. Defaults to false.
   * @param isWholeWord Whether matches must be whole words. Defaults to false.
   * @example
   * ```ts
   * import { SearchQuery } from "@noldova/code.editor";
   *
   * const literal = new SearchQuery("count");
   * const pattern = new SearchQuery("item\\d+", true, true);
   * ```
   */
  constructor(text: string, isRegex?: boolean, isCaseSensitive?: boolean, isWholeWord?: boolean);
}

/**
 * One applied change to a {@link TextDocument}: its version and the edits as
 * applied.
 *
 * @remarks
 * {@link TextDocument.apply} returns it and passes it to the document's change
 * listeners.
 */
export declare class TextChange {
  /**
   * The document's version after the change; each change raises it by one.
   */
  readonly version: number;
  /**
   * The edits as applied, each with its old and new range and text.
   */
  readonly edits: IReadOnlyList<AppliedEdit>;
  /**
   * Creates a change. The list is stored as given, not copied.
   *
   * @param version The document's version after the change.
   * @param edits The applied edits.
   * @example
   * ```ts
   * import { type AppliedEdit, TextChange } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const change = new TextChange(1, new List<AppliedEdit>());
   * ```
   */
  constructor(version: number, edits: IReadOnlyList<AppliedEdit>);
  /**
   * Builds the edits that undo this change.
   *
   * @returns One edit per applied edit, in the same order, that replaces its
   * new range with its old text; ranges are in the document after the change.
   * @example
   * ```ts
   * import { TextDocument, TextEdit, TextRange } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("cat");
   * const change = document.apply(new List([new TextEdit(TextRange.of(0, 0, 0, 1), "b")]));
   * document.apply(change.inverse());
   * document.text(); // "cat"
   * ```
   */
  inverse(): IReadOnlyList<TextEdit>;
}

/**
 * A mutable text buffer addressed by zero-based lines and UTF-16 columns.
 *
 * @remarks
 * Lines end in LF, CR or CRLF, and each line keeps its own ending, so the
 * text reads back exactly as it was given. The last line has an empty ending,
 * and an empty text is one empty line. The lines are stored in chunks of at
 * most 512, so a large file is edited without copying it whole. The only
 * mutation is {@link TextDocument.apply}, which raises the version and tells
 * every listener.
 *
 * @example
 * ```ts
 * import { TextDocument, TextPosition } from "@noldova/code.editor";
 *
 * const document = TextDocument.fromText("one\r\ntwo");
 * document.lineCount; // 2
 * document.lineEnding(0); // "\r\n"
 * document.offsetAt(new TextPosition(1, 1)); // 6
 * ```
 */
export declare class TextDocument {
  private constructor();

  /**
   * Builds a document from text in one synchronous pass.
   *
   * @param text The whole content. LF, CR and CRLF all end a line; no ending
   * is normalized.
   * @returns A new document at version 0 whose {@link TextDocument.text}
   * equals `text`.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("a\nb\n");
   * document.lineCount; // 3: the last line is empty.
   * ```
   */
  static fromText(text: string): TextDocument;

  /**
   * Builds a document from text, yielding between slices so a large file
   * doesn't block the caller.
   *
   * @param text The whole content, read as {@link TextDocument.fromText} reads it.
   * @param pause Awaited after each slice of about 500,000 characters of
   * input and once more before the document is created. By default, a task
   * queued through a `MessageChannel`, in a page, a worker or Node, which
   * waits only for the tasks queued before it; a zero `setTimeout` waits at
   * least 4 ms in a browser once nested, longer than a slice takes. A caller
   * may give its own, such as the next animation frame.
   * @returns A promise of the same document {@link TextDocument.fromText}
   * builds. It rejects when a `pause` promise rejects.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   *
   * const document = await TextDocument.fromTextAsync(large);
   * ```
   */
  static fromTextAsync(text: string, pause?: () => Promise<void>): Promise<TextDocument>;

  /**
   * The number of successful {@link TextDocument.apply} calls so far,
   * starting at 0. Each change carries the version it produced.
   */
  get version(): number;

  /**
   * The number of lines, always at least 1: one more than the number of line
   * endings.
   */
  get lineCount(): number;

  /**
   * The whole text's length in UTF-16 code units, line endings included.
   */
  get length(): number;

  /**
   * Reads one line without its ending.
   *
   * @param line The zero-based line, an integer below {@link TextDocument.lineCount}.
   * @returns The line's text, empty for an empty line.
   * @throws {ArgumentOutOfRangeException} When `line` is negative, not an
   * integer, or not below the line count.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   *
   * TextDocument.fromText("a\nbc").lineText(1); // "bc"
   * ```
   */
  lineText(line: number): string;

  /**
   * Reads the ending that closes one line.
   *
   * @param line The zero-based line, an integer below {@link TextDocument.lineCount}.
   * @returns `"\n"`, `"\r"` or `"\r\n"`; the empty string for the last line.
   * @throws {ArgumentOutOfRangeException} When `line` is negative, not an
   * integer, or not below the line count.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("a\r\nb");
   * document.lineEnding(0); // "\r\n"
   * document.lineEnding(1); // ""
   * ```
   */
  lineEnding(line: number): string;

  /**
   * Joins every line and its ending into one string.
   *
   * @returns The whole current text, with the original line endings.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   *
   * TextDocument.fromText("a\r\nb").text(); // "a\r\nb"
   * ```
   */
  text(): string;

  /**
   * Reads the text a range covers.
   *
   * @param range The range to read; both ends must be inside the document.
   * @returns The covered text, with the endings of every line the range
   * crosses; empty for an empty range.
   * @throws {ArgumentOutOfRangeException} When an end's line is not in the
   * document or its column is past that line's length.
   * @example
   * ```ts
   * import { TextDocument, TextRange } from "@noldova/code.editor";
   *
   * TextDocument.fromText("one\ntwo").textIn(TextRange.of(0, 1, 1, 2)); // "ne\ntw"
   * ```
   */
  textIn(range: TextRange): string;

  /**
   * Converts a position to an offset from the start of the text.
   *
   * @param position A position inside the document; its column may equal the
   * line's length.
   * @returns The offset in UTF-16 code units, line endings counted.
   * @throws {ArgumentOutOfRangeException} When the line is not in the
   * document or the column is past that line's length.
   * @example
   * ```ts
   * import { TextDocument, TextPosition } from "@noldova/code.editor";
   *
   * TextDocument.fromText("ab\ncd").offsetAt(new TextPosition(1, 1)); // 4
   * ```
   */
  offsetAt(position: TextPosition): number;

  /**
   * Converts an offset from the start of the text to a position.
   *
   * @param offset An integer from 0 to {@link TextDocument.length}, in UTF-16
   * code units.
   * @returns The position at that offset. An offset inside a line ending maps
   * to the end of that line.
   * @throws {ArgumentOutOfRangeException} When `offset` is negative, not an
   * integer, or greater than the length.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("ab\r\ncd");
   * document.positionAt(5); // line 1, column 1
   * document.positionAt(3); // line 0, column 2: inside CRLF.
   * ```
   */
  positionAt(offset: number): TextPosition;

  /**
   * Applies a set of edits as one change.
   *
   * @remarks
   * Every edit's range refers to the text before the call; the edits are
   * sorted by start and applied from the last one back. Edits may touch but
   * not overlap. Every listener runs synchronously, in the order added, before
   * the call returns. A failed call changes nothing.
   *
   * @param edits One or more edits, in any order.
   * @returns The change, carrying the new version and the applied edits in
   * document order.
   * @throws {ArgumentException} When `edits` is empty.
   * @throws {ArgumentOutOfRangeException} When an edit's range ends outside
   * the document.
   * @throws {EditsOverlapException} When two edits' ranges overlap.
   * @example
   * ```ts
   * import { TextDocument, TextEdit, TextRange } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("one two");
   * document.apply(new List([new TextEdit(TextRange.of(0, 0, 0, 3), "1"), new TextEdit(TextRange.of(0, 4, 0, 7), "2")]));
   * document.text(); // "1 2"
   * document.version; // 1
   * ```
   */
  apply(edits: IReadOnlyList<TextEdit>): TextChange;

  /**
   * Subscribes to every change {@link TextDocument.apply} makes.
   *
   * @param listener Called synchronously with each change, after the text
   * has changed. Adding the same function twice keeps one subscription.
   * @returns A function that removes the listener; calling it again does nothing.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("");
   * const stop = document.onChange(change => console.log(change.version));
   * stop();
   * ```
   */
  onChange(listener: (change: TextChange) => void): () => void;

  /**
   * Reads the text between two offsets.
   *
   * @param start The start offset, from 0 to {@link TextDocument.length}.
   * @param end The end offset, from `start` to the length.
   * @returns The text between the two offsets' positions. An offset inside a
   * CRLF reads as the end of its line.
   * @throws {ArgumentOutOfRangeException} When either offset is negative, not
   * an integer, or greater than the length.
   * @throws {ArgumentException} When `end` maps to a position before `start`.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   *
   * TextDocument.fromText("ab\ncd").textBetween(1, 4); // "b\nc"
   * ```
   */
  textBetween(start: number, end: number): string;
}

/**
 * One replacement in a {@link TextDocument}: the text that takes a range's
 * place. An empty range inserts, and an empty text deletes. Immutable.
 *
 * @example
 * ```ts
 * import { TextEdit, TextRange } from "@noldova/code.editor";
 *
 * const insert = new TextEdit(TextRange.of(0, 0, 0, 0), "// ");
 * const remove = new TextEdit(TextRange.of(2, 0, 3, 0), "");
 * ```
 */
export declare class TextEdit {
  /**
   * The range replaced, in the document as it was before the edit.
   */
  readonly range: TextRange;

  /**
   * The replacing text; it may hold line endings, which it keeps as given.
   */
  readonly text: string;

  /**
   * Creates an edit. Nothing is checked until the edit is applied.
   *
   * @param range The range to replace.
   * @param text The text to put in its place; empty to delete.
   * @example
   * ```ts
   * import { TextEdit, TextRange } from "@noldova/code.editor";
   *
   * const edit = new TextEdit(TextRange.of(0, 2, 0, 5), "new");
   * ```
   */
  constructor(range: TextRange, text: string);
}

/**
 * A zero-based line and UTF-16 column in a text. Immutable.
 *
 * @remarks
 * A position checks only that both numbers are non-negative integers; whether
 * it lies inside a given document is checked by the document.
 *
 * @example
 * ```ts
 * import { TextPosition } from "@noldova/code.editor";
 *
 * const caret = new TextPosition(2, 4);
 * caret.compareTo(new TextPosition(3, 0)) < 0; // true
 * ```
 */
export declare class TextPosition {
  /**
   * The zero-based line.
   */
  readonly line: number;

  /**
   * The zero-based column, in UTF-16 code units from the line's start.
   */
  readonly column: number;

  /**
   * Creates a position.
   *
   * @param line The zero-based line, a non-negative integer.
   * @param column The zero-based column in UTF-16 code units, a non-negative integer.
   * @throws {ArgumentOutOfRangeException} When either value is negative or
   * not an integer.
   * @example
   * ```ts
   * import { TextPosition } from "@noldova/code.editor";
   *
   * const start = new TextPosition(0, 0);
   * ```
   */
  constructor(line: number, column: number);

  /**
   * Orders two positions, by line and then by column.
   *
   * @param other The position to compare with.
   * @returns A negative number when this position comes first, zero when both
   * are equal, and a positive number when this one comes after; usable as a
   * sort comparer.
   * @example
   * ```ts
   * import { TextPosition } from "@noldova/code.editor";
   *
   * new TextPosition(1, 9).compareTo(new TextPosition(2, 0)); // negative
   * ```
   */
  compareTo(other: TextPosition): number;

  /**
   * Compares two positions by value.
   *
   * @param other The position to compare with.
   * @returns True when both line and column are equal.
   * @example
   * ```ts
   * import { TextPosition } from "@noldova/code.editor";
   *
   * new TextPosition(1, 2).equals(new TextPosition(1, 2)); // true
   * ```
   */
  equals(other: TextPosition): boolean;

  /**
   * Checks that a value is a count: a non-negative integer.
   *
   * @param value The value to check.
   * @param parameterName The parameter name the exception reports.
   * @throws {ArgumentOutOfRangeException} When `value` is negative or not an
   * integer, `NaN` and infinities included.
   * @example
   * ```ts
   * import { TextPosition } from "@noldova/code.editor";
   *
   * TextPosition.requireCount(3, "line"); // passes
   * TextPosition.requireCount(-1, "line"); // throws
   * ```
   */
  static requireCount(value: number, parameterName: string): void;
}

/**
 * The span between two positions, start inclusive and end exclusive, with the
 * start never after the end. Immutable.
 *
 * @example
 * ```ts
 * import { TextRange } from "@noldova/code.editor";
 *
 * const firstWord = TextRange.of(0, 0, 0, 5);
 * firstWord.isEmpty; // false
 * ```
 */
export declare class TextRange {
  /**
   * The first position covered.
   */
  readonly start: TextPosition;

  /**
   * The position just after the last one covered; equal to `start` for an
   * empty range.
   */
  readonly end: TextPosition;

  /**
   * Creates a range.
   *
   * @param start The start position.
   * @param end The end position, equal to or after `start`.
   * @throws {ArgumentException} When `end` comes before `start`.
   * @example
   * ```ts
   * import { TextPosition, TextRange } from "@noldova/code.editor";
   *
   * const line = new TextRange(new TextPosition(3, 0), new TextPosition(4, 0));
   * ```
   */
  constructor(start: TextPosition, end: TextPosition);

  /**
   * True when the range covers nothing: its start equals its end.
   */
  get isEmpty(): boolean;

  /**
   * Compares two ranges by value.
   *
   * @param other The range to compare with.
   * @returns True when both starts and both ends are equal.
   * @example
   * ```ts
   * import { TextRange } from "@noldova/code.editor";
   *
   * TextRange.of(0, 0, 1, 2).equals(TextRange.of(0, 0, 1, 2)); // true
   * ```
   */
  equals(other: TextRange): boolean;

  /**
   * Creates a range from four numbers.
   *
   * @param startLine The start's zero-based line, a non-negative integer.
   * @param startColumn The start's zero-based UTF-16 column, a non-negative integer.
   * @param endLine The end's zero-based line, a non-negative integer.
   * @param endColumn The end's zero-based UTF-16 column, a non-negative integer.
   * @returns A new range from the start to the end.
   * @throws {ArgumentOutOfRangeException} When any number is negative or not
   * an integer.
   * @throws {ArgumentException} When the end comes before the start.
   * @example
   * ```ts
   * import { TextRange } from "@noldova/code.editor";
   *
   * const range = TextRange.of(1, 0, 1, 4);
   * ```
   */
  static of(startLine: number, startColumn: number, endLine: number, endColumn: number): TextRange;
}

/**
 * A selection or caret: the anchor where it started and the head that moves.
 * Immutable.
 *
 * @remarks
 * The head may come before the anchor, for a selection made backward. When
 * both are equal, the selection is a caret.
 *
 * @example
 * ```ts
 * import { TextPosition, TextSelection } from "@noldova/code.editor";
 *
 * const caret = new TextSelection(new TextPosition(0, 3));
 * const backward = new TextSelection(new TextPosition(0, 5), new TextPosition(0, 1));
 * ```
 */
export declare class TextSelection {
  /**
   * The fixed end, where the selection started.
   */
  readonly anchor: TextPosition;

  /**
   * The moving end, where the caret is drawn.
   */
  readonly head: TextPosition;

  /**
   * Creates a selection.
   *
   * @param anchor The fixed end.
   * @param head The moving end; defaults to `anchor`, which makes a caret.
   * @example
   * ```ts
   * import { TextPosition, TextSelection } from "@noldova/code.editor";
   *
   * const word = new TextSelection(new TextPosition(0, 0), new TextPosition(0, 4));
   * ```
   */
  constructor(anchor: TextPosition, head?: TextPosition);

  /**
   * Compares two selections by value, direction included.
   *
   * @param other The selection to compare with.
   * @returns True when both anchors and both heads are equal; a selection and
   * its reverse are not equal.
   * @example
   * ```ts
   * import { TextPosition, TextSelection } from "@noldova/code.editor";
   *
   * const caret = new TextSelection(new TextPosition(1, 1));
   * caret.equals(new TextSelection(new TextPosition(1, 1))); // true
   * ```
   */
  equals(other: TextSelection): boolean;

  /**
   * Compares two lists of selections, element by element.
   *
   * @param first The first list.
   * @param second The second list.
   * @returns True when both lists have the same length and equal selections
   * in the same order.
   * @example
   * ```ts
   * import { TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const caret = new TextSelection(new TextPosition(0, 0));
   * TextSelection.allEqual(new List([caret]), new List([caret])); // true
   * ```
   */
  static allEqual(first: IReadOnlyList<TextSelection>, second: IReadOnlyList<TextSelection>): boolean;
}

/**
 * A token modifier definition, such as `deprecated`.
 */
export declare class TokenModifierDefinition implements ITokenModifierDefinition {
  /**
   * The modifier's unique id.
   */
  readonly id: string;
  /**
   * What the modifier means, for a person, if given.
   */
  readonly description: string | undefined;
  /**
   * Creates a token modifier definition.
   *
   * @param id The modifier's unique id.
   * @param description What the modifier means, for a person.
   * @example
   * ```ts
   * import { TokenModifierDefinition } from "@noldova/code.editor";
   *
   * const modifier = new TokenModifierDefinition("async", "An asynchronous symbol.");
   * ```
   */
  constructor(id: string, description?: string);
}

/**
 * A token type definition: an open dotted name with an optional parent it
 * falls back to.
 */
export declare class TokenTypeDefinition implements ITokenTypeDefinition {
  /**
   * The type's unique id, such as `keyword.control`.
   */
  readonly id: string;
  /**
   * What the type means, for a person, if given.
   */
  readonly description: string | undefined;
  /**
   * The type it falls back to for styles, if given; otherwise the type its id
   * has before its last dot, if any.
   */
  readonly parent: string | undefined;
  /**
   * Creates a token type definition.
   *
   * @param id The type's unique id.
   * @param description What the type means, for a person.
   * @param parent The type it falls back to for styles.
   * @example
   * ```ts
   * import { TokenTypeDefinition } from "@noldova/code.editor";
   *
   * const regex = new TokenTypeDefinition("string.regexp", "A regular expression.", "string");
   * ```
   */
  constructor(id: string, description?: string, parent?: string);
}

/**
 * The token types and modifiers the core gives every highlighter.
 *
 * @remarks
 * The types are `comment`, `keyword`, `keyword.control`, `string`,
 * `string.regexp`, `number`, `type`, `function`, `variable` and `meta`; the
 * modifiers are `deprecated`, `readonly` and `static`.
 */
export declare class BuiltInTokenTypes {
  /**
   * `comment`: a comment.
   */
  static readonly comment: ITokenTypeDefinition;
  /**
   * `keyword`: a keyword, a storage word such as const, or a language constant such as true.
   */
  static readonly keyword: ITokenTypeDefinition;
  /**
   * The built-in token types.
   */
  static readonly types: IReadOnlyList<ITokenTypeDefinition>;
  /**
   * The built-in token modifiers.
   */
  static readonly modifiers: IReadOnlyList<ITokenModifierDefinition>;
  /**
   * Registers the built-in types and modifiers.
   *
   * @param registry The registry to register them with.
   * @returns What removes them all again.
   * @throws {@link RegistrationExistsException} When the registry already
   * holds one of their ids.
   * @example
   * ```ts
   * import { BuiltInTokenTypes, TokenTypeRegistry } from "@noldova/code.editor";
   *
   * const registry = new TokenTypeRegistry();
   * using registered = BuiltInTokenTypes.register(registry);
   * registry.resolve("keyword.control.flow"); // "keyword.control"
   * ```
   */
  static register(registry: TokenTypeRegistry): Disposable;
}

/**
 * The editing state of one view of a document: its selections and the
 * commands, typing and clipboard actions that change them and the text.
 *
 * @remarks
 * Selections are clamped into the document, sorted by start, and overlapping
 * ones are merged. Edits go through {@link EditorSession.history}, where
 * consecutive typing or deleting within the history's
 * {@link UndoHistory.groupMilliseconds} may group into one undo step. A session starts with
 * one caret at the document's start.
 *
 * @example
 * ```ts
 * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
 *
 * const document = TextDocument.fromText("");
 * const session = new EditorSession(document, new UndoHistory(document));
 * session.type("hello", Date.now());
 * document.text(); // "hello"
 * ```
 */
export declare class EditorSession {
  /**
   * The document this session edits.
   */
  readonly document: TextDocument;

  /**
   * The undo history every edit of this session goes into.
   */
  readonly history: UndoHistory;

  /**
   * When true, every edit, undo and redo is refused and moves still work.
   * False by default; it may be changed at any time.
   */
  readOnly: boolean;

  /**
   * Creates a session with one caret at the document's start.
   *
   * @param document The document to edit.
   * @param history The undo history to record edits in; it should be the
   * history of the same document.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("text");
   * const session = new EditorSession(document, new UndoHistory(document));
   * ```
   */
  constructor(document: TextDocument, history: UndoHistory);

  /**
   * The current selections, sorted by start, never overlapping. A new list
   * replaces it on every change.
   */
  get selections(): IReadOnlyList<TextSelection>;

  /**
   * The last of {@link EditorSession.selections}, the one furthest down the
   * document, which a view keeps in sight.
   *
   * @throws {ArgumentOutOfRangeException} When {@link EditorSession.select} was
   * given an empty list, leaving no selection.
   */
  get primary(): TextSelection;

  /**
   * Replaces the selections.
   *
   * @param selections The new selections, in any order. Each end is clamped
   * into the document, and overlapping selections are merged.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, TextPosition, TextSelection, UndoHistory } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("one two");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.select(new List([new TextSelection(new TextPosition(0, 0), new TextPosition(0, 3))]));
   * session.selectedText(); // "one"
   * ```
   */
  select(selections: IReadOnlyList<TextSelection>): void;

  /**
   * Places a caret as a pointer press does, and ends the current undo group.
   *
   * @param position Where to place it; clamped into the document.
   * @param extend True to move the primary selection's head there and keep
   * its anchor, as Shift with a click does.
   * @param add True to add a caret and keep the others; it wins over `extend`.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, TextPosition, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("a\nb");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.placeCaret(new TextPosition(1, 1), false, true);
   * session.selections.count(); // 2
   * ```
   */
  placeCaret(position: TextPosition, extend: boolean, add: boolean): void;

  /**
   * Moves every caret one character left, or one word with `word`.
   *
   * @param extend True to keep each anchor and extend the selection.
   * @param word True to move to the start of the word before the caret.
   * @returns True.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("one two");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.moveDocumentEnd(false);
   * session.moveLeft(true, true); // selects "two"
   * ```
   */
  moveLeft(extend: boolean, word: boolean): boolean;

  /**
   * Moves every caret one character right, or one word with `word`.
   *
   * @param extend True to keep each anchor and extend the selection.
   * @param word True to move to the end of the word after the caret.
   * @returns True.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("one two");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.moveRight(false, true); // after "one"
   * ```
   */
  moveRight(extend: boolean, word: boolean): boolean;

  /**
   * Moves every caret up or down by lines, keeping the column each caret
   * aimed for across consecutive vertical moves.
   *
   * @param lines How many lines to move; negative moves up.
   * @param extend True to keep each anchor and extend the selection.
   * @returns True.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("a\nb\nc");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.moveLines(2, false);
   * session.primary.head.line; // 2
   * ```
   */
  moveLines(lines: number, extend: boolean): boolean;

  /**
   * Moves every caret to its line's start.
   *
   * @param extend True to keep each anchor and extend the selection.
   * @returns True.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("text");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.moveLineStart(false);
   * ```
   */
  moveLineStart(extend: boolean): boolean;

  /**
   * Moves every caret to its line's end.
   *
   * @param extend True to keep each anchor and extend the selection.
   * @returns True.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("text");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.moveLineEnd(true); // selects "text"
   * ```
   */
  moveLineEnd(extend: boolean): boolean;

  /**
   * Moves every caret to column zero of its line, before any indentation.
   *
   * @param extend True to keep each anchor and extend the selection.
   * @returns True.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("  text");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.moveLineEnd(false);
   * session.moveLineFirstColumn(true); // selects "  text"
   * ```
   */
  moveLineFirstColumn(extend: boolean): boolean;

  /**
   * Moves every caret to the document's start.
   *
   * @param extend True to keep each anchor and extend the selection.
   * @returns True.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("a\nb");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.moveDocumentStart(false);
   * ```
   */
  moveDocumentStart(extend: boolean): boolean;

  /**
   * Moves every caret to the document's end.
   *
   * @param extend True to keep each anchor and extend the selection.
   * @returns True.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("a\nb");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.moveDocumentEnd(false);
   * ```
   */
  moveDocumentEnd(extend: boolean): boolean;

  /**
   * Selects the whole document with one selection.
   *
   * @returns True.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("a\nb");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.selectAll();
   * ```
   */
  selectAll(): boolean;

  /**
   * Leaves one caret at the primary selection's head.
   *
   * @returns False when there is already a single caret; otherwise true.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("a");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.collapse(); // false
   * ```
   */
  collapse(): boolean;

  /**
   * Deletes what each selection selects, or the character or word before
   * each caret.
   *
   * @param word True to delete to the start of the word before the caret.
   * @param time The edit's time in milliseconds.
   * @returns False when the session is read-only; otherwise true.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("ab");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.moveDocumentEnd(false);
   * session.deleteBackward(false, 0); // "a"
   * ```
   */
  deleteBackward(word: boolean, time: number): boolean;

  /**
   * Deletes what each selection selects, or the character or word after
   * each caret.
   *
   * @param word True to delete to the end of the word after the caret.
   * @param time The edit's time in milliseconds.
   * @returns False when the session is read-only; otherwise true.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("ab");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.deleteForward(false, 0); // "b"
   * ```
   */
  deleteForward(word: boolean, time: number): boolean;

  /**
   * Deletes what each selection selects, or the text from each caret back to
   * its line's start; a caret already at its line's start joins the line to
   * the one before.
   *
   * @param time The edit's time in milliseconds.
   * @returns False when the session is read-only; otherwise true.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("one two");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.moveLineEnd(false);
   * session.deleteToLineStart(0); // ""
   * ```
   */
  deleteToLineStart(time: number): boolean;

  /**
   * Deletes what each selection selects, or the text from each caret to its
   * line's end; a caret already at its line's end joins the next line to it.
   *
   * @param time The edit's time in milliseconds.
   * @returns False when the session is read-only; otherwise true.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("one two");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.deleteToLineEnd(0); // ""
   * ```
   */
  deleteToLineEnd(time: number): boolean;

  /**
   * Breaks the line at every selection, keeping each line's indent.
   *
   * @param time The edit's time in milliseconds.
   * @returns False when the session is read-only; otherwise true.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("ab");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.newLine(0);
   * ```
   */
  newLine(time: number): boolean;

  /**
   * Replaces each selection with the unit when every selection is within
   * one line; otherwise indents every line the selections touch.
   *
   * @param unit The text one indent level inserts, such as two spaces or a
   * tab; {@link CoreCommands.indentUnit} reads it from the settings.
   * @param time The edit's time in milliseconds.
   * @returns False when the session is read-only; otherwise true.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("x");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.indent("\t", 0); // "\tx"
   * ```
   */
  indent(unit: string, time: number): boolean;

  /**
   * Removes up to one indent unit from the start of every line the
   * selections touch.
   *
   * @param unit The text one indent level is.
   * @param time The edit's time in milliseconds.
   * @returns False when the session is read-only; otherwise true.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("  x");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.outdent("  ", 0); // "x"
   * ```
   */
  outdent(unit: string, time: number): boolean;

  /**
   * Undoes the last step and restores the selections from before it.
   *
   * @returns True, also when there is nothing to undo or the session is
   * read-only, which changes nothing.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.type("a", 0);
   * session.undo();
   * ```
   */
  undo(): boolean;

  /**
   * Redoes the last undone step and restores the selections from after it.
   *
   * @returns True, also when there is nothing to redo or the session is
   * read-only, which changes nothing.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.type("a", 0);
   * session.undo();
   * session.redo();
   * ```
   */
  redo(): boolean;

  /**
   * Types text at every selection, replacing what each one selects.
   *
   * @param text The typed text.
   * @param time The edit's time in milliseconds; typing within the history's
   * group time of the last typing groups into one undo step.
   * @returns False when the session is read-only; otherwise true.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.type("a", 0);
   * session.type("b", 100); // undone together with "a"
   * ```
   */
  type(text: string, time: number): boolean;

  /**
   * Pastes text at the selections, as its own undo step.
   *
   * @param text The pasted text. When there are several selections and the
   * text has as many lines, each selection gets one line; otherwise each gets
   * the whole text.
   * @param time The edit's time in milliseconds.
   * @returns False when the session is read-only; otherwise true.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.paste("pasted", Date.now());
   * ```
   */
  paste(text: string, time: number): boolean;

  /**
   * Applies edits as one undo step, such as a formatter's or a search's
   * replacements, and selects the replacing texts.
   *
   * @param edits Edits whose ranges are in the current document and don't overlap.
   * @param time The edit's time in milliseconds.
   * @returns False when `edits` is empty or the session is read-only; otherwise true.
   * @throws {ArgumentOutOfRangeException} When an edit's range ends outside
   * the document.
   * @throws {EditsOverlapException} When two edits' ranges overlap.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, TextEdit, TextRange, UndoHistory } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("a a");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.replace(new List([new TextEdit(TextRange.of(0, 0, 0, 1), "b"), new TextEdit(TextRange.of(0, 2, 0, 3), "b")]), Date.now());
   * ```
   */
  replace(edits: IReadOnlyList<TextEdit>, time: number): boolean;

  /**
   * Inserts dropped text, such as from another application, and selects it.
   *
   * @param position Where it was dropped; clamped into the document. The
   * current selections are left in the text.
   * @param text The dropped text.
   * @param time The edit's time in milliseconds.
   * @returns False when the session is read-only; otherwise true.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, TextPosition, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("ac");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.drop(new TextPosition(0, 1), "b", Date.now());
   * document.text(); // "abc"
   * ```
   */
  drop(position: TextPosition, text: string, time: number): boolean;

  /**
   * Moves a range's text to another position, as dragging a selection does,
   * and selects it there.
   *
   * @param range The text to move; it must be inside the document.
   * @param position Where to put it; clamped into the document. A position
   * inside the range, its ends included, moves nothing.
   * @param time The edit's time in milliseconds.
   * @returns False when the session is read-only; otherwise true, also when
   * nothing moved.
   * @throws {ArgumentOutOfRangeException} When `range` ends outside the document.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, TextPosition, TextRange, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("ab cd");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.moveText(TextRange.of(0, 0, 0, 2), new TextPosition(0, 5), Date.now());
   * document.text(); // " cdab"
   * ```
   */
  moveText(range: TextRange, position: TextPosition, time: number): boolean;

  /**
   * Reads the selected text, as copying does.
   *
   * @returns The text of each non-empty selection in document order, joined
   * by the document's first line ending, or a line feed when it has none;
   * empty when every selection is a caret.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("text");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.selectedText(); // "": one caret.
   * ```
   */
  selectedText(): string;

  /**
   * Reads the selected text and deletes it, as cutting does.
   *
   * @param time The edit's time in milliseconds.
   * @returns The text {@link EditorSession.selectedText} returns. A read-only
   * session returns it without deleting it.
   * @example
   * ```ts
   * import { EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("text");
   * const session = new EditorSession(document, new UndoHistory(document));
   * session.selectAll();
   * session.cut(Date.now()); // "text", and the document is empty.
   * ```
   */
  cut(time: number): string;
}

/**
 * The highlighters a set knows, with its parent set's behind them.
 *
 * @remarks
 * A language goes to the highlighter {@link HighlighterRegistry.assign} pins
 * it to, else to the last-registered highlighter that supports it, this set's
 * before its parent's; so a package that registers later, or an assignment,
 * takes a language over. Each language's tokenizer is made once per set, on
 * first use, and made again after one of this set's registrations or
 * assignments changes.
 */
export declare class HighlighterRegistry {
  /**
   * Creates a set's highlighter registry.
   *
   * @param registries The set whose tokenizers it makes.
   * @param parent The parent set's registry, or `null` for an app's own.
   */
  constructor(registries: EditorRegistries, parent?: HighlighterRegistry | null);
  /**
   * Registers a highlighter.
   *
   * @param highlighter The highlighter.
   * @returns What removes it again.
   * @throws {@link RegistrationExistsException} When this set already holds
   * its id.
   */
  register(highlighter: IHighlighter): Disposable;
  /**
   * Pins a language to a highlighter.
   *
   * @param languageId The language's id.
   * @param highlighterId The highlighter's id; when no highlighter has it, the
   * language goes to the one that would take it unpinned.
   * @returns What removes the pin again.
   * @throws {@link RegistrationExistsException} When this set already pins
   * the language.
   */
  assign(languageId: string, highlighterId: string): Disposable;
  /**
   * The highlighter that colors a language.
   *
   * @param language The language.
   * @returns The highlighter, or `null` when none supports the language.
   */
  find(language: ILanguageDefinition): IHighlighter | null;
  /**
   * The language's tokenizer, made on first use and kept for the set.
   *
   * @param language The language.
   * @returns The tokenizer, or `null` when no highlighter supports the
   * language; a failed load is made again on the next call.
   * @example
   * ```ts
   * import type { EditorRegistries, ILineTokenizer } from "@noldova/code.editor";
   *
   * declare const registries: EditorRegistries;
   * const language = registries.languages.forFile("src/main.ts");
   * const tokenizer: ILineTokenizer | null = language === null ? null : await registries.highlighters.tokenizerAsync(language);
   * ```
   */
  tokenizerAsync(language: ILanguageDefinition): Promise<ILineTokenizer | null>;
}

/**
 * The languages a set knows, with its parent set's behind them.
 *
 * @remarks
 * A file's language is found by its whole name, then a file name pattern,
 * then its longest extension, then its first line, all in any case; at each
 * step this set's languages come before its parent's, the newest first.
 */
export declare class LanguageRegistry {
  /**
   * Creates a set's language registry.
   *
   * @param parent The parent set's registry, or `null` for an app's own.
   */
  constructor(parent?: LanguageRegistry | null);
  /**
   * Registers a language.
   *
   * @param language The language.
   * @returns What removes it again.
   * @throws {@link RegistrationExistsException} When this set already holds
   * its id; a child set may shadow its parent's.
   */
  register(language: ILanguageDefinition): Disposable;
  /**
   * The language with an id.
   *
   * @param id The id.
   * @returns The language, or `null`.
   */
  find(id: string): ILanguageDefinition | null;
  /**
   * The language with a name: its id or one of its aliases, trimmed and in
   * any case.
   *
   * @param name The name.
   * @returns The language, or `null`.
   * @example
   * ```ts
   * import type { LanguageRegistry } from "@noldova/code.editor";
   *
   * declare const languages: LanguageRegistry;
   * languages.named(" TS ")?.id; // "typescript", with the TextMate package's languages
   * ```
   */
  named(name: string): ILanguageDefinition | null;
  /**
   * The language of a file.
   *
   * @param path The file's path or name, with either kind of slash.
   * @param firstLine The file's first line, when its name says nothing.
   * @returns The language, or `null` when none matches.
   * @example
   * ```ts
   * import type { LanguageRegistry } from "@noldova/code.editor";
   *
   * declare const languages: LanguageRegistry;
   * languages.forFile("C:\\app\\Dockerfile.dev")?.id; // "dockerfile"
   * languages.forFile("bin/run", "#!/usr/bin/env node")?.id; // "javascript"
   * ```
   */
  forFile(path: string, firstLine?: string | null): ILanguageDefinition | null;
  /**
   * Every language: this set's, the newest first, then its parent's that this
   * set doesn't shadow.
   */
  all(): IReadOnlyList<ILanguageDefinition>;
}

/**
 * Maps positions in a document from before a set of edits to after them.
 *
 * @remarks
 * The edits are read in the old document's coordinates, must not overlap, and
 * may be given in any order; the mapper sorts them by start. It neither
 * applies the edits nor reads a document.
 *
 * @example
 * ```ts
 * import { PositionMapper, TextEdit, TextPosition, TextRange } from "@noldova/code.editor";
 * import { List } from "@noldova/context.collections";
 *
 * const mapper = new PositionMapper(new List([new TextEdit(TextRange.of(0, 0, 0, 0), "ab")]));
 * mapper.map(new TextPosition(0, 3)); // 0:5
 * ```
 */
export declare class PositionMapper {
  /**
   * Creates a mapper for one set of edits.
   *
   * @param edits The non-overlapping edits, with ranges in the old document's
   * coordinates. The list is copied in start order and not changed.
   * @example
   * ```ts
   * import { PositionMapper, TextEdit, TextRange } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const mapper = new PositionMapper(new List([new TextEdit(TextRange.of(0, 1, 0, 3), "")]));
   * ```
   */
  constructor(edits: IReadOnlyList<TextEdit>);

  /**
   * Finds where one old position lands after the edits.
   *
   * @param position A position in the old document.
   * @returns The position in the new document. A position at the start of a
   * replaced range or inside it maps to the end of that edit's inserted text;
   * a position at an insertion point maps past the inserted text; any other
   * position shifts by the lines and, on the same line, the columns that
   * earlier edits added or removed.
   * @example
   * ```ts
   * import { PositionMapper, TextEdit, TextPosition, TextRange } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const mapper = new PositionMapper(new List([new TextEdit(TextRange.of(0, 1, 0, 3), "\n")]));
   * mapper.map(new TextPosition(0, 2)); // 1:0, inside the replaced range.
   * mapper.map(new TextPosition(0, 5)); // 1:2
   * ```
   */
  map(position: TextPosition): TextPosition;
}

/**
 * Computes cursor and selection moves over a {@link TextDocument}, such as
 * the arrow keys, Home, End and Select All perform.
 *
 * @remarks
 * Every method is pure: it returns a new {@link TextSelection} or
 * {@link TextPosition} and changes nothing. Character moves never stop between
 * the two halves of a UTF-16 surrogate pair. Word moves skip whitespace, then
 * one run of either word characters (Unicode letters, digits and `_`) or
 * other characters.
 *
 * @example
 * ```ts
 * import { SelectionMoves, TextDocument, TextPosition, TextSelection } from "@noldova/code.editor";
 *
 * const document = TextDocument.fromText("let value = 1;");
 * const cursor = new TextSelection(new TextPosition(0, 0));
 * SelectionMoves.right(document, cursor, false, true).head; // 0:3
 * ```
 */
export declare class SelectionMoves {
  /**
   * Finds the earlier end of a selection.
   *
   * @param selection The selection, in either direction.
   * @returns The anchor or the head, whichever comes first in the document.
   * @example
   * ```ts
   * import { SelectionMoves, TextPosition, TextSelection } from "@noldova/code.editor";
   *
   * SelectionMoves.startOf(new TextSelection(new TextPosition(2, 0), new TextPosition(1, 4))); // 1:4
   * ```
   */
  static startOf(selection: TextSelection): TextPosition;

  /**
   * Finds the later end of a selection.
   *
   * @param selection The selection, in either direction.
   * @returns The anchor or the head, whichever comes last in the document.
   * @example
   * ```ts
   * import { SelectionMoves, TextPosition, TextSelection } from "@noldova/code.editor";
   *
   * SelectionMoves.endOf(new TextSelection(new TextPosition(2, 0), new TextPosition(1, 4))); // 2:0
   * ```
   */
  static endOf(selection: TextSelection): TextPosition;

  /**
   * Moves the head one character or one word to the left.
   *
   * @param document The document the selection is in.
   * @param selection The selection to move.
   * @param extend True to keep the anchor and extend the selection; false to
   * collapse it to the new head.
   * @param word True to move by word rather than by character.
   * @returns The moved selection. A non-empty selection moved by character
   * without `extend` collapses to its start instead. At a line's start the
   * head goes to the end of the previous line, and at the document's start it
   * stays.
   * @example
   * ```ts
   * import { SelectionMoves, TextDocument, TextPosition, TextSelection } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("one two");
   * SelectionMoves.left(document, new TextSelection(new TextPosition(0, 7)), false, true).head; // 0:4
   * ```
   */
  static left(document: TextDocument, selection: TextSelection, extend: boolean, word: boolean): TextSelection;

  /**
   * Moves the head one character or one word to the right.
   *
   * @param document The document the selection is in.
   * @param selection The selection to move.
   * @param extend True to keep the anchor and extend the selection; false to
   * collapse it to the new head.
   * @param word True to move by word rather than by character.
   * @returns The moved selection. A non-empty selection moved by character
   * without `extend` collapses to its end instead. At a line's end the head
   * goes to the start of the next line, and at the document's end it stays.
   * @example
   * ```ts
   * import { SelectionMoves, TextDocument, TextPosition, TextSelection } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("one two");
   * SelectionMoves.right(document, new TextSelection(new TextPosition(0, 0)), true, false).head; // 0:1
   * ```
   */
  static right(document: TextDocument, selection: TextSelection, extend: boolean, word: boolean): TextSelection;

  /**
   * Moves the head up or down by a number of lines, toward a goal column.
   *
   * @param document The document the selection is in.
   * @param selection The selection to move.
   * @param lines The lines to move: negative moves up, positive moves down.
   * The target line is clamped to the document.
   * @param goalColumn The column to aim for in UTF-16 code units, usually the
   * column the vertical moves started from; it is clamped to the target
   * line's length as {@link SelectionMoves.columnIn} clamps it.
   * @param extend True to keep the anchor and extend the selection; false to
   * collapse it to the new head.
   * @returns The moved selection. A move up from the first line goes to the
   * document's start, and a move down from the last line goes to that line's
   * end.
   * @example
   * ```ts
   * import { SelectionMoves, TextDocument, TextPosition, TextSelection } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("long line\nab");
   * SelectionMoves.vertical(document, new TextSelection(new TextPosition(0, 6)), 1, 6, false).head; // 1:2
   * ```
   */
  static vertical(document: TextDocument, selection: TextSelection, lines: number, goalColumn: number, extend: boolean): TextSelection;

  /**
   * Moves the head to the start of its line, as Home does.
   *
   * @param document The document the selection is in.
   * @param selection The selection to move.
   * @param extend True to keep the anchor and extend the selection; false to
   * collapse it to the new head.
   * @returns The moved selection: the head goes to the line's first
   * non-whitespace character, or to column zero when it is already there.
   * @example
   * ```ts
   * import { SelectionMoves, TextDocument, TextPosition, TextSelection } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("  value");
   * SelectionMoves.lineStart(document, new TextSelection(new TextPosition(0, 5)), false).head; // 0:2
   * SelectionMoves.lineStart(document, new TextSelection(new TextPosition(0, 2)), false).head; // 0:0
   * ```
   */
  static lineStart(document: TextDocument, selection: TextSelection, extend: boolean): TextSelection;

  /**
   * Moves the head to the end of its line, as End does.
   *
   * @param document The document the selection is in.
   * @param selection The selection to move.
   * @param extend True to keep the anchor and extend the selection; false to
   * collapse it to the new head.
   * @returns The moved selection, with the head after the line's last
   * character.
   * @example
   * ```ts
   * import { SelectionMoves, TextDocument, TextPosition, TextSelection } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("value");
   * SelectionMoves.lineEnd(document, new TextSelection(new TextPosition(0, 1)), false).head; // 0:5
   * ```
   */
  static lineEnd(document: TextDocument, selection: TextSelection, extend: boolean): TextSelection;

  /**
   * Moves the head to column zero of its line, as Control+A does on a Mac.
   *
   * @param selection The selection to move.
   * @param extend True to keep the anchor and extend the selection; false to
   * collapse it to the new head.
   * @returns The moved selection, with the head at column zero of its line,
   * before any indentation.
   * @example
   * ```ts
   * import { SelectionMoves, TextPosition, TextSelection } from "@noldova/code.editor";
   *
   * SelectionMoves.lineFirstColumn(new TextSelection(new TextPosition(2, 4)), false).head; // 2:0
   * ```
   */
  static lineFirstColumn(selection: TextSelection, extend: boolean): TextSelection;

  /**
   * Moves the head to the document's start.
   *
   * @param selection The selection to move.
   * @param extend True to keep the anchor and extend the selection; false to
   * collapse it to the new head.
   * @returns The moved selection, with the head at line zero, column zero.
   * @example
   * ```ts
   * import { SelectionMoves, TextPosition, TextSelection } from "@noldova/code.editor";
   *
   * SelectionMoves.documentStart(new TextSelection(new TextPosition(3, 2)), true); // anchor 3:2, head 0:0
   * ```
   */
  static documentStart(selection: TextSelection, extend: boolean): TextSelection;

  /**
   * Moves the head to the document's end.
   *
   * @param document The document the selection is in.
   * @param selection The selection to move.
   * @param extend True to keep the anchor and extend the selection; false to
   * collapse it to the new head.
   * @returns The moved selection, with the head after the last line's last
   * character.
   * @example
   * ```ts
   * import { SelectionMoves, TextDocument, TextPosition, TextSelection } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("a\nbc");
   * SelectionMoves.documentEnd(document, new TextSelection(new TextPosition(0, 0)), false).head; // 1:2
   * ```
   */
  static documentEnd(document: TextDocument, selection: TextSelection, extend: boolean): TextSelection;

  /**
   * Selects the whole document.
   *
   * @param document The document to select.
   * @returns A selection anchored at the document's start with its head at
   * the document's end.
   * @example
   * ```ts
   * import { SelectionMoves, TextDocument } from "@noldova/code.editor";
   *
   * SelectionMoves.all(TextDocument.fromText("a\nbc")); // anchor 0:0, head 1:2
   * ```
   */
  static all(document: TextDocument): TextSelection;

  /**
   * Finds the nearest valid position at a column of a line.
   *
   * @param document The document to read.
   * @param line The zero-based line; it must exist in the document.
   * @param column The wanted column in UTF-16 code units; a column past the
   * line's end is clamped to it.
   * @returns The position at the clamped column, moved one code unit left
   * when it would fall between the halves of a surrogate pair.
   * @throws {ArgumentOutOfRangeException} When the line is outside the
   * document.
   * @example
   * ```ts
   * import { SelectionMoves, TextDocument } from "@noldova/code.editor";
   *
   * SelectionMoves.columnIn(TextDocument.fromText("ab"), 0, 9); // 0:2
   * ```
   */
  static columnIn(document: TextDocument, line: number, column: number): TextPosition;

  /**
   * Merges selections that overlap into one, as multiple cursors need.
   *
   * @param selections The selections, in any order; the list is not changed.
   * @returns The selections sorted by start. Overlapping selections become one
   * that spans both and keeps the first one's direction; selections that only
   * touch merge when either of them is empty.
   * @example
   * ```ts
   * import { SelectionMoves, TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * SelectionMoves.merge(new List([
   *   new TextSelection(new TextPosition(0, 2), new TextPosition(0, 6)),
   *   new TextSelection(new TextPosition(0, 0), new TextPosition(0, 4))
   * ])); // one selection, 0:0 to 0:6
   * ```
   */
  static merge(selections: IReadOnlyList<TextSelection>): IReadOnlyList<TextSelection>;
}

/**
 * Reads a value that must be present, and throws when it is not.
 *
 * @example
 * ```ts
 * import { Required } from "@noldova/code.editor";
 *
 * Required.at([1, 2, 3], 1); // 2
 * Required.value(new Map([["a", 1]]).get("a")); // 1
 * ```
 */
export declare class Required {
  /**
   * Reads an array element that must exist.
   *
   * @param values The array to read.
   * @param index The zero-based index to read.
   * @returns The element at the index.
   * @throws {IndexOutOfRangeException} When the array has no element at the
   * index, including a negative or non-integer index, or when the element is
   * `undefined`.
   * @example
   * ```ts
   * import { Required } from "@noldova/code.editor";
   *
   * Required.at(["a", "b"], 0); // "a"
   * Required.at(["a", "b"], 2); // Throws IndexOutOfRangeException.
   * ```
   */
  static at<T>(values: readonly T[], index: number): T;

  /**
   * Narrows a value that must be neither `null` nor `undefined`.
   *
   * @param value The value to check.
   * @returns The same value, typed without `null` and `undefined`.
   * @throws {ValueMissingException} When the value is `null` or `undefined`.
   * @example
   * ```ts
   * import { Required } from "@noldova/code.editor";
   *
   * Required.value("text"); // "text"
   * Required.value(null); // Throws ValueMissingException.
   * ```
   */
  static value<T>(value: T | null | undefined): T;
}

/**
 * Runs background jobs on the calling thread, a slice at a time, so that a
 * page or a server stays free between slices.
 *
 * @remarks
 * Each slice runs the job's steps until a step ends past the slice's time,
 * then waits for the next turn of the event loop. A single step that takes
 * longer, such as a diff algorithm's one call, holds the thread for its whole
 * time; in the browser a worker runner keeps such work off the page.
 *
 * @example
 * ```ts
 * import { SlicedRunner } from "@noldova/code.editor";
 *
 * const runner = new SlicedRunner();
 * runner.sliceMilliseconds; // 5
 * ```
 */
export declare class SlicedRunner implements IBackgroundRunner {
  /**
   * The default slice length: 5 ms.
   */
  static readonly defaultSliceMilliseconds: number;

  /**
   * How long a slice runs before it yields, in milliseconds.
   */
  readonly sliceMilliseconds: number;

  /**
   * Makes a runner.
   *
   * @param sliceMilliseconds How long a slice runs before it yields.
   * Defaults to {@link SlicedRunner.defaultSliceMilliseconds}.
   * @example
   * ```ts
   * import { SlicedRunner } from "@noldova/code.editor";
   *
   * new SlicedRunner(10).sliceMilliseconds; // 10
   * ```
   */
  constructor(sliceMilliseconds?: number);

  /**
   * Runs a job's steps to their end in slices.
   *
   * @param job The job.
   * @param input Its input.
   * @param cancellationToken Stops the run between slices: the promise rejects
   * with an `OperationCanceledException`. A token already canceled rejects at
   * once. Defaults to `CancellationToken.none`.
   * @returns The job's output.
   * @example
   * ```ts
   * import { type IBackgroundJob, SlicedRunner } from "@noldova/code.editor";
   *
   * declare const job: IBackgroundJob<string, number>;
   * await new SlicedRunner().runAsync(job, "input");
   * ```
   */
  runAsync<TInput, TOutput>(job: IBackgroundJob<TInput, TOutput>, input: TInput, cancellationToken?: CancellationToken): Promise<TOutput>;
}

/**
 * Names what a worker's answer to a {@link IWorkerJobRequest} holds.
 */
export declare enum WorkerJobAnswer {
  /**
   * The job ran: {@link IWorkerJobOutput}.
   */
  Output = "Output",
  /**
   * The worker serves no job of that name: {@link IWorkerJobMissing}.
   */
  Missing = "Missing",
  /**
   * The job threw: {@link IWorkerJobFailure}.
   */
  Failed = "Failed"
}

/**
 * A worker's answer that a job ran, with its output.
 */
export interface IWorkerJobOutput<TOutput> {
  /**
   * The request's number.
   */
  readonly id: number;

  /**
   * {@link WorkerJobAnswer.Output}.
   */
  readonly answer: WorkerJobAnswer.Output;

  /**
   * The job's output.
   */
  readonly output: TOutput;
}

/**
 * A worker's answer that it serves no job of the request's name.
 */
export interface IWorkerJobMissing {
  /**
   * The request's number.
   */
  readonly id: number;

  /**
   * {@link WorkerJobAnswer.Missing}.
   */
  readonly answer: WorkerJobAnswer.Missing;
}

/**
 * A worker's answer that a job threw.
 */
export interface IWorkerJobFailure {
  /**
   * The request's number.
   */
  readonly id: number;

  /**
   * {@link WorkerJobAnswer.Failed}.
   */
  readonly answer: WorkerJobAnswer.Failed;

  /**
   * The error's message.
   */
  readonly reason: string;
}

/**
 * A worker's answer to a {@link IWorkerJobRequest}, one of three kinds that
 * its `answer` names.
 */
export type WorkerJobResponse<TOutput> = IWorkerJobOutput<TOutput> | IWorkerJobMissing | IWorkerJobFailure;

/**
 * A request `@noldova/code.editor.angular`'s `WorkerRunner` posts to its
 * worker: run the job of this name on this input.
 */
export interface IWorkerJobRequest {
  /**
   * The run's number, which its answer carries back.
   */
  readonly id: number;

  /**
   * The job's name.
   */
  readonly name: string;

  /**
   * The job's input, as a structured clone.
   */
  readonly input: unknown;
}

/**
 * A message that brings a {@link WorkerJobHost} one request.
 */
export interface IWorkerJobMessage {
  /** The request. */
  readonly data: IWorkerJobRequest;
}

/**
 * How {@link IMessageScope.postMessage} posts an answer.
 */
export interface IMessagePostOptions {
  /** The buffers to transfer to the receiver rather than copy. */
  transfer: ArrayBuffer[];
}

/**
 * Where a {@link WorkerJobHost} receives requests and posts its answers: a
 * worker's global scope or a `MessagePort`.
 */
export interface IMessageScope {
  /**
   * Listens for messages.
   *
   * @param type `message`.
   * @param listener Receives each request.
   */
  addEventListener(type: "message", listener: (event: IWorkerJobMessage) => void): void;

  /**
   * Posts an answer.
   *
   * @param message The answer.
   * @param options The buffers to transfer.
   */
  postMessage(message: unknown, options: IMessagePostOptions): void;
}

/**
 * Serves background jobs by name inside a worker, for a `@noldova/code.editor.angular`'s `WorkerRunner`
 * in the page.
 *
 * @remarks
 * A worker can't receive the page's registries, so its script fills a
 * `BackgroundJobRegistry` of its own with the jobs it serves. The host drives
 * each job's steps straight through and transfers a typed array's buffer back
 * without a copy.
 *
 * @example
 * ```ts
 * // jobs.worker.ts
 * import { BackgroundJobRegistry, WorkerJobHost } from "@noldova/code.editor";
 * import { DefaultDiffAlgorithm, LineDiffJob } from "@noldova/code.editor.diff";
 *
 * const jobs = new BackgroundJobRegistry();
 * jobs.register(new LineDiffJob(new DefaultDiffAlgorithm()));
 * new WorkerJobHost(jobs).listen(self);
 * ```
 */
export declare class WorkerJobHost {
  /**
   * Makes a host for the jobs a worker serves.
   *
   * @param jobs The worker's own registry of the jobs it serves, each found by
   * its name.
   * @example
   * ```ts
   * import { BackgroundJobRegistry, WorkerJobHost } from "@noldova/code.editor";
   *
   * const host = new WorkerJobHost(new BackgroundJobRegistry());
   * ```
   */
  constructor(jobs: BackgroundJobRegistry);

  /**
   * Answers each request a scope receives from now on, on the same scope.
   *
   * @param scope The worker's global scope, `self`, or a `MessagePort`.
   * @example
   * ```ts
   * import type { WorkerJobHost } from "@noldova/code.editor";
   *
   * declare const host: WorkerJobHost;
   * host.listen(self);
   * ```
   */
  listen(scope: IMessageScope): void;

  /**
   * Runs the job a request names straight through.
   *
   * @param request The request.
   * @returns The job's output, an answer that the host serves no job of that
   * name, or the message of the error the job threw.
   * @example
   * ```ts
   * import { BackgroundJobRegistry, WorkerJobHost } from "@noldova/code.editor";
   *
   * new WorkerJobHost(new BackgroundJobRegistry()).answer({ id: 0, name: "sample.sum", input: [1] }).answer; // "Missing"
   * ```
   */
  answer(request: IWorkerJobRequest): WorkerJobResponse<unknown>;

  /**
   * The buffers an answer can move to the page without a copy: a typed
   * array output's buffer.
   *
   * @param response The answer.
   * @returns The buffers to transfer; none for any other answer.
   * @example
   * ```ts
   * import { WorkerJobHost } from "@noldova/code.editor";
   *
   * declare const host: WorkerJobHost;
   * WorkerJobHost.transferOf(host.answer({ id: 0, name: "sample.sum", input: [1] }));
   * ```
   */
  static transferOf(response: WorkerJobResponse<unknown>): ArrayBuffer[];
}

/**
 * Builds the {@link EditTransaction} for each editing command, such as
 * typing, Enter, Backspace, Tab and drag and drop, over any number of
 * selections.
 *
 * @remarks
 * No method changes the document; apply the transaction with
 * {@link UndoHistory.apply}. Each `time` parameter is the command's time in
 * milliseconds, which the undo history uses to group typing.
 *
 * @example
 * ```ts
 * import { EditKind, TextEditing, TextPosition, TextSelection, UndoHistory, TextDocument } from "@noldova/code.editor";
 * import { List } from "@noldova/context.collections";
 *
 * const document = TextDocument.fromText("");
 * const history = new UndoHistory(document);
 * history.apply(TextEditing.insert(new List([new TextSelection(new TextPosition(0, 0))]), "a", EditKind.Typing, Date.now()));
 * ```
 */
export declare class TextEditing {
  /**
   * Replaces each selection with the same text.
   *
   * @param selections The selections; overlapping ones are merged first.
   * @param text The text to insert.
   * @param kind The edit's kind, which decides how undo groups it.
   * @param time The command's time in milliseconds.
   * @returns The transaction, with each selection collapsed to the end of its
   * inserted text afterwards.
   * @example
   * ```ts
   * import { EditKind, TextEditing, TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const transaction = TextEditing.insert(new List([new TextSelection(new TextPosition(0, 0))]), "ab", EditKind.Typing, 0);
   * transaction.selectionsAfter; // one cursor at 0:2
   * ```
   */
  static insert(selections: IReadOnlyList<TextSelection>, text: string, kind: EditKind, time: number): EditTransaction;

  /**
   * Replaces each selection with its own text, as pasting one line per cursor
   * does.
   *
   * @param selections The selections, which must not overlap; they are not
   * merged.
   * @param texts The text for each selection, by index.
   * @param time The command's time in milliseconds.
   * @returns A transaction of kind {@link EditKind.Other}, with each selection
   * collapsed to the end of its inserted text afterwards.
   * @throws {ArgumentOutOfRangeException} When `texts` has fewer entries than
   * `selections`.
   * @example
   * ```ts
   * import { TextEditing, TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const cursors = new List([new TextSelection(new TextPosition(0, 0)), new TextSelection(new TextPosition(1, 0))]);
   * TextEditing.insertEach(cursors, new List(["a", "b"]), 0);
   * ```
   */
  static insertEach(selections: IReadOnlyList<TextSelection>, texts: IReadOnlyList<string>, time: number): EditTransaction;

  /**
   * Replaces each selection with a line break, keeping the line's indentation.
   *
   * @param document The document the selections are in.
   * @param selections The selections; overlapping ones are merged first.
   * @param time The command's time in milliseconds.
   * @returns A transaction of kind {@link EditKind.Typing}. The line break is
   * the first line's ending when the document has more than one line, else
   * `"\n"`; it is followed by the line's leading whitespace, up to the
   * selection's start column.
   * @example
   * ```ts
   * import { TextDocument, TextEditing, TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("  value");
   * TextEditing.newLine(document, new List([new TextSelection(new TextPosition(0, 7))]), 0); // inserts "\n  "
   * ```
   */
  static newLine(document: TextDocument, selections: IReadOnlyList<TextSelection>, time: number): EditTransaction;

  /**
   * Deletes each selection, or the character or word before each cursor, as
   * Backspace does.
   *
   * @param document The document the selections are in.
   * @param selections The selections; an empty one first extends left by one
   * character or word.
   * @param word True to delete by word rather than by character.
   * @param time The command's time in milliseconds.
   * @returns A transaction of kind {@link EditKind.Deleting}, or `null` when
   * there is nothing to delete, such as with every cursor at the document's
   * start.
   * @example
   * ```ts
   * import { TextDocument, TextEditing, TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("ab");
   * TextEditing.deleteBackward(document, new List([new TextSelection(new TextPosition(0, 2))]), false, 0); // deletes "b"
   * TextEditing.deleteBackward(document, new List([new TextSelection(new TextPosition(0, 0))]), false, 0); // null
   * ```
   */
  static deleteBackward(document: TextDocument, selections: IReadOnlyList<TextSelection>, word: boolean, time: number): EditTransaction | null;

  /**
   * Deletes each selection, or the character or word after each cursor, as
   * Delete does.
   *
   * @param document The document the selections are in.
   * @param selections The selections; an empty one first extends right by one
   * character or word.
   * @param word True to delete by word rather than by character.
   * @param time The command's time in milliseconds.
   * @returns A transaction of kind {@link EditKind.Deleting}, or `null` when
   * there is nothing to delete, such as with every cursor at the document's
   * end.
   * @example
   * ```ts
   * import { TextDocument, TextEditing, TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("one two");
   * TextEditing.deleteForward(document, new List([new TextSelection(new TextPosition(0, 0))]), true, 0); // deletes "one"
   * ```
   */
  static deleteForward(document: TextDocument, selections: IReadOnlyList<TextSelection>, word: boolean, time: number): EditTransaction | null;

  /**
   * Deletes each selection, or the text from each cursor back to its line's
   * start, as Command+Backspace does on a Mac.
   *
   * @param document The document the selections are in.
   * @param selections The selections; an empty one first extends to column
   * zero, or, at column zero, left over the line break before it.
   * @param time The command's time in milliseconds.
   * @returns A transaction of kind {@link EditKind.Deleting}, or `null` when
   * there is nothing to delete, such as with every cursor at the document's
   * start.
   * @example
   * ```ts
   * import { TextDocument, TextEditing, TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("one two");
   * TextEditing.deleteToLineStart(document, new List([new TextSelection(new TextPosition(0, 4))]), 0); // deletes "one "
   * ```
   */
  static deleteToLineStart(document: TextDocument, selections: IReadOnlyList<TextSelection>, time: number): EditTransaction | null;

  /**
   * Deletes each selection, or the text from each cursor to its line's end,
   * as Command+Delete and Control+K do on a Mac.
   *
   * @param document The document the selections are in.
   * @param selections The selections; an empty one first extends to its
   * line's end, or, at the end, right over the line break after it.
   * @param time The command's time in milliseconds.
   * @returns A transaction of kind {@link EditKind.Deleting}, or `null` when
   * there is nothing to delete, such as with every cursor at the document's
   * end.
   * @example
   * ```ts
   * import { TextDocument, TextEditing, TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("one two");
   * TextEditing.deleteToLineEnd(document, new List([new TextSelection(new TextPosition(0, 3))]), 0); // deletes " two"
   * ```
   */
  static deleteToLineEnd(document: TextDocument, selections: IReadOnlyList<TextSelection>, time: number): EditTransaction | null;

  /**
   * Indents, as Tab does.
   *
   * @param document The document the selections are in.
   * @param selections The selections to indent.
   * @param unit The indentation to insert, such as `"\t"` or four spaces.
   * @param time The command's time in milliseconds.
   * @returns When every selection is within one line, the
   * {@link TextEditing.insert} transaction that replaces each selection with
   * the unit, of kind {@link EditKind.Typing}. Otherwise a transaction of kind
   * {@link EditKind.Other} that inserts the unit at the start of each
   * non-empty line the selections cover, leaving out a last line that a
   * selection ends at column zero of, and keeps the selections' extent.
   * @example
   * ```ts
   * import { TextDocument, TextEditing, TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("a\nb");
   * TextEditing.indent(document, new List([new TextSelection(new TextPosition(0, 0), new TextPosition(1, 1))]), "  ", 0);
   * ```
   */
  static indent(document: TextDocument, selections: IReadOnlyList<TextSelection>, unit: string, time: number): EditTransaction;

  /**
   * Outdents each line the selections cover, as Shift+Tab does.
   *
   * @param document The document the selections are in.
   * @param selections The selections whose lines to outdent; a last line that
   * a selection ends at column zero of is left out.
   * @param unit The indentation unit; up to its length of leading whitespace
   * is removed from each line, or one leading tab when the line starts with a
   * tab.
   * @param time The command's time in milliseconds.
   * @returns A transaction of kind {@link EditKind.Other} that keeps the
   * selections' extent, or `null` when no covered line has leading
   * whitespace.
   * @example
   * ```ts
   * import { TextDocument, TextEditing, TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("    value");
   * TextEditing.outdent(document, new List([new TextSelection(new TextPosition(0, 6))]), "  ", 0); // removes two spaces
   * ```
   */
  static outdent(document: TextDocument, selections: IReadOnlyList<TextSelection>, unit: string, time: number): EditTransaction | null;

  /**
   * Inserts dropped text, as dropping text from outside the editor does.
   *
   * @param selections The selections before the drop, kept for undo.
   * @param position The drop position.
   * @param text The dropped text.
   * @param time The command's time in milliseconds.
   * @returns A transaction of kind {@link EditKind.Other} that selects the
   * inserted text afterwards.
   * @example
   * ```ts
   * import { TextEditing, TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const at = new TextPosition(0, 0);
   * TextEditing.drop(new List([new TextSelection(at)]), at, "ab", 0).selectionsAfter; // 0:0 to 0:2
   * ```
   */
  static drop(selections: IReadOnlyList<TextSelection>, position: TextPosition, text: string, time: number): EditTransaction;

  /**
   * Moves a range's text to another position, as dragging a selection does.
   *
   * @param document The document the range is in.
   * @param selections The selections before the move, kept for undo.
   * @param range The text to move.
   * @param position The position to move it to, in the document before the
   * move.
   * @param time The command's time in milliseconds.
   * @returns A transaction of kind {@link EditKind.Other} that removes the
   * range, inserts its text at the position and selects it there, or `null`
   * when the position is inside the range or at either of its ends.
   * @example
   * ```ts
   * import { TextDocument, TextEditing, TextPosition, TextRange, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const document = TextDocument.fromText("ab cd");
   * const range = TextRange.of(0, 0, 0, 2);
   * TextEditing.move(document, new List([new TextSelection(range.start, range.end)]), range, new TextPosition(0, 5), 0); // the line becomes " cdab"
   * ```
   */
  static move(document: TextDocument, selections: IReadOnlyList<TextSelection>, range: TextRange, position: TextPosition, time: number): EditTransaction | null;
}

/**
 * Holds a {@link TextSearch}'s matches in one document, searching lines on
 * demand and following the document's edits.
 *
 * @remarks
 * Matches are found line by line, either when a method needs a line or in
 * the background through {@link SearchResults.advance}. An edit marks only
 * the lines it touched for a new search. Dispose the results to stop
 * following the document.
 *
 * @example
 * ```ts
 * import { SearchQuery, SearchResults, TextDocument, TextSearch } from "@noldova/code.editor";
 *
 * using results = new SearchResults(TextDocument.fromText("cat\ncat cat"), new TextSearch(new SearchQuery("cat")));
 * results.all().count(); // 3
 * ```
 */
export declare class SearchResults implements Disposable {
  /**
   * The search these results are for.
   */
  readonly search: TextSearch;

  /**
   * Creates empty results and starts following the document's edits; no line
   * is searched yet.
   *
   * @param document The document to search.
   * @param search The search to run.
   * @example
   * ```ts
   * import { SearchQuery, SearchResults, TextDocument, TextSearch } from "@noldova/code.editor";
   *
   * using results = new SearchResults(TextDocument.fromText("a"), new TextSearch(new SearchQuery("a")));
   * ```
   */
  constructor(document: TextDocument, search: TextSearch);

  /**
   * The number of matches in the lines searched so far; it is the whole
   * document's count once {@link SearchResults.complete} is true.
   */
  get count(): number;

  /**
   * True when every line has been searched since the last edit.
   */
  get complete(): boolean;

  /**
   * Lists the matches in a span of lines, searching those lines as needed.
   *
   * @param fromLine The first zero-based line, inclusive.
   * @param toLine The line to stop before, exclusive; clamped to the
   * document's line count.
   * @returns The matches in document order; empty when there are none.
   * @example
   * ```ts
   * import { SearchQuery, SearchResults, TextDocument, TextSearch } from "@noldova/code.editor";
   *
   * using results = new SearchResults(TextDocument.fromText("a\na\na"), new TextSearch(new SearchQuery("a")));
   * results.matchesIn(0, 2).count(); // 2
   * ```
   */
  matchesIn(fromLine: number, toLine: number): IReadOnlyList<TextRange>;

  /**
   * Searches lines not yet searched, for background work between frames.
   *
   * @param hasTime Called after every 64 lines, since reading a clock costs
   * more than searching a short line; returning false stops the work. At
   * least 64 lines are searched, or every line left when fewer remain.
   * @returns True while lines remain to search.
   * @example
   * ```ts
   * import { SearchQuery, SearchResults, TextDocument, TextSearch } from "@noldova/code.editor";
   *
   * using results = new SearchResults(TextDocument.fromText("a\na"), new TextSearch(new SearchQuery("a")));
   * const deadline = performance.now() + 5;
   * results.advance(() => performance.now() < deadline); // false once every line is searched
   * ```
   */
  advance(hasTime: () => boolean): boolean;

  /**
   * Finds a match's ordinal, for a "3 of 12" display.
   *
   * @param range The match's range.
   * @returns The match's zero-based index among the matches in document
   * order, or -1 when the range is not a match. It counts the matches found
   * on earlier lines so far, so it is exact once
   * {@link SearchResults.complete} is true.
   * @throws {ArgumentOutOfRangeException} When the range starts on a line
   * the document does not have.
   * @example
   * ```ts
   * import { SearchQuery, SearchResults, TextDocument, TextRange, TextSearch } from "@noldova/code.editor";
   *
   * using results = new SearchResults(TextDocument.fromText("a a"), new TextSearch(new SearchQuery("a")));
   * results.all();
   * results.indexOf(TextRange.of(0, 2, 0, 3)); // 1
   * ```
   */
  indexOf(range: TextRange): number;

  /**
   * Finds the next match, as Find Next does, searching lines as needed.
   *
   * @param position The position to search from.
   * @returns The first match that starts at or after the position, or the
   * document's first match when none does, wrapping around; `null` when
   * there are no matches.
   * @throws {ArgumentOutOfRangeException} When the position is on a line
   * the document does not have.
   * @example
   * ```ts
   * import { SearchQuery, SearchResults, TextDocument, TextPosition, TextSearch } from "@noldova/code.editor";
   *
   * using results = new SearchResults(TextDocument.fromText("a\nb\na"), new TextSearch(new SearchQuery("a")));
   * results.next(new TextPosition(1, 0)); // 2:0 to 2:1
   * ```
   */
  next(position: TextPosition): TextRange | null;

  /**
   * Finds the previous match, as Find Previous does, searching lines as
   * needed.
   *
   * @param position The position to search back from.
   * @returns The last match that starts before the position, or the
   * document's last match when none does, wrapping around; `null` when there
   * are no matches.
   * @throws {ArgumentOutOfRangeException} When the position is on a line
   * the document does not have.
   * @example
   * ```ts
   * import { SearchQuery, SearchResults, TextDocument, TextPosition, TextSearch } from "@noldova/code.editor";
   *
   * using results = new SearchResults(TextDocument.fromText("a\nb\na"), new TextSearch(new SearchQuery("a")));
   * results.previous(new TextPosition(0, 0)); // 2:0 to 2:1, wrapped around
   * ```
   */
  previous(position: TextPosition): TextRange | null;

  /**
   * Searches the rest of the document and lists every match.
   *
   * @returns All matches in document order; empty when there are none.
   * @example
   * ```ts
   * import { SearchQuery, SearchResults, TextDocument, TextSearch } from "@noldova/code.editor";
   *
   * using results = new SearchResults(TextDocument.fromText("ab ab"), new TextSearch(new SearchQuery("ab")));
   * results.all(); // 0:0 to 0:2, then 0:3 to 0:5
   * ```
   */
  all(): IReadOnlyList<TextRange>;

  /**
   * Stops following the document's edits.
   *
   * @example
   * ```ts
   * import { SearchQuery, SearchResults, TextDocument, TextSearch } from "@noldova/code.editor";
   *
   * const results = new SearchResults(TextDocument.fromText("a"), new TextSearch(new SearchQuery("a")));
   * results[Symbol.dispose]();
   * ```
   */
  [Symbol.dispose](): void;
}

/**
 * Finds and replaces a {@link SearchQuery}'s matches in a document.
 *
 * @remarks
 * Matches never span lines, and empty matches are skipped. The search is
 * case-insensitive unless the query says otherwise, and a whole-word query
 * matches only between characters that are not Unicode letters, digits or
 * `_`. A query with empty text matches nothing.
 *
 * @example
 * ```ts
 * import { SearchQuery, TextDocument, TextSearch } from "@noldova/code.editor";
 *
 * new TextSearch(new SearchQuery("Cat")).findAll(TextDocument.fromText("cat CAT")).count(); // 2
 * ```
 */
export declare class TextSearch {
  /**
   * Compiles a query.
   *
   * @param query The query; its text is a literal unless the query is a
   * regular expression.
   * @throws {SearchPatternException} When a regular-expression query's text
   * is not a valid Unicode regular expression.
   * @example
   * ```ts
   * import { SearchQuery, TextSearch } from "@noldova/code.editor";
   *
   * new TextSearch(new SearchQuery("a+", true));
   * new TextSearch(new SearchQuery("(", true)); // Throws SearchPatternException.
   * ```
   */
  constructor(query: SearchQuery);

  /**
   * Lists the matches in a span of lines.
   *
   * @param document The document to search.
   * @param fromLine The first zero-based line, inclusive. Defaults to zero.
   * @param toLine The line to stop before, exclusive; clamped to the
   * document's line count. Defaults to the line count.
   * @returns The matches in document order; empty when there are none.
   * @example
   * ```ts
   * import { SearchQuery, TextDocument, TextSearch } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("a\na\na");
   * new TextSearch(new SearchQuery("a")).findAll(document, 1).count(); // 2
   * ```
   */
  findAll(document: TextDocument, fromLine?: number, toLine?: number): IReadOnlyList<TextRange>;

  /**
   * Finds every match in one line, as column pairs, without making a range
   * for each.
   *
   * @param document The document to search.
   * @param line The line to search, from 0.
   * @returns Each match's start and end columns, in pairs in line order; empty
   * when there are none. Empty matches are skipped, as {@link TextSearch.findAll}
   * skips them.
   * @example
   * ```ts
   * import { SearchQuery, TextDocument, TextSearch } from "@noldova/code.editor";
   *
   * new TextSearch(new SearchQuery("a")).columnsIn(TextDocument.fromText("a b a"), 0); // [0, 1, 4, 5]
   * ```
   */
  columnsIn(document: TextDocument, line: number): readonly number[];

  /**
   * Finds the next match by searching the whole document.
   *
   * @param document The document to search.
   * @param position The position to search from.
   * @returns The first match that starts at or after the position, or the
   * first match when none does, wrapping around; `null` when there are no
   * matches.
   * @example
   * ```ts
   * import { SearchQuery, TextDocument, TextPosition, TextSearch } from "@noldova/code.editor";
   *
   * new TextSearch(new SearchQuery("a")).next(TextDocument.fromText("a b a"), new TextPosition(0, 1)); // 0:4 to 0:5
   * ```
   */
  next(document: TextDocument, position: TextPosition): TextRange | null;

  /**
   * Finds the previous match by searching the whole document.
   *
   * @param document The document to search.
   * @param position The position to search back from.
   * @returns The last match that starts before the position, or the last
   * match when none does, wrapping around; `null` when there are no matches.
   * @example
   * ```ts
   * import { SearchQuery, TextDocument, TextPosition, TextSearch } from "@noldova/code.editor";
   *
   * new TextSearch(new SearchQuery("a")).previous(TextDocument.fromText("a b a"), new TextPosition(0, 4)); // 0:0 to 0:1
   * ```
   */
  previous(document: TextDocument, position: TextPosition): TextRange | null;

  /**
   * Builds the edits that replace matches, for Replace and Replace All.
   *
   * @param document The document the matches are in.
   * @param matches The matches to replace, usually from this search.
   * @param replacement The replacement text. For a regular-expression query
   * it may use `$1`, `$&` and the other replacement patterns of
   * `String.prototype.replace`, applied to each match's text; otherwise it is
   * inserted as is.
   * @returns One edit per match, in the given order; apply them with
   * {@link TextDocument.apply}.
   * @example
   * ```ts
   * import { SearchQuery, TextDocument, TextSearch } from "@noldova/code.editor";
   *
   * const document = TextDocument.fromText("a1 b2");
   * const search = new TextSearch(new SearchQuery("([a-z])(\\d)", true));
   * document.apply(search.replaceEdits(document, search.findAll(document), "$2$1")); // the line becomes "1a 2b"
   * ```
   */
  replaceEdits(document: TextDocument, matches: IReadOnlyList<TextRange>, replacement: string): IReadOnlyList<TextEdit>;
}

/**
 * Caches a document's syntax tokens line by line, tokenizing on demand and
 * following the document's edits.
 *
 * @remarks
 * Lines are tokenized in order from the top, since each line starts from the
 * state the previous one ended in. After an edit, tokenizing restarts at the
 * first edited line and stops early once a line ends in the same state as
 * before. Dispose the cache to stop following the document.
 *
 * @example
 * ```ts
 * import { TextDocument, TokenCache, type ILineTokenizer } from "@noldova/code.editor";
 *
 * declare const tokenizer: ILineTokenizer;
 * using cache = new TokenCache(TextDocument.fromText("const a = 1;"), tokenizer);
 * cache.tokensOf(0).tokens;
 * ```
 */
export declare class TokenCache implements Disposable {
  /**
   * Creates an empty cache and starts following the document's edits.
   *
   * @param document The document to tokenize.
   * @param tokenizer The tokenizer for the document's language; the cache
   * does not dispose it.
   * @example
   * ```ts
   * import { TextDocument, TokenCache, type ILineTokenizer } from "@noldova/code.editor";
   *
   * declare const tokenizer: ILineTokenizer;
   * using cache = new TokenCache(TextDocument.fromText("let a;"), tokenizer);
   * ```
   */
  constructor(document: TextDocument, tokenizer: ILineTokenizer);

  /**
   * The number of lines from the top whose tokens are current.
   */
  get validLineCount(): number;

  /**
   * Reads one line's tokens.
   *
   * @param line The zero-based line; it must exist in the document.
   * @returns The line's tokens. A line fewer than 50 lines past
   * {@link TokenCache.validLineCount} is tokenized now, with every line
   * before it. A line further down gets provisional tokens instead, computed
   * from the less-indented lines above it within 50 lines, which may differ
   * from its final tokens.
   * @throws {ArgumentOutOfRangeException} When the line is negative, not an
   * integer or not in the document.
   * @example
   * ```ts
   * import { TextDocument, TokenCache, type ILineTokenizer } from "@noldova/code.editor";
   *
   * declare const tokenizer: ILineTokenizer;
   * using cache = new TokenCache(TextDocument.fromText("const s = `open\nstill the string`;"), tokenizer);
   * cache.tokensOf(1).tokens; // continues the template string from line 0
   * ```
   */
  tokensOf(line: number): LineTokens;

  /**
   * Tokenizes lines not yet current, for background work between frames.
   *
   * @param hasTime Called after each line; returning false stops the work.
   * At least one line is tokenized when any remains.
   * @returns True while lines remain to tokenize.
   * @example
   * ```ts
   * import { TextDocument, TokenCache, type ILineTokenizer } from "@noldova/code.editor";
   *
   * declare const tokenizer: ILineTokenizer;
   * using cache = new TokenCache(TextDocument.fromText("let a;\nlet b;"), tokenizer);
   * const deadline = performance.now() + 5;
   * cache.advance(() => performance.now() < deadline);
   * ```
   */
  advance(hasTime: () => boolean): boolean;

  /**
   * Stops following the document's edits; the tokenizer is left open.
   *
   * @example
   * ```ts
   * import { TextDocument, TokenCache, type ILineTokenizer } from "@noldova/code.editor";
   *
   * declare const tokenizer: ILineTokenizer;
   * const cache = new TokenCache(TextDocument.fromText("let a;"), tokenizer);
   * cache[Symbol.dispose]();
   * ```
   */
  [Symbol.dispose](): void;
}

/**
 * Turns a line's tokens into segments that cover the whole line, for
 * rendering.
 *
 * @example
 * ```ts
 * import { LineToken, TokenSegments } from "@noldova/code.editor";
 * import { List } from "@noldova/context.collections";
 *
 * TokenSegments.fill(9, new List([new LineToken(0, 5, "keyword")])); // 0-5 keyword, then 5-9 plain
 * ```
 */
export declare class TokenSegments {
  /**
   * Fills a line from its tokens.
   *
   * @param length The line's length in UTF-16 code units.
   * @param tokens The line's tokens in start order. A token's part that
   * overlaps an earlier token or passes the line's end is cut off.
   * @returns Contiguous segments from zero to `length`, in order: each token's
   * remaining part with its type and modifiers, and each gap with a `null`
   * type; empty when `length` is zero.
   * @example
   * ```ts
   * import { LineToken, TokenSegments } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * TokenSegments.fill(6, new List([new LineToken(2, 4, "string")])); // 0-2 plain, 2-4 string, 4-6 plain
   * ```
   */
  static fill(length: number, tokens: IReadOnlyList<LineToken>): IReadOnlyList<LineSegment>;
}

/**
 * A view's token classes and the style sheet that colors them, made from a
 * registry's types and modifiers, so a new type needs no rule of its own.
 *
 * @remarks
 * A type's color is its color variable, `--nol-code-` and its id with dashes
 * for dots, falling back to its parent's and on to its root type's;
 * `keyword.control` and `string.regexp` use the kit's `--nol-code-control`
 * and `--nol-code-regex`. A modifier's class sets `font-style`, `font-weight`
 * and `text-decoration` from `--nol-code-modifier-<id>-<property>`, each left
 * as it is while unset.
 */
export declare class TokenStyles {
  /**
   * A token's classes.
   *
   * @param registry The token types and modifiers.
   * @param type The token's type, or `null` for plain text.
   * @param modifiers The token's modifiers; unregistered ones get no class.
   * @param prefix The view's class prefix.
   * @returns The class of the type the token's type resolves to, if any, then
   * one per registered modifier.
   * @example
   * ```ts
   * import { TokenStyles, type TokenTypeRegistry } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * declare const registry: TokenTypeRegistry;
   * TokenStyles.classesOf(registry, "keyword.control.flow", new List(["deprecated"]), "nol-code-editor-token-");
   * // ["nol-code-editor-token-keyword-control", "nol-code-editor-token-modifier-deprecated"]
   * ```
   */
  static classesOf(registry: TokenTypeRegistry, type: string | null, modifiers: IReadOnlyList<string>, prefix: string): IReadOnlyList<string>;
  /**
   * The style sheet for every registered type and modifier.
   *
   * @param registry The token types and modifiers.
   * @param prefix The view's class prefix.
   * @returns The CSS rules, one per line.
   */
  static styleSheet(registry: TokenTypeRegistry, prefix: string): string;
}

/**
 * The token types and modifiers a set knows, with its parent set's behind
 * them.
 *
 * @remarks
 * A type falls back to its parent, or, when it names none, to the type its id
 * has before its last dot; a token's type no registry knows resolves along
 * its dots, so `keyword.control.flow` is styled as `keyword.control`.
 */
export declare class TokenTypeRegistry {
  /**
   * Creates a set's token type registry.
   *
   * @param parent The parent set's registry, or `null` for an app's own.
   */
  constructor(parent?: TokenTypeRegistry | null);
  /**
   * Registers a token type.
   *
   * @param type The type.
   * @returns What removes it again.
   * @throws {@link RegistrationExistsException} When this set already holds
   * its id.
   */
  registerType(type: ITokenTypeDefinition): Disposable;
  /**
   * Registers a token modifier.
   *
   * @param modifier The modifier.
   * @returns What removes it again.
   * @throws {@link RegistrationExistsException} When this set already holds
   * its id.
   */
  registerModifier(modifier: ITokenModifierDefinition): Disposable;
  /**
   * The type with an id.
   *
   * @param id The id.
   * @returns The type, or `null`.
   */
  findType(id: string): ITokenTypeDefinition | null;
  /**
   * The modifier with an id.
   *
   * @param id The id.
   * @returns The modifier, or `null`.
   */
  findModifier(id: string): ITokenModifierDefinition | null;
  /**
   * The registered type a token's type is styled as.
   *
   * @param id The token's type.
   * @returns The id itself when registered, else its nearest registered one
   * along its dots, else `null`.
   */
  resolve(id: string): string | null;
  /**
   * The registered types a token's type is styled by, nearest first.
   *
   * @param id The token's type.
   * @returns The type it resolves to, then each parent in turn; empty when it
   * resolves to none.
   */
  chainOf(id: string): IReadOnlyList<ITokenTypeDefinition>;
  /**
   * Every type: this set's, then its parent's that this set doesn't shadow.
   */
  types(): IReadOnlyList<ITokenTypeDefinition>;
  /**
   * Every modifier: this set's, then its parent's that this set doesn't
   * shadow.
   */
  modifiers(): IReadOnlyList<ITokenModifierDefinition>;
}

/**
 * Applies edit transactions to a document and keeps them for undo and redo.
 *
 * @remarks
 * Consecutive transactions merge into one undo step when the last step is
 * not sealed, both have the same kind other than {@link EditKind.Other},
 * the new one comes no more than {@link UndoHistory.groupMilliseconds}
 * after the last, and it
 * starts from the selections the last one left. Edits made to the document
 * by other means are not tracked.
 *
 * @example
 * ```ts
 * import { EditKind, TextDocument, TextEditing, TextPosition, TextSelection, UndoHistory } from "@noldova/code.editor";
 * import { List } from "@noldova/context.collections";
 *
 * const document = TextDocument.fromText("");
 * const history = new UndoHistory(document);
 * history.apply(TextEditing.insert(new List([new TextSelection(new TextPosition(0, 0))]), "a", EditKind.Typing, 0));
 * history.undo();
 * document.lineText(0); // ""
 * ```
 */
export declare class UndoHistory {
  /**
   * Creates an empty history for a document.
   *
   * @param document The document the transactions are applied to.
   * @example
   * ```ts
   * import { TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * const history = new UndoHistory(TextDocument.fromText("text"));
   * ```
   */
  constructor(document: TextDocument);

  /**
   * How many milliseconds apart two typing or deleting transactions may be
   * and still merge into one step; 500 by default. A view sets it from
   * {@link CoreSettings.undoGroupMilliseconds}.
   */
  groupMilliseconds: number;

  /**
   * The most undo steps kept, 10,000 by default; the oldest go first when a
   * new step or a lower limit leaves more. A view sets it from
   * {@link CoreSettings.undoLimit}.
   */
  get limit(): number;
  set limit(limit: number);

  /**
   * True when there is a step to undo.
   */
  get canUndo(): boolean;

  /**
   * True when there is a step to redo; any new transaction clears the redo
   * steps.
   */
  get canRedo(): boolean;

  /**
   * Applies a transaction to the document and records it for undo.
   *
   * @param transaction The transaction to apply, such as one from
   * {@link TextEditing}.
   * @returns The change the document made.
   * @throws {ArgumentException} When the transaction has no edits.
   * @throws {EditsOverlapException} When two of its edits overlap.
   * @example
   * ```ts
   * import { EditKind, TextDocument, TextEditing, TextPosition, TextSelection, UndoHistory } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const history = new UndoHistory(TextDocument.fromText(""));
   * history.apply(TextEditing.insert(new List([new TextSelection(new TextPosition(0, 0))]), "a", EditKind.Typing, 0));
   * history.canUndo; // true
   * ```
   */
  apply(transaction: EditTransaction): TextChange;

  /**
   * Ends the current undo step, so that the next transaction starts a new
   * one, for example after the cursor moves.
   *
   * @example
   * ```ts
   * import { EditKind, TextDocument, TextEditing, TextPosition, TextSelection, UndoHistory } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const history = new UndoHistory(TextDocument.fromText(""));
   * history.apply(TextEditing.insert(new List([new TextSelection(new TextPosition(0, 0))]), "a", EditKind.Typing, 0));
   * history.seal();
   * ```
   */
  seal(): void;

  /**
   * Reverts the last undo step and moves it to the redo steps.
   *
   * @returns The selections from before the step, to restore; `null` when
   * there is nothing to undo.
   * @example
   * ```ts
   * import { TextDocument, UndoHistory } from "@noldova/code.editor";
   *
   * new UndoHistory(TextDocument.fromText("")).undo(); // null
   * ```
   */
  undo(): IReadOnlyList<TextSelection> | null;

  /**
   * Reapplies the last undone step and moves it back to the undo steps.
   *
   * @returns The selections from after the step, to restore; `null` when
   * there is nothing to redo.
   * @example
   * ```ts
   * import { EditKind, TextDocument, TextEditing, TextPosition, TextSelection, UndoHistory } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const history = new UndoHistory(TextDocument.fromText(""));
   * history.apply(TextEditing.insert(new List([new TextSelection(new TextPosition(0, 0))]), "a", EditKind.Typing, 0));
   * history.undo();
   * history.redo(); // one cursor at 0:1
   * ```
   */
  redo(): IReadOnlyList<TextSelection> | null;
}

/**
 * Thrown when a registry already holds an entry with the id being
 * registered.
 *
 * @remarks
 * A child registry may hold an id its parent holds; that shadows the
 * parent's entry and is not an error.
 */
export declare class RegistrationExistsException extends Exception {
  /**
   * The exception's name.
   */
  readonly name: string;
  /**
   * The registry's name, such as `"commands"`.
   */
  readonly registry: string;
  /**
   * The id registered twice.
   */
  readonly id: string;
  /**
   * Creates the exception.
   *
   * @param registry The registry's name.
   * @param id The id registered twice.
   * @example
   * ```ts
   * import { RegistrationExistsException } from "@noldova/code.editor";
   *
   * throw new RegistrationExistsException("commands", "editor.undo");
   * ```
   */
  constructor(registry: string, id: string);
}

/**
 * Thrown when a registry is asked for an id that neither it nor its parents
 * hold.
 */
export declare class RegistrationMissingException extends Exception {
  /**
   * The exception's name.
   */
  readonly name: string;
  /**
   * The registry's name, such as `"commands"`.
   */
  readonly registry: string;
  /**
   * The id asked for.
   */
  readonly id: string;
  /**
   * Creates the exception.
   *
   * @param registry The registry's name.
   * @param id The id asked for.
   * @example
   * ```ts
   * import { RegistrationMissingException } from "@noldova/code.editor";
   *
   * throw new RegistrationMissingException("commands", "editor.unknown");
   * ```
   */
  constructor(registry: string, id: string);
}

/**
 * Thrown when a condition's text can't be read.
 */
export declare class ConditionSyntaxException extends Exception {
  /**
   * The exception's name.
   */
  readonly name: string;
  /**
   * The condition's text.
   */
  readonly text: string;
  /**
   * The offset in the text where reading stopped.
   */
  readonly offset: number;
  /**
   * Creates the exception.
   *
   * @param text The condition's text.
   * @param offset The offset where reading stopped.
   * @example
   * ```ts
   * import { ConditionSyntaxException } from "@noldova/code.editor";
   *
   * throw new ConditionSyntaxException("a &", 2);
   * ```
   */
  constructor(text: string, offset: number);
}

/**
 * Thrown when a key binding's key text names an unknown modifier or no key.
 */
export declare class KeySyntaxException extends Exception {
  /**
   * The exception's name.
   */
  readonly name: string;
  /**
   * The key text.
   */
  readonly text: string;
  /**
   * Creates the exception.
   *
   * @param text The key text.
   * @example
   * ```ts
   * import { KeySyntaxException } from "@noldova/code.editor";
   *
   * throw new KeySyntaxException("hyper+a");
   * ```
   */
  constructor(text: string);
}

/**
 * A unit of background work that any package can hand to an
 * {@link IBackgroundRunner}: comparing documents, highlighting, counting
 * matches.
 *
 * @remarks
 * Its `steps` form runs it on the calling thread a slice at a time: the
 * generator yields wherever the work can pause. Its `name` lets a worker find
 * the same job in the list its worker script serves; a runner with a worker
 * sends the input there and takes the output back, so both must be what a
 * worker can receive, such as arrays, strings and typed arrays.
 *
 * @example
 * ```ts
 * import type { IBackgroundJob } from "@noldova/code.editor";
 *
 * class SumJob implements IBackgroundJob<readonly number[], number> {
 *   public readonly name: string = "sample.sum";
 *
 *   public *steps(input: readonly number[]): Generator<void, number, void> {
 *     let sum: number = 0;
 *     for (const value of input) {
 *       sum += value;
 *       yield;
 *     }
 *     return sum;
 *   }
 * }
 * ```
 */
export interface IBackgroundJob<TInput, TOutput> {
  /**
   * The job's name, the same in the page and in a worker.
   */
  readonly name: string;

  /**
   * The job as steps.
   *
   * @param input The job's input.
   * @returns A generator that yields between slices and returns the output.
   */
  steps(input: TInput): Generator<void, TOutput, void>;
}

/**
 * Runs background jobs, in a worker or a slice at a time on the calling
 * thread.
 *
 * @example
 * ```ts
 * import type { IBackgroundJob, IBackgroundRunner } from "@noldova/code.editor";
 *
 * async function runAsync(runner: IBackgroundRunner, job: IBackgroundJob<string, number>): Promise<number> {
 *   return await runner.runAsync(job, "input");
 * }
 * ```
 */
export interface IBackgroundRunner {
  /**
   * Runs a job to its end.
   *
   * @param job The job.
   * @param input Its input.
   * @param cancellationToken Stops the run: the promise rejects with an
   * `OperationCanceledException`, and no more of the job runs on the calling
   * thread. Defaults to `CancellationToken.none`.
   * @returns The job's output.
   */
  runAsync<TInput, TOutput>(job: IBackgroundJob<TInput, TOutput>, input: TInput, cancellationToken?: CancellationToken): Promise<TOutput>;
}

/**
 * Something an editor can do, run by its id from a key, a button or code.
 *
 * @remarks
 * Register it in {@link CommandRegistry}; the core's own commands are
 * registered the same way by {@link CoreContribution}.
 *
 * @example
 * ```ts
 * import { type CommandContext, CommandRegistry, EditorFeatures, type ICommand } from "@noldova/code.editor";
 *
 * class SelectAllCommand implements ICommand {
 *   public readonly id: string = "my.selectAll";
 *
 *   public run(context: CommandContext): boolean {
 *     return context.feature(EditorFeatures.session)?.selectAll() ?? false;
 *   }
 * }
 *
 * new CommandRegistry().register(new SelectAllCommand());
 * ```
 */
export interface ICommand {
  /**
   * The command's id, dotted and unique, such as `"editor.deleteLeft"`.
   */
  readonly id: string;
  /**
   * Runs the command.
   *
   * @param context The editor and the moment it runs in.
   * @param args The arguments the binding or the caller gives, or null.
   * @returns False when the command doesn't apply here, so a key goes on to
   * the next binding; true when it handled it.
   */
  run(context: CommandContext, args: unknown): boolean;
}

/**
 * A command that moves the carets, with its twin that extends the selection
 * instead.
 *
 * @example
 * ```ts
 * import { CoreCommands } from "@noldova/code.editor";
 *
 * CoreCommands.cursorLeft.id; // "editor.cursorLeft"
 * CoreCommands.cursorLeft.select.id; // "editor.cursorLeftSelect"
 * ```
 */
export interface IMoveCommand extends ICommand {
  /**
   * The twin that keeps each anchor and extends the selection; its id is
   * this command's with `Select` after it.
   */
  readonly select: ICommand;
}

/**
 * A package's commands, key bindings, conditions, settings and phrases,
 * added to an {@link EditorRegistries} in one call.
 *
 * @example
 * ```ts
 * import { EditorRegistries, type IEditorContribution } from "@noldova/code.editor";
 *
 * class HelloContribution implements IEditorContribution {
 *   public readonly id: string = "my.package";
 *
 *   public contribute(registries: EditorRegistries): void {
 *     registries.phrases.add("en", { "my.hello": "Hello" });
 *   }
 * }
 *
 * new EditorRegistries().add(new HelloContribution());
 * ```
 */
export interface IEditorContribution {
  /**
   * The contribution's id, unique, such as `"noldova.code.editor"`; a set
   * adds a contribution with the same id only once.
   */
  readonly id: string;
  /**
   * Registers the contribution's entries.
   *
   * @param registries The set to register them in.
   */
  contribute(registries: EditorRegistries): void;
}

/**
 * One key binding, as data a host can load from a settings file.
 *
 * @remarks
 * Key text is modifiers joined by `+`, then the key: `ctrl`, `shift`, `alt`
 * (`option`), `cmd` (`meta`), and `mod`, which is Command on a Mac and
 * Control elsewhere. The key is a keyboard event's `key` name, such as
 * `enter`, `home` or `a`, with `left`, `right`, `up`, `down`, `esc` and
 * `space` as short names, or its `code` name, such as `BracketLeft`, for a
 * key wherever the layout puts its character; case doesn't matter. A letter
 * or digit also matches its physical key when the layout gives no plain
 * character, as Option does on a Mac.
 *
 * A rule has one key. A key that differs by platform is a rule per
 * platform, told apart by the `platform` condition, which is `mac`,
 * `windows` or `linux`; `mod` keeps most rules to one.
 *
 * @example
 * ```ts
 * import { type IKeyBindingRule, KeyBindingRule } from "@noldova/code.editor";
 * import { type IReadOnlyList, List } from "@noldova/context.collections";
 *
 * const rules: IReadOnlyList<IKeyBindingRule> = new List<IKeyBindingRule>([
 *   new KeyBindingRule("editor.undo", "mod+z"),
 *   new KeyBindingRule("editor.cursorWordLeft", "alt+left", "platform == 'mac'"),
 *   new KeyBindingRule("editor.cursorWordLeft", "ctrl+left", "platform != 'mac'"),
 *   new KeyBindingRule("editor.indent", "tab", "editorTabIndents"),
 *   new KeyBindingRule("-editor.redo")
 * ]);
 * ```
 */
export interface IKeyBindingRule {
  /**
   * The command's id. In a user rule, `-` before it removes the defaults
   * for that command: on the key the rule names, or on every key when it
   * names none.
   */
  readonly command: string;
  /**
   * The key: one chord, such as `"ctrl+k"`, or a sequence of two chords
   * separated by a space, such as `"ctrl+k ctrl+c"`. A user rule that
   * removes defaults may name none.
   */
  readonly key?: string | undefined;
  /**
   * The condition under which the binding applies: a {@link Condition}, such
   * as one built from a typed key, or its text, as a user's rule gives it;
   * none means always.
   */
  readonly when?: string | Condition | undefined;
  /**
   * The arguments the command runs with.
   */
  readonly args?: unknown;
}

/**
 * A phrase's forms by plural category, as `Intl.PluralRules` names them.
 *
 * @example
 * ```ts
 * import { type IPluralPhrase, PluralPhrase } from "@noldova/code.editor";
 *
 * const lines: IPluralPhrase = new PluralPhrase("{count} lines", undefined, "{count} line");
 * ```
 */
export interface IPluralPhrase {
  /**
   * The form for every other count, and for any category without its own
   * form.
   */
  readonly other: string;
  /**
   * The form for the "zero" category, where the language has one.
   */
  readonly zero?: string | undefined;
  /**
   * The form for the "one" category.
   */
  readonly one?: string | undefined;
  /**
   * The form for the "two" category.
   */
  readonly two?: string | undefined;
  /**
   * The form for the "few" category.
   */
  readonly few?: string | undefined;
  /**
   * The form for the "many" category.
   */
  readonly many?: string | undefined;
}

/**
 * A value a condition can hold.
 */
export type ConditionValue = boolean | string | number;

/**
 * A phrase's text: one string, or forms by plural category.
 *
 * @remarks
 * `{name}` in the text places the value of that name.
 */
export type PhraseText = string | IPluralPhrase;

/**
 * A key binding rule: a command, the key that runs it, and when.
 *
 * @remarks
 * See {@link IKeyBindingRule} for the key text, the removal rules and the
 * condition.
 */
export declare class KeyBindingRule implements IKeyBindingRule {
  /**
   * The command's id, or `-` and the id for a user rule that removes
   * defaults.
   */
  readonly command: string;
  /**
   * The key, if given.
   */
  readonly key: string | undefined;
  /**
   * The condition under which the binding applies, if given.
   */
  readonly when: string | Condition | undefined;
  /**
   * The arguments the command runs with, if given.
   */
  readonly args: unknown;
  /**
   * Creates a key binding rule.
   *
   * @param command The command's id.
   * @param key The key: one chord, or two separated by a space.
   * @param when The condition, or its text; none means always.
   * @param args The arguments the command runs with.
   * @example
   * ```ts
   * import { KeyBindingRule } from "@noldova/code.editor";
   *
   * const undo = new KeyBindingRule("editor.undo", "mod+z");
   * const indent = new KeyBindingRule("editor.indent", "tab", "editorTabIndents");
   * ```
   */
  constructor(command: string, key?: string, when?: string | Condition, args?: unknown);
}

/**
 * A phrase's forms by plural category, as a class.
 *
 * @remarks
 * The `other` form comes first, since it is the only one required; see
 * {@link IPluralPhrase}.
 */
export declare class PluralPhrase implements IPluralPhrase {
  /**
   * The form for every other count, and for any category without its own
   * form.
   */
  readonly other: string;
  /**
   * The form for the "zero" category, if given.
   */
  readonly zero: string | undefined;
  /**
   * The form for the "one" category, if given.
   */
  readonly one: string | undefined;
  /**
   * The form for the "two" category, if given.
   */
  readonly two: string | undefined;
  /**
   * The form for the "few" category, if given.
   */
  readonly few: string | undefined;
  /**
   * The form for the "many" category, if given.
   */
  readonly many: string | undefined;
  /**
   * Creates a plural phrase.
   *
   * @param other The form for every other count.
   * @param zero The "zero" form.
   * @param one The "one" form.
   * @param two The "two" form.
   * @param few The "few" form.
   * @param many The "many" form.
   * @example
   * ```ts
   * import { PluralPhrase } from "@noldova/code.editor";
   *
   * const lines = new PluralPhrase("{count} lines", undefined, "{count} line");
   * ```
   */
  constructor(other: string, zero?: string, one?: string, two?: string, few?: string, many?: string);
}

/**
 * What a command runs against: one editor at one moment.
 *
 * @example
 * ```ts
 * import { CommandContext, ConditionValues, CoreContribution, EditorFeatures, EditorFeatureSet, EditorRegistries, EditorSession, TextDocument,
 *   UndoHistory } from "@noldova/code.editor";
 *
 * const registries = new EditorRegistries();
 * registries.add(new CoreContribution());
 * const document = TextDocument.fromText("text");
 * const features = new EditorFeatureSet();
 * features.provide(EditorFeatures.session, new EditorSession(document, new UndoHistory(document)));
 * const context = new CommandContext(registries, new ConditionValues(registries.conditions), features, null, Date.now(), 30);
 * registries.commands.run("editor.selectAll", context);
 * ```
 */
export declare class CommandContext {
  /**
   * The registries the editor uses.
   */
  readonly registries: EditorRegistries;
  /**
   * The editor's current conditions.
   */
  readonly conditions: ConditionValues;
  /**
   * The editor's parts, which commands reach through {@link CommandContext.feature}.
   */
  readonly features: EditorFeatureSet;
  /**
   * The id of the language the editor's document is in, for per-language
   * settings; null when it has none.
   */
  readonly languageId: string | null;
  /**
   * The input's time in milliseconds, which groups undo steps.
   */
  readonly time: number;
  /**
   * How many lines one page of the view shows, for page moves.
   */
  readonly pageLines: number;
  /**
   * Creates a context.
   *
   * @param registries The registries the editor uses.
   * @param conditions The editor's current conditions.
   * @param features The editor's parts.
   * @param languageId The document's language id, or null.
   * @param time The input's time in milliseconds.
   * @param pageLines How many lines one page shows.
   * @example
   * ```ts
   * import { CommandContext, ConditionValues, EditorFeatureSet, EditorRegistries } from "@noldova/code.editor";
   *
   * const registries = new EditorRegistries();
   * const context = new CommandContext(registries, new ConditionValues(registries.conditions), new EditorFeatureSet(), "python", 0, 30);
   * ```
   */
  constructor(registries: EditorRegistries, conditions: ConditionValues, features: EditorFeatureSet, languageId: string | null, time: number, pageLines: number);

  /**
   * The editor's part for a feature.
   *
   * @param feature The feature, such as {@link EditorFeatures.session}.
   * @returns The part, or null when this editor has none.
   * @example
   * ```ts
   * import { type CommandContext, EditorFeatures } from "@noldova/code.editor";
   *
   * declare const context: CommandContext;
   * context.feature(EditorFeatures.session)?.selectAll();
   * ```
   */
  feature<T>(feature: EditorFeature<T>): T | null;

  /**
   * A setting's value for the editor's language.
   *
   * @param setting The declared setting.
   * @returns The value {@link SettingRegistry.get} gives for {@link CommandContext.languageId}.
   * @example
   * ```ts
   * import { type CommandContext, CoreSettings } from "@noldova/code.editor";
   *
   * declare const context: CommandContext;
   * context.setting(CoreSettings.indentSize); // 2 unless set
   * ```
   */
  setting<T>(setting: Setting<T>): T;
}

/**
 * A parsed `when` text that a key binding tests.
 *
 * @remarks
 * The text is names, `true`, `false`, numbers and `'quoted text'`, joined by
 * `!`, `&&`, `||`, `==`, `!=` and parentheses; `&&` binds tighter than `||`.
 * After `==` or `!=` a bare word is text, as in `language == python`. A name
 * no editor set reads as its declared default, or false. False, zero and
 * empty text don't hold; any other value does. Empty text always holds.
 *
 * @example
 * ```ts
 * import { Condition, ConditionRegistry, ConditionValues } from "@noldova/code.editor";
 *
 * Condition.parse("findVisible && !editorReadOnly").holds(new ConditionValues(new ConditionRegistry())); // false
 * ```
 */
export declare class Condition {
  /**
   * The condition that always holds.
   */
  static readonly always: Condition;
  /**
   * The condition's text.
   */
  readonly text: string;

  /**
   * Reads a condition.
   *
   * @param text The condition's text.
   * @returns The condition.
   * @throws {ConditionSyntaxException} When the text can't be read.
   * @example
   * ```ts
   * import { Condition } from "@noldova/code.editor";
   *
   * const condition = Condition.parse("editorHasSelection || editorHasMultipleSelections");
   * ```
   */
  static parse(text: string): Condition;

  /**
   * Makes the condition that a key's value is true: neither false, zero,
   * `NaN` nor the empty string.
   *
   * @param key The key to read.
   * @returns A condition whose text is the key's name.
   * @example
   * ```ts
   * import { Condition, CoreConditions } from "@noldova/code.editor";
   *
   * Condition.has(CoreConditions.readOnly).text; // "editorReadOnly"
   * ```
   */
  static has(key: ConditionKey<ConditionValue>): Condition;

  /**
   * Makes the condition that a key's value equals a value.
   *
   * @param key The key to read.
   * @param value The value it must have.
   * @returns A condition whose text compares the key with `==`, a string value
   * in single quotes.
   * @example
   * ```ts
   * import { Condition, CoreConditions } from "@noldova/code.editor";
   *
   * Condition.equals(CoreConditions.platform, "mac").text; // "platform == 'mac'"
   * ```
   */
  static equals<T extends ConditionValue>(key: ConditionKey<T>, value: T): Condition;

  /**
   * Makes the condition that a key's value differs from a value.
   *
   * @param key The key to read.
   * @param value The value it must not have.
   * @returns A condition whose text compares the key with `!=`, a string value
   * in single quotes.
   * @example
   * ```ts
   * import { Condition, CoreConditions } from "@noldova/code.editor";
   *
   * Condition.notEquals(CoreConditions.platform, "mac").text; // "platform != 'mac'"
   * ```
   */
  static notEquals<T extends ConditionValue>(key: ConditionKey<T>, value: T): Condition;

  /**
   * Tests the condition against an editor's values.
   *
   * @param values The values.
   * @returns True when it holds.
   * @example
   * ```ts
   * import { Condition, ConditionKey, ConditionRegistry, ConditionValues } from "@noldova/code.editor";
   *
   * const values = new ConditionValues(new ConditionRegistry());
   * values.set(new ConditionKey<boolean>("findVisible", false, "The find panel is open."), true);
   * Condition.parse("findVisible").holds(values); // true
   * ```
   */
  holds(values: ConditionValues): boolean;
}

/**
 * A named fact a key binding can test, declared by the package that sets it.
 *
 * @example
 * ```ts
 * import { ConditionKey } from "@noldova/code.editor";
 *
 * const inDiffEditor = new ConditionKey<boolean>("inDiffEditor", false, "The editor is one side of a diff.");
 * ```
 */
export declare class ConditionKey<T extends ConditionValue> {
  /**
   * The name a condition's text uses.
   */
  readonly name: string;
  /**
   * The value an editor that never set it has.
   */
  readonly defaultValue: T;
  /**
   * What the fact means, for documentation and settings screens.
   */
  readonly description: string;
  /**
   * Creates a key.
   *
   * @param name The name a condition's text uses.
   * @param defaultValue The value before an editor sets one.
   * @param description What the fact means.
   * @example
   * ```ts
   * import { ConditionKey } from "@noldova/code.editor";
   *
   * const language = new ConditionKey<string>("editorLanguage", "", "The document's language id.");
   * ```
   */
  constructor(name: string, defaultValue: T, description: string);
}

/**
 * A typed slot for one of an editor's parts, so a command can reach it.
 *
 * @remarks
 * The core fills {@link EditorFeatures.session}; a view package declares
 * its own features for its panels and views.
 *
 * @example
 * ```ts
 * import { EditorFeature } from "@noldova/code.editor";
 *
 * const zoom = new EditorFeature<number>("zoom");
 * ```
 */
export declare class EditorFeature<T> {
  /**
   * The feature's name, for messages.
   */
  readonly name: string;
  /**
   * Creates a feature.
   *
   * @param name The feature's name.
   * @example
   * ```ts
   * import { EditorFeature } from "@noldova/code.editor";
   *
   * const feature = new EditorFeature<number>("zoom");
   * ```
   */
  constructor(name: string);

  /**
   * The part an owner provided for this feature.
   *
   * @param owner The owner, usually an {@link EditorFeatureSet}.
   * @returns The part, or null when the owner provided none.
   * @example
   * ```ts
   * import { EditorFeature, EditorFeatureSet } from "@noldova/code.editor";
   *
   * new EditorFeature<number>("zoom").valueIn(new EditorFeatureSet()); // null
   * ```
   */
  valueIn(owner: object): T | null;

  /**
   * Stores an owner's part; {@link EditorFeatureSet.provide} calls it.
   *
   * @param owner The owner.
   * @param value The part.
   * @example
   * ```ts
   * import { EditorFeature, EditorFeatureSet } from "@noldova/code.editor";
   *
   * new EditorFeature<number>("zoom").provide(new EditorFeatureSet(), 2);
   * ```
   */
  provide(owner: object, value: T): void;

  /**
   * Forgets an owner's part.
   *
   * @param owner The owner.
   * @example
   * ```ts
   * import { EditorFeature, EditorFeatureSet } from "@noldova/code.editor";
   *
   * new EditorFeature<number>("zoom").withdraw(new EditorFeatureSet());
   * ```
   */
  withdraw(owner: object): void;
}

/**
 * One editor's parts, by feature.
 *
 * @example
 * ```ts
 * import { EditorFeatures, EditorFeatureSet, EditorSession, TextDocument, UndoHistory } from "@noldova/code.editor";
 *
 * const document = TextDocument.fromText("");
 * const features = new EditorFeatureSet();
 * features.provide(EditorFeatures.session, new EditorSession(document, new UndoHistory(document)));
 * ```
 */
export declare class EditorFeatureSet {
  /**
   * Provides the editor's part for a feature, replacing any earlier one.
   *
   * @param feature The feature.
   * @param value The part.
   * @returns A registration whose disposal withdraws the part.
   * @example
   * ```ts
   * import { EditorFeature, EditorFeatureSet } from "@noldova/code.editor";
   *
   * using zoom = new EditorFeatureSet().provide(new EditorFeature<number>("zoom"), 2);
   * ```
   */
  provide<T>(feature: EditorFeature<T>, value: T): Disposable;

  /**
   * The editor's part for a feature.
   *
   * @param feature The feature.
   * @returns The part, or null when none was provided.
   * @example
   * ```ts
   * import { EditorFeatures, EditorFeatureSet } from "@noldova/code.editor";
   *
   * new EditorFeatureSet().get(EditorFeatures.session); // null
   * ```
   */
  get<T>(feature: EditorFeature<T>): T | null;
}

/**
 * A declared setting: its id, default and the values it accepts.
 *
 * @remarks
 * Settings are read from JSON data, so each one checks a value's type and
 * range; a value it doesn't accept is skipped for the next one down.
 *
 * @example
 * ```ts
 * import { Setting } from "@noldova/code.editor";
 *
 * const contextLines = Setting.integer("diff.contextLines", 3, "Unchanged lines shown around each change.", 0);
 * ```
 */
export declare class Setting<T> {
  /**
   * The setting's id, dotted, such as `"editor.indentSize"`.
   */
  readonly id: string;
  /**
   * The value when nothing sets one.
   */
  readonly defaultValue: T;
  /**
   * What the setting does, for settings screens.
   */
  readonly description: string;

  /**
   * Declares a setting that is true or false.
   *
   * @param id The setting's id.
   * @param defaultValue Its default.
   * @param description What it does.
   * @returns The setting.
   * @example
   * ```ts
   * import { Setting } from "@noldova/code.editor";
   *
   * const wrap = Setting.boolean("editor.wordWrap", false, "Whether long lines wrap.");
   * ```
   */
  static boolean(id: string, defaultValue: boolean, description: string): Setting<boolean>;

  /**
   * Declares a setting that is a finite number within a range.
   *
   * @param id The setting's id.
   * @param defaultValue Its default.
   * @param description What it does.
   * @param minimum The smallest value accepted; no limit by default.
   * @param maximum The largest value accepted; no limit by default.
   * @returns The setting.
   * @example
   * ```ts
   * import { Setting } from "@noldova/code.editor";
   *
   * const lineHeight = Setting.number("editor.lineHeight", 1.5, "Line height in em.", 1, 3);
   * ```
   */
  static number(id: string, defaultValue: number, description: string, minimum?: number, maximum?: number): Setting<number>;

  /**
   * Declares a setting that is a whole number within a range.
   *
   * @param id The setting's id.
   * @param defaultValue Its default.
   * @param description What it does.
   * @param minimum The smallest value accepted; no limit by default.
   * @param maximum The largest value accepted; no limit by default.
   * @returns The setting.
   * @example
   * ```ts
   * import { Setting } from "@noldova/code.editor";
   *
   * const tabSize = Setting.integer("editor.tabSize", 4, "Columns a tab takes.", 1, 16);
   * ```
   */
  static integer(id: string, defaultValue: number, description: string, minimum?: number, maximum?: number): Setting<number>;

  /**
   * Declares a setting that is any text.
   *
   * @param id The setting's id.
   * @param defaultValue Its default.
   * @param description What it does.
   * @returns The setting.
   * @example
   * ```ts
   * import { Setting } from "@noldova/code.editor";
   *
   * const font = Setting.string("editor.fontFamily", "monospace", "The editor's font.");
   * ```
   */
  static string(id: string, defaultValue: string, description: string): Setting<string>;

  /**
   * Declares a setting that is one of a fixed set of texts.
   *
   * @param id The setting's id.
   * @param defaultValue Its default, one of the choices.
   * @param choices The texts accepted.
   * @param description What it does.
   * @returns The setting.
   * @example
   * ```ts
   * import { Setting } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * const layout = Setting.choice<"sideBySide" | "inline">("diff.layout", "sideBySide", new List<"sideBySide" | "inline">(["sideBySide", "inline"]), "How a diff is shown.");
   * ```
   */
  static choice<T extends string>(id: string, defaultValue: T, choices: IReadOnlyList<T>, description: string): Setting<T>;

  /**
   * Reads a JSON value as this setting's value.
   *
   * @param value The value.
   * @returns The value, or null when the setting doesn't accept it.
   * @example
   * ```ts
   * import { CoreSettings } from "@noldova/code.editor";
   *
   * CoreSettings.indentSize.read("4"); // null
   * CoreSettings.indentSize.read(4); // 4
   * ```
   */
  read(value: unknown): T | null;
}

/**
 * Background jobs by name, so a worker script finds the job a request names.
 *
 * @remarks
 * A worker can't receive the page's registries, so its script fills a
 * registry of its own with the jobs it serves.
 *
 * @example
 * ```ts
 * import { BackgroundJobRegistry, type IBackgroundJob } from "@noldova/code.editor";
 *
 * declare const job: IBackgroundJob<string, number>;
 * const jobs = new BackgroundJobRegistry();
 * jobs.register(job);
 * ```
 */
export declare class BackgroundJobRegistry {
  /**
   * Makes a registry, which looks in its parent for a name it doesn't hold.
   *
   * @param parent The registry it adds to; none when not given.
   * @example
   * ```ts
   * import { BackgroundJobRegistry } from "@noldova/code.editor";
   *
   * new BackgroundJobRegistry(new BackgroundJobRegistry());
   * ```
   */
  constructor(parent?: BackgroundJobRegistry | null);

  /**
   * Adds a job.
   *
   * @param job The job, found by its name.
   * @returns What removes it again.
   * @throws {RegistrationExistsException} The registry already holds a job of
   * that name.
   * @example
   * ```ts
   * import { BackgroundJobRegistry, type IBackgroundJob } from "@noldova/code.editor";
   *
   * declare const job: IBackgroundJob<string, number>;
   * using registration = new BackgroundJobRegistry().register(job);
   * ```
   */
  register<TInput, TOutput>(job: IBackgroundJob<TInput, TOutput>): Disposable;

  /**
   * Finds a job.
   *
   * @param name The job's name.
   * @returns The job, or null when neither the registry nor a parent holds it.
   * @example
   * ```ts
   * import { BackgroundJobRegistry } from "@noldova/code.editor";
   *
   * new BackgroundJobRegistry().find("sample.sum"); // null
   * ```
   */
  find(name: string): IBackgroundJob<unknown, unknown> | null;

  /**
   * Gets a job.
   *
   * @param name The job's name.
   * @returns The job.
   * @throws {RegistrationMissingException} Neither the registry nor a parent
   * holds it.
   * @example
   * ```ts
   * import type { BackgroundJobRegistry } from "@noldova/code.editor";
   *
   * declare const jobs: BackgroundJobRegistry;
   * jobs.get("sample.sum");
   * ```
   */
  get(name: string): IBackgroundJob<unknown, unknown>;

  /**
   * The names of the jobs it and its parents hold.
   *
   * @returns The names, a parent's first.
   * @example
   * ```ts
   * import { BackgroundJobRegistry } from "@noldova/code.editor";
   *
   * new BackgroundJobRegistry().names().count(); // 0
   * ```
   */
  names(): IReadOnlyList<string>;
}

/**
 * Diff algorithms by id, of which a diff uses the one its setting names.
 *
 * @example
 * ```ts
 * import { DiffAlgorithmRegistry, type IDiffAlgorithm } from "@noldova/code.editor";
 *
 * declare const algorithm: IDiffAlgorithm;
 * const algorithms = new DiffAlgorithmRegistry();
 * algorithms.register(algorithm);
 * algorithms.current().id;
 * ```
 */
export declare class DiffAlgorithmRegistry {
  /**
   * Makes a registry, which looks in its parent for an id it doesn't hold.
   *
   * @param parent The registry it adds to; none when not given.
   * @example
   * ```ts
   * import { DiffAlgorithmRegistry } from "@noldova/code.editor";
   *
   * new DiffAlgorithmRegistry(new DiffAlgorithmRegistry());
   * ```
   */
  constructor(parent?: DiffAlgorithmRegistry | null);

  /**
   * Adds an algorithm.
   *
   * @param algorithm The algorithm, found by its id.
   * @returns What removes it again.
   * @throws {RegistrationExistsException} The registry already holds an
   * algorithm of that id.
   * @example
   * ```ts
   * import { DiffAlgorithmRegistry, type IDiffAlgorithm } from "@noldova/code.editor";
   *
   * declare const algorithm: IDiffAlgorithm;
   * using registration = new DiffAlgorithmRegistry().register(algorithm);
   * ```
   */
  register(algorithm: IDiffAlgorithm): Disposable;

  /**
   * Finds an algorithm.
   *
   * @param id The algorithm's id.
   * @returns The algorithm, or null when neither the registry nor a parent
   * holds it.
   * @example
   * ```ts
   * import { DiffAlgorithmRegistry } from "@noldova/code.editor";
   *
   * new DiffAlgorithmRegistry().find("noldova.diff"); // null
   * ```
   */
  find(id: string): IDiffAlgorithm | null;

  /**
   * Gets an algorithm.
   *
   * @param id The algorithm's id.
   * @returns The algorithm.
   * @throws {RegistrationMissingException} Neither the registry nor a parent
   * holds it.
   * @example
   * ```ts
   * import type { DiffAlgorithmRegistry } from "@noldova/code.editor";
   *
   * declare const algorithms: DiffAlgorithmRegistry;
   * algorithms.get("noldova.diff");
   * ```
   */
  get(id: string): IDiffAlgorithm;

  /**
   * The ids of the algorithms it and its parents hold.
   *
   * @returns The ids, a parent's first.
   * @example
   * ```ts
   * import { DiffAlgorithmRegistry } from "@noldova/code.editor";
   *
   * new DiffAlgorithmRegistry().ids().count(); // 0
   * ```
   */
  ids(): IReadOnlyList<string>;

  /**
   * The algorithm to diff with.
   *
   * @param id The id a setting names, such as `diff.algorithm`'s; the last
   * registered when not given, empty or not held.
   * @returns The algorithm.
   * @throws {RegistrationMissingException} Neither the registry nor a parent
   * holds any algorithm.
   * @example
   * ```ts
   * import type { DiffAlgorithmRegistry } from "@noldova/code.editor";
   *
   * declare const algorithms: DiffAlgorithmRegistry;
   * algorithms.current("noldova.diff");
   * ```
   */
  current(id?: string | null): IDiffAlgorithm;
}

/**
 * Commands by id.
 *
 * @remarks
 * A child registry adds to its parent's and wins over it for the same id.
 *
 * @example
 * ```ts
 * import { CommandRegistry, type ICommand } from "@noldova/code.editor";
 *
 * class NoopCommand implements ICommand {
 *   public readonly id: string = "my.noop";
 *
 *   public run(): boolean {
 *     return true;
 *   }
 * }
 *
 * const commands = new CommandRegistry();
 * using registration = commands.register(new NoopCommand());
 * ```
 */
export declare class CommandRegistry {
  /**
   * Creates a registry.
   *
   * @param parent The registry whose commands this one adds to; none by default.
   * @example
   * ```ts
   * import { CommandRegistry } from "@noldova/code.editor";
   *
   * const editorCommands = new CommandRegistry(new CommandRegistry());
   * ```
   */
  constructor(parent?: CommandRegistry | null);

  /**
   * Registers a command.
   *
   * @param command The command.
   * @returns A registration whose disposal removes the command.
   * @throws {RegistrationExistsException} When this registry already holds
   * a command with the same id.
   * @example
   * ```ts
   * import { CommandRegistry, type ICommand } from "@noldova/code.editor";
   *
   * class NoopCommand implements ICommand {
   *   public readonly id: string = "my.noop";
   *
   *   public run(): boolean {
   *     return true;
   *   }
   * }
   *
   * new CommandRegistry().register(new NoopCommand());
   * ```
   */
  register(command: ICommand): Disposable;

  /**
   * Finds a command.
   *
   * @param id The command's id.
   * @returns The command, from this registry or a parent, or null.
   * @example
   * ```ts
   * import { CommandRegistry } from "@noldova/code.editor";
   *
   * new CommandRegistry().find("my.noop"); // null
   * ```
   */
  find(id: string): ICommand | null;

  /**
   * Gets a command.
   *
   * @param id The command's id.
   * @returns The command, from this registry or a parent.
   * @throws {RegistrationMissingException} When no registry holds it.
   * @example
   * ```ts
   * import { CommandRegistry, type ICommand } from "@noldova/code.editor";
   *
   * class NoopCommand implements ICommand {
   *   public readonly id: string = "my.noop";
   *
   *   public run(): boolean {
   *     return true;
   *   }
   * }
   *
   * const commands = new CommandRegistry();
   * commands.register(new NoopCommand());
   * commands.get("my.noop").id; // "my.noop"
   * ```
   */
  get(id: string): ICommand;

  /**
   * Runs a command by its id.
   *
   * @param id The command's id.
   * @param context The editor and moment it runs in.
   * @param args The arguments; null by default.
   * @returns What the command returns.
   * @throws {RegistrationMissingException} When no registry holds the id;
   * no other command runs instead.
   * @example
   * ```ts
   * import { type CommandContext, CommandRegistry } from "@noldova/code.editor";
   *
   * declare const context: CommandContext;
   * context.registries.commands.run("editor.selectAll", context);
   * ```
   */
  run(id: string, context: CommandContext, args?: unknown): boolean;

  /**
   * The ids of every command this registry and its parents hold.
   *
   * @returns The ids, the parents' first.
   * @example
   * ```ts
   * import { CommandRegistry } from "@noldova/code.editor";
   *
   * new CommandRegistry().ids().count(); // 0
   * ```
   */
  ids(): IReadOnlyList<string>;
}

/**
 * The condition names editors can set.
 *
 * @example
 * ```ts
 * import { ConditionKey, ConditionRegistry } from "@noldova/code.editor";
 *
 * new ConditionRegistry().register(new ConditionKey<boolean>("inDiffEditor", false, "The editor is one side of a diff."));
 * ```
 */
export declare class ConditionRegistry {
  /**
   * Creates a registry.
   *
   * @param parent The registry whose names this one adds to; none by default.
   * @example
   * ```ts
   * import { ConditionRegistry } from "@noldova/code.editor";
   *
   * const conditions = new ConditionRegistry();
   * ```
   */
  constructor(parent?: ConditionRegistry | null);

  /**
   * Declares a condition.
   *
   * @param key The condition's key.
   * @returns A registration whose disposal removes it.
   * @throws {RegistrationExistsException} When this registry already holds
   * the name.
   * @example
   * ```ts
   * import { ConditionRegistry, CoreConditions } from "@noldova/code.editor";
   *
   * new ConditionRegistry().register(CoreConditions.readOnly);
   * ```
   */
  register(key: ConditionKey<ConditionValue>): Disposable;

  /**
   * Finds a condition's key.
   *
   * @param name The condition's name.
   * @returns The key, or null.
   * @example
   * ```ts
   * import { ConditionRegistry } from "@noldova/code.editor";
   *
   * new ConditionRegistry().find("editorReadOnly"); // null
   * ```
   */
  find(name: string): ConditionKey<ConditionValue> | null;

  /**
   * The names this registry and its parents hold.
   *
   * @returns The names.
   * @example
   * ```ts
   * import { ConditionRegistry } from "@noldova/code.editor";
   *
   * new ConditionRegistry().names().count(); // 0
   * ```
   */
  names(): IReadOnlyList<string>;
}

/**
 * One editor's current condition values.
 *
 * @remarks
 * A name this set doesn't hold reads from its parent, then the declared
 * key's default, then false.
 *
 * @example
 * ```ts
 * import { ConditionValues, CoreConditions, EditorRegistries } from "@noldova/code.editor";
 *
 * const values = new ConditionValues(new EditorRegistries().conditions);
 * values.set(CoreConditions.tabIndents, true);
 * ```
 */
export declare class ConditionValues {
  /**
   * Creates an empty set of values.
   *
   * @param registry The registry whose declared defaults unset names read.
   * @param parent The values unset names read first; none by default.
   * @example
   * ```ts
   * import { ConditionRegistry, ConditionValues } from "@noldova/code.editor";
   *
   * const values = new ConditionValues(new ConditionRegistry());
   * ```
   */
  constructor(registry: ConditionRegistry, parent?: ConditionValues | null);

  /**
   * Sets a condition's value.
   *
   * @param key The condition's key.
   * @param value Its value.
   * @example
   * ```ts
   * import { ConditionRegistry, ConditionValues, CoreConditions } from "@noldova/code.editor";
   *
   * new ConditionValues(new ConditionRegistry()).set(CoreConditions.readOnly, true);
   * ```
   */
  set<T extends ConditionValue>(key: ConditionKey<T>, value: T): void;

  /**
   * Reads a condition's value.
   *
   * @param name The condition's name.
   * @returns The value set here or in a parent, else the declared default,
   * else false.
   * @example
   * ```ts
   * import { ConditionRegistry, ConditionValues } from "@noldova/code.editor";
   *
   * new ConditionValues(new ConditionRegistry()).get("anything"); // false
   * ```
   */
  get(name: string): ConditionValue;
}

/**
 * The core's built-in commands.
 *
 * @remarks
 * Moves are `editor.cursorLeft`, `editor.cursorRight`, `editor.cursorWordLeft`,
 * `editor.cursorWordRight`, `editor.cursorUp`, `editor.cursorDown`,
 * `editor.cursorPageUp`, `editor.cursorPageDown`, `editor.cursorHome`,
 * `editor.cursorEnd`, `editor.cursorLineStart`, which goes to column zero,
 * `editor.cursorTop` and `editor.cursorBottom`, each with
 * a `Select` twin, such as `editor.cursorLeftSelect`, that extends the
 * selection. The others are `editor.selectAll`, `editor.cancelSelection`,
 * `editor.deleteLeft`, `editor.deleteRight`, `editor.deleteWordLeft`,
 * `editor.deleteWordRight`, `editor.deleteAllLeft` and `editor.deleteAllRight`,
 * which delete to the line's start and end, `editor.newLine`, `editor.indent`,
 * `editor.outdent`, `editor.undo` and `editor.redo`. Each reaches the
 * editor's session through {@link EditorFeatures.session} and does nothing,
 * returning false, without one.
 *
 * @example
 * ```ts
 * import { CommandRegistry, CoreCommands } from "@noldova/code.editor";
 *
 * const commands = new CommandRegistry();
 * for (const command of CoreCommands.all)
 *   commands.register(command);
 * ```
 */
export declare class CoreCommands {
  /**
   * `editor.cursorLeft`: moves each caret one character left; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorLeft: IMoveCommand;
  /**
   * `editor.cursorWordLeft`: moves each caret to the start of the word before; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorWordLeft: IMoveCommand;
  /**
   * `editor.cursorRight`: moves each caret one character right; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorRight: IMoveCommand;
  /**
   * `editor.cursorWordRight`: moves each caret to the end of the word after; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorWordRight: IMoveCommand;
  /**
   * `editor.cursorUp`: moves each caret one line up; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorUp: IMoveCommand;
  /**
   * `editor.cursorDown`: moves each caret one line down; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorDown: IMoveCommand;
  /**
   * `editor.cursorPageUp`: moves each caret one page up; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorPageUp: IMoveCommand;
  /**
   * `editor.cursorPageDown`: moves each caret one page down; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorPageDown: IMoveCommand;
  /**
   * `editor.cursorHome`: moves each caret to the line's first text, then its start, as Home does; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorHome: IMoveCommand;
  /**
   * `editor.cursorEnd`: moves each caret to the line's end; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorEnd: IMoveCommand;
  /**
   * `editor.cursorLineStart`: moves each caret to column zero, before any indentation; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorLineStart: IMoveCommand;
  /**
   * `editor.cursorTop`: moves each caret to the document's start; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorTop: IMoveCommand;
  /**
   * `editor.cursorBottom`: moves each caret to the document's end; its {@link IMoveCommand.select} twin extends the selection.
   */
  static readonly cursorBottom: IMoveCommand;
  /**
   * `editor.selectAll`: Selects the whole document.
   */
  static readonly selectAll: ICommand;
  /**
   * `editor.cancelSelection`: Leaves one caret, at the primary selection's head; false when there is only that caret already.
   */
  static readonly cancelSelection: ICommand;
  /**
   * `editor.deleteLeft`: Deletes each selection, or the character before each caret.
   */
  static readonly deleteLeft: ICommand;
  /**
   * `editor.deleteRight`: Deletes each selection, or the character after each caret.
   */
  static readonly deleteRight: ICommand;
  /**
   * `editor.deleteWordLeft`: Deletes each selection, or the word before each caret.
   */
  static readonly deleteWordLeft: ICommand;
  /**
   * `editor.deleteWordRight`: Deletes each selection, or the word after each caret.
   */
  static readonly deleteWordRight: ICommand;
  /**
   * `editor.deleteAllLeft`: Deletes each selection, or the text back to each caret's line start.
   */
  static readonly deleteAllLeft: ICommand;
  /**
   * `editor.deleteAllRight`: Deletes each selection, or the text to each caret's line end.
   */
  static readonly deleteAllRight: ICommand;
  /**
   * `editor.newLine`: Breaks the line at each caret, keeping its indentation.
   */
  static readonly newLine: ICommand;
  /**
   * `editor.indent`: Indents, as Tab does.
   */
  static readonly indent: ICommand;
  /**
   * `editor.outdent`: Outdents, as Shift+Tab does.
   */
  static readonly outdent: ICommand;
  /**
   * `editor.undo`: Undoes the last step.
   */
  static readonly undo: ICommand;
  /**
   * `editor.redo`: Redoes the step last undone.
   */
  static readonly redo: ICommand;
  /**
   * Every built-in move, without its twin.
   */
  static readonly moves: IReadOnlyList<IMoveCommand>;
  /**
   * Every built-in command, each move followed by its twin.
   */
  static readonly all: IReadOnlyList<ICommand>;

  /**
   * The text one indent level is for the context's language: spaces as
   * {@link CoreSettings.indentSize} gives when {@link CoreSettings.insertSpaces}
   * is on, else a tab.
   *
   * @param context The context.
   * @returns The indent unit.
   * @example
   * ```ts
   * import { type CommandContext, CoreCommands } from "@noldova/code.editor";
   *
   * declare const context: CommandContext;
   * CoreCommands.indentUnit(context); // "  " by default
   * ```
   */
  static indentUnit(context: CommandContext): string;
}

/**
 * The core's built-in conditions.
 *
 * @example
 * ```ts
 * import { ConditionRegistry, ConditionValues, CoreConditions } from "@noldova/code.editor";
 *
 * new ConditionValues(new ConditionRegistry()).set(CoreConditions.hasSelection, true);
 * ```
 */
export declare class CoreConditions {
  /**
   * `editorReadOnly`: the editor refuses edits.
   */
  static readonly readOnly: ConditionKey<boolean>;
  /**
   * `editorHasSelection`: some selection is not empty.
   */
  static readonly hasSelection: ConditionKey<boolean>;
  /**
   * `editorHasMultipleSelections`: the editor has more than one selection.
   */
  static readonly hasMultipleSelections: ConditionKey<boolean>;
  /**
   * `editorTabIndents`: Tab and Shift+Tab indent and outdent instead of
   * moving focus.
   */
  static readonly tabIndents: ConditionKey<boolean>;
  /**
   * `platform`: the system the editor runs on, `mac`, `windows` or
   * `linux`, read from the runtime's platform name; a host may set another.
   * On `mac`, `mod` in a key means Command; elsewhere, Control.
   */
  static readonly platform: ConditionKey<string>;
  /**
   * Every built-in condition.
   */
  static readonly all: IReadOnlyList<ConditionKey<ConditionValue>>;
  /**
   * The condition that the editor runs on a Mac: {@link CoreConditions.platform} is `mac`.
   */
  static readonly onMac: Condition;
  /**
   * The condition that the editor runs on Windows or Linux: {@link CoreConditions.platform} isn't `mac`.
   */
  static readonly offMac: Condition;
}

/**
 * The core's contribution: its commands, conditions, settings, default key
 * bindings, with a rule per platform where Mac's keys differ, and its built-in token types and
 * modifiers, as {@link BuiltInTokenTypes} lists them.
 *
 * @remarks
 * Home and End go to the line's start and end everywhere; Control with them
 * goes to the document's start and end on Windows and Linux only, and
 * Command with Up and Down does that on a Mac.
 *
 * A Mac also has its text system's keys: Command with Backspace and Delete
 * deletes to the line's start and end, and Control with A and E goes to the
 * line's start and end, with K deletes to the line's end, with F, B, N and P
 * moves right, left, down and up, and with D and H deletes right and left.
 *
 * @example
 * ```ts
 * import { CoreContribution, EditorRegistries } from "@noldova/code.editor";
 *
 * const registries = new EditorRegistries();
 * registries.add(new CoreContribution());
 * ```
 */
export declare class CoreContribution implements IEditorContribution {
  /**
   * `"noldova.code.editor"`.
   */
  readonly id: string;

  /**
   * Registers the core's entries.
   *
   * @param registries The set to register them in.
   * @example
   * ```ts
   * import { CoreContribution, EditorRegistries } from "@noldova/code.editor";
   *
   * new CoreContribution().contribute(new EditorRegistries());
   * ```
   */
  contribute(registries: EditorRegistries): void;
}

/**
 * The core's built-in settings.
 *
 * @example
 * ```ts
 * import { CoreSettings, EditorRegistries } from "@noldova/code.editor";
 *
 * const registries = new EditorRegistries();
 * registries.settings.setUserValues({ "[go]": { "editor.insertSpaces": false } });
 * ```
 */
export declare class CoreSettings {
  /**
   * `editor.indentSize`, 2: the spaces one indent level inserts, 1 to 16.
   */
  static readonly indentSize: Setting<number>;
  /**
   * `editor.insertSpaces`, true: whether an indent inserts spaces or a tab.
   */
  static readonly insertSpaces: Setting<boolean>;
  /**
   * `editor.undoGroupMilliseconds`, 500: how far apart typing or deleting
   * may be and still undo as one step.
   */
  static readonly undoGroupMilliseconds: Setting<number>;
  /**
   * `editor.undoLimit`, 10,000: the most undo steps kept.
   */
  static readonly undoLimit: Setting<number>;
  /**
   * Every built-in setting.
   */
  static readonly all: IReadOnlyList<Setting<unknown>>;
}

/**
 * The core's features.
 */
export declare class EditorFeatures {
  /**
   * The editor's {@link EditorSession}, which the core's commands edit.
   */
  static readonly session: EditorFeature<EditorSession>;
}

/**
 * The registries an editor uses: commands, key bindings, conditions,
 * settings and phrases.
 *
 * @remarks
 * An app keeps one set for all its editors; each editor takes a child set
 * whose entries add to the app's and win over them.
 *
 * @example
 * ```ts
 * import { CoreContribution, EditorRegistries } from "@noldova/code.editor";
 *
 * const app = new EditorRegistries();
 * app.add(new CoreContribution());
 * const editor = new EditorRegistries(app);
 * ```
 */
export declare class EditorRegistries {
  /**
   * The set this one adds to, or null.
   */
  readonly parent: EditorRegistries | null;
  /**
   * The commands.
   */
  readonly commands: CommandRegistry;
  /**
   * The key bindings.
   */
  readonly keyBindings: KeyBindingRegistry;
  /**
   * The condition names.
   */
  readonly conditions: ConditionRegistry;
  /**
   * The settings.
   */
  readonly settings: SettingRegistry;
  /**
   * The phrases.
   */
  readonly phrases: PhraseRegistry;
  /**
   * The languages.
   */
  readonly languages: LanguageRegistry;
  /**
   * The highlighters, which make each language's tokenizer with this set's
   * settings.
   */
  readonly highlighters: HighlighterRegistry;
  /**
   * The token types and modifiers.
   */
  readonly tokenTypes: TokenTypeRegistry;
  /**
   * The diff algorithms.
   */
  readonly diffAlgorithms: DiffAlgorithmRegistry;
  /**
   * The background jobs.
   */
  readonly backgroundJobs: BackgroundJobRegistry;
  /**
   * Creates a set.
   *
   * @param parent The set this one adds to; none by default.
   * @example
   * ```ts
   * import { EditorRegistries } from "@noldova/code.editor";
   *
   * const registries = new EditorRegistries();
   * ```
   */
  constructor(parent?: EditorRegistries | null);

  /**
   * Adds contributions in order, skipping any whose id this set or a parent
   * already added.
   *
   * @param contributions The contributions.
   * @example
   * ```ts
   * import { CoreContribution, EditorRegistries } from "@noldova/code.editor";
   *
   * new EditorRegistries().add(new CoreContribution());
   * ```
   */
  add(...contributions: readonly IEditorContribution[]): void;

  /**
   * Whether this set or a parent added a contribution.
   *
   * @param id The contribution's id.
   * @returns True when added.
   * @example
   * ```ts
   * import { EditorRegistries } from "@noldova/code.editor";
   *
   * new EditorRegistries().has("noldova.code.editor"); // false
   * ```
   */
  has(id: string): boolean;
}

/**
 * Key bindings as data: each package's defaults, and the user's own rules,
 * which win.
 *
 * @remarks
 * For a press, the user's rules come first, last first, then the defaults,
 * the last-added source first and each source's last rule first, leaving
 * out defaults a user `-command` rule removes and rules whose condition
 * doesn't hold. A child registry's rules come before its parent's.
 *
 * @example
 * ```ts
 * import { EditorRegistries, KeyBindingRule } from "@noldova/code.editor";
 * import { List } from "@noldova/context.collections";
 *
 * const registries = new EditorRegistries();
 * registries.keyBindings.setUserRules(new List([new KeyBindingRule("editor.deleteRight", "ctrl+d")]));
 * ```
 */
export declare class KeyBindingRegistry {
  /**
   * Creates a registry.
   *
   * @param parent The registry whose rules this one's come before; none by default.
   * @example
   * ```ts
   * import { KeyBindingRegistry } from "@noldova/code.editor";
   *
   * const keyBindings = new KeyBindingRegistry();
   * ```
   */
  constructor(parent?: KeyBindingRegistry | null);

  /**
   * Adds a package's default rules.
   *
   * @param source The package's name.
   * @param rules The rules.
   * @returns A registration whose disposal removes them.
   * @throws {KeySyntaxException} When a rule's key text can't be read.
   * @throws {ConditionSyntaxException} When a rule's condition can't be read.
   * @example
   * ```ts
   * import { KeyBindingRegistry, KeyBindingRule } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * new KeyBindingRegistry().addDefaults("my.package", new List([new KeyBindingRule("my.next", "alt+down")]));
   * ```
   */
  addDefaults(source: string, rules: IReadOnlyList<IKeyBindingRule>): Disposable;

  /**
   * Replaces the user's rules.
   *
   * @param rules The user's rules.
   * @throws {KeySyntaxException} When a rule's key text can't be read.
   * @throws {ConditionSyntaxException} When a rule's condition can't be read.
   * @example
   * ```ts
   * import { KeyBindingRegistry, KeyBindingRule } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   *
   * new KeyBindingRegistry().setUserRules(new List([new KeyBindingRule("-editor.redo")]));
   * ```
   */
  setUserRules(rules: IReadOnlyList<IKeyBindingRule>): void;

  /**
   * The rules a press matches, best first.
   *
   * @param press The press.
   * @param conditions The editor's condition values, `platform` among them.
   * @returns The rules.
   * @example
   * ```ts
   * import { ConditionValues, CoreConditions, CoreContribution, EditorRegistries, KeyPress } from "@noldova/code.editor";
   *
   * const registries = new EditorRegistries();
   * registries.add(new CoreContribution());
   * const conditions = new ConditionValues(registries.conditions);
   * conditions.set(CoreConditions.platform, "mac");
   * registries.keyBindings.matches(new KeyPress("z", "KeyZ", false, false, false, true), conditions).firstOrDefault()?.command; // "editor.undo"
   * ```
   */
  matches(press: KeyPress, conditions: ConditionValues): IReadOnlyList<IKeyBindingRule>;

  /**
   * Runs the commands a press matches, in order, until one returns true;
   * a rule whose command no registry holds is skipped.
   *
   * @param press The press.
   * @param context The editor and moment the commands run in.
   * @returns True when a command handled the press.
   * @example
   * ```ts
   * import { type CommandContext, KeyPress } from "@noldova/code.editor";
   *
   * declare const context: CommandContext;
   * context.registries.keyBindings.dispatch(new KeyPress("a", "KeyA", false, true, false, false), context);
   * ```
   */
  dispatch(press: KeyPress, context: CommandContext): boolean;

  /**
   * The rules whose key a press completes after the chords already pressed,
   * best first.
   *
   * @param pressed The chords of a pending sequence, or none.
   * @param press The press.
   * @param conditions The editor's condition values, `platform` among them.
   * @returns The rules; with no chords pressed, the single-chord rules
   * {@link KeyBindingRegistry.matches} gives.
   */
  completing(pressed: IReadOnlyList<KeyChord>, press: KeyPress, conditions: ConditionValues): IReadOnlyList<IKeyBindingRule>;

  /**
   * The chord a press adds to a pending sequence when the best rule whose key
   * it goes on with has more chords to come.
   *
   * @param pressed The chords of a pending sequence, or none.
   * @param press The press.
   * @param conditions The editor's condition values, `platform` among them.
   * @returns The rule's chord for the press, or null when no longer rule
   * goes on with it.
   */
  continuing(pressed: IReadOnlyList<KeyChord>, press: KeyPress, conditions: ConditionValues): KeyChord | null;

  /**
   * Runs the commands a press completes after the chords already pressed,
   * as {@link KeyBindingRegistry.dispatch} does for one chord.
   *
   * @param pressed The chords of a pending sequence, or none.
   * @param press The press.
   * @param context The editor and moment the commands run in.
   * @returns True when a command handled the press.
   */
  dispatchAfter(pressed: IReadOnlyList<KeyChord>, press: KeyPress, context: CommandContext): boolean;

  /**
   * The key text of the best rule for a command, for menus and tooltips.
   *
   * @param command The command's id.
   * @param conditions The values the rule's condition must hold for,
   * `platform` among them.
   * @returns The key text as the rule writes it, or null.
   * @example
   * ```ts
   * import { ConditionValues, CoreConditions, CoreContribution, EditorRegistries } from "@noldova/code.editor";
   *
   * const registries = new EditorRegistries();
   * registries.add(new CoreContribution());
   * const conditions = new ConditionValues(registries.conditions);
   * conditions.set(CoreConditions.platform, "mac");
   * registries.keyBindings.keyOf("editor.cursorWordLeft", conditions); // "alt+left"
   * ```
   */
  keyOf(command: string, conditions: ConditionValues): string | null;
}

/**
 * Every phrase an editor shows, by key and locale, with plural forms.
 *
 * @remarks
 * A phrase is looked up in the locale, then its language, then `"en"`,
 * across this registry and its parents; a key no locale has formats as
 * itself. A plural phrase picks its form by the `count` value through
 * `Intl.PluralRules` for the locale it was found in, and numbers are placed
 * in that locale's format.
 *
 * @example
 * ```ts
 * import { PhraseRegistry, PluralPhrase } from "@noldova/code.editor";
 *
 * const phrases = new PhraseRegistry();
 * phrases.add("en", { "lines": new PluralPhrase("{count} lines", undefined, "{count} line") });
 * phrases.format("lines", { count: 3 }); // "3 lines"
 * ```
 */
export declare class PhraseRegistry {
  /**
   * Creates a registry.
   *
   * @param parent The registry whose phrases and locale this one falls back
   * to; none by default.
   * @example
   * ```ts
   * import { PhraseRegistry } from "@noldova/code.editor";
   *
   * const phrases = new PhraseRegistry();
   * ```
   */
  constructor(parent?: PhraseRegistry | null);

  /**
   * The locale phrases are looked up in first: the one set here, else the
   * parent's, else `"en"`.
   */
  get locale(): string;
  set locale(locale: string);

  /**
   * Adds phrases for a locale; later ones win for the same key.
   *
   * @param locale The locale, such as `"en"` or `"de-CH"`.
   * @param phrases The phrases by key.
   * @returns A registration whose disposal removes them.
   * @example
   * ```ts
   * import { PhraseRegistry } from "@noldova/code.editor";
   *
   * new PhraseRegistry().add("de", { "find.close": "Schließen" });
   * ```
   */
  add(locale: string, phrases: Readonly<Record<string, PhraseText>>): Disposable;

  /**
   * Formats a phrase.
   *
   * @param key The phrase's key.
   * @param values The values to place, by name; none by default. A name
   * without a value stays as written.
   * @returns The text.
   * @example
   * ```ts
   * import { PhraseRegistry } from "@noldova/code.editor";
   *
   * const phrases = new PhraseRegistry();
   * phrases.add("en", { "match": "Match {index} of {count}" });
   * phrases.format("match", { index: 2, count: 7 }); // "Match 2 of 7"
   * ```
   */
  format(key: string, values?: Readonly<Record<string, string | number>>): string;
}

/**
 * Declared settings and the values a user and languages give them.
 *
 * @remarks
 * A setting reads, in order: the user's value for the language, a
 * language's default, the user's value, then its declared default, skipping
 * values it doesn't accept. Per-language values sit under `"[languageId]"`.
 * A child registry's values come before its parent's at each step.
 *
 * @example
 * ```ts
 * import { CoreSettings, SettingRegistry } from "@noldova/code.editor";
 *
 * const settings = new SettingRegistry();
 * settings.setUserValues({ "editor.indentSize": 4, "[go]": { "editor.insertSpaces": false } });
 * settings.get(CoreSettings.indentSize); // 4
 * ```
 */
export declare class SettingRegistry {
  /**
   * Creates a registry.
   *
   * @param parent The registry this one falls back to; none by default.
   * @example
   * ```ts
   * import { SettingRegistry } from "@noldova/code.editor";
   *
   * const settings = new SettingRegistry();
   * ```
   */
  constructor(parent?: SettingRegistry | null);

  /**
   * Declares a setting.
   *
   * @param setting The setting.
   * @returns A registration whose disposal removes it.
   * @throws {RegistrationExistsException} When this registry already
   * declares the id.
   * @example
   * ```ts
   * import { Setting, SettingRegistry } from "@noldova/code.editor";
   *
   * new SettingRegistry().declare(Setting.integer("diff.contextLines", 3, "Unchanged lines around a change.", 0));
   * ```
   */
  declare(setting: Setting<unknown>): Disposable;

  /**
   * Finds a declared setting.
   *
   * @param id The setting's id.
   * @returns The setting, or null.
   * @example
   * ```ts
   * import { SettingRegistry } from "@noldova/code.editor";
   *
   * new SettingRegistry().find("editor.tabSize"); // null
   * ```
   */
  find(id: string): Setting<unknown> | null;

  /**
   * Every setting this registry and its parents declare.
   *
   * @returns The settings.
   * @example
   * ```ts
   * import { SettingRegistry } from "@noldova/code.editor";
   *
   * new SettingRegistry().all().count(); // 0
   * ```
   */
  all(): IReadOnlyList<Setting<unknown>>;

  /**
   * Replaces the user's values.
   *
   * @param values Values by setting id, and by language under `"[languageId]"`.
   * @example
   * ```ts
   * import { SettingRegistry } from "@noldova/code.editor";
   *
   * new SettingRegistry().setUserValues({ "[python]": { "editor.indentSize": 4 } });
   * ```
   */
  setUserValues(values: Readonly<Record<string, unknown>>): void;

  /**
   * Adds a language package's defaults.
   *
   * @param values Values under `"[languageId]"` keys.
   * @returns A registration whose disposal removes them.
   * @example
   * ```ts
   * import { SettingRegistry } from "@noldova/code.editor";
   *
   * new SettingRegistry().addLanguageDefaults({ "[makefile]": { "editor.insertSpaces": false } });
   * ```
   */
  addLanguageDefaults(values: Readonly<Record<string, unknown>>): Disposable;

  /**
   * A setting's value.
   *
   * @param setting The setting; it need not be declared here.
   * @param languageId The language to read per-language values for; none by default.
   * @returns The value.
   * @example
   * ```ts
   * import { CoreSettings, SettingRegistry } from "@noldova/code.editor";
   *
   * new SettingRegistry().get(CoreSettings.insertSpaces, "go"); // true
   * ```
   */
  get<T>(setting: Setting<T>, languageId?: string | null): T;

  /**
   * Listens for changed values here or in a parent.
   *
   * @param listener Called with the ids whose value may have changed.
   * @returns A registration whose disposal stops the listening.
   * @example
   * ```ts
   * import { SettingRegistry } from "@noldova/code.editor";
   *
   * using listening = new SettingRegistry().onChange(ids => console.log(ids));
   * ```
   */
  onChange(listener: (ids: IReadOnlyList<string>) => void): Disposable;
}
