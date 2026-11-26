/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ITokenTypeDefinition } from "../../interfaces/tokens/i-token-type-definition.js";

export class TokenTypeDefinition implements ITokenTypeDefinition {
  public readonly id: string;
  public readonly description: string | undefined;
  public readonly parent: string | undefined;

  public constructor(id: string, description: string | undefined = undefined, parent: string | undefined = undefined) {
    this.id = id;
    this.description = description;
    this.parent = parent;
  }
}
