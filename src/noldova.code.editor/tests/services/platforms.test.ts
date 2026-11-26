/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CoreConditions } from "@noldova/code.editor";
import { Platforms } from "@noldova/code.editor/services/platforms.js";

import { Expect } from "../support/expect.js";

@TestClass
export class PlatformsTests {
  @TestMethod
  public readsMacAndWindowsFromTheStartOfTheRuntimesPlatformNameAndTakesAnythingElseAsLinux(): void {
    Expect.same(["mac", "windows", "linux", "linux", "linux"], ["MacIntel", "Win32", "Linux x86_64", "", "iPhone"].map(t => Platforms.of(t)));
  }

  @TestMethod
  public givesThePlatformConditionTheRuntimesPlatformByDefault(): void {
    Assert.areEqual(Platforms.of(globalThis.navigator.platform), CoreConditions.platform.defaultValue);
    Assert.areEqual("platform", CoreConditions.platform.name);
  }
}
