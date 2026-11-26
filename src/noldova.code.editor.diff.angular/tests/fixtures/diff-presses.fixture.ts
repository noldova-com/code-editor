/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class DiffPresses {
  public static readonly nextChange: string = "{Alt>}{ArrowDown}{/Alt}";
  public static readonly previousChange: string = "{Alt>}{ArrowUp}{/Alt}";
  public static readonly otherModifiers: string = "{Alt>}{Control>}{ArrowDown}{/Control}{Shift>}{ArrowDown}{/Shift}{Meta>}{ArrowDown}{/Meta}{ArrowLeft}{/Alt}";
  public static readonly macFind: string = "{Meta>}f{/Meta}";
  public static readonly find: string = "{Control>}f{/Control}";
  public static readonly nextChangeKey: string = "alt+down";
  public static readonly previousChangeKey: string = "alt+up";
  public static readonly ownKey: string = "alt+n";
  public static readonly ownPress: string = "{Alt>}n{/Alt}";
  public static readonly sequenceKey: string = "ctrl+k ctrl+n";
  public static readonly sequencePress: string = "{Control>}k{/Control}{Control>}n{/Control}";
  public static readonly arrowDown: string = "ArrowDown";
}
