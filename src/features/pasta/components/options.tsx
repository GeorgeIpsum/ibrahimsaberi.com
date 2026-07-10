import { allSauce } from "../pasta";
import { PastaCombobox } from "./pasta-combobox";

const sauce = allSauce.map((s) => ({
  label: s.replace(/[-_]/g, " "),
  value: s,
}));

export const PastaOptions: React.FC<{ noodle?: string }> = ({ noodle }) => {
  return (
    <PastaCombobox
      items={sauce}
      defaultValue={
        noodle
          ? (sauce.find((s) => s.value === noodle) ?? {
              label: noodle,
              value: noodle,
            })
          : undefined
      }
    />
  );
};
