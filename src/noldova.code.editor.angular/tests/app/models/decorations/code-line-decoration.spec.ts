/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { describe, expect, it } from "vitest";

import { CodeLineDecoration } from "../../../../src/app/models/decorations/code-line-decoration.ts";

describe("CodeLineDecoration", () => {
  it("takes its first line and line count, and refuses a negative or fractional one", () => {
    const decoration: CodeLineDecoration = new CodeLineDecoration(0, 0, "red");

    expect([decoration.startLine, decoration.lineCount, decoration.background]).toEqual([0, 0, "red"]);
    expect(() => new CodeLineDecoration(-1, 1, "red")).toThrow(expect.objectContaining({ parameterName: "startLine" }));
    expect(() => new CodeLineDecoration(1, 2.5, "red")).toThrow(expect.objectContaining({ parameterName: "lineCount" }));
    expect(() => new CodeLineDecoration(1, -1, "red")).toThrow(ArgumentOutOfRangeException);
  });
});
