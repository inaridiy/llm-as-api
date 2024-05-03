import { Context } from "hono";
import { Anthropic } from "@anthropic-ai/sdk";
import { uuidv7 } from "uuidv7";
import { formatPrompt } from "./utils";

const getRequestText = async (c: Context) => {
  const query = new URLSearchParams(c.req.query()).toString();
  const fullPath = query ? `${c.req.path}?${query}` : c.req.path;
  const requestText = `${c.req.method.toUpperCase()} ${fullPath} HTTP/1.1
${Object.entries(c.req.header())
  .map(([name, value]) => `${name}: ${value}`)
  .join("\n")}
${await c.req.text()}`;

  return requestText;
};

const ROUTE_SYSTEM_PROMPT = `You are a mock of WebBackend.
You will now be passed a brief specification of the API in the <spec /> tag and an HTTP request in the <request /> tag,
so generate the appropriate response Body and return it in the <response_body /> tag <response_body /> tag.

Also, when data is saved or changed, record the changes as neatly as possible with <state_diff/> tags.
<state_diff/> and <response_body/> tags must be independent and one at a time.`;

const ROUTE_BASE_PROMPT = `<state_diff_history>
{{state_diff_history}}
</state_diff_history>
<spec>
{{spec}}
</spec>
<request>
{{request}}
</request>
`;

export const llmRoute =
  (routeSpecPrompt: string, responseFormat: "text" | "json" | "html") =>
  async <T extends { Bindings: { ANTHROPIC_API_KEY: string; KV: KVNamespace } }>(c: Context<T>) => {
    const anthropic = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });

    const requestText = await getRequestText(c);

    const historyList = await c.env.KV.list({ prefix: "state_diff/", limit: 20 });
    const history = await Promise.all(historyList.keys.map((k) => c.env.KV.get(k.name)));
    const historyText = history.filter((h) => h !== null).join("\n");
    const prompt = formatPrompt(ROUTE_BASE_PROMPT, { spec: routeSpecPrompt, request: requestText, state_diff_history: historyText });

    const result = await anthropic.messages.create({
      max_tokens: 2048,
      temperature: 0.6,
      model: "claude-3-haiku-20240307",
      system: ROUTE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = result.content[0].text;

    const response = content.match(/<response_body>([\s\S]*?)<\/response_body>/)?.[1] ?? "";
    const sideEffects = content.match(/<state_diff>([\s\S]*?)<\/state_diff>/)?.[1];

    if (sideEffects && c.req.method.toUpperCase() !== "GET") await c.env.KV.put(`state_diff/${uuidv7()}`, sideEffects);

    switch (responseFormat) {
      case "text":
        return c.text(response);
      case "json":
        return c.json(JSON.parse(response));
      case "html":
        return c.html(response);
    }
  };
