"use client";
// Import components
import TopHeader from "@/components/TopHeader";
import PendingApplicationCard from "@/components/PendingAppCard";
import RefreshButton from "@/components/RefreshButton";
import ApplicationReviewCard from "@/components/AppReviewCard";
import ApproverRemarks from "@/components/RemarksCard";
import ApproveApplicationButton from "@/components/ApproveButton";
import RejectApplicationButton from "@/components/RejectButton";
import ConfirmationModal from "@/components/ConfirmationModal"; 
import ApproveMultiple from '@/components/ApproveMultipleButton';
import RejectMultiple from '@/components/RejectMultipleButton';
import MultipleRemarks from '@/components/RemarksMultiple';
import ConfirmationMultipleModal from "@/components/ConfirmationMultipleModal";
import { useEffect, useState } from "react";

// Chakra UI
import { Box, VStack, Text, Flex, useDisclosure, useToast } from "@chakra-ui/react";

// Mantine
import { MultiSelect, Pagination, Checkbox } from "@mantine/core";

export default function ManageApplicationPage() {
  const [userId, setUserInfo] = useState(0);
  const [subApplication, setSubApplication] = useState([]);
  const [subList, setSubList] = useState([]);
  const [selectedSubIds, setSelectedSubIds] = useState([]);
  const [selectedApplications, setSelectedApplications] = useState([]); // Track selected applications
  const [currentApplicationIndex, setCurrentApplicationIndex] = useState(0); // For paginating through selected applications
  const [remarks, setRemarks] = useState({}); // State for remarks per application

  // For Refresh button
  const [isRefresh, setRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure(); // useDisclosure hook from Chakra UI
  const [currentAction, setCurrentAction] = useState(null); // Track current action (approve/reject)
  const [isMultipleOpen, setMultipleOpen] = useState(false); // State for multiple confirmation modal
  const [currentMultipleAction, setMultipleCurrentAction] = useState(null); 

  const toast = useToast();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefresh(true);
      setSelectedSubIds([]);
      setSelectedApplications([]);
      setPage(1)
      setRefreshing(false);
    }, 200);
    setRefresh(false);
  };

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        setUserInfo(data.id);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
    fetchUserData();
    fetchSubordinateApplication([]);
  }, [isRefresh]);

  const fetchSubordinateApplication = async (subordinateIds = []) => {
    try {
      const applicationResponse = await fetch(
        `/api/application/retrievePendingApplication?id=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
        }
      );

      const subPendingApplication = await applicationResponse.json();
      setSubList(subPendingApplication);

      if (subordinateIds.length !== 0) {
        const formattedList = subPendingApplication.filter(
          (sub) =>
            subordinateIds.includes(sub.user_id.toString()) &&
            sub.pendingApplications.length > 0
        );
        setSubApplication(formattedList.length > 0 ? formattedList : []);
      } else {
        setSubApplication(subPendingApplication);
      }
    } catch (error) {
      console.error("Error fetching subordinate application data:", error);
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
  const applicationsPerPage = 2;
  const paginatedApplications = handlePagination(
    subApplication
      .sort((a, b) => a.first_name.localeCompare(b.first_name))
      .flatMap((sub) =>
        sub.pendingApplications.map((application) => ({
          ...application,
          first_name: sub.first_name,
          last_name: sub.last_name,
          department: sub.department,
          position: sub.position,
        }))
      ),
    applicationsPerPage
  );

  const items = paginatedApplications[activePage - 1]?.map((application) => (
    <Flex key={application.application_id} alignItems="center">
      <Checkbox
        className="mr-3"
        checked={selectedApplications.some(
          (app) => app.application_id === application.application_id
        )} // Check by application_id
        onChange={() => {
          const isSelected = selectedApplications.some(
            (app) => app.application_id === application.application_id
          );
          const newSelectedApplications = isSelected
            ? selectedApplications.filter(
                (app) => app.application_id !== application.application_id
              )
            : [...selectedApplications, application]; // Store the full application object when selected

          setSelectedApplications(newSelectedApplications);
          // If the application was deselected, reset the currentApplicationIndex, else update it
          if (isSelected) {
            setCurrentApplicationIndex(0);
          } else {
            setCurrentApplicationIndex(newSelectedApplications.length - 1); // Set to the newly added application's index
          }
        }}
      />
      <PendingApplicationCard
        start_date={application.start_date}
        end_date={application.end_date}
        application_type={application.application_type}
        status={application.status}
        requestor_remarks={application.requestor_remarks}
        first_name={application.first_name}
        last_name={application.last_name}
        department={application.department}
        position={application.position}
        canManage={true}
      />
    </Flex>
  ));

  const handleSubordinateSelect = (selectedIds) => {
    setPage(1);
    setSelectedSubIds(selectedIds);
    setSelectedApplications([]); // Reset selected applications when subordinates change
    setRemarks({}); // Reset remarks when new subordinates are selected
    fetchSubordinateApplication(selectedIds);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allApplications = paginatedApplications.flatMap((apps) => apps);
      setSelectedApplications(allApplications); // Store the full application objects
    } else {
      setSelectedApplications([]);
      setRemarks({}); // Reset remarks when all applications are deselected
    }
  };

  // Handle pagination within selected applications
  const selectedApplicationDetails =
    selectedApplications.length > 0
      ? selectedApplications[currentApplicationIndex]
      : null;

  // Handle remarks change
  const handleRemarksChange = (applicationId, value) => {
    setRemarks((prev) => ({ ...prev, [applicationId]: value })); // Update remarks for specific application
  };

  const currentDate = new Date();
  const isDateInvalid =
    selectedApplicationDetails &&
    (new Date(selectedApplicationDetails.start_date) < currentDate ||
      new Date(selectedApplicationDetails.end_date) < currentDate);

  const isRemarksDisabled = !selectedApplicationDetails || isDateInvalid;

  // Function to handle approve action
  const handleApproveClick = () => {
    setCurrentAction("approve");
    onOpen(); // Open modal
  };

  // Function to handle reject action
  const handleRejectClick = () => {
    setCurrentAction("reject");
    onOpen(); // Open modal
  };

  // Function to handle confirmation of the action
  const handleConfirm = async () => {
    const applicationId = selectedApplicationDetails.application_id; // Get the application ID
    
    try {
      if (currentAction === "approve") {
        // Approve action
        const response = await fetch(`/api/application/approveApplication`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
          body: JSON.stringify({
            "application_id": applicationId, // Include the application ID
            "approverRemarks": remarks[applicationId] || "", // Include remarks if any
          }),
        });
  
        if (response.ok) {
          console.log("Application approved:", applicationId);
          // Optionally, update the UI to reflect the approval
        } else {
          const errorData = await response.json();
          console.error("Error approving application:", errorData.message);
          // Optionally, show an error message to the user
        }
      } else if (currentAction === "reject") {
        // Reject action
        const response = await fetch(`/api/application/rejectApplication`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
          body: JSON.stringify({
            "application_id": applicationId, // Include the application ID
            "approverRemarks": remarks[applicationId] || "", // Include remarks if any
          }),
        });
  
        if (response.ok) {
          console.log("Application rejected:", applicationId);
          // Optionally, update the UI to reflect the rejection
        } else {
          const errorData = await response.json();
          console.error("Error rejecting application:", errorData.message);
          // Optionally, show an error message to the user
        }
      }
    } catch (error) {
      console.error("Error in handleConfirm:", error);
    } finally {
      onClose(); // Close the modal after the action
    }
  };
  
  // Function to handle multiple approve action
  const handleApproveMultipleClick = () => {
    setMultipleCurrentAction("approveMultiple");
    setMultipleOpen(true); // Open the multiple confirmation modal
  };

  // Function to handle multiple reject action
  const handleRejectMultipleClick = () => {
    setMultipleCurrentAction("rejectMultiple");
    setMultipleOpen(true); // Open the multiple confirmation modal
  };

  // Function to handle confirmation of the multiple action
  const handleMultipleConfirm = () => {
    // For now, just log the selected applications
    if (currentMultipleAction === "approveMultiple") {
      console.log("Approved applications:", selectedApplications);
      // Here you can also show a toast notification
      toast({
        title: "Applications Approved",
        description: `${selectedApplications.length} applications have been approved.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else if (currentMultipleAction === "rejectMultiple") {
      console.log("Rejected applications:", selectedApplications);
      toast({
        title: "Applications Rejected",
        description: `${selectedApplications.length} applications have been rejected.`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    onMultipleClose(); // Close the modal after the action
  };

  return (
    <main>
      <TopHeader
        mainText={"Manage Application"}
        subText={"See your subordinate pending applications here!"}
      />

      <div className="flex p-[30px]">
        <div className="w-1/2">
          <Flex gap={"10px"} direction={"column"}>
            <Flex justifyContent={"space-between"}>
              <h1 className="w-full text-2xl font-bold">
                Application for Review
              </h1>
              <RefreshButton isRefresh={handleRefresh} isLoading={refreshing} />
            </Flex>
            <Flex
              gap={"5px"}
              flexWrap={"wrap"}
              alignItems={"center"}
              justifyContent={"space-between"}
            >
              <Checkbox
                className="flex"
                label="Select All"
                onChange={(e) => handleSelectAll(e.currentTarget.checked)}
              />
              <Flex gap={"5px"} flexWrap={"wrap"} justifyContent={"flex-end"}>
                <MultiSelect
                  placeholder={
                    selectedSubIds.length === 0 ? "Select Subordinate" : ""
                  }
                  data={subList
                    .sort((a, b) => a.first_name.localeCompare(b.first_name))
                    .map((sub) => ({
                      value: String(sub.user_id),
                      label: `${sub.first_name} ${sub.last_name}`,
                    }))}
                  value={selectedSubIds.map(String)}
                  onChange={handleSubordinateSelect}
                  clearable
                  styles={{
                    pillsList: {
                      display: "flex",
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: "5px",
                    },
                    input: {
                      width: "270px",
                      height: "30px",
                      maxHeight: "30px",
                      overflowY: "auto",
                      flexDirection: "row",
                      flexWrap: "wrap",
                    },
                  }}
                />
              </Flex>
            </Flex>
          </Flex>

          <Box py={5} h={"100%"}>
            <VStack spacing={5} h={"100%"}>
              {subApplication.length > 0 ? (
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
                <Text>No subordinate pending applications found</Text>
              )}
            </VStack>
          </Box>
        </div>
        {/* Application Review Card on the right side */}
        <Box w="1/2" ml={"30px"}>
        {selectedApplications.length > 1 && (
            <div className="flex flex-col gap-4 mb-4">
              <MultipleRemarks />
              <ApproveMultiple onClick={handleApproveMultipleClick} />
              <RejectMultiple onClick={handleRejectMultipleClick}/>
            </div>
          )}
          {selectedApplicationDetails ? (
            <>
              <ApplicationReviewCard
                startDate={selectedApplicationDetails.start_date}
                endDate={selectedApplicationDetails.end_date}
                applicationType={selectedApplicationDetails.application_type}
                first_name={selectedApplicationDetails.first_name}
                last_name={selectedApplicationDetails.last_name}
                position={selectedApplicationDetails.position}
                requestor_remarks={selectedApplicationDetails.requestor_remarks}
                supportingDocs={selectedApplicationDetails.supportingDocs}
              />
              {selectedApplications.length > 1 && (
                <Pagination
                  total={selectedApplications.length}
                  value={currentApplicationIndex + 1}
                  onChange={(page) => setCurrentApplicationIndex(page - 1)}
                  className="flex mt-5 justify-center"
                />
              )}
            </>
          ) : (
            <ApplicationReviewCard
              startDate=""
              endDate=""
              applicationType=""
              first_name=""
              last_name=""
              position=""
              requestor_remarks=""
              supportingDocs=""
              message="No WFH selected" // Custom prop to indicate no selection
            />
          )}
          <ApproverRemarks
            remarks={remarks[selectedApplicationDetails?.application_id] || ""} // Access remarks
            onChange={(value) =>
              handleRemarksChange(
                selectedApplicationDetails.application_id,
                value
              )
            }
            isDisabled={isRemarksDisabled}
          />
          <Flex mt={4} justifyContent="flex-end" gap={4}>
            <ApproveApplicationButton
              isDisabled={!selectedApplicationDetails || isDateInvalid}
              onClick={handleApproveClick} // Attach onClick handler
            />
            <RejectApplicationButton
              isDisabled={!selectedApplicationDetails || isDateInvalid}
              onClick={handleRejectClick} // Attach onClick handler
            />
          </Flex>
        </Box>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      action={currentAction}
      selectedApplication={selectedApplicationDetails}
      />
      {/* Confirmation Multiple Modal */}
      <ConfirmationMultipleModal
        isOpen={isMultipleOpen}
        onClose={() => setMultipleOpen(false)} // Close multiple modal
        onConfirm={handleMultipleConfirm}
        action={currentMultipleAction}
        selectedApplications={selectedApplications} // Pass selected applications if needed
      />
    </main>
  );
}
