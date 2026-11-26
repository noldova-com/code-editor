/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IKeyBindingRule } from "../../interfaces/i-key-binding-rule.js";
import type { Condition } from "../conditions/condition.js";

export class KeyBindingRule implements IKeyBindingRule {
  public readonly command: string;
  public readonly key: string | undefined;
  public readonly when: string | Condition | undefined;
  public readonly args: unknown;

  public constructor(command: string, key: string | undefined = undefined, when: string | Condition | undefined = undefined, args: unknown = undefined) {
    this.command = command;
    this.key = key;
    this.when = when;
    this.args = args;
  }
}
