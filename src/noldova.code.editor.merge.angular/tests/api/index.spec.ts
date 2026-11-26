/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ConflictChoice as MergeConflictChoice, ConflictState as MergeConflictState } from "@noldova/code.editor.merge";
import { describe, expect, it } from "vitest";

import { ConflictChoice, ConflictState } from "../../src/api/index.ts";

describe("the package's API", () => {
  it("exports the merge's conflict choices and states, so a module reads and sets a conflict with no import from the merge core", () => {
    expect([ConflictChoice, ConflictState]).toEqual([MergeConflictChoice, MergeConflictState]);
  });
});
