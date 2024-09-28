"use client";
import Link from "next/link";
import {
  CalendarMonthRounded,
  PeopleAltRounded,
  ArticleRounded,
} from "@mui/icons-material";
import { Image, Button, useToast } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

export default function SideBar() {
  const route = useRouter();
  const toast = useToast();

  const menuItems = [
    {
      href: "/schedule/own",
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
      route.push("/auth/login");
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

      <div className="flex flex-col p-5 gap-5 flex-grow-0 flex-shrink-0">
        {menuItems.map(({ href, icon: Icon, title }) => (
          <div className="flex gap-3" key={title}>
            <Icon />
            <Link href={href}>{title}</Link>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <div className="mt-auto px-5 py-7">
        <Button
          colorScheme="red"
          variant="outline"
          width="full"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
