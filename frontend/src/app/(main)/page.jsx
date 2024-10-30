"use client";
import TopHeader from "@/components/TopHeader";
import { useEffect, useState } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Spinner,
  Flex,
  Button,
} from "@chakra-ui/react";
import { FaCheckCircle, FaTimesCircle, FaExclamationCircle } from "react-icons/fa"; // Icons for status types
import { BsDot } from "react-icons/bs"; // For unread notification dot

export default function Home() {
  const [employee, setEmployee] = useState({ name: "" });
  const [greeting, setGreeting] = useState("");
  const [notifications, setNotifications] = useState([]); // State for notifications
  const [loading, setLoading] = useState(true); // State for loading notifications

  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        setEmployee({
          name: `${data.first_name} ${data.last_name}`,
        });
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        let date = new Date();
        if (date.getHours() >= 12 && date.getHours() < 18) {
          setGreeting("Good Afternoon");
        } else if (date.getHours() >= 18) {
          setGreeting("Good Evening");
        } else {
          setGreeting("Good Morning");
        }
      }
    }

    async function fetchNotifications() {
      try {
        const response = await fetch("/api/notification/retrieveNotifications");
        const data = await response.json();
        setNotifications(data || []); // Adjusted to handle the structure of the API response
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    }

    fetchEmployeeData();
    fetchNotifications(); // Call to fetch notifications
  }, []);

  // Function to render the icon based on notification type
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

  // Function to mark notifications as read
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
        // Update the notification's read status in the local state
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
  

  return (
        <main>
          <TopHeader
            mainText={`${greeting}, ${employee.name}!`}
            subText={`Glad to see you back in the office`}
          />
          <div className="p-[30px]">
            <Box mt={4} overflowX="auto">
              {loading ? ( // Show loading spinner while fetching notifications
                <Spinner size="xl" />
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Type</Th>
                      <Th>Description</Th>
                      <Th>Date</Th>
                      <Th>Actions</Th> {/* Added column for actions */}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <Tr key={notification.notification_id}>
                          <Td
                            style={{
                              color: notification.read_status ? "lightgray" : "black",
                            }}
                          >
                            {notification.notification_id}
                          </Td>
                          <Td
                            style={{
                              color: notification.read_status ? "lightgray" : "black",
                            }}
                          >
                            <Flex align="center">
                              {renderStatusIcon(notification.notification_type, notification.read_status)}
                              <span style={{ marginLeft: "8px" }}>
                                {notification.notification_type}
                              </span>
                            </Flex>
                          </Td>
                          <Td
                            style={{
                              color: notification.read_status ? "lightgray" : "black",
                            }}
                          >
                            {notification.content}
                          </Td>
                          <Td
                            style={{
                              color: notification.read_status ? "lightgray" : "black",
                            }}
                          >
                            {new Date(notification.created_timestamp).toLocaleString()}
                          </Td>
                          <Td>
                            <Flex align="center" justify="space-between">
                              {/* Red Dot */}
                              {!notification.read_status && (
                                <BsDot color="red" style={{ fontSize: "48px", marginLeft: "8px" }} />
                              )}

                              {/* Mark as Read Button */}
                              {!notification.read_status && (
                                <Button
                                  size="sm"
                                  ml={2}
                                  colorScheme="blue"
                                  onClick={() => markAsRead(notification.notification_id)}
                                >
                                  Mark as Read
                                </Button>
                              )}
                            </Flex>
                          </Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={5} textAlign="center">
                          No notifications available.
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              )}
            </Box>
            {/* Clear All Notifications Button placed outside the table */}
            <Flex justify="flex-end" mt={4}>
              <Button colorScheme="red" onClick={clearAllNotifications}>
                Clear All Notifications
              </Button>
            </Flex>
          </div>
        </main>
  );
}
