/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { CommandContext, ICommand } from "@noldova/code.editor";

import type { ICodeEditorView } from "../interfaces/i-code-editor-view.ts";
import { CodeEditorFeatures } from "../services/code-editor-features.ts";

export class ViewCommand implements ICommand {
  public readonly id: string;
  private readonly action: (view: ICodeEditorView) => void;

  public constructor(id: string, action: (view: ICodeEditorView) => void) {
    this.id = id;
    this.action = action;
  }

  public run(context: CommandContext): boolean {
    const view: ICodeEditorView | null = context.feature(CodeEditorFeatures.view);
    if (Object.isNull(view))
      return false;
    this.action(view);

    return true;
  }
}
