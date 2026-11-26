/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ICommand } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Resources } from "../../resources.ts";
import { ChangeCommand } from "../models/change-command.ts";

export class DiffEditorCommands {
  public static readonly nextChange: ICommand = new ChangeCommand(Resources.nextChangeCommand, true);
  public static readonly previousChange: ICommand = new ChangeCommand(Resources.previousChangeCommand, false);

  public static readonly all: IReadOnlyList<ICommand> = new List<ICommand>([DiffEditorCommands.nextChange, DiffEditorCommands.previousChange]);
}
