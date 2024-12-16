import type { ComponentType, JSX } from "react";

import IndexPage from "@/pages/IndexPage/IndexPage";
import { PrivacyPage } from "@/pages/PrivacyPage/PrivacyPage";

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: "/", Component: IndexPage },
  { path: "/privacy", Component: PrivacyPage },
];
