import { NextResponse } from "next/server";
import { allSauce } from "@/features/pasta";

export const GET = async () => {
  return NextResponse.json(allSauce, {});
};
