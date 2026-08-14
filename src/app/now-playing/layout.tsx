import { GlobalLayout } from "@/components/structure/global-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <GlobalLayout header="Now Playing">{children}</GlobalLayout>;
}
