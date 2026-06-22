export interface Question {
  id: string;
  q: string;
  choices: (string | string[])[];
  choose: number;
}

export const questions: Question[] = [
  {
    id: "movie-genres",
    q: "You're at a movie theater. What are you there to see?",
    choices: [
      "An action movie.",
      "A comedy.",
      "A horror movie.",
      "An indie film.",
      "A drama.",
      "A documentary.",
      "An animated film.",
      "A foreign film.",
    ],
    choose: 4,
  },
  {
    id: "the-lights",
    q: "The lights suddenly go out. What do you do?",
    choices: [
      "You stay calm and wait for the lights to come back on.",
      "You try to find a flashlight or your phone's light.",
      "You call out to see if anyone else is around.",
      "You leave the area immediately.",
      "You get really scared and start panicking.",
    ],
    choose: 3,
  },
  {
    id: "last-slice",
    q: "You and a friend are sharing a pizza. There's one slice left. What do you do?",
    choices: [
      "You take the last slice without asking.",
      "You offer the last slice to your friend.",
      "You suggest splitting the last slice.",
      "You ask your friend if they want the last slice.",
      "You decide not to eat the last slice and leave it for later.",
    ],
    choose: 3,
  },
  {
    id: "morning",
    q: "Are you a morning person?",
    choices: [
      ["Yes.", "I love waking up early and starting my day!"],
      "No.",
      "Sometimes, it depends on the day.",
      ["Never ever.", "I am a vampire and sunlight is my mortal enemy."],
    ],
    choose: 4,
  },
  {
    id: "crush",
    q: "You want to reveal that you like someone but are afraid of rejection. What do you do?",
    choices: [
      "Show it a little bit, but not too much.",
      "Tell them directly how you feel.",
      "Drop hints and see if they catch on.",
      "Keep it to yourself and hope they figure it out.",
      "Ask a mutual friend to find out if they like you back.",
      "Make it obvious by...playing a prank!",
    ],
    choose: 4,
  },
  {
    id: "lost-wallet",
    q: "You find a lost wallet on the street. What do you do?",
    choices: [
      "Take the money and throw away the wallet.",
      "Leave it there, it's not your problem.",
      "Try to find the owner using any ID inside.",
      "Turn it in to the nearest police station.",
      "Post about it on social media to find the owner.",
    ],
    choose: 3,
  },
  {
    id: "sudden-interview",
    q: "You're on a stroll when a TV crew pounces on you for a sudden interview. What do you do?",
    choices: [
      "Answer their questions confidently.",
      "Politely decline and walk away.",
      "Make a joke to lighten the mood.",
      "Try to steer the conversation towards a topic you're comfortable with.",
      "Get flustered and give short, awkward answers.",
      "Run away! This is embarrassing!",
      "Yuck it up! Woo-hoo! I'm on TV!",
    ],
    choose: 4,
  },
  {
    id: "where-to-play",
    q: "Do you prefer to play outside or inside?",
    choices: [
      ["Outside.", "All my favorite games are outside!"],
      ["Inside.", "There is no anime outside."],
      "It depends on the weather.",
      ["I like both equally.", "I can watch anime both outside AND inside!"],
    ],
    choose: 4,
  },
  {
    id: "pool-party",
    q: "If your sandwich and your drink both got dropped into a pool, which would you save first?",
    choices: [
      "The sandwich.",
      "The drink.",
      "Ewwww, why would I want to save either?",
      "YURM, I'll grab both :3",
    ],
    choose: 4,
  },
  {
    id: "talent-show",
    q: "Your friends are hosting a talent show. What are you doing?",
    choices: [
      "Stand up comedy. Let's make everyone laugh!",
      "Sing my heart out!",
      "Do a magic trick. Abracadabra!",
      "Show off my dance moves!",
      "Perform a dramatic monologue.",
      "Display my artwork.",
      "I don't have a talent, but I'll cheer on everyone else!",
      "Um... I think I'll just watch...",
    ],
    choose: 4,
  },
  {
    id: "fork",
    q: "There's a fork in the road. Which path do you take?",
    choices: [
      "Up to the narrow and winding cliff.",
      "Towards the dark and spooky forest.",
      "Whatever my friends decide!",
      "I'll make my own path!",
      "Down the middle, where it's safe and well-traveled.",
    ],
    choose: 4,
  },
];
