/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { EditorRegistries } from "../services/editor-registries.js";

export interface IEditorContribution {
  readonly id: string;
  contribute(registries: EditorRegistries): void;
}
