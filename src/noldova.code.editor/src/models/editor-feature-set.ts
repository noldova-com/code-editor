/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { EditorFeature } from "./editor-feature.js";
import { Registration } from "./registration.js";

export class EditorFeatureSet {
  public provide<T>(feature: EditorFeature<T>, value: T): Disposable {
    feature.provide(this, value);

    return new Registration(() => feature.withdraw(this));
  }

  public get<T>(feature: EditorFeature<T>): T | null {
    return feature.valueIn(this);
  }
}
