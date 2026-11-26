# Agent instructions

Noldova owns this repository and makes the final decisions.

## Documents

Read the owner before you work on its subject, and change a rule there.

| When you… | Read |
|---|---|
| explain what the code editor is or who uses it | [README.md](README.md) |
| change the packages or their boundaries, the text model or a view, or write code in this repository | [documents/ARCHITECTURE.md](documents/ARCHITECTURE.md) |
| write tests or change what the checks cover | [README.md, Checks](README.md#checks) |
| write code, tests, styles, documents or commits | the organization's standards, `https://github.com/noldova-com/.github/blob/main/standards/AGENTS.md` |
| build or change anything a person sees | the organization's UI standard, `https://github.com/noldova-com/.github/blob/main/standards/UI.md` |
| prepare or run a release | [README.md, Releases](README.md#releases) |

## Work

- Every pull request names the issue it resolves in this repository, such as `Closes #N`, and passes the checks [README.md](README.md#checks) lists.

## Code editor

- The code editor is built on CONTEXT and `@noldova/diff`, installed from npm and pinned exactly, and on no other editor; its views are styled only with `@noldova/ui.components.angular`'s tokens, installed as a published version: never copy, fork or override the kit's files, tokens or styles, and ask for a change through an issue in its repository.
- The core holds no DOM, and a view holds no text rules of its own: every edit, undo step, search and merge choice goes through the core.
- The code editor names no app; an app uses it through its published API.
- The code editor's public API is everything its packages export.
  A change that breaks it gets a new major version, release notes and a migration path for every app that uses it.
