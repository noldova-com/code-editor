/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CodeBar } from "../decorations/code-bar.ts";
import type { CodeEmbeddedLines } from "./code-embedded-lines.ts";
import type { CodeSpacer } from "./code-spacer.ts";

export type CodeInsertedRows = CodeBar | CodeSpacer | CodeEmbeddedLines;
