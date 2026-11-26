/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

export class CodeTextSpan {
  private static readonly NO_MODIFIERS: IReadOnlyList<string> = new List<string>();
  public readonly text: string;
  public readonly type: string | null;
  public readonly modifiers: IReadOnlyList<string>;

  public constructor(text: string, type: string | null, modifiers: IReadOnlyList<string> = CodeTextSpan.NO_MODIFIERS) {
    this.text = text;
    this.type = type;
    this.modifiers = modifiers;
  }
}
