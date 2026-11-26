/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { ConflictChoice } from "../enums/conflict-choice.js";
import { ConflictState } from "../enums/conflict-state.js";
import { Resources } from "../resources.js";

export class MergeConflict {
  public readonly index: number;
  public readonly base: string;
  public readonly ours: string;
  public readonly theirs: string;
  private startOffset: number;
  private endOffset: number;
  private suggested: string | null = null;

  public constructor(index: number, base: string, ours: string, theirs: string, start: number, end: number) {
    this.index = index;
    this.base = base;
    this.ours = ours;
    this.theirs = theirs;
    this.startOffset = start;
    this.endOffset = end;
  }

  public get start(): number {
    return this.startOffset;
  }

  public get end(): number {
    return this.endOffset;
  }

  public get suggestion(): string | null {
    return this.suggested;
  }

  public moveTo(start: number, end: number): void {
    this.startOffset = start;
    this.endOffset = end;
  }

  public suggest(text: string): void {
    this.suggested = text;
  }

  public choiceText(choice: ConflictChoice): string {
    switch (choice) {
      case ConflictChoice.Ours:
        return this.ours;
      case ConflictChoice.Theirs:
        return this.theirs;
      case ConflictChoice.BothOursFirst:
        return MergeConflict.join(this.ours, this.theirs);
      case ConflictChoice.BothTheirsFirst:
        return MergeConflict.join(this.theirs, this.ours);
    }
  }

  public stateFor(text: string): ConflictState {
    if (text === this.suggested)
      return ConflictState.Suggested;
    if (text === this.ours)
      return ConflictState.Ours;
    if (text === this.theirs)
      return ConflictState.Theirs;
    if (text === this.choiceText(ConflictChoice.BothOursFirst))
      return ConflictState.BothOursFirst;
    if (text === this.choiceText(ConflictChoice.BothTheirsFirst))
      return ConflictState.BothTheirsFirst;

    return text === this.base ? ConflictState.Unresolved : ConflictState.Edited;
  }

  private static join(first: string, second: string): string {
    return first === String.empty || second === String.empty || Resources.lineEndPattern.test(first)
      ? first + second
      : first + Resources.lineFeed + second;
  }
}
