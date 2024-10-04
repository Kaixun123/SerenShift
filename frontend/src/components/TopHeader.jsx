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
} from "@chakra-ui/react";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useRouter } from "next/navigation";

export default function TopHeader({ mainText, subText }) {
  const [employee, setEmployee] = useState({ name: "", position: "" });
  const router = useRouter();
  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) 
          router.push("/auth/login");
        const data = await response.json();
        setEmployee({
          name: `${data.first_name} ${data.last_name}`, // Assuming first_name and last_name from API
          position: data.position, // Assuming position is part of the data
        });
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    }
    fetchEmployeeData();
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
            icon={<NotificationsIcon style={{ fontSize: 30 }} />}
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
            <MenuItem>You have new messages</MenuItem>
            <MenuItem>Your schedule has been updated</MenuItem>
            <MenuItem>New tasks assigned</MenuItem>
            <MenuDivider />
            <MenuItem>View All Notifications</MenuItem>
          </MenuList>
        </Menu>

        {/* Profile Popover */}
        <Menu>
          <MenuButton>
            <HStack>
              <Avatar size="md" name={employee.name} src={employee.avatar} />
              <VStack align="left" spacing="1px" ml="2">
                <Text fontSize="sm">{employee.name || "Loading..."}</Text>
                <Text fontSize="xs" color="gray.500">
                  {employee.position || "Position"}
                </Text>
              </VStack>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem as='a' href='/profile'>Profile</MenuItem>
            <MenuItem>Settings</MenuItem>
            <MenuDivider />
            <MenuItem>Logout</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </div>
  );
}
