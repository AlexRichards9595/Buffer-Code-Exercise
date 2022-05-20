import { URL } from "url";
import { Low, JSONFileSync } from "lowdb";
import lodash from "lodash";

// Set up database
const pathToDb = new URL("../database/db.json", import.meta.url).pathname;
const adapter = new JSONFileSync(pathToDb);
const db = new Low(adapter);
await db.read();
await db.write();

// Add lodash to the lowdb database
db.lodash = lodash.chain(db.data);

// ---

const getUpdates = () => {
    return db.lodash
        .get("updates")
        .value();
}
const getUpdateIds = (updates) => {
   return updates
       .map((update) => update.service_update_id)
       .join();
}

const getAnalytics = async (ids) => {
    return await fetch(`https://code-exercise-api.buffer.com/getTweets?ids=${ids}`)
        .then((analytics) => {
            return analytics.json();
        }).catch((err) => console.log(err));
}

const mapAnalyticsResponseToUpdates = (updates, responses) => {
    return updates.map((update) => {
        const response = responses.find((response)  => response.id === update.service_update_id)
        return {
            update_id: update.id,
            retweets: response.retweet_count,
            favorites: response.favorite_count,
            clicks: response.click_count,
        }
    })
}

const updateAnalyticsWithMappedResponse = async (mappedResponses) => {
    const updatedAnalytics = db.lodash
        .get("updates-analytics")
        .map((analysis) => {
            const response = mappedResponses.find((response) => response.update_id === analysis.update_id)
            return {
                ...analysis,
                retweets: response.retweets,
                favorites: response.favorites,
                clicks: response.clicks
            }
        });
    db.data = {...db.data, "updates-analytics": updatedAnalytics}
    await db.write();
}

const updateAnalyticsData = async() => {
    const updates = getUpdates();
    const ids = getUpdateIds(updates);
    const analytics = await getAnalytics(ids);
    const mappedUpdateAnalytics = mapAnalyticsResponseToUpdates(updates, analytics);
    await updateAnalyticsWithMappedResponse(mappedUpdateAnalytics);
}

await updateAnalyticsData();
