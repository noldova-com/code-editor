/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ConflictState } from "@noldova/code.editor.merge";

export class Resources {
  public static readonly empty: string = "";
  public static readonly lineFeed: string = "\n";
  public static readonly keyDown: "keydown" = "keydown";
  public static readonly mergeEditorClass: string = "nol-merge-editor";
  public static readonly panelsClass: string = "nol-merge-editor-panels";
  public static readonly panelsClassBinding: string = `[class.${Resources.panelsClass}]`;
  public static readonly conflictSign: string = "!";
  public static readonly warningColor: string = "var(--nol-warning)";
  public static readonly textColor: string = "var(--nol-text)";
  public static readonly oursBackground: string = "color-mix(in srgb, var(--nol-author-3) 16%, transparent)";
  public static readonly theirsBackground: string = "color-mix(in srgb, var(--nol-author-5) 16%, transparent)";
  public static readonly mixedBackground: string = `linear-gradient(90deg, ${Resources.oursBackground}, ${Resources.theirsBackground})`;
  public static readonly clearBackground: string = "transparent";
  public static readonly openBarBackground: string = "color-mix(in srgb, var(--nol-warning) 18%, transparent)";
  public static readonly takeAction: string = "take";
  public static readonly oursAction: string = "ours";
  public static readonly theirsAction: string = "theirs";
  public static readonly bothAction: string = "both";
  public static readonly suggestedAction: string = "suggested";
  public static readonly keyArrowDown: string = "ArrowDown";
  public static readonly keyArrowUp: string = "ArrowUp";
  public static readonly resultLabel: string = "Result";
  public static readonly baseLabel: string = "Base";
  public static readonly noConflicts: string = "No conflicts";
  public static readonly noMoreConflicts: string = "No more conflicts";
  public static readonly acceptOursLabel: string = "Accept ours";
  public static readonly acceptTheirsLabel: string = "Accept theirs";
  public static readonly acceptBothOursFirstLabel: string = "Both, ours first";
  public static readonly acceptBothTheirsFirstLabel: string = "Both, theirs first";
  public static readonly resetLabel: string = "Reset";
  public static readonly takeLabel: string = "Take";
  public static readonly takeIcon: string = "add";
  public static readonly suggestedIcon: string = "auto_awesome";
  public static readonly warningIcon: string = "warning";
  public static readonly oursChoiceLabel: string = "Ours";
  public static readonly theirsChoiceLabel: string = "Theirs";
  public static readonly bothChoiceLabel: string = "Both";
  public static readonly suggestedChoiceLabel: string = "Suggested";
  public static readonly previousConflictLabel: string = "Previous conflict";
  public static readonly nextConflictLabel: string = "Next conflict";
  public static readonly wordSeparator: string = " ";
  public static readonly partSeparator: string = ", ";
  public static readonly chunkSeparator: string = " · ";
  public static readonly labelSeparator: string = ": ";
  public static readonly conflictWord: string = "Conflict";
  public static readonly ofWord: string = "of";
  public static readonly unresolvedWord: string = "unresolved";
  public static readonly oneConflict: string = "conflict";
  public static readonly manyConflicts: string = "conflicts";
  public static readonly isOpen: string = "is open.";
  public static readonly openHint: string = "Take ours, theirs or both, or type the result here.";
  public static readonly sideDeleted: string = "this side deleted the file.";
  public static readonly stateNames: Readonly<Record<ConflictState, string>> = {
    Unresolved: "unresolved",
    Ours: "ours accepted",
    Theirs: "theirs accepted",
    BothOursFirst: "both accepted, ours first",
    BothTheirsFirst: "both accepted, theirs first",
    Suggested: "suggested",
    Edited: "edited"
  };

  public static formatConflict(position: number, count: number, state: ConflictState, unresolved: number): string {
    return [Resources.words(Resources.conflictWord, String(position), Resources.ofWord, String(count)), Resources.stateNames[state],
      Resources.words(String(unresolved), Resources.unresolvedWord)].join(Resources.partSeparator);
  }

  public static formatChunk(position: number, state: ConflictState): string {
    return `${Resources.words(Resources.conflictWord, String(position))}${Resources.chunkSeparator}${Resources.stateNames[state]}`;
  }

  public static formatOpen(position: number): string {
    return Resources.words(Resources.conflictWord, String(position), Resources.isOpen, Resources.openHint);
  }

  public static formatUnresolved(unresolved: number, count: number): string {
    return Resources.words(String(unresolved), Resources.ofWord, String(count), count === 1 ? Resources.oneConflict : Resources.manyConflicts, Resources.unresolvedWord);
  }

  public static formatDeleted(side: string): string {
    return `${side}${Resources.labelSeparator}${Resources.sideDeleted}`;
  }

  private static words(...parts: string[]): string {
    return parts.join(Resources.wordSeparator);
  }
}
