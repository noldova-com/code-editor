/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { ConditionKey } from "../../models/conditions/condition-key.js";
import type { ConditionValue } from "../../models/conditions/condition-value.js";
import { Resources } from "../../resources.js";
import { RegistryEntries } from "../registry-entries.js";

export class ConditionRegistry {
  private readonly entries: RegistryEntries<ConditionKey<ConditionValue>>;

  public constructor(parent: ConditionRegistry | null = null) {
    this.entries = new RegistryEntries<ConditionKey<ConditionValue>>(Resources.conditionRegistry, t => t.name, parent?.entries ?? null);
  }

  public register(key: ConditionKey<ConditionValue>): Disposable {
    return this.entries.add(key);
  }

  public find(name: string): ConditionKey<ConditionValue> | null {
    return this.entries.find(name);
  }

  public names(): IReadOnlyList<string> {
    return this.entries.all().select(t => t.name).toList();
  }
}
