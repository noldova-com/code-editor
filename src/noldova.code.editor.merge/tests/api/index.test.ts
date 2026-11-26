/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import * as api from "@noldova/code.editor.merge";

@TestClass
export class CodeEditorMergeApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    const exportNames: readonly string[] = ["ConflictChoice", "ConflictMarkersException", "ConflictState", "MergeConflict", "MergeDocument"];

    Assert.areEqual(exportNames.join(","), Object.keys(api).sort().join(","));
  }
}
