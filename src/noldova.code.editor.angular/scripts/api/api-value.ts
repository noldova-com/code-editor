/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ts from "typescript";

export class ApiValue {
  public static readModifierFlags(node: ts.Declaration): ts.ModifierFlags {
    return ts.getCombinedModifierFlags(node);
  }

  public static readOwnDocs(node: ts.Node): readonly ts.JSDoc[] {
    const owner = ts.isVariableDeclaration(node) ? node.parent.parent : node;
    return ts.getJSDocCommentsAndTags(owner).filter((t): t is ts.JSDoc => ts.isJSDoc(t) && t.parent === owner);
  }

  public static listMembers(table: ts.SymbolTable | undefined): readonly ts.Symbol[] {
    return [...table?.values() ?? []];
  }

  public static readName(symbol: ts.Symbol): string {
    return ts.unescapeLeadingUnderscores(symbol.escapedName);
  }
}
