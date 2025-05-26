import React from "react";
import Sidebar from "../Sidebar";
import { codexNavItems } from "./NavItems";

interface CodexSidebarProps {
  expanded?: boolean;
}

const CodexSidebar: React.FC<CodexSidebarProps> = ({ expanded = false }) => {
  const sidebarConfig = {
    title: "Totem Codex",
    backLink: {
      path: "/guides/codex",
      text: "Back to Guides",
    },
    expanded,
    navItems: codexNavItems
  };
  
  return <Sidebar config={sidebarConfig} />;
};

export default CodexSidebar;