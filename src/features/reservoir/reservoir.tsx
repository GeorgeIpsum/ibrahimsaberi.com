"use client";

import Image from "next/image";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/tabs";
import { useIsMobile } from "@/hooks/use-media-query";

export const Reservoir: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <Tabs
      className="relative w-full flex-col-reverse pt-2 md:flex-row md:pt-6"
      defaultValue="site"
      orientation={isMobile ? "horizontal" : "vertical"}
    >
      <TabsContent value="site" className="w-full">
        <Image
          width={1200}
          height={630}
          src="/reflection/opengraph-image"
          alt="Description"
          className="w-fit"
        />
        <div className="h-1000"></div>
      </TabsContent>
      <TabsContent value="github" className="w-full">
        asdfasdfasdf
      </TabsContent>
      <div className="max-md:w-full md:sticky md:left-full">
        <TabsList
          variant="underline"
          className="max-md:border-b md:sticky md:top-20 md:border-s"
        >
          <TabsTrigger value="site">On This Site</TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
  );
};
