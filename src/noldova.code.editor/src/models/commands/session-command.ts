/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { ICommand } from "../../interfaces/i-command.js";
import { EditorFeatures } from "../../services/editor-features.js";
import type { EditorSession } from "../../services/editing/editor-session.js";
import type { CommandContext } from "./command-context.js";

export class SessionCommand implements ICommand {
  public readonly id: string;
  private readonly action: (session: EditorSession, context: CommandContext) => boolean;

  public constructor(id: string, action: (session: EditorSession, context: CommandContext) => boolean) {
    this.id = id;
    this.action = action;
  }

  public run(context: CommandContext): boolean {
    const session: EditorSession | null = context.feature(EditorFeatures.session);

    return !Object.isNull(session) && this.action(session, context);
  }
}
