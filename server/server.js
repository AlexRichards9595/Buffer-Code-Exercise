import express from "express";
import serveStatic from "serve-static";
import morgan from "morgan";
import path from "path";
import { URL } from "url";

import { Low, JSONFileSync } from "lowdb";
import lodash from "lodash";

import {
  getDayStartFromUnixTimestamp,
  getTimestampSeriesArray,
} from "./lib/dates.js";
import * as url from "url";

const app = express();
const PORT = 8080;

// Set up database
const pathToDb = new URL("./database/db.json", import.meta.url).pathname;
const adapter = new JSONFileSync(pathToDb);
const db = new Low(adapter);
await db.read();

// Add lodash to the lowdb database
db.lodash = lodash.chain(db.data);

// Logger
app.use(morgan("dev"));

// Disable caching for API endpoints
app.use("/api", (req, res, next) => {
  res.header("Cache-Control", "no-cache");
  next();
});

app.get(`/api/getUpdates`, (req, res) => {
  const length = parseInt(req.query.length)
  const updates = db.lodash
    .get("updates")
    .orderBy("sent_at", "desc")
    .slice(length, (length + 10))
    .map((update) => {
      return {
        ...update,
        analytics: db.lodash
          .get("updates-analytics")
          .find((x) => x.update_id === update.id)
          .value()
      }
    })
    .value();

  res.json(updates);
});

// Serve static assets in the /public directory
const pathToStatic = new URL("../public", import.meta.url).pathname;
app.use(
  serveStatic(pathToStatic, {
    cacheControl: "no-cache",
  })
);

app.use((err, req, res, next) => {
  // Handle missing file in public dir as a 404
  if (err.code === "ENOENT") {
    return res.status(404).send("404 - Page not found");
  }
  console.log(err);
  res.status(500).send(err);
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
