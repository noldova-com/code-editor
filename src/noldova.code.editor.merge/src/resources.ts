/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly lineFeed: string = "\n";
  public static readonly lineEndPattern: RegExp = /(?:\r\n|\r|\n)$/;
  public static readonly markerLength: number = 7;
  public static readonly markerLabelSeparator: string = " ";
  public static readonly oursMarker: string = "<<<<<<<";
  public static readonly baseMarker: string = "|||||||";
  public static readonly theirsMarker: string = "=======";
  public static readonly endMarker: string = ">>>>>>>";
  public static readonly conflictMarkersExceptionName: string = "ConflictMarkersException";
  public static readonly wordSeparator: string = " ";
  public static readonly reasonSeparator: string = ": ";
  public static readonly sentenceEnd: string = ".";
  public static readonly markersDontParse: string = "The conflict markers don't parse at line";
  public static readonly outOfPlace: string = "is out of place";
  public static readonly markerUnclosed: string = "the conflict that starts here has no end marker";

  public static formatConflictMarkers(line: number, reason: string): string {
    return `${Resources.markersDontParse}${Resources.wordSeparator}${line}${Resources.reasonSeparator}${reason}${Resources.sentenceEnd}`;
  }

  public static formatMarkerUnexpected(marker: string): string {
    return `${marker}${Resources.wordSeparator}${Resources.outOfPlace}`;
  }
}
