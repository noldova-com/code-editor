/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface IPluralPhrase {
  readonly other: string;
  readonly zero?: string | undefined;
  readonly one?: string | undefined;
  readonly two?: string | undefined;
  readonly few?: string | undefined;
  readonly many?: string | undefined;
}
