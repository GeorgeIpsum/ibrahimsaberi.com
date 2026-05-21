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
import { GradientTextReveal } from "@/components/special/gradient-text-reveal";
import { HelloGradient } from "@/components/special/hello";

const CURRENT_YEAR = new Date().getFullYear();

export default function Page() {
  return (
    <div className="prose mx-auto min-h-[calc(100svh-10rem)] px-2">
      <div className="mb-8 flex">
        <Suspense
          fallback={<h1 className="animate-skeleton text-3xl">{"‎"}</h1>}
        >
          <HelloGradient />
        </Suspense>
      </div>
      <p className="reveal">
        I'm <span className="font-bold">Ibrahim</span>, a product-focused
        software engineer based in Bethesda, Maryland. I currently work as a{" "}
        <span className="font-bold">product owner</span> at{" "}
        <span className="font-bold font-heading">
          <a
            href="https://tillisoftware.com"
            target="_blank"
            rel="noopener noreferrer"
            title="sorry that this website is so jank. I don't have the bandwidth to make it better at the moment, and so you have to deal with this vibe coded slop"
          >
            tilli software
          </a>
        </span>
        , where I've built out our consumer-facing products and own the
        company's overall product strategy. My team is also responsible for
        investigating new tech, solving really weird problems, and building
        internal tooling to connect our different products and teams.
      </p>

      <h2 className="reveal">Sparking joy</h2>
      <p className="reveal">More like parking toy amirite fellas</p>

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
              many of which had nothing to do with software development
              whatsoever
            </PopoverContent>
          </Popover>
        </span>
        , and it made me really understand and enjoy owning an entire software
        stack. It was also my first time building an actual "product," as
        opposed to just hobby software or weekend projects, and I learned a lot
        (the hard way) about what it takes to build something that real users
        can use reliably and enjoyably.
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
              and met my first love, MobX
            </PopoverContent>
          </Popover>
        </span>{" "}
        app and Node.js backend. Most importantly, I got a real feel for
        "hacking" in a garage-mode setting: COVID hit the US in full force just
        a few months into the job, and it completely derailed our plans to raise
        a seed round (VCs were reasonably spooked by the potential end of
        society). During this time, we had to use the skills we developed to
        build our internal bank connectors (reverse-engineering, scraping,
        dealing with C&Ds from Chase) to{" "}
        <span>
          <Popover>
            <PopoverTrigger className="underline" openOnHover>
              feed ourselves
            </PopoverTrigger>
            <PopoverContent className="max-w-64 text-sm">
              seriously, thank you T-Mobile for T-Mobile Tuesdays and all the
              free Panera gift cards
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
        <time dateTime={CURRENT_YEAR.toString()}>{CURRENT_YEAR}</time>
      </div>
      <p className="reveal">
        As appreciative as I am today, I was pretty burnt out at this point. I
        created Studio HMR as a space for me to start exploring my own product
        ideas and to hopefully soft-launch some gamedev projects that I had been
        discussing with friends and former colleagues. We still haven't gotten
        around to actually publishing a game yet, but hey, I have a lot of cool
        concept art now.
      </p>

      <h3 className="reveal">tilli software</h3>
      <div className="reveal -mt-2 flex gap-2 text-muted-foreground text-sm">
        <time dateTime="2023">2023</time>
        <span>{"\u2013"}</span>
        <time dateTime={CURRENT_YEAR.toString()}>{CURRENT_YEAR}</time>
      </div>
      <p className="reveal font-black">YOU (WE?) ARE HERE.</p>

      <h2 className="reveal">About this website</h2>
      <p className="reveal">
        I enjoy building things, whether it be in real life or the digital
        realm. This website is my personal blog and playground for experimenting
        with different web tech and design ideas. You'll see a mix of technical
        posts, ramblings, rants, and (sometimes bizarre) tech demos.
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

      <h2>Frequenly Asked Questions</h2>
      <Accordion className="not-prose mb-24 w-full">
        {faqs.map(({ question, answer, id }) => (
          <AccordionItem key={id} value={id}>
            <AccordionTrigger>{question}</AccordionTrigger>
            <AccordionPanel>
              {Array.isArray(answer) ? (
                answer.map((item, index) => (
                  <p className="mb-2" key={index.toString()}>
                    {item}
                  </p>
                ))
              ) : (
                <p className="mb-2">{answer}</p>
              )}
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
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
      "I don't even really like this stack (Suspense boundaries have ruined my life), but hey, the devil you know",
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
    question: "What's with all the weird terminology?",
    answer:
      "Things are better when they're weird and a tad bit mysterious. This is, in fact, my swamp. And the bog water will flow.",
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
  description: "A little bit about me and this website.",
};
