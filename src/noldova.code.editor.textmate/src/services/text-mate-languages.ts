/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary, type IReadOnlyDictionary, type IReadOnlyList, KeyValuePair, List } from "@noldova/context.collections";

import { BlockComment, BracketPair, CoreSettings, type ILanguageDefinition, LanguageDefinition } from "@noldova/code.editor";

import { TextMateGrammar } from "../models/text-mate-grammar.js";
import { Resources } from "../resources.js";

export class TextMateLanguages {
  private static readonly BRACKETS: IReadOnlyList<BracketPair> = new List([new BracketPair(Resources.openBrace, Resources.closeBrace), new BracketPair(Resources.openBracket, Resources.closeBracket),
    new BracketPair(Resources.openParenthesis, Resources.closeParenthesis)]);
  private static readonly C_BLOCK: BlockComment = new BlockComment(Resources.cBlockCommentStart, Resources.cBlockCommentEnd);
  private static readonly MARKUP_BLOCK: BlockComment = new BlockComment(Resources.markupCommentStart, Resources.markupCommentEnd);

  public static readonly definitions: IReadOnlyList<ILanguageDefinition> = new List<ILanguageDefinition>([
    new LanguageDefinition(Resources.typescriptLanguageId, new List(Resources.typescriptAliases), new List(Resources.typescriptExtensions), undefined, undefined,
      undefined, Resources.slashLineComment, TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.javascriptLanguageId, new List(Resources.javascriptAliases), new List(Resources.javascriptExtensions),
      new List(Resources.javascriptFilenames), undefined, Resources.nodeFirstLinePattern, Resources.slashLineComment, TextMateLanguages.C_BLOCK,
      TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.typescriptReactLanguageId, new List(Resources.typescriptReactAliases), new List(Resources.typescriptReactExtensions), undefined,
      undefined, undefined, Resources.slashLineComment, TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.javascriptReactLanguageId, new List(Resources.javascriptReactAliases), new List(Resources.javascriptReactExtensions), undefined,
      undefined, undefined, Resources.slashLineComment, TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.jsonLanguageId, undefined, new List(Resources.jsonExtensions), new List(Resources.jsonFilenames), undefined, undefined, undefined,
      undefined, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.jsoncLanguageId, undefined, new List(Resources.jsoncExtensions), new List(Resources.jsoncFilenames),
      new List(Resources.jsoncFilenamePatterns), undefined, Resources.slashLineComment, TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.yamlLanguageId, new List(Resources.yamlAliases), new List(Resources.yamlExtensions), undefined, undefined, undefined,
      Resources.hashLineComment, undefined, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.tomlLanguageId, undefined, new List(Resources.tomlExtensions), new List(Resources.tomlFilenames), undefined, undefined,
      Resources.hashLineComment, undefined, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.shellScriptLanguageId, new List(Resources.shellScriptAliases), new List(Resources.shellScriptExtensions),
      new List(Resources.shellScriptFilenames), new List(Resources.shellScriptFilenamePatterns), Resources.shellFirstLinePattern, Resources.hashLineComment, undefined,
      TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.powerShellLanguageId, new List(Resources.powerShellAliases), new List(Resources.powerShellExtensions), undefined, undefined,
      Resources.powerShellFirstLinePattern, Resources.hashLineComment, new BlockComment(Resources.powerShellBlockCommentStart, Resources.powerShellBlockCommentEnd),
      TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.batLanguageId, new List(Resources.batAliases), new List(Resources.batExtensions), undefined, undefined, undefined,
      Resources.remarkLineComment, undefined, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.pythonLanguageId, new List(Resources.pythonAliases), new List(Resources.pythonExtensions), new List(Resources.pythonFilenames),
      undefined, Resources.pythonFirstLinePattern, Resources.hashLineComment,
      new BlockComment(Resources.pythonBlockCommentDelimiter, Resources.pythonBlockCommentDelimiter), TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.goLanguageId, new List(Resources.goAliases), new List(Resources.goExtensions), undefined, undefined, undefined,
      Resources.slashLineComment, TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.rustLanguageId, new List(Resources.rustAliases), new List(Resources.rustExtensions), undefined, undefined, undefined,
      Resources.slashLineComment, TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.javaLanguageId, undefined, new List(Resources.javaExtensions), undefined, undefined, undefined, Resources.slashLineComment,
      TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.kotlinLanguageId, new List(Resources.kotlinAliases), new List(Resources.kotlinExtensions), undefined, undefined, undefined,
      Resources.slashLineComment, TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.cLanguageId, undefined, new List(Resources.cExtensions), undefined, undefined, undefined, Resources.slashLineComment,
      TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.cSharpLanguageId, new List(Resources.cSharpAliases), new List(Resources.cSharpExtensions), undefined, undefined, undefined,
      Resources.slashLineComment, TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.swiftLanguageId, undefined, new List(Resources.swiftExtensions), undefined, undefined, undefined, Resources.slashLineComment,
      TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.phpLanguageId, undefined, new List(Resources.phpExtensions), undefined, undefined, Resources.phpFirstLinePattern,
      Resources.slashLineComment, TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS, Resources.phpWordCharacters),
    new LanguageDefinition(Resources.sqlLanguageId, undefined, new List(Resources.sqlExtensions), undefined, undefined, undefined, Resources.dashLineComment,
      TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.htmlLanguageId, undefined, new List(Resources.htmlExtensions), undefined, undefined, Resources.htmlFirstLinePattern, undefined,
      TextMateLanguages.MARKUP_BLOCK, TextMateLanguages.BRACKETS, Resources.hyphenWordCharacters),
    new LanguageDefinition(Resources.cssLanguageId, undefined, new List(Resources.cssExtensions), undefined, undefined, undefined, undefined, TextMateLanguages.C_BLOCK,
      TextMateLanguages.BRACKETS, Resources.hyphenWordCharacters),
    new LanguageDefinition(Resources.scssLanguageId, undefined, new List(Resources.scssExtensions), undefined, undefined, undefined, Resources.slashLineComment,
      TextMateLanguages.C_BLOCK, TextMateLanguages.BRACKETS, Resources.hyphenWordCharacters),
    new LanguageDefinition(Resources.markdownLanguageId, new List(Resources.markdownAliases), new List(Resources.markdownExtensions), undefined, undefined, undefined,
      undefined, TextMateLanguages.MARKUP_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.xmlLanguageId, undefined, new List(Resources.xmlExtensions), undefined, undefined, Resources.xmlFirstLinePattern, undefined,
      TextMateLanguages.MARKUP_BLOCK, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.dockerfileLanguageId, new List(Resources.dockerfileAliases), new List(Resources.dockerfileExtensions),
      new List(Resources.dockerfileFilenames), new List(Resources.dockerfileFilenamePatterns), undefined, Resources.hashLineComment, undefined,
      TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.diffLanguageId, new List(Resources.diffAliases), new List(Resources.diffExtensions)),
    new LanguageDefinition(Resources.iniLanguageId, undefined, new List(Resources.iniExtensions), undefined, new List(Resources.iniFilenamePatterns), undefined,
      Resources.semicolonLineComment, undefined, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.graphqlLanguageId, new List(Resources.graphqlAliases), new List(Resources.graphqlExtensions), undefined, undefined, undefined,
      Resources.hashLineComment, undefined, TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.luaLanguageId, undefined, new List(Resources.luaExtensions), undefined, undefined, undefined, Resources.dashLineComment,
      new BlockComment(Resources.luaBlockCommentStart, Resources.luaBlockCommentEnd), TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.rLanguageId, undefined, new List(Resources.rExtensions), undefined, undefined, undefined, Resources.hashLineComment, undefined,
      TextMateLanguages.BRACKETS),
    new LanguageDefinition(Resources.makefileLanguageId, new List(Resources.makefileAliases), new List(Resources.makefileExtensions),
      new List(Resources.makefileFilenames), undefined, Resources.makefileFirstLinePattern, Resources.hashLineComment, undefined, TextMateLanguages.BRACKETS)
  ]);

  public static readonly grammars: IReadOnlyDictionary<string, TextMateGrammar> = new Dictionary([
    new KeyValuePair(Resources.typescriptLanguageId, new TextMateGrammar(Resources.typescriptGrammar, () => import("@shikijs/langs/typescript"))),
    new KeyValuePair(Resources.javascriptLanguageId, new TextMateGrammar(Resources.javascriptGrammar, () => import("@shikijs/langs/javascript"))),
    new KeyValuePair(Resources.typescriptReactLanguageId, new TextMateGrammar(Resources.typescriptReactGrammar, () => import("@shikijs/langs/tsx"))),
    new KeyValuePair(Resources.javascriptReactLanguageId, new TextMateGrammar(Resources.javascriptReactGrammar, () => import("@shikijs/langs/jsx"))),
    new KeyValuePair(Resources.jsonLanguageId, new TextMateGrammar(Resources.jsonGrammar, () => import("@shikijs/langs/json"))),
    new KeyValuePair(Resources.jsoncLanguageId, new TextMateGrammar(Resources.jsoncGrammar, () => import("@shikijs/langs/jsonc"))),
    new KeyValuePair(Resources.yamlLanguageId, new TextMateGrammar(Resources.yamlGrammar, () => import("@shikijs/langs/yaml"))),
    new KeyValuePair(Resources.tomlLanguageId, new TextMateGrammar(Resources.tomlGrammar, () => import("@shikijs/langs/toml"))),
    new KeyValuePair(Resources.shellScriptLanguageId, new TextMateGrammar(Resources.shellScriptGrammar, () => import("@shikijs/langs/shellscript"))),
    new KeyValuePair(Resources.powerShellLanguageId, new TextMateGrammar(Resources.powerShellGrammar, () => import("@shikijs/langs/powershell"))),
    new KeyValuePair(Resources.batLanguageId, new TextMateGrammar(Resources.batGrammar, () => import("@shikijs/langs/bat"))),
    new KeyValuePair(Resources.pythonLanguageId, new TextMateGrammar(Resources.pythonGrammar, () => import("@shikijs/langs/python"))),
    new KeyValuePair(Resources.goLanguageId, new TextMateGrammar(Resources.goGrammar, () => import("@shikijs/langs/go"))),
    new KeyValuePair(Resources.rustLanguageId, new TextMateGrammar(Resources.rustGrammar, () => import("@shikijs/langs/rust"))),
    new KeyValuePair(Resources.javaLanguageId, new TextMateGrammar(Resources.javaGrammar, () => import("@shikijs/langs/java"))),
    new KeyValuePair(Resources.kotlinLanguageId, new TextMateGrammar(Resources.kotlinGrammar, () => import("@shikijs/langs/kotlin"))),
    new KeyValuePair(Resources.cLanguageId, new TextMateGrammar(Resources.cGrammar, () => import("@shikijs/langs/c"))),
    new KeyValuePair(Resources.cSharpLanguageId, new TextMateGrammar(Resources.cSharpGrammar, () => import("@shikijs/langs/csharp"))),
    new KeyValuePair(Resources.swiftLanguageId, new TextMateGrammar(Resources.swiftGrammar, () => import("@shikijs/langs/swift"))),
    new KeyValuePair(Resources.phpLanguageId, new TextMateGrammar(Resources.phpGrammar, () => import("@shikijs/langs/php"))),
    new KeyValuePair(Resources.sqlLanguageId, new TextMateGrammar(Resources.sqlGrammar, () => import("@shikijs/langs/sql"))),
    new KeyValuePair(Resources.htmlLanguageId, new TextMateGrammar(Resources.htmlGrammar, () => import("@shikijs/langs/html"))),
    new KeyValuePair(Resources.cssLanguageId, new TextMateGrammar(Resources.cssGrammar, () => import("@shikijs/langs/css"))),
    new KeyValuePair(Resources.scssLanguageId, new TextMateGrammar(Resources.scssGrammar, () => import("@shikijs/langs/scss"))),
    new KeyValuePair(Resources.markdownLanguageId, new TextMateGrammar(Resources.markdownGrammar, () => import("@shikijs/langs/markdown"))),
    new KeyValuePair(Resources.xmlLanguageId, new TextMateGrammar(Resources.xmlGrammar, () => import("@shikijs/langs/xml"))),
    new KeyValuePair(Resources.dockerfileLanguageId, new TextMateGrammar(Resources.dockerfileGrammar, () => import("@shikijs/langs/docker"))),
    new KeyValuePair(Resources.diffLanguageId, new TextMateGrammar(Resources.diffGrammar, () => import("@shikijs/langs/diff"))),
    new KeyValuePair(Resources.iniLanguageId, new TextMateGrammar(Resources.iniGrammar, () => import("@shikijs/langs/ini"))),
    new KeyValuePair(Resources.graphqlLanguageId, new TextMateGrammar(Resources.graphqlGrammar, () => import("@shikijs/langs/graphql"))),
    new KeyValuePair(Resources.luaLanguageId, new TextMateGrammar(Resources.luaGrammar, () => import("@shikijs/langs/lua"))),
    new KeyValuePair(Resources.rLanguageId, new TextMateGrammar(Resources.rGrammar, () => import("@shikijs/langs/r"))),
    new KeyValuePair(Resources.makefileLanguageId, new TextMateGrammar(Resources.makefileGrammar, () => import("@shikijs/langs/make")))
  ]);

  public static readonly settings: Readonly<Record<string, unknown>> = {
    ...Object.fromEntries(Resources.wideIndentLanguageIds.map(t => [Resources.formatLanguageSettingsKey(t), { [CoreSettings.indentSize.id]: Resources.wideIndentSize }])),
    [Resources.formatLanguageSettingsKey(Resources.goLanguageId)]: { [CoreSettings.insertSpaces.id]: false },
    [Resources.formatLanguageSettingsKey(Resources.makefileLanguageId)]: { [CoreSettings.insertSpaces.id]: false }
  };
}
