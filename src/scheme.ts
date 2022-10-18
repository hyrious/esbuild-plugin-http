// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
export function regex_escape(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function make_regex(schemes: string[]) {
  return new RegExp("^(" + schemes.map(regex_escape).join("|") + "):");
}
