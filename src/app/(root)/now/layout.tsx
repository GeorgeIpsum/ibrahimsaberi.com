import "maplibre-gl/dist/maplibre-gl.css";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
