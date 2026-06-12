import { Droplet } from "lucide-react";
import { UnderConstruction } from "@/components/navigation/under-construction";

export default function Page() {
  return (
    <>
      <div className="group mb-8 flex w-auto items-center gap-2">
        {/* <Icon
          className="size-12 text-amber-900 opacity-10 transition-opacity duration-500 group-hover:opacity-40 dark:text-amber-200"
          aria-hidden="true"
          iconNode={waveCircle}
        /> */}
        <Droplet
          className="size-12 rounded-full bg-radial from-transparent to-amber-500/10 text-amber-900 opacity-10 shadow-amber-900/50 shadow-inner blur-[2px] transition-all duration-500 group-hover:opacity-30 group-hover:blur-none dark:text-amber-200"
          aria-hidden="true"
        />
        <h1
          className="relative -left-6 cursor-default text-3xl leading-7.5 tracking-tight"
          title="forming waves"
        >
          <span className="opacity-50 transition-all duration-500 group-hover:opacity-100">
            d
          </span>
          <span className="opacity-55 transition-all duration-500 group-hover:opacity-100">
            r
          </span>
          <span className="opacity-70 transition-all duration-500 group-hover:opacity-100">
            o
          </span>
          <span className="opacity-85 transition-all duration-500 group-hover:opacity-100">
            p
          </span>
          <span className="opacity-90 transition-all duration-500 group-hover:opacity-100">
            l
          </span>
          <span className="opacity-100 transition-all duration-500 group-hover:opacity-100">
            e
          </span>
          <span className="opacity-100 transition-all duration-500 group-hover:opacity-100">
            t
          </span>
          <span className="opacity-100 transition-all duration-500 group-hover:opacity-100">
            s
          </span>
        </h1>
      </div>
      <UnderConstruction title="Droplets">
        <p>Journals coming soon...</p>
      </UnderConstruction>
    </>
  );
}
