"use client";
// import components
import TopHeader from "@/components/TopHeader";
import PendingApplicationCard from "@/components/PendingAppCard";
import WithdrawalModal from "@/components/WithdrawModal";
import RefreshButton from "@/components/RefreshButton";
import { useEffect, useState } from "react";

// chakra-ui
import { Box, VStack, Text, useDisclosure } from "@chakra-ui/react";

// mantine
import { Pagination } from "@mantine/core";

export default function PendingApplicationPage() {
  const [pendingApplications, setPendingApplications] = useState([]);
  const [appToWithdraw, setAppToWithdraw] = useState(null);

  // For Refresh button
  const [isRefresh, setRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // For Withdrawal Modal
  const {
    isOpen: isModalWithdrawOpen,
    onOpen: onModalWithdrawOpen,
    onClose: onModalWithdrawClose,
  } = useDisclosure();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefresh(true);
      setRefreshing(false);
    }, 200);
    setRefresh(false);
  };

  useEffect(() => {
    async function fetchPendingAppData() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        // Retrieve Pending Application List
        const applicationStatus = "Pending";
        const applicationResponse = await fetch(
          `/api/application/retrieveApplication?id=${data.id}&status=${applicationStatus}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const pendingApplication = await applicationResponse.json();
        setPendingApplications(pendingApplication);
      } catch (error) {
        console.error("Error fetching pending application data:", error);
      }
    }

    fetchPendingAppData();
  }, [isRefresh]);

  // Handle withdrawal function
  const handleWithdraw = async (applicationId) => {
    try {
      const response = await fetch("/api/withdraw/withdrawPending", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applicationId }),
      });
      if (response.ok) {
        // Update the pending applications state
        setPendingApplications((prev) =>
          prev.filter((app) => app.application_id !== applicationId)
        );
        onModalWithdrawClose();
      } else {
        console.error("Failed to withdraw application");
      }
    } catch (error) {
      console.error("Error withdrawing application:", error);
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

  // Number of applications per page
  const applicationsPerPage = 4;
  const paginatedApplications = handlePagination(
    pendingApplications,
    applicationsPerPage
  );

  // Items for the current page
  const items = paginatedApplications[activePage - 1]?.map((application) => (
    <PendingApplicationCard
      key={application.application_id}
      start_date={application.start_date}
      end_date={application.end_date}
      application_type={application.application_type}
      requestor_remarks={application.requestor_remarks}
      onWithdraw={() => {
        setAppToWithdraw(application);
        onModalWithdrawOpen();
      }}
    />
  ));

  return (
    <main>
      <TopHeader
        mainText={"Pending Application"}
        subText={"See your pending application here!"}
      />

      <div className="flex p-[30px]">
        <div className="w-1/2">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold">Pending Applications</h1>
            <RefreshButton isRefresh={handleRefresh} isLoading={refreshing} />
          </div>
          <Box py={5} h={"100%"}>
            <VStack spacing={5} h={"100%"}>
              {pendingApplications.length > 0 ? (
                <>
                  {items}
                  <Pagination
                    total={paginatedApplications.length}
                    value={activePage}
                    onChange={setPage}
                    className="flex mt-5 justify-center"
                  />
                </>
              ) : (
                <Text>No pending applications found</Text>
              )}
            </VStack>
          </Box>
          {appToWithdraw && (
            <WithdrawalModal
              isOpen={isModalWithdrawOpen}
              onClose={onModalWithdrawClose}
              applicationType={appToWithdraw.application_type}
              startDate={appToWithdraw.start_date}
              endDate={appToWithdraw.end_date}
              onConfirm={() => handleWithdraw(appToWithdraw.application_id)} // Pass handleWithdraw function to WithdrawalModal
            />
          )}
        </div>
      </div>
    </main>
  );
}
