/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type DiffSpan, type IBackgroundRunner, type IDiffAlgorithm, Required, SlicedRunner, type TextChange, type TextDocument, TextPosition, TextRange } from "@noldova/code.editor";
import { BinarySearchService, Dictionary, Enumerable, HashSet, type IReadOnlyList, List } from "@noldova/context.collections";
import { CancellationTokenSource } from "@noldova/context.threading";

import { DiffSide } from "../enums/diff-side.js";
import { ChangeRanges } from "../models/change-ranges.js";
import type { LineChange } from "../models/line-change.js";
import { LineDiffInput } from "../models/line-diff-input.js";
import { UnchangedRegion } from "../models/unchanged-region.js";
import { Resources } from "../resources.js";
import { ChangeMapper } from "./change-mapper.js";
import { DefaultDiffAlgorithm } from "./default-diff-algorithm.js";
import { LineChangeCodec } from "./line-change-codec.js";
import { LineDiffJob } from "./line-diff-job.js";

export class DocumentDiff implements Disposable {
  public readonly original: TextDocument;
  public readonly modified: TextDocument;
  public readonly algorithm: IDiffAlgorithm;
  private readonly runner: IBackgroundRunner;
  private readonly job: LineDiffJob;
  private readonly listeners: HashSet<() => void> = new HashSet<() => void>();
  private readonly ranges: Dictionary<LineChange, ChangeRanges> = new Dictionary<LineChange, ChangeRanges>();
  private readonly stops: List<() => void>;
  private changeList: IReadOnlyList<LineChange> = new List<LineChange>();
  private limit: number = Resources.defaultCharacterDiffLimit;
  private generation: number = 0;
  private running: CancellationTokenSource | null = null;
  private waiting: boolean = false;
  private lastFailed: boolean = false;
  private disposed: boolean = false;

  public constructor(original: TextDocument, modified: TextDocument, algorithm: IDiffAlgorithm = new DefaultDiffAlgorithm(),
    runner: IBackgroundRunner = new SlicedRunner()) {
    this.original = original;
    this.modified = modified;
    this.algorithm = algorithm;
    this.runner = runner;
    this.job = new LineDiffJob(algorithm);
    this.stops = new List<() => void>([original.onChange(t => this.onEdit(t, DiffSide.Original)), modified.onChange(t => this.onEdit(t, DiffSide.Modified))]);
    this.request();
  }

  public get changes(): IReadOnlyList<LineChange> {
    return this.changeList;
  }

  public get pending(): boolean {
    return this.waiting;
  }

  public get failed(): boolean {
    return this.lastFailed;
  }

  public get characterDiffLimit(): number {
    return this.limit;
  }

  public set characterDiffLimit(value: number) {
    if (value === this.limit)
      return;
    this.limit = value;
    this.notify();
  }

  public async settledAsync(): Promise<void> {
    while (this.waiting && !this.disposed) {
      const settled: PromiseWithResolvers<void> = Promise.withResolvers<void>();
      const stop: () => void = this.onChange(() => settled.resolve());
      await settled.promise;
      stop();
    }
  }

  public rangesOf(change: LineChange): ChangeRanges {
    let ranges: ChangeRanges | undefined = this.ranges.tryGet(change);
    if (Object.isUndefined(ranges)) {
      ranges = this.characterRanges(change);
      this.ranges.set(change, ranges);
    }

    return ranges;
  }

  public changeAt(line: number, side: DiffSide): LineChange | null {
    let low: number = 0;
    let high: number = this.changeList.count();
    while (low < high) {
      const middle: number = Math.floor((low + high) / 2);
      if (this.changeList.get(middle).startOf(side) <= line)
        low = middle + 1;
      else
        high = middle;
    }
    const change: LineChange | undefined = this.changeList.tryGet(low - 1);

    return !Object.isUndefined(change) && line < change.endOf(side) ? change : null;
  }

  public changeAfter(line: number, side: DiffSide): LineChange | null {
    return this.changeList.firstOrDefault(t => t.startOf(side) > line) ?? this.changeList.firstOrDefault() ?? null;
  }

  public changeBefore(line: number, side: DiffSide): LineChange | null {
    return this.changeList.lastOrDefault(t => t.startOf(side) < line) ?? this.changeList.lastOrDefault() ?? null;
  }

  public unchangedRegions(context: number, minimum: number): IReadOnlyList<UnchangedRegion> {
    const regions: List<UnchangedRegion> = new List<UnchangedRegion>();
    let original: number = 0;
    let modified: number = 0;
    let first: boolean = true;
    for (const change of this.changeList) {
      DocumentDiff.addRegion(regions, original, modified, change.originalStart - original, first ? 0 : context, context, minimum);
      first = false;
      original = change.originalEnd;
      modified = change.modifiedEnd;
    }
    if (!first)
      DocumentDiff.addRegion(regions, original, modified, this.original.lineCount - original, context, 0, minimum);

    return regions;
  }

  public onChange(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => this.listeners.remove(listener);
  }

  public [Symbol.dispose](): void {
    this.disposed = true;
    this.running?.cancel();
    for (const stop of this.stops)
      stop();
    this.notify();
  }

  private onEdit(change: TextChange, side: DiffSide): void {
    this.changeList = ChangeMapper.through(this.changeList, change, side);
    this.request();
    this.notify();
  }

  private request(): void {
    this.generation++;
    this.waiting = true;
    if (Object.isNull(this.running))
      this.start();
  }

  private start(): void {
    const generation: number = this.generation;
    const running: CancellationTokenSource = new CancellationTokenSource();
    this.running = running;
    const input: LineDiffInput = new LineDiffInput(DocumentDiff.allLines(this.original), DocumentDiff.allLines(this.modified));
    this.runner.runAsync(this.job, input, running.token)
      .then(t => this.land(generation, LineChangeCodec.decode(t)), () => this.land(generation, null));
  }

  private land(generation: number, changes: IReadOnlyList<LineChange> | null): void {
    this.running?.[Symbol.dispose]();
    this.running = null;
    if (this.disposed)
      return;
    if (generation !== this.generation) {
      this.start();

      return;
    }
    this.waiting = false;
    this.lastFailed = Object.isNull(changes);
    if (!Object.isNull(changes))
      this.changeList = changes;
    this.notify();
  }

  private notify(): void {
    this.ranges.clear();
    for (const listener of this.listeners)
      listener();
  }

  private characterRanges(change: LineChange): ChangeRanges {
    const original: IReadOnlyList<string> = DocumentDiff.linesOf(this.original, change.originalStart, change.originalEnd);
    const modified: IReadOnlyList<string> = DocumentDiff.linesOf(this.modified, change.modifiedStart, change.modifiedEnd);
    const originalText: string = original.toArray().join(Resources.lineFeed);
    const modifiedText: string = modified.toArray().join(Resources.lineFeed);
    if (!original.any() || !modified.any() || originalText.length + modifiedText.length > this.limit)
      return new ChangeRanges(new List<TextRange>(), new List<TextRange>());
    const changes: IReadOnlyList<DiffSpan> = this.algorithm.characters(originalText, modifiedText);

    return new ChangeRanges(
      DocumentDiff.rangesIn(original, change.originalStart, changes, DiffSide.Original),
      DocumentDiff.rangesIn(modified, change.modifiedStart, changes, DiffSide.Modified));
  }

  private static addRegion(regions: List<UnchangedRegion>, original: number, modified: number, length: number, before: number, after: number,
    minimum: number): void {
    const hidden: number = length - before - after;
    if (hidden >= minimum)
      regions.add(new UnchangedRegion(original + before, modified + before, hidden));
  }

  private static allLines(document: TextDocument): readonly string[] {
    return Enumerable.range(0, document.lineCount).select(t => document.lineText(t)).toArray();
  }

  private static linesOf(document: TextDocument, start: number, end: number): IReadOnlyList<string> {
    return Enumerable.range(start, end - start).select(t => document.lineText(t)).toList();
  }

  private static rangesIn(lines: IReadOnlyList<string>, firstLine: number, changes: IReadOnlyList<DiffSpan>, side: DiffSide): IReadOnlyList<TextRange> {
    const starts: readonly number[] = lines
      .aggregate(new List<number>([0]), (total, line) => {
        total.add(total.last() + line.length + Resources.lineFeed.length);

        return total;
      })
      .toArray();
    const original: boolean = side === DiffSide.Original;

    return changes
      .where(t => original ? t.originalStart < t.originalEnd : t.modifiedStart < t.modifiedEnd)
      .select(t => original
        ? new TextRange(DocumentDiff.positionIn(starts, firstLine, t.originalStart), DocumentDiff.positionIn(starts, firstLine, t.originalEnd))
        : new TextRange(DocumentDiff.positionIn(starts, firstLine, t.modifiedStart), DocumentDiff.positionIn(starts, firstLine, t.modifiedEnd)))
      .toList();
  }

  private static positionIn(starts: readonly number[], firstLine: number, offset: number): TextPosition {
    const line: number = BinarySearchService.floorIndex(starts, offset);

    return new TextPosition(firstLine + line, offset - Required.at(starts, line));
  }
}
