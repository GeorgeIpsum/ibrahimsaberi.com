import { toastManager } from "@/components/atoms/toast";
import { passForward, pipe, sleep } from "@/utils/async";
import { clampedNumber, randomArrayMember, randomLessThan } from "@/utils/rand";
import { createAudio, playOnce } from "../audio/play";
import {
  type ErrorMessage,
  errorMessages,
  type FallbackSequence,
  fallbackSequences,
  type Subtask,
  type SuccessMessage,
  subtasks,
  successMessages,
} from "./status-text";
import { Subtask as SubtaskDisplay } from "./subtask";

const randomTimeRange = () => clampedNumber(1800, 3600);
const sleepRandom = () => sleep(randomTimeRange());

const TOAST_ID = "contact-form-subtask";
const SUBTASK_SUCCESS_CHANCE = 0.6;
const MIN_SUBTASKS = 3;
const MAX_SUBTASKS = 6;

type TaskData = {
  id: string;
  task: FallbackSequence;
  taskNumber: number;
  chosenSubtasks: Subtask[];
  excludedSubtasks: Subtask[];
  excludedResultMessages: (ErrorMessage | SuccessMessage)[];
  results: {
    subtask: Subtask;
    success?: boolean;
    resultMessage?: ErrorMessage | SuccessMessage;
  }[];
  finished?: boolean;
};

const initialSubmit = async () => {
  const id1 = "initial-submit";
  toastManager.add({
    id: id1,
    title: "Submitting...",
    description: "This'll take just a second.",
    type: "loading",
    timeout: 0,
  });

  await sleep(randomTimeRange() * 1.5);

  toastManager.update(id1, {
    title: "Hmm...",
    description: "This is taking longer than expected.",
  });

  await sleep(randomTimeRange() * 1.5);

  toastManager.update(id1, {
    title: "Submission Failed",
    description: "That's odd. Hold on a minute.",
    type: "error",
  });

  await Promise.all([
    sleep(randomTimeRange() / 2),
    playOnce("/api/audio/error"),
  ]);

  const id2 = "initial-submit-fallback";
  toastManager.add({
    id: id2,
    title: "Let's try again...",
    description: "Initializing fallback submission sequence...",
    type: "loading",
  });

  await sleepRandom();

  toastManager.update(id2, {
    title: "Let's try again...",
    description: "Fallback submission sequence initialized.",
    type: "success",
  });
};

const subTaskId = (data: Pick<TaskData, "id" | "taskNumber">) =>
  `${data.id}-${data.taskNumber}`;

const startSequence = async (data: TaskData) => {
  const { task, chosenSubtasks, finished } = data;
  if (finished) return data;

  toastManager.add({
    id: subTaskId(data),
    type: "loading",
    title: task,
    description: <SubtaskDisplay subtask="Booting" />,
    timeout: 0,
  });

  await sleep(randomTimeRange());

  toastManager.update(subTaskId(data), {
    description: (
      <SubtaskDisplay
        subtask="Booted"
        subtaskResult={`${chosenSubtasks.length} loaded.`}
        isSuccess={true}
      />
    ),
  });

  await sleep(randomTimeRange());

  toastManager.update(subTaskId(data), {
    description: <SubtaskDisplay subtask="Starting subtasks" />,
  });

  return data;
};

const doSubtask = async (data: TaskData): Promise<TaskData> => {
  const { chosenSubtasks, finished } = data;
  if (finished) return data;

  const subtask = chosenSubtasks.shift();
  if (!subtask) {
    throw new Error("No subtasks left to perform");
  }
  data.results.push({ subtask });

  // for every command into the nether we must send forth additional sacrifices
  toastManager.update(subTaskId(data), {
    type: "loading",
    description: <SubtaskDisplay subtask={subtask} />,
    timeout: 0,
  });

  return data;
};

const resolveSubtask = async (data: TaskData): Promise<TaskData> => {
  const { excludedResultMessages, finished, results } = data;
  if (finished) return data;

  const success = randomLessThan(SUBTASK_SUCCESS_CHANCE);
  const currentSubtask = results[results.length - 1].subtask;
  let resultMessage: ErrorMessage | SuccessMessage;
  // add random unordered status that hasn't already been chosen to chosenStatuses
  do {
    resultMessage = randomArrayMember(
      success ? successMessages : errorMessages,
    );
  } while (excludedResultMessages.includes(resultMessage));

  toastManager.update(subTaskId(data), {
    description: (
      <SubtaskDisplay
        subtask={currentSubtask}
        subtaskResult={resultMessage}
        isSuccess={success}
      />
    ),
    timeout: 0,
  });

  results[results.length - 1].success = success;
  results[results.length - 1].resultMessage = resultMessage;
  excludedResultMessages.push(resultMessage);

  return data;
};

const finalizeSubtask = async (data: TaskData) => {
  const { results, excludedResultMessages, task, taskNumber, finished } = data;
  if (finished) return data;

  toastManager.update(subTaskId(data), {
    description: <SubtaskDisplay subtask="Compressing results" />,
  });

  await sleep(2000);

  if (results.every((result) => result.success)) {
    let successMessage: SuccessMessage;
    do {
      successMessage = randomArrayMember(successMessages);
    } while (excludedResultMessages.includes(successMessage));

    toastManager.update(subTaskId(data), {
      type: "success",
      description: <SubtaskDisplay subtask={"Holy cow."} isSuccess={true} />,
      timeout: 0,
    });

    await sleep(2000);

    toastManager.add({
      id: "WE_DID_IT_REDDIT",
      type: "success",
      title: `Form Submitted?`,
      description: (
        <SubtaskDisplay
          subtask="Really? It really went through?"
          subtaskResult="We did it I suppose. Really, I did it. You didn't do anything."
          isSuccess
        />
      ),
      timeout: 0,
      // actionProps: {
      //   onClick: () => {
      //     toastManager.close("WE_DID_IT_REDDIT");
      //   },
      //   children: "Celebrate",
      // },
    });

    return { ...data, finished: true };
  }

  toastManager.update(subTaskId(data), {
    type: "error",
    title: `${task} - Failed`,
    description: (
      <SubtaskDisplay
        subtask={`Sequence ${taskNumber} failed... Loading next fallback sequence`}
        subtaskResult={`${results.length - results.filter((result) => result.success).length}/${results.length} commands failed`}
      />
    ),
    timeout: 0,
  });

  return data;
};

const subtaskPipe = (numChosenTasks: number) =>
  pipe<TaskData>(
    ...Array.from({ length: numChosenTasks }, () => [
      doSubtask,
      passForward<TaskData>(sleepRandom),
      resolveSubtask,
      passForward<TaskData>(sleepRandom),
    ]).flat(),
  );

// an "attempt"
export const attemptContactFormSubmission = async () => {
  const excludedSubtasks: Subtask[] = [];
  const audio = createAudio("/api/audio/elevator", {
    autoplay: false,
    loop: true,
    volume: 0,
    html5: true,
  });

  const taskPipe = pipe<TaskData>(
    passForward(initialSubmit),
    passForward(() => {
      audio.load().stop().play();
      audio.fade(0, 1, 10000);
    }),
    passForward(sleepRandom),
    ...fallbackSequences.flatMap((task, index) => {
      const chosenSubtasks = Array.from(
        { length: clampedNumber(MIN_SUBTASKS, MAX_SUBTASKS) },
        () => {
          let subtask: Subtask;
          let attempt = 0;
          do {
            subtask = randomArrayMember(subtasks);
            attempt++;
          } while (excludedSubtasks.includes(subtask) && attempt < 10);

          if (excludedSubtasks.includes(subtask)) {
            subtask = `${randomArrayMember(subtasks)} (again)` as Subtask;
            console.log("WAOW", subtask);
          }

          excludedSubtasks.push(subtask);

          return subtask;
        },
      );

      return [
        (data: TaskData) =>
          startSequence({
            ...data,
            task,
            taskNumber: index + 1,
            results: [],
            excludedResultMessages: [],
            chosenSubtasks,
          }),
        passForward<TaskData>(sleepRandom),
        subtaskPipe(chosenSubtasks.length),
        finalizeSubtask,
        async (data: TaskData) => {
          if (data.finished) {
            audio.fade(1, 0, 5000);
            audio.once("fade", () => {
              audio.stop().unload();
            });
          }
          return data;
        },
        passForward<TaskData>(sleepRandom),
      ];
    }),
  );

  await taskPipe({
    id: TOAST_ID,
    task: "Attempting manual submission",
    taskNumber: 1,
    chosenSubtasks: [],
    excludedSubtasks,
    excludedResultMessages: [],
    results: [],
  });
};
