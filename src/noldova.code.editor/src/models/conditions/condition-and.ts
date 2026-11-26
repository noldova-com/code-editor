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

export class ConditionAnd implements IConditionNode {
  private readonly left: IConditionNode;
  private readonly right: IConditionNode;

  public constructor(left: IConditionNode, right: IConditionNode) {
    this.left = left;
    this.right = right;
  }

  public valueIn(values: ConditionValues): ConditionValue {
    return ConditionTruth.of(this.left.valueIn(values)) && ConditionTruth.of(this.right.valueIn(values));
  }
}
