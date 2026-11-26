/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class KeyPress {
  public readonly key: string;
  public readonly code: string;
  public readonly shift: boolean;
  public readonly control: boolean;
  public readonly alt: boolean;
  public readonly meta: boolean;

  public constructor(key: string, code: string, shift: boolean, control: boolean, alt: boolean, meta: boolean) {
    this.key = key;
    this.code = code;
    this.shift = shift;
    this.control = control;
    this.alt = alt;
    this.meta = meta;
  }
}
