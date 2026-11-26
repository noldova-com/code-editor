/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { CommandContext, ConditionValues, CoreContribution, EditorFeatures, EditorFeatureSet, EditorRegistries, type EditorSession } from "@noldova/code.editor";

export class Contexts {
  public static core(): EditorRegistries {
    const registries: EditorRegistries = new EditorRegistries();
    registries.add(new CoreContribution());

    return registries;
  }

  public static of(registries: EditorRegistries, session: EditorSession | null = null, languageId: string | null = null): CommandContext {
    const features: EditorFeatureSet = new EditorFeatureSet();
    if (!Object.isNull(session))
      features.provide(EditorFeatures.session, session);

    return new CommandContext(registries, new ConditionValues(registries.conditions), features, languageId, 0, 10);
  }
}
