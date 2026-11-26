/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Condition, CoreConditions, type EditorRegistries, type ICommand, type IEditorContribution, type IKeyBindingRule, KeyBindingRule } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Resources } from "../../resources.ts";
import { FoldShortcut } from "../enums/fold-shortcut.ts";
import { ViewCommand } from "../models/view-command.ts";
import { CodeEditorFeatures } from "./code-editor-features.ts";

export class CodeEditorContribution implements IEditorContribution {
  public static readonly find: ICommand = new ViewCommand(Resources.findCommand, t => t.openSearch(false));
  public static readonly replace: ICommand = new ViewCommand(Resources.replaceCommand, t => t.openSearch(true));
  public static readonly closeFind: ICommand = new ViewCommand(Resources.closeFindCommand, t => t.closeSearch());
  public static readonly fold: ICommand = new ViewCommand(Resources.foldCommand, t => t.toggleFold(FoldShortcut.Fold));
  public static readonly unfold: ICommand = new ViewCommand(Resources.unfoldCommand, t => t.toggleFold(FoldShortcut.Unfold));

  public static readonly commands: readonly ICommand[] = [
    CodeEditorContribution.find, CodeEditorContribution.replace, CodeEditorContribution.closeFind, CodeEditorContribution.fold, CodeEditorContribution.unfold
  ];

  public static readonly keyBindings: IReadOnlyList<IKeyBindingRule> = new List<IKeyBindingRule>([
    new KeyBindingRule(CodeEditorContribution.find.id, Resources.findKeys),
    new KeyBindingRule(CodeEditorContribution.find.id, Resources.findAlternateKeys),
    new KeyBindingRule(CodeEditorContribution.replace.id, Resources.replaceMacKeys, CoreConditions.onMac),
    new KeyBindingRule(CodeEditorContribution.replace.id, Resources.replaceKeys, CoreConditions.offMac),
    new KeyBindingRule(CodeEditorContribution.closeFind.id, Resources.closeFindKeys, Condition.has(CodeEditorFeatures.findVisible)),
    new KeyBindingRule(CodeEditorContribution.fold.id, Resources.foldKeys, CoreConditions.offMac),
    new KeyBindingRule(CodeEditorContribution.fold.id, Resources.foldMacKeys, CoreConditions.onMac),
    new KeyBindingRule(CodeEditorContribution.unfold.id, Resources.unfoldKeys, CoreConditions.offMac),
    new KeyBindingRule(CodeEditorContribution.unfold.id, Resources.unfoldMacKeys, CoreConditions.onMac)
  ]);

  public readonly id: string = Resources.viewContribution;

  public contribute(registries: EditorRegistries): void {
    for (const command of CodeEditorContribution.commands)
      registries.commands.register(command);
    registries.conditions.register(CodeEditorFeatures.findVisible);
    registries.keyBindings.addDefaults(this.id, CodeEditorContribution.keyBindings);
  }
}
