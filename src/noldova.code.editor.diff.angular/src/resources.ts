/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";

export class Resources {
  public static readonly empty: string = "";
  public static readonly keyDown: "keydown" = "keydown";
  public static readonly nextChangeKey: string = "alt+down";
  public static readonly previousChangeKey: string = "alt+up";
  public static readonly nextChangeCommand: string = "diffEditor.nextChange";
  public static readonly previousChangeCommand: string = "diffEditor.previousChange";
  public static readonly contextLinesSetting: string = "diff.contextLines";
  public static readonly minimumHiddenLinesSetting: string = "diff.minimumHiddenLines";
  public static readonly characterDiffLimitSetting: string = "diff.characterDiffLimit";
  public static readonly inlineBreakpointSetting: string = "diff.inlineBreakpoint";
  public static readonly hostClass: string = "nol-diff-editor";
  public static readonly inlineClass: string = "nol-diff-editor-inline";
  public static readonly inlineClassBinding: string = `[class.${Resources.inlineClass}]`;
  public static readonly paneClass: string = "nol-diff-editor-pane";
  public static readonly statusClass: string = "nol-diff-editor-status";
  public static readonly diffContribution: string = "noldova.code.editor.diff.angular";
  public static readonly navigatorFeature: string = "diffNavigator";
  public static readonly inDiffEditorCondition: string = "inDiffEditor";
  public static readonly inDiffEditorDescription: string = "The focus is in a diff view.";
  public static readonly contextLinesDescription: string = "The unchanged lines a diff view keeps next to each change.";
  public static readonly minimumHiddenLinesDescription: string = "The fewest unchanged lines a diff view folds away.";
  public static readonly characterDiffLimitDescription: string = "The most characters on both sides of a change that a diff compares character by character.";
  public static readonly inlineBreakpointDescription: string = "The width in rem below which a diff view in the automatic layout shows the change inline.";
  public static readonly defaultContextLines: number = 3;
  public static readonly defaultMinimumHiddenLines: number = 3;
  public static readonly defaultCharacterDiffLimit: number = 20000;
  public static readonly defaultInlineBreakpoint: number = 50;
  public static readonly contextLinesMinimum: number = 0;
  public static readonly minimumHiddenLinesMinimum: number = 1;
  public static readonly characterDiffLimitMinimum: number = 0;
  public static readonly inlineBreakpointMinimum: number = 0;
  public static readonly addedSign: string = "+";
  public static readonly removedSign: string = "-";
  public static readonly addedColor: string = "var(--nol-added)";
  public static readonly removedColor: string = "var(--nol-removed)";
  public static readonly addedBackground: string = "var(--nol-added-background)";
  public static readonly removedBackground: string = "var(--nol-removed-background)";
  public static readonly addedChange: string = "var(--nol-added-change)";
  public static readonly removedChange: string = "var(--nol-removed-change)";
  public static readonly noChanges: string = "No changes";
  public static readonly oneLine: string = "line";
  public static readonly manyLines: string = "lines";
  public static readonly partSeparator: string = ", ";
  public static readonly wordSeparator: string = " ";
  public static readonly changeWord: string = "Change";
  public static readonly ofWord: string = "of";
  public static readonly removedWord: string = "removed";
  public static readonly addedWord: string = "added";

  public static formatChange(position: number, count: number, removed: number, added: number): string {
    const parts: List<string> = new List<string>();
    if (removed > 0)
      parts.add(Resources.words(String(removed), Resources.linesWord(removed), Resources.removedWord));
    if (added > 0)
      parts.add(removed > 0 ? Resources.words(String(added), Resources.addedWord) : Resources.words(String(added), Resources.linesWord(added), Resources.addedWord));

    return [Resources.words(Resources.changeWord, String(position), Resources.ofWord, String(count)), ...parts.toArray()].join(Resources.partSeparator);
  }

  private static words(...parts: string[]): string {
    return parts.join(Resources.wordSeparator);
  }

  private static linesWord(count: number): string {
    return count === 1 ? Resources.oneLine : Resources.manyLines;
  }
}
