'use client';
import { Layout } from "@/components/Layout";
import TopHeader from "@/components/TopHeader";
import { Box, Flex, VStack, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";
import PendingArrangementCard from "@/components/PendingAppCard";
import WithdrawalModal from "@/components/WithdrawModal";

export default function Home() {
  // Dummy data for pending applications
  const pendingApplications = [
    {
      id: 1,
      start_date: "2024-09-25",
      end_date: "2024-09-30",
      application_type: "Ad-hoc",
      requestor_remarks: "Need to take care of family",
    },
    {
      id: 2,
      start_date: "2024-10-01",
      end_date: "2024-10-05",
      application_type: "Regular",
      requestor_remarks: "Personal health reasons",
    },
    {
      id: 3,
      start_date: "2024-10-10",
      end_date: "2024-10-10",
      application_type: "Regular",
      requestor_remarks: "",
    },
  ];

  // State for the selected application to withdraw
  const [selectedApp, setSelectedApp] = useState(null);

  // Chakra UI modal hooks
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Function to handle the click event of the withdraw button
  const handleWithdrawClick = (app) => {
    setSelectedApp(app);
    onOpen();
  };

  return (
    <Layout>
      <TopHeader
        mainText={"New Schedule"}
        subText={"Plan your schedule timely and wisely!"}
      />
      <Flex mx="auto" maxWidth="50%">
        <Box className="p-[30px]">New application</Box>
        <VStack align="stretch" spacing={4} ml="auto" p={4}>
          {pendingApplications.map((item) => (
            <PendingArrangementCard
              key={item.id}
              start_date={item.start_date}
              end_date={item.end_date}
              application_type={item.application_type}
              requestor_remarks={item.requestor_remarks}
              onWithdraw={handleWithdrawClick}
            />
          ))}
        </VStack>
      </Flex>

      {/* Modal for withdrawal confirmation */}
      <WithdrawalModal
        isOpen={isOpen}
        onClose={onClose}
        selectedApp={selectedApp}
      />
    </Layout>
  );
}
