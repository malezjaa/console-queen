import stripAnsi from "strip-ansi";
import stringWidth from "string-width";
import { LogType } from "./types";
import isUnicodeSupported from "is-unicode-supported";

export function join(...args: any[]) {
  return args.filter(Boolean).join(" ");
}

export function strWidth(str: string) {
  if (!Intl.Segmenter) {
    return stripAnsi(str).length;
  }
  return stringWidth(str);
}

const unicode = isUnicodeSupported();
const fallback = (c: string, fallback: string) => (unicode ? c : fallback);

export const icons: { [k in LogType]?: string } = {
  error: fallback("✖", "×"),
  fatal: fallback("✖", "×"),
  ready: fallback("✔", "√"),
  warn: fallback("⚠", "‼"),
  info: fallback("ℹ", "i"),
  success: fallback("✔", "√"),
  debug: fallback("⚙", "D"),
  trace: fallback("→", "→"),
  fail: fallback("✖", "×"),
  start: fallback("◐", "o"),
  verbose: fallback("◓", "o"),
  log: "",
};

export const logColors: { [k in LogType]?: string } = {
  info: "cyan",
  fail: "red",
  success: "green",
  ready: "green",
  start: "magenta",
  warn: "yellow",
  error: "red",
  fatal: "red",
  debug: "blue",
  trace: "gray",
  log: "white",
  verbose: "greenBright",
};

//https://github.com/jorgebucaran/colorette
import * as tty from "node:tty";

const {
  env = {},
  argv = [],
  platform = "",
} = typeof process === "undefined" ? {} : process;
const isDisabled = "NO_COLOR" in env || argv.includes("--no-color");
const isForced = "FORCE_COLOR" in env || argv.includes("--color");
const isWindows = platform === "win32";
const isDumbTerminal = env.TERM === "dumb";
const isCompatibleTerminal =
  tty && tty.isatty && tty.isatty(1) && env.TERM && !isDumbTerminal;
const isCI =
  "CI" in env &&
  ("GITHUB_ACTIONS" in env || "GITLAB_CI" in env || "CIRCLECI" in env);
const isColorSupported =
  !isDisabled &&
  (isForced || (isWindows && !isDumbTerminal) || isCompatibleTerminal || isCI);

function replaceClose(
  index: number,
  string: string,
  close: string,
  replace: string,
  head = string.slice(0, Math.max(0, index)) + replace,
  tail = string.slice(Math.max(0, index + close.length)),
  next = tail.indexOf(close),
): string {
  return head + (next < 0 ? tail : replaceClose(next, tail, close, replace));
}

function clearBleed(
  index: number,
  string: string,
  open: string,
  close: string,
  replace: string,
) {
  return index < 0
    ? open + string + close
    : open + replaceClose(index, string, close, replace) + close;
}

function filterEmpty(
  open: string,
  close: string,
  replace = open,
  at = open.length + 1,
) {
  return (string: string) =>
    string || !(string === "" || string === undefined)
      ? clearBleed(
          ("" + string).indexOf(close, at),
          string,
          open,
          close,
          replace,
        )
      : "";
}

function init(open: number, close: number, replace?: string) {
  return filterEmpty(`\u001B[${open}m`, `\u001B[${close}m`, replace);
}

const colorDefs = {
  reset: init(0, 0),
  bold: init(1, 22, "\u001B[22m\u001B[1m"),
  dim: init(2, 22, "\u001B[22m\u001B[2m"),
  italic: init(3, 23),
  underline: init(4, 24),
  inverse: init(7, 27),
  hidden: init(8, 28),
  strikethrough: init(9, 29),
  black: init(30, 39),
  red: init(31, 39),
  green: init(32, 39),
  yellow: init(33, 39),
  blue: init(34, 39),
  magenta: init(35, 39),
  cyan: init(36, 39),
  white: init(37, 39),
  gray: init(90, 39),
  bgBlack: init(40, 49),
  bgRed: init(41, 49),
  bgGreen: init(42, 49),
  bgYellow: init(43, 49),
  bgBlue: init(44, 49),
  bgMagenta: init(45, 49),
  bgCyan: init(46, 49),
  bgWhite: init(47, 49),
  blackBright: init(90, 39),
  redBright: init(91, 39),
  greenBright: init(92, 39),
  yellowBright: init(93, 39),
  blueBright: init(94, 39),
  magentaBright: init(95, 39),
  cyanBright: init(96, 39),
  whiteBright: init(97, 39),
  bgBlackBright: init(100, 49),
  bgRedBright: init(101, 49),
  bgGreenBright: init(102, 49),
  bgYellowBright: init(103, 49),
  bgBlueBright: init(104, 49),
  bgMagentaBright: init(105, 49),
  bgCyanBright: init(106, 49),
  bgWhiteBright: init(107, 49),
};

export type ColorName = keyof typeof colorDefs;
export type ColorFunction = (text: string | number) => string;

export function createColors(useColor = isColorSupported) {
  return useColor
    ? colorDefs
    : Object.fromEntries(Object.keys(colorDefs).map((key) => [key, String]));
}
