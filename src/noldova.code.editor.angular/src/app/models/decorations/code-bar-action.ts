/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class CodeBarAction {
  public readonly id: string;
  public readonly label: string;
  public readonly icon: string | null;

  public constructor(id: string, label: string, icon: string | null = null) {
    this.id = id;
    this.label = label;
    this.icon = icon;
  }
}
