/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ConditionKey, EditorFeature } from "@noldova/code.editor";

import { Resources } from "../../resources.ts";
import type { ICodeEditorView } from "../interfaces/i-code-editor-view.ts";

export class CodeEditorFeatures {
  public static readonly view: EditorFeature<ICodeEditorView> = new EditorFeature<ICodeEditorView>(Resources.viewFeature);
  public static readonly findVisible: ConditionKey<boolean> = new ConditionKey<boolean>(Resources.findVisibleKey, false, Resources.findVisibleDescription);
}
