/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface ITokenTypeDefinition {
  readonly id: string;
  readonly description?: string | undefined;
  readonly parent?: string | undefined;
}
