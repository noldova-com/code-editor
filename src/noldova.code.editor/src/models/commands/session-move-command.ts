/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IMoveCommand } from "../../interfaces/i-move-command.js";
import { Resources } from "../../resources.js";
import type { EditorSession } from "../../services/editing/editor-session.js";
import type { CommandContext } from "./command-context.js";
import { SessionCommand } from "./session-command.js";

export class SessionMoveCommand extends SessionCommand implements IMoveCommand {
  public readonly select: SessionCommand;

  public constructor(id: string, move: (session: EditorSession, extend: boolean, context: CommandContext) => boolean) {
    super(id, (s, c) => move(s, false, c));
    this.select = new SessionCommand(id + Resources.selectCommandSuffix, (s, c) => move(s, true, c));
  }
}
