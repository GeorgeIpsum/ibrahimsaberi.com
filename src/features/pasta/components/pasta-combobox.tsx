"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/atoms/combobox";
import { SelectButton } from "@/components/atoms/select";
import { OptionsList } from "./options-list";

export type Sauce = { label: string; value: string };

export const PastaCombobox: React.FC<{
  items: Sauce[];
  defaultValue?: Sauce;
}> = ({ items, defaultValue }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Combobox
      items={items}
      defaultValue={defaultValue}
      onValueChange={(item: Sauce | null) => {
        startTransition(() => {
          router.push(item ? `/pasta/${item.value}` : "/pasta");
        });
      }}
    >
      <ComboboxTrigger render={<SelectButton />}>
        {isPending ? (
          <span className="flex items-center gap-2">
            <LoaderCircle className="animate-spin" />
            Cooking...
          </span>
        ) : (
          <ComboboxValue placeholder="The tummy rumbles..." />
        )}
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
