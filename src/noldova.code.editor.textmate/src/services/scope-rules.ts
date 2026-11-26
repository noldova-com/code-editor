/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { ThemeRegistrationRaw } from "@shikijs/primitive/types";

import { ScopeRule } from "../models/scope-rule.js";
import { Resources } from "../resources.js";

export class ScopeRules {
  public static readonly defaults: IReadOnlyList<ScopeRule> = new List<ScopeRule>([
    new ScopeRule(new List(Resources.punctuationScopes), null),
    new ScopeRule(new List(Resources.commentScopes), Resources.commentTokenType),
    new ScopeRule(new List(Resources.keywordScopes), Resources.keywordTokenType),
    new ScopeRule(new List(Resources.controlKeywordScopes), Resources.controlKeywordTokenType),
    new ScopeRule(new List(Resources.stringScopes), Resources.stringTokenType),
    new ScopeRule(new List(Resources.numberScopes), Resources.numberTokenType),
    new ScopeRule(new List(Resources.typeScopes), Resources.typeTokenType),
    new ScopeRule(new List(Resources.functionScopes), Resources.functionTokenType),
    new ScopeRule(new List(Resources.variableScopes), Resources.variableTokenType),
    new ScopeRule(new List(Resources.regexScopes), Resources.regexTokenType),
    new ScopeRule(new List(Resources.metaScopes), Resources.metaTokenType)
  ]);
  private static readonly NONE: IReadOnlyList<string> = new List<string>();

  public static themeOf(rules: IReadOnlyList<ScopeRule>): ThemeRegistrationRaw {
    return {
      name: Resources.themeName,
      fg: Resources.plainMarker,
      bg: Resources.plainMarker,
      settings: [
        { settings: { foreground: Resources.plainMarker } },
        ...rules.select(t => ({ scope: [...t.scopes], settings: { foreground: ScopeRules.markerOf(t) } }))
      ]
    };
  }

  public static ruleOf(marker: string | undefined): ScopeRule | null {
    if (Object.isUndefined(marker) || !marker.startsWith(Resources.markerPrefix))
      return null;
    const [type = Resources.emptyMarkerPart, modifiers = Resources.emptyMarkerPart] = marker.slice(Resources.markerPrefix.length).split(Resources.markerSeparator);

    return new ScopeRule(ScopeRules.NONE, String.isNullOrEmpty(type) ? null : type,
      String.isNullOrEmpty(modifiers) ? ScopeRules.NONE : new List(modifiers.split(Resources.modifierSeparator)));
  }

  private static markerOf(rule: ScopeRule): string {
    return `${Resources.markerPrefix}${rule.type ?? Resources.emptyMarkerPart}${Resources.markerSeparator}${rule.modifiers.toArray().join(Resources.modifierSeparator)}`;
  }
}
