/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TextDocument } from "@noldova/code.editor";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { describe, expect, it } from "vitest";

import { CodeEmbeddedLines } from "../../../../src/app/models/rows/code-embedded-lines.ts";

describe("CodeEmbeddedLines", () => {
  it("takes a row for each line it shows, and refuses lines that aren't whole counts or end past the document", () => {
    const other: TextDocument = TextDocument.fromText("a\nb\nc");
    const lines: CodeEmbeddedLines = new CodeEmbeddedLines(1, other, 1, 2);

    expect([lines.beforeLine, lines.startLine, lines.lineCount, lines.rowCount]).toEqual([1, 1, 2, 2]);
    expect(new CodeEmbeddedLines(0, other, 3, 0).rowCount).toBe(0);
    expect(() => new CodeEmbeddedLines(0, other, 2, 5)).toThrow(expect.objectContaining({ parameterName: "lineCount", actualValue: 5 }));
    expect(() => new CodeEmbeddedLines(0, other, -1, 1)).toThrow(expect.objectContaining({ parameterName: "startLine" }));
    expect(() => new CodeEmbeddedLines(0, other, 0, 1.5)).toThrow(ArgumentOutOfRangeException);
    expect(() => new CodeEmbeddedLines(-1, other, 0, 1)).toThrow(expect.objectContaining({ parameterName: "beforeLine" }));
  });
});
