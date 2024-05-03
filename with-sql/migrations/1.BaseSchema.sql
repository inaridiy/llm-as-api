CREATE TABLE todos (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL
);
INSERT INTO todos (id, name, status) VALUES (1, "Buy milk", "pending");
INSERT INTO todos (id, name, status) VALUES (2, "Call mom", "pending");
INSERT INTO todos (id, name, status) VALUES (3, "Go to the gym", "done");