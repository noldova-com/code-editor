/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { CommandContext, ICommand } from "@noldova/code.editor";

import type { IDiffNavigator } from "../interfaces/i-diff-navigator.ts";
import { DiffEditorFeatures } from "../services/diff-editor-features.ts";

export class ChangeCommand implements ICommand {
  public readonly id: string;
  private readonly next: boolean;

  public constructor(id: string, next: boolean) {
    this.id = id;
    this.next = next;
  }

  public run(context: CommandContext): boolean {
    const navigator: IDiffNavigator | null = context.feature(DiffEditorFeatures.navigator);
    if (Object.isNull(navigator))
      return false;

    return this.next ? navigator.nextChange() : navigator.previousChange();
  }
}
