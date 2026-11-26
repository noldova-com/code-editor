/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";

import { type EditorRegistries, type IEditorContribution, KeyBindingRule } from "@noldova/code.editor";

import { LineCommentCommand } from "./line-comment-command.fixture.js";

export class LineCommentContribution implements IEditorContribution {
  public static readonly commandId: string = "test.toggleLineComment";
  public readonly id: string = "test.comments";
  public contributions: number = 0;

  public contribute(registries: EditorRegistries): void {
    this.contributions++;
    registries.commands.register(new LineCommentCommand(LineCommentContribution.commandId));
    registries.keyBindings.addDefaults(this.id, new List([new KeyBindingRule(LineCommentContribution.commandId, "mod+/", "!editorReadOnly")]));
  }
}
