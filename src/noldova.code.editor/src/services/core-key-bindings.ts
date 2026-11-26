/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { IKeyBindingRule } from "../interfaces/i-key-binding-rule.js";
import type { IMoveCommand } from "../interfaces/i-move-command.js";
import { Condition } from "../models/conditions/condition.js";
import { KeyBindingRule } from "../models/keys/key-binding-rule.js";
import { Resources } from "../resources.js";
import { CoreCommands } from "./commands/core-commands.js";
import { CoreConditions } from "./conditions/core-conditions.js";

export class CoreKeyBindings {
  private static readonly TAB_INDENTS: Condition = Condition.has(CoreConditions.tabIndents);

  public static readonly rules: IReadOnlyList<IKeyBindingRule> = new List<IKeyBindingRule>([
    ...CoreKeyBindings.moves(Resources.leftKey, CoreCommands.cursorLeft),
    ...CoreKeyBindings.moves(Resources.ctrlLeftKey, CoreCommands.cursorWordLeft, CoreConditions.offMac),
    ...CoreKeyBindings.moves(Resources.altLeftKey, CoreCommands.cursorWordLeft, CoreConditions.onMac),
    ...CoreKeyBindings.moves(Resources.cmdLeftKey, CoreCommands.cursorHome, CoreConditions.onMac),
    ...CoreKeyBindings.moves(Resources.rightKey, CoreCommands.cursorRight),
    ...CoreKeyBindings.moves(Resources.ctrlRightKey, CoreCommands.cursorWordRight, CoreConditions.offMac),
    ...CoreKeyBindings.moves(Resources.altRightKey, CoreCommands.cursorWordRight, CoreConditions.onMac),
    ...CoreKeyBindings.moves(Resources.cmdRightKey, CoreCommands.cursorEnd, CoreConditions.onMac),
    ...CoreKeyBindings.moves(Resources.upKey, CoreCommands.cursorUp),
    ...CoreKeyBindings.moves(Resources.downKey, CoreCommands.cursorDown),
    ...CoreKeyBindings.moves(Resources.ctrlUpKey, CoreCommands.cursorTop, CoreConditions.offMac),
    ...CoreKeyBindings.moves(Resources.cmdUpKey, CoreCommands.cursorTop, CoreConditions.onMac),
    ...CoreKeyBindings.moves(Resources.ctrlDownKey, CoreCommands.cursorBottom, CoreConditions.offMac),
    ...CoreKeyBindings.moves(Resources.cmdDownKey, CoreCommands.cursorBottom, CoreConditions.onMac),
    ...CoreKeyBindings.moves(Resources.pageUpKey, CoreCommands.cursorPageUp),
    ...CoreKeyBindings.moves(Resources.pageDownKey, CoreCommands.cursorPageDown),
    ...CoreKeyBindings.moves(Resources.homeKey, CoreCommands.cursorHome),
    ...CoreKeyBindings.moves(Resources.endKey, CoreCommands.cursorEnd),
    ...CoreKeyBindings.moves(Resources.ctrlHomeKey, CoreCommands.cursorTop, CoreConditions.offMac),
    ...CoreKeyBindings.moves(Resources.ctrlEndKey, CoreCommands.cursorBottom, CoreConditions.offMac),
    new KeyBindingRule(CoreCommands.deleteLeft.id, Resources.backspaceKey),
    new KeyBindingRule(CoreCommands.deleteLeft.id, Resources.shiftBackspaceKey),
    new KeyBindingRule(CoreCommands.deleteWordLeft.id, Resources.ctrlBackspaceKey, CoreConditions.offMac),
    new KeyBindingRule(CoreCommands.deleteWordLeft.id, Resources.altBackspaceKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.deleteRight.id, Resources.deleteKey),
    new KeyBindingRule(CoreCommands.deleteWordRight.id, Resources.ctrlDeleteKey, CoreConditions.offMac),
    new KeyBindingRule(CoreCommands.deleteWordRight.id, Resources.altDeleteKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.deleteAllLeft.id, Resources.cmdBackspaceKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.deleteAllRight.id, Resources.cmdDeleteKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.cursorLineStart.id, Resources.ctrlAKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.cursorEnd.id, Resources.ctrlEKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.cursorRight.id, Resources.ctrlFKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.cursorLeft.id, Resources.ctrlBKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.cursorDown.id, Resources.ctrlNKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.cursorUp.id, Resources.ctrlPKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.deleteRight.id, Resources.ctrlDKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.deleteLeft.id, Resources.ctrlHKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.deleteAllRight.id, Resources.ctrlKKey, CoreConditions.onMac),
    new KeyBindingRule(CoreCommands.newLine.id, Resources.enterKey),
    new KeyBindingRule(CoreCommands.newLine.id, Resources.shiftEnterKey),
    new KeyBindingRule(CoreCommands.indent.id, Resources.tabKey, CoreKeyBindings.TAB_INDENTS),
    new KeyBindingRule(CoreCommands.outdent.id, Resources.shiftTabKey, CoreKeyBindings.TAB_INDENTS),
    new KeyBindingRule(CoreCommands.cancelSelection.id, Resources.escapeKey),
    new KeyBindingRule(CoreCommands.selectAll.id, Resources.modAKey),
    new KeyBindingRule(CoreCommands.undo.id, Resources.modZKey),
    new KeyBindingRule(CoreCommands.redo.id, Resources.modShiftZKey),
    new KeyBindingRule(CoreCommands.redo.id, Resources.ctrlYKey, CoreConditions.offMac)
  ]);

  private static moves(key: string, command: IMoveCommand, when: Condition | undefined = undefined): readonly IKeyBindingRule[] {
    return [new KeyBindingRule(command.id, key, when), new KeyBindingRule(command.select.id, Resources.shiftPrefix + key, when)];
  }
}
