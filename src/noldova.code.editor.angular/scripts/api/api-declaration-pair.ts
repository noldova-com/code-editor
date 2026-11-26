/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class ApiDeclarationPair {
  public readonly documented: string;
  public readonly compiled: string;

  public constructor(documented: string, compiled: string) {
    this.documented = documented;
    this.compiled = compiled;
  }
}
