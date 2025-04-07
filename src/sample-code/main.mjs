import {getDateTime} from "./date.mjs";
import {logDate} from "./log-date.mjs";

const main = () => {
  const date = getDateTime();
  logDate(date);
};

main();