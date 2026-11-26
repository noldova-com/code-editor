/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { describe, expect, it } from "vitest";

import { CodeFold } from "../../../../src/app/models/folding/code-fold.ts";

describe("CodeFold", () => {
  it("takes its first line and line count, and refuses a negative or fractional one", () => {
    const fold: CodeFold = new CodeFold(2, 0, true);

    expect([fold.startLine, fold.lineCount, fold.collapsed, fold.label]).toEqual([2, 0, true, null]);
    expect(() => new CodeFold(0, -3, true)).toThrow(expect.objectContaining({ parameterName: "lineCount" }));
    expect(() => new CodeFold(-1, 3, false)).toThrow(expect.objectContaining({ parameterName: "startLine" }));
    expect(() => new CodeFold(0.5, 3, false)).toThrow(ArgumentOutOfRangeException);
  });
});
