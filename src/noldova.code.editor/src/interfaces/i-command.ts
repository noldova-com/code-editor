/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CommandContext } from "../models/commands/command-context.js";

export interface ICommand {
  readonly id: string;
  run(context: CommandContext, args: unknown): boolean;
}
