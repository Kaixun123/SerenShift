"use client";
// import components
import TopHeader from "@/components/TopHeader";
import PendingApplicationCard from "@/components/PendingApplicationCard";
import WithdrawalModal from "@/components/WithdrawModal";
import RefreshButton from "@/components/RefreshButton";
import { useEffect, useState } from "react";

// chakra-ui
import { Box, Button, Flex, Input, Link, Select, Textarea, Text, useDisclosure, VStack } from "@chakra-ui/react";

// mantine
import { MantineProvider, Pagination, Checkbox } from "@mantine/core";

export default function WithdrawApplicationPage() {
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [appToWithdraw, setAppToWithdraw] = useState(null);
  const [subordinates, setSubordinates] = useState([]); // Holds subordinate data
  const [scheduleData, setScheduleData] = useState(null);
  const [currentAction, setCurrentAction] = useState(null); // Track current action
  const [selectedApplications, setSelectedApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [currentApplicationIndex, setCurrentApplicationIndex] = useState(0); // For paginating through selected applications
  const [remarks, setRemarks] = useState('');
  const [remarksMultiple, setRemarksMultiple] = useState('');


  // For Refresh button
  const [isRefresh, setRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Handle pagination within selected applications
  const selectedApplicationDetails = selectedApplications.length > 0 
    ? selectedApplications[currentApplicationIndex]
    : null;

  const uniquePositions = Array.from(
    new Set(subordinates.map((subordinate) => subordinate.position))
  );
  
  // Filter applications based on selected position
  useEffect(() => {
    if (selectedPosition) {
      // Filter applications based on subordinates with the selected position
      const filteredApps = approvedApplications.filter((app) => 
        subordinates.some((subordinate) =>
          subordinate.position == selectedPosition && subordinate.user_id == app.created_by
        )
      );
      console.log("Filtered Applications:", filteredApps); // Debugging log
      setFilteredApplications(filteredApps); // Set filtered applications
    } else {
      // If no position is selected, show all applications
      setFilteredApplications(approvedApplications);
    }
  }, [selectedPosition, subordinates, approvedApplications]);
  
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
    async function fetchApprovedAppData() {
      try {
        // Fetch the subordinates of the current user
        const subordinatesResponse = await fetch("/api/employee/subordinates");
        const subordinatesData = await subordinatesResponse.json();
  
        // Save the fetched subordinates into the state
        setSubordinates(subordinatesData); // Saving the subordinates data
    
        // Fetch approved applications for each subordinate sequentially
        const applicationResponse = await fetch(
          `/api/application/retrieveApprovedApplication`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!applicationResponse.ok) {
          throw new Error(`HTTP error! status: ${applicationResponse.status}`);
        }

        const allApprovedApps = await applicationResponse.json();
        setApprovedApplications(allApprovedApps);
          
        console.log("DEBUG: All Approved Applications:", allApprovedApps); // Log the combined applications
      } catch (error) {
        console.error("Error fetching approved application data:", error); // Log errors
      }
    }
  
    fetchApprovedAppData();
  }, [isRefresh]);
  
  // Handle withdrawal function
  const handleWithdraw = async (applicationId) => {
    try {
      const response = await fetch("/api/application/withdrawApproved", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applicationId }),
      });
      if (response.ok) {
        // Update the pending applications state
        setApprovedApplications((prev) =>
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

  // Handle multiple withdrawal function
  const handleWithdrawMultiple = async (applicationIds) => {
    try {
      // Make sure applicationIds is an array
      if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
        console.error("No applications selected for withdrawal.");
        return;
      }
  
      // Loop through each applicationId and send the withdraw request one by one
      for (const applicationId of applicationIds) {
        const response = await fetch("/api/application/withdrawApproved", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ applicationId }),
        });
  
        if (response.ok) {
          // If the request was successful, remove the application from the state
          setApprovedApplications((prev) =>
            prev.filter((app) => app.application_id !== applicationId)
          );
        } else {
          console.error(`Failed to withdraw application with ID ${applicationId}`);
        }
      }
  
      // After all requests have been processed, close the modal
      onModalWithdrawClose();
  
    } catch (error) {
      console.error("Error withdrawing applications:", error);
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

  const handleSelectAll = (checked) => {
    if (checked) {
      const allApplications = paginatedApplications.flatMap((apps) => apps);
      setSelectedApplications(allApplications); // Store the full application objects
    } else {
      setSelectedApplications([]);
      setRemarks({}); // Reset remarks when all applications are deselected
    }
  };

  // Handle individual application selection
  const handleSelectApplication = (applicationId, checked) => {
    if (checked) {
      setSelectedApplications((prev) => [...prev, applicationId]);
    } else {
      setSelectedApplications((prev) => prev.filter((id) => id !== applicationId));
    }
  };

  // Pagination state
  const [activePage, setPage] = useState(1);

  // Number of applications per page
  const applicationsPerPage = 2;
  const paginatedApplications = handlePagination(
    approvedApplications
      .sort((a, b) => a.first_name.localeCompare(b.first_name))
      .flatMap((sub) =>
        sub.approvedApplications.map((application) => ({
          ...application,
          first_name: sub.first_name,
          last_name: sub.last_name,
          department: sub.department,
          position: sub.position,
        }))
      ),
    applicationsPerPage
  );

  // Items for the current page
  const items = paginatedApplications[activePage - 1]?.map((application) => {
    console.log("Application status:", application.status);
    
    return (
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
  )});

  // Details card (from Jon):
  const ApplicationReviewCard = ({
    startDate = "",
    endDate = "",
    applicationType = "",
    first_name = "",
    last_name = "",
    position = "",
    requestor_remarks = "",
    supportingDocs = "",
  }) => {
    // Construct the applicant's full name
    const applicantName = `${first_name} ${last_name}`;
  
    // Function to format the date and time to dd/mm/yyyy hh:mm AM/PM
    const formatDateTime = (dateString) => {
      if (!dateString) return "N/A"; // Handle empty date
      const options = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true, // Optional: Set to false for 24-hour format
      };
      return new Date(dateString).toLocaleString("en-GB", options); // en-GB formats it as dd/mm/yyyy
    };
  
    // Date check
    const currentDate = new Date();
    const isPastDate = new Date(startDate) < currentDate || new Date(endDate) < currentDate;
  
    // Check if the application details are provided
    if (!first_name && !last_name) {
      return (
        <Box
          p={4}
          border="1px solid #E2E8F0"
          borderRadius="md"
          boxShadow="sm"
          maxW="400px"
          bg="white"
        >
          <Text textAlign="center" fontWeight="bold" color="gray.500">
            No WFH applications to review
          </Text>
        </Box>
      );
    }
  
    return (
      <Box
        p={4}
        border="1px solid #E2E8F0"
        borderRadius="md"
        boxShadow="sm"
        maxW="400px"
        bg="white"
      >
        <Flex direction="column" gap={3}>
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">Applicant</Text>
            <Input
              isReadOnly
              value={applicantName}
              bg="gray.100"
              border="none"
              size="sm"
              width="70%"
            />
          </Flex>
  
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">Applicant Position</Text>
            <Input
              isReadOnly
              value={position}
              bg="gray.100"
              border="none"
              size="sm"
              width="70%"
            />
          </Flex>
  
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">Type of Arrangement</Text>
            <Input
              isReadOnly
              value={applicationType}
              bg="gray.100"
              border="none"
              size="sm"
              width="70%"
            />
          </Flex>
  
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">Start Date/Time</Text>
            <Input
              isReadOnly
              value={formatDateTime(startDate) || "23/09/2024 01:00 PM"}
              bg={isPastDate ? "red.100" : "gray.100"} // Change background color to red if past date
              border="none"
              size="sm"
              width="70%"
            />
          </Flex>
  
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">End Date/Time</Text>
            <Input
              isReadOnly
              value={formatDateTime(endDate) || "23/09/2024 06:00 PM"}
              bg={isPastDate ? "red.100" : "gray.100"} // Change background color to red if past date
              border="none"
              size="sm"
              width="70%"
            />
          </Flex>
  
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">Requestor Remarks</Text>
            <Input
              isReadOnly
              value={requestor_remarks}
              bg="gray.100"
              border="none"
              size="sm"
              width="70%"
            />
          </Flex>
  
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">Supporting Documents</Text>
            <Link href="#" color="blue.500" isExternal>
              {supportingDocs}
            </Link>
          </Flex>
        </Flex>
      </Box>
    );
  };

  // Function to handle withdraw action
  const handleWithdrawClick = () => {
    setCurrentAction("withdraw");
    onOpen(); // Open modal
  };


  

  return (
    <main>
      <TopHeader
        mainText={"Withdraw Applications"}
        subText={"Withdraw approved WFH arrangements"}
      />

      <div className="flex p-[30px]">
        <div className="w-1/2">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold">Find Applications:</h1>
            <RefreshButton isRefresh={handleRefresh} isLoading={refreshing} />
          </div>
          <Select
              onChange={(e) => setSelectedPosition(e.target.value)}
              value={selectedPosition}
              borderColor="gray.300"        // Grey border color
              focusBorderColor="gray.500"   // Grey border color when focused
              _hover={{ borderColor: "gray.400" }}  // Grey border on hover
            >
              <option value="">All Positions</option>
              {uniquePositions.map((position, index) => (
                <option key={index} value={position}>
                  {position}
                </option>
              ))}
            </Select>
          <Box mt={4}>
          <MantineProvider withGlobalStyles withNormalizeCSS>
            <Checkbox 
              styles={{ input: { backgroundColor: 'lightgrey', borderColor: 'white'} }} 
              label="Select All"
              onChange={(e) => handleSelectAll(e.currentTarget.checked)}
            />
          </MantineProvider>
          </Box>
          <Box py={5} h={"100%"}>
          <VStack spacing={5} h={"100%"}>
              {approvedApplications.length > 0 ? (
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
                <Text>No subordinate approved applications found</Text>
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

        <div className="w-1/2">
        <Box w="1/2" maxW="400px" ml={10}>
        {selectedApplications.length > 1 && (
            <div className="flex flex-col gap-4 mb-4">
              <Text fontWeight="bold" color="gray.600">
                Reason for Withdrawal (All Selected): <span style={{ color: 'red' }}>*</span>
              </Text>
              <Textarea
                placeholder="Enter required reason here..."
                onChange={(e) => setRemarksMultiple(e.target.value)}
                bg="gray.50"
                borderColor="gray.300"
                focusBorderColor="blue.500"
                resize="none"
                height="100px"
              />
              <Flex mt={4} justifyContent="flex-start" w="full">
                <Button 
                    colorScheme="red"
                    width="full"
                    onClick={handleWithdrawMultiple}
                    isDisabled={!(remarks && String(remarks).trim())}
                    >
                  Withdraw All Selected
                </Button>
              </Flex>
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
          <Box mt={4}>
            <Text fontWeight="bold" color="gray.600">
              Reason for Withdrawal: <span style={{ color: 'red' }}>*</span>
            </Text>
              <Textarea
                placeholder="Enter required reason here..."
                onChange={(e) => setRemarks(e.target.value)}
                bg="gray.50"
                borderColor="gray.300"
                focusBorderColor="blue.500"
                resize="none"
                height="100px"
                // isDisabled={isDisabled} // Use isDisabled prop to control input
              />
            </Box>
          <Flex mt={4} justifyContent="flex-start" w="full">
            <Button 
                colorScheme="red"
                width="full"
                onClick={handleWithdraw}
                isDisabled={!(remarks && String(remarks).trim())}
                >
              Withdraw Application
            </Button>
          </Flex>
        </Box>
        </div>
      </div>
    </main>
  );
}
