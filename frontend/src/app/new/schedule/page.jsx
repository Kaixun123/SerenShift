'use client';
import { Layout } from "@/components/Layout";
import TopHeader from "@/components/TopHeader";
import { Box, Flex, VStack, useDisclosure, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import PendingArrangementCard from "@/components/PendingAppCard";
import WithdrawalModal from "@/components/WithdrawModal";

export default function Home() {
  // State for the pending applications
  const [pendingApplications, setPendingApplications] = useState([]);

  // State for the selected application to withdraw
  const [selectedApp, setSelectedApp] = useState(null);

  // Chakra UI modal hooks
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await fetch('/api/auth/me');
        const userData = await userResponse.json();
        const userId = userData.id;
        console.log(userId);
      
        const applicationStatus = "Pending";
        const applicationResponse = await fetch(`/api/application/retrieveApplication?id=${userId}&status=${applicationStatus}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
             },
        });
        
        const applicationData = await applicationResponse.json();
        console.log(applicationData);
        
        setPendingApplications(applicationData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <TopHeader />
      <Box p={4}>
        <VStack spacing={4}>
          {pendingApplications.length > 0 ? (
            pendingApplications.map((application) => (
              <PendingArrangementCard
                key={application.application_id} // Unique key prop
                start_date={application.start_date} // Pass the specific properties
                end_date={application.end_date}
                application_type={application.application_type}
                requestor_remarks={application.requestor_remarks}
                onWithdraw={(id) => {
                  setSelectedApp(id);
                  onOpen();
                }}
              />
            ))
          ) : (
            <Text>No pending applications</Text>
          )}
        </VStack>
      </Box>
      {selectedApp && (
        <WithdrawalModal
          isOpen={isOpen}
          onClose={onClose}
          applicationId={selectedApp}
        />
      )}
    </Layout>
  );
}
