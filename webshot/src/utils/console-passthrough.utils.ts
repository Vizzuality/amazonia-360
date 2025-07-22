import { ConsoleMessage } from "playwright";
import { inspect } from "util";

export const consolePassthrough = (msg: ConsoleMessage) => {
  for (let i = 0; i < msg.args().length; ++i) {
    msg
      .args()
      [i].jsonValue()
      .then((value) => console.debug(inspect(value, undefined, 5)))
      .catch((err) => console.debug(`Failed to get value: ${err}`));
  }
};
