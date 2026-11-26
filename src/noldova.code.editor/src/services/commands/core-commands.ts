/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { ICommand } from "../../interfaces/i-command.js";
import type { IMoveCommand } from "../../interfaces/i-move-command.js";
import type { CommandContext } from "../../models/commands/command-context.js";
import { SessionCommand } from "../../models/commands/session-command.js";
import { SessionMoveCommand } from "../../models/commands/session-move-command.js";
import { Resources } from "../../resources.js";
import { CoreSettings } from "../core-settings.js";

export class CoreCommands {
  public static readonly cursorLeft: IMoveCommand = new SessionMoveCommand(Resources.cursorLeftCommand, (s, extend) => s.moveLeft(extend, false));
  public static readonly cursorWordLeft: IMoveCommand = new SessionMoveCommand(Resources.cursorWordLeftCommand, (s, extend) => s.moveLeft(extend, true));
  public static readonly cursorRight: IMoveCommand = new SessionMoveCommand(Resources.cursorRightCommand, (s, extend) => s.moveRight(extend, false));
  public static readonly cursorWordRight: IMoveCommand = new SessionMoveCommand(Resources.cursorWordRightCommand, (s, extend) => s.moveRight(extend, true));
  public static readonly cursorUp: IMoveCommand = new SessionMoveCommand(Resources.cursorUpCommand, (s, extend) => s.moveLines(-1, extend));
  public static readonly cursorDown: IMoveCommand = new SessionMoveCommand(Resources.cursorDownCommand, (s, extend) => s.moveLines(1, extend));
  public static readonly cursorPageUp: IMoveCommand = new SessionMoveCommand(Resources.cursorPageUpCommand, (s, extend, c) => s.moveLines(-Math.max(1, c.pageLines), extend));
  public static readonly cursorPageDown: IMoveCommand = new SessionMoveCommand(Resources.cursorPageDownCommand, (s, extend, c) => s.moveLines(Math.max(1, c.pageLines), extend));
  public static readonly cursorHome: IMoveCommand = new SessionMoveCommand(Resources.cursorHomeCommand, (s, extend) => s.moveLineStart(extend));
  public static readonly cursorEnd: IMoveCommand = new SessionMoveCommand(Resources.cursorEndCommand, (s, extend) => s.moveLineEnd(extend));
  public static readonly cursorLineStart: IMoveCommand = new SessionMoveCommand(Resources.cursorLineStartCommand, (s, extend) => s.moveLineFirstColumn(extend));
  public static readonly cursorTop: IMoveCommand = new SessionMoveCommand(Resources.cursorTopCommand, (s, extend) => s.moveDocumentStart(extend));
  public static readonly cursorBottom: IMoveCommand = new SessionMoveCommand(Resources.cursorBottomCommand, (s, extend) => s.moveDocumentEnd(extend));

  public static readonly selectAll: ICommand = new SessionCommand(Resources.selectAllCommand, s => s.selectAll());
  public static readonly cancelSelection: ICommand = new SessionCommand(Resources.cancelSelectionCommand, s => s.collapse());
  public static readonly deleteLeft: ICommand = new SessionCommand(Resources.deleteLeftCommand, (s, c) => s.deleteBackward(false, c.time));
  public static readonly deleteRight: ICommand = new SessionCommand(Resources.deleteRightCommand, (s, c) => s.deleteForward(false, c.time));
  public static readonly deleteWordLeft: ICommand = new SessionCommand(Resources.deleteWordLeftCommand, (s, c) => s.deleteBackward(true, c.time));
  public static readonly deleteWordRight: ICommand = new SessionCommand(Resources.deleteWordRightCommand, (s, c) => s.deleteForward(true, c.time));
  public static readonly deleteAllLeft: ICommand = new SessionCommand(Resources.deleteAllLeftCommand, (s, c) => s.deleteToLineStart(c.time));
  public static readonly deleteAllRight: ICommand = new SessionCommand(Resources.deleteAllRightCommand, (s, c) => s.deleteToLineEnd(c.time));
  public static readonly newLine: ICommand = new SessionCommand(Resources.newLineCommand, (s, c) => s.newLine(c.time));
  public static readonly indent: ICommand = new SessionCommand(Resources.indentCommand, (s, c) => s.indent(CoreCommands.indentUnit(c), c.time));
  public static readonly outdent: ICommand = new SessionCommand(Resources.outdentCommand, (s, c) => s.outdent(CoreCommands.indentUnit(c), c.time));
  public static readonly undo: ICommand = new SessionCommand(Resources.undoCommand, s => s.undo());
  public static readonly redo: ICommand = new SessionCommand(Resources.redoCommand, s => s.redo());

  public static readonly moves: IReadOnlyList<IMoveCommand> = new List<IMoveCommand>([
    CoreCommands.cursorLeft, CoreCommands.cursorWordLeft, CoreCommands.cursorRight, CoreCommands.cursorWordRight, CoreCommands.cursorUp,
    CoreCommands.cursorDown, CoreCommands.cursorPageUp, CoreCommands.cursorPageDown, CoreCommands.cursorHome, CoreCommands.cursorEnd,
    CoreCommands.cursorLineStart, CoreCommands.cursorTop, CoreCommands.cursorBottom
  ]);

  public static readonly all: IReadOnlyList<ICommand> = new List<ICommand>([
    ...CoreCommands.moves.selectMany(t => [t, t.select]),
    CoreCommands.selectAll, CoreCommands.cancelSelection, CoreCommands.deleteLeft, CoreCommands.deleteRight, CoreCommands.deleteWordLeft,
    CoreCommands.deleteWordRight, CoreCommands.deleteAllLeft, CoreCommands.deleteAllRight, CoreCommands.newLine, CoreCommands.indent,
    CoreCommands.outdent, CoreCommands.undo, CoreCommands.redo
  ]);

  public static indentUnit(context: CommandContext): string {
    return context.setting(CoreSettings.insertSpaces) ? Resources.space.repeat(context.setting(CoreSettings.indentSize)) : Resources.tab;
  }
}
