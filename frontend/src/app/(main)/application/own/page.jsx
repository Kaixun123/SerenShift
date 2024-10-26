"use client";
// import components
import TopHeader from "@/components/TopHeader";
import ApplicationCard from "@/components/ApplicationCard";
import WithdrawalModal from "@/components/WithdrawModal";
import RefreshButton from "@/components/RefreshButton";
import EditApplicationCard from "@/components/EditApplicationCard"; // Import EditApplicationCard
import { useEffect, useState } from "react";

// chakra-ui
import { Box, VStack, Text, useDisclosure, useToast } from "@chakra-ui/react";

// mantine
import { Pagination } from "@mantine/core";

export default function PendingApplicationPage() {
  const [applications, setApplications] = useState([]);
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
    async function fetchApplicationsData() {
      try {
        const applicationResponse = await fetch(
          `/api/application/retrieveApplications`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const pendingApplication = await applicationResponse.json();
        setApplications(pendingApplication);
      } catch (error) {
        console.error("Error fetching pending application data:", error);
      }
    }

    fetchApplicationsData();
  }, [isRefresh]);

  // Handle withdrawal function
  const handleWithdraw = async (applicationId, applicationStatus) => {
    const apiEndpoint =
      applicationStatus === "Pending"
        ? "/api/application/withdrawPending"
        : applicationStatus === "Approved"
        ? "/api/application/withdrawApprovedApplicationByEmployee"
        : null;

    const method =
      applicationStatus === "Pending"
        ? "PUT"
        : applicationStatus === "Approved"
        ? "DELETE"
        : null;

    if (!apiEndpoint) {
      console.error("Invalid application status");
      onModalWithdrawClose();
      setPage(1);
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ application_id: applicationId }),
      });
      if (response.ok) {
        setApplications((prev) =>
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
    } else if (
      startDateTime.getHours() === 14 &&
      endDateTime.getHours() === 18
    ) {
      timeSlot = "pm";
    } else if (
      startDateTime.getHours() === 9 &&
      endDateTime.getHours() === 18
    ) {
      timeSlot = "fullDay";
    }

    // Set the application to be edited along with derived timeSlot
    setApplicationToEdit({
      ...application,
      timeSlot, // Include the derived timeSlot
    });
  };

  const handleSaveEdit = async (updatedData) => {

    const formData = new FormData();
    formData.append('application_id', applicationToEdit.application_id);
    formData.append('application_type', updatedData.application_type || applicationToEdit.application_type);
    formData.append('originalStartDate', applicationToEdit.start_date);
    formData.append('originalEndDate', applicationToEdit.end_date);
    formData.append('newStartDate', updatedData.startDate || applicationToEdit.start_date);
    formData.append('newEndDate', updatedData.endDate || applicationToEdit.end_date);
    formData.append('requestor_remarks', updatedData.reason || applicationToEdit.requestor_remarks);

    //append only for regular applications
    if (updatedData.application_type == "Regular") {
      formData.append("recurrence_rule", updatedData.recurrenceRule || applicationToEdit.recurrenceRule);
      formData.append("recurrence_end_date", updatedData.recurrenceEndDate || applicationToEdit.recurrenceEndDate);
    }


    // Append each file to FormData if files are provided
    if (updatedData.files && updatedData.files.length > 0) {
      updatedData.files.forEach((file) => {
          formData.append('files', file);
      });
    }

    const apiEndpoint =
      applicationToEdit.status === "Pending"
        ? "/api/application/updatePendingApplication"
        : applicationToEdit.status === "Approved"
        ? "/api/application/updateApprovedApplication"
        : null;

    try {
      const response = await fetch(
        apiEndpoint,
        {
          method: "PATCH",
          body: formData,
        }
      );

      if (response.status === 200 || response.status === 201  ) {

        // Show success toast message
        toast({
          title: "Application updated.",
          description: "Your application has been successfully updated.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
        handleRefresh();
      } else {
        // Handle different error statuses
        const errorData = await response.json();
        const errorMessage = errorData.message || "Failed to update application.";
        
        console.error(`Error (${response.status}): ${errorMessage}`);

        toast({
          title: "Error",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Error updating application:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the application.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
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
    applications,
    applicationsPerPage
  );

  // Items for the current page
  const items = paginatedApplications[activePage - 1]?.map((application) => (
    <ApplicationCard
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
        mainText={"Own Applications"}
        subText={"See your own applications here!"}
      />

      <div className="flex p-[30px]">
        <div className="w-1/2">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold">Own Applications</h1>
            <RefreshButton isRefresh={handleRefresh} isLoading={refreshing} />
          </div>
          <Box py={5} h={"100%"}>
            <VStack spacing={5} h={"100%"}>
              {applications.length > 0 ? (
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
                <Text>Applications not found</Text>
              )}
            </VStack>
          </Box>
          {appToWithdraw && (
            <WithdrawalModal
              isOpen={isModalWithdrawOpen}
              onClose={onModalWithdrawClose}
              status={appToWithdraw.status}
              applicationType={appToWithdraw.application_type}
              startDate={appToWithdraw.start_date}
              endDate={appToWithdraw.end_date}
              onConfirm={() =>
                handleWithdraw(
                  appToWithdraw.application_id,
                  appToWithdraw.status
                )
              } // Pass handleWithdraw function to WithdrawalModal
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
                files: applicationToEdit.file || [],
              }}
              onSave={(updatedData) => handleSaveEdit(updatedData)}
              onCancel={handleCancelEdit}
            />
          )}
        </div>
      </div>
    </main>
  );
}
