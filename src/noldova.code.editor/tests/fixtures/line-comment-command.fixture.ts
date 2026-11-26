/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { List } from "@noldova/context.collections";

import { type CommandContext, EditorFeatures, type EditorSession, type ICommand, TextPosition, TextSelection } from "@noldova/code.editor";

export class LineCommentCommand implements ICommand {
  public readonly id: string;

  public constructor(id: string) {
    this.id = id;
  }

  public run(context: CommandContext): boolean {
    const session: EditorSession | null = context.feature(EditorFeatures.session);
    if (Object.isNull(session))
      return false;
    session.select(new List([new TextSelection(new TextPosition(0, 0))]));
    session.type("// ", context.time);

    return true;
  }
}
