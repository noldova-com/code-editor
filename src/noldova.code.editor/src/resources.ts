/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HashSet, type IReadOnlySet } from "@noldova/context.collections";

export class Resources {
  public static readonly lineBreakPattern: RegExp = /\r\n|\r|\n/g;
  public static readonly chunkLines: number = 512;
  public static readonly openSliceLength: number = 500000;
  public static readonly tokenChunkLength: number = 1024;
  public static readonly provisionalLines: number = 50;
  public static readonly lineFeed: string = "\n";
  public static readonly carriageReturn: string = "\r";
  public static readonly carriageReturnLineFeed: string = "\r\n";
  public static readonly smallChunkLines: number = 128;
  public static readonly regexSpecialPattern: RegExp = /[.*+?^${}()|[\]\\/]/g;
  public static readonly regexEscape: string = "\\$&";
  public static readonly searchFlags: string = "gu";
  public static readonly ignoreCaseFlag: string = "i";
  public static readonly unicodeFlag: string = "u";
  public static readonly wordBefore: string = "(?<![\\p{L}\\p{N}_])";
  public static readonly wordAfter: string = "(?![\\p{L}\\p{N}_])";
  public static readonly spacePattern: RegExp = /\s/u;
  public static readonly wordCharacterPattern: RegExp = /[\p{L}\p{N}_]/u;
  public static readonly tab: string = "\t";
  public static readonly defaultLineBreak: string = "\n";
  public static readonly groupStart: string = "(?:";
  public static readonly groupEnd: string = ")";
  public static readonly undoGroupMilliseconds: number = 500;
  public static readonly undoLimit: number = 10000;
  public static readonly defaultIndentSize: number = 2;
  public static readonly maximumIndentSize: number = 16;
  public static readonly space: string = " ";
  public static readonly selectCommandSuffix: string = "Select";
  public static readonly shiftPrefix: string = "shift+";
  public static readonly removeCommandPrefix: string = "-";
  public static readonly keyJoiner: string = "+";
  public static readonly modifierShift: string = "shift";
  public static readonly modifierControl: string = "ctrl";
  public static readonly modifierAlt: string = "alt";
  public static readonly modifierMeta: string = "cmd";
  public static readonly modifierPrimary: string = "mod";
  public static readonly modifierNames: ReadonlyMap<string, string> = new Map<string, string>([
    ["shift", "shift"], ["ctrl", "ctrl"], ["control", "ctrl"], ["alt", "alt"], ["option", "alt"],
    ["cmd", "cmd"], ["meta", "cmd"], ["win", "cmd"], ["super", "cmd"], ["mod", "mod"]
  ]);
  public static readonly keyAliases: ReadonlyMap<string, string> = new Map<string, string>([
    ["left", "ArrowLeft"], ["right", "ArrowRight"], ["up", "ArrowUp"], ["down", "ArrowDown"], ["esc", "Escape"], ["space", " "]
  ]);
  public static readonly layoutKeyPattern: RegExp = /^[ -~]$/u;
  public static readonly platformCondition: string = "platform";
  public static readonly platformMac: string = "mac";
  public static readonly platformWindows: string = "windows";
  public static readonly platformLinux: string = "linux";
  public static readonly macPlatformPattern: RegExp = /^Mac/u;
  public static readonly windowsPlatformPattern: RegExp = /^Win/u;
  public static readonly letterCodePrefix: string = "key";
  public static readonly digitCodePrefix: string = "digit";
  public static readonly sequenceJoiner: string = " ";
  public static readonly sequenceChordLimit: number = 2;
  public static readonly keyParameter: string = "key";
  public static readonly modifierKeys: IReadOnlySet<string> = new HashSet<string>(["Shift", "Control", "Alt", "Meta"]);
  public static readonly macControlLabel: string = "⌃";
  public static readonly macAltLabel: string = "⌥";
  public static readonly macShiftLabel: string = "⇧";
  public static readonly macMetaLabel: string = "⌘";
  public static readonly controlLabel: string = "Ctrl";
  public static readonly shiftLabel: string = "Shift";
  public static readonly altLabel: string = "Alt";
  public static readonly windowsMetaLabel: string = "Win";
  public static readonly linuxMetaLabel: string = "Super";
  public static readonly spaceLabel: string = "Space";
  public static readonly macLabelJoiner: string = "";
  public static readonly keyLabelJoiner: string = "+";
  public static readonly conditionTokenPattern: RegExp = /\s*(&&|\|\||==|!=|!|\(|\)|'[^']*'|[^\s&|!=()']+|\S)/gu;
  public static readonly conditionStrayCharacters: readonly string[] = ["&", "|", "=", "'"];
  public static readonly conditionOperators: readonly string[] = ["&&", "||", "==", "!=", "!", "(", ")"];
  public static readonly conditionQuote: string = "'";
  public static readonly conditionOr: string = "||";
  public static readonly conditionAnd: string = "&&";
  public static readonly conditionNot: string = "!";
  public static readonly conditionOpen: string = "(";
  public static readonly conditionClose: string = ")";
  public static readonly conditionEquals: string = "==";
  public static readonly conditionNotEquals: string = "!=";
  public static readonly conditionTrue: string = "true";
  public static readonly conditionFalse: string = "false";
  public static readonly conditionNumberPattern: RegExp = /^-?\d+(?:\.\d+)?$/u;
  public static readonly languageScopePattern: RegExp = /^\[(.+)\]$/u;
  public static readonly phrasePlaceholderPattern: RegExp = /\{(\w+)\}/gu;
  public static readonly phraseCount: string = "count";
  public static readonly fallbackLocale: string = "en";
  public static readonly commandRegistry: string = "commands";
  public static readonly conditionRegistry: string = "conditions";
  public static readonly settingRegistry: string = "settings";
  public static readonly diffAlgorithmRegistry: string = "diff algorithms";
  public static readonly backgroundJobRegistry: string = "background jobs";
  public static readonly anyAlgorithm: string = "algorithm";
  public static readonly message: "message" = "message";
  public static readonly coreContribution: string = "noldova.code.editor";
  public static readonly sessionFeature: string = "session";
  public static readonly indentSizeDescription: string = "The number of spaces one indent level inserts when editor.insertSpaces is on.";
  public static readonly insertSpacesDescription: string = "Whether an indent inserts spaces; a tab when off.";
  public static readonly undoGroupDescription: string = "How many milliseconds apart typing or deleting may be and still undo as one step.";
  public static readonly undoLimitDescription: string = "The most undo steps kept; the oldest go first.";
  public static readonly readOnlyDescription: string = "The editor refuses edits.";
  public static readonly hasSelectionDescription: string = "Some selection is not empty.";
  public static readonly hasMultipleSelectionsDescription: string = "The editor has more than one selection.";
  public static readonly tabIndentsDescription: string = "Tab and Shift+Tab indent and outdent instead of moving focus.";
  public static readonly platformDescription: string = "The system the editor runs on: mac, windows or linux, read from the runtime; a host may set another.";
  public static readonly lineParameter: string = "line";
  public static readonly columnParameter: string = "column";
  public static readonly offsetParameter: string = "offset";
  public static readonly positionParameter: string = "position";
  public static readonly rangeParameter: string = "range";
  public static readonly editsParameter: string = "edits";
  public static readonly indexParameter: string = "index";
  public static readonly countExpected: string = "A whole number of zero or more is expected.";
  public static readonly rangeReversed: string = "The range ends before it starts.";
  public static readonly valueMissing: string = "A value is missing where one is required.";
  public static readonly editsEmpty: string = "A transaction needs at least one edit.";
  public static readonly languageRegistry: string = "languages";
  public static readonly highlighterRegistry: string = "highlighters";
  public static readonly highlighterAssignmentRegistry: string = "highlighter assignments";
  public static readonly tokenTypeRegistry: string = "token types";
  public static readonly tokenModifierRegistry: string = "token modifiers";
  public static readonly globPartPattern: RegExp = /\*\*\/|\*\*|\*|\?|[^*?]/gu;
  public static readonly globSpecialPattern: RegExp = /[.+^${}()|[\]\\/]/gu;
  public static readonly globSources: ReadonlyMap<string, string> = new Map<string, string>([
    ["**/", "(?:.*/)?"],
    ["**", ".*"],
    ["*", "[^/]*"],
    ["?", "[^/]"]
  ]);
  public static readonly pathSeparator: string = "/";
  public static readonly windowsPathSeparator: string = "\\";
  public static readonly tokenVariablePrefix: string = "--nol-code-";
  public static readonly tokenModifierClass: string = "modifier-";
  public static readonly tokenStyleUnchanged: string = "inherit";
  public static readonly tokenNameUnsafePattern: RegExp = /[^a-z0-9_-]/gu;
  public static readonly tokenNameReplacement: string = "-";
  public static readonly tokenModifierProperties: readonly string[] = ["font-style", "font-weight", "text-decoration"];
  public static readonly commentTokenType: string = "comment";
  public static readonly keywordTokenType: string = "keyword";
  public static readonly controlKeywordTokenType: string = "keyword.control";
  public static readonly stringTokenType: string = "string";
  public static readonly regexTokenType: string = "string.regexp";
  public static readonly numberTokenType: string = "number";
  public static readonly typeTokenType: string = "type";
  public static readonly functionTokenType: string = "function";
  public static readonly variableTokenType: string = "variable";
  public static readonly metaTokenType: string = "meta";
  public static readonly deprecatedTokenModifier: string = "deprecated";
  public static readonly readonlyTokenModifier: string = "readonly";
  public static readonly staticTokenModifier: string = "static";
  public static readonly tokenKitVariables: ReadonlyMap<string, string> = new Map<string, string>([
    [Resources.controlKeywordTokenType, "--nol-code-control"],
    [Resources.regexTokenType, "--nol-code-regex"]
  ]);
  public static readonly colorProperty: string = "color";
  public static readonly styleDeclarationJoiner: string = "; ";
  public static readonly tokenTypeSeparator: string = ".";
  public static readonly commentTokenDescription: string = "A comment.";
  public static readonly keywordTokenDescription: string = "A keyword, a storage word such as const, or a language constant such as true.";
  public static readonly controlKeywordTokenDescription: string = "A control-flow keyword, such as if, return or import.";
  public static readonly stringTokenDescription: string = "A string.";
  public static readonly regexTokenDescription: string = "A regular expression.";
  public static readonly numberTokenDescription: string = "A number or a unit.";
  public static readonly typeTokenDescription: string = "A type, class or namespace name.";
  public static readonly functionTokenDescription: string = "A function name.";
  public static readonly variableTokenDescription: string = "A variable, property, parameter or attribute name.";
  public static readonly metaTokenDescription: string = "A preprocessor line, decorator, tag, heading or diff header.";
  public static readonly deprecatedModifierDescription: string = "Deprecated, so its use is discouraged.";
  public static readonly readonlyModifierDescription: string = "Read-only.";
  public static readonly staticModifierDescription: string = "Static, belonging to a type rather than an instance.";
  public static readonly pluralZero: Intl.LDMLPluralRule = "zero";
  public static readonly pluralOne: Intl.LDMLPluralRule = "one";
  public static readonly pluralTwo: Intl.LDMLPluralRule = "two";
  public static readonly pluralFew: Intl.LDMLPluralRule = "few";
  public static readonly pluralMany: Intl.LDMLPluralRule = "many";
  public static readonly conditionSyntaxExceptionName: string = "ConditionSyntaxException";
  public static readonly editsOverlapExceptionName: string = "EditsOverlapException";
  public static readonly keySyntaxExceptionName: string = "KeySyntaxException";
  public static readonly registrationExistsExceptionName: string = "RegistrationExistsException";
  public static readonly registrationMissingExceptionName: string = "RegistrationMissingException";
  public static readonly searchPatternExceptionName: string = "SearchPatternException";
  public static readonly valueMissingExceptionName: string = "ValueMissingException";
  public static readonly cursorLeftCommand: string = "editor.cursorLeft";
  public static readonly cursorWordLeftCommand: string = "editor.cursorWordLeft";
  public static readonly cursorRightCommand: string = "editor.cursorRight";
  public static readonly cursorWordRightCommand: string = "editor.cursorWordRight";
  public static readonly cursorUpCommand: string = "editor.cursorUp";
  public static readonly cursorDownCommand: string = "editor.cursorDown";
  public static readonly cursorPageUpCommand: string = "editor.cursorPageUp";
  public static readonly cursorPageDownCommand: string = "editor.cursorPageDown";
  public static readonly cursorHomeCommand: string = "editor.cursorHome";
  public static readonly cursorEndCommand: string = "editor.cursorEnd";
  public static readonly cursorLineStartCommand: string = "editor.cursorLineStart";
  public static readonly cursorTopCommand: string = "editor.cursorTop";
  public static readonly cursorBottomCommand: string = "editor.cursorBottom";
  public static readonly selectAllCommand: string = "editor.selectAll";
  public static readonly cancelSelectionCommand: string = "editor.cancelSelection";
  public static readonly deleteLeftCommand: string = "editor.deleteLeft";
  public static readonly deleteRightCommand: string = "editor.deleteRight";
  public static readonly deleteWordLeftCommand: string = "editor.deleteWordLeft";
  public static readonly deleteWordRightCommand: string = "editor.deleteWordRight";
  public static readonly deleteAllLeftCommand: string = "editor.deleteAllLeft";
  public static readonly deleteAllRightCommand: string = "editor.deleteAllRight";
  public static readonly newLineCommand: string = "editor.newLine";
  public static readonly indentCommand: string = "editor.indent";
  public static readonly outdentCommand: string = "editor.outdent";
  public static readonly undoCommand: string = "editor.undo";
  public static readonly redoCommand: string = "editor.redo";
  public static readonly readOnlyCondition: string = "editorReadOnly";
  public static readonly hasSelectionCondition: string = "editorHasSelection";
  public static readonly hasMultipleSelectionsCondition: string = "editorHasMultipleSelections";
  public static readonly tabIndentsCondition: string = "editorTabIndents";
  public static readonly indentSizeSetting: string = "editor.indentSize";
  public static readonly insertSpacesSetting: string = "editor.insertSpaces";
  public static readonly undoGroupMillisecondsSetting: string = "editor.undoGroupMilliseconds";
  public static readonly undoLimitSetting: string = "editor.undoLimit";
  public static readonly minimumIndentSize: number = 1;
  public static readonly defaultInsertSpaces: boolean = true;
  public static readonly minimumUndoGroupMilliseconds: number = 0;
  public static readonly minimumUndoLimit: number = 1;
  public static readonly leftKey: string = "left";
  public static readonly ctrlLeftKey: string = "ctrl+left";
  public static readonly altLeftKey: string = "alt+left";
  public static readonly cmdLeftKey: string = "cmd+left";
  public static readonly rightKey: string = "right";
  public static readonly ctrlRightKey: string = "ctrl+right";
  public static readonly altRightKey: string = "alt+right";
  public static readonly cmdRightKey: string = "cmd+right";
  public static readonly upKey: string = "up";
  public static readonly downKey: string = "down";
  public static readonly ctrlUpKey: string = "ctrl+up";
  public static readonly cmdUpKey: string = "cmd+up";
  public static readonly ctrlDownKey: string = "ctrl+down";
  public static readonly cmdDownKey: string = "cmd+down";
  public static readonly pageUpKey: string = "pageup";
  public static readonly pageDownKey: string = "pagedown";
  public static readonly homeKey: string = "home";
  public static readonly endKey: string = "end";
  public static readonly ctrlHomeKey: string = "ctrl+home";
  public static readonly ctrlEndKey: string = "ctrl+end";
  public static readonly backspaceKey: string = "backspace";
  public static readonly shiftBackspaceKey: string = "shift+backspace";
  public static readonly ctrlBackspaceKey: string = "ctrl+backspace";
  public static readonly altBackspaceKey: string = "alt+backspace";
  public static readonly deleteKey: string = "delete";
  public static readonly ctrlDeleteKey: string = "ctrl+delete";
  public static readonly altDeleteKey: string = "alt+delete";
  public static readonly cmdBackspaceKey: string = "cmd+backspace";
  public static readonly cmdDeleteKey: string = "cmd+delete";
  public static readonly ctrlAKey: string = "ctrl+a";
  public static readonly ctrlEKey: string = "ctrl+e";
  public static readonly ctrlFKey: string = "ctrl+f";
  public static readonly ctrlBKey: string = "ctrl+b";
  public static readonly ctrlNKey: string = "ctrl+n";
  public static readonly ctrlPKey: string = "ctrl+p";
  public static readonly ctrlDKey: string = "ctrl+d";
  public static readonly ctrlHKey: string = "ctrl+h";
  public static readonly ctrlKKey: string = "ctrl+k";
  public static readonly enterKey: string = "enter";
  public static readonly shiftEnterKey: string = "shift+enter";
  public static readonly tabKey: string = "tab";
  public static readonly shiftTabKey: string = "shift+tab";
  public static readonly escapeKey: string = "escape";
  public static readonly modAKey: string = "mod+a";
  public static readonly modZKey: string = "mod+z";
  public static readonly modShiftZKey: string = "mod+shift+z";
  public static readonly ctrlYKey: string = "ctrl+y";
  public static readonly defaultSliceMilliseconds: number = 5;
  public static readonly searchColumnsPerMatch: number = 2;
  public static readonly surrogatePairLength: number = 2;
  public static readonly spaceCharacterKind: number = 0;
  public static readonly wordCharacterKind: number = 1;
  public static readonly otherCharacterKind: number = 2;
  public static readonly highSurrogateFirst: number = 0xD800;
  public static readonly highSurrogateLast: number = 0xDBFF;
  public static readonly lowSurrogateFirst: number = 0xDC00;
  public static readonly lowSurrogateLast: number = 0xDFFF;
  public static readonly lineWord: string = "Line";
  public static readonly columnWord: string = "Column";
  public static readonly offsetWord: string = "Offset";
  public static readonly indexWord: string = "Index";
  public static readonly theWord: string = "The";
  public static readonly outsideDocumentPhrase: string = "is outside the document's";
  public static readonly outsideLinePhrase: string = "is outside line";
  public static readonly outsideThePhrase: string = "is outside the";
  public static readonly linesWord: string = "lines";
  public static readonly whichIsPhrase: string = "which is";
  public static readonly charactersLongPhrase: string = "characters long";
  public static readonly charactersWord: string = "characters";
  public static readonly itemsWord: string = "items";
  public static readonly searchPatternPhrase: string = "The search pattern";
  public static readonly invalidRegexPhrase: string = "isn't a valid regular expression";
  public static readonly editStartingAtPhrase: string = "The edit starting at";
  public static readonly overlapsEditStartingAtPhrase: string = "overlaps the edit starting at";
  public static readonly registryAlreadyHoldsPhrase: string = "registry already holds";
  public static readonly registryHoldsNoPhrase: string = "registry holds no";
  public static readonly conditionPhrase: string = "The condition";
  public static readonly cannotBeReadAtOffsetPhrase: string = "can't be read at offset";
  public static readonly keyPhrase: string = "The key";
  public static readonly invalidKeyBindingPhrase: string = "isn't a valid key binding";
  public static readonly keySequencePhrase: string = "The key sequence";
  public static readonly hasMoreThanPhrase: string = "has more than";
  public static readonly chordsWord: string = "chords";
  public static readonly period: string = ".";
  public static readonly comma: string = ",";
  public static readonly colon: string = ":";
  public static readonly pathPatternStart: string = "(?:^|/)";
  public static readonly patternStart: string = "^";
  public static readonly patternEnd: string = "$";
  public static readonly variableFunctionStart: string = "var(";
  public static readonly variableFunctionEnd: string = ")";
  public static readonly argumentJoiner: string = ", ";
  public static readonly variableNameJoiner: string = "-";
  public static readonly declarationJoiner: string = ": ";
  public static readonly classSelectorPrefix: string = ".";
  public static readonly ruleBodyStart: string = " { ";
  public static readonly ruleBodyEnd: string = "; }";

  public static formatLineOutOfRange(line: number, lineCount: number): string {
    return Resources.sentence([Resources.lineWord, `${line}`, Resources.outsideDocumentPhrase, `${lineCount}`, Resources.linesWord]);
  }

  public static formatColumnOutOfRange(column: number, line: number, length: number): string {
    return Resources.sentence([Resources.columnWord, `${column}`, Resources.outsideLinePhrase, `${line}${Resources.comma}`, Resources.whichIsPhrase, `${length}`, Resources.charactersLongPhrase]);
  }

  public static formatOffsetOutOfRange(offset: number, length: number): string {
    return Resources.sentence([Resources.offsetWord, `${offset}`, Resources.outsideDocumentPhrase, `${length}`, Resources.charactersWord]);
  }

  public static formatIndexOutOfRange(index: number, count: number): string {
    return Resources.sentence([Resources.indexWord, `${index}`, Resources.outsideThePhrase, `${count}`, Resources.itemsWord]);
  }

  public static formatSearchPattern(pattern: string, reason: string): string {
    return [Resources.searchPatternPhrase, pattern, `${Resources.invalidRegexPhrase}${Resources.colon}`, reason].join(Resources.space);
  }

  public static formatEditsOverlap(firstLine: number, firstColumn: number, secondLine: number, secondColumn: number): string {
    return Resources.sentence([Resources.editStartingAtPhrase, Resources.position(secondLine, secondColumn), Resources.overlapsEditStartingAtPhrase, Resources.position(firstLine, firstColumn)]);
  }

  public static formatRegistrationExists(registry: string, id: string): string {
    return Resources.sentence([Resources.theWord, registry, Resources.registryAlreadyHoldsPhrase, id]);
  }

  public static formatRegistrationMissing(registry: string, id: string): string {
    return Resources.sentence([Resources.theWord, registry, Resources.registryHoldsNoPhrase, id]);
  }

  public static formatConditionSyntax(text: string, offset: number): string {
    return Resources.sentence([Resources.conditionPhrase, text, Resources.cannotBeReadAtOffsetPhrase, `${offset}`]);
  }

  public static formatKeySyntax(text: string): string {
    return Resources.sentence([Resources.keyPhrase, text, Resources.invalidKeyBindingPhrase]);
  }

  public static formatKeySequenceLength(text: string, limit: number): string {
    return Resources.sentence([Resources.keySequencePhrase, text, Resources.hasMoreThanPhrase, `${limit}`, Resources.chordsWord]);
  }

  public static formatPathPatternSource(source: string): string {
    return `${Resources.pathPatternStart}${source}${Resources.patternEnd}`;
  }

  public static formatNamePatternSource(source: string): string {
    return `${Resources.patternStart}${source}${Resources.patternEnd}`;
  }

  public static formatVariableReference(variable: string, fallback: string): string {
    return `${Resources.variableFunctionStart}${variable}${Resources.argumentJoiner}${fallback}${Resources.variableFunctionEnd}`;
  }

  public static formatModifierVariable(name: string, property: string): string {
    return `${Resources.tokenVariablePrefix}${Resources.tokenModifierClass}${name}${Resources.variableNameJoiner}${property}`;
  }

  public static formatDeclaration(property: string, value: string): string {
    return `${property}${Resources.declarationJoiner}${value}`;
  }

  public static formatStyleRule(className: string, declarations: string): string {
    return `${Resources.classSelectorPrefix}${className}${Resources.ruleBodyStart}${declarations}${Resources.ruleBodyEnd}`;
  }

  private static sentence(parts: readonly string[]): string {
    return `${parts.join(Resources.space)}${Resources.period}`;
  }

  private static position(line: number, column: number): string {
    return `${line}${Resources.colon}${column}`;
  }
}
