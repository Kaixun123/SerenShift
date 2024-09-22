import React from "react";

export default function TopHeader() {
  return (
    <div className="flex h-[100px] px-[30px] py-5 border-b border-b-gray-secondary items-center justify-between">
      <div className="flex flex-col">
        <div className="text-3xl font-bold">Main text</div>
        <div className="font-medium">sub text</div>
      </div>
      <div>profile section</div>
    </div>
  );
}
