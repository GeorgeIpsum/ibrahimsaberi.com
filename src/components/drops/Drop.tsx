import { DropMdx } from ".";
import type { Post } from "./types";

const Drop: React.FC<Post> = ({ content, authorUsername, meta }) => {
  return <DropMdx source={content} />;
};

export default Drop;
