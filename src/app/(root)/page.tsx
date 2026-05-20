import { UnderConstruction } from "@/components/navigation/under-construction";

export default function Page() {
  return (
    <>
      <UnderConstruction title="Home" />

      <div className="mb-4 flex flex-col gap-4">
        <h1 className="text-2xl">
          Ibrahim Saberi{" "}
          <span className="text-muted-foreground text-sm">presents</span>
        </h1>
        <section>
          <h2 className="text-xl">A Website</h2>
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
    </>
  );
}
