import Link from "next/link";

// import {
//   CalendarMonthRounded,
//   PeopleAltRounded,
//   ArticleRounded,
// } from "@mui/icons-material";

export default function SideBar() {
  const menuItems = [
    {
      href: "/",
      title: "Own Calendar",
    },
    {
      href: "/team",
      title: "Team Calendar",
    },
    {
      href: "/new-schedule",
      title: "New Schedule",
    },
  ];

  return (
    <div className="h-screen flex flex-col border-r border-r-gray-secondary w-[300px]">
      <div className="flex h-[100px] p-5 items-center justify-center border-b border-b-gray-secondary">
        ICON PUT HERE
      </div>
      <div className="flex flex-col p-5 gap-5">
        {menuItems.map(({ href, title }) => (
          <div key={title}>
            <Link href={href}>{title}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
