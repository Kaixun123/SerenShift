"use client";
import TopHeader from "@/components/TopHeader";
import RefreshButton from "@/components/RefreshButton";
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
  useToast,
} from "@chakra-ui/react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { BsDot } from "react-icons/bs";

// mantine
import { Pagination } from "@mantine/core";

export default function Home() {
  const [employee, setEmployee] = useState({ name: "" });
  const [greeting, setGreeting] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // For Refresh button
  const [isRefresh, setRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const toast = useToast();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefresh(true);
      setRefreshing(false);
      setPage(1);
    }, 200);
    setRefresh(false);
  };

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
        const date = new Date();
        setGreeting(
          date.getHours() >= 18
            ? "Good Evening"
            : date.getHours() >= 12
            ? "Good Afternoon"
            : "Good Morning"
        );
      }
    }

    async function fetchNotifications() {
      try {
        const response = await fetch("/api/notification/retrieveNotifications");
        const data = await response.json();

        if (data.message) {
          setErrorMessage(data.message);
        } else {
          const sortedNotifications = data.sort(
            (a, b) => a.read_status - b.read_status
          );
          setNotifications(sortedNotifications);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployeeData();
    fetchNotifications();
  }, [isRefresh]);

  const renderStatusIcon = (type, read_status) => {
    if (read_status) return null;
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
      const response = await fetch(
        "/api/notification/updateNotificationReadStatus",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notification_id }),
        }
      );

      if (response.ok) {
        // Show success toast message
        toast({
          description: "Your notification marked as read successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });

        setNotifications((prevNotifications) => {
          const updatedNotifications = prevNotifications.map((notification) =>
            notification.notification_id === notification_id
              ? { ...notification, read_status: true }
              : notification
          );
          const unreadNotifications = updatedNotifications.filter(
            (n) => !n.read_status
          );
          const readNotifications = updatedNotifications.filter(
            (n) => n.read_status
          );
          return [...unreadNotifications, ...readNotifications];
        });
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
        handleRefresh();
      } else {
        console.error("Failed to clear notifications");
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const response = await fetch("/api/notification/clearNotifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearAll: true }),
      });
      if (response.ok) {
        // Show success toast message
        toast({
          description: "Your notifications are cleared successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
        handleRefresh();
      } else {
        console.error("Failed to clear notifications");
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  function handlePagination(array, size) {
    if (!array.length) {
      return [];
    }
    const head = array.slice(0, size);
    const tail = array.slice(size);
    return [head, ...handlePagination(tail, size)];
  }

  // Pagination state
  const [activePage, setPage] = useState(1);

  // Number of notifications per page
  const notificationsPerPage = 5;
  const paginatedNotifications = handlePagination(
    notifications,
    notificationsPerPage
  );

  // Items for the current page
  const items = paginatedNotifications[activePage - 1]?.map((notification) => (
    <Tr key={notification.notification_id}>
      <Td
        style={{
          color: notification.read_status ? "lightgray" : "black",
        }}
      >
        <Flex align="center">
          {renderStatusIcon(
            notification.notification_type,
            notification.read_status
          )}
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
        {`${notification.senderInfo.first_name} ${notification.senderInfo.last_name} (${notification.senderInfo.position}, ${notification.senderInfo.department})`}
      </Td>
      <Td
        style={{
          color: notification.read_status ? "lightgray" : "black",
        }}
      >
        {`Start: ${new Date(
          notification.application_info.start_date
        ).toLocaleDateString()}, End: ${new Date(
          notification.application_info.end_date
        ).toLocaleDateString()}`}
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
          {!notification.read_status && (
            <BsDot
              color="red"
              style={{ fontSize: "48px", marginLeft: "8px" }}
            />
          )}
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
  ));

  return (
    <main>
      <TopHeader
        mainText={`${greeting}, ${employee.name}!`}
        subText="Glad to see you back in the office"
      />
      <div className="p-[30px]">
        <Flex justify="flex-end" mt={4} gap={3}>
          <RefreshButton isRefresh={handleRefresh} isLoading={refreshing} />
          <Button colorScheme="blue" onClick={markAllAsRead}>
            Mark All as Read
          </Button>
          <Button colorScheme="red" onClick={clearAllNotifications}>
            Clear All Notifications
          </Button>
        </Flex>
        <Box mt={4} className="flex justify-center">
          {loading ? (
            <Spinner size="xl" />
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Type</Th>
                  <Th>Description</Th>
                  <Th>Sender</Th>
                  <Th>Application Details</Th>
                  <Th>Date</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {notifications.length > 0 ? (
                  <>{items}</>
                ) : (
                  <Tr>
                    <Td colSpan={7} textAlign="center">
                      {errorMessage}
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          )}
        </Box>
        <Pagination
          total={paginatedNotifications.length}
          value={activePage}
          onChange={setPage}
          className="flex mt-5 justify-center"
        />
      </div>
    </main>
  );
}
