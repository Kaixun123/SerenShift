"use client";
import Link from "next/link";
import {
  Image,
  Button,
  Divider,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";

// react icons
import { IoCalendarOutline } from "react-icons/io5";
import { BsPeople } from "react-icons/bs";
import {
  MdOutlinePendingActions,
  MdOutlineManageHistory,
} from "react-icons/md";
import { GrChapterAdd, GrUserManager, GrDocumentMissing } from "react-icons/gr";
import { CgList } from "react-icons/cg";
import { FiHome } from "react-icons/fi";
import { HiOutlineNewspaper } from "react-icons/hi";

export default function SideBar() {
  const router = useRouter();
  const toast = useToast();
  const pathname = usePathname();
  const [isValidToken, setIsValidToken] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState({
    id: 0,
    role: "",
  });
  const [userRole, setUserRole] = useState(null); // State to store user role

  // For Token Expiry Modal
  const {
    isOpen: isTokenExpiryModalOpen,
    onOpen: onTokenExpiryModalOpen,
    onClose: onTokenExpiryModalClose,
  } = useDisclosure();

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (data && data.role) {
          setUserRole(data.role);
        } else {
          console.log("No role found in response");
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      }
    }
    fetchUserDetails();
  }, []);

  const commonItems = [
    {
      id: 0,
      href: "/",
      title: "Dashboard",
      icon: HiOutlineNewspaper,
    },
    {
      id: 2,
      href: "/schedule/own",
      title: "My Calendar",
      icon: IoCalendarOutline,
    },
    {
      id: 3,
      href: "/schedule/team",
      title: "Team Calendar",
      icon: BsPeople,
    },
  ];

  const ownAppItems = [
    {
      id: 5,
      href: "/application/create",
      title: "New Application",
      icon: GrChapterAdd,
    },
    {
      id: 6,
      href: "/application/own",
      title: "Own Applications",
      icon: MdOutlinePendingActions,
    },
  ];

  const manageAppItems = [
    {
      id: 7,
      href: "/application/manage",
      title: "Manage Applications",
      icon: CgList,
    },
    {
      id: 8,
      href: "/application/withdraw",
      title: "Withdraw Applications",
      icon: GrDocumentMissing,
    },
    {
      id: 9,
      href: "/blacklist/manage",
      title: "Manage Blacklist Dates",
      icon: MdOutlineManageHistory,
    },
  ];

  // Handling conditional rendering of extra menu items based on user role
  if (userRole === "Manager" || userRole === "HR") {
    commonItems.push({
      id: 4,
      href: "/schedule/subordinate",
      title: "Subordinate Calendar",
      icon: GrUserManager,
    });
    if (userRole === "HR") {
      commonItems.splice(1, 0, {
        id: 1,
        href: "/schedule/company",
        title: "Company View",
        icon: FiHome,
      });
    }
  }

  const commonActiveMenu = useMemo(
    () => commonItems.find((menu) => menu.href === pathname),
    [pathname]
  );

  const ownActiveMenu = useMemo(
    () => ownAppItems.find((menu) => menu.href === pathname),
    [pathname]
  );

  const manageActiveMenu = useMemo(
    () => manageAppItems.find((menu) => menu.href === pathname),
    [pathname]
  );

  const renderManagerItems = () => {
    if (userRole == "Staff") {
      return null;
    }

    return (
      <>
        <Divider borderColor="gray.500" width="80%" alignSelf="center" mt={3} />
        <Text fontSize="sm" color="gray.500" mt={1} textAlign="center">
          Team Applications
        </Text>

        {manageAppItems.map(({ icon: Icon, ...menu }) => {
          const extraClass =
            manageActiveMenu && manageActiveMenu.id === menu.id
              ? "text-blue-primary bg-blue-100"
              : "";
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
      </>
    );
  };

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
        description: "Thank you and have a nice day!",
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
    let response = await fetch("/api/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (response.ok) {
      let data = await response.json();
      setEmployeeInfo({
        id: data.id,
        role: data.role,
      });
    } else {
      console.error("Profile retrieval failed");
    }
  };

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
        <Link href="/">
          <Image
            src="/serenShiftLogo.jpg"
            alt="Logo"
            boxSize="60px"
            borderRadius="full"
            objectFit="contain"
          />
        </Link>
      </div>
      <div className="flex flex-col">
        {commonItems.slice(0, 5).map(({ icon: Icon, ...menu }) => {
          const extraClass =
            commonActiveMenu && commonActiveMenu.id === menu.id
              ? "text-blue-primary bg-blue-100"
              : "";
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

        <Divider borderColor="gray.500" width="80%" alignSelf="center" mt={3} />
        <Text fontSize="sm" color="gray.500" mt={1} textAlign="center">
          My Applications
        </Text>

        {ownAppItems.map(({ icon: Icon, ...menu }) => {
          const extraClass =
            ownActiveMenu && ownActiveMenu.id === menu.id
              ? "text-blue-primary bg-blue-100"
              : "";
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
        {renderManagerItems()}
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
