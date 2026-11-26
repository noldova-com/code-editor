/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IConditionNode } from "../../interfaces/i-condition-node.js";
import type { ConditionValues } from "../../services/conditions/condition-values.js";
import { ConditionTruth } from "./condition-truth.js";
import type { ConditionValue } from "./condition-value.js";

export class ConditionNot implements IConditionNode {
  private readonly operand: IConditionNode;

  public constructor(operand: IConditionNode) {
    this.operand = operand;
  }

  public valueIn(values: ConditionValues): ConditionValue {
    return !ConditionTruth.of(this.operand.valueIn(values));
  }
}
