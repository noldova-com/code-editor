/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { ILanguageDefinition } from "../../interfaces/i-language-definition.js";
import type { BlockComment } from "./block-comment.js";
import type { BracketPair } from "./bracket-pair.js";

export class LanguageDefinition implements ILanguageDefinition {
  public readonly id: string;
  public readonly aliases: IReadOnlyList<string> | undefined;
  public readonly extensions: IReadOnlyList<string> | undefined;
  public readonly filenames: IReadOnlyList<string> | undefined;
  public readonly filenamePatterns: IReadOnlyList<string> | undefined;
  public readonly firstLine: string | undefined;
  public readonly lineComment: string | undefined;
  public readonly blockComment: BlockComment | undefined;
  public readonly brackets: IReadOnlyList<BracketPair> | undefined;
  public readonly wordCharacters: string | undefined;

  public constructor(id: string, aliases: IReadOnlyList<string> | undefined = undefined, extensions: IReadOnlyList<string> | undefined = undefined,
    filenames: IReadOnlyList<string> | undefined = undefined, filenamePatterns: IReadOnlyList<string> | undefined = undefined, firstLine: string | undefined = undefined,
    lineComment: string | undefined = undefined, blockComment: BlockComment | undefined = undefined, brackets: IReadOnlyList<BracketPair> | undefined = undefined,
    wordCharacters: string | undefined = undefined) {
    this.id = id;
    this.aliases = aliases;
    this.extensions = extensions;
    this.filenames = filenames;
    this.filenamePatterns = filenamePatterns;
    this.firstLine = firstLine;
    this.lineComment = lineComment;
    this.blockComment = blockComment;
    this.brackets = brackets;
    this.wordCharacters = wordCharacters;
  }
}
