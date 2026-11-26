/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IConditionNode } from "../../interfaces/i-condition-node.js";
import type { ConditionValues } from "../../services/conditions/condition-values.js";
import type { ConditionValue } from "./condition-value.js";

export class ConditionName implements IConditionNode {
  private readonly name: string;

  public constructor(name: string) {
    this.name = name;
  }

  public valueIn(values: ConditionValues): ConditionValue {
    return values.get(this.name);
  }
}
