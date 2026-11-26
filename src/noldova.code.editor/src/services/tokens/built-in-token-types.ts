/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { ITokenModifierDefinition } from "../../interfaces/tokens/i-token-modifier-definition.js";
import type { ITokenTypeDefinition } from "../../interfaces/tokens/i-token-type-definition.js";
import { TokenModifierDefinition } from "../../models/tokens/token-modifier-definition.js";
import { TokenTypeDefinition } from "../../models/tokens/token-type-definition.js";
import { Resources } from "../../resources.js";
import type { TokenTypeRegistry } from "./token-type-registry.js";

export class BuiltInTokenTypes {
  public static readonly comment: ITokenTypeDefinition = new TokenTypeDefinition(Resources.commentTokenType, Resources.commentTokenDescription);
  public static readonly keyword: ITokenTypeDefinition = new TokenTypeDefinition(Resources.keywordTokenType, Resources.keywordTokenDescription);

  public static readonly types: IReadOnlyList<ITokenTypeDefinition> = new List<ITokenTypeDefinition>([
    BuiltInTokenTypes.comment,
    BuiltInTokenTypes.keyword,
    new TokenTypeDefinition(Resources.controlKeywordTokenType, Resources.controlKeywordTokenDescription, BuiltInTokenTypes.keyword.id),
    new TokenTypeDefinition(Resources.stringTokenType, Resources.stringTokenDescription),
    new TokenTypeDefinition(Resources.regexTokenType, Resources.regexTokenDescription, Resources.stringTokenType),
    new TokenTypeDefinition(Resources.numberTokenType, Resources.numberTokenDescription),
    new TokenTypeDefinition(Resources.typeTokenType, Resources.typeTokenDescription),
    new TokenTypeDefinition(Resources.functionTokenType, Resources.functionTokenDescription),
    new TokenTypeDefinition(Resources.variableTokenType, Resources.variableTokenDescription),
    new TokenTypeDefinition(Resources.metaTokenType, Resources.metaTokenDescription)
  ]);

  public static readonly modifiers: IReadOnlyList<ITokenModifierDefinition> = new List<ITokenModifierDefinition>([
    new TokenModifierDefinition(Resources.deprecatedTokenModifier, Resources.deprecatedModifierDescription),
    new TokenModifierDefinition(Resources.readonlyTokenModifier, Resources.readonlyModifierDescription),
    new TokenModifierDefinition(Resources.staticTokenModifier, Resources.staticModifierDescription)
  ]);

  public static register(registry: TokenTypeRegistry): Disposable {
    const stack: DisposableStack = new DisposableStack();
    for (const type of BuiltInTokenTypes.types)
      stack.use(registry.registerType(type));
    for (const modifier of BuiltInTokenTypes.modifiers)
      stack.use(registry.registerModifier(modifier));

    return stack;
  }
}
