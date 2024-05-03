import { Hono } from "hono";
import { llmRoute } from "./llmRoute";

const app = new Hono();

const BASE_APPLICATION_SPEC = `This is a simple TODO application.

The application sql schema is as follows:
<sql>
CREATE TABLE todos (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL
);
INSERT INTO todos (id, name, status) VALUES (1, "Buy milk", "pending");
INSERT INTO todos (id, name, status) VALUES (2, "Call mom", "pending");
INSERT INTO todos (id, name, status) VALUES (3, "Go to the gym", "done");
</sql>

The application has the following routes:
- GET /: Returns the top page of the TODO application.
- GET /api/todos: Returns a list of TODOs.
- POST /api/todos: Creates a new TODO.
- PUT /api/todos/:id: Updates the status of a TODO.
- DELETE /api/todos/:id: Deletes a TODO.

The application uses the following data model:
- TODO: { id: string, name: string, status: "pending" | "done" | "deleted" }
`;

const TOP_PAGE_PROMPT = `${BASE_APPLICATION_SPEC}

Please return the top page of a simple TODO application in HTML.
This page must be able to view and manage and create TODOs.
Don't mock todos, Must fetch todos bia API.`;

app.get("/", llmRoute(TOP_PAGE_PROMPT, "html"));

const APIS_PROMPT = `${BASE_APPLICATION_SPEC}
Plsease return the response for the following API request.`;

app.all("/api/*", llmRoute(APIS_PROMPT, "json"));

export default app;
