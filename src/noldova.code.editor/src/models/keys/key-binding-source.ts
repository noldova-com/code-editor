/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { KeyBindingEntry } from "./key-binding-entry.js";

export class KeyBindingSource {
  public readonly name: string;
  public readonly entries: readonly KeyBindingEntry[];

  public constructor(name: string, entries: readonly KeyBindingEntry[]) {
    this.name = name;
    this.entries = entries;
  }
}
