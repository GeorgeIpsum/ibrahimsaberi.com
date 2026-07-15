import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/atoms/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@/components/atoms/preview-card";
import { GradientTextReveal, Hello } from "@/components/text";
import { AboutControl } from "./control";

// technically only captured at build time, but i can get around this by triggering a force rebuild on new years every year
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_ROLE = "the head of product";
const CURRENT_WORKPLACE = "tilli Software";

export default function Page() {
  return (
    <article className="prose mx-auto min-h-[calc(100svh-10rem)] px-2">
      <Hello />
      <p className="reveal reveal-top">
        I'm <span className="font-bold">Ibrahim</span>, a software engineer
        based in Bethesda, Maryland. I currently work as{" "}
        <span className="font-bold">{CURRENT_ROLE}</span> at{" "}
        <span className="font-bold font-heading">
          <a
            href="https://tillisoftware.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Sorry that this website is so jank. We used to have a WordPress site, but lack of fine-tuned control and plugin hell made leadership decide to switch to this vibe-coded thing (...slop). I don't have the bandwidth to make it better at the moment."
          >
            {CURRENT_WORKPLACE}
          </a>
        </span>
        , where I've built out our consumer-facing products and own the
        company's overall product strategy. My team is also responsible for
        investigating new tech, solving weird problems, and building internal
        tooling to connect our different applications and teams.
      </p>

      <h2 className="reveal-top">What sparks joy</h2>
      <p className="reveal-top">
        I'm a creator/tinkerer at heart; to me, the process{" "}
        <span className="italic">is</span> the pudding. Reading{" "}
        <PreviewCard>
          <PreviewCardTrigger href="https://www.robinsloan.com/notes/home-cooked-app/">
            "An app can be a home-cooked meal"
          </PreviewCardTrigger>{" "}
          changed my life. I firmly believe that software, at its best, is an
          art form that serves others.
          <PreviewCardPopup>
            <figure className="prose block">
              <blockquote className="text-sm">
                <p>
                  <q>
                    The list of reasons to “learn to cook” overflows, and only a
                    handful have anything to do with the marketplace. Cooking
                    reaches beyond buying and selling to touch nearly all of
                    human experience. It connects to domesticity and curiosity;
                    to history and culture; to care and love.
                  </q>
                </p>
              </blockquote>
              <figcaption className="text-xs">
                Robin Sloan, The Lab,{" "}
                <cite>An app can be a home-cooked meal</cite>, February 2020
              </figcaption>
            </figure>
          </PreviewCardPopup>
        </PreviewCard>
      </p>
      <p className="reveal-top">
        A lot of the content on this website reflects my different hobbies and
        interests. A few below:
      </p>
      <ul className="reveal-top">
        <li>
          <Popover>
            <PopoverTrigger className="underline" openOnHover>
              Exploring and learning big codebases
            </PopoverTrigger>
            <PopoverContent className="max-w-64 text-sm">
              And more importantly, yoinking what I like
            </PopoverContent>
          </Popover>
        </li>
        <li>
          Exploring new (and old) tech and{" "}
          <Popover>
            <PopoverTrigger className="underline" openOnHover>
              reverse-engineering
            </PopoverTrigger>
            <PopoverContent className="max-w-64 text-sm">
              I'm trying to get more into the hardware side recently, but this
              feels more and more like black magic the more I learn
            </PopoverContent>
          </Popover>{" "}
          arcane systems
        </li>
        <li>
          <Popover>
            <PopoverTrigger className="underline" openOnHover>
              Cooking
            </PopoverTrigger>
            <PopoverContent className="max-w-64 text-sm">
              Especially the science behind what makes good food
            </PopoverContent>
          </Popover>{" "}
          (and food in general)
        </li>
        <li>
          Hacking on my{" "}
          <Popover>
            <PopoverTrigger className="underline" openOnHover>
              homelab
            </PopoverTrigger>
            <PopoverContent className="max-w-64 text-sm">
              And breaking all the lighting in my apartment every month or so
            </PopoverContent>
          </Popover>
        </li>
        <li>
          <Popover>
            <PopoverTrigger
              className="items-start justify-start text-left underline"
              openOnHover
            >
              Arguing with my dad about networking and our homelabs
            </PopoverTrigger>
            <PopoverContent className="max-w-64 text-sm">
              Which is starting to feel more and more like arguing with an LLM
              about networking and hardware. Perhaps I won the war but lost the
              planet in the process
            </PopoverContent>
          </Popover>
        </li>
        <li>Gamedev</li>
        <li>
          <Popover>
            <PopoverTrigger className="underline" openOnHover>
              Basketball
            </PopoverTrigger>
            <PopoverContent className="max-w-64 text-sm">
              And I am unfortunately an Atlanta sports fan
            </PopoverContent>
          </Popover>
        </li>
        <li>
          <Popover>
            <PopoverTrigger className="underline" openOnHover>
              Dota 2
            </PopoverTrigger>
            <PopoverContent className="max-w-64 text-sm">
              My therapist says this explains a lot
            </PopoverContent>
          </Popover>
        </li>
      </ul>

      <h2 className="reveal">How we got here</h2>
      <p className="reveal">
        I've been programming since my dad downloaded NetBeans on the family
        desktop computer; the first program I "wrote" was a hack of the{" "}
        <a
          href="https://www.greenfoot.org/doc/tut-1"
          target="_blank"
          rel="noopener noreferrer"
        >
          Greenfoot wombat scenario
        </a>
        . I gave those wombats access to meteor, hyper beam, and hydro pump, and
        then let them go wild. Unfortunately, I haven't been able to recreate
        that thrill since.
      </p>

      <h3 className="reveal">Viewify</h3>
      <div className="reveal -mt-2 flex gap-2 text-muted-foreground text-sm">
        <time dateTime="2018">2018</time>
        <span>{"\u2013"}</span>
        <time dateTime="2019">2019</time>
      </div>
      <p className="reveal">
        My first official job as a developer was building a large-ish Angular 5
        PWA + PHP (Yii2) backend. That experience involved wearing{" "}
        <span>
          <Popover>
            <PopoverTrigger className="underline" openOnHover>
              multiple hats
            </PopoverTrigger>
            <PopoverContent className="max-w-64 text-sm">
              Many of which had nothing to do with software development
              whatsoever
            </PopoverContent>
          </Popover>
        </span>
        , and it made me understand what it meant to own an entire software
        stack. It was also my first time building an actual "product," as
        opposed to just hobby software or weekend projects; I learned a lot (the
        hard way) about what it takes to build something that people can
        actually use reliably and enjoyably.
      </p>

      <h3 className="reveal">MaxRewards</h3>
      <div className="reveal -mt-2 flex gap-2 text-muted-foreground text-sm">
        <time dateTime="2019">2019</time>
        <span>{"\u2013"}</span>
        <time dateTime="2022">2022</time>
      </div>
      <p className="reveal">
        From there I went on to MaxRewards, where I helped build and maintain a
        large{" "}
        <span>
          <Popover>
            <PopoverTrigger className="underline" openOnHover>
              React Native
            </PopoverTrigger>
            <PopoverContent className="max-w-64 text-sm">
              And met my first love, MobX
            </PopoverContent>
          </Popover>
        </span>{" "}
        app and Node.js backend.
      </p>
      <p className="reveal">
        Most importantly, I got a feel for "hacking" in a garage-mode setting:
        COVID hit the US in full force just a few months into the job, and it
        completely derailed our plans to raise a seed round (VCs were reasonably
        spooked by the potential end of society). During this time, we had to
        use the skills we developed to build our internal bank connectors
        (reverse-engineering, scraping, dealing with C&Ds from Chase) to{" "}
        <span>
          <Popover>
            <PopoverTrigger className="underline" openOnHover>
              feed ourselves
            </PopoverTrigger>
            <PopoverContent className="max-w-64 text-sm">
              Seriously, thank you T-Mobile for T-Mobile Tuesdays and all the
              free Panera gift cards. Thank you Panera for feeding me.
              Unfortunately I will not be patronizing you for the rest of my
              life if I can avoid it
            </PopoverContent>
          </Popover>
        </span>{" "}
        and pay rent. Duking it out with all of those circumstances, launching
        our V2 product, and ultimately raising a successful seed round was
        probably the most formative experience of my career.
      </p>

      <h3 className="reveal">Studio HMR</h3>
      <div className="reveal -mt-2 flex gap-2 text-muted-foreground text-sm">
        <time dateTime="2022">2022</time>
        <span>{"\u2013"}</span>
        <time dateTime={CURRENT_YEAR.toString()}>now</time>
      </div>
      <p className="reveal">
        As appreciative as I am today of all that I had learned and experienced
        at MaxRewards, I burned out pretty hard and needed a change. I created
        Studio HMR as a space for me to start exploring my own product ideas and
        to hopefully soft-launch some gamedev projects that I had been
        discussing with friends and former colleagues. We still haven't gotten
        around to actually{" "}
        <Popover>
          <PopoverTrigger className="underline" openOnHover>
            publishing a game
          </PopoverTrigger>
          <PopoverContent className="max-w-72 text-sm">
            Eyeboy WILL release in
            <br />
            <code className="rounded bg-foreground p-1 font-medium text-[10px] text-background/80">
              {/** biome-ignore lint/suspicious/noTemplateCurlyInString: is intentional dear sir */}
              {"${new Date().getFullYear() + 1}"}
            </code>
          </PopoverContent>
        </Popover>{" "}
        yet, but hey, I have a lot of cool concept art now.
      </p>

      <h3 className="reveal">{CURRENT_WORKPLACE}</h3>
      <div className="reveal -mt-2 flex gap-2 text-muted-foreground text-sm">
        <time dateTime="2023">2023</time>
        <span>{"\u2013"}</span>
        <time dateTime={CURRENT_YEAR.toString()}>now</time>
      </div>
      <p className="reveal font-black">YOU (WE?) ARE HERE.</p>

      <h2 className="reveal">About this website</h2>
      <p className="reveal">
        I enjoy building things, both in real life and in the digital realm.
        This website is my personal blog and playground for experimenting with
        different web tech and design ideas. You'll see a mix of technical
        posts, ramblings, rants, reviews, and (sometimes bizarre) demos.
      </p>

      <p className="reveal">Thanks for stopping by!</p>

      <div className="reveal mb-24">
        <p className="mb-0 text-sm">Signed,</p>
        <Suspense
          fallback={<h2 className="animate-skeleton text-2xl">{"‎"}</h2>}
        >
          <GradientTextReveal
            delay={1}
            className="font-heading"
            text="Ibrahim Saberi"
          />
        </Suspense>
      </div>

      <h2>Frequently Asked Questions</h2>
      <Accordion className="not-prose mb-24 w-full">
        {faqs.map(({ question, answer, id }) => {
          const answers = Array.isArray(answer) ? answer : [answer];
          return (
            <AccordionItem key={id} value={id}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionPanel>
                {answers.map((item, index) => (
                  <p className="mb-2" key={index.toString()}>
                    {item.startsWith("link::") ? (
                      <a
                        href={item.split("::")[1]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {item.split("::")[2]}
                      </a>
                    ) : (
                      item
                    )}
                  </p>
                ))}
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
      <AboutControl />
    </article>
  );
}

type FAQ = {
  question: string;
  answer: string | string[];
  id: string;
};
const faqs: FAQ[] = [
  {
    question: "What's the stack?",
    answer: [
      "Next.js (PPR + cache components), Tailwind, MDX for content, Base UI + coss ui for atoms, and some custom theme colors.",
      "I don't even really like this stack (Suspense boundaries have ruined my life), but, uh, the devil you know or something?",
    ],
    id: "stack",
  },
  {
    question: "What's your favorite stack?",
    answer:
      "Peanut butter and jelly with a glass of cold milk. (Built with MobX)",
    id: "favorite-snack",
  },
  {
    question: "Where's your resume?",
    answer:
      "link::https://georgeipsum.github.io/resume/::For our dear friends who cannot read.",
    id: "resume",
  },
  {
    question: "What's with all the weird terminology?",
    answer:
      "Things are better when they're weird and a tad bit mysterious. My forest. My Basin. My bog.",
    id: "esoteria",
  },
  {
    question: "Why do you write like that?",
    answer: [
      "I'm a David Foster Wallace fan. Unless you meant the immaturity/cringiness, in which case, sorry, I was not socialized right and picked up too many habits from early 2010s tumblr.",
      "It was not for the best. I don't think I will or want to change.",
    ],
    id: "youweird",
  },
  {
    question: "Aren't basins and reservoirs the same thing?",
    answer: [
      "A reservoir is pure imitation: a man-made construct that defies all nature. A basin is a natural geological formation.",
      "A reservoir is a prison for water. A basin is a home.",
    ],
    id: "basin_vs_reservoir",
  },
  {
    question: "Wouldn't the reflection of a reflection be the original?",
    answer: "angles, erneh",
    id: "reflect",
  },
  {
    question: 'What does "a whisper, a wave" mean?',
    answer:
      "You can't just ask people what \"a whisper, a wave\" means. Won't anyone think of the children?",
    id: "a_whisper__a_wave",
  },
  {
    question: "You are so cool. Can I give you one million dollars?",
    answer: "hey this mf spittin",
    id: "cash",
  },
];

export const metadata: Metadata = {
  title: "about",
  description: "A little bit about me (Ibrahim Saberi) and this website.",
};
