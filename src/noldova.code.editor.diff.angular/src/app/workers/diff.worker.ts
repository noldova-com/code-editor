/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BackgroundJobRegistry, WorkerJobHost } from "@noldova/code.editor";
import { DefaultDiffAlgorithm, LineDiffJob } from "@noldova/code.editor.diff";

const jobs: BackgroundJobRegistry = new BackgroundJobRegistry();
jobs.register(new LineDiffJob(new DefaultDiffAlgorithm()));
new WorkerJobHost(jobs).listen(self);
