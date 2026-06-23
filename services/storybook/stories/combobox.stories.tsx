import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  useComboboxFilter,
} from "@/components/atoms/combobox";

const frameworks = [
  "Next.js",
  "Remix",
  "Astro",
  "SvelteKit",
  "Nuxt",
  "SolidStart",
  "Gatsby",
  "Qwik City",
];

const meta = {
  title: "Atoms/Combobox",
  component: Combobox,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

function FrameworkCombobox(): React.ReactElement {
  const filter = useComboboxFilter();

  return (
    <Combobox items={frameworks} filter={filter.contains}>
      <div className="w-64">
        <ComboboxInput placeholder="Search framework..." />
      </div>
      <ComboboxPopup>
        <ComboboxEmpty>No framework found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}

export const Default: Story = {
  render: () => <FrameworkCombobox />,
};

function WithStartAddon(): React.ReactElement {
  const filter = useComboboxFilter();

  return (
    <Combobox items={frameworks} filter={filter.contains}>
      <div className="w-64">
        <ComboboxInput
          placeholder="Search framework..."
          showClear
          startAddon={<Search />}
        />
      </div>
      <ComboboxPopup>
        <ComboboxEmpty>No framework found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}

export const WithSearchIcon: Story = {
  render: () => <WithStartAddon />,
};
