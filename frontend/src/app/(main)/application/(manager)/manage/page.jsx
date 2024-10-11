"use client";
// Import components
import TopHeader from "@/components/TopHeader";
import PendingApplicationCard from "@/components/PendingAppCard";
import RefreshButton from "@/components/RefreshButton";
import ApplicationReviewCard from "@/components/AppReviewCard";
import ApproverRemarks from "@/components/RemarksCard";
import ApproveApplicationButton from "@/components/ApproveButton";
import RejectApplicationButton from "@/components/RejectButton";
import { useEffect, useState } from "react";

// Chakra UI
import { Box, VStack, Text, Flex } from "@chakra-ui/react";

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

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefresh(true);
      setSelectedSubIds([]);
      setSelectedApplications([]);
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
        }
      );

      const subPendingApplication = await applicationResponse.json();
      setSubList(subPendingApplication);

      if (subordinateIds.length !== 0) {
        const formattedList = subPendingApplication.filter((sub) =>
          subordinateIds.includes(sub.user_id.toString())
        );
        setSubApplication(formattedList);
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
        className="mr-2"
        checked={selectedApplications.some((app) => app.application_id === application.application_id)} // Check by application_id
        onChange={() => {
          const isSelected = selectedApplications.some((app) => app.application_id === application.application_id);
          const newSelectedApplications = isSelected
            ? selectedApplications.filter((app) => app.application_id !== application.application_id)
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
  const selectedApplicationDetails = selectedApplications.length > 0 
    ? selectedApplications[currentApplicationIndex]
    : null;

  // Handle remarks change
  const handleRemarksChange = (applicationId, value) => {
    setRemarks((prev) => ({ ...prev, [applicationId]: value })); // Update remarks for specific application
  };

  const currentDate = new Date();
  const isDateInvalid = selectedApplicationDetails && 
  (new Date(selectedApplicationDetails.start_date) < currentDate || 
  new Date(selectedApplicationDetails.end_date) < currentDate);


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
        <Box w="1/2" ml={5}>
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
            value={remarks[selectedApplicationDetails?.application_id] || ""} // Safely access remarks
            onChange={(value) => handleRemarksChange(selectedApplicationDetails?.application_id, value)}
          />
          <Flex mt={4} justifyContent="flex-end" gap={4}>
            <ApproveApplicationButton isDisabled={!selectedApplicationDetails || isDateInvalid}/>
            <RejectApplicationButton isDisabled={!selectedApplicationDetails || isDateInvalid}/>
          </Flex>
        </Box>
      </div>
    </main>
  );
}
