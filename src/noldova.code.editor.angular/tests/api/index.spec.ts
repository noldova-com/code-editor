/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { BuiltInTokenTypes, TextDocument } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";
import { describe, expect, it } from "vitest";

import { BackgroundJobFailedException, BackgroundTicker, CodeBar, CodeBarAction, CodeBarActionEvent, CodeDecorations, CodeEditorClasses, CodeEditorComponent, CodeEditorRegistries,
  CodeEmbeddedLines, CodeFold, CodeGutterMarker, type CodeInsertedRows, CodeLineDecoration, CodeRangeDecoration, CodeSpacer, CodeTextComponent, KeyScope, LanguageTokenizer, LineIndex,
  WorkerRunner } from "../../src/api/index.ts";
import { Resources } from "../../src/resources.ts";

describe("the package's API", () => {
  it("exports the views, the decorations API, its inserted rows one of three kinds, and the helpers other view packages build on", () => {
    const exported: readonly unknown[] = [CodeBarAction, CodeBarActionEvent, CodeEditorComponent, CodeEditorRegistries, CodeFold, CodeGutterMarker, CodeLineDecoration, CodeRangeDecoration,
      CodeTextComponent, BackgroundJobFailedException, BackgroundTicker, KeyScope, LanguageTokenizer, LineIndex, WorkerRunner];
    expect(exported.every(t => !Object.isUndefined(t))).toBe(true);
    expect(CodeEditorClasses.token(BuiltInTokenTypes.keyword.id)).toBe(`${Resources.tokenClassPrefix}${BuiltInTokenTypes.keyword.id}`);
    const rows: readonly CodeInsertedRows[] = [new CodeBar("bar", 0, "Note", null, new List<CodeBarAction>()), new CodeSpacer(1, 2), new CodeEmbeddedLines(1, TextDocument.fromText("a\nb\nc"), 1, 2)];
    expect(rows.map(t => [t.beforeLine, t.rowCount])).toEqual([[0, 1], [1, 2], [1, 2]]);
    expect(new CodeDecorations().rows.toArray()).toEqual([]);
  });
});
