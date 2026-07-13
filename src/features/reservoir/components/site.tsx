import { Link2 } from "lucide-react";
import { cacheTag, revalidateTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
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
import { siteProjects } from "../data/site-projects";
import type { SiteProject } from "../types";

const getRootLastUpdated = async (root: string) => {
  "use cache";
  cacheTag("site-project-last-updated");
  const res = await fetch(`${REPO_API_URL}/commits?path=${root}`, {
    cache: "force-cache",
  });
  const commits = await res.json();
  if (commits?.message?.startsWith("API rate limit exceeded")) {
    console.error("GitHub API rate limit exceeded. Please try again later.");
    throw new Error("API rate limit exceeded");
  }
  if (!Array.isArray(commits) || commits.length === 0) return null;
  const lastCommit = commits[0];
  return lastCommit.commit.author.date as number;
};

// busts only on deploy lol
const getProjectLastUpdated = async (project: SiteProject) => {
  "use cache";
  cacheTag("site-projects-last-updated");
  const lastUpdated = (
    await Promise.all(project.roots.map(getRootLastUpdated))
  ).filter(Boolean);

  const lastUpdatedDate =
    lastUpdated.length > 0
      ? new Date(
          Math.max(...lastUpdated.map((date) => new Date(date ?? 0).getTime())),
        )
      : null;

  return lastUpdatedDate?.toLocaleDateString() ?? "unknown";
};

const SiteProjectLastUpdated: React.FC<{ project: SiteProject }> = async ({
  project,
}) => {
  const lastUpdated = await getProjectLastUpdated(project).catch(
    () => "rate limited :(",
  );

  return (
    <div
      className={cn(
        "relative transition-[width,color] duration-500",
        "w-fit text-primary",
      )}
    >
      {lastUpdated}
    </div>
  );
};

const SiteProjectFrame: React.FC<{ project: SiteProject }> = async ({
  project,
}) => {
  return (
    <Frame className="mb-2 w-full">
      <FrameHeader>
        <div className="flex w-full items-start justify-start gap-3">
          {project.Icon}
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
        <div className="mb-2 flex items-center gap-5 max-md:flex-col md:mb-6 md:items-start">
          <div className="flex w-full items-center justify-center md:w-20">
            <Image
              title={project.imageTitle ?? project.imageAlt}
              src={project.image}
              alt={project.imageAlt ?? project.name}
              className={cn(
                "rounded-lg object-cover shadow-card shadow-xl md:size-20",
                project.imagePosition,
              )}
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
          <Suspense
            fallback={
              <div
                className={cn(
                  "relative transition-[width,color] duration-500",
                  "w-16.5",
                )}
              >
                <LoadingText className="gap-1 text-muted-foreground">
                  loading
                </LoadingText>
              </div>
            }
          >
            <SiteProjectLastUpdated project={project} />
          </Suspense>
        </div>
      </FrameFooter>
    </Frame>
  );
};

export const SiteProjects: React.FC = () => {
  return (
    <>
      {siteProjects.map((project) => (
        <SiteProjectFrame key={project.name} project={project} />
      ))}
    </>
  );
};
