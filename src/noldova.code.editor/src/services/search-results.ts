/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { ChunkedList, type IReadOnlyList, List } from "@noldova/context.collections";

import type { TextChange } from "../models/text/text-change.js";
import type { TextDocument } from "../models/text/text-document.js";
import type { TextPosition } from "../models/text/text-position.js";
import { TextRange } from "../models/text/text-range.js";
import { Resources } from "../resources.js";
import { Required } from "./required.js";
import type { TextSearch } from "./text-search.js";

export class SearchResults implements Disposable {
  public readonly search: TextSearch;
  private readonly document: TextDocument;
  private readonly stop: () => void;
  private readonly lines: ChunkedList<readonly number[] | null>;
  private stale: number[] = [];
  private frontier: number = 0;

  public constructor(document: TextDocument, search: TextSearch) {
    this.document = document;
    this.search = search;
    this.lines = new ChunkedList<readonly number[] | null>(Resources.tokenChunkLength, null, document.lineCount, t => Object.isNull(t) ? 0 : t.length / Resources.searchColumnsPerMatch);
    this.stop = document.onChange(t => this.follow(t));
  }

  public get count(): number {
    return this.lines.totalWeight;
  }

  public get complete(): boolean {
    return this.frontier >= this.lines.count() && this.stale.length === 0;
  }

  public matchesIn(fromLine: number, toLine: number): IReadOnlyList<TextRange> {
    const matches: List<TextRange> = new List<TextRange>();
    for (let line: number = fromLine; line < Math.min(toLine, this.lines.count()); line++)
      matches.addRange(this.rangesOf(line));

    return matches;
  }

  public advance(hasTime: () => boolean): boolean {
    let lines: number = 0;
    let readAt: number = this.search.searchedCharacters;
    while (!this.complete) {
      this.columnsOf(this.stale.pop() ?? this.frontier++);
      if (++lines < Resources.searchLinesPerClockRead && this.search.searchedCharacters - readAt < Resources.searchCharactersPerClockRead)
        continue;
      if (!hasTime())
        break;
      lines = 0;
      readAt = this.search.searchedCharacters;
    }

    return !this.complete;
  }

  public indexOf(range: TextRange): number {
    const line: number = range.start.line;
    const index: number = this.rangesOf(line).findIndex(t => t.equals(range));

    return index === -1 ? -1 : this.lines.weightBefore(line) + index;
  }

  public next(position: TextPosition): TextRange | null {
    const here: TextRange | undefined = this.rangesOf(position.line).find(t => t.start.compareTo(position) >= 0);
    if (!Object.isUndefined(here))
      return here;
    const after: number = this.lineWithMatchFrom(position.line + 1);
    const line: number = after === -1 ? this.lineWithMatchFrom(0) : after;

    return line === -1 ? null : Required.at(this.rangesOf(line), 0);
  }

  public previous(position: TextPosition): TextRange | null {
    const here: TextRange | undefined = this.rangesOf(position.line).findLast(t => t.start.compareTo(position) < 0);
    if (!Object.isUndefined(here))
      return here;
    const before: number = this.lineWithMatchBefore(position.line);
    const line: number = before === -1 ? this.lineWithMatchBefore(this.lines.count()) : before;

    return line === -1 ? null : Required.value(this.rangesOf(line).at(-1));
  }

  public all(): IReadOnlyList<TextRange> {
    this.advance(() => true);
    const matches: List<TextRange> = new List<TextRange>();
    for (let line: number = this.lines.nextWeightedIndex(0); line !== -1; line = this.lines.nextWeightedIndex(line + 1))
      matches.addRange(this.rangesOf(line));

    return matches;
  }

  public [Symbol.dispose](): void {
    this.stop();
  }

  private lineWithMatchFrom(from: number): number {
    for (let line: number = from; line < this.lines.count(); line++) {
      if (this.complete)
        return this.lines.nextWeightedIndex(line);
      if (this.columnsOf(line).length > 0)
        return line;
    }

    return -1;
  }

  private lineWithMatchBefore(before: number): number {
    for (let line: number = before - 1; line >= 0; line--) {
      if (this.complete)
        return this.lines.previousWeightedIndex(line + 1);
      if (this.columnsOf(line).length > 0)
        return line;
    }

    return -1;
  }

  private rangesOf(line: number): readonly TextRange[] {
    const columns: readonly number[] = this.columnsOf(line);
    const ranges: TextRange[] = [];
    for (let at: number = 0; at < columns.length; at += Resources.searchColumnsPerMatch)
      ranges.push(TextRange.of(line, Required.at(columns, at), line, Required.at(columns, at + 1)));

    return ranges;
  }

  private columnsOf(line: number): readonly number[] {
    const known: readonly number[] | null = this.lines.get(line);
    if (!Object.isNull(known))
      return known;
    const columns: readonly number[] = this.search.columnsIn(this.document, line);
    this.lines.set(line, columns);

    return columns;
  }

  private follow(change: TextChange): void {
    for (const edit of change.edits.reverse()) {
      const start: number = edit.oldRange.start.line;
      const end: number = edit.oldRange.end.line + 1;
      const added: number = edit.newRange.end.line - edit.newRange.start.line + 1;
      const delta: number = added - (end - start);
      this.lines.removeRange(start, end - start);
      this.lines.insertRange(start, new Array<readonly number[] | null>(added).fill(null));
      this.stale = [...this.stale.filter(t => t < start), ...this.stale.filter(t => t >= end).map(t => t + delta)];
      if (this.frontier >= end) {
        this.stale.push(...Array.from({ length: added }, (_, i) => start + i));
        this.frontier += delta;
      }
      else
        this.frontier = Math.min(this.frontier, start);
    }
  }
}
