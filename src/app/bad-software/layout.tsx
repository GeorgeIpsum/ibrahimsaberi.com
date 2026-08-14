import { GlobalLayout } from "@/components/structure/global-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <GlobalLayout header="The Wall of Shame">{children}</GlobalLayout>;
}
