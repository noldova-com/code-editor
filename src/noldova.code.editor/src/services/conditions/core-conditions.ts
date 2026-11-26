/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Condition } from "../../models/conditions/condition.js";
import { ConditionKey } from "../../models/conditions/condition-key.js";
import type { ConditionValue } from "../../models/conditions/condition-value.js";
import { Resources } from "../../resources.js";
import { Platforms } from "../platforms.js";

export class CoreConditions {
  public static readonly readOnly: ConditionKey<boolean> = new ConditionKey<boolean>(Resources.readOnlyCondition, false, Resources.readOnlyDescription);
  public static readonly hasSelection: ConditionKey<boolean> = new ConditionKey<boolean>(Resources.hasSelectionCondition, false, Resources.hasSelectionDescription);
  public static readonly hasMultipleSelections: ConditionKey<boolean> = new ConditionKey<boolean>(Resources.hasMultipleSelectionsCondition, false, Resources.hasMultipleSelectionsDescription);
  public static readonly tabIndents: ConditionKey<boolean> = new ConditionKey<boolean>(Resources.tabIndentsCondition, false, Resources.tabIndentsDescription);
  public static readonly platform: ConditionKey<string> = new ConditionKey<string>(Resources.platformCondition, Platforms.of(globalThis.navigator.platform),
    Resources.platformDescription);

  public static readonly all: IReadOnlyList<ConditionKey<ConditionValue>> = new List<ConditionKey<ConditionValue>>([CoreConditions.readOnly, CoreConditions.hasSelection, CoreConditions.hasMultipleSelections, CoreConditions.tabIndents,
    CoreConditions.platform]);

  public static readonly onMac: Condition = Condition.equals(CoreConditions.platform, Resources.platformMac);
  public static readonly offMac: Condition = Condition.notEquals(CoreConditions.platform, Resources.platformMac);
}
