/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ConditionKey } from "../../models/conditions/condition-key.js";
import type { ConditionValue } from "../../models/conditions/condition-value.js";
import type { ConditionRegistry } from "./condition-registry.js";

export class ConditionValues {
  private readonly registry: ConditionRegistry;
  private readonly parent: ConditionValues | null;
  private readonly values: Map<string, ConditionValue> = new Map<string, ConditionValue>();

  public constructor(registry: ConditionRegistry, parent: ConditionValues | null = null) {
    this.registry = registry;
    this.parent = parent;
  }

  public set<T extends ConditionValue>(key: ConditionKey<T>, value: T): void {
    this.values.set(key.name, value);
  }

  public get(name: string): ConditionValue {
    return this.values.get(name) ?? this.parent?.get(name) ?? this.registry.find(name)?.defaultValue ?? false;
  }
}
