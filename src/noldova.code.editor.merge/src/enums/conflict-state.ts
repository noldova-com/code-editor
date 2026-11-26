/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum ConflictState {
  Unresolved = "Unresolved",
  Ours = "Ours",
  Theirs = "Theirs",
  BothOursFirst = "BothOursFirst",
  BothTheirsFirst = "BothTheirsFirst",
  Suggested = "Suggested",
  Edited = "Edited"
}
