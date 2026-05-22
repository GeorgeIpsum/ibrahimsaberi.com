export interface Placeholder {
  name: string;
  email: string;
  text: string;
}

export const placeholders: Placeholder[] = [
  {
    name: "John Cena",
    email: "john.cena@gmail.com",
    text: "Can you see this message? I hope not.",
  },
  {
    name: "Ibrahim Saberi",
    email: "georgeipsum@gmail.com",
    text: "This is meta or something",
  },
  {
    name: "Jane Doe",
    email: "convent.leader@salem.org",
    text: "I have some concerns about the local non-witch population.",
  },
  {
    name: "Sonic the Hedgehog",
    email: "gottagofast@sega.com",
    text: "wow! this website is so fast! just like me!",
  },
  {
    name: "Eye Boy",
    email: `eyeboy${new Date().getFullYear() + 1}@yahoo.com`,
    text: "I see all. You have no plans to make me.",
  },
  {
    name: "Blue Oak",
    email: "redsuxx@kantoleague.org",
    text: "I HATE shorts. They are the worst. I will never wear them. They are the absolute worst. I can't even believe people wear them. They are just... ugh. Shorts are the worst thing to ever happen to fashion. I don't care if it's hot outside, I will not wear shorts. They are the absolute worst. I would rather wear a winter coat in the middle of summer than wear shorts. Shorts are just... no. Just no.",
  },
  {
    name: "Aerith Gainsborough",
    email: "flowers4sale@sector5.net",
    text: "hey i have ur peonies they r 20% off :)",
  },
  {
    name: "Hamlet, Prince of Denmark",
    email: "yorick_holder@sfp.dk",
    text: "smth is rly messed up and rotten and vile in denmark bro. ples send help",
  },
  {
    name: "Tony Soprano",
    email: "gabagool@netscape.com",
    text: "I got a job for ya. It's a little... delicate.",
  },
  {
    name: "Donald Duck",
    email: "donald.duck@disney.com",
    text: "Wak wak — aw, fffwhoephwy! Whffk-who pwut dthhis rwight hwere?! Iyy owwta — OOOH! Ewwy thwime! Ewwy thwingle thwime Iyy thry dtho — WAK! Dthat dwoethit! Dthat — dwoeth — IDTH!",
  },
  {
    name: "John Jurasek",
    email: "vorwinfo@gmail.com",
    text: `Taking a look at this website. Let's see if it has that "wow" factor.`,
  },
  // hmmm this one could cause problems in my life
  // {
  //   name: "Benjamin Netanyahu",
  //   email: "i.enjoy.eating.children@aol.com"
  //   text: "kill yourself"
  // }
];
