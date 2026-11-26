/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { LineSplit } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";

import { MarkerSection } from "../enums/marker-section.js";
import { ConflictMarkersException } from "../exceptions/conflict-markers.exception.js";
import { MergeConflict } from "../models/merge-conflict.js";
import { MergeStart } from "../models/merge-start.js";
import { Resources } from "../resources.js";

export class ConflictMarkers {
  private static readonly MARKERS: readonly string[] = [Resources.oursMarker, Resources.baseMarker, Resources.theirsMarker, Resources.endMarker];

  public static parse(merged: string): MergeStart {
    const start: MergeStart | ConflictMarkersException = ConflictMarkers.read(merged);
    if (start instanceof ConflictMarkersException)
      throw start;

    return start;
  }

  public static read(merged: string): MergeStart | ConflictMarkersException {
    const split: LineSplit = LineSplit.of(merged);
    const parts: string[] = [];
    const conflicts: List<MergeConflict> = new List<MergeConflict>();
    let section: MarkerSection = MarkerSection.Outside;
    let ours: string[] = [];
    let base: string[] = [];
    let theirs: string[] = [];
    let offset: number = 0;
    let startLine: number = 0;
    for (let index = 0; index < split.texts.count(); index++) {
      const text: string = split.texts.get(index);
      const line: string = text + split.endings.get(index);
      const found: string | null = ConflictMarkers.markerOf(text);
      const marker: string | null = section === MarkerSection.Outside && found !== Resources.oursMarker ? null : found;
      const expected: string | null = ConflictMarkers.next(section, marker);
      if (!Object.isNull(marker) && Object.isNull(expected))
        return new ConflictMarkersException(index + 1, Resources.formatMarkerUnexpected(marker));
      if (marker === Resources.oursMarker) {
        section = MarkerSection.Ours;
        startLine = index;
      }
      else if (marker === Resources.baseMarker)
        section = MarkerSection.Base;
      else if (marker === Resources.theirsMarker)
        section = MarkerSection.Theirs;
      else if (marker === Resources.endMarker) {
        const baseText: string = base.join(String.empty);
        conflicts.add(new MergeConflict(conflicts.count(), baseText, ours.join(String.empty), theirs.join(String.empty), offset, offset + baseText.length));
        parts.push(baseText);
        offset += baseText.length;
        ours = [];
        base = [];
        theirs = [];
        section = MarkerSection.Outside;
      }
      else if (section === MarkerSection.Ours)
        ours.push(line);
      else if (section === MarkerSection.Base)
        base.push(line);
      else if (section === MarkerSection.Theirs)
        theirs.push(line);
      else {
        parts.push(line);
        offset += line.length;
      }
    }
    if (section !== MarkerSection.Outside)
      return new ConflictMarkersException(startLine + 1, Resources.markerUnclosed);

    return new MergeStart(parts.join(String.empty), conflicts);
  }

  private static markerOf(text: string): string | null {
    const marker: string | undefined = ConflictMarkers.MARKERS.find(t => text.startsWith(t));
    if (Object.isUndefined(marker))
      return null;

    return text.length === Resources.markerLength || text.charAt(Resources.markerLength) === Resources.markerLabelSeparator ? marker : null;
  }

  private static next(section: MarkerSection, marker: string | null): string | null {
    switch (section) {
      case MarkerSection.Outside:
        return marker;
      case MarkerSection.Ours:
        return marker === Resources.baseMarker || marker === Resources.theirsMarker ? marker : null;
      case MarkerSection.Base:
        return marker === Resources.theirsMarker ? marker : null;
      case MarkerSection.Theirs:
        return marker === Resources.endMarker ? marker : null;
    }
  }
}
