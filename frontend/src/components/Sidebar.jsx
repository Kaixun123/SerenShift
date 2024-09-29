"use client";
import Link from "next/link";
import { Image, Button, useToast } from "@chakra-ui/react";
import { useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";

// react icon
import { IoCalendarOutline } from "react-icons/io5";
import { BsPeople } from "react-icons/bs";
import { CiViewList } from "react-icons/ci";

export default function SideBar() {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const menuItems = [
    {
      id: 1,
      href: "/schedule/own",
      icon: IoCalendarOutline,
      title: "Own Calendar",
    },
    {
      id: 2,
      href: "/schedule/team",
      icon: BsPeople,
      title: "Team Calendar",
    },
    {
      id: 3,
      href: "/application/create",
      icon: CiViewList,
      title: "New Application",
    },
  ];

  const activeMenu = useMemo(
    () => menuItems.find((menu) => menu.href === pathname),
    [pathname]
  );

  const handleLogout = async () => {
    console.log("Logout clicked");
    let response = await fetch("/api/auth/logout", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (response.ok) {
      toast({
        title: "Logout Success",
        description: "Thank you for using our service",
        status: "success",
        isClosable: true,
      });
      router.push("/auth/login");
    } else {
      console.error("Login failed");
      // Handle login failure here (e.g., show an error message)
      toast({
        title: "Logout Failed",
        description: "An error has occured. Please try again later",
        status: "error",
        isClosable: true,
      });
    }
  };

  return (
    <div className="min-h-screen w-[250px] flex flex-col border-r border-r-gray-secondary ">
      <div className="flex h-[100px] p-5 items-center justify-center border-b border-b-gray-secondary">
        <Image
          src="/serenShiftLogo.jpg"
          alt="Logo"
          boxSize="60px"
          borderRadius="full"
          objectFit="contain"
        />
      </div>

      <div className="flex flex-col">
        {menuItems.map(({ icon: Icon, ...menu }) => {
          const extraClass =
            activeMenu.id === menu.id ? "text-blue-primary bg-blue-100" : "";

          return (
            <div
              className={`p-5 cursor-pointer w-full hover:bg-light-secondary overflow-hidden whitespace-nowrap ${extraClass}`}
              key={menu.title}
            >
              <Link href={menu.href} className="flex gap-3 items-center">
                <Icon className="w-5 h-5" />
                {menu.title}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Logout Button */}
      <div className="mt-auto px-5 py-7">
        <Button
          className="w-full p-1 text-red-secondary border border-red-secondary rounded-md"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
