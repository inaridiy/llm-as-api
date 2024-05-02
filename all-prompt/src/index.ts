import { Hono } from "hono";
import { cache } from "hono/cache";
import { llmRoute } from "./llmRoute";

const app = new Hono();

const TOP_PAGE_PROMPT = `Please return the top page of a simplest TODO application in HTML.
Please keep it as simple as possible and also allow editing of TODOs in Form.

You can write TODO from /api/todos is REST API in the following format
{ name: string, status: string }`;

app.get("/", cache({ cacheName: "Top page" }), llmRoute(TOP_PAGE_PROMPT, "html"));

const APIS_PROMPT = `As a REST backend API for a simple TODO app, return JSON as appropriate.
The TODO should be in the format { name: string, status: string }.`;

app.all("/api/*", llmRoute(APIS_PROMPT, "json"));

export default app;
