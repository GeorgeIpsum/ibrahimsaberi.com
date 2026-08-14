// ASCII art from https://github.com/fiorastudio/buddy (src/lib/species.ts)
// `{E}` is an eye placeholder — replace it with an eye character before rendering.

export const HERO_LIST = [
  "Void Cat",
  "Rust Hound",
  "Data Drake",
  "Log Golem",
  "Cache Crow",
  "Shell Turtle",
  "Duck",
  "Goose",
  "Blob",
  "Octopus",
  "Owl",
  "Penguin",
  "Snail",
  "Ghost",
  "Axolotl",
  "Capybara",
  "Cactus",
  "Robot",
  "Rabbit",
  "Mushroom",
  "Chonk",
] as const;
export type Hero = (typeof HERO_LIST)[number];

export const EGG_ART = `
     .---.
    /     \\
   |  (?)  |
    \\     /
     '---'
`;

export const HERO_ART: Record<
  Hero,
  { egg: string; hatchling: string; adult: string }
> = {
  "Void Cat": {
    egg: EGG_ART,
    hatchling: ` |\\---/| 
 | o_o | 
  \\_^_/ `,
    adult: ` |\\      /| 
 | \\____/ | 
 |  o  o  | 
 |   ^^   | 
  \\______/ `,
  },
  "Rust Hound": {
    egg: EGG_ART,
    hatchling: ` /^ ^\\ 
/ 0 0 \\ 
V\\ Y /V `,
    adult: `  / \\__   / \\ 
 (   @ \\_/ @ ) 
  \\__  Y  __/ 
     \\ | / 
      \\|/ `,
  },
  "Data Drake": {
    egg: EGG_ART,
    hatchling: ` < ^_^ > 
  (0 0) 
  ^^ ^^ `,
    adult: `    /\\___/\\ 
   (  o o  ) 
   (  =v=  ) 
   /|     |\\ 
  / |     | \\ `,
  },
  "Log Golem": {
    egg: EGG_ART,
    hatchling: ` [-----] 
 [ o o ] 
 [  -  ] `,
    adult: `  _______ 
 |       | 
 | [o] [o]| 
 |   _   | 
 |_______| 
  |     | `,
  },
  "Cache Crow": {
    egg: EGG_ART,
    hatchling: `  \\ ^ / 
   (V) 
  /   \\ `,
    adult: `   ___ 
  (o o) 
 /| V |\\ 
/ |   | \\ 
  ^^ ^^ `,
  },
  "Shell Turtle": {
    egg: EGG_ART,
    hatchling: `  .---. 
 ( o o ) 
  '---' `,
    adult: `    _____ 
   /     \\ 
  /       \\ 
 (  o   o  ) 
  \\_______/ 
   | | | | `,
  },
  Duck: {
    egg: EGG_ART,
    hatchling: `  __(.)< 
  \\___) `,
    adult: `      __ 
    <(o )___ 
     ( ._> / 
      '---' `,
  },
  Goose: {
    egg: EGG_ART,
    hatchling: `  __(.)< 
  \\___) `,
    adult: `     __ 
   __ >(.) 
  \\___) | 
   |    | 
   '----' `,
  },
  Blob: {
    egg: EGG_ART,
    hatchling: `  .---. 
 ( o o ) 
  '---' `,
    adult: `   .---. 
  /     \\ 
 (  o o  ) 
  '-----' `,
  },
  Octopus: {
    egg: EGG_ART,
    hatchling: `  _(")_ 
 (_)(_) `,
    adult: `    _---_ 
   /     \\ 
  (  o o  ) 
   \\_---_/ 
  /|/| |\\|\\ `,
  },
  Owl: {
    egg: EGG_ART,
    hatchling: `  {o,o} 
  ./)_) 
   " " `,
    adult: `   ___ 
  {o,o} 
  |)__) 
  -"-"- `,
  },
  Penguin: {
    egg: EGG_ART,
    hatchling: `  (o_o) 
  <(_) 
   " " `,
    adult: `   (o_o) 
  /(_)_\\ 
   (_) 
   " " `,
  },
  Snail: {
    egg: EGG_ART,
    hatchling: `  _@_ 
 (___) `,
    adult: `    _@_ 
  _(   )_ 
 (_______) `,
  },
  Ghost: {
    egg: EGG_ART,
    hatchling: `  .-. 
 (o o) 
 | m | 
 '---' `,
    adult: `   .-. 
  (o o) 
  | O | 
  |   | 
  '---' `,
  },
  Axolotl: {
    egg: EGG_ART,
    hatchling: ` -[o_o]- 
  '---' `,
    adult: `  /\\___/\\ 
 -[ o o ]- 
  (  v  ) 
   '---' `,
  },
  Capybara: {
    egg: EGG_ART,
    hatchling: `  (o_o) 
  '---' `,
    adult: `    .---. 
   ( o o ) 
  /|  -  |\\ 
   '-----' `,
  },
  Cactus: {
    egg: EGG_ART,
    hatchling: `   _|_ 
  (o_o) 
   '|' `,
    adult: `   _|_ 
  | o | 
 -|   |- 
  |___| `,
  },
  Robot: {
    egg: EGG_ART,
    hatchling: `  [o_o] 
  '-|-' `,
    adult: `   [o_o] 
  /|___|\\ 
   |   | 
   '---' `,
  },
  Rabbit: {
    egg: EGG_ART,
    hatchling: `  (\\ /) 
  (o_o) 
  c(")(") `,
    adult: `  (\\ /) 
  (o o) 
  (> <) 
  c(")(") `,
  },
  Mushroom: {
    egg: EGG_ART,
    hatchling: `  .---. 
 ( o o ) 
  '---' `,
    adult: `   .---. 
  (     ) 
   |o o| 
   '---' `,
  },
  Chonk: {
    egg: EGG_ART,
    hatchling: `  ( o o ) 
  '-----' `,
    adult: `   .-------. 
  /         \\ 
 (   o   o   ) 
  \\    v    / 
   '-------' `,
  },
};

// Idle animation frames (2-3 per stage), cycled over time.
export const HERO_ANIMATIONS: Record<
  Hero,
  { hatchling: string[]; adult: string[] }
> = {
  "Void Cat": {
    hatchling: [
      ` |\\---/| 
 | {E}_{E} | 
  \\_^_/ `,
      ` |\\---/| 
 | -_- | 
  \\_^_/ `,
      ` |\\---/| 
 | {E}_{E} | 
  \\_^_/ `,
    ],
    adult: [
      ` |\\      /| 
 | \\____/ | 
 |  {E}  {E}  | 
 |   ^^   | 
  \\______/ `,
      ` |\\      /| 
 | \\____/ | 
 |  -  -  | 
 |   ^^   | 
  \\______/ `,
      ` |\\      /| 
 | \\____/ | 
 |  {E}  {E}  | 
 |   ^^   | 
  \\______/ `,
    ],
  },
  "Rust Hound": {
    hatchling: [
      ` /^ ^\\ 
/ {E} {E} \\ 
V\\ Y /V `,
      ` /^ ^\\ 
/ - - \\ 
V\\ Y /V `,
    ],
    adult: [
      `  / \\__   / \\ 
 (   {E} \\_/ {E} ) 
  \\__  Y  __/ 
     \\ | / 
      \\|/ `,
      `  / \\__   / \\ 
 (   {E} \\_/ {E} ) 
  \\__  Y  __/ 
     \\|/ 
      | `,
    ],
  },
  "Data Drake": {
    hatchling: [
      ` < ^_^ > 
  ({E} {E}) 
  ^^ ^^ `,
      ` < ^_^ > 
  (- -) 
  ^^ ^^ `,
    ],
    adult: [
      `    /\\___/\\ 
   (  {E} {E}  ) 
   (  =v=  ) 
   /|     |\\ 
  / |     | \\ `,
      `    /\\___/\\ 
   (  - -  ) 
   (  =v=  ) 
   /|     |\\ 
  / |     | \\ `,
    ],
  },
  "Log Golem": {
    hatchling: [
      ` [-----] 
 [ {E} {E} ] 
 [  -  ] `,
      ` [-----] 
 [ {E} {E} ] 
 [  =  ] `,
    ],
    adult: [
      `  _______ 
 |       | 
 | [{E}] [{E}]| 
 |   _   | 
 |_______| 
  |     | `,
      `  _______ 
 |       | 
 | [{E}] [{E}]| 
 |   -   | 
 |_______| 
  |     | `,
    ],
  },
  "Cache Crow": {
    hatchling: [
      `  \\ ^ / 
   (V) 
  /   \\ `,
      `  \\ v / 
   (V) 
  /   \\ `,
    ],
    adult: [
      `   ___ 
  ({E} {E}) 
 /| V |\\ 
/ |   | \\ 
  ^^ ^^ `,
      `   ___ 
  (- -) 
 /| V |\\ 
/ |   | \\ 
  ^^ ^^ `,
    ],
  },
  "Shell Turtle": {
    hatchling: [
      `  .---. 
 ( {E} {E} ) 
  '---' `,
      `  .---. 
 ( - - ) 
  '---' `,
    ],
    adult: [
      `    _____ 
   /     \\ 
  /       \\ 
 (  {E}   {E}  ) 
  \\_______/ 
   | | | | `,
      `    _____ 
   /     \\ 
  /       \\ 
 (  -   -  ) 
  \\_______/ 
   | | | | `,
    ],
  },
  Duck: {
    hatchling: [
      `  __({E})< 
  \\___) `,
      `  __({E})> 
  \\___) `,
    ],
    adult: [
      `      __ 
    <({E} )___ 
     ( ._> / 
      '---' `,
      `      __ 
    <(- )___ 
     ( ._> / 
      '---' `,
    ],
  },
  Goose: {
    hatchling: [
      `  __({E})< 
  \\___) `,
      `  __(O)< 
  \\___) `,
    ],
    adult: [
      `     __ 
   __ >({E}) 
  \\___) | 
   |    | 
   '----' `,
      `     __ 
   __ >(O) 
  \\___) | 
   |    | 
   '----' `,
    ],
  },
  Blob: {
    hatchling: [
      `  .---. 
 ( {E} {E} ) 
  '---' `,
      `  .-.-. 
 ( {E} {E} ) 
  '-.-' `,
    ],
    adult: [
      `   .---. 
  /     \\ 
 (  {E} {E}  ) 
  '-----' `,
      `   .-.-. 
  /     \\ 
 (  {E} {E}  ) 
  '-.-.-' `,
    ],
  },
  Octopus: {
    hatchling: [
      `  _("{E}")_ 
 (_)(_) `,
      `  _("{E}")_ 
 (_) (_)`,
    ],
    adult: [
      `    _---_ 
   /     \\ 
  (  {E} {E}  ) 
   \\_---_/ 
  /|/| |\\|\\ `,
      `    _---_ 
   /     \\ 
  (  {E} {E}  ) 
   \\_---_/ 
  \\|\\| |/|/ `,
    ],
  },
  Owl: {
    hatchling: [
      `  {{E},{E}} 
  ./)_) 
   " " `,
      `  {-,-} 
  ./)_) 
   " " `,
    ],
    adult: [
      `   ___ 
  {{E},{E}} 
  |)__) 
  -"-"- `,
      `   ___ 
  {-,-} 
  |)__) 
  -"-"- `,
    ],
  },
  Penguin: {
    hatchling: [
      `  ({E}_{E}) 
  <(_) 
   " " `,
      `  ({E}_{E}) 
  >(_) 
   " " `,
    ],
    adult: [
      `   ({E}_{E}) 
  /(_)_\\ 
   (_) 
   " " `,
      `   (-_-) 
  /(_)_\\ 
   (_) 
   " " `,
    ],
  },
  Snail: {
    hatchling: [
      `  _{E}_ 
 (___) `,
      `  _{E}_ 
  (___) `,
    ],
    adult: [
      `    _{E}_ 
  _(   )_ 
 (_______) `,
      `    _{E}_ 
   _(   )_ 
  (_______) `,
    ],
  },
  Ghost: {
    hatchling: [
      `  .-. 
 ({E} {E}) 
 | m | 
 '---' `,
      `  .-. 
 (O O) 
 | m | 
 '---' `,
      `  .-. 
 ({E} {E}) 
 | w | 
 '---' `,
    ],
    adult: [
      `   .-. 
  ({E} {E}) 
  | O | 
  |   | 
  '---' `,
      `   .-. 
  (O O) 
  | o | 
  |   | 
  '---' `,
      `   .-. 
  ({E} {E}) 
  | O | 
  |   | 
  '~~' `,
    ],
  },
  Axolotl: {
    hatchling: [
      ` -[{E}_{E}]- 
  '---' `,
      ` -[^_^]- 
  '---' `,
    ],
    adult: [
      `  /\\___/\\ 
 -[ {E} {E} ]- 
  (  v  ) 
   '---' `,
      `  /\\___/\\ 
 -[ ^ ^ ]- 
  (  v  ) 
   '---' `,
    ],
  },
  Capybara: {
    hatchling: [
      `  ({E}_{E}) 
  '---' `,
      `  (-_-) 
  '---' `,
    ],
    adult: [
      `    .---. 
   ( {E} {E} ) 
  /|  -  |\\ 
   '-----' `,
      `    .---. 
   ( -_- ) 
  /|  -  |\\ 
   '-----' `,
    ],
  },
  Cactus: {
    hatchling: [
      `   _|_ 
  ({E}_{E}) 
   '|' `,
      `   _|_ 
  (^_^) 
   '|' `,
    ],
    adult: [
      `   _|_ 
  | {E} | 
 -|   |- 
  |___| `,
      `   _|_ 
  | ^ | 
 -|   |- 
  |___| `,
    ],
  },
  Robot: {
    hatchling: [
      `  [{E}_{E}] 
  '-|-' `,
      `  [O_O] 
  '-|-' `,
      `  [{E}_{E}] 
  '-|-' `,
    ],
    adult: [
      `   [{E}_{E}] 
  /|___|\\ 
   |   | 
   '---' `,
      `   [O_O] 
  /|___|\\ 
   |   | 
   '---' `,
      `   [{E}_{E}] 
  /|___|\\ 
   |   | 
   '---' `,
    ],
  },
  Rabbit: {
    hatchling: [
      `  (\\ /) 
  ({E}_{E}) 
  c(")(") `,
      `  (| |) 
  ({E}_{E}) 
  c(")(") `,
    ],
    adult: [
      `  (\\ /) 
  ({E} {E}) 
  (> <) 
  c(")(") `,
      `  (| |) 
  ({E} {E}) 
  (> <) 
  c(")(") `,
    ],
  },
  Mushroom: {
    hatchling: [
      `  .---. 
 ( {E} {E} ) 
  '---' `,
      `  .---. 
 ( - - ) 
  '---' `,
    ],
    adult: [
      `   .---. 
  (     ) 
   |{E} {E}| 
   '---' `,
      `   .---. 
  (     ) 
   |- -| 
   '---' `,
    ],
  },
  Chonk: {
    hatchling: [
      `  ( {E} {E} ) 
  '-----' `,
      `  ( - - ) 
  '-----' `,
    ],
    adult: [
      `   .-------. 
  /         \\ 
 (   {E}   {E}   ) 
  \\    v    / 
   '-------' `,
      `   .-------. 
  /         \\ 
 (   -   -   ) 
  \\    v    / 
   '-------' `,
      `   .-------. 
  /         \\ 
 (   {E}   {E}   ) 
  \\    w    / 
   '-------' `,
    ],
  },
};

// Sprite animation frames (fixed-width lines, includes the pre-rendered Penguin).
export const HERO_SPRITES: Record<Hero, string[]> = {
  "Void Cat": [
    `  /\\_/\\       
 ( {E}ω{E} )      
  )   (__/    
 (_____/      `, // idle
    `  /\\_/\\       
 ( -ω- )      
  )   (__/    
 (_____/      `, // blink
    `  /\\_/\\       
 ( {E}ω{E} )      
  )   (__~    
 (_____/      `, // tail wag
    `  /\\_/\\       
 ( {E}ω{E})       
  )   (__/    
 (_____/      `, // look right
    `  /\\_/\\       
 ( {E}o{E} )      
  )   (__/    
 (_____/      `, // surprised
  ],
  "Rust Hound": [
    `  /^ ^\\     
 / {E} {E} \\    
 V\\ Y /V    
   |_|      `, // idle
    `  /^ ^\\     
 / - -  \\   
 V\\ Y /V    
   |_|      `, // blink
    `  /^ ^\\     
 / {E} {E} \\    
 V\\ Y /V    
   |_| ~    `, // tail wag
    `  /v ^\\     
 / {E} {E} \\    
 V\\ Y /V    
   |_|      `, // ear flop
  ],
  "Data Drake": [
    `   /^\\  /^\\   
  < {E}    {E} >  
  (   ~~   )  
   '-vvvv-'   `, // idle
    `   /^\\  /^\\   
  < -    - >  
  (   ~~   )  
   '-vvvv-'   `, // blink
    `   /^\\  /^\\   
  < {E}    {E} >  
  (   ~~   )  
   '-vvvv-'~  `, // smoke
    `   ~^\\  /^~   
  < {E}    {E} >  
  (   __   )  
   '-vvvv-'   `, // wing flap
  ],
  "Log Golem": [
    `  [=====]   
 [ {E}  {E} ]   
 [  __  ]   
 [______]   
  |    |    `, // idle
    `  [=====]   
 [ -  - ]   
 [  __  ]   
 [______]   
  |    |    `, // blink
    `  [=====]   
 [ {E}  {E} ]   
 [  ==  ]   
 [______]   
  |    |    `, // talk
    `  [=====]   
 [ {E}  {E} ]   
 [  __  ]   
 [______]   
   |  |     `, // shift
  ],
  "Cache Crow": [
    `    ___     
   ({E} {E})    
  /| V |\\   
 / |   | \\  
   ^^ ^^    `, // idle
    `    ___     
   (- -)    
  /| V |\\   
 / |   | \\  
   ^^ ^^    `, // blink
    `    ___     
   ({E} {E})    
 ~/| V |\\~  
 / |   | \\  
   ^^ ^^    `, // flap
    `    ___     
   ({E} {E})>   
  /| V |\\   
 / |   | \\  
   ^^ ^^    `, // caw
  ],
  "Shell Turtle": [
    `   _,--._   
  ( {E}  {E} )  
 /[______]\\ 
   \`\`  \`\`   `, // idle
    `   _,--._   
  ( -  - )  
 /[______]\\ 
   \`\`  \`\`   `, // blink
    `   _,--._   
  ( {E}  {E} )  
 /[______]\\ 
  \`\`    \`\`  `, // step
    `   _,--._   
  ( {E}  {E} )  
 /[======]\\ 
   \`\`  \`\`   `, // shell shine
  ],
  Duck: [
    `    __      
  <({E} )___  
   ( ._>    
    \`--´    `, // idle
    `    __      
  <(- )___  
   ( ._>    
    \`--´    `, // blink
    `    __      
  <({E} )___  
   ( .__>   
    \`--´~   `, // waddle
    `    __      
  <({E}!)___  
   ( ._>    
    \`--´    `, // quack
  ],
  Goose: [
    `     ({E}>    
     ||     
   _(__)_   
    ^^^^    `, // idle
    `     (->    
     ||     
   _(__)_   
    ^^^^    `, // blink
    `    ({E}>>    
     ||     
   _(__)_   
    ^^^^    `, // honk
    `     ({E}>    
     ||     
  __(__)__  
    ^^^^    `, // puff up
  ],
  Blob: [
    `   .----.   
  ( {E}  {E} )  
  (      )  
   \`----´   `, // idle
    `   .----.   
  ( -  - )  
  (      )  
   \`----´   `, // blink
    `  .------.  
 (  {E}  {E}  ) 
 (        ) 
  \`------´  `, // expand
    `    .--.    
   ({E}  {E})   
   (    )   
    \`--´    `, // contract
  ],
  Octopus: [
    `   .----.   
  ( {E}  {E} )  
  (______)  
  /\\/\\/\\/\\  `, // idle
    `   .----.   
  ( -  - )  
  (______)  
  /\\/\\/\\/\\  `, // blink
    `   .----.   
  ( {E}  {E} )  
  (______)  
  \\/\\/\\/\\/  `, // tentacle wave
    `   .----.   
  ( {E}  {E} )  
  (______)  
  /\\/\\/\\/\\  `, // ink
  ],
  Owl: [
    `   ,___,    
  ( {E}v{E} )   
  /)   (\\   
  \\_____/   
   "   "    `, // idle
    `   ,___,    
  ( -v- )   
  /)   (\\   
  \\_____/   
   "   "    `, // blink
    `   .___,    
  ( {E}v{E} )   
  /)   (\\   
  \\_____/   
   "   "    `, // ruffle
    `   ,___,    
  ({E} v {E})   
  /)   (\\   
  \\_____/   
   "   "    `, // head tilt
  ],
  Penguin: [
    `  .---.      
  ({E}>{E})  
 /(   )\\     
  \`- -'      `,
    ` .---.       
 ({E}>{E})   
 //  )/      
 \`- -'       `,
    `  .---.      
  ({E}>{E})  
 /(   )\\     
  \`- -'      `,
    `   .---.     
   ({E}<{E}) 
  \\(  \\\\     
   \`- -'     `,
    `  .---.      
  (->-)      
 /(   )\\     
  \`- -'      `,
  ],
  Snail: [
    `   \\{E}^^/      
     \\  .--.  
      \\( @ )  
       \\'--'  
            ~ `, // idle
    `   \\-^^/      
     \\  .--.  
      \\( @ )  
       \\'--'  
           ~~ `, // blink
    `    \\{E}^^/     
     |  .--.  
      \\( @ )  
       \\'--'  
          ~~~ `, // peek
    `   \\{E}^^/      
     \\  .--.  
      \\( @ )  
       \\'--'  
         ~~~~ `, // slide
  ],
  Ghost: [
    `   .----.   
  / {E}  {E} \\  
  |      |  
  ~\`~\`\`~\`~  `, // idle
    `   .----.   
  / -  - \\  
  |      |  
  ~\`~\`\`~\`~  `, // blink
    `   .----.   
  / {E}  {E} \\  
  |      |  
  \`~~\`\`~~\`  `, // ooh
    `    ----    
  / {E}  {E} \\  
  |      |  
  ~~\`~~\`~~  `, // flicker
  ],
  Axolotl: [
    `}~(______)~{
}~({E} .. {E})~{
  ( .--. )  
  (_/  \\_)  `, // idle
    `}~(______)~{
}~(- .. -)~{
  ( .--. )  
  (_/  \\_)  `, // blink
    `~}(______){~
~}({E} .. {E}){~
  ( .--. )  
  (_/  \\_)  `, // gill wave
    `}~(______)~{
}~({E} ^^ {E})~{
  ( .--. )  
  ~_/  \\_~  `, // happy
  ],
  Capybara: [
    `  n______n  
 ( {E}    {E} ) 
 (   oo   ) 
  \`------´  `, // idle
    `  n______n  
 ( -    - ) 
 (   oo   ) 
  \`------´  `, // blink
    `  n______n  
 ( {E}    {E} ) 
 (   Oo   ) 
  \`------´  `, // chew
    `  u______n  
 ( {E}    {E} ) 
 (   oo   ) 
  \`------´  `, // ear twitch
  ],
  Cactus: [
    `    ____    
 n |{E}  {E}| n 
 |_|    |_| 
   |    |   `, // idle (arms down)
    `    ____    
 n |-  -| n 
 |_|    |_| 
   |    |   `, // blink
    ` n  ____  n 
 | |{E}  {E}| | 
 |_|    |_| 
   |    |   `, // arms up
    ` n  ____  n 
 | |{E}  {E}| | 
 |_|  * |_| 
   |    |   `, // flower
  ],
  Robot: [
    `   .[||].   
  [ {E}  {E} ]  
  [ ==== ]  
  \`------´  `, // idle
    `   [.||.]   
  [ -  - ]  
  [ ==== ]  
  \`------´  `, // blink
    `   .[||].   
  [ {E}  {E} ]  
  [ ==== ]  
  \`------´  `, // antenna
    `   [.||.]   
  [ -  - ]  
  [ -==- ]  
  \`------´  `, // process
  ],
  Rabbit: [
    `  (\\   /)    
  (\\_._/)    
  ( {E}.{E} )    
   > ^ <     
  (") (")    `, // idle
    `  (\\   /)    
  (\\_._/)    
  ( -.° )    
   > ^ <     
  (") (")    `, // blink
    `  (\\   _)    
  (\\_.._)    
  ( {E}.{E} )    
   > ^ <     
  (") (")    `, // ear flop
    `  (\\   /)    
  (\\_._/)    
  ( {E}.{E} )    
   > ^<      
  (") (")    `, // nose wiggle
  ],
  Mushroom: [
    ` .-o-OO-o-. 
(__________)
   |{E}  {E}|   
   |____|   `, // idle
    ` .-o-OO-o-. 
(__________)
   |-  -|   
   |____|   `, // blink
    ` .-O-oo-O-. 
(__________)
   |{E}  {E}|   
   |____|   `, // cap shift
    ` .-o-OO-o-. 
(__________)
   |{E}  {E}|   
   |_~~_|   `, // wiggle
    ` .o-OO-o.   
(__________)
    |{E} {E}|   
   |____|   `, // lean
  ],
  Chonk: [
    `  /\\    /\\  
 ( {E}    {E} ) 
 (   ..   ) 
  \`------´  `, // idle
    `  /\\    /\\  
 ( -    - ) 
 (   ..   ) 
  \`------´  `, // blink
    `  /\\    /|  
 ( {E}    {E} ) 
 (   ..   ) 
  \`------´  `, // ear flop
    `  /\\    /\\  
 ( {E}    {E} ) 
 (   ..   ) 
  \`------´~ `, // tail
    `  /\\    /\\  
 ( {E}    {E} ) 
 (   oo   ) 
  \`------´  `, // yawn
  ],
};
