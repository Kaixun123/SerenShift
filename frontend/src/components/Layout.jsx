import React from "react";
import SideBar from "./Sidebar";
import TopHeader from "./TopHeader";

export const Layout = () => {
  return (
    <div className="h-screen flex flex-row justify-start">
      <SideBar />
      <div className="flex flex-col w-full gap-[30px]">
        <TopHeader />
        <div className="bg-white px-[30px]  flex-1 text-gray-primary border-1 border-dashed">
          content
        </div>
      </div>
    </div>
  );
};
