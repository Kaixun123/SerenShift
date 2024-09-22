import Link from "next/link";
import {
  CalendarMonthRounded,
  PeopleAltRounded,
  ArticleRounded,
} from "@mui/icons-material";

export default function SideBar() {
  const menuItems = [
    {
      href: "/",
      icon: CalendarMonthRounded,
      title: "Own Calendar",
    },
    {
      href: "/schedule/team",
      icon: PeopleAltRounded,
      title: "Team Calendar",
    },
    {
      href: "/new/schedule",
      icon: ArticleRounded,
      title: "New Schedule",
    },
  ];

  return (
    <div className="h-screen flex flex-col border-r border-r-gray-secondary w-[250px]">
      <div className="flex h-[100px] p-5 items-center justify-center border-b border-b-gray-secondary">
        ICON PUT HERE
      </div>
      <div className="flex flex-col p-5 gap-5">
        {menuItems.map(({ href, icon: Icon, title }) => (
          <div className="flex gap-3" key={title}>
            <Icon />
            <Link href={href}>{title}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
