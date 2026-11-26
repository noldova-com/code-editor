/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { IConditionNode } from "../../interfaces/i-condition-node.js";
import { ConditionParser } from "../../services/conditions/condition-parser.js";
import type { ConditionValues } from "../../services/conditions/condition-values.js";
import { Resources } from "../../resources.js";
import { ConditionEquals } from "./condition-equals.js";
import type { ConditionKey } from "./condition-key.js";
import { ConditionLiteral } from "./condition-literal.js";
import { ConditionName } from "./condition-name.js";
import { ConditionTruth } from "./condition-truth.js";
import type { ConditionValue } from "./condition-value.js";

export class Condition {
  public static readonly always: Condition = Condition.parse(String.empty);

  public readonly text: string;
  private readonly root: IConditionNode;

  private constructor(text: string, root: IConditionNode) {
    this.text = text;
    this.root = root;
  }

  public static parse(text: string): Condition {
    return new Condition(text, ConditionParser.parse(text));
  }

  public static has(key: ConditionKey<ConditionValue>): Condition {
    return new Condition(key.name, new ConditionName(key.name));
  }

  public static equals<T extends ConditionValue>(key: ConditionKey<T>, value: T): Condition {
    return Condition.comparing(key, value, false);
  }

  public static notEquals<T extends ConditionValue>(key: ConditionKey<T>, value: T): Condition {
    return Condition.comparing(key, value, true);
  }

  public holds(values: ConditionValues): boolean {
    return ConditionTruth.of(this.root.valueIn(values));
  }

  private static comparing(key: ConditionKey<ConditionValue>, value: ConditionValue, negated: boolean): Condition {
    const operand: string = Object.isString(value) ? Resources.conditionQuote + value + Resources.conditionQuote : String(value);
    const operator: string = negated ? Resources.conditionNotEquals : Resources.conditionEquals;

    return new Condition([key.name, operator, operand].join(Resources.space), new ConditionEquals(new ConditionName(key.name), new ConditionLiteral(value), negated));
  }
}
