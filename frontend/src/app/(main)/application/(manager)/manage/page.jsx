"use client";
// import components
import TopHeader from "@/components/TopHeader";
import PendingApplicationCard from "@/components/PendingAppCard";
import RefreshButton from "@/components/RefreshButton";
import { useEffect, useState } from "react";

// chakra-ui
import { Box, VStack, Text, Flex } from "@chakra-ui/react";

// mantine
import { MultiSelect, Pagination, Checkbox } from "@mantine/core";

export default function ManageApplicationPage() {
  const [userId, setUserInfo] = useState(0);
  const [subApplication, setSubApplication] = useState([]);
  const [subList, setSubList] = useState([]);
  const [selectedSubIds, setSelectedSubIds] = useState([]);

  // For Refresh button
  const [isRefresh, setRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefresh(true);
      setSelectedSubIds([]);
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
      // Retrieve Pending Application List
      const applicationResponse = await fetch(
        `/api/manager/retrievePendingApplication?id=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const subPendingApplication = await applicationResponse.json();
      setSubList(subPendingApplication);

      if (subordinateIds.length != 0) {
        let formattedList = [];
        subPendingApplication.map((sub) => {
          if (subordinateIds.includes(sub.user_id.toString())) {
            formattedList.push(sub);
          }
        });
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

  // Number of applications per page
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

  // Items for the current page
  const items = paginatedApplications[activePage - 1]?.map((application) => (
    <PendingApplicationCard
      key={application.application_id}
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
  ));

  const handleSubordinateSelect = (selectedIds) => {
    setPage(1);
    setSelectedSubIds(selectedIds);
    fetchSubordinateApplication(selectedIds);
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
                //   checked={allChecked}
                //   indeterminate={indeterminate}
                label="Select All"
                //   onChange={() =>
                //     handlers.setState((current) =>
                //       current.map((value) => ({ ...value, checked: !allChecked }))
                //     )
                //   }
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
      </div>
    </main>
  );
}
