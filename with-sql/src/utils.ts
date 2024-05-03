export type ParsePrompt<P extends string> = P extends `${infer _A}{{${infer B}}}${infer C}` ? { [K in B | keyof ParsePrompt<C>]: string } : {};

export const formatPrompt = <P extends string>(prompt: P, injects: ParsePrompt<P>): string =>
  Object.entries(injects).reduce<string>((acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value as string), prompt);

export const formatter =
  <P extends string>(prompt: P) =>
  (injects: ParsePrompt<P>): string =>
    formatPrompt(prompt, injects);

export const parseOutput = (output: string): Record<string, string> => {
  try {
    const regex = /```([a-z]+)\n([\s\S]+?)\n```/g;
    const matches = [...output.matchAll(regex)];
    const matched = matches.map((match) => ({ lang: match[1], output: match[2] }));
    const parsed: Record<string, string> = {};
    for (const { lang, output } of matched) {
      const _lang = lang.toLowerCase();
      if (parsed[_lang]) parsed[_lang] += `\n${output}`;
      else parsed[_lang] = output;
    }
    return parsed || output;
  } catch {
    return { markdown: output };
  }
};
