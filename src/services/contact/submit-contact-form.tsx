import { toastManager } from "@/components/atoms/toast";
import { passForward, pipe, sleep } from "@/utils/async";
import {
  clampedNumber,
  coinFlip,
  randomArrayMember,
  randomLessThan,
} from "@/utils/rand";
import { StatusDescription } from "./status-description";
import {
  errorMessages,
  ordered,
  successMessages,
  unordered,
} from "./status-text";

const randomTimeRange = () => clampedNumber(1800, 3600);
const sleepRandom = () => sleep(randomTimeRange());

type UpdateData = {
  id: string;
  message: string;
  chosenMessages: string[];
  chosenStatuses: string[];
  results: boolean[];
  attempt: number;
  finished?: boolean;
};

const addStatus = async (data: UpdateData) => {
  const { id, attempt, message } = data;
  toastManager.add({
    id: `${id}-${attempt}`,
    type: "loading",
    title: message,
    description: <StatusDescription message="Booting" />,
    timeout: 0,
  });

  await sleep(randomTimeRange() / 2);

  toastManager.update(`${id}-${attempt}`, {
    description: <StatusDescription message="Booted" isSuccess={true} />,
    timeout: 0,
  });

  return data;
};

const updateStatus = async (data: UpdateData) => {
  const { chosenMessages = [], id, attempt } = data;

  let choice: string;
  // add random unordered message that hasn't already been chosen to chosenUnordered
  do {
    choice = randomArrayMember(unordered);
  } while (chosenMessages.includes(choice));

  // for every command into the nether we must send forth additional sacrifices
  toastManager.update(`${id}-${attempt}`, {
    type: "loading",
    description: <StatusDescription message={choice} />,
    timeout: 0,
  });

  return { ...data, chosenMessages: [...chosenMessages, choice] };
};

const SUCCESS_CHANCE = 0.5;
const resolveStatusResult = async (data: UpdateData) => {
  const success = randomLessThan(SUCCESS_CHANCE);

  const { id, attempt, chosenMessages, chosenStatuses } = data;

  const chosenMessage = chosenMessages[chosenMessages.length - 1];
  let status: string;
  // add random unordered status that hasn't already been chosen to chosenStatuses
  do {
    status = randomArrayMember(success ? successMessages : errorMessages);
  } while (chosenStatuses.includes(status));

  toastManager.update(`${id}-${attempt}`, {
    description: (
      <StatusDescription
        message={chosenMessage}
        isSuccess={success}
        status={status}
      />
    ),
    timeout: 0,
  });

  return {
    ...data,
    results: [...(data.results ?? []), success],
    chosenStatuses: [...chosenStatuses, status],
  };
};

const finalizeStatusResult = async (data: UpdateData) => {
  const { results, id, attempt, chosenMessages, message } = data;

  toastManager.update(`${id}-${attempt}`, {
    description: <StatusDescription message="Compressing results" />,
  });

  await sleep(2000);

  if (results.every(Boolean)) {
    let choice: string;

    do {
      choice = randomArrayMember(successMessages);
    } while (chosenMessages.includes(choice));

    toastManager.update(`${id}-${attempt}`, {
      type: "success",
      description: <StatusDescription message={"Holy cow."} isSuccess={true} />,
      timeout: 3000,
    });

    await sleep(1500);

    toastManager.add({
      type: "success",
      title: `Wow. We really sent it. Or really, I sent it. You didn't actually do anything.`,
      description: choice,
      timeout: 5000,
    });
    return { ...data, finished: true };
  }

  toastManager.update(`${id}-${attempt}`, {
    type: "error",
    title: `${message} ❌`,
    description: (
      <StatusDescription
        message={`Sequence ${attempt} failed... Loading next fallback sequence...`}
        status={`${results.length - results.filter(Boolean).length}/${results.length} commands failed`}
      />
    ),
    timeout: 0,
  });

  if (attempt > 5) {
    toastManager.close(`${id}-${attempt - 5}`);
  }

  return data;
};

const pipeStatusUpdates = (data: UpdateData) =>
  pipe<UpdateData>(
    data,
    passForward(sleepRandom),
    updateStatus,
    passForward(sleepRandom),
    resolveStatusResult,
  );

// "attempt"
export const attemptContactFormSubmission = async (placeholder?: {
  name: string;
}) => {
  const id = "status-update";
  try {
    await toastManager.promise(
      new Promise((_, reject) => setTimeout(reject, randomTimeRange())),
      {
        loading: {
          title: `Submitting...`,
          description: "This'll just take a second.",
        },
        success: {
          title: "Submitted!",
          description: "Sike. You can't actually get here.",
        },
        error: {
          title: "Submission Failed",
          description: "That's odd. Hold on a minute.",
          timeout: 12000,
        },
      },
    );
  } catch {}

  await sleep(randomTimeRange() / 2);

  // it beginneth.
  await toastManager.promise(
    new Promise((resolve) => setTimeout(resolve, randomTimeRange())),
    {
      loading: {
        title: `Let's try again...`,
        description: `Initializing fallback submission sequence...`,
      },
      success: {
        title: `Let's try again...`,
        description: `Fallback submission sequence initialized.`,
        timeout: 12000,
      },
      error: "",
    },
  );

  await sleep(randomTimeRange() / 2);

  let chosenMessages: string[] = [];

  for (const [index, message] of Object.entries(ordered)) {
    const attempt = parseInt(index, 10) + 1;
    const results: boolean[] = [];

    try {
      const randomUnorderedAmount = clampedNumber(4, 8);

      let pipeResult: UpdateData = {
        id,
        message,
        chosenMessages,
        chosenStatuses: [],
        results,
        attempt,
      };

      pipeResult = await pipe(
        pipeResult,
        addStatus,
        passForward(() => sleep(randomTimeRange() / 2)),
        ...Array(randomUnorderedAmount).fill(pipeStatusUpdates),
        passForward(sleepRandom),
        finalizeStatusResult,
        passForward(sleepRandom),
      );

      chosenMessages = pipeResult.chosenMessages;

      if (pipeResult.finished) {
        return;
      }
    } catch {
      // THE SPICE MUST FLOW
    }

    if (message === "Attempting candlelit vigil") {
      try {
        await toastManager.promise(
          new Promise<void>((resolve, reject) =>
            setTimeout(coinFlip() ? resolve : reject, randomTimeRange()),
          ),
          {
            loading: `Invoking the name of ${placeholder?.name}...`,
            success: `Phew, that was close. Wait oh God what is that`,
            error: `Uh oh. What is that.`,
          },
        );

        await sleep(randomTimeRange() / 2);
      } catch {
        // careful now...
      }

      try {
        await toastManager.promise(
          new Promise((_, reject) =>
            setTimeout(() => reject(), randomTimeRange()),
          ),
          {
            loading: `HOLD ON I CAN FIX THIS I THINK... SERIOUSLY DONT PANIC...`,
            success: `lol u wish`,
            error: `RUN. RUN NOW. YOU NEED TO GET OUT NOW.`,
          },
        );

        await sleep(randomTimeRange() / 2);
      } catch {
        // well... we fucked up
      }
    }
  }
};
