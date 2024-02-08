import dynamic from "next/dynamic";
import { cookies } from "next/headers";

import { cookie } from "@/_server/utils";

const ThemeToggleSsr = dynamic(() => import("./ThemeToggle"), {
  ssr: false,
  loading: () => {
    const themeCookie = cookie(cookies).theme.get();
    return <input readOnly type="checkbox" checked={themeCookie === "dark"} />;
  },
});

export default ThemeToggleSsr;
