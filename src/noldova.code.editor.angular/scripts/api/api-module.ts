/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type ts from "typescript";

export class ApiModule {
  public readonly source: ts.SourceFile;
  public readonly symbol: ts.Symbol;

  public constructor(source: ts.SourceFile, symbol: ts.Symbol) {
    this.source = source;
    this.symbol = symbol;
  }
}
