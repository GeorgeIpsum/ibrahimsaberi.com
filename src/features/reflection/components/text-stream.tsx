import { TokenStream, type TokenStreamProps } from "@/components/text";

export const TextStream: React.FC<TokenStreamProps> = (props) => (
  <div className="mx-auto flex h-full w-full items-center justify-center md:w-1/2">
    <TokenStream {...props} />
  </div>
);
