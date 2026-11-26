/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type LineSegment, TokenStyles, type TokenTypeRegistry } from "@noldova/code.editor";
import type { IReadOnlyList } from "@noldova/context.collections";

import type { CodeRowKind } from "./app/enums/code-row-kind.ts";

export class Resources {
  public static readonly empty: string = "";
  public static readonly space: string = " ";
  public static readonly tab: string = "\t";
  public static readonly lineFeed: string = "\n";
  public static readonly viewFeature: string = "view";
  public static readonly viewContribution: string = "noldova.code.editor.angular";
  public static readonly findVisibleDescription: string = "The find panel is open.";
  public static readonly canvasContext: "2d" = "2d";
  public static readonly plainText: string = "text/plain";
  public static readonly files: string = "Files";
  public static readonly copyEffect: "copy" = "copy";
  public static readonly noEffect: "none" = "none";
  public static readonly mouseMove: "mousemove" = "mousemove";
  public static readonly mouseUp: "mouseup" = "mouseup";
  public static readonly message: "message" = "message";
  public static readonly error: "error" = "error";
  public static readonly runnerDisposed: string = "the runner was disposed";
  public static readonly finalPeriodPattern: RegExp = /\.$/u;
  public static readonly inputInsertText: string = "insertText";
  public static readonly inputInsertReplacementText: string = "insertReplacementText";
  public static readonly inputInsertLineBreak: string = "insertLineBreak";
  public static readonly inputInsertParagraph: string = "insertParagraph";
  public static readonly inputContextLines: number = 3;
  public static readonly forward: "forward" = "forward";
  public static readonly backward: "backward" = "backward";
  public static readonly marginLines: number = 10;
  public static readonly backgroundSliceMilliseconds: number = 5;
  public static readonly statusSliceMilliseconds: number = 2;
  public static readonly plainSegmentClass: string = "nol-code-editor-plain";
  public static readonly tokenClassPrefix: string = "nol-code-editor-token-";
  public static readonly textTokenClassPrefix: string = "nol-code-text-token-";
  public static readonly tokenStyleAttribute: string = "data-nol-code-tokens";
  public static readonly rowClassPrefix: string = "nol-code-editor-row-";
  public static readonly foldOpenIcon: string = "expand_more";
  public static readonly foldClosedIcon: string = "chevron_right";
  public static readonly inherit: string = "inherit";
  public static readonly manyLines: string = "lines";
  public static readonly unchangedWord: string = "unchanged";
  public static readonly keyEnter: string = "Enter";
  public static readonly keyEscape: string = "Escape";
  public static readonly findLabel: string = "Find";
  public static readonly replaceLabel: string = "Replace";
  public static readonly matchCaseLabel: string = "Match case";
  public static readonly wholeWordLabel: string = "Match whole word";
  public static readonly regexLabel: string = "Use regular expression";
  public static readonly previousMatchLabel: string = "Previous match";
  public static readonly nextMatchLabel: string = "Next match";
  public static readonly closeLabel: string = "Close";
  public static readonly replaceOneLabel: string = "Replace";
  public static readonly replaceAllLabel: string = "Replace all";
  public static readonly noResults: string = "No results";
  public static readonly invalidPattern: string = "Invalid pattern";
  public static readonly unknownPosition: string = "?";
  public static readonly ofWord: string = "of";
  public static readonly moreMatches: string = "+";
  public static readonly beforeLineParameter: string = "beforeLine";
  public static readonly rowCountParameter: string = "rowCount";
  public static readonly startLineParameter: string = "startLine";
  public static readonly lineCountParameter: string = "lineCount";
  public static readonly lineParameter: string = "line";
  public static readonly styleElement: "style" = "style";
  public static readonly findKeys: string = "mod+f";
  public static readonly findAlternateKeys: string = "mod+shift+f";
  public static readonly replaceMacKeys: string = "cmd+alt+f";
  public static readonly replaceKeys: string = "ctrl+h";
  public static readonly closeFindKeys: string = "escape";
  public static readonly foldKeys: string = "ctrl+shift+BracketLeft";
  public static readonly foldMacKeys: string = "cmd+alt+BracketLeft";
  public static readonly unfoldKeys: string = "ctrl+shift+BracketRight";
  public static readonly unfoldMacKeys: string = "cmd+alt+BracketRight";
  public static readonly lineClass: string = "nol-code-editor-line";
  public static readonly changeClass: string = "nol-code-editor-change";
  public static readonly lineNumberClass: string = "nol-code-editor-line-number";
  public static readonly paintClass: string = "nol-code-editor-paint";
  public static readonly codeRowClass: string = "nol-code-editor-row";
  public static readonly rowSpacerClass: string = "nol-code-editor-row-spacer";
  public static readonly rowFoldClass: string = "nol-code-editor-row-fold";
  public static readonly lineFoldClass: string = "nol-code-editor-line-fold";
  public static readonly foldToggleClass: string = "nol-code-editor-fold-toggle";
  public static readonly foldIconClass: string = "nol-code-editor-fold-icon";
  public static readonly scrollerClass: string = "nol-code-editor-scroller";
  public static readonly inputClass: string = "nol-code-editor-input";
  public static readonly caretClass: string = "nol-code-editor-caret";
  public static readonly matchClass: string = "nol-code-editor-match";
  public static readonly signClass: string = "nol-code-editor-sign";
  public static readonly numberClass: string = "nol-code-editor-number";
  public static readonly findFieldClass: string = "nol-find-bar-field";
  public static readonly codeEditorClass: string = "nol-code-editor";
  public static readonly focusedClass: string = "nol-code-editor-focused";
  public static readonly focusedClassBinding: string = `[class.${Resources.focusedClass}]`;
  public static readonly codeTextClass: string = "nol-code-text";
  public static readonly findBarClass: string = "nol-find-bar";
  public static readonly findCommand: string = "editor.action.find";
  public static readonly replaceCommand: string = "editor.action.replace";
  public static readonly closeFindCommand: string = "editor.action.closeFind";
  public static readonly foldCommand: string = "editor.fold";
  public static readonly unfoldCommand: string = "editor.unfold";
  public static readonly findVisibleKey: string = "findVisible";
  public static readonly backgroundJobFailedExceptionName: string = "BackgroundJobFailedException";
  public static readonly decimalRadix: number = 10;
  public static readonly period: string = ".";
  public static readonly backgroundJobPhrase: string = "The background job";
  public static readonly failedInWorkerPhrase: string = "failed in the worker:";
  public static readonly pastDocumentPhrase: string = "The lines must end within the document's";

  public static segmentClass(registry: TokenTypeRegistry, segment: LineSegment): string {
    const classes: IReadOnlyList<string> = TokenStyles.classesOf(registry, segment.type, segment.modifiers, Resources.tokenClassPrefix);

    return classes.any() ? Resources.formatClassList(classes) : Resources.plainSegmentClass;
  }

  public static formatClassList(classes: IReadOnlyList<string>): string {
    return classes.aggregate(Resources.empty, (total, t) => total === Resources.empty ? t : `${total}${Resources.space}${t}`);
  }

  public static rowClass(kind: CodeRowKind): string {
    return `${Resources.rowClassPrefix}${kind.toLowerCase()}`;
  }

  public static formatMatches(position: number, count: number, complete: boolean): string {
    return `${position === 0 ? Resources.unknownPosition : position} ${Resources.ofWord} ${count}${complete ? Resources.empty : Resources.moreMatches}`;
  }

  public static formatBackgroundJobFailed(job: string, reason: string): string {
    return `${Resources.backgroundJobPhrase} ${job} ${Resources.failedInWorkerPhrase} ${reason.replace(Resources.finalPeriodPattern, Resources.empty)}${Resources.period}`;
  }

  public static formatPastDocument(lineCount: number): string {
    return `${Resources.pastDocumentPhrase} ${lineCount} ${Resources.manyLines}${Resources.period}`;
  }

  public static formatHidden(count: number): string {
    return `${count} ${Resources.unchangedWord} ${Resources.manyLines}`;
  }
}
