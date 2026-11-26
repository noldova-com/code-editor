/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { ITokenModifierDefinition } from "../../interfaces/tokens/i-token-modifier-definition.js";
import type { ITokenTypeDefinition } from "../../interfaces/tokens/i-token-type-definition.js";
import { Resources } from "../../resources.js";
import { RegistryEntries } from "../registry-entries.js";

export class TokenTypeRegistry {
  private readonly typeEntries: RegistryEntries<ITokenTypeDefinition>;
  private readonly modifierEntries: RegistryEntries<ITokenModifierDefinition>;

  public constructor(parent: TokenTypeRegistry | null = null) {
    this.typeEntries = new RegistryEntries(Resources.tokenTypeRegistry, t => t.id, parent?.typeEntries ?? null);
    this.modifierEntries = new RegistryEntries(Resources.tokenModifierRegistry, t => t.id, parent?.modifierEntries ?? null);
  }

  public registerType(type: ITokenTypeDefinition): Disposable {
    return this.typeEntries.add(type);
  }

  public registerModifier(modifier: ITokenModifierDefinition): Disposable {
    return this.modifierEntries.add(modifier);
  }

  public findType(id: string): ITokenTypeDefinition | null {
    return this.typeEntries.find(id);
  }

  public findModifier(id: string): ITokenModifierDefinition | null {
    return this.modifierEntries.find(id);
  }

  public resolve(id: string): string | null {
    return this.typeFor(id)?.id ?? null;
  }

  public chainOf(id: string): IReadOnlyList<ITokenTypeDefinition> {
    const chain: List<ITokenTypeDefinition> = new List<ITokenTypeDefinition>();
    let type: ITokenTypeDefinition | null = this.typeFor(id);
    while (!Object.isNull(type) && !chain.contains(type)) {
      chain.add(type);
      const parent: string | null = type.parent ?? TokenTypeRegistry.beforeLastDot(type.id);
      type = Object.isNull(parent) ? null : this.typeFor(parent);
    }

    return chain;
  }

  public types(): IReadOnlyList<ITokenTypeDefinition> {
    return this.typeEntries.all();
  }

  public modifiers(): IReadOnlyList<ITokenModifierDefinition> {
    return this.modifierEntries.all();
  }

  private typeFor(id: string): ITokenTypeDefinition | null {
    for (let candidate: string | null = id; !Object.isNull(candidate); candidate = TokenTypeRegistry.beforeLastDot(candidate)) {
      const type: ITokenTypeDefinition | null = this.findType(candidate);
      if (!Object.isNull(type))
        return type;
    }

    return null;
  }

  private static beforeLastDot(id: string): string | null {
    const dot: number = id.lastIndexOf(Resources.tokenTypeSeparator);

    return dot < 0 ? null : id.slice(0, dot);
  }
}
