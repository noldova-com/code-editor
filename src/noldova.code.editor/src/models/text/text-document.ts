/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { BinarySearchService, type IReadOnlyList, List } from "@noldova/context.collections";
import { ArgumentException, ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { EditsOverlapException } from "../../exceptions/edits-overlap.exception.js";
import { Resources } from "../../resources.js";
import { Required } from "../../services/required.js";
import { AppliedEdit } from "../editing/applied-edit.js";
import { LineChunk } from "./line-chunk.js";
import { LineSplit } from "./line-split.js";
import { TextChange } from "./text-change.js";
import type { TextEdit } from "./text-edit.js";
import { TextPosition } from "./text-position.js";
import { TextRange } from "./text-range.js";

export class TextDocument {
  private readonly chunks: LineChunk[];
  private lineStarts: number[] = [];
  private offsetStarts: number[] = [];
  private totalLines: number = 0;
  private totalLength: number = 0;
  private currentVersion: number = 0;
  private readonly listeners: Set<(change: TextChange) => void> = new Set<(change: TextChange) => void>();

  private constructor(chunks: LineChunk[]) {
    this.chunks = chunks;
    this.reindex();
  }

  public static fromText(text: string): TextDocument {
    const building: Generator<void, LineChunk[]> = TextDocument.chunksOf(text);
    let step: IteratorResult<void, LineChunk[]> = building.next();
    while (step.done !== true)
      step = building.next();

    return new TextDocument(step.value);
  }

  public static async fromTextAsync(text: string, pause: () => Promise<void>): Promise<TextDocument> {
    const building: Generator<void, LineChunk[]> = TextDocument.chunksOf(text);
    let step: IteratorResult<void, LineChunk[]> = building.next();
    while (step.done !== true) {
      await pause();
      step = building.next();
    }
    await pause();

    return new TextDocument(step.value);
  }

  public get version(): number {
    return this.currentVersion;
  }

  public get lineCount(): number {
    return this.totalLines;
  }

  public get length(): number {
    return this.totalLength;
  }

  public lineText(line: number): string {
    this.requireLine(line);
    const index: number = this.chunkIndexOf(line);

    return Required.at(this.chunks, index).textAt(line - Required.at(this.lineStarts, index));
  }

  public lineEnding(line: number): string {
    this.requireLine(line);
    const index: number = this.chunkIndexOf(line);

    return Required.at(this.chunks, index).endingAt(line - Required.at(this.lineStarts, index));
  }

  public text(): string {
    return this.chunks.map(t => t.text()).join(String.empty);
  }

  public textIn(range: TextRange): string {
    this.requirePosition(range.start);
    this.requirePosition(range.end);
    const { start, end } = range;
    if (start.line === end.line)
      return this.lineText(start.line).slice(start.column, end.column);
    const parts: string[] = [this.lineText(start.line).slice(start.column), this.lineEnding(start.line)];
    for (let line = start.line + 1; line < end.line; line++)
      parts.push(this.lineText(line), this.lineEnding(line));
    parts.push(this.lineText(end.line).slice(0, end.column));

    return parts.join(String.empty);
  }

  public offsetAt(position: TextPosition): number {
    this.requirePosition(position);
    const index: number = this.chunkIndexOf(position.line);
    const local: number = position.line - Required.at(this.lineStarts, index);

    return Required.at(this.offsetStarts, index) + Required.at(this.chunks, index).offsetOf(local) + position.column;
  }

  public positionAt(offset: number): TextPosition {
    TextPosition.requireCount(offset, Resources.offsetParameter);
    if (offset > this.totalLength)
      throw new ArgumentOutOfRangeException(Resources.offsetParameter, offset, Resources.formatOffsetOutOfRange(offset, this.totalLength));
    const index: number = BinarySearchService.floorIndex(this.offsetStarts, offset);
    const chunk: LineChunk = Required.at(this.chunks, index);
    const rest: number = offset - Required.at(this.offsetStarts, index);
    const local: number = chunk.lineAt(rest);

    return new TextPosition(Required.at(this.lineStarts, index) + local, Math.min(rest - chunk.offsetOf(local), chunk.textAt(local).length));
  }

  public apply(edits: IReadOnlyList<TextEdit>): TextChange {
    if (edits.count() === 0)
      throw new ArgumentException(Resources.editsEmpty, Resources.editsParameter);
    for (const edit of edits) {
      this.requirePosition(edit.range.start);
      this.requirePosition(edit.range.end);
    }
    const sorted: readonly TextEdit[] = [...edits].sort((a, b) => a.range.start.compareTo(b.range.start));
    for (let index = 1; index < sorted.length; index++) {
      const previous: TextEdit = Required.at(sorted, index - 1);
      const current: TextEdit = Required.at(sorted, index);
      if (current.range.start.compareTo(previous.range.end) < 0)
        throw new EditsOverlapException(previous.range, current.range);
    }
    const oldTexts: readonly string[] = sorted.map(t => this.textIn(t.range));
    const oldOffsets: readonly number[] = sorted.map(t => this.offsetAt(t.range.start));
    for (let index = sorted.length - 1; index >= 0; index--)
      this.replace(Required.at(sorted, index));
    this.currentVersion++;
    const change: TextChange = new TextChange(this.currentVersion, TextDocument.applied(sorted, oldTexts, oldOffsets));
    for (const listener of this.listeners)
      listener(change);

    return change;
  }

  public onChange(listener: (change: TextChange) => void): () => void {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  }

  public textBetween(start: number, end: number): string {
    return this.textIn(new TextRange(this.positionAt(start), this.positionAt(end)));
  }

  private static applied(sorted: readonly TextEdit[], oldTexts: readonly string[], oldOffsets: readonly number[]): List<AppliedEdit> {
    const applied: List<AppliedEdit> = new List<AppliedEdit>();
    let lineDelta: number = 0;
    let columnDelta: number = 0;
    let lastEndLine: number = -1;
    for (let index = 0; index < sorted.length; index++) {
      const edit: TextEdit = Required.at(sorted, index);
      const { start, end } = edit.range;
      const startLine: number = start.line + lineDelta;
      const startColumn: number = start.line === lastEndLine ? start.column + columnDelta : start.column;
      const inserted: LineSplit = LineSplit.of(edit.text);
      const lastText: string = inserted.texts.get(inserted.texts.count() - 1);
      const newEnd: TextPosition = inserted.texts.count() === 1
        ? new TextPosition(startLine, startColumn + lastText.length)
        : new TextPosition(startLine + inserted.texts.count() - 1, lastText.length);
      applied.add(new AppliedEdit(edit.range, new TextRange(new TextPosition(startLine, startColumn), newEnd), Required.at(oldTexts, index), edit.text, Required.at(oldOffsets, index)));
      lineDelta += inserted.texts.count() - 1 - (end.line - start.line);
      columnDelta = newEnd.column - end.column;
      lastEndLine = end.line;
    }

    return applied;
  }

  private replace(edit: TextEdit): void {
    const { start, end } = edit.range;
    const prefix: string = this.lineText(start.line).slice(0, start.column);
    const suffix: string = this.lineText(end.line).slice(end.column);
    const split: LineSplit = LineSplit.of(prefix + edit.text + suffix);
    this.replaceLines(start.line, end.line - start.line + 1, split.texts.toArray(), [...split.endings.skipLast(1), this.lineEnding(end.line)]);
  }

  private replaceLines(start: number, deleteCount: number, texts: readonly string[], endings: readonly string[]): void {
    const index: number = this.chunkIndexOf(start);
    const chunk: LineChunk = Required.at(this.chunks, index);
    const local: number = start - Required.at(this.lineStarts, index);
    const inFirst: number = Math.min(deleteCount, chunk.lineCount - local);
    chunk.replace(local, inFirst, texts, endings);
    let remaining: number = deleteCount - inFirst;
    let emptied: number = 0;
    while (remaining > 0) {
      const next: LineChunk = Required.at(this.chunks, index + 1 + emptied);
      const count: number = Math.min(remaining, next.lineCount);
      next.replace(0, count, [], []);
      remaining -= count;
      if (next.lineCount === 0)
        emptied++;
    }
    this.chunks.splice(index + 1, emptied);
    this.rebalance(index);
    this.reindex();
  }

  private rebalance(index: number): void {
    const chunk: LineChunk = Required.at(this.chunks, index);
    if (chunk.lineCount > Resources.chunkLines) {
      this.chunks.splice(index, 1, ...TextDocument.chunk(chunk.texts, chunk.endings));

      return;
    }
    if (chunk.lineCount >= Resources.smallChunkLines || index + 1 >= this.chunks.length)
      return;
    const next: LineChunk = Required.at(this.chunks, index + 1);
    if (chunk.lineCount + next.lineCount > Resources.chunkLines)
      return;
    chunk.replace(chunk.lineCount, 0, next.texts, next.endings);
    this.chunks.splice(index + 1, 1);
  }

  private reindex(): void {
    const lineStarts: number[] = [];
    const offsetStarts: number[] = [];
    let lines: number = 0;
    let offset: number = 0;
    for (const chunk of this.chunks) {
      lineStarts.push(lines);
      offsetStarts.push(offset);
      lines += chunk.lineCount;
      offset += chunk.length;
    }
    this.lineStarts = lineStarts;
    this.offsetStarts = offsetStarts;
    this.totalLines = lines;
    this.totalLength = offset;
  }

  private chunkIndexOf(line: number): number {
    return BinarySearchService.floorIndex(this.lineStarts, line);
  }

  private requireLine(line: number): void {
    TextPosition.requireCount(line, Resources.lineParameter);
    if (line >= this.totalLines)
      throw new ArgumentOutOfRangeException(Resources.lineParameter, line, Resources.formatLineOutOfRange(line, this.totalLines));
  }

  private requirePosition(position: TextPosition): void {
    const length: number = this.lineText(position.line).length;
    if (position.column > length)
      throw new ArgumentOutOfRangeException(Resources.columnParameter, position.column, Resources.formatColumnOutOfRange(position.column, position.line, length));
  }

  private static *chunksOf(text: string): Generator<void, LineChunk[]> {
    const chunks: LineChunk[] = [];
    let starts: number[] = [];
    let textEnds: number[] = [];
    let chunkStart: number = 0;
    let start: number = 0;
    let sliceEnd: number = Resources.openSliceLength;
    let feed: number = text.indexOf(Resources.lineFeed);
    let carriage: number = text.indexOf(Resources.carriageReturn);
    while (feed !== -1 || carriage !== -1) {
      const at: number = carriage === -1 || (feed !== -1 && feed < carriage) ? feed : carriage;
      const ending: string = at === feed ? Resources.lineFeed : feed === at + 1 ? Resources.carriageReturnLineFeed : Resources.carriageReturn;
      starts.push(start - chunkStart);
      textEnds.push(at - chunkStart);
      start = at + ending.length;
      if (feed !== -1 && feed < start)
        feed = text.indexOf(Resources.lineFeed, start);
      if (carriage !== -1 && carriage < start)
        carriage = text.indexOf(Resources.carriageReturn, start);
      if (textEnds.length === Resources.chunkLines) {
        starts.push(start - chunkStart);
        chunks.push(LineChunk.ofSource(text.slice(chunkStart, start), starts, textEnds));
        starts = [];
        textEnds = [];
        chunkStart = start;
      }
      if (start >= sliceEnd) {
        yield;
        sliceEnd = start + Resources.openSliceLength;
      }
    }
    starts.push(start - chunkStart, text.length - chunkStart);
    textEnds.push(text.length - chunkStart);
    chunks.push(LineChunk.ofSource(text.slice(chunkStart), starts, textEnds));

    return chunks;
  }

  private static chunk(texts: readonly string[], endings: readonly string[]): LineChunk[] {
    const chunks: LineChunk[] = [];
    for (let start = 0; start < texts.length; start += Resources.chunkLines)
      chunks.push(LineChunk.ofLines(texts.slice(start, start + Resources.chunkLines), endings.slice(start, start + Resources.chunkLines)));

    return chunks;
  }
}
