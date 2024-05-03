export type ParsePrompt<P extends string> = P extends `${infer _A}{{${infer B}}}${infer C}` ? { [K in B | keyof ParsePrompt<C>]: string } : {};

export const formatPrompt = <P extends string>(prompt: P, injects: ParsePrompt<P>): string =>
  Object.entries(injects).reduce<string>((acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value as string), prompt);

export const formatter =
  <P extends string>(prompt: P) =>
  (injects: ParsePrompt<P>): string =>
    formatPrompt(prompt, injects);
