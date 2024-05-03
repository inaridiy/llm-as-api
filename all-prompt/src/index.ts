import { Hono } from "hono";
import { llmRoute } from "./llmRoute";

const app = new Hono();

const TOP_PAGE_PROMPT = `Please return the top page of a simple TODO application in HTML.
This page must be able to view and manage and create TODOs.
Don't mock todos, Must fetch todos bia API.

You can access the Todo REST API from the path /api/todos. The Todo API returns JSON in the format
{ id: string, name: string, status: "pending" | "done" | "deleted" }`;

app.get("/", llmRoute(TOP_PAGE_PROMPT, "html"));

const APIS_PROMPT = `As a REST backend API for a simple TODO app, return JSON as appropriate.
The TODO should be in the format \`{ name: string, status: "pending" | "done" | "deleted" }\`.

Initial TODOs are as follows:
- { id: 1, name: "Buy milk", status: "pending" }
- { id: 2, name: "Call mom", status: "pending" }
- { id: 3, name: "Go to the gym", status: "done" }`;

app.all("/api/*", llmRoute(APIS_PROMPT, "json"));

export default app;
