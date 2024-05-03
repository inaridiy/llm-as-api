import { Hono } from "hono";
import { llmRoute } from "./llmRoute";
import { llmRouteGroq } from "./llmRouteGroq";

const app = new Hono();

const BASE_APPLICATION_SPEC = `This is a simple TODO application.

The application sql schema is as follows:
\`\`\`sql
CREATE TABLE todos (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL
);
\`\`\`

The application has the following routes:
- GET /: Returns the top page of the TODO application.
- GET /?create=true: Returns the page to create a new TODO.
- GET /api/todos: Returns a list of TODOs.
- POST /api/todos: Creates a new TODO.
- PUT /api/todos/:id: Updates the status of a TODO.
- DELETE /api/todos/:id: Deletes a TODO.

The application uses the following data model:
- TODO: \`{ id: string, name: string, status: "pending" | "done" | "deleted" }\`
`;

const TOP_PAGE_PROMPT = `${BASE_APPLICATION_SPEC}

Please return the page of a TODO application in single HTML and JavaScript.
This page must be able to view and manage and create TODOs.

You can access the Todo REST API from the path /api/todos. The Todo API returns JSON in the format
\`{ id: string, name: string, status: "pending" | "done" | "deleted" }\``;

app.get("/", llmRouteGroq(TOP_PAGE_PROMPT, "html"));

const APIS_PROMPT = `${BASE_APPLICATION_SPEC}

Please return the response for the following API request.`;

app.all("/api/*", llmRouteGroq(APIS_PROMPT, "json"));

export default app;
