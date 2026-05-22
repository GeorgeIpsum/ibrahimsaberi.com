# ibrahimsaberi.com

My personal website and sandbox.

## How it's built

- Next.js
- Tailwind
- Base UI + coss ui
- MDX

### Why Next?

Flavor-of-the-month(-year?-decade??) framework and it's relatively fun and easy™[^1] to use. Reminds me of working with Angular 5/6 but with none of the CLI nonsense and additional cruft surrounding dependency injection (I never want to see the world "controller" again as long as I live) and the like. The Vercel aesthetic that's polluted startup design everywhere IS a little overstated though I'll admit. I'm not going to lie though I hate how much "black magic" you have to rely on using modern Next

[^1]: magic_is_a_good_thing.jpeg

### UI

A lot of the base UI components are sourced from [coss ui](https://coss.com/ui) which itself is built using [Base UI](https://base-ui.com). Definitely overkill but it's nice to be able to reach into a toolbox and grab what I know/ like. I've also grabbed some cool components from other areas of the web, I leave attribution in component files whenever that does happen.

### MDX

Blog content and other arbitrary pages are written/ built using MDX. I use a whole slew of remark/ rehype plugins, including some I've handrolled. You can check out which in the [`next.config.ts`](/next.config.ts) file.

### Theming

Colors for dark/ light mode themes were picked by me and are meant to be kind of "floral" in nature. Everything is driven by Tailwind + CSS vars here. I'll probably keep iterating on this, not 100% happy with how everything is as of right now.

## Some "Features"
- [x] Blog (all of the writing is bad)
- [x] Spotify now playing (and a whole bunch of other Spotify-related information, playlists, etc)
- [ ] A (mostly) fully featured TTY
- [ ] Web viewer for my amateur radio station (this may or may not be some decoration around "Spotify now playing" with web player SDK on top)
- [ ] Camera roll (curated list of dumb or cool images from my camera roll, auto-synced via a Homelab integration + some iCloud shenaniganery)
- [x] A health endpoint (`/api/health`) that returns random copypasta/ ascii art/ other text
- [ ] Random games/ micro-frontends for projects I've built
- [ ] A contact form that may or may not send whatever you put in there to the ether

<details>
<summary>Rambling Below, Beware</summary>

## Do u hate Ruby/ Jekyll now :(

Nah. Too much stuff I wanna do requires me to break out of both SSR and Markdown-based editing. If I'm creating raw HTML I'd rather do it in the way that's most ergonomic. Most of the stuff here is still gonna be SSR'd anyway :)

### Why not just React in Jekyll

JS tooling starts to become a real PITA when you want to do lots of custom stuff once you're outside of webpack/ babel land. And I'm a fraidy cat!

### dae mdx

sometimes (a lot of the time), yeah :)

### Ok well why don't you just

Get lost!

## Well are you gonna write more content.....

if the lexapro permits.................

## How do u deploy

Vercel hobby edition + porkbun as registrar and DNS (RIP GOOGLE DOMAINS YE SHALL BE MISSED DEARLY)

### You say you hate the Vercel aesthetic and yet you use Vercel a lot... interesting...

someone actually said this to me once. please shut up

### why porkbun

The aesthetic rules and they don't seem scummy (YET). I also have some stuff on namecheap but I hate their UI. Sorry mom I know it's not halal

## Ok when are you gonna try Svelte

(: try again next year (THE CURRENT YEAR IS 2067)

## Ok when are you gonna try Astro

Personally I'm more of a peninsula fan

## Ok when are y

this candlejack-as-a-service thing is really usef

</details>