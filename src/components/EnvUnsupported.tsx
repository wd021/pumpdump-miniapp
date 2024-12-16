import { Placeholder, AppRoot } from "@telegram-apps/telegram-ui";
import {
  retrieveLaunchParams,
  isColorDark,
  isRGB,
} from "@telegram-apps/sdk-react";
import { useMemo } from "react";
import { publicUrl } from "@/helpers/publicUrl";

export function EnvUnsupported() {
  const [platform, isDark] = useMemo(() => {
    let platform = "base";
    let isDark = false;
    try {
      const lp = retrieveLaunchParams();
      const { bgColor } = lp.themeParams;
      platform = lp.platform;
      isDark = bgColor && isRGB(bgColor) ? isColorDark(bgColor) : false;
    } catch {
      /* empty */
    }

    return [platform, isDark];
  }, []);

  return (
    <AppRoot
      appearance={isDark ? "dark" : "light"}
      platform={["macos", "ios"].includes(platform) ? "ios" : "base"}
    >
      <Placeholder
        header="Oops"
        description="Open the Pump Dump bot in Telegram to use it"
      >
        <a
          href="https://t.me/pumpdumpbot"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            alt="Telegram sticker"
            src={publicUrl("logo.png")}
            style={{ display: "block", width: "144px", height: "144px" }}
          />
        </a>
      </Placeholder>
    </AppRoot>
  );
}
