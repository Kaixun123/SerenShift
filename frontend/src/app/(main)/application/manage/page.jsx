"use client";
// import components
import TopHeader from "@/components/TopHeader";
import ApplicationReview from "@/components/ApplicationReviewCard";
import RequestorRemarks from "@/components/RemarksCard";
import ApproveApplicationButton from "@/components/ApproveApplicationButton";
import ApproveDatesButton from "@/components/ApproveDatesButton";
import RejectApplicationButton from "@/components/RejectApplicationButton";
import { useEffect, useState } from "react";

// chakra-ui
import {
  Box,
  Card,
  CardBody,
  Flex,
  Text,
  Checkbox,
  VStack,
} from "@chakra-ui/react";

export default function ManageApplicationsPage() {
  const [pendingApplications, setPendingApplications] = useState([]);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);

  useEffect(() => {
    async function fetchPendingAppData() {
      try {
        // Uncomment this to use API data
        // const response = await fetch("/api/auth/me");
        // const data = await response.json();

        // Hardcoded pending application data for now
        const hardcodedData = [
          {
            application_id: 31,
            start_date: "2024-10-02T01:00:00.000Z",
            end_date: "2024-10-02T05:00:00.000Z",
            application_type: "Ad Hoc",
            first_name: "John",
            last_name: "Doe",
            requestor_remarks: "Need to work from home",
            supporting_documents: "Document1.pdf, Document2.pdf",
          },
          {
            application_id: 32,
            start_date: "2024-10-03T01:00:00.000Z",
            end_date: "2024-10-03T05:00:00.000Z",
            application_type: "Regular",
            first_name: "Jane",
            last_name: "Smith",
            requestor_remarks: "Need to work from home",
            supporting_documents: "Document3.pdf",
          },
          // Add more hardcoded applications as needed
        ];

        // Set hardcoded data as pending applications
        setPendingApplications(hardcodedData);
      } catch (error) {
        console.error("Error fetching pending application data:", error);
      }
    }

    fetchPendingAppData();
  }, []);

  // Get the selected applications details based on IDs
  const selectedApplications = pendingApplications.filter(app => selectedApplicationIds.includes(app.application_id));

  return (
    <main>
      <TopHeader
        mainText={"Manage Applications"}
        subText={"See your pending applications here!"}
      />

      <Box p={5}>
        {pendingApplications.length > 0 ? (
          <>
            {/* Box with border around the checklist */}
            <Box border="1px" borderColor="gray.300" borderRadius="md" p={4} mb={5}>
              {/* Checkbox List for selecting applications */}
              <VStack spacing={4}>
                {pendingApplications.map((application) => (
                  <Checkbox
                    key={application.application_id}
                    isChecked={selectedApplicationIds.includes(application.application_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedApplicationIds([...selectedApplicationIds, application.application_id]);
                      } else {
                        setSelectedApplicationIds(selectedApplicationIds.filter(id => id !== application.application_id));
                      }
                    }}
                  >
                    Application #{application.application_id} - {application.application_type}
                  </Checkbox>
                ))}
              </VStack>
            </Box>

            {/* Display selected application details and remarks */}
            <Flex justifyContent="flex-end" gap={5}>
              {/* Application Review Card */}
              <Card width="45%">
                <CardBody>
                  {selectedApplications.length > 0 ? (
                    selectedApplications.map((selectedApplication) => (
                      <ApplicationReview
                        key={selectedApplication.application_id}
                        startDate={selectedApplication.start_date}
                        endDate={selectedApplication.end_date}
                        applicationType={selectedApplication.application_type}
                        applicantName={`${selectedApplication.first_name} ${selectedApplication.last_name}`}
                        reason={selectedApplication.requestor_remarks || "No reason provided"}
                        supportingDocs={selectedApplication.supporting_documents || "None"}
                      />
                    ))
                  ) : (
                    <Text>No WFH applications to review</Text>
                  )}
                </CardBody>
              </Card>

              {/* Requestor Remarks Card - Always present */}
              <Card width="45%">
                <CardBody>
                  {selectedApplications.length > 0 ? (
                    selectedApplications.map((selectedApplication) => (
                      <RequestorRemarks
                        key={selectedApplication.application_id}
                        remarks={selectedApplication.requestor_remarks || "No remarks provided"}
                      />
                    ))
                  ) : (
                    <RequestorRemarks remarks="No remarks provided" />
                  )}
                </CardBody>
              </Card>
            </Flex>

            {/* Action Buttons */}
            <VStack mt={5} spacing={4}>
              <ApproveApplicationButton />
              <ApproveDatesButton />
              <RejectApplicationButton />
            </VStack>
          </>
        ) : (
          <Text>No pending applications found</Text>
        )}
      </Box>
    </main>
  );
}
