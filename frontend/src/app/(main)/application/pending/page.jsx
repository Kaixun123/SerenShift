"use client";
// import components
import TopHeader from "@/components/TopHeader";
import PendingApplicationCard from "@/components/PendingApplicationCard";
import WithdrawalModal from "@/components/WithdrawModal";
import RefreshButton from "@/components/RefreshButton";
import EditApplicationCard from "@/components/EditApplicationCard"; // Import EditApplicationCard
import { useEffect, useState } from "react";

// chakra-ui
import { Box, VStack, Text, useDisclosure } from "@chakra-ui/react";

// mantine
import { Pagination } from "@mantine/core";

export default function PendingApplicationPage() {
  const [pendingApplications, setPendingApplications] = useState([]);
  const [appToWithdraw, setAppToWithdraw] = useState(null);
  const [applicationToEdit, setApplicationToEdit] = useState(null); // State for tracking the app being edited

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
      setPage(1);
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
      const response = await fetch("/api/application/withdrawPending", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ application_id: applicationId }),
      });
      if (response.ok) {
        // Update the pending applications state
        setPendingApplications((prev) =>
          prev.filter((app) => app.application_id !== applicationId)
        );
        onModalWithdrawClose();
        setPage(1);
      } else {
        console.error("Failed to withdraw application");
      }
    } catch (error) {
      console.error("Error withdrawing application:", error);
    }
  };

  const handleEdit = (application) => {
    const startDateTime = new Date(application.start_date);
    const endDateTime = new Date(application.end_date);
  
    let timeSlot = "";
  
    // Determine the timeSlot based on start and end times
    if (startDateTime.getHours() === 9 && endDateTime.getHours() === 13) {
      timeSlot = "am";
    } else if (startDateTime.getHours() === 14 && endDateTime.getHours() === 18) {
      timeSlot = "pm";
    } else if (startDateTime.getHours() === 9 && endDateTime.getHours() === 18) {
      timeSlot = "fullDay";
    }
  
    // Set the application to be edited along with derived timeSlot
    setApplicationToEdit({
      ...application,
      timeSlot, // Include the derived timeSlot
    });
  };  

  const handleSaveEdit = async (updatedData) => {
    const updatedApplication = {
      application_id: applicationToEdit.application_id,
      application_type: updatedData.application_type || applicationToEdit.application_type,
      startDate: updatedData.startDate || applicationToEdit.start_date,
      endDate: updatedData.endDate || applicationToEdit.end_date,
      requestor_remarks: updatedData.reason || applicationToEdit.requestor_remarks,
    };
  
    try {
      const response = await fetch("/api/application/updatePendingApplication", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedApplication),
      });
  
      if (response.ok) {
        // Update the pending applications state or refetch if needed
        setPendingApplications((prev) =>
          prev.map((app) =>
            app.application_id === updatedApplication.application_id
              ? { ...app, ...updatedApplication }
              : app
          )
        );
        setApplicationToEdit(null); // Close the edit card after saving
      } else {
        console.error("Failed to update application");
      }
    } catch (error) {
      console.error("Error updating application:", error);
    }
  };
  

  const handleCancelEdit = () => {
    setApplicationToEdit(null); // Close the edit card without saving
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
  const applicationsPerPage = 2;
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
      status={application.status}
      requestor_remarks={application.requestor_remarks}
      onWithdraw={() => {
        setAppToWithdraw(application);
        onModalWithdrawOpen();
      }}
      onEdit={() => handleEdit(application)} // Pass the application to be edited
      canManage={false}
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

        {/* Right-side Edit Card */}
        <div className="w-1/2 pl-5">
          {applicationToEdit && (
            <EditApplicationCard
              applicationData={{
                application_type: applicationToEdit.application_type || "", // Provide a default value
                timeSlot: applicationToEdit.timeSlot || "", // Timeslot is now included
                startDate: applicationToEdit.start_date || "", // Provide a default value
                endDate: applicationToEdit.end_date || "", // Provide a default value
                reason: applicationToEdit.requestor_remarks || "", // Provide a default value
              }}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          )}
        </div>
      </div>
    </main>
  );
}
