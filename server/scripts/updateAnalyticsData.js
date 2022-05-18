import { URL } from "url";
import { Low, JSONFileSync } from "lowdb";
import lodash from "lodash";

// Set up database
const pathToDb = new URL("../database/db.json", import.meta.url).pathname;
const adapter = new JSONFileSync(pathToDb);
const db = new Low(adapter);
await db.read();

// Add lodash to the lowdb database
db.lodash = lodash.chain(db.data);

// ---
