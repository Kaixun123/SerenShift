"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  Badge,
  HStack,
  VStack,
  Spinner,
  Flex,
  useToast,
  Button,
} from "@chakra-ui/react";
import { IoNotificationsOutline } from "react-icons/io5";
import { BsDot } from "react-icons/bs";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function TopHeader({ mainText, subText }) {
  const [employee, setEmployee] = useState({ name: "", position: "" });
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();
  const toast = useToast();

  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", {
      method: "GET",
      credentials: "include",
    });
    if (response.ok) {
      toast({
        title: "Logout Success",
        description: "Thank you and have a nice day!",
        status: "success",
        position: "top-right",
        isClosable: true,
      });
      router.push("/auth/login");
    } else {
      toast({
        title: "Logout Failed",
        description: "An error has occurred. Please try again later",
        status: "error",
        position: "top-right",
        isClosable: true,
      });
    }
  };

  const fetchEmployeeData = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) router.push("/auth/login");
      const data = await response.json();
      setEmployee({
        name: `${data.first_name} ${data.last_name}`,
        position: data.position,
      });
    } catch (error) {
      console.error("Error fetching employee data:", error);
    }
  };

  const renderStatusIcon = (type, read_status) => {
    if (read_status) return null;
    const statusIcons = {
      Approved: <FaCheckCircle color="green" />,
      Rejected: <FaTimesCircle color="red" />,
      Withdrawn: <FaCheckCircle color="blue" />,
      Pending: <FaExclamationCircle color="orange" />,
    };
    return statusIcons[type] || null;
  };

  const markAsRead = async (notification_id) => {
    try {
      const response = await fetch(
        "/api/notification/updateNotificationReadStatus",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notification_id }),
        }
      );

      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications
            .map((notification) =>
              notification.notification_id === notification_id
                ? { ...notification, read_status: true }
                : notification
            )
            .sort((a, b) => a.read_status - b.read_status)
        );
      } else {
        console.error("Failed to update notification read status");
      }
    } catch (error) {
      console.error("Error updating notification read status:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notification/markAllAsRead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readAll: true }),
      });
      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((n) => ({ ...n, read_status: true }))
        );

        // Show success toast message
        toast({
          description: "Your notification marked as read successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      } else {
        console.error("Failed to clear notifications");
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notification/retrieveNotifications");
      const data = await response.json();

      if (data.message) {
        setErrorMessage(data.message);
      } else {
        // Separate unread and read notifications
        const unreadNotifications = data
          .filter((notification) => !notification.read_status)
          .sort(
            (a, b) =>
              new Date(b.created_timestamp) - new Date(a.created_timestamp)
          );

        const readNotifications = data
          .filter((notification) => notification.read_status)
          .sort(
            (a, b) =>
              new Date(b.created_timestamp) - new Date(a.created_timestamp)
          );

        // Combine unread notifications on top and read notifications at the bottom
        const sortedNotifications = [
          ...unreadNotifications,
          ...readNotifications,
        ];

        setUnreadNotifications(unreadNotifications);
        setNotifications(sortedNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
    fetchNotifications();
  }, []);

  function formatRelativeTime(timestamp) {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const secondsDiff = Math.floor((now - notificationDate) / 1000);

    if (secondsDiff < 60) {
      return `${secondsDiff} seconds ago`;
    } else if (secondsDiff < 3600) {
      const minutes = Math.floor(secondsDiff / 60);
      return `${minutes} minutes ago`;
    } else if (secondsDiff < 86400) {
      const hours = Math.floor(secondsDiff / 3600);
      return `${hours} hours ago`;
    } else if (secondsDiff < 604800) {
      const days = Math.floor(secondsDiff / 86400);
      return `${days} days ago`;
    } else {
      const weeks = Math.floor(secondsDiff / 604800);
      return `${weeks} weeks ago`;
    }
  }

  return (
    <div className="flex h-[100px] px-[30px] py-5 border-b border-b-gray-secondary items-center justify-between">
      <div className="flex flex-col">
        <div className="text-3xl font-bold">{mainText}</div>
        {subText && <div className="font-medium">{subText}</div>}
      </div>
      <HStack spacing={4}>
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<IoNotificationsOutline size={30} />}
            variant="ghost"
            aria-label="Notifications"
          >
            <Box position="relative">
              <Badge
                colorScheme="red"
                borderRadius="full"
                boxSize={3}
                position="absolute"
                top="-1"
                right="-1"
              />
            </Box>
          </MenuButton>
          <MenuList>
            <Text fontWeight="bold" px={3}>
              Notifications (Unread: {unreadNotifications.length})
            </Text>
            {loading ? (
              <Flex justify="center" align="center">
                <Spinner />
              </Flex>
            ) : notifications.length > 0 ? (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {notifications.map((notification) => (
                  <MenuItem
                    key={notification.notification_id}
                    onClick={() => markAsRead(notification.notification_id)}
                    style={{
                      color: notification.read_status ? "lightgray" : "black",
                    }}
                  >
                    <Flex align="center" justify="space-between">
                      <Flex align="center">
                        {renderStatusIcon(
                          notification.notification_type,
                          notification.read_status
                        )}
                        <Flex flexDirection={"column"} ml={5}>
                          <Text
                            width={"350px"}
                            overflow="hidden"
                            textOverflow="ellipsis"
                          >
                            {notification.senderInfo.first_name}{" "}
                            {notification.senderInfo.last_name}{" "}
                            {notification.content}
                            {" on "}
                            {new Date(
                              notification.application_info.start_date
                            ).toDateString()}
                          </Text>
                          {!notification.read_status && (
                            <Text fontSize="xs" color="blue">
                              {formatRelativeTime(
                                notification.created_timestamp
                              )}
                            </Text>
                          )}
                        </Flex>
                      </Flex>
                      {!notification.read_status && (
                        <BsDot color="red" style={{ fontSize: "48px" }} />
                      )}
                    </Flex>
                  </MenuItem>
                ))}
              </div>
            ) : (
              <MenuItem>{errorMessage}</MenuItem>
            )}
            <MenuDivider />
            <Button colorScheme="blue" mx={3} onClick={markAllAsRead}>
              Mark All As Read
            </Button>
            <MenuDivider />
            <MenuItem as="a" href="/">
              View All Notifications
            </MenuItem>
          </MenuList>
        </Menu>

        <Menu>
          <MenuButton>
            <HStack>
              <Avatar size="md" name={employee.name} />
              <VStack align="left" spacing="1px" ml="2">
                <Text fontSize="sm">{employee.name || "Loading..."}</Text>
                <Text fontSize="xs" color="gray.500">
                  {employee.position || "Position"}
                </Text>
              </VStack>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem>Settings</MenuItem>
            <MenuDivider />
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </div>
  );
}
