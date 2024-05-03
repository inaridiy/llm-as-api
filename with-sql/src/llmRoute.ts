import { Context } from "hono";
import { formatPrompt, parseOutput } from "./utils";
import { ROUTE_BASE_PROMPT, ROUTE_SQL_RESULT_PROMPT, ROUTE_SYSTEM_PROMPT } from "./prompt";

const getRequestText = async (c: Context) => {
  const query = new URLSearchParams(c.req.query()).toString();
  const fullPath = query ? `${c.req.path}?${query}` : c.req.path;
  const requestText = `${c.req.method.toUpperCase()} ${fullPath} HTTP/1.1
${await c.req.text()}`;

  return requestText;
};

export const llmRoute =
  (routeSpecPrompt: string, responseFormat: "text" | "json" | "html") =>
  async <T extends { Bindings: { AI: Ai; DB: D1Database } }>(c: Context<T>) => {
    const requestText = await getRequestText(c);
    const basePrompt = formatPrompt(ROUTE_BASE_PROMPT, { spec: routeSpecPrompt, request: requestText });
    const messages = [
      { role: "system", content: ROUTE_SYSTEM_PROMPT },
      { role: "user", content: basePrompt },
    ];

    let response = "";
    let sql = "";

    for (let i = 0; i < 3; i++) {
      const sqlResultResponse = await c.env.AI.run("@cf/meta/llama-3-8b-instruct", {
        max_tokens: 4096,
        stream: false,
        messages,
      });

      if (!("response" in sqlResultResponse) || !sqlResultResponse.response) throw new Error("No response from AI");
      messages.push({ role: "assistant", content: sqlResultResponse.response });
      const sqlResultContent = sqlResultResponse.response;
      let html, json, text;
      ({ html, json, text, sql } = parseOutput(sqlResultContent));
      response = html || json || text;

      let sqlResult = "";

      if (sql) {
        try {
          const { results } = await c.env.DB.prepare(sql).all();
          sqlResult = JSON.stringify(results);
        } catch (error) {
          sqlResult = (error as Error).message;
        }
      }

      if (response) {
        switch (responseFormat) {
          case "text":
            return c.text(response);
          case "json":
            return c.json(JSON.parse(response));
          case "html":
            return c.html(response);
        }
      }

      const sqlResultPrompt = formatPrompt(ROUTE_SQL_RESULT_PROMPT, { sql_result: sqlResult });
      messages.push({ role: "user", content: sqlResultPrompt });
    }
  };
