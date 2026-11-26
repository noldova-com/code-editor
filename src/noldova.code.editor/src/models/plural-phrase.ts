/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IPluralPhrase } from "../interfaces/i-plural-phrase.js";

export class PluralPhrase implements IPluralPhrase {
  public readonly other: string;
  public readonly zero: string | undefined;
  public readonly one: string | undefined;
  public readonly two: string | undefined;
  public readonly few: string | undefined;
  public readonly many: string | undefined;

  public constructor(other: string, zero: string | undefined = undefined, one: string | undefined = undefined, two: string | undefined = undefined,
    few: string | undefined = undefined, many: string | undefined = undefined) {
    this.other = other;
    this.zero = zero;
    this.one = one;
    this.two = two;
    this.few = few;
    this.many = many;
  }
}
