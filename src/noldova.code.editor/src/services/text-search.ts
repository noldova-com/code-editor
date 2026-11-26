/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type IReadOnlyList, List } from "@noldova/context.collections";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { SearchPatternException } from "../exceptions/search-pattern.exception.js";
import type { SearchQuery } from "../models/search-query.js";
import type { TextDocument } from "../models/text/text-document.js";
import { TextEdit } from "../models/text/text-edit.js";
import type { TextPosition } from "../models/text/text-position.js";
import { TextRange } from "../models/text/text-range.js";
import { Resources } from "../resources.js";
import { Required } from "./required.js";

export class TextSearch {
  private static readonly NO_COLUMNS: readonly number[] = [];
  private static readonly SURROGATE_PAIR_START: number = 0x10000;

  private readonly pattern: RegExp | null;
  private readonly replacePattern: RegExp | null;

  public constructor(query: SearchQuery) {
    this.pattern = query.text === String.empty ? null : TextSearch.compile(query, Resources.searchFlags);
    this.replacePattern = query.isRegex && query.text !== String.empty ? TextSearch.compile(query, Resources.unicodeFlag) : null;
  }

  public findAll(document: TextDocument, fromLine: number = 0, toLine: number = document.lineCount): IReadOnlyList<TextRange> {
    const matches: List<TextRange> = new List<TextRange>();
    for (let line = fromLine; line < Math.min(toLine, document.lineCount); line++)
      matches.addRange(this.inLine(document, line));

    return matches;
  }

  public columnsIn(document: TextDocument, line: number): readonly number[] {
    const pattern: RegExp | null = this.pattern;
    if (Object.isNull(pattern))
      return TextSearch.NO_COLUMNS;
    const text: string = document.lineText(line);
    let columns: number[] | null = null;
    pattern.lastIndex = 0;
    for (let match: RegExpExecArray | null = pattern.exec(text); !Object.isNull(match); match = pattern.exec(text)) {
      const end: number = match.index + Required.at(match, 0).length;
      if (end === match.index)
        pattern.lastIndex = end + ((text.codePointAt(end) ?? 0) >= TextSearch.SURROGATE_PAIR_START ? 2 : 1);
      else
        (columns ??= []).push(match.index, end);
    }

    return columns ?? TextSearch.NO_COLUMNS;
  }

  public next(document: TextDocument, position: TextPosition): TextRange | null {
    const matches: IReadOnlyList<TextRange> = this.findAll(document);

    return matches.firstOrDefault(t => t.start.compareTo(position) >= 0) ?? matches.firstOrDefault() ?? null;
  }

  public previous(document: TextDocument, position: TextPosition): TextRange | null {
    const matches: IReadOnlyList<TextRange> = this.findAll(document);

    return matches.lastOrDefault(t => t.start.compareTo(position) < 0) ?? matches.lastOrDefault() ?? null;
  }

  public replaceEdits(document: TextDocument, matches: IReadOnlyList<TextRange>, replacement: string): IReadOnlyList<TextEdit> {
    return matches.select(t => new TextEdit(t, this.replacementFor(document.textIn(t), replacement))).toList();
  }

  private replacementFor(found: string, replacement: string): string {
    return Object.isNull(this.replacePattern) ? replacement : found.replace(this.replacePattern, replacement);
  }

  private inLine(document: TextDocument, line: number): readonly TextRange[] {
    const columns: readonly number[] = this.columnsIn(document, line);
    const matches: TextRange[] = [];
    for (let at: number = 0; at < columns.length; at += Resources.searchColumnsPerMatch)
      matches.push(TextRange.of(line, Required.at(columns, at), line, Required.at(columns, at + 1)));

    return matches;
  }

  private static compile(query: SearchQuery, flags: string): RegExp {
    const source: string = query.isRegex ? query.text : query.text.replace(Resources.regexSpecialPattern, Resources.regexEscape);
    const wrapped: string = query.isWholeWord ? Resources.wordBefore + Resources.groupStart + source + Resources.groupEnd + Resources.wordAfter : source;
    try {
      return new RegExp(wrapped, flags + (query.isCaseSensitive ? String.empty : Resources.ignoreCaseFlag));
    }
    catch (error) {
      throw new SearchPatternException(query.text, String(error), new ExceptionOptions(error));
    }
  }
}
