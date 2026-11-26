/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ICommand } from "./i-command.js";

export interface IMoveCommand extends ICommand {
  readonly select: ICommand;
}
