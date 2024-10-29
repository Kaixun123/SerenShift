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
  TableCaption,
  Box,
  Spinner, // Import Spinner for loading state
} from "@chakra-ui/react";

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
        // Directly set notifications from the API response
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
                </Tr>
              </Thead>
              <Tbody>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <Tr key={notification.notification_id}> {/* Assuming notification has an id */}
                      <Td style={{ color: notification.read_status ? "lightgray" : "black" }}>
                        {notification.notification_id}
                      </Td>
                      <Td style={{ color: notification.read_status ? "lightgray" : "black" }}>
                        {notification.notification_type}
                      </Td>
                      <Td style={{ color: notification.read_status ? "lightgray" : "black" }}>
                        {notification.content}
                      </Td>
                      <Td style={{ color: notification.read_status ? "lightgray" : "black" }}>
                        {new Date(notification.created_timestamp).toLocaleString()} {/* Format date if needed */}
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={4} textAlign="center">No notifications available.</Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          )}
        </Box>
      </div>
    </main>
  );
}
