/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { EditorRegistries } from "@noldova/code.editor";
import { DiffContribution } from "@noldova/code.editor.diff";
import { Resources } from "@noldova/code.editor.diff/resources.js";

import { Expect } from "../support/expect.js";

@TestClass
export class DiffContributionTests {
  @TestMethod
  public registersTheDefaultAlgorithmAndItsLineDiffJobOnce(): void {
    const registries: EditorRegistries = new EditorRegistries();
    registries.add(new DiffContribution(), new DiffContribution());

    Expect.same([Resources.diffContribution, Resources.defaultAlgorithmId, [Resources.defaultAlgorithmId], [Resources.formatLineDiffJob(Resources.defaultAlgorithmId)]],
      [new DiffContribution().id, registries.diffAlgorithms.current().id, registries.diffAlgorithms.ids().toArray(), registries.backgroundJobs.names().toArray()]);
    Assert.areEqual(Resources.formatLineDiffJob(Resources.defaultAlgorithmId), registries.backgroundJobs.get(Resources.formatLineDiffJob(Resources.defaultAlgorithmId)).name);
  }
}
