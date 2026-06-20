interface Question {
  id: string;
  q: string;
  answers: string[];
  choose: number;
}

export const questions: Question[] = [
  {
    id: "movie-genres",
    q: "You're at a movie theater. What are you there to see?",
    answers: [
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
    answers: [
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
    answers: [
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
    answers: [
      "Yes.",
      "No.",
      "Sometimes, it depends on the day.",
      "Never ever.",
    ],
    choose: 4,
  },
  {
    id: "crush",
    q: "You want to reveal that you like someone but are afraid of rejection. What do you do?",
    answers: [
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
    answers: [
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
    answers: [
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
    answers: [
      "Outside.",
      "Inside.",
      "It depends on the weather.",
      "I like both equally.",
    ],
    choose: 4,
  },
];
