/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Condition, type EditorRegistries, type IEditorContribution, type IKeyBindingRule, KeyBindingRule } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Resources } from "../../resources.ts";
import { DiffEditorCommands } from "./diff-editor-commands.ts";
import { DiffEditorFeatures } from "./diff-editor-features.ts";
import { DiffEditorSettings } from "./diff-editor-settings.ts";

export class DiffEditorContribution implements IEditorContribution {
  private static readonly KEY_BINDINGS: IReadOnlyList<IKeyBindingRule> = new List<IKeyBindingRule>([
    new KeyBindingRule(DiffEditorCommands.nextChange.id, Resources.nextChangeKey, Condition.has(DiffEditorFeatures.inDiffEditor)),
    new KeyBindingRule(DiffEditorCommands.previousChange.id, Resources.previousChangeKey, Condition.has(DiffEditorFeatures.inDiffEditor))
  ]);

  public readonly id: string = Resources.diffContribution;

  public contribute(registries: EditorRegistries): void {
    for (const command of DiffEditorCommands.all)
      registries.commands.register(command);
    registries.conditions.register(DiffEditorFeatures.inDiffEditor);
    for (const setting of DiffEditorSettings.all)
      registries.settings.declare(setting);
    registries.keyBindings.addDefaults(this.id, DiffEditorContribution.KEY_BINDINGS);
  }
}
