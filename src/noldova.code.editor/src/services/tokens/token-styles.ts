/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type Enumerable, type IReadOnlyList, List } from "@noldova/context.collections";

import type { ITokenTypeDefinition } from "../../interfaces/tokens/i-token-type-definition.js";
import { Resources } from "../../resources.js";
import type { TokenTypeRegistry } from "./token-type-registry.js";

export class TokenStyles {
  public static classesOf(registry: TokenTypeRegistry, type: string | null, modifiers: IReadOnlyList<string>, prefix: string): IReadOnlyList<string> {
    const resolved: string | null = Object.isNull(type) ? null : registry.resolve(type);
    const classes: List<string> = new List<string>();
    if (!Object.isNull(resolved))
      classes.add(prefix + TokenStyles.nameOf(resolved));
    for (const modifier of modifiers)
      if (!Object.isNull(registry.findModifier(modifier)))
        classes.add(prefix + Resources.tokenModifierClass + TokenStyles.nameOf(modifier));

    return classes;
  }

  public static styleSheet(registry: TokenTypeRegistry, prefix: string): string {
    const types: Enumerable<string> = registry.types().select(t => Resources.formatStyleRule(prefix + TokenStyles.nameOf(t.id), Resources.formatDeclaration(Resources.colorProperty, TokenStyles.colorOf(registry.chainOf(t.id)))));
    const modifiers: Enumerable<string> = registry.modifiers().select(t => {
      const name: string = TokenStyles.nameOf(t.id);
      const declarations: string = Resources.tokenModifierProperties.map(p => Resources.formatDeclaration(p, Resources.formatVariableReference(Resources.formatModifierVariable(name, p), Resources.tokenStyleUnchanged))).join(Resources.styleDeclarationJoiner);

      return Resources.formatStyleRule(prefix + Resources.tokenModifierClass + name, declarations);
    });

    return types.concat(modifiers).toArray().join(Resources.lineFeed);
  }

  private static colorOf(chain: IReadOnlyList<ITokenTypeDefinition>): string {
    return chain.reverse().aggregate(Resources.tokenStyleUnchanged, (fallback, t) => Resources.formatVariableReference(TokenStyles.variableOf(t.id), fallback));
  }

  private static variableOf(id: string): string {
    return Resources.tokenKitVariables.get(id) ?? Resources.tokenVariablePrefix + TokenStyles.nameOf(id);
  }

  private static nameOf(id: string): string {
    return id.toLowerCase().replace(Resources.tokenNameUnsafePattern, Resources.tokenNameReplacement);
  }
}
