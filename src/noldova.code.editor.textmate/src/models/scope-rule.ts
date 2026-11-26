/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

export class ScopeRule {
  public readonly scopes: IReadOnlyList<string>;
  public readonly type: string | null;
  public readonly modifiers: IReadOnlyList<string>;

  public constructor(scopes: IReadOnlyList<string>, type: string | null, modifiers: IReadOnlyList<string> = new List<string>()) {
    this.scopes = scopes;
    this.type = type;
    this.modifiers = modifiers;
  }
}
