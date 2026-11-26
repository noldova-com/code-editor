/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ITokenModifierDefinition } from "../../interfaces/tokens/i-token-modifier-definition.js";

export class TokenModifierDefinition implements ITokenModifierDefinition {
  public readonly id: string;
  public readonly description: string | undefined;

  public constructor(id: string, description: string | undefined = undefined) {
    this.id = id;
    this.description = description;
  }
}
