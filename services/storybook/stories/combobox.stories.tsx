import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
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
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A searchable, filterable input paired with a popup list of selectable options.",
      },
    },
  },
  args: { disabled: false },
  argTypes: { disabled: { control: "boolean" } },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

function FrameworkCombobox({
  disabled,
}: {
  disabled?: boolean;
}): React.ReactElement {
  const filter = useComboboxFilter();

  return (
    <Combobox disabled={disabled} filter={filter.contains} items={frameworks}>
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

function MultiFrameworkCombobox(): React.ReactElement {
  const filter = useComboboxFilter();

  return (
    <Combobox
      defaultValue={["Next.js", "Remix"]}
      filter={filter.contains}
      items={frameworks}
      multiple
    >
      <div className="w-72">
        <ComboboxChips>
          <ComboboxValue>
            {(value: string[]) => (
              <>
                {value.map((item) => (
                  <ComboboxChip key={item}>{item}</ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder="Search framework..." />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
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
  render: (args) => <FrameworkCombobox disabled={args.disabled} />,
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

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <FrameworkCombobox disabled={args.disabled} />,
};

export const Multiple: Story = {
  render: () => <MultiFrameworkCombobox />,
};

export const SelectsFramework: Story = {
  render: () => <FrameworkCombobox />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole("combobox");
    await userEvent.click(input);
    const screen = within(document.body);
    await userEvent.click(await screen.findByRole("option", { name: "Astro" }));
    await waitFor(() => expect(input).toHaveValue("Astro"));
  },
};
