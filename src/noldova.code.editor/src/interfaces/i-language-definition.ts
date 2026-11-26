/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { BlockComment } from "../models/languages/block-comment.js";
import type { BracketPair } from "../models/languages/bracket-pair.js";

export interface ILanguageDefinition {
  readonly id: string;
  readonly aliases?: IReadOnlyList<string> | undefined;
  readonly extensions?: IReadOnlyList<string> | undefined;
  readonly filenames?: IReadOnlyList<string> | undefined;
  readonly filenamePatterns?: IReadOnlyList<string> | undefined;
  readonly firstLine?: string | undefined;
  readonly lineComment?: string | undefined;
  readonly blockComment?: BlockComment | undefined;
  readonly brackets?: IReadOnlyList<BracketPair> | undefined;
  readonly wordCharacters?: string | undefined;
}
