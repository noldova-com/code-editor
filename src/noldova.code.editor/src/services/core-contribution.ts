/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IEditorContribution } from "../interfaces/i-editor-contribution.js";
import { Resources } from "../resources.js";
import { BuiltInTokenTypes } from "./tokens/built-in-token-types.js";
import { CoreCommands } from "./commands/core-commands.js";
import { CoreConditions } from "./conditions/core-conditions.js";
import { CoreKeyBindings } from "./core-key-bindings.js";
import { CoreSettings } from "./core-settings.js";
import type { EditorRegistries } from "./editor-registries.js";

export class CoreContribution implements IEditorContribution {
  public readonly id: string = Resources.coreContribution;

  public contribute(registries: EditorRegistries): void {
    for (const command of CoreCommands.all)
      registries.commands.register(command);
    for (const condition of CoreConditions.all)
      registries.conditions.register(condition);
    for (const setting of CoreSettings.all)
      registries.settings.declare(setting);
    registries.keyBindings.addDefaults(this.id, CoreKeyBindings.rules);
    BuiltInTokenTypes.register(registries.tokenTypes);
  }
}
