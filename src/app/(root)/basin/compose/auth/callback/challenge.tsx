export default async function Challenge({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;

  return (
    <pre>
      <code>{JSON.stringify(params, null, 2)}</code>
    </pre>
  );
}
