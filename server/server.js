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
  const loaded = parseInt(req.query.loaded)
  const updates = db.lodash
    .get("updates")
    .orderBy("sent_at", "desc")
    .slice(loaded, (loaded + 10))
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

app.get(`/api/getAnalyticsTimeseries`, (req, res) => {
  const updateAnalytics = db.lodash
      .get("updates")
      .map((update) => {
        return {
          created_at: update.created_at,
          day: new Date(new Date(update.created_at*1000).toISOString().split("T")[0]).getTime(),
          ...db.lodash
              .get("updates-analytics")
              .find((x) => x.update_id === update.id)
              .value()
        }
        }).value();

    const aggregates = updateAnalytics.reduce((aggregateArray, update) => {
        const aggregatedDay = aggregateArray.find((a) => a.day === update.day);

        if(aggregatedDay)
            aggregateArray[aggregatedDay] = {
                timestamp: update.day/1000,
                retweets: update.retweets + aggregatedDay.retweets,
                favorites: update.favorites + aggregatedDay.favorites,
                clicks: update.clicks + aggregatedDay.clicks,
            }
        else {
                aggregateArray.push(
                    {
                        timestamp: update.day/1000,
                        retweets: update.retweets,
                        favorites: update.favorites,
                        clicks: update.clicks,
                    })
            }
        return aggregateArray;
    }, [])

  res.json(aggregates);
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
