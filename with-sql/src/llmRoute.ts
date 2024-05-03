import { Context } from "hono";
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
You must generate and return response body in the <response_body />.

`;

export const llmRoute =
  (routeSpecPrompt: string, responseFormat: "text" | "json" | "html") =>
  async <T extends { Bindings: { AI: Ai; DB: D1Database } }>(c: Context<T>) => {};
