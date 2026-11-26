/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
declare module "@noldova/code.editor.diff/services/change-mapper.js" {
  import type { TextChange } from "@noldova/code.editor";
  import type { DiffSide, LineChange } from "@noldova/code.editor.diff";
  import type { IReadOnlyList } from "@noldova/context.collections";

  export class ChangeMapper {
    public static through(changes: IReadOnlyList<LineChange>, change: TextChange, side: DiffSide): IReadOnlyList<LineChange>;
  }
}

declare module "@noldova/code.editor.diff/resources.js" {
  export class Resources {
    public static readonly defaultAlgorithmId: string;
    public static readonly diffContribution: string;
    public static formatLineDiffJob(algorithmId: string): string;
  }
}
