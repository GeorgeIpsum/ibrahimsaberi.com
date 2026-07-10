"use client";

import { Link2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/atoms/frame";
import { LoadingText } from "@/components/text";
import { cn } from "@/css/lib";
import { REPO_API_URL, REPO_URL } from "@/services/github/repo";
import type { SiteProject } from "../types";

export const SiteProjectFrame: React.FC<{ project: SiteProject }> = ({
  project,
}) => {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  return (
    <Frame className="mb-2 w-full">
      <FrameHeader>
        <div className="flex w-full items-start justify-start gap-3">
          <project.Icon className="size-4" />
          <div className="-mt-1 flex-1">
            <FrameTitle>{project.name}</FrameTitle>
            <FrameDescription className="text-xs">
              {project.description}
            </FrameDescription>
          </div>
          <Link href={project.url}>
            <Link2 className="size-4" />
          </Link>
        </div>
      </FrameHeader>
      <FramePanel>
        <div className="mb-2 flex items-center gap-5 max-md:flex-col md:mb-6">
          <div className="flex w-full items-center justify-center md:-mt-3 md:-ml-3 md:w-1/3">
            <Image
              title={project.imageTitle ?? project.imageAlt}
              src={project.imageHref}
              alt={project.imageAlt ?? project.name}
              width={1200}
              height={630}
              className="w-fit rounded-lg"
              placeholder="blur"
            />
          </div>
          <div className="flex-1 text-xs">
            {project.notes.map((note, index) => (
              <p
                className="mb-2 max-md:text-center md:mb-1.5"
                key={index.toString()}
              >
                {note}
              </p>
            ))}
          </div>
        </div>
        <div className="flex gap-2 max-md:flex-col">
          <div className="w-full text-muted-foreground text-sm md:w-1/3 md:pr-4 md:text-right">
            relevant repo paths:
          </div>
          <div className="flex-1 self-end rounded-lg bg-card p-2 text-right text-muted-foreground text-xs max-md:w-full">
            {project.roots.map((root, index) => (
              <code className="block max-md:py-1" key={index.toString()}>
                <Link href={`${REPO_URL}/tree/main/${root}`}>
                  {root || "./"}
                </Link>
              </code>
            ))}
          </div>
        </div>
      </FramePanel>
      <FrameFooter className="pt-2 pb-1 text-right text-muted-foreground text-xs lowercase">
        <div className="flex w-full items-center justify-end gap-2">
          <div>Last Updated:</div>
          <div
            className={cn(
              "relative transition-[width,color] duration-500",
              lastUpdated ? "w-fit text-primary" : "w-16.5",
            )}
          >
            {lastUpdated ?? (
              <LoadingText className="gap-1 text-muted-foreground">
                loading
              </LoadingText>
            )}
          </div>
        </div>
      </FrameFooter>
    </Frame>
  );
};
