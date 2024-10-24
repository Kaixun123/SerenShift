"use client";
import Link from "next/link";
import {
  Image,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";

// react icons
import { IoCalendarOutline } from "react-icons/io5";
import { BsFileEarmarkPlay, BsPeople } from "react-icons/bs";
import { MdOutlinePendingActions } from "react-icons/md";
import { GrChapterAdd, GrUserManager } from "react-icons/gr";
import { CgList } from "react-icons/cg";
import { FiHome } from "react-icons/fi";
import { MdOutlineManageHistory } from "react-icons/md";
import { AiOutlineSchedule } from "react-icons/ai";

export default function SideBar() {
  const router = useRouter();
  const toast = useToast();
  const pathname = usePathname();
  const [isValidToken, setIsValidToken] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState({
    id: 0,
    role: "",
  })
  const [userRole, setUserRole] = useState(null); // State to store user role

  // For Token Expiry Modal
  const {
    isOpen: isTokenExpiryModalOpen,
    onOpen: onTokenExpiryModalOpen,
    onClose: onTokenExpiryModalClose,
  } = useDisclosure();

  // Define role-based menu items
  const menuItems = {
    HR: [
      {
        id: 1,
        href: "/schedule/own",
        icon: IoCalendarOutline,
        title: "My Calendar",
      },
      {
        id: 2,
        href: "/schedule/team",
        icon: BsPeople,
        title: "Team Calendar",
      },
      {
        id: 3,
        href: "/schedule/subordinate",
        icon: GrUserManager,
        title: "Subordinate Calendar",
      },
      {
        id: 4,
        href: "/application/create",
        icon: GrChapterAdd,
        title: "New Application",
      },
      {
        id: 5,
        href: "/application/own",
        icon: MdOutlinePendingActions,
        title: "Own Applications",
      },
      {
        id: 6,
        href: "/application/manage",
        icon: CgList,
        title: "Manage Applications",
      },
      {
        id: 7,
        href: "/blacklist/manage",
        icon: MdOutlineManageHistory,
        title: "Manage Blacklist Dates",
      },
      {
        id: 8,
        href: "/hr",
        icon: FiHome,
        title: "Company View",
      },
    ],
    Manager: [
      {
        id: 1,
        href: "/schedule/own",
        icon: IoCalendarOutline,
        title: "My Calendar",
      },
      {
        id: 2,
        href: "/schedule/team",
        icon: BsPeople,
        title: "Team Calendar",
      },
      {
        id: 3,
        href: "/schedule/subordinate",
        icon: GrUserManager,
        title: "Subordinate Calendar",
      },
      {
        id: 4,
        href: "/application/create",
        icon: GrChapterAdd,
        title: "New Application",
      },
      {
        id: 5,
        href: "/application/own",
        icon: MdOutlinePendingActions,
        title: "Own Applications",
      },
      {
        id: 6,
        href: "/application/manage",
        icon: CgList,
        title: "Manage Applications",
      },
    ],
    Staff: [
      {
        id: 1,
        href: "/schedule/own",
        icon: IoCalendarOutline,
        title: "My Calendar",
      },
      {
        id: 2,
        href: "/application/create",
        icon: GrChapterAdd,
        title: "New Application",
      },
      {
        id: 3,
        href: "/application/own",
        icon: MdOutlinePendingActions,
        title: "Own Applications",
      },
    ],
  };

  const activeMenu = useMemo(
    () => menuItems[userRole]?.find((menu) => menu.href === pathname),
    [pathname, userRole]
  );

  // Function to check token validity by calling the backend
  const checkTokenValidity = async () => {
    try {
      const response = await fetch("/api/auth/validateToken", {
        method: "GET",
        credentials: "include", // Include cookies in the request
      });

      const data = await response.json();
      if (!data.valid) {
        setIsValidToken(false); // Mark token as invalid
        onTokenExpiryModalOpen(); // Open the modal
        setTimeout(() => {
          router.push("/auth/login"); // Redirect to home after showing popup
        }, 3000); // Redirect after 3 seconds
      }
    } catch (error) {
      console.error("Error checking token validity:", error);
    }
  };

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
        position: "top-right",
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
        position: "top-right",
      });
    }
  };

  const retrieveOwnProfile = async () => {
    let response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
    if (response.ok) {
        let data = await response.json();
        console.log(data.role);
        setEmployeeInfo({
          id: data.id,
          role: data.role
        })
        console.log(employeeInfo.role);
    } else {
        console.error('Profile retrieval failed');
    }
  }

  useEffect(() => {
    // Check for the token in cookies
    let token = sessionStorage.getItem("jwt"); // Retrieve the token from cookies
    if (!token) {
      // Redirect to the home page if the token is present
      router.replace("/auth/login");
    } else {
      checkTokenValidity(); // Check the token validity
      setInterval(() => {
        checkTokenValidity();
      }, 500000);

      retrieveOwnProfile();
    }
  }, [router]);

    // Update userRole when employeeInfo.role changes
    useEffect(() => {
      setUserRole(employeeInfo.role);
    }, [employeeInfo.role]);
  

  return (
    <div className="min-h-screen w-[250px] flex flex-col border-r border-r-gray-secondary ">
      {/* Token Expiry Modal */}
      <Modal
        isOpen={isTokenExpiryModalOpen}
        onClose={onTokenExpiryModalClose}
        isCentered
        size={"lg"}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Session expired</ModalHeader>
          <ModalBody>
            Your session has expired. You will be redirected to the login page.
          </ModalBody>
        </ModalContent>
      </Modal>

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
        {menuItems[userRole]?.map(({ icon: Icon, ...menu }) => {
          //const extraClass = activeMenu.id === menu.id ? "text-blue-primary bg-blue-100" : "";
          return (
            <div
              className={`p-5 cursor-pointer w-full hover:bg-light-secondary overflow-hidden whitespace-nowrap`}
              //className={`p-5 cursor-pointer w-full hover:bg-light-secondary overflow-hidden whitespace-nowrap ${extraClass}`}
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
