/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { IReadOnlyDictionary, IReadOnlyList } from "@noldova/context.collections";
import { Exception } from "@noldova/context.exceptions";
import type { EditorRegistries, IEditorContribution, IHighlighter, ILanguageDefinition, ILineTokenizer, ITokenizerState, LineTokens, Setting }
  from "@noldova/code.editor";
import type { GrammarState, LanguageInput, RegexEngine } from "@shikijs/primitive/types";

/**
 * Thrown when {@link TextMateHighlighter.createAsync} is asked for a language
 * it has no grammar for, which {@link TextMateHighlighter.supports} would have
 * said.
 */
export declare class TextMateGrammarMissingException extends Exception {
  /**
   * The exception's name.
   */
  readonly name: string;
  /**
   * The language's id.
   */
  readonly languageId: string;
  /**
   * Creates the exception.
   *
   * @param languageId The language's id.
   */
  constructor(languageId: string);
}

/**
 * What a host changes in the TextMate package's defaults; each one left out
 * keeps the package's own.
 */
export interface ITextMateOptions {
  /**
   * The languages to register, in place of {@link TextMateLanguages.definitions}.
   */
  readonly languages?: IReadOnlyList<ILanguageDefinition> | undefined;
  /**
   * Each language's grammar, by language id, in place of
   * {@link TextMateLanguages.grammars}.
   */
  readonly grammars?: IReadOnlyDictionary<string, TextMateGrammar> | undefined;
  /**
   * The scope rules, in place of {@link ScopeRules.defaults}.
   */
  readonly rules?: IReadOnlyList<ScopeRule> | undefined;
  /**
   * The languages' setting defaults, under `"[id]"`, in place of
   * {@link TextMateLanguages.settings}.
   */
  readonly settings?: Readonly<Record<string, unknown>> | undefined;
  /**
   * Makes the regular expression engine for each tokenizer, such as
   * Oniguruma's; Shiki's JavaScript engine when left out.
   */
  readonly engine?: (() => RegexEngine) | undefined;
}

/**
 * TextMate scopes and the token type and modifiers they give.
 *
 * @remarks
 * As in a TextMate theme, a token takes the rule whose scope selects it most
 * closely, so `keyword.control` wins over `keyword`. A rule with no type
 * leaves its text plain, its modifiers included.
 */
export declare class ScopeRule {
  /**
   * The TextMate scope selectors.
   */
  readonly scopes: IReadOnlyList<string>;
  /**
   * The token type, or `null` for plain text.
   */
  readonly type: string | null;
  /**
   * The token's modifiers.
   */
  readonly modifiers: IReadOnlyList<string>;
  /**
   * Creates a rule.
   *
   * @param scopes The scope selectors.
   * @param type The token type, or `null` for plain text.
   * @param modifiers The token's modifiers; none when left out.
   * @example
   * ```ts
   * import { List } from "@noldova/context.collections";
   * import { ScopeRule, ScopeRules } from "@noldova/code.editor.textmate";
   *
   * const rules = new List([...ScopeRules.defaults, new ScopeRule(new List(["storage.type"]), "keyword.declaration", new List(["readonly"]))]);
   * ```
   */
  constructor(scopes: IReadOnlyList<string>, type: string | null, modifiers?: IReadOnlyList<string>);
}

/**
 * A TextMate grammar for a language: the name it registers under in Shiki
 * and how it loads, which happens only on the language's first use.
 */
export declare class TextMateGrammar {
  /**
   * The name the grammar registers under, such as `tsx`.
   */
  readonly name: string;
  /**
   * The grammar, or what loads it, such as `() => import("@shikijs/langs/tsx")`.
   */
  readonly load: LanguageInput;
  /**
   * Creates a grammar.
   *
   * @param name The name the grammar registers under.
   * @param load The grammar, or what loads it.
   * @example
   * ```ts
   * import { TextMateGrammar } from "@noldova/code.editor.textmate";
   *
   * const vue = new TextMateGrammar("vue", () => import("@shikijs/langs/vue"));
   * ```
   */
  constructor(name: string, load: LanguageInput);
}

/**
 * What a host changes in the TextMate package's defaults, as a class; see
 * {@link ITextMateOptions} for what each one means.
 */
export declare class TextMateOptions implements ITextMateOptions {
  /**
   * The languages to register, in place of {@link TextMateLanguages.definitions}.
   */
  readonly languages: IReadOnlyList<ILanguageDefinition> | undefined;
  /**
   * Each language's grammar, by language id, in place of
   * {@link TextMateLanguages.grammars}.
   */
  readonly grammars: IReadOnlyDictionary<string, TextMateGrammar> | undefined;
  /**
   * The scope rules, in place of {@link ScopeRules.defaults}.
   */
  readonly rules: IReadOnlyList<ScopeRule> | undefined;
  /**
   * The languages' setting defaults, under `"[id]"`, in place of
   * {@link TextMateLanguages.settings}.
   */
  readonly settings: Readonly<Record<string, unknown>> | undefined;
  /**
   * Makes the regular expression engine for each tokenizer; Shiki's
   * JavaScript engine when left out.
   */
  readonly engine: (() => RegexEngine) | undefined;
  /**
   * Creates the options; each one left out keeps the package's own.
   *
   * @param languages The languages to register.
   * @param grammars Each language's grammar, by language id.
   * @param rules The scope rules.
   * @param settings The languages' setting defaults.
   * @param engine Makes the regular expression engine for each tokenizer.
   * @example
   * ```ts
   * import { TextMateContribution, TextMateLanguages, TextMateOptions } from "@noldova/code.editor.textmate";
   *
   * const languages = TextMateLanguages.definitions.where(t => t.id !== "makefile").toList();
   * const contribution = new TextMateContribution(new TextMateOptions(languages));
   * ```
   */
  constructor(languages?: IReadOnlyList<ILanguageDefinition>, grammars?: IReadOnlyDictionary<string, TextMateGrammar>, rules?: IReadOnlyList<ScopeRule>,
    settings?: Readonly<Record<string, unknown>>, engine?: () => RegexEngine);
}

/**
 * A grammar's state at a line's end.
 *
 * @remarks
 * Two states are equal when their grammar stacks are, so tokenizing can stop
 * once a line ends as it did; a state of another kind is never equal to one.
 */
export declare class TextMateState implements ITokenizerState {
  /**
   * Shiki's grammar state, or `null` before the first line.
   */
  readonly grammarState: GrammarState | null;
  /**
   * Creates a state.
   *
   * @param grammarState Shiki's grammar state, or `null` before the first line.
   * @param theme The theme the state was made with.
   */
  constructor(grammarState: GrammarState | null, theme: string);
  /**
   * Whether another state is this one.
   *
   * @param other The other state.
   * @returns True when it is a TextMate state with an equal grammar stack.
   */
  equals(other: ITokenizerState): boolean;
}

/**
 * The scope rules the TextMate package maps tokens with, onto the core's
 * built-in token types.
 */
export declare class ScopeRules {
  /**
   * The default rules: comments, keywords, `keyword.control`, strings,
   * `string.regexp`, numbers, types, functions, variables and meta, with
   * operators and punctuation plain.
   */
  static readonly defaults: IReadOnlyList<ScopeRule>;
}

/**
 * Registers the TextMate package with a set: its languages, its highlighter,
 * its line length setting and its languages' indent defaults.
 *
 * @remarks
 * Each list is a default a host replaces through {@link ITextMateOptions};
 * a highlighter registered later, or one a language is assigned to, takes
 * that language over.
 *
 * @example
 * ```ts
 * import { EditorRegistries } from "@noldova/code.editor";
 * import { TextMateContribution } from "@noldova/code.editor.textmate";
 *
 * const registries = new EditorRegistries();
 * registries.add(new TextMateContribution());
 * const language = registries.languages.forFile("src/main.rs");
 * const tokenizer = language === null ? null : await registries.highlighters.tokenizerAsync(language);
 * ```
 */
export declare class TextMateContribution implements IEditorContribution {
  /**
   * `noldova.code.editor.textmate`.
   */
  readonly id: string;
  /**
   * Creates the contribution.
   *
   * @param options What to change in the package's defaults.
   */
  constructor(options?: ITextMateOptions);
  /**
   * Registers the package's languages, highlighter, setting and language
   * defaults with a set.
   *
   * @param registries The set.
   * @throws {@link RegistrationExistsException} When the set already holds one
   * of the languages or a highlighter with the id `textmate`.
   */
  contribute(registries: EditorRegistries): void;
}

/**
 * The TextMate highlighter, with the id `textmate`.
 *
 * @remarks
 * It supports each language it has a grammar for, by the language's id, and
 * loads that grammar only when the language is first highlighted; each
 * tokenizer leaves a line longer than the `editor.maxTokenizationLineLength`
 * setting, for its language, plain.
 */
export declare class TextMateHighlighter implements IHighlighter {
  /**
   * `textmate`.
   */
  readonly id: string;
  /**
   * Creates the highlighter.
   *
   * @param grammars Each language's grammar, by language id.
   * @param rules The scope rules.
   * @param engine Makes each tokenizer's regular expression engine; Shiki's
   * JavaScript engine when left out.
   */
  constructor(grammars: IReadOnlyDictionary<string, TextMateGrammar>, rules?: IReadOnlyList<ScopeRule>, engine?: () => RegexEngine);
  /**
   * Whether the highlighter has a grammar for the language.
   *
   * @param language The language.
   * @returns True when it has one under the language's id.
   */
  supports(language: ILanguageDefinition): boolean;
  /**
   * Loads the language's grammar and makes its tokenizer.
   *
   * @param language The language.
   * @param registries The set whose settings give the line length limit.
   * @returns The tokenizer.
   * @throws {@link TextMateGrammarMissingException} When it has no grammar for
   * the language.
   */
  createAsync(language: ILanguageDefinition, registries: EditorRegistries): Promise<ILineTokenizer>;
}

/**
 * The 33 languages the TextMate package gives a host by default, as VS Code
 * describes them, with Shiki's grammar for each and the indent each keeps by
 * convention.
 */
export declare class TextMateLanguages {
  /**
   * The languages: typescript, javascript, typescriptreact, javascriptreact,
   * json, jsonc, yaml, toml, shellscript, powershell, bat, python, go, rust,
   * java, kotlin, c, csharp, swift, php, sql, html, css, scss, markdown, xml,
   * dockerfile, diff, ini, graphql, lua, r and makefile.
   */
  static readonly definitions: IReadOnlyList<ILanguageDefinition>;
  /**
   * Each language's grammar, by language id.
   */
  static readonly grammars: IReadOnlyDictionary<string, TextMateGrammar>;
  /**
   * The languages' setting defaults, under `"[id]"`: an indent of 4 for
   * python, rust, java, kotlin, c, csharp, swift, php, powershell and bat,
   * and tabs for go and makefile.
   */
  static readonly settings: Readonly<Record<string, unknown>>;
}

/**
 * The settings the TextMate package declares; a user, or a language under
 * `"[id]"`, can override each one.
 */
export declare class TextMateSettings {
  /**
   * `editor.maxTokenizationLineLength`, 2000 by default: lines longer than
   * this many characters are not highlighted.
   */
  static readonly lineLengthLimit: Setting<number>;
}

/**
 * One language's line tokenizer over a TextMate grammar, through Shiki, with
 * the grammar's state carried from line to line.
 */
export declare class TextMateTokenizer implements ILineTokenizer, Disposable {
  /**
   * The state before the first line.
   */
  readonly initialState: ITokenizerState;
  /**
   * Loads a grammar, and the grammars it embeds, and makes its tokenizer.
   *
   * @param grammar The name the loaded grammar registers under.
   * @param load The grammar, or what loads it.
   * @param engine The regular expression engine.
   * @param rules The scope rules; {@link ScopeRules.defaults} when left out.
   * @param lineLengthLimit Lines longer than this stay plain; 2000 when left
   * out.
   * @returns The tokenizer.
   * @example
   * ```ts
   * import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
   * import { TextMateTokenizer } from "@noldova/code.editor.textmate";
   *
   * using tokenizer = await TextMateTokenizer.createAsync("rust", () => import("@shikijs/langs/rust"), createJavaScriptRegexEngine());
   * tokenizer.tokenizeLine("fn main() {}", tokenizer.initialState);
   * ```
   */
  static createAsync(grammar: string, load: LanguageInput, engine: RegexEngine, rules?: IReadOnlyList<ScopeRule>, lineLengthLimit?: number): Promise<TextMateTokenizer>;
  /**
   * Tokenizes one line.
   *
   * @param text The line, without its line break.
   * @param state The previous line's end state, or the initial state; a
   * state of another kind starts from the beginning.
   * @returns The line's typed tokens, with its plain text left out, and its
   * end state.
   */
  tokenizeLine(text: string, state: ITokenizerState): LineTokens;
  /**
   * Frees the loaded grammars.
   */
  [Symbol.dispose](): void;
}
