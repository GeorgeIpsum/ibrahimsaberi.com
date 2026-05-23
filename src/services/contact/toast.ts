import { toastManager } from "@/components/atoms/toast";
import { ordered, unordered } from "./strings";

const randNum = (min = 1000, max = 5000) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const attemptContactFormSubmission = async (placeholder?: {
  name: string;
}) => {
  try {
    await toastManager.promise(
      new Promise((_, reject) => setTimeout(reject, randNum(1000, 3000))),
      {
        error: `Submitting - FAILED`,
        loading: `Submitting...`,
        success: `Submitting - SUCCESS?`,
      },
    );
  } catch {
    // it beginneth.
  }

  /////////////////////////////////////////////
  //       BEHOLD,                          //
  //       STUPIDITY                       //
  //////////////////////////////////////////

  const alreadyChosenUndordered: string[] = [];
  for (const message of ordered) {
    try {
      await toastManager.promise(
        new Promise((resolve) => setTimeout(resolve, randNum(2000, 6000))),
        {
          error: `${message} - FAILED`,
          loading: `${message}...`,
          success: `${message} - SUCCESS?`,
        },
      );
    } catch {
      // THE SPICE MUST FLOW
    }

    if (message === "Lighting candles in a dark room") {
      try {
        await toastManager.promise(
          new Promise((_, reject) => setTimeout(reject, randNum(2000, 4000))),
          {
            error: `Uh oh. What is that.`,
            loading: `Invoking the name of ${placeholder?.name}...`,
            success: `Phew, that was close. Wait oh God what is that`,
          },
        );
      } catch {
        // careful now...
      }

      try {
        await toastManager.promise(
          new Promise((_, reject) => setTimeout(reject, randNum(2000, 4000))),
          {
            error: `RUN. RUN NOW. YOU NEED TO GET OUT NOW.`,
            loading: `HOLD ON I CAN FIX THIS I THINK...`,
            success: `>:)`,
          },
        );
      } catch {
        // well... we fucked up
      }
    }

    if (message === ordered[ordered.length - 1]) {
      await toastManager.promise(
        new Promise((_, reject) => setTimeout(reject, randNum(2000, 6000))),
        {
          error: `Welp. Something went wrong. Maybe try again later?`,
          loading: `Finishing up...`,
          success: `You'll never get this. Never ever ever ever.`,
        },
      );
      return;
    }

    // for every command into the nether we must send forth additional sacrifices
    const randomUnorderedAmount = randNum(1, 4);
    const chosenUnordered: string[] = [];
    for (let i = 0; i < randomUnorderedAmount; i++) {
      let choice: string;
      // add random unordered message that hasn't already been chosen to chosenUnordered
      do {
        choice = unordered[Math.floor(Math.random() * unordered.length)];
      } while (
        alreadyChosenUndordered.includes(choice) ||
        chosenUnordered.includes(choice)
      );
      chosenUnordered.push(choice);
      alreadyChosenUndordered.push(choice);
    }

    for (const unorderedMessage of chosenUnordered) {
      try {
        await toastManager.promise(
          new Promise((resolve, reject) =>
            setTimeout(
              Math.random() > 0.3 ? reject : resolve,
              randNum(3000, 6000),
            ),
          ),
          {
            error: `${unorderedMessage} - FAILED`,
            loading: `${unorderedMessage}...`,
            success: `${unorderedMessage} - SUCCESS?`,
          },
        );
      } catch {
        // this is what a whisper sounds like when it screams
      }
    }
  }
};
