/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, signal, type WritableSignal } from "@angular/core";

import { MergeEditorComponent } from "../../src/app/components/merge-editor/merge-editor.component.ts";

@Component({
  selector: "noldova-merge-base-host",
  imports: [MergeEditorComponent],
  template: `
    <noldova-merge-editor style="flex: 1" [base]="base" [ours]="ours" [theirs]="theirs" oursLabel="onto main" theirsLabel="your commit abc1234" [showBase]="showBase()">
      <div nolMergeBaseHead class="base-head" style="height: 2rem">Base</div>
    </noldova-merge-editor>
  `
})
export class MergeBaseHost {
  public readonly showBase: WritableSignal<boolean> = signal(false);
  protected readonly base: string = "a\nb\nc\n";
  protected readonly ours: string = "a\nX\nc\n";
  protected readonly theirs: string = "a\nY\nc\n";
}
