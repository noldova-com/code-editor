/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { TextPosition } from "@noldova/code.editor";
import { CodeBar, CodeBarAction, CodeDecorations, CodeGutterMarker, type CodeInsertedRows, CodeLineDecoration,
  type CodeRangeDecoration, CodeSpacer } from "@noldova/code.editor.angular";
import { ConflictState, type MergeConflict, type MergeDocument } from "@noldova/code.editor.merge";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Resources } from "../../resources.ts";
import type { ConflictChunk } from "./conflict-chunk.ts";
import { ConflictLines } from "./conflict-lines.ts";

export class MergeMarks {
  public static sideOf(chunks: IReadOnlyList<ConflictChunk>, background: string | null): CodeDecorations {
    const lines: List<CodeLineDecoration> = Object.isNull(background) ? new List<CodeLineDecoration>()
      : chunks.select(t => new CodeLineDecoration(t.line, t.length, background)).toList();
    const rows: List<CodeInsertedRows> = chunks.select((t): CodeInsertedRows => new CodeBar(String(t.index), t.line, t.note, null, t.actions)).toList();

    return new CodeDecorations(lines, new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), rows);
  }

  public static resultOf(merge: MergeDocument, editable: boolean): CodeDecorations {
    const lines: List<CodeLineDecoration> = new List<CodeLineDecoration>();
    const markers: List<CodeGutterMarker> = new List<CodeGutterMarker>();
    const rows: List<CodeInsertedRows> = new List<CodeInsertedRows>();
    for (const conflict of merge.conflicts) {
      const state: ConflictState = merge.stateOf(conflict.index);
      const start: TextPosition = merge.document.positionAt(conflict.start);
      const end: TextPosition = merge.document.positionAt(conflict.end);
      if (state === ConflictState.Unresolved)
        rows.add(new CodeBar(String(conflict.index), start.line, Resources.formatOpen(conflict.index + 1), Resources.warningIcon,
          editable ? MergeMarks.choicesOf(conflict) : new List<CodeBarAction>(), Resources.openBarBackground, Resources.textColor));
      const unresolved: boolean = state === ConflictState.Unresolved;
      if (conflict.start === conflict.end) {
        rows.add(new CodeSpacer(start.line, 1, MergeMarks.backgroundOf(state, true) ?? Resources.clearBackground, unresolved ? Resources.conflictSign : null,
          Resources.warningColor));
        continue;
      }
      const last: number = end.column === 0 ? end.line - 1 : end.line;
      const split: number = start.line + MergeMarks.firstLines(conflict, state);
      const firstBackground: string | null = MergeMarks.backgroundOf(state, true);
      const secondBackground: string | null = MergeMarks.backgroundOf(state, false);
      if (!Object.isNull(firstBackground) && split > start.line)
        lines.add(new CodeLineDecoration(start.line, split - start.line, firstBackground));
      if (!Object.isNull(secondBackground) && last >= split)
        lines.add(new CodeLineDecoration(split, last - split + 1, secondBackground));
      if (unresolved)
        for (let line: number = start.line; line <= last; line++)
          markers.add(new CodeGutterMarker(line, Resources.conflictSign, Resources.warningColor));
    }

    return new CodeDecorations(lines, new List<CodeRangeDecoration>(), markers, rows);
  }

  private static choicesOf(conflict: MergeConflict): IReadOnlyList<CodeBarAction> {
    const choices: List<CodeBarAction> = new List<CodeBarAction>([new CodeBarAction(Resources.oursAction, Resources.oursChoiceLabel),
      new CodeBarAction(Resources.theirsAction, Resources.theirsChoiceLabel), new CodeBarAction(Resources.bothAction, Resources.bothChoiceLabel)]);
    if (!Object.isNull(conflict.suggestion))
      choices.add(new CodeBarAction(Resources.suggestedAction, Resources.suggestedChoiceLabel, Resources.suggestedIcon));

    return choices;
  }

  private static firstLines(conflict: MergeConflict, state: ConflictState): number {
    switch (state) {
      case ConflictState.BothOursFirst:
        return ConflictLines.countOf(conflict.ours);
      case ConflictState.BothTheirsFirst:
        return ConflictLines.countOf(conflict.theirs);
      default:
        return 0;
    }
  }

  private static backgroundOf(state: ConflictState, first: boolean): string | null {
    switch (state) {
      case ConflictState.Unresolved:
        return null;
      case ConflictState.Ours:
        return Resources.oursBackground;
      case ConflictState.Theirs:
        return Resources.theirsBackground;
      case ConflictState.BothOursFirst:
        return first ? Resources.oursBackground : Resources.theirsBackground;
      case ConflictState.BothTheirsFirst:
        return first ? Resources.theirsBackground : Resources.oursBackground;
      default:
        return Resources.mixedBackground;
    }
  }
}
