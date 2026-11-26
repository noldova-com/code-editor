/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ConditionValue } from "./condition-value.js";

export class ConditionKey<T extends ConditionValue> {
  public readonly name: string;
  public readonly defaultValue: T;
  public readonly description: string;

  public constructor(name: string, defaultValue: T, description: string) {
    this.name = name;
    this.defaultValue = defaultValue;
    this.description = description;
  }
}
