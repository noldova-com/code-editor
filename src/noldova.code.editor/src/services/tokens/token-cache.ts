/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { ChunkedList, List } from "@noldova/context.collections";

import type { ILineTokenizer } from "../../interfaces/tokens/i-line-tokenizer.js";
import type { ITokenizerState } from "../../interfaces/tokens/i-tokenizer-state.js";
import type { LineToken } from "../../models/tokens/line-token.js";
import { LineTokens } from "../../models/tokens/line-tokens.js";
import { StaleState } from "../../models/tokens/stale-state.js";
import type { TextChange } from "../../models/text/text-change.js";
import type { TextDocument } from "../../models/text/text-document.js";
import { Resources } from "../../resources.js";

export class TokenCache implements Disposable {
  private static readonly UNTOKENIZED: LineTokens = new LineTokens(new List<LineToken>(), new StaleState());

  private readonly document: TextDocument;
  private readonly tokenizer: ILineTokenizer;
  private readonly stop: () => void;
  private readonly lines: ChunkedList<LineTokens>;
  private readonly provisional: Map<number, LineTokens> = new Map<number, LineTokens>();
  private stale: number[] = [];
  private frontier: number = 0;
  private validLines: number = 0;

  public constructor(document: TextDocument, tokenizer: ILineTokenizer) {
    this.document = document;
    this.tokenizer = tokenizer;
    this.lines = new ChunkedList<LineTokens>(Resources.tokenChunkLength, TokenCache.UNTOKENIZED, document.lineCount);
    this.stop = document.onChange(t => this.follow(t));
  }

  public get validLineCount(): number {
    return this.validLines;
  }

  public tokensOf(line: number): LineTokens {
    if (line - this.validLines >= Resources.provisionalLines)
      return this.provisionalOf(line);
    while (this.validLines <= line)
      this.tokenizeNext();

    return this.lines.get(line);
  }

  public advance(hasTime: () => boolean): boolean {
    while (this.validLines < this.lines.count()) {
      this.tokenizeNext();
      if (!hasTime())
        break;
    }

    return this.validLines < this.lines.count();
  }

  public [Symbol.dispose](): void {
    this.stop();
  }

  private provisionalOf(line: number): LineTokens {
    const known: LineTokens | undefined = this.provisional.get(line);
    if (!Object.isUndefined(known))
      return known;
    const before: LineTokens | undefined = this.provisional.get(line - 1);
    let state: ITokenizerState = Object.isUndefined(before) ? this.tokenizer.initialState : before.endState;
    if (Object.isUndefined(before))
      for (const at of this.outerLinesOf(line))
        state = this.tokenizer.tokenizeLine(this.document.lineText(at), state).endState;
    const tokens: LineTokens = this.tokenizer.tokenizeLine(this.document.lineText(line), state);
    this.provisional.set(line, tokens);

    return tokens;
  }

  private outerLinesOf(line: number): readonly number[] {
    const lines: number[] = [];
    let indent: number = TokenCache.indentOf(this.document.lineText(line));
    for (let at: number = line - 1; at >= line - Resources.provisionalLines && indent > 0; at--) {
      const outer: number = TokenCache.indentOf(this.document.lineText(at));
      if (outer < indent) {
        lines.push(at);
        indent = outer;
      }
    }

    return lines.toReversed();
  }

  private static indentOf(text: string): number {
    const trimmed: string = text.trimStart();

    return String.isNullOrEmpty(trimmed) ? Number.POSITIVE_INFINITY : text.length - trimmed.length;
  }

  private tokenizeNext(): void {
    const line: number = this.validLines;
    const old: LineTokens = this.lines.get(line);
    const state: ITokenizerState = line === 0 ? this.tokenizer.initialState : this.lines.get(line - 1).endState;
    const tokens: LineTokens = this.tokenizer.tokenizeLine(this.document.lineText(line), state);
    this.lines.set(line, tokens);
    this.provisional.delete(line);
    this.validLines++;
    this.frontier = Math.max(this.frontier, this.validLines);
    if (this.stale.at(-1) === line)
      this.stale.pop();
    if (!old.endState.equals(tokens.endState))
      return;
    this.validLines = Math.min(this.stale.at(-1) ?? this.frontier, this.frontier);
    for (const known of this.provisional.keys())
      if (known < this.validLines)
        this.provisional.delete(known);
  }

  private follow(change: TextChange): void {
    for (const edit of change.edits.reverse()) {
      const start: number = edit.oldRange.start.line;
      const end: number = edit.oldRange.end.line + 1;
      const added: number = edit.newRange.end.line - edit.newRange.start.line + 1;
      const delta: number = added - (end - start);
      const lines: LineTokens[] = new Array<LineTokens>(added - 1).fill(TokenCache.UNTOKENIZED);
      lines.push(this.lines.get(end - 1));
      this.lines.removeRange(start, end - start);
      this.lines.insertRange(start, lines);
      this.stale = [
        ...this.stale.filter(t => t >= end).map(t => t + delta),
        ...Array.from({ length: added }, (_, i) => start + added - 1 - i),
        ...this.stale.filter(t => t < start)
      ];
      this.frontier = this.frontier >= end ? this.frontier + delta : Math.min(this.frontier, start);
    }
    this.provisional.clear();
    this.validLines = Math.min(this.validLines, ...change.edits.select(t => t.oldRange.start.line));
  }
}
