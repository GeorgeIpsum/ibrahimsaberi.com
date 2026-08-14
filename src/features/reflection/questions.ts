import {
  ArrowUpDown,
  Baby,
  BookHeart,
  BookX,
  Bus,
  CalendarDays,
  Candy,
  Clapperboard,
  CloudRain,
  Coffee,
  Compass,
  Crown,
  Dices,
  DoorClosed,
  Ear,
  Egg,
  Eraser,
  Flame,
  FlameKindling,
  FlaskConical,
  Flower2,
  Footprints,
  Frown,
  Gamepad2,
  Ghost,
  Heart,
  HeartCrack,
  HeartHandshake,
  History,
  Image,
  Lightbulb,
  LightbulbOff,
  ListMusic,
  Lock,
  type LucideIcon,
  Mail,
  MapPin,
  Mic,
  Moon,
  Paintbrush,
  PartyPopper,
  PhoneMissed,
  Pizza,
  Scissors,
  Smile,
  Speech,
  Split,
  Star,
  Sunrise,
  TriangleAlert,
  Trophy,
  Users,
  UtensilsCrossed,
  Wallet,
  WandSparkles,
  Waves,
  Zap,
} from "lucide-react";

type Carving =
  | "hardy"
  | "lonely"
  | "adamant"
  | "naughty"
  | "brave"
  | "bold"
  | "docile"
  | "impish"
  | "lax"
  | "relaxed"
  | "modest"
  | "mild"
  | "bashful"
  | "rash"
  | "quiet"
  | "calm"
  | "gentle"
  | "careful"
  | "quirky"
  | "sassy"
  | "timid"
  | "hasty"
  | "jolly"
  | "naive"
  | "serious";

// 25 unique pastels generated in OKLCH (uniform lightness/chroma so they all
// carry the same visual weight on the dark background). Hues are grouped by
// the nature's raised stat, so related temperaments share a color family:
// attack pinks/corals, defense golds, sp.def greens/teals, speed blues,
// sp.atk violets/magentas — with each family's neutral nature at its center.
export const carvingColor: Record<Carving, string> = {
  // attack — pinks into coral
  lonely: "#FEB4C9",
  adamant: "#FFCED2",
  hardy: "#FCC4BF",
  naughty: "#FED1C3",
  brave: "#FDBB98",
  // defense — apricot into olive gold
  bold: "#FEBC84",
  impish: "#F9D6AA",
  docile: "#F0D08F",
  lax: "#E9DDA8",
  relaxed: "#D1D27F",
  // sp. def — spring greens into teal
  calm: "#B4DB92",
  gentle: "#C2E9BF",
  quirky: "#A4E6BB",
  careful: "#B0ECD3",
  sassy: "#77E3CD",
  // speed — cyan into periwinkle
  timid: "#6EE0EE",
  hasty: "#A8E8FB",
  serious: "#A1DEFC",
  jolly: "#BDE2FE",
  naive: "#ABCFFD",
  // sp. atk — lavender into magenta
  modest: "#CCC4FD",
  mild: "#E4D3FE",
  bashful: "#EBC3FD",
  quiet: "#F6CDF5",
  rash: "#FAB1E3",
};

interface Choice {
  text: string[];
  c: Carving[];
}
export interface Question {
  id: string;
  Icon: LucideIcon;
  q: string;
  choices: Choice[];
  choose: number;
}

export const questions: Question[] = [
  {
    id: "movie-genres",
    Icon: Clapperboard,
    q: "You're at a movie theater. What are you there to see?",
    choices: [
      { text: ["An action movie."], c: ["relaxed", "brave", "naive"] },
      { text: ["A comedy."], c: ["sassy", "bashful", "hardy"] },
      { text: ["A horror movie."], c: ["timid", "brave", "lonely"] },
      { text: ["An indie film."], c: ["quirky", "adamant", "relaxed"] },
      { text: ["A drama."], c: ["serious", "naughty", "hardy"] },
      { text: ["A documentary."], c: ["serious", "mild", "brave"] },
      { text: ["An animated film."], c: ["jolly", "hasty", "adamant"] },
      { text: ["A foreign film."], c: ["serious", "rash", "lonely"] },
    ],
    choose: 4,
  },
  {
    id: "the-lights",
    Icon: LightbulbOff,
    q: "The lights suddenly go out. What do you do?",
    choices: [
      {
        text: ["You stay calm and wait for the lights to come back on."],
        c: ["calm", "relaxed", "hardy"],
      },
      {
        text: ["You try to find a flashlight or your phone's light."],
        c: ["naughty", "mild", "hardy"],
      },
      {
        text: ["You call out to see if anyone else is around."],
        c: ["bold", "naughty", "naive"],
      },
      {
        text: ["You leave the area immediately."],
        c: ["hasty", "hardy", "brave"],
      },
      {
        text: ["You get really scared and start panicking."],
        c: ["timid", "bashful", "rash"],
      },
    ],
    choose: 3,
  },
  {
    id: "last-slice",
    Icon: Pizza,
    q: "You and a friend are sharing a pizza. There's one slice left. What do you do?",
    choices: [
      {
        text: ["You take the last slice without asking."],
        c: ["bold", "naughty", "rash"],
      },
      {
        text: ["You offer the last slice to your friend."],
        c: ["gentle", "hasty", "bashful"],
      },
      {
        text: ["You suggest splitting the last slice."],
        c: ["calm", "hardy", "mild"],
      },
      {
        text: ["You ask your friend if they want the last slice."],
        c: ["docile", "naughty", "bashful"],
      },
      {
        text: ["You decide not to eat the last slice and leave it for later."],
        c: ["adamant", "quiet", "rash"],
      },
    ],
    choose: 3,
  },
  {
    id: "morning",
    Icon: Sunrise,
    q: "Are you a morning person?",
    choices: [
      {
        text: ["Yes.", "I love waking up early and starting my day!"],
        c: ["jolly", "hasty", "naive"],
      },
      { text: ["No."], c: ["lax", "quiet", "relaxed"] },
      {
        text: ["Sometimes, it depends on the day."],
        c: ["mild", "hasty", "naughty"],
      },
      {
        text: [
          "Never ever.",
          "I am a vampire and sunlight is my mortal enemy.",
        ],
        c: ["lonely", "sassy", "relaxed"],
      },
    ],
    choose: 4,
  },
  {
    id: "crush",
    Icon: Heart,
    q: "You want to reveal that you like someone but are afraid of rejection. What do you do?",
    choices: [
      {
        text: ["Show it a little bit, but not too much."],
        c: ["bashful", "naughty", "mild"],
      },
      {
        text: ["Tell them directly how you feel."],
        c: ["bold", "brave", "adamant"],
      },
      {
        text: ["Drop hints and see if they catch on."],
        c: ["impish", "sassy", "hasty"],
      },
      {
        text: ["Keep it to yourself and hope they figure it out."],
        c: ["quiet", "bashful", "lonely"],
      },
      {
        text: ["Ask a mutual friend to find out if they like you back."],
        c: ["timid", "hardy", "lonely"],
      },
      {
        text: ["Make it obvious by...playing a prank!"],
        c: ["naughty", "hasty", "rash"],
      },
    ],
    choose: 4,
  },
  {
    id: "lost-wallet",
    Icon: Wallet,
    q: "You find a lost wallet on the street. What do you do?",
    choices: [
      {
        text: ["Take the money and throw away the wallet."],
        c: ["naughty", "rash", "bashful"],
      },
      {
        text: ["Leave it there, it's not your problem."],
        c: ["lax", "lonely", "relaxed"],
      },
      {
        text: ["Try to find the owner using any ID inside."],
        c: ["gentle", "hardy", "bashful"],
      },
      {
        text: ["Turn it in to the nearest police station."],
        c: ["serious", "hardy", "docile"],
      },
      {
        text: ["Post about it on social media to find the owner."],
        c: ["bold", "hasty", "bashful"],
      },
    ],
    choose: 3,
  },
  {
    id: "sudden-interview",
    Icon: Mic,
    q: "You're on a stroll when a TV crew pounces on you for a sudden interview. What do you do?",
    choices: [
      {
        text: ["Answer their questions confidently."],
        c: ["bold", "brave", "adamant"],
      },
      {
        text: ["Politely decline and walk away."],
        c: ["calm", "relaxed", "hardy"],
      },
      {
        text: ["Make a joke to lighten the mood."],
        c: ["sassy", "naughty", "rash"],
      },
      {
        text: [
          "Try to steer the conversation towards a topic you're comfortable with.",
        ],
        c: ["hardy", "quiet", "mild"],
      },
      {
        text: ["Get flustered and give short, awkward answers."],
        c: ["bashful", "timid", "quiet"],
      },
      {
        text: ["Run away! This is embarrassing!"],
        c: ["timid", "hasty", "naive"],
      },
      {
        text: ["Yuck it up! Woo-hoo! I'm on TV!"],
        c: ["jolly", "rash", "naughty"],
      },
    ],
    choose: 4,
  },
  {
    id: "where-to-play",
    Icon: Gamepad2,
    q: "Do you prefer to play outside or inside?",
    choices: [
      {
        text: ["Outside.", "All my favorite games are outside!"],
        c: ["jolly", "brave", "hasty"],
      },
      {
        text: ["Inside.", "There is no anime outside."],
        c: ["quiet", "rash", "lonely"],
      },
      {
        text: ["It depends on the weather."],
        c: ["careful", "mild", "docile"],
      },
      {
        text: [
          "I like both equally.",
          "I can watch anime both outside AND inside!",
        ],
        c: ["quirky", "rash", "relaxed"],
      },
    ],
    choose: 4,
  },
  {
    id: "pool-party",
    Icon: Waves,
    q: "If your sandwich and your drink both got dropped into a pool, which would you save first?",
    choices: [
      { text: ["The sandwich."], c: ["hardy", "hasty", "lonely"] },
      { text: ["The drink."], c: ["relaxed", "lax", "mild"] },
      {
        text: ["Ewwww, why would I want to save either?"],
        c: ["sassy", "hardy", "lonely"],
      },
      { text: ["YURM, I'll grab both :3"], c: ["jolly", "rash", "naughty"] },
    ],
    choose: 4,
  },
  {
    id: "talent-show",
    Icon: Star,
    q: "Your friends are hosting a talent show. What are you doing?",
    choices: [
      {
        text: ["Stand up comedy. Let's make everyone laugh!"],
        c: ["sassy", "lonely", "hasty"],
      },
      { text: ["Sing my heart out!"], c: ["bold", "brave", "mild"] },
      {
        text: ["Do a magic trick. Abracadabra!"],
        c: ["quirky", "hasty", "naughty"],
      },
      { text: ["Show off my dance moves!"], c: ["bold", "hasty", "naughty"] },
      {
        text: ["Perform a dramatic monologue."],
        c: ["serious", "adamant", "quiet"],
      },
      { text: ["Display my artwork."], c: ["modest", "quiet", "hasty"] },
      {
        text: ["I don't have a talent, but I'll cheer on everyone else!"],
        c: ["gentle", "docile", "hasty"],
      },
      {
        text: ["Um... I think I'll just watch..."],
        c: ["bashful", "timid", "quiet"],
      },
    ],
    choose: 4,
  },
  {
    id: "fork",
    Icon: Split,
    q: "There's a fork in the road. Which path do you take?",
    choices: [
      {
        text: ["Up to the narrow and winding cliff."],
        c: ["brave", "hardy", "adamant"],
      },
      {
        text: ["Towards the dark and spooky forest."],
        c: ["bold", "rash", "timid"],
      },
      {
        text: ["Whatever my friends decide!"],
        c: ["docile", "naughty", "relaxed"],
      },
      { text: ["I'll make my own path!"], c: ["adamant", "hardy", "brave"] },
      {
        text: ["Down the middle, where it's safe and well-traveled."],
        c: ["careful", "adamant", "mild"],
      },
    ],
    choose: 4,
  },
  {
    id: "mysterious-egg",
    Icon: Egg,
    q: "You find a mysterious egg sitting in the middle of a path. What do you do?",
    choices: [
      {
        text: ["Take it home and care for it immediately."],
        c: ["gentle", "hasty", "naive"],
      },
      {
        text: ["Look around for whoever lost it."],
        c: ["careful", "rash", "docile"],
      },
      {
        text: ["Poke it gently. For science."],
        c: ["quirky", "mild", "naive"],
      },
      {
        text: ["Leave it alone. This is how curses start."],
        c: ["careful", "timid", "hardy"],
      },
      {
        text: ["Call your friends over to investigate."],
        c: ["bold", "rash", "naughty"],
      },
      {
        text: ["Build it a tiny nest and wish it luck."],
        c: ["gentle", "relaxed", "mild"],
      },
    ],
    choose: 4,
  },
  {
    id: "group-project",
    Icon: Users,
    q: "You're assigned a group project. What role do you naturally take?",
    choices: [
      {
        text: ["The leader who organizes everything."],
        c: ["adamant", "hardy", "naive"],
      },
      {
        text: ["The idea person with big, weird plans."],
        c: ["quirky", "rash", "naive"],
      },
      {
        text: ["The quiet worker who gets things done."],
        c: ["quiet", "hardy", "lonely"],
      },
      {
        text: ["The presenter who makes it sound good."],
        c: ["bold", "sassy", "adamant"],
      },
      {
        text: ["The emotional support teammate."],
        c: ["gentle", "docile", "mild"],
      },
      {
        text: [
          "The person who somehow starts decorating the slides with frogs.",
        ],
        c: ["impish", "hasty", "naughty"],
      },
    ],
    choose: 4,
  },
  {
    id: "rainy-day",
    Icon: CloudRain,
    q: "It starts raining right as you were about to go out. What do you do?",
    choices: [
      {
        text: ["Go anyway. A little rain won't stop me."],
        c: ["hardy", "brave", "adamant"],
      },
      {
        text: ["Grab an umbrella and continue as planned."],
        c: ["careful", "hardy", "mild"],
      },
      { text: ["Stay inside and get cozy."], c: ["relaxed", "lax", "quiet"] },
      {
        text: ["Run dramatically through the rain like you're in a movie."],
        c: ["bold", "rash", "adamant"],
      },
      {
        text: ["Cancel everything. The sky has spoken."],
        c: ["lax", "timid", "naughty"],
      },
      {
        text: ["Try to catch raindrops in your mouth."],
        c: ["jolly", "naive", "impish"],
      },
    ],
    choose: 4,
  },
  {
    id: "strange-button",
    Icon: TriangleAlert,
    q: "There's a big red button with a sign that says DO NOT PRESS. What do you do?",
    choices: [
      { text: ["Press it immediately."], c: ["rash", "brave", "naughty"] },
      {
        text: ["Absolutely do not press it."],
        c: ["careful", "hardy", "timid"],
      },
      { text: ["Ask someone else to press it."], c: ["timid", "sassy", "lax"] },
      {
        text: ["Inspect it carefully first."],
        c: ["careful", "mild", "lonely"],
      },
      {
        text: ["Stand there thinking about pressing it for way too long."],
        c: ["quiet", "bashful", "hasty"],
      },
      {
        text: ["Put a smaller sign on it that says REALLY DO NOT PRESS."],
        c: ["impish", "naughty", "sassy"],
      },
    ],
    choose: 4,
  },
  {
    id: "friend-upset",
    Icon: HeartCrack,
    q: "Your friend seems upset but says they're fine. What do you do?",
    choices: [
      {
        text: ["Give them space but stay nearby."],
        c: ["gentle", "mild", "hasty"],
      },
      {
        text: ["Ask them directly what's wrong."],
        c: ["bold", "brave", "hardy"],
      },
      {
        text: ["Try to cheer them up with jokes."],
        c: ["jolly", "sassy", "impish"],
      },
      {
        text: ["Offer snacks. Snacks solve many problems."],
        c: ["gentle", "rash", "naive"],
      },
      {
        text: ["Panic internally and overthink everything."],
        c: ["timid", "bashful", "lonely"],
      },
      {
        text: ["Send them a meme and hope it helps."],
        c: ["lax", "impish", "rash"],
      },
    ],
    choose: 4,
  },
  {
    id: "treasure-chest",
    Icon: Lock,
    q: "You discover a locked treasure chest. What's your first move?",
    choices: [
      { text: ["Try to force it open."], c: ["rash", "brave", "hardy"] },
      { text: ["Search for the key."], c: ["careful", "hasty", "bashful"] },
      {
        text: ["Shake it and listen carefully."],
        c: ["careful", "hardy", "calm"],
      },
      {
        text: ["Leave it alone. It probably belongs to someone."],
        c: ["modest", "naughty", "docile"],
      },
      {
        text: ["Ask a friend what they think."],
        c: ["docile", "mild", "hardy"],
      },
      {
        text: ["Sit on it and declare yourself the treasure now."],
        c: ["sassy", "bashful", "impish"],
      },
    ],
    choose: 4,
  },
  {
    id: "surprise-party",
    Icon: PartyPopper,
    q: "Your friends throw you a surprise party. How do you react?",
    choices: [
      {
        text: ["Jump in and enjoy the attention."],
        c: ["bold", "naive", "brave"],
      },
      {
        text: ["Get embarrassed but feel happy."],
        c: ["bashful", "naughty", "mild"],
      },
      {
        text: ["Cry a little. In a dignified way. Probably."],
        c: ["gentle", "quiet", "adamant"],
      },
      {
        text: ["Immediately start helping with snacks and cleanup."],
        c: ["docile", "hasty", "lonely"],
      },
      {
        text: ["Pretend you knew about it the whole time."],
        c: ["sassy", "rash", "impish"],
      },
      {
        text: ["Hide behind the nearest plant."],
        c: ["timid", "bashful", "lonely"],
      },
    ],
    choose: 4,
  },
  {
    id: "new-town",
    Icon: MapPin,
    q: "You arrive in a new town where you don't know anyone. What do you do first?",
    choices: [
      { text: ["Explore every street."], c: ["brave", "hasty", "bold"] },
      {
        text: ["Find somewhere quiet to rest."],
        c: ["quiet", "calm", "lonely"],
      },
      { text: ["Look for a place to eat."], c: ["relaxed", "lax", "lonely"] },
      {
        text: ["Introduce yourself to the first friendly-looking person."],
        c: ["bold", "hardy", "lonely"],
      },
      {
        text: ["Find the highest point and admire the view."],
        c: ["calm", "bashful", "adamant"],
      },
      {
        text: ["Get lost within five minutes but act like it was intentional."],
        c: ["sassy", "naive", "impish"],
      },
    ],
    choose: 4,
  },
  {
    id: "weird-noise",
    Icon: Ear,
    q: "You hear a weird noise coming from the closet at night. What do you do?",
    choices: [
      { text: ["Open it bravely."], c: ["brave", "bold", "rash"] },
      {
        text: ["Turn on every light first."],
        c: ["careful", "timid", "bashful"],
      },
      { text: ["Call someone else to check."], c: ["timid", "lax", "docile"] },
      {
        text: ["Ignore it and hide under the blanket."],
        c: ["timid", "bashful", "lonely"],
      },
      {
        text: ["Talk to the closet and ask it to leave politely."],
        c: ["gentle", "adamant", "naive"],
      },
      {
        text: ["Grab a pillow as your weapon."],
        c: ["impish", "brave", "adamant"],
      },
    ],
    choose: 4,
  },
  {
    id: "free-day",
    Icon: CalendarDays,
    q: "You suddenly have a completely free day. How do you spend it?",
    choices: [
      {
        text: ["Go on an adventure somewhere new."],
        c: ["brave", "lonely", "hasty"],
      },
      { text: ["Catch up on sleep."], c: ["lax", "relaxed", "quiet"] },
      {
        text: ["Work on a hobby or project."],
        c: ["adamant", "naughty", "hardy"],
      },
      { text: ["Hang out with friends."], c: ["jolly", "rash", "docile"] },
      {
        text: ["Make a detailed plan, then follow almost none of it."],
        c: ["quirky", "lax", "naive"],
      },
      {
        text: ["Lie on the floor and become furniture."],
        c: ["relaxed", "lax", "impish"],
      },
    ],
    choose: 4,
  },
  {
    id: "compliment",
    Icon: Smile,
    q: "Someone gives you a sincere compliment. What do you do?",
    choices: [
      { text: ["Accept it confidently."], c: ["bold", "calm", "adamant"] },
      {
        text: ["Get flustered and say thanks quietly."],
        c: ["bashful", "timid", "quiet"],
      },
      {
        text: ["Compliment them back immediately."],
        c: ["gentle", "lonely", "hasty"],
      },
      {
        text: ["Make a joke to deflect it."],
        c: ["sassy", "impish", "bashful"],
      },
      {
        text: ["Wonder if they secretly want something."],
        c: ["serious", "hardy", "lonely"],
      },
      {
        text: ["Store it in your brain forever like a tiny glowing rock."],
        c: ["quirky", "lonely", "naughty"],
      },
    ],
    choose: 4,
  },
  {
    id: "map-or-instinct",
    Icon: Compass,
    q: "You're lost in an unfamiliar place. How do you find your way?",
    choices: [
      { text: ["Use a map or GPS."], c: ["careful", "serious", "bashful"] },
      { text: ["Ask someone for directions."], c: ["docile", "hasty", "mild"] },
      { text: ["Follow your instincts."], c: ["brave", "rash", "adamant"] },
      {
        text: ["Retrace your steps carefully."],
        c: ["careful", "calm", "quiet"],
      },
      {
        text: ["Pick the prettiest path and hope."],
        c: ["naive", "lonely", "lax"],
      },
      {
        text: ["Accept your new life as a forest cryptid."],
        c: ["lonely", "impish", "naive"],
      },
    ],
    choose: 4,
  },
  {
    id: "competition",
    Icon: Trophy,
    q: "You enter a friendly competition. What's your attitude?",
    choices: [
      { text: ["I'm here to win."], c: ["adamant", "bold", "brave"] },
      { text: ["I'm here to have fun."], c: ["jolly", "relaxed", "lax"] },
      {
        text: ["I'm nervous, but I'll try my best."],
        c: ["timid", "bashful", "mild"],
      },
      {
        text: ["I want everyone to do well."],
        c: ["gentle", "docile", "calm"],
      },
      {
        text: ["I have a secret strategy."],
        c: ["careful", "quirky", "sassy"],
      },
      {
        text: ["I don't know the rules, but I have confidence and vibes."],
        c: ["naive", "bold", "impish"],
      },
    ],
    choose: 4,
  },
  {
    id: "mysterious-letter",
    Icon: Mail,
    q: "A mysterious letter arrives with no return address. What do you do?",
    choices: [
      { text: ["Open it right away."], c: ["rash", "hasty", "brave"] },
      {
        text: ["Inspect it carefully first."],
        c: ["careful", "serious", "calm"],
      },
      {
        text: ["Ask someone else to read it with you."],
        c: ["timid", "docile", "lonely"],
      },
      {
        text: ["Leave it unopened for a while."],
        c: ["careful", "lax", "quiet"],
      },
      {
        text: ["Assume you're being invited on a quest."],
        c: ["naive", "rash", "quirky"],
      },
      {
        text: ["Smell it. Important detective work."],
        c: ["quirky", "impish", "naive"],
      },
    ],
    choose: 4,
  },
  {
    id: "snack-machine",
    Icon: Candy,
    q: "A vending machine gives you two snacks instead of one. What do you do?",
    choices: [
      {
        text: ["Keep both. Destiny has chosen me."],
        c: ["bold", "naughty", "naive"],
      },
      { text: ["Give one to a friend."], c: ["gentle", "bashful", "docile"] },
      {
        text: ["Try to return the extra snack somehow."],
        c: ["careful", "serious", "bashful"],
      },
      { text: ["Save one for later."], c: ["careful", "calm", "lax"] },
      {
        text: ["Celebrate like you won the lottery."],
        c: ["jolly", "rash", "naive"],
      },
      {
        text: ["Become suspicious of the machine's motives."],
        c: ["serious", "rash", "quirky"],
      },
    ],
    choose: 4,
  },
  {
    id: "team-leader",
    Icon: Crown,
    q: "Your team needs someone to make a tough decision. What do you do?",
    choices: [
      {
        text: ["Step up and decide quickly."],
        c: ["bold", "adamant", "hasty"],
      },
      {
        text: ["Ask everyone for their opinion first."],
        c: ["docile", "hasty", "mild"],
      },
      {
        text: ["Support whoever seems most confident."],
        c: ["mild", "lax", "docile"],
      },
      {
        text: ["Think through every possible consequence."],
        c: ["careful", "serious", "quiet"],
      },
      {
        text: ["Suggest the weird option no one considered."],
        c: ["quirky", "impish", "rash"],
      },
      {
        text: ["Pretend to be busy tying your shoe."],
        c: ["bashful", "timid", "sassy"],
      },
    ],
    choose: 4,
  },
  {
    id: "tiny-dragon",
    Icon: Flame,
    q: "A tiny dragon lands on your windowsill and looks hungry. What do you offer it?",
    choices: [
      { text: ["A piece of fruit."], c: ["gentle", "naughty", "brave"] },
      { text: ["A sandwich."], c: ["relaxed", "jolly", "docile"] },
      { text: ["A shiny coin."], c: ["quirky", "naive", "modest"] },
      {
        text: ["Nothing until I know whether it breathes fire."],
        c: ["careful", "serious", "timid"],
      },
      {
        text: ["My friendship and emotional availability."],
        c: ["gentle", "jolly", "naive"],
      },
      {
        text: ["The souls of my enemies. Or cereal."],
        c: ["naughty", "sassy", "impish"],
      },
    ],
    choose: 4,
  },
  {
    id: "secret-door",
    Icon: DoorClosed,
    q: "You find a secret door behind a bookshelf. What happens next?",
    choices: [
      { text: ["I go through immediately."], c: ["rash", "brave", "bold"] },
      {
        text: ["I get someone else before opening it."],
        c: ["timid", "hardy", "docile"],
      },
      {
        text: ["I take pictures as evidence."],
        c: ["careful", "serious", "modest"],
      },
      {
        text: ["I close it and pretend I saw nothing."],
        c: ["timid", "lax", "lonely"],
      },
      {
        text: ["I make a dramatic speech before entering."],
        c: ["bold", "sassy", "quirky"],
      },
      {
        text: ["I check if the bookshelf has any good books first."],
        c: ["quirky", "relaxed", "lax"],
      },
    ],
    choose: 4,
  },
  {
    id: "late-bus",
    Icon: Bus,
    q: "Your bus is late and you're stuck waiting. What do you do?",
    choices: [
      { text: ["Wait patiently."], c: ["calm", "relaxed", "docile"] },
      {
        text: ["Check the schedule repeatedly."],
        c: ["careful", "hasty", "serious"],
      },
      { text: ["Talk to someone nearby."], c: ["gentle", "jolly", "bold"] },
      { text: ["Start walking instead."], c: ["adamant", "brave", "hardy"] },
      {
        text: ["Listen to music and zone out."],
        c: ["lax", "relaxed", "quiet"],
      },
      {
        text: ["Invent an entire backstory for the bus driver."],
        c: ["quirky", "impish", "naive"],
      },
    ],
    choose: 4,
  },
  {
    id: "haunted-house",
    Icon: Ghost,
    q: "Your friends want to visit a haunted house. What do you say?",
    choices: [
      { text: ["Yes! Let's go!"], c: ["brave", "jolly", "rash"] },
      {
        text: ["Only if everyone stays together."],
        c: ["timid", "rash", "docile"],
      },
      {
        text: ["I'll go, but I'm not going first."],
        c: ["bashful", "lonely", "sassy"],
      },
      { text: ["No thanks. I choose life."], c: ["timid", "serious", "lax"] },
      {
        text: ["I'll bring snacks and moral support."],
        c: ["gentle", "jolly", "modest"],
      },
      {
        text: ["I'm not scared of ghosts. Ghosts should be scared of me."],
        c: ["bold", "sassy", "brave"],
      },
    ],
    choose: 4,
  },
  {
    id: "forgotten-homework",
    Icon: BookX,
    q: "You realize you forgot an important assignment. What do you do?",
    choices: [
      {
        text: ["Rush to finish it as fast as possible."],
        c: ["hasty", "adamant", "hardy"],
      },
      {
        text: ["Explain honestly and ask for more time."],
        c: ["modest", "naughty", "serious"],
      },
      {
        text: ["Panic first, solve problem second."],
        c: ["timid", "rash", "bashful"],
      },
      { text: ["Accept your fate."], c: ["lax", "calm", "relaxed"] },
      {
        text: ["Ask a friend for help understanding it."],
        c: ["docile", "modest", "rash"],
      },
      {
        text: ["Turn in a drawing of a wizard and hope for partial credit."],
        c: ["impish", "quirky", "naughty"],
      },
    ],
    choose: 4,
  },
  {
    id: "campfire-story",
    Icon: FlameKindling,
    q: "Everyone is telling stories around a campfire. What kind of story do you tell?",
    choices: [
      { text: ["A spooky story."], c: ["impish", "bold", "brave"] },
      { text: ["A funny story."], c: ["jolly", "sassy", "impish"] },
      { text: ["An emotional story."], c: ["gentle", "quiet", "mild"] },
      {
        text: ["A true story that somehow gets weird."],
        c: ["quirky", "naive", "lax"],
      },
      {
        text: ["I don't tell one, but I listen closely."],
        c: ["quiet", "bashful", "calm"],
      },
      {
        text: ["A story with no point that still takes ten minutes."],
        c: ["lax", "quirky", "naive"],
      },
    ],
    choose: 4,
  },
  {
    id: "magic-potion",
    Icon: FlaskConical,
    q: "A wizard offers you a mystery potion. What do you do?",
    choices: [
      { text: ["Drink it. Adventure!"], c: ["rash", "brave", "jolly"] },
      {
        text: ["Ask what it does first."],
        c: ["careful", "serious", "modest"],
      },
      { text: ["Politely decline."], c: ["calm", "modest", "timid"] },
      { text: ["Save it for later."], c: ["careful", "lax", "quiet"] },
      {
        text: ["Offer it to a plant and observe the results."],
        c: ["quirky", "mild", "impish"],
      },
      {
        text: ["Ask if it comes in grape flavor."],
        c: ["jolly", "sassy", "naive"],
      },
    ],
    choose: 4,
  },
  {
    id: "lost-child",
    Icon: Baby,
    q: "You see a lost child crying in a busy place. What do you do?",
    choices: [
      {
        text: ["Comfort them and help find their guardian."],
        c: ["gentle", "brave", "docile"],
      },
      {
        text: ["Find a nearby staff member or authority figure."],
        c: ["careful", "serious", "modest"],
      },
      {
        text: ["Ask them calmly what happened."],
        c: ["calm", "hardy", "mild"],
      },
      {
        text: ["Look around for someone searching frantically."],
        c: ["careful", "hasty", "modest"],
      },
      {
        text: ["Call for help from someone nearby."],
        c: ["bold", "mild", "docile"],
      },
      {
        text: ["Offer them a sticker because stickers are powerful medicine."],
        c: ["gentle", "jolly", "naive"],
      },
    ],
    choose: 3,
  },
  {
    id: "stuck-elevator",
    Icon: ArrowUpDown,
    q: "You're briefly stuck in an elevator with three strangers. What do you do?",
    choices: [
      {
        text: ["Press the help button and stay calm."],
        c: ["calm", "hasty", "serious"],
      },
      {
        text: ["Make small talk to keep everyone relaxed."],
        c: ["gentle", "jolly", "bold"],
      },
      {
        text: ["Stand silently and avoid eye contact."],
        c: ["bashful", "quiet", "lonely"],
      },
      {
        text: ["Start joking like this is your emergency specialty."],
        c: ["sassy", "impish", "jolly"],
      },
      {
        text: ["Check if anyone else has a better plan."],
        c: ["docile", "mild", "modest"],
      },
      {
        text: ["Announce that this is your new apartment now."],
        c: ["quirky", "impish", "relaxed"],
      },
    ],
    choose: 4,
  },
  {
    id: "blank-canvas",
    Icon: Paintbrush,
    q: "Someone hands you a blank canvas and says you can make anything. What do you make?",
    choices: [
      {
        text: ["A careful painting with lots of detail."],
        c: ["careful", "serious", "modest"],
      },
      { text: ["Something bright and messy."], c: ["jolly", "rash", "quirky"] },
      {
        text: ["A portrait of someone important to me."],
        c: ["gentle", "modest", "mild"],
      },
      {
        text: ["A tiny landscape that feels peaceful."],
        c: ["calm", "quiet", "hasty"],
      },
      { text: ["Whatever idea arrives first."], c: ["hasty", "lax", "naive"] },
      {
        text: ["A single dot and a very serious artist statement."],
        c: ["sassy", "quirky", "serious"],
      },
    ],
    choose: 4,
  },
  {
    id: "borrowed-book",
    Icon: BookHeart,
    q: "A friend lends you their favorite book. How do you treat it?",
    choices: [
      {
        text: ["Very carefully. It returns in perfect condition."],
        c: ["careful", "serious", "modest"],
      },
      {
        text: ["I read it right away so we can talk about it."],
        c: ["jolly", "hasty", "naughty"],
      },
      {
        text: ["I keep meaning to read it and feel guilty."],
        c: ["bashful", "lax", "timid"],
      },
      {
        text: ["I take notes on my favorite parts."],
        c: ["careful", "adamant", "quiet"],
      },
      {
        text: ["I ask why they love it before I start."],
        c: ["gentle", "modest", "mild"],
      },
      {
        text: ["I protect it like it contains ancient secrets."],
        c: ["quirky", "relaxed", "impish"],
      },
    ],
    choose: 4,
  },
  {
    id: "wrong-order",
    Icon: UtensilsCrossed,
    q: "A restaurant brings you the wrong order. What do you do?",
    choices: [
      {
        text: ["Politely ask for the correct one."],
        c: ["calm", "modest", "rash"],
      },
      {
        text: ["Eat it anyway if it looks good."],
        c: ["lax", "relaxed", "jolly"],
      },
      {
        text: ["Check whether someone nearby got mine."],
        c: ["careful", "bashful", "modest"],
      },
      {
        text: ["Freeze because correcting people is hard."],
        c: ["bashful", "timid", "quiet"],
      },
      {
        text: ["Make a joke while asking for help."],
        c: ["sassy", "jolly", "hardy"],
      },
      {
        text: ["Assume the menu has chosen my destiny."],
        c: ["lax", "naive", "quirky"],
      },
    ],
    choose: 4,
  },
  {
    id: "midnight-knock",
    Icon: Moon,
    q: "Someone knocks on your door at midnight. What's your first move?",
    choices: [
      {
        text: ["Check who it is before opening."],
        c: ["careful", "serious", "calm"],
      },
      {
        text: ["Call out and ask what they need."],
        c: ["bold", "mild", "calm"],
      },
      { text: ["Ignore it and wait."], c: ["timid", "lax", "quiet"] },
      {
        text: ["Wake someone else up immediately."],
        c: ["timid", "hasty", "docile"],
      },
      {
        text: ["Look for a reasonable explanation."],
        c: ["calm", "lonely", "modest"],
      },
      {
        text: ["Whisper 'absolutely not' to the door."],
        c: ["sassy", "timid", "impish"],
      },
    ],
    choose: 4,
  },
  {
    id: "old-photo",
    Icon: Image,
    q: "You find an old photo you don't remember taking. What do you do with it?",
    choices: [
      {
        text: ["Ask someone if they recognize it."],
        c: ["docile", "hardy", "modest"],
      },
      { text: ["Keep it somewhere safe."], c: ["careful", "mild", "quiet"] },
      {
        text: ["Study every detail for clues."],
        c: ["careful", "serious", "adamant"],
      },
      {
        text: ["Forget about it until it randomly bothers me later."],
        c: ["lax", "relaxed", "quirky"],
      },
      {
        text: ["Make up a dramatic story about it."],
        c: ["quirky", "impish", "naive"],
      },
      {
        text: ["Frame it and pretend the mystery is interior design."],
        c: ["sassy", "quirky", "relaxed"],
      },
    ],
    choose: 4,
  },
  {
    id: "game-night",
    Icon: Dices,
    q: "It's game night and nobody can agree on what to play. What do you do?",
    choices: [
      { text: ["Suggest a vote."], c: ["calm", "modest", "docile"] },
      {
        text: ["Recommend my favorite game with full confidence."],
        c: ["bold", "adamant", "jolly"],
      },
      {
        text: ["Pick something easy so everyone can join."],
        c: ["gentle", "mild", "docile"],
      },
      { text: ["Let someone else decide."], c: ["lax", "docile", "quiet"] },
      {
        text: ["Try to combine everyone's ideas into one chaotic plan."],
        c: ["quirky", "rash", "jolly"],
      },
      {
        text: ["Become the rules lawyer before rules exist."],
        c: ["serious", "adamant", "sassy"],
      },
    ],
    choose: 4,
  },
  {
    id: "favorite-mug",
    Icon: Coffee,
    q: "Your favorite mug breaks. How do you react?",
    choices: [
      {
        text: ["Feel sad, then clean it up carefully."],
        c: ["gentle", "calm", "mild"],
      },
      { text: ["Try to repair it."], c: ["adamant", "hardy", "naive"] },
      {
        text: ["Take it as a sign to get a new favorite mug."],
        c: ["relaxed", "lax", "bold"],
      },
      {
        text: ["Keep one small piece for sentimental reasons."],
        c: ["gentle", "quiet", "modest"],
      },
      {
        text: ["Pretend I'm fine while clearly not being fine."],
        c: ["bashful", "timid", "sassy"],
      },
      {
        text: ["Hold a tiny funeral near the sink."],
        c: ["quirky", "impish", "naive"],
      },
    ],
    choose: 4,
  },
  {
    id: "unexpected-speech",
    Icon: Speech,
    q: "You're suddenly asked to give a short speech. What happens?",
    choices: [
      {
        text: ["I speak clearly and keep it simple."],
        c: ["calm", "modest", "serious"],
      },
      {
        text: ["I get nervous but push through."],
        c: ["timid", "brave", "bashful"],
      },
      { text: ["I make people laugh first."], c: ["sassy", "jolly", "impish"] },
      {
        text: ["I say as little as possible."],
        c: ["quiet", "bashful", "lonely"],
      },
      {
        text: ["I organize my thoughts before starting."],
        c: ["careful", "serious", "calm"],
      },
      {
        text: ["I black out and become surprisingly inspirational."],
        c: ["naive", "quirky", "rash"],
      },
    ],
    choose: 4,
  },
  {
    id: "hidden-staircase",
    Icon: Footprints,
    q: "You notice a hidden staircase in a place you've visited many times. What do you do?",
    choices: [
      { text: ["Go down carefully."], c: ["careful", "brave", "calm"] },
      {
        text: ["Find someone to come with me."],
        c: ["timid", "docile", "adamant"],
      },
      {
        text: ["Take a picture and investigate later."],
        c: ["careful", "serious", "modest"],
      },
      {
        text: ["Decide some mysteries can stay mysterious."],
        c: ["calm", "lax", "relaxed"],
      },
      { text: ["Listen for sounds first."], c: ["careful", "timid", "quiet"] },
      {
        text: ["Say 'well, obviously' like I expected this."],
        c: ["sassy", "bold", "impish"],
      },
    ],
    choose: 4,
  },
  {
    id: "missed-call",
    Icon: PhoneMissed,
    q: "You miss a call from an unknown number. What do you do?",
    choices: [
      { text: ["Call back right away."], c: ["hasty", "bold", "docile"] },
      {
        text: ["Wait to see if they leave a message."],
        c: ["calm", "naive", "lax"],
      },
      {
        text: ["Search the number first."],
        c: ["careful", "serious", "quiet"],
      },
      { text: ["Ignore it completely."], c: ["lax", "relaxed", "lonely"] },
      {
        text: ["Ask someone else if they recognize it."],
        c: ["docile", "modest", "relaxed"],
      },
      {
        text: ["Assume I have been selected for a secret mission."],
        c: ["quirky", "naive", "impish"],
      },
    ],
    choose: 4,
  },
  {
    id: "shared-playlist",
    Icon: ListMusic,
    q: "Your friends ask you to add one song to a shared playlist. What do you pick?",
    choices: [
      {
        text: ["Something everyone already knows."],
        c: ["docile", "mild", "modest"],
      },
      {
        text: ["A song that means a lot to me."],
        c: ["gentle", "quiet", "modest"],
      },
      {
        text: ["The funniest possible choice."],
        c: ["sassy", "impish", "jolly"],
      },
      { text: ["Whatever matches the mood."], c: ["calm", "mild", "relaxed"] },
      {
        text: ["A hidden gem I want people to appreciate."],
        c: ["quirky", "modest", "adamant"],
      },
      {
        text: ["A song so dramatic the playlist needs a seatbelt."],
        c: ["bold", "sassy", "rash"],
      },
    ],
    choose: 4,
  },
  {
    id: "one-power",
    Icon: Zap,
    q: "You're granted one magical ability, but only for a single day. Which do you pick?",
    choices: [
      { text: ["Flight."], c: ["brave", "bold", "jolly"] },
      { text: ["Invisibility."], c: ["quiet", "lonely", "impish"] },
      { text: ["Reading minds."], c: ["careful", "serious", "quirky"] },
      { text: ["Talking to animals."], c: ["gentle", "naive", "jolly"] },
      { text: ["Stopping time."], c: ["calm", "relaxed", "adamant"] },
      { text: ["Healing any wound."], c: ["gentle", "modest", "calm"] },
      { text: ["Teleporting anywhere."], c: ["hasty", "brave", "lax"] },
      {
        text: ["Turning anything into snacks."],
        c: ["jolly", "naughty", "quirky"],
      },
    ],
    choose: 4,
  },
  {
    id: "mistake",
    Icon: Eraser,
    q: "You mess something up, and you're the only one who knows. What do you do?",
    choices: [
      { text: ["Own up to it right away."], c: ["brave", "modest", "serious"] },
      {
        text: ["Quietly fix it before anyone notices."],
        c: ["quiet", "hasty", "modest"],
      },
      {
        text: ["Tell one person you trust first."],
        c: ["gentle", "timid", "modest"],
      },
      {
        text: ["Pretend it never happened."],
        c: ["lax", "naughty", "bashful"],
      },
      {
        text: ["Overthink it for the next several years."],
        c: ["timid", "serious", "lonely"],
      },
      {
        text: ["Apologize to the nearest houseplant as practice."],
        c: ["bashful", "quirky", "relaxed"],
      },
    ],
    choose: 4,
  },
  {
    id: "cutting-line",
    Icon: Scissors,
    q: "You're near the front of a long line. Someone clearly in a hurry asks to cut. What do you do?",
    choices: [
      {
        text: ["Let them in, no problem."],
        c: ["gentle", "relaxed", "docile"],
      },
      {
        text: ["Let them in, but feel a little annoyed."],
        c: ["mild", "lax", "sassy"],
      },
      { text: ["Politely say no."], c: ["calm", "adamant", "naughty"] },
      {
        text: ["Ask why they're in such a rush first."],
        c: ["careful", "serious", "modest"],
      },
      {
        text: ["Offer your whole spot and go to the back like a saint."],
        c: ["gentle", "modest", "naive"],
      },
      {
        text: ["Pretend you didn't hear and stare straight ahead."],
        c: ["sassy", "timid", "impish"],
      },
    ],
    choose: 4,
  },
  {
    id: "stolen-idea",
    Icon: Lightbulb,
    q: "Someone takes credit for your idea in front of everyone. What do you do?",
    choices: [
      {
        text: ["Speak up and set the record straight."],
        c: ["bold", "brave", "adamant"],
      },
      { text: ["Let it go this time."], c: ["calm", "relaxed", "modest"] },
      {
        text: ["Mention it to them privately afterward."],
        c: ["careful", "relaxed", "serious"],
      },
      {
        text: ["Drop a subtle hint that it was yours."],
        c: ["sassy", "mild", "impish"],
      },
      {
        text: ["Say nothing, but remember. Oh, you remember."],
        c: ["lonely", "serious", "sassy"],
      },
      {
        text: ["Begin plotting your redemption arc."],
        c: ["adamant", "impish", "quirky"],
      },
    ],
    choose: 4,
  },
  {
    id: "feeling-down",
    Icon: Frown,
    q: "It's been a rough day. How do you pick yourself back up?",
    choices: [
      {
        text: [
          "Talk it out with someone.",
          "A problem shared is a problem halved!",
        ],
        c: ["gentle", "jolly", "docile"],
      },
      {
        text: ["Keep busy and push through."],
        c: ["hardy", "adamant", "serious"],
      },
      {
        text: [
          "Some alone time.",
          "I just need to recharge in my little cave.",
        ],
        c: ["quiet", "lonely", "calm"],
      },
      {
        text: ["Comfort food and a favorite show."],
        c: ["relaxed", "lax", "naughty"],
      },
      {
        text: ["A long walk to clear my head."],
        c: ["calm", "quiet", "modest"],
      },
      {
        text: [
          "Cry it out, then carry on.",
          "Sometimes the eyes just need a rinse.",
        ],
        c: ["gentle", "quirky", "mild"],
      },
    ],
    choose: 4,
  },
  {
    id: "remembered",
    Icon: Flower2,
    q: "When all is said and done, how do you hope people remember you?",
    choices: [
      { text: ["As someone kind."], c: ["gentle", "modest", "docile"] },
      { text: ["As someone brave."], c: ["brave", "bold", "adamant"] },
      {
        text: ["As someone who made them laugh."],
        c: ["jolly", "sassy", "impish"],
      },
      {
        text: ["As someone they could always count on."],
        c: ["hardy", "serious", "naughty"],
      },
      {
        text: ["As someone who did things their own way."],
        c: ["adamant", "quirky", "lonely"],
      },
      {
        text: ["As that legend who once ate an entire cake alone."],
        c: ["naughty", "impish", "jolly"],
      },
    ],
    choose: 4,
  },
  {
    id: "selfless-wish",
    Icon: WandSparkles,
    q: "A genie grants you one wish, but it can't be for yourself. What do you wish for?",
    choices: [
      {
        text: ["Happiness for someone I love."],
        c: ["gentle", "modest", "calm"],
      },
      {
        text: ["An end to someone's suffering."],
        c: ["gentle", "serious", "brave"],
      },
      {
        text: ["A better world for everyone."],
        c: ["modest", "calm", "relaxed"],
      },
      {
        text: ["A wish for my best friend to use however they like."],
        c: ["docile", "lonely", "naive"],
      },
      {
        text: ["World peace. Go big or go home."],
        c: ["bold", "jolly", "naive"],
      },
      {
        text: ["Infinite snacks for all of humankind."],
        c: ["jolly", "quirky", "naughty"],
      },
    ],
    choose: 4,
  },
  {
    id: "do-overs",
    Icon: History,
    q: "Do you dwell on the past?",
    choices: [
      {
        text: ["Not really.", "What's done is done!"],
        c: ["relaxed", "calm", "hardy"],
      },
      { text: ["All the time."], c: ["serious", "quiet", "naughty"] },
      {
        text: ["Only late at night, unfortunately."],
        c: ["timid", "lonely", "bashful"],
      },
      {
        text: ["Never.", "I have outrun my regrets and they cannot catch me."],
        c: ["bold", "sassy", "impish"],
      },
    ],
    choose: 4,
  },
  {
    id: "good-friend",
    Icon: HeartHandshake,
    q: "What makes someone a good friend, in your eyes?",
    choices: [
      {
        text: ["Someone who's always honest with you."],
        c: ["serious", "adamant", "modest"],
      },
      {
        text: ["Someone who's there when it counts."],
        c: ["hardy", "gentle", "docile"],
      },
      {
        text: ["Someone who makes you laugh."],
        c: ["jolly", "sassy", "impish"],
      },
      {
        text: ["Someone who accepts you as you are."],
        c: ["gentle", "calm", "mild"],
      },
      {
        text: ["Someone who'll go on adventures with you."],
        c: ["brave", "jolly", "bold"],
      },
      {
        text: ["Someone who shares their fries without being asked."],
        c: ["gentle", "jolly", "naughty"],
      },
    ],
    choose: 4,
  },
];

export const isQuestion = (id: string): boolean => {
  return questions.some((q) => q.id === id);
};
