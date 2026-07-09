"use client";

import type { LucideIcon } from "lucide-react";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/atoms/frame";
import { REPO_API_URL } from "@/services/github/repo";

interface SiteProject {
  name: string;
  url: `/${string}`;
  imageHref: `/${string}`;
  Icon: LucideIcon;
}
