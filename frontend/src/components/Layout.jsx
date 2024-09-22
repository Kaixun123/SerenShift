import React from "react";
import SideBar from "./Sidebar";

export const Layout = ({ children }) => {
  return (
    <div className="h-screen flex flex-row justify-start">
      <SideBar />
      <div className="w-full bg-white border-1 border-dashed">{children}</div>
    </div>
  );
};
