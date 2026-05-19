import { Construction } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";

interface UnderConstructionProps {
  title: string;
}
export const UnderConstruction: React.FC<UnderConstructionProps> = ({
  title,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}: Under Construction</CardTitle>
        <CardDescription>Come back soon!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-44 w-full items-center justify-center rounded bg-muted">
          <Construction className="size-16 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};
