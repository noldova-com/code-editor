/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IConditionNode } from "../../interfaces/i-condition-node.js";
import type { ConditionValue } from "./condition-value.js";

export class ConditionLiteral implements IConditionNode {
  private readonly value: ConditionValue;

  public constructor(value: ConditionValue) {
    this.value = value;
  }

  public valueIn(): ConditionValue {
    return this.value;
  }
}
