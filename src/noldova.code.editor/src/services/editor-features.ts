/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EditorFeature } from "../models/editor-feature.js";
import { Resources } from "../resources.js";
import type { EditorSession } from "./editing/editor-session.js";

export class EditorFeatures {
  public static readonly session: EditorFeature<EditorSession> = new EditorFeature<EditorSession>(Resources.sessionFeature);
}
