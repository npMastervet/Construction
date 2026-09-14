import React from "react";
import { Outlet } from "react-router";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import BackToHome from "@/components/ui/backToHome";
import AccountDropdown from "@/workspace/components/AccountDropdown";

const LayoutExternal = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-6 ">
        <div className="flex justify-between">
          <div className="flex gap-4">
            <BackToHome />
          </div>
          <div className="flex items-center gap-2">
            <AccountDropdown />
            <ThemeToggle />
          </div>
        </div>
        <main className="mt-8 flex justify-center">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LayoutExternal;
