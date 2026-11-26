/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { AppliedEdit, TextChange } from "@noldova/code.editor";
import { Enumerable, type IReadOnlyList, List } from "@noldova/context.collections";

import { DiffSide } from "../enums/diff-side.js";
import { LineChange } from "../models/line-change.js";

export class ChangeMapper {
  public static through(changes: IReadOnlyList<LineChange>, change: TextChange, side: DiffSide): IReadOnlyList<LineChange> {
    const mapped: IReadOnlyList<LineChange> = Enumerable.from(change.edits)
      .orderByDescending(t => t.oldRange.start, (a, b) => a.compareTo(b))
      .aggregate(changes, (total, edit) => ChangeMapper.throughEdit(total, edit, side));

    return mapped.select((t, i) => new LineChange(i, t.originalStart, t.originalEnd, t.modifiedStart, t.modifiedEnd)).toList();
  }

  private static throughEdit(changes: IReadOnlyList<LineChange>, edit: AppliedEdit, side: DiffSide): IReadOnlyList<LineChange> {
    const other: DiffSide = side === DiffSide.Original ? DiffSide.Modified : DiffSide.Original;
    const start: number = edit.oldRange.start.line;
    const end: number = edit.oldRange.end.line + 1;
    const delta: number = edit.newRange.end.line - edit.newRange.start.line - (edit.oldRange.end.line - edit.oldRange.start.line);
    let merged: LineChange = ChangeMapper.make(side, start, end, ChangeMapper.otherStart(changes, start, side), ChangeMapper.otherEnd(changes, end, side));
    const rest: List<LineChange> = new List<LineChange>(changes);
    let touching: List<LineChange> = ChangeMapper.overlapping(rest, merged);
    while (touching.any()) {
      merged = touching.aggregate(merged, (a, b) => ChangeMapper.union(a, b));
      rest.removeAll(t => touching.contains(t));
      touching = ChangeMapper.overlapping(rest, merged);
    }
    const grown: LineChange = ChangeMapper.make(side, merged.startOf(side), merged.endOf(side) + delta, merged.startOf(other), merged.endOf(other));

    return rest
      .select(t => t.startOf(side) >= end ? ChangeMapper.make(side, t.startOf(side) + delta, t.endOf(side) + delta, t.startOf(other), t.endOf(other)) : t)
      .append(grown)
      .orderBy(t => t.startOf(side))
      .thenBy(t => t.startOf(other))
      .toList();
  }

  private static overlapping(changes: List<LineChange>, change: LineChange): List<LineChange> {
    return changes.where(t => ChangeMapper.overlaps(t, change)).toList();
  }

  private static otherStart(changes: IReadOnlyList<LineChange>, line: number, side: DiffSide): number {
    const before: LineChange | undefined = changes.lastOrDefault(t => t.startOf(side) <= line);
    if (Object.isUndefined(before))
      return line;
    const other: DiffSide = side === DiffSide.Original ? DiffSide.Modified : DiffSide.Original;

    return line < before.endOf(side) ? before.startOf(other) : line - before.endOf(side) + before.endOf(other);
  }

  private static otherEnd(changes: IReadOnlyList<LineChange>, line: number, side: DiffSide): number {
    const before: LineChange | undefined = changes.lastOrDefault(t => t.startOf(side) < line);
    if (Object.isUndefined(before))
      return line;
    const other: DiffSide = side === DiffSide.Original ? DiffSide.Modified : DiffSide.Original;

    return line <= before.endOf(side) ? before.endOf(other) : line - before.endOf(side) + before.endOf(other);
  }

  private static overlaps(a: LineChange, b: LineChange): boolean {
    return a.originalStart < b.originalEnd && b.originalStart < a.originalEnd || a.modifiedStart < b.modifiedEnd && b.modifiedStart < a.modifiedEnd;
  }

  private static union(a: LineChange, b: LineChange): LineChange {
    return new LineChange(0, Math.min(a.originalStart, b.originalStart), Math.max(a.originalEnd, b.originalEnd),
      Math.min(a.modifiedStart, b.modifiedStart), Math.max(a.modifiedEnd, b.modifiedEnd));
  }

  private static make(side: DiffSide, start: number, end: number, otherStart: number, otherEnd: number): LineChange {
    return side === DiffSide.Original ? new LineChange(0, start, end, otherStart, otherEnd) : new LineChange(0, otherStart, otherEnd, start, end);
  }
}
