/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";

export class Platforms {
  public static of(platform: string): string {
    if (Resources.macPlatformPattern.test(platform))
      return Resources.platformMac;

    return Resources.windowsPlatformPattern.test(platform) ? Resources.platformWindows : Resources.platformLinux;
  }
}
