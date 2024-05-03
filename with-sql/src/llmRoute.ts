import { Context } from "hono";
import { formatPrompt, parseOutput } from "./utils";

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

const ROUTE_SYSTEM_PROMPT = `# Instructions
You are a mock of WebBackend.
You will now be given the backend specification and the HTTP request for you, which should eventually return a response to the browser.
You must either instruct me to return a response or execute SQL for each utterance.
In other words, your mission is to return a response after properly executing SQL according to the mock API specifications and request.

Never use template engines or other server-side rendering techniques. Just return the response as it is.

The sequence of processing should follow the following flow.
1. You will be given the specification of the API and the HTTP request.
2. Plan the flow to return a response
3. Return a response or execute SQL.
4. If you need to return a response, you can write the response in the fenced code block. response will be returned to the browser.
5. If you need to execute SQL, you can write SQL in the fenced code block.
6. You receive the result of the SQL execution and back to step 3.

# Execute SQL
You can execute SQL by writing SQL in the fenced code block. e.g.
\`\`\`sql
SELECT * FROM users;
\`\`\`

You may execute SQL up to two times in total, and only one statement may be executed at a time.

# Return a response
You can return a response by writing the response in the fenced code block. e.g.
\`\`\`response
HTML or JSON or text
\`\`\`

The response you create is immediately returned to the browser. Never allow the browser to interpret it directly!`;

const ROUTE_BASE_PROMPT = `# Specification
{{spec}}

# HTTP Request
{{request}}`;

const ROUTE_SQL_RESULT_PROMPT = `\`\`\`json
{{sql_result}}
\`\`\``;

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
        max_tokens: 2048,
        stream: false,
        messages,
      });

      if (!("response" in sqlResultResponse) || !sqlResultResponse.response) throw new Error("No response from AI");
      messages.push({ role: "assistant", content: sqlResultResponse.response });
      const sqlResultContent = sqlResultResponse.response;
      console.log(sqlResultContent);
      ({ response, sql } = parseOutput(sqlResultContent));

      let sqlResult = "";

      if (sql) {
        try {
          const { results } = await c.env.DB.prepare(sql).all();
          sqlResult = JSON.stringify(results);
        } catch (error) {
          sqlResult = (error as Error).message;
        }
      }

      console.log(sql, sqlResult);

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
