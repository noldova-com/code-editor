/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ConditionValues } from "../../services/conditions/condition-values.js";
import type { EditorRegistries } from "../../services/editor-registries.js";
import type { EditorFeature } from "../editor-feature.js";
import type { EditorFeatureSet } from "../editor-feature-set.js";
import type { Setting } from "../setting.js";

export class CommandContext {
  public readonly registries: EditorRegistries;
  public readonly conditions: ConditionValues;
  public readonly features: EditorFeatureSet;
  public readonly languageId: string | null;
  public readonly time: number;
  public readonly pageLines: number;

  public constructor(registries: EditorRegistries, conditions: ConditionValues, features: EditorFeatureSet, languageId: string | null, time: number, pageLines: number) {
    this.registries = registries;
    this.conditions = conditions;
    this.features = features;
    this.languageId = languageId;
    this.time = time;
    this.pageLines = pageLines;
  }

  public feature<T>(feature: EditorFeature<T>): T | null {
    return this.features.get(feature);
  }

  public setting<T>(setting: Setting<T>): T {
    return this.registries.settings.get(setting, this.languageId);
  }
}
