/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import * as api from "@noldova/code.editor";

@TestClass
export class CodeEditorApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    const exportNames: readonly string[] = ["AppliedEdit", "BackgroundJobRegistry", "BlockComment", "BracketPair", "BuiltInTokenTypes", "CommandContext", "CommandRegistry", "Condition", "ConditionKey", "ConditionRegistry", "ConditionSyntaxException", "ConditionValues", "CoreCommands", "CoreConditions", "CoreContribution", "CoreSettings", "DiffAlgorithmRegistry", "DiffSpan", "EditKind", "EditTransaction", "EditorFeature", "EditorFeatureSet", "EditorFeatures", "EditorRegistries", "EditorSession", "EditsOverlapException", "HighlighterRegistry", "KeyBindingRegistry", "KeyBindingRule", "KeyChord", "KeyDispatchResult", "KeyDispatcher", "KeyPress", "KeySequence", "KeySyntaxException", "LanguageDefinition", "LanguageRegistry", "LineSegment", "LineSplit", "LineToken", "LineTokens", "PhraseRegistry", "PluralPhrase", "PositionMapper", "RegistrationExistsException", "RegistrationMissingException", "Required", "SearchPatternException", "SearchQuery", "SearchResults", "SelectionMoves", "Setting", "SettingRegistry", "SlicedRunner", "TextChange", "TextDocument", "TextEdit", "TextEditing", "TextPosition", "TextRange", "TextSearch", "TextSelection", "TokenCache", "TokenModifierDefinition", "TokenSegments", "TokenStyles", "TokenTypeDefinition", "TokenTypeRegistry", "UndoHistory", "ValueMissingException", "WorkerJobAnswer", "WorkerJobHost"];

    Assert.areEqual([...exportNames].sort().join(","), Object.keys(api).sort().join(","));
  }
}
