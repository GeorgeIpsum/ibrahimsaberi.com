import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";

export default function Layout({ children }: LayoutProps<"/now">) {
  return <>{children}</>;
}
