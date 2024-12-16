import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";

import { Root } from "@/components/Root.tsx";
import { EnvUnsupported } from "@/components/EnvUnsupported.tsx";
import { init } from "@/init.ts";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

import "@telegram-apps/telegram-ui/dist/styles.css";
import "./index.css";

// Mock the environment in case, we are outside Telegram.
import "./mockEnv.ts";

const root = ReactDOM.createRoot(document.getElementById("root")!);

posthog.init("phc_4LeJ7zOqnqsUhsav6dSoMQ5m1qsIKGKUx6xCPGZhY9f", {
  api_host: "https://us.i.posthog.com",
  person_profiles: "identified_only",
});

try {
  // Configure all application dependencies.
  init(retrieveLaunchParams().startParam === "debug" || import.meta.env.DEV);

  root.render(
    <StrictMode>
      <PostHogProvider
        apiKey="phc_4LeJ7zOqnqsUhsav6dSoMQ5m1qsIKGKUx6xCPGZhY9f"
        options={{ api_host: "https://us.i.posthog.com" }}
      >
        <Root />
      </PostHogProvider>
    </StrictMode>
  );
} catch (e) {
  root.render(<EnvUnsupported />);
}
