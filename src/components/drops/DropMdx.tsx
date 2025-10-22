import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import remarkUnwrapImages from "remark-unwrap-images";

import * as components from "@/components/mdx";

const DropMdx: React.FC<MDXRemoteProps> = ({ source, ...props }) => {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkUnwrapImages],
          rehypePlugins: [rehypePrettyCode as any],
        },
      }}
      {...props}
    />
  );
};

export default DropMdx;
