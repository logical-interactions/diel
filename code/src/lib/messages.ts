import { STRICT } from "../compiler/config";

export const FgRed = "\x1b[31m";
export const FgBlue = "\x1b[34m";
export const Reset = "\x1b[0m";
export const BgRed = "\x1b[41m";
export const BgGreen = "\x1b[42m";
export const BgYellow = "\x1b[43m";

export function LogInternalError(m: string) {
  console.log(`${FgRed}%s${Reset}`, m);
  if (STRICT) throw new Error();
}

export function LogWarning(m: string) {
  console.log(`${FgRed}%s${Reset}`, m);
}

export function LogInfo(m: string) {
  console.log(`${BgGreen}%s${Reset}`, m);
}

export function LogTmp(m: string) {
  console.log(m);
}

export function LogStandout(m: string) {
  console.log(`${BgYellow}%s${Reset}`, m);
}

export function ReportDielBasicParsingError(m: string) {
  console.log(`${FgRed}Parsing Error:\n%s${Reset}`, m);
  if (STRICT) throw new Error();
}

// TODO: this should also report the line of the code
// the input should be more structured
export function ReportDielUserError(m: string, q?: string) {
  console.log(`Program Erorr: ${FgRed}%s${Reset}`, m);
  if (q) console.log(`\nQuery: ${FgBlue}%s${Reset}\n`, q);
  if (STRICT) throw new Error();
}

export function GenerateUnitTestErrorLogger(testName: string) {
  console.log(`${BgYellow}Starting Test: %s${Reset}`, testName);
  return (m: string) => {
    console.log(`\nError for ${testName}: ${FgRed}%s${Reset}`, m);
    throw new Error(`Unit test ${testName} failed\n`);
  };
}