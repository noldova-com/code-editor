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

export class ConditionEquals implements IConditionNode {
  private readonly left: IConditionNode;
  private readonly right: IConditionNode;
  private readonly negated: boolean;

  public constructor(left: IConditionNode, right: IConditionNode, negated: boolean) {
    this.left = left;
    this.right = right;
    this.negated = negated;
  }

  public valueIn(values: ConditionValues): ConditionValue {
    return (this.left.valueIn(values) === this.right.valueIn(values)) !== this.negated;
  }
}
