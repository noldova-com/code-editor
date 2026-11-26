/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { IReadOnlyList } from "@noldova/context.collections";

import { EditKind } from "../../enums/edit-kind.js";
import type { EditTransaction } from "../../models/editing/edit-transaction.js";
import type { TextChange } from "../../models/text/text-change.js";
import type { TextDocument } from "../../models/text/text-document.js";
import { TextSelection } from "../../models/text/text-selection.js";
import { UndoStep } from "../../models/editing/undo-step.js";
import { Resources } from "../../resources.js";

export class UndoHistory {
  public groupMilliseconds: number = Resources.undoGroupMilliseconds;
  private readonly document: TextDocument;
  private readonly undoSteps: UndoStep[] = [];
  private readonly redoSteps: UndoStep[] = [];
  private stepLimit: number = Resources.undoLimit;

  public constructor(document: TextDocument) {
    this.document = document;
  }

  public get limit(): number {
    return this.stepLimit;
  }

  public set limit(limit: number) {
    this.stepLimit = limit;
    this.trim();
  }

  public get canUndo(): boolean {
    return this.undoSteps.length > 0;
  }

  public get canRedo(): boolean {
    return this.redoSteps.length > 0;
  }

  public apply(transaction: EditTransaction): TextChange {
    const change: TextChange = this.document.apply(transaction.edits);
    this.redoSteps.length = 0;
    const last: UndoStep | undefined = this.undoSteps.at(-1);
    if (!Object.isUndefined(last) && this.continues(last, transaction)) {
      last.changes.push(change);
      last.selectionsAfter = transaction.selectionsAfter;
      last.lastTime = transaction.time;
    }
    else {
      this.undoSteps.push(new UndoStep(transaction.kind, [change], transaction.selectionsBefore, transaction.selectionsAfter, transaction.time, false));
      this.trim();
    }

    return change;
  }

  public seal(): void {
    const last: UndoStep | undefined = this.undoSteps.at(-1);
    if (!Object.isUndefined(last))
      last.sealed = true;
  }

  public undo(): IReadOnlyList<TextSelection> | null {
    const step: UndoStep | undefined = this.undoSteps.pop();
    if (Object.isUndefined(step))
      return null;
    this.redoSteps.push(this.replay(step));

    return step.selectionsBefore;
  }

  public redo(): IReadOnlyList<TextSelection> | null {
    const step: UndoStep | undefined = this.redoSteps.pop();
    if (Object.isUndefined(step))
      return null;
    this.undoSteps.push(this.replay(step));

    return step.selectionsAfter;
  }

  private trim(): void {
    this.undoSteps.splice(0, Math.max(0, this.undoSteps.length - this.stepLimit));
  }

  private replay(step: UndoStep): UndoStep {
    const changes: TextChange[] = step.changes.toReversed().map(t => this.document.apply(t.inverse()));

    return new UndoStep(step.kind, changes, step.selectionsBefore, step.selectionsAfter, step.lastTime, true);
  }

  private continues(last: UndoStep, transaction: EditTransaction): boolean {
    return !last.sealed
      && last.kind === transaction.kind
      && transaction.kind !== EditKind.Other
      && transaction.time >= last.lastTime
      && transaction.time - last.lastTime <= this.groupMilliseconds
      && TextSelection.allEqual(last.selectionsAfter, transaction.selectionsBefore);
  }
}
