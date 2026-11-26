/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

export class TokenKind {
  public readonly type: string;
  public readonly modifiers: IReadOnlyList<string>;

  public constructor(type: string, modifiers: readonly string[] = []) {
    this.type = type;
    this.modifiers = new List<string>(modifiers);
  }
}
