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
  Button,  // Added for Mark All as Read button
} from "@chakra-ui/react";
import { IoNotificationsOutline } from "react-icons/io5";
import { BsDot } from "react-icons/bs"; // For unread notification dot
import { FaCheckCircle, FaTimesCircle, FaExclamationCircle } from "react-icons/fa"; // Icons for status types
import { useRouter } from "next/navigation";

export default function TopHeader({ mainText, subText }) {
  const [employee, setEmployee] = useState({ name: "", position: "" });
  const [notifications, setNotifications] = useState([]); // State for notifications
  const [loading, setLoading] = useState(true); // State for loading notifications
  const router = useRouter();
  const toast = useToast();

  const handleLogout = async () => {
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
      toast({
        title: "Logout Failed",
        description: "An error has occurred. Please try again later",
        status: "error",
        isClosable: true,
        position: "top-right",
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
    if (read_status) return null; // Don't show the icon if the notification is read
    switch (type) {
      case "Approved":
        return <FaCheckCircle color="green" />;
      case "Rejected":
        return <FaTimesCircle color="red" />;
      case "Withdrawn":
        return <FaCheckCircle color="blue" />;
      case "Pending":
        return <FaExclamationCircle color="orange" />;
      default:
        return null;
    }
  };

  const markAsRead = async (notification_id) => {
    try {
      const response = await fetch("/api/notification/updateNotificationReadStatus", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notification_id }),
      });

      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.notification_id === notification_id
              ? { ...notification, read_status: true }
              : notification
          )
        );
      } else {
        console.error("Failed to update notification read status");
      }
    } catch (error) {
      console.error("Error updating notification read status:", error);
    }
  };

  // Function to clear all notifications
  const clearAllNotifications = async () => {
    try {
      const response = await fetch("/api/notification/clearNotifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clearAll: true }), // Send clearAll flag
      });
  
      if (response.ok) {
        // Update the read_status of all notifications to true
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({
            ...notification,
            read_status: true, // Mark all as read
          }))
        );
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
      setNotifications(data || []); // Adjusted to handle the structure of the API response
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
    fetchNotifications(); // Call to fetch notifications
  }, []);

  return (
    <div className="flex h-[100px] px-[30px] py-5 border-b border-b-gray-secondary items-center justify-between">
      <div className="flex flex-col">
        <div className="text-3xl font-bold">{mainText}</div>
        {subText && <div className="font-medium">{subText}</div>}
      </div>
      <HStack spacing={4}>
        {/* Notification Popover */}
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
              >
                {/* Notification badge */}
              </Badge>
            </Box>
          </MenuButton>
          <MenuList>
            <Text fontWeight="bold" px={3}>Click on notification to mark as read</Text> {/* Label */}
            {loading ? (
              <Flex justify="center" align="center">
                <Spinner />
              </Flex>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                    <MenuItem
                      key={notification.notification_id}
                      onClick={() => markAsRead(notification.notification_id)}
                      style={{
                        color: notification.read_status ? "lightgray" : "black",
                      }}  
                    >
                      <Flex align="center" justify="space-between">
                        <Flex align="center"> {/* Add Flex here to wrap content and icon */}
                          {renderStatusIcon(notification.notification_type, notification.read_status)}
                          <Text ml={2} whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis"> {/* Added ellipsis for long text */}
                            {notification.content}
                          </Text>
                        </Flex>
                        {!notification.read_status && (
                          <BsDot color="red" style={{ fontSize: "24px", marginLeft: "8px" }} />
                        )}
                      </Flex>
                    </MenuItem>
              ))
            ) : (
              <MenuItem>No notifications available.</MenuItem>
            )}
            <MenuDivider />
            <Button
              colorScheme="blue"
              mx={3}
              onClick={clearAllNotifications}
            >
              Mark All As Read
            </Button> {/* Mark all as read button */}
            <MenuDivider />
            <MenuItem as="a" href="/">View All Notifications</MenuItem>
          </MenuList>
        </Menu>

        {/* Profile Popover */}
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
