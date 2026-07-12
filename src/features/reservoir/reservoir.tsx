"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/tabs";
import { useIsMobile } from "@/hooks/use-media-query";
import { SiteProjectFrame } from "./components/site";
import { siteProjects } from "./data/site-projects";

export const Reservoir: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <Tabs
      className="relative w-full flex-col-reverse pt-2 md:flex-row md:pt-6"
      defaultValue="site"
      orientation={!isMobile ? "vertical" : "horizontal"}
    >
      <TabsContent value="site" className="w-full">
        {/* TODO: I can opt a lot of this back into SSR by making this a slot I think */}
        {siteProjects.map((project) => (
          <SiteProjectFrame key={project.name} project={project} />
        ))}
      </TabsContent>
      <TabsContent value="github" className="w-full">
        <div className="flex w-full items-center justify-center rounded-2xl bg-card p-20">
          SoonTM
        </div>
      </TabsContent>
      <div className="max-md:w-full">
        <TabsList
          variant="underline"
          className="max-md:border-b md:sticky md:top-20 md:border-s"
          noIndicator={!isMobile}
        >
          {/* dumb hacks below - in order to have both sticky position + absolute position we have to ditch the indicator component in desktop and simulate */}
          <div className="max-md:flex md:absolute md:top-0 md:left-full">
            <TabsTrigger
              value="site"
              className="md:rounded-none md:border-primary md:border-t-0 md:border-r-0 md:border-b-0 md:border-l md:data-active:border-l-2"
            >
              On This Site
            </TabsTrigger>
            <TabsTrigger
              value="github"
              className="md:rounded-none md:border-primary md:border-t-0 md:border-r-0 md:border-b-0 md:border-l md:data-active:border-l-2"
            >
              GitHub
            </TabsTrigger>
          </div>
        </TabsList>
      </div>
    </Tabs>
  );
};
