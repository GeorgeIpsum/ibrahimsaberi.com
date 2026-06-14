import { Title } from "@/components/structure/title";

const ASCII_ART = `       _..._
     .::'   \`.
    :::       :
    :::       :
    \`::.     .'
      \`':..-'
`;

export default function Page() {
  return (
    <div className="mb-4 flex flex-col gap-4 text-sm">
      <div className="relative -mx-4 overflow-hidden rounded-2xl">
        <div className="mx-4">
          <Title
            className="text-2xl"
            art={{
              ascii: ASCII_ART,
              anchor: "right",
              offset: { x: -6 },
              color: "#F8C523",
            }}
          >
            Ibrahim Saberi{" "}
            <span className="text-muted-foreground text-sm">presents</span>
          </Title>
        </div>
      </div>
      <section>
        <h2 className="text-xl">A Website</h2>
        <div>I love hacking. I hate yakking.</div>
      </section>
      <section>
        <h2 className="text-xl">A Basin</h2>
      </section>
      <section>
        <h2 className="text-xl">A Reservoir</h2>
      </section>
      <section>
        <h2 className="text-xl">A Sandbox</h2>
      </section>
      <section>
        <h2 className="text-xl">A Station</h2>
      </section>
      <section>
        <h2 className="text-xl">A Whisper. A Wave.</h2>
      </section>
    </div>
  );
}
