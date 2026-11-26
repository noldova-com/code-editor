/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/code.editor.merge/models/merge-start.js" {
  import type { MergeConflict } from "@noldova/code.editor.merge";
  import type { IReadOnlyList } from "@noldova/context.collections";

  export class MergeStart {
    public readonly text: string;
    public readonly conflicts: IReadOnlyList<MergeConflict>;
    public constructor(text: string, conflicts: IReadOnlyList<MergeConflict>);
  }
}

declare module "@noldova/code.editor.merge/services/conflict-markers.js" {
  import type { ConflictMarkersException } from "@noldova/code.editor.merge";
  import type { MergeStart } from "@noldova/code.editor.merge/models/merge-start.js";

  export class ConflictMarkers {
    public static parse(merged: string): MergeStart;
    public static read(merged: string): MergeStart | ConflictMarkersException;
  }
}
