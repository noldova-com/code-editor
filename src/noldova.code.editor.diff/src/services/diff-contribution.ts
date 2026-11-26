/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { EditorRegistries, IEditorContribution } from "@noldova/code.editor";

import { Resources } from "../resources.js";
import { DefaultDiffAlgorithm } from "./default-diff-algorithm.js";
import { LineDiffJob } from "./line-diff-job.js";

export class DiffContribution implements IEditorContribution {
  public readonly id: string = Resources.diffContribution;

  public contribute(registries: EditorRegistries): void {
    const algorithm: DefaultDiffAlgorithm = new DefaultDiffAlgorithm();
    registries.diffAlgorithms.register(algorithm);
    registries.backgroundJobs.register(new LineDiffJob(algorithm));
  }
}
