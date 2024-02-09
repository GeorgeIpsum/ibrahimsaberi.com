import dynamic from "next/dynamic";
import { cookies } from "next/headers";

import { cookie } from "@/_server/utils";

const ThemeToggleSsr = dynamic(() => import("./ThemeToggle"), {
  ssr: false,
  loading: () => {
    const themeCookie = cookie(cookies).theme.get();
    return (
      <input
        className="switch theme"
        readOnly
        type="checkbox"
        defaultChecked={themeCookie === "dark"}
      />
    );
  },
});

export default ThemeToggleSsr;
