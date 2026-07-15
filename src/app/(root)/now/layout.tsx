import { PageTitle } from "@/components/structure/title";
import "maplibre-gl/dist/maplibre-gl.css";

export default function Layout({ children }: LayoutProps<"/now">) {
  return (
    <>
      <PageTitle title="/now">{"/now"}</PageTitle>
      {children}
    </>
  );
}
