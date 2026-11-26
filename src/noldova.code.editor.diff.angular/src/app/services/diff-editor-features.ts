/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ConditionKey, EditorFeature } from "@noldova/code.editor";

import { Resources } from "../../resources.ts";
import type { IDiffNavigator } from "../interfaces/i-diff-navigator.ts";

export class DiffEditorFeatures {
  public static readonly navigator: EditorFeature<IDiffNavigator> = new EditorFeature<IDiffNavigator>(Resources.navigatorFeature);
  public static readonly inDiffEditor: ConditionKey<boolean> = new ConditionKey<boolean>(Resources.inDiffEditorCondition, false, Resources.inDiffEditorDescription);
}
