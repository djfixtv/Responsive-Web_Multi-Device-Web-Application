import * as dbManager from "./dbManager";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, `../.env`) });
dbManager.initialize();

const sleep = (time: number) => { return new Promise<void>(resolve => { setTimeout(() => { resolve(); }, time * 1000) }) }
(async () => {
  await sleep(1);
  const user: dbManager.PhanUser = await dbManager.createUser("JokerVRC", "iloveakechi420", false, "img/pfps/male/Joker.png");
  console.log(user);
})();