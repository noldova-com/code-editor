/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from "@angular/core";

import { MergeEditorComponent } from "../../src/app/components/merge-editor/merge-editor.component.ts";

@Component({
  selector: "noldova-merge-heads-host",
  imports: [MergeEditorComponent],
  template: `
    <noldova-merge-editor style="flex: 1" [base]="base" [ours]="ours" [theirs]="theirs" oursLabel="onto main" theirsLabel="your commit abc1234">
      <div nolMergeOursHead class="ours-head" style="height: 2rem">Onto main</div>
      <div nolMergeTheirsHead class="theirs-head" style="height: 2rem">Your commit</div>
      <div nolMergeResultHead class="result-head" style="height: 2rem">Result</div>
    </noldova-merge-editor>
  `
})
export class MergeHeadsHost {
  protected readonly base: string = "a\nb\nc\n";
  protected readonly ours: string = "a\nX\nc\n";
  protected readonly theirs: string = "a\nY\nc\n";
}
