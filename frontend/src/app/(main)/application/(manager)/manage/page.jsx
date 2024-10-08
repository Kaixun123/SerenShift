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
  const [subInfo, setSubInfo] = useState([]);

  // For Refresh button
  const [isRefresh, setRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
        const applicationResponse = await fetch(
          `/api/manager/retrievePendingApplication?id=${data.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const subPendingApplication = await applicationResponse.json();

        setSubInfo(subPendingApplication);
      } catch (error) {
        console.error("Error fetching pending application data:", error);
      }
    }

    fetchPendingAppData();
  }, [isRefresh]);

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
    subInfo.flatMap((sub) =>
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
                  placeholder="Select Subordinate"
                  data={subInfo
                    .sort((a, b) => a.first_name.localeCompare(b.first_name))
                    .map((sub) => ({
                      value: String(sub.user_id),
                      label: `${sub.first_name} ${sub.last_name}`,
                    }))}
                  styles={{
                    input: {
                      width: "220px",
                      height: "30px",
                      maxHeight: "30px",
                      overflowY: "auto",
                    },
                  }}
                />
              </Flex>
            </Flex>
          </Flex>

          <Box py={5} h={"100%"}>
            <VStack spacing={5} h={"100%"}>
              {subInfo.length > 0 ? (
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
