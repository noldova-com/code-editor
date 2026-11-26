/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

import { DefaultDiffAlgorithm, LineChangeCodec, LineDiffInput, LineDiffJob } from "@noldova/code.editor.diff";
import { Resources } from "@noldova/code.editor.diff/resources.js";

import { DrivenSteps } from "../fixtures/driven-steps.fixture.js";
import { ManyAlgorithm } from "../fixtures/many-algorithm.fixture.js";
import { Expect } from "../support/expect.js";

@TestClass
export class LineDiffJobTests {
  @TestMethod
  public isNamedAfterItsAlgorithmAndReturnsTheAlgorithmsLineChangesPacked(): void {
    const job: LineDiffJob = new LineDiffJob(new DefaultDiffAlgorithm());
    const driven: DrivenSteps = new DrivenSteps(job.steps(new LineDiffInput(["a", "b"], ["a", "c"])));

    Expect.same([Resources.formatLineDiffJob(Resources.defaultAlgorithmId), 2], [job.name, driven.count]);
    Expect.same([[0, 1, 2, 1, 2]], LineChangeCodec.decode(driven.output).select(t => [t.index, t.originalStart, t.originalEnd, t.modifiedStart, t.modifiedEnd]).toArray());
  }

  @TestMethod
  public yieldsBeforeTheDiffAndBetweenSlicesOfThePacking(): void {
    const many: DrivenSteps = new DrivenSteps(new LineDiffJob(new ManyAlgorithm()).steps(new LineDiffInput([], [])));
    const empty: DrivenSteps = new DrivenSteps(new LineDiffJob(new DefaultDiffAlgorithm()).steps(new LineDiffInput(["a"], ["a"])));

    Expect.same([3, 4097, 4096, 4097], [many.count, LineChangeCodec.decode(many.output).count(), many.output.at(-4), many.output.at(-1)]);
    Expect.same([1, 0], [empty.count, empty.output.length]);
  }
}
