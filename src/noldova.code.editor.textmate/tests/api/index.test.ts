/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import * as api from "@noldova/code.editor.textmate";

@TestClass
export class CodeEditorTextMateApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    const exportNames: readonly string[] = ["ScopeRule", "ScopeRules", "TextMateContribution", "TextMateGrammar", "TextMateGrammarMissingException", "TextMateHighlighter",
      "TextMateLanguages", "TextMateOptions", "TextMateSettings", "TextMateState", "TextMateTokenizer"];

    Assert.areEqual(exportNames.join(","), Object.keys(api).sort().join(","));
  }
}
