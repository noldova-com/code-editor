/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { ConditionSyntaxException } from "../../exceptions/condition-syntax.exception.js";
import type { IConditionNode } from "../../interfaces/i-condition-node.js";
import { ConditionAnd } from "../../models/conditions/condition-and.js";
import { ConditionEquals } from "../../models/conditions/condition-equals.js";
import { ConditionLiteral } from "../../models/conditions/condition-literal.js";
import { ConditionName } from "../../models/conditions/condition-name.js";
import { ConditionNot } from "../../models/conditions/condition-not.js";
import { ConditionOr } from "../../models/conditions/condition-or.js";
import { ConditionToken } from "../../models/conditions/condition-token.js";
import { Resources } from "../../resources.js";
import { Required } from "../required.js";

export class ConditionParser {
  private readonly text: string;
  private readonly tokens: readonly ConditionToken[];
  private index: number = 0;

  private constructor(text: string) {
    this.text = text;
    this.tokens = ConditionParser.tokensOf(text);
  }

  public static parse(text: string): IConditionNode {
    return new ConditionParser(text).whole();
  }

  private static tokensOf(text: string): readonly ConditionToken[] {
    const tokens: ConditionToken[] = [];
    for (const match of text.matchAll(Resources.conditionTokenPattern)) {
      const token: string = Required.value(match[1]);
      const offset: number = match.index + match[0].length - token.length;
      if (Resources.conditionStrayCharacters.includes(token))
        throw new ConditionSyntaxException(text, offset);
      tokens.push(new ConditionToken(token, offset, token.startsWith(Resources.conditionQuote)));
    }

    return tokens;
  }

  private whole(): IConditionNode {
    if (this.tokens.length === 0)
      return new ConditionLiteral(true);
    const node: IConditionNode = this.or();
    const rest: ConditionToken | undefined = this.tokens[this.index];
    if (!Object.isUndefined(rest))
      throw new ConditionSyntaxException(this.text, rest.offset);

    return node;
  }

  private or(): IConditionNode {
    let node: IConditionNode = this.and();
    while (this.accept(Resources.conditionOr))
      node = new ConditionOr(node, this.and());

    return node;
  }

  private and(): IConditionNode {
    let node: IConditionNode = this.unary();
    while (this.accept(Resources.conditionAnd))
      node = new ConditionAnd(node, this.unary());

    return node;
  }

  private unary(): IConditionNode {
    if (this.accept(Resources.conditionNot))
      return new ConditionNot(this.unary());

    return this.primary();
  }

  private primary(): IConditionNode {
    if (this.accept(Resources.conditionOpen)) {
      const node: IConditionNode = this.or();
      if (!this.accept(Resources.conditionClose))
        throw new ConditionSyntaxException(this.text, this.offsetHere());

      return node;
    }
    const left: IConditionNode = this.operand(false);
    if (this.accept(Resources.conditionEquals))
      return new ConditionEquals(left, this.operand(true), false);
    if (this.accept(Resources.conditionNotEquals))
      return new ConditionEquals(left, this.operand(true), true);

    return left;
  }

  private operand(bareIsText: boolean): IConditionNode {
    const token: ConditionToken | undefined = this.tokens[this.index];
    if (Object.isUndefined(token) || !token.quoted && Resources.conditionOperators.includes(token.text))
      throw new ConditionSyntaxException(this.text, this.offsetHere());
    this.index++;
    if (token.quoted)
      return new ConditionLiteral(token.text.slice(1, -1));
    if (token.text === Resources.conditionTrue || token.text === Resources.conditionFalse)
      return new ConditionLiteral(token.text === Resources.conditionTrue);
    if (Resources.conditionNumberPattern.test(token.text))
      return new ConditionLiteral(Number(token.text));

    return bareIsText ? new ConditionLiteral(token.text) : new ConditionName(token.text);
  }

  private accept(operator: string): boolean {
    const token: ConditionToken | undefined = this.tokens[this.index];
    if (Object.isUndefined(token) || token.quoted || token.text !== operator)
      return false;
    this.index++;

    return true;
  }

  private offsetHere(): number {
    return this.tokens[this.index]?.offset ?? this.text.length;
  }
}
