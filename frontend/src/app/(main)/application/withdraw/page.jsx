"use client";
// import components
import TopHeader from "@/components/TopHeader";
import ApplicationCard from "@/components/ApplicationCard";
import ApplicationDetailsCard from "@/components/ApplicationDetailsCard";
import WithdrawApprovedModal from "@/components/WithdrawApprovedModal";
import WithdrawMultipleApprovedModal from "@/components/WithdrawMultipleApprovedModal";
import RefreshButton from "@/components/RefreshButton";
import { useEffect, useState } from "react";

// chakra-ui
import {
  Box,
  Button,
  Flex,
  Textarea,
  Text,
  useToast,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";

// mantine
import { Pagination, Checkbox, MultiSelect } from "@mantine/core";

export default function WithdrawApplicationPage() {
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [appToWithdraw, setAppToWithdraw] = useState(null);
  const [appsToWithdraw, setAppsToWithdraw] = useState([]);
  const [subsWithApproved, setSubsWithApproved] = useState([]); // Holds subordinate data
  const [selectedSubIds, setSelectedSubIds] = useState([]);
  const [noApprovedApplications, setNoApprovedApplications] = useState(false);
  const [paginatedApplications, setPaginatedApplications] = useState([]);

  const [selectedApplications, setSelectedApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [currentApplicationIndex, setCurrentApplicationIndex] = useState(0); // For paginating through selected applications
  const [remarks, setRemarks] = useState("");
  const [remarksMultiple, setRemarksMultiple] = useState("");

  // Toast handling
  const toast = useToast();

  // For Refresh button
  const [isRefresh, setRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Handle pagination within selected applications
  const selectedApplicationDetails =
    selectedApplications.length > 0
      ? selectedApplications[currentApplicationIndex]
      : null;

  // For Withdrawal Modal
  const {
    isOpen: isModalWithdrawOpen,
    onOpen: onModalWithdrawOpen,
    onClose: onModalWithdrawClose,
  } = useDisclosure();

  // For Withdrawal Multiple Modal
  const {
    isOpen: isModalWithdrawMultipleOpen,
    onOpen: onModalWithdrawMultipleOpen,
    onClose: onModalWithdrawMultipleClose,
  } = useDisclosure();

  const handleRefresh = () => {
    setRefreshing(true);
    setRefresh(true);
    // Reset refreshing and isRefresh after a short delay to mimic loading behavior
    setTimeout(() => {
      setRefreshing(false); // Reset the refreshing state after the delay
      setRefresh(false); // Optionally reset isRefresh if you want it to stop triggering fetch
    }, 200);
  };

  useEffect(() => {
    async function fetchApprovedAppData() {
      try {
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
        setFilteredApplications(allApprovedApps);

        const employeesWithApprovedApps = allApprovedApps.filter((employee) => {
          // Log the employee object for debugging
          console.log(
            "Checking Employee:",
            employee.first_name,
            employee.last_name
          );
          console.log(
            "Employee Approved Applications:",
            employee.approvedApplications
          );

          // Return true if the employee has non-empty approvedApplications
          return (
            employee.approvedApplications &&
            employee.approvedApplications.length > 0
          );
        });

        // Log the result after filtering
        console.log("DEBUG APPROVED", employeesWithApprovedApps);

        setSubsWithApproved(employeesWithApprovedApps); // Saving the subordinates data
      } catch (error) {
        console.error("Error fetching approved application data:", error); // Log errors
      }
    }

    fetchApprovedAppData();
  }, [isRefresh]);

  useEffect(() => {
    const noApps = approvedApplications.every(
      (user) => user.approvedApplications.length === 0
    );
    setNoApprovedApplications(noApps);
  }, [approvedApplications]);

  // Handle withdrawal function
  const handleWithdraw = async (application_id, remarks) => {
    try {
      const response = await fetch("/api/application/withdrawApproved", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ application_id, remarks }),
      });

      if (response.ok) {
        // Update the approved applications state
        console.log("RESPONSE OK");

        // Show success toast
        toast({
          title: "Application Withdrawn",
          description: "The application was successfully withdrawn.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });

        // Update approvedApplications state
        setRefresh(true);

        // Update selectedApplications state to remove the withdrawn application
        setSelectedApplications((prev) =>
          prev.filter((app) => app.application_id !== application_id)
        );

        // Handle currentApplicationIndex adjustment if necessary
        if (
          selectedApplicationDetails &&
          selectedApplicationDetails.application_id === application_id
        ) {
          setCurrentApplicationIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : 0
          );
        }

        setRemarks("");
        setSelectedSubIds([]); // Clear selected subordinates after the process
        onModalWithdrawClose(); // Close modal after successful withdrawal
      } else {
        console.error("Failed to withdraw application");
        // Show error toast
        toast({
          title: "Error",
          description: "Failed to withdraw the application.",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Error withdrawing application:", error);
      // Show error toast
      toast({
        title: "Error",
        description: "An error occurred while withdrawing the application.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const handleMultipleWithdraw = async (applicationArray, remarks) => {
    try {
      const promises = applicationArray.map(async (application) => {
        const application_id = application.application_id;
        const response = await fetch("/api/application/withdrawApproved", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ application_id, remarks }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to withdraw application ID: ${application_id}`
          );
        }

        // Return the response for further processing if needed
        return response;
      });

      // Wait for all the promises (API calls) to complete
      await Promise.all(promises);

      setRefresh(true);
      setSelectedApplications((prev) =>
        prev.filter(
          (app) =>
            !applicationArray.some(
              (a) => a.application_id === app.application_id
            )
        )
      );
      setRemarks(""); // Clear remarks after the process
      setSelectedSubIds([]); // Clear selected subordinates after the process
      return { ok: true }; // Return success response to modal
    } catch (error) {
      console.error("Error withdrawing applications:", error);
      return { ok: false }; // Return failure response to modal
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
      setRemarks(""); // Reset remarks when all applications are deselected
      setRemarksMultiple("");
    }
  };

  // Handle filtering of selected applications
  function handleFilterApplications(employeeIds) {
    const filteredApps = approvedApplications.filter((app) => {
      // Check if the created_by (employee ID) exists in the employeeIds array
      return employeeIds.includes(String(app.user_id));
    });
    // Update the state with filtered applications
    setFilteredApplications(filteredApps);
  }

  // Handle individual application selection
  const handleSubordinateSelect = (selectedIds) => {
    setPage(1);
    setSelectedSubIds(selectedIds);
    setSelectedApplications([]); // Reset selected applications when subordinates change
    setRemarks(""); // Reset remarks when all applications are deselected
    setRemarksMultiple("");
    handleFilterApplications(selectedIds);
  };

  // Pagination state
  const [activePage, setPage] = useState(1);

  // Number of applications per page
  const applicationsPerPage = 2;

  useEffect(() => {
    // Use filteredApplications if it's not empty, otherwise fallback to approvedApplications
    const applicationsToUse =
      filteredApplications.length > 0
        ? filteredApplications
        : approvedApplications;
    console.log(
      "DEBUG APPS",
      applicationsToUse,
      "filtered",
      filteredApplications,
      "total",
      approvedApplications
    );

    const updatedPaginatedApplications = handlePagination(
      applicationsToUse
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

    setPaginatedApplications(updatedPaginatedApplications);
  }, [approvedApplications, filteredApplications, applicationsPerPage]); // Add filteredApplications to the dependency array

  const items = paginatedApplications[activePage - 1]?.map((application) => {
    return (
      <Flex key={application.application_id} alignItems="center" width="100%">
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
        <ApplicationCard
          start_date={application.start_date}
          end_date={application.end_date}
          application_type={application.application_type}
          status={application.status}
          requestor_remarks={application.requestor_remarks}
          first_name={application.first_name}
          last_name={application.last_name}
          department={application.department}
          position={application.position}
          canManage={false}
        />
      </Flex>
    );
  });

  // Function to handle withdraw action
  const handleWithdrawClick = () => {
    if (!selectedApplicationDetails || !remarks || !String(remarks).trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for withdrawal.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }
    setAppToWithdraw(selectedApplicationDetails); // Set the application to be withdrawn
    onModalWithdrawOpen(); // Open the modal
  };

  // Function to handle withdraw multiple action
  const handleWithdrawMultipleClick = () => {
    if (
      selectedApplications.length > 1 &&
      remarksMultiple &&
      String(remarksMultiple).trim()
    ) {
      setAppsToWithdraw(selectedApplications); // Set applications to withdraw (multiple)
      setAppToWithdraw(null); // Ensure single withdrawal state is null
      onModalWithdrawMultipleOpen(); // Open the multiple withdrawal modal
    } else {
      toast({
        title: "Error",
        description: "Please provide a reason for withdrawal.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }
  };

  return (
    <main>
      <TopHeader
        mainText={"Withdraw Applications"}
        subText={"Withdraw approved WFH arrangements"}
      />

      <div className="flex p-[30px] gap-[30px]">
        <div className="w-1/2">
          <Flex gap={"10px"} direction={"column"}>
            <Flex justifyContent={"space-between"}>
              <h1 className="w-full text-2xl font-bold">
                Applications for Review
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
                  data={subsWithApproved
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
              {!noApprovedApplications ? (
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
            <WithdrawApprovedModal
              isOpen={isModalWithdrawOpen}
              onClose={onModalWithdrawClose}
              applicantName={`${appToWithdraw.first_name} ${appToWithdraw.last_name}`}
              applicationType={appToWithdraw.application_type}
              startDate={appToWithdraw.start_date}
              endDate={appToWithdraw.end_date}
              onConfirm={() =>
                handleWithdraw(appToWithdraw.application_id, remarks)
              } // Pass handleWithdraw function to WithdrawApprovedModal
            />
          )}
          {/* Show the multiple withdrawal modal only when withdrawing multiple applications */}
          {appsToWithdraw.length > 1 && (
            <WithdrawMultipleApprovedModal
              isOpen={isModalWithdrawMultipleOpen}
              onClose={onModalWithdrawMultipleClose}
              selectedApplications={appsToWithdraw}
              onConfirm={() =>
                handleMultipleWithdraw(appsToWithdraw, remarksMultiple)
              } // Handle multiple withdraw
            />
          )}
        </div>

        <div className="w-1/2">
          <Flex alignItems="center" width="100%">
            <Box width="100%">
              {selectedApplications.length > 1 && (
                <div className="flex flex-col gap-4 mb-8">
                  <Text fontWeight="bold" color="gray.600">
                    Reason for Withdrawal ({selectedApplications.length}{" "}
                    Selected): <span style={{ color: "red" }}>*</span>
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
                  <Flex justifyContent="flex-start" w="full">
                    <Button
                      colorScheme="red"
                      width="full"
                      onClick={handleWithdrawMultipleClick}
                      isDisabled={
                        !(remarksMultiple && String(remarksMultiple).trim())
                      }
                    >
                      Withdraw All Selected
                    </Button>
                  </Flex>
                </div>
              )}
              {selectedApplicationDetails ? (
                <>
                  <ApplicationDetailsCard
                    startDate={selectedApplicationDetails.start_date}
                    endDate={selectedApplicationDetails.end_date}
                    applicationType={
                      selectedApplicationDetails.application_type
                    }
                    first_name={selectedApplicationDetails.first_name}
                    last_name={selectedApplicationDetails.last_name}
                    position={selectedApplicationDetails.position}
                    requestor_remarks={
                      selectedApplicationDetails.requestor_remarks
                    }
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
                <ApplicationDetailsCard
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
                  Reason for Withdrawal: <span style={{ color: "red" }}>*</span>
                </Text>
                <Textarea
                  placeholder="Enter required reason here..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  bg="gray.50"
                  borderColor="gray.300"
                  focusBorderColor="blue.500"
                  resize="none"
                  height="100px"
                  isDisabled={selectedApplications == 0} // Use isDisabled prop to control input
                />
              </Box>
              <Flex mt={4} justifyContent="flex-start" w="full">
                <Button
                  colorScheme="red"
                  width="full"
                  onClick={handleWithdrawClick}
                  isDisabled={!(remarks && String(remarks).trim())}
                >
                  Withdraw Application
                </Button>
              </Flex>
            </Box>
          </Flex>
        </div>
      </div>
    </main>
  );
}
