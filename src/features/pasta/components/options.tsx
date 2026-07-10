import { Search } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/atoms/combobox";
import { SelectButton } from "@/components/atoms/select";
import { allSauce } from "../pasta";
import { OptionsList } from "./options-list";

const handleSelect = async (item: { label: string; value: string } | null) => {
  "use server";
  if (!item) {
    redirect("/pasta");
  }
  redirect(`/pasta?noodle=${item.value}`);
};

const sauce = allSauce.map((s) => ({
  label: s.replace(/[-_]/g, " "),
  value: s,
}));

export const PastaOptions: React.FC<{
  searchParams: Promise<{ noodle?: string }>;
}> = ({ searchParams }) => {
  return (
    <Suspense fallback={<div>Loading options...</div>}>
      <PastaValue searchParams={searchParams} />
    </Suspense>
  );
};

const PastaValue: React.FC<{
  searchParams: Promise<{ noodle?: string }>;
}> = async ({ searchParams }) => {
  const params = await searchParams;

  return (
    <Combobox
      items={sauce}
      onValueChange={handleSelect}
      defaultValue={
        params.noodle
          ? { label: params.noodle, value: params.noodle }
          : undefined
      }
    >
      <ComboboxTrigger render={<SelectButton />}>
        <ComboboxValue placeholder="The tummy rumbles..." />
      </ComboboxTrigger>
      <ComboboxPopup aria-label="Select some pasta">
        <div className="border-border border-b p-2">
          <ComboboxInput
            className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
            placeholder="mmm... tastey..."
            showTrigger={false}
            type="search"
            startAddon={<Search />}
          />
        </div>
        <ComboboxEmpty>No pasta found :(</ComboboxEmpty>
        <OptionsList />
      </ComboboxPopup>
    </Combobox>
  );
};
