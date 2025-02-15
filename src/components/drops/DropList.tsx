import { DropItem } from ".";
import { Container } from "../atoms";
import type { Post } from "./types";

interface DropListProps {
  drops: Post[];
}
const DropList: React.FC<DropListProps> = ({ drops }) => {
  if (!drops.length) {
    return <Container padding="lg">None Found.</Container>;
  }
  return drops.map((drop) => <DropItem key={drop.slug} {...drop} />);
};

export default DropList;
