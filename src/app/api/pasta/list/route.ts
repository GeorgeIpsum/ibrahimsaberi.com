import { NextResponse } from "next/server";
import { copypasta } from "../../health/route";

export const GET = async () => {
  return NextResponse.json(
    copypasta.map((item) => item.title.replace(/\.txt$/, "")),
    {},
  );
};
