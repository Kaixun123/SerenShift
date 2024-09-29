"use client";
// import components
import { Layout } from "@/components/Layout";
import TopHeader from "@/components/TopHeader";
import PendingApplicationCard from "@/components/PendingAppCard";
import WithdrawalModal from "@/components/WithdrawModal";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

// chakra-ui
import {
  FormControl,
  FormLabel,
  Box,
  VStack,
  Input,
  Select,
  Button,
  Text,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";

// react icon
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { PiWarningCircle } from "react-icons/pi";

// mantine
import { DatePicker, DatesProvider } from "@mantine/dates";
import { Pagination } from "@mantine/core";

export default function NewSchedule() {
  // For Submit Modal
  const {
    isOpen: isModalSubmitOpen,
    onOpen: onModalSubmitOpen,
    onClose: onModalSubmitClose,
  } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState({
    id: 0,
    reporting_manager: "",
  });
  const [responseMessage, setResponseMessage] = useState({
    status: 0,
    message: "",
  });
  const [calendarValue, setCalendarValue] = useState([]);
  const [formattedDate, setFormattedDate] = useState({
    startDate: "",
    endDate: "",
  });
  const [type, setType] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [reason, setReason] = useState("");
  const [isValidToken, setIsValidToken] = useState(true);  // Track token validity
  const router = useRouter();

  const [pendingApplications, setPendingApplications] = useState([]);
  const [appToWithdraw, setAppToWithdraw] = useState(null);

  // For Withdrawal Modal
  const {
    isOpen: isModalWithdrawOpen,
    onOpen: onModalWithdrawOpen,
    onClose: onModalWithdrawClose,
  } = useDisclosure();

   // For Token Expiry Modal
   const {
    isOpen: isTokenExpiryModalOpen,
    onOpen: onTokenExpiryModalOpen,
    onClose: onTokenExpiryModalClose,
  } = useDisclosure();

  const handleCalendarChange = (selectedDates) => {
    setCalendarValue(selectedDates);
    const [newStartDate, newEndDate] = selectedDates;

    setFormattedDate({
      startDate: newStartDate ? new Date(newStartDate).toDateString() : "",
      endDate: newEndDate ? new Date(newEndDate).toDateString() : "",
    });
  };

  const handleTypeSelect = (e) => {
    setType(e.target.value);
  };

  const handleTimeSlot = (e) => {
    setTimeSlot(e.target.value);
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
  };

  const handleClear = () => {
    setCalendarValue([]);
    setFormattedDate({
      startDate: "",
      endDate: "",
    });
  };

  // Function to check token validity by calling the backend
  const checkTokenValidity = async () => {
    try {
        const response = await fetch("/api/auth/validate-token", {
            method: 'GET',
            credentials: 'include',  // Include cookies in the request
        });

        const data = await response.json();
        if (!data.valid) {
            setIsValidToken(false);  // Mark token as invalid
            onTokenExpiryModalOpen();       // Open the modal
            setTimeout(() => {
                router.push('/auth/login');    // Redirect to home after showing popup
            }, 3000);  // Redirect after 3 seconds
        }
    } catch (error) {
        console.error('Error checking token validity:', error);
    }
  };

  useEffect(() => {
    // Check for the token in cookies
    const token = sessionStorage.getItem('jwt'); // Retrieve the token from cookies
    console.log(token);
    if (!token) {
      // Redirect to the home page if the token is present
      router.replace('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      checkTokenValidity();
    }, 500000); // Poll every 5 minutes

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [router]);

  useEffect(() => {
    async function fetchEmployeeAndPendingAppData() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        const managerName =
          data.manager.first_name + " " + data.manager.last_name;
        setEmployeeInfo({
          id: data.id,
          reporting_manager: managerName,
        });

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
        console.error(
          "Error fetching employee or pending application data:",
          error
        );
      }
    }

    fetchEmployeeAndPendingAppData();
  }, []);

  const createNewApplication = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (
        employeeInfo.length != 0 &&
        type != "" &&
        timeSlot != "" &&
        reason != ""
      ) {
        const formatDate = (dateString) => {
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0"); // Adding 1 because months are 0-indexed
          const day = String(date.getDate()).padStart(2, "0");

          return `${year}-${month}-${day}`;
        };

        let formattedStartDateTime = formatDate(calendarValue[0]);
        let formattedEndDateTime = formatDate(calendarValue[1]);
        if (timeSlot === "am") {
          formattedStartDateTime += " 09:00:00";
          formattedEndDateTime += " 13:00:00";
        } else if (timeSlot === "pm") {
          formattedStartDateTime += " 14:00:00";
          formattedEndDateTime += " 18:00:00";
        } else if (timeSlot === "fullDay") {
          formattedStartDateTime += " 09:00:00";
          formattedEndDateTime += " 18:00:00";
        }

        const response = await fetch("/api/application/createNewApplication", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: employeeInfo.id,
            application_type: type,
            start_date: formattedStartDateTime,
            end_date: formattedEndDateTime,
            requestor_remarks: reason,
          }),
        });

        if (response.status === 201) {
          const result = await response.json();
          setResponseMessage({
            status: response.status,
            message: result.message,
          });
        } else {
          const errorMessage = await response.json();
          setResponseMessage({
            status: response.status,
            message: errorMessage.message,
          });
        }

        onModalSubmitOpen(true);
        if (!isModalSubmitOpen) {
          setCalendarValue([]);
          setFormattedDate({
            startDate: "",
            endDate: "",
          });
          setType("");
          setTimeSlot("");
          setReason("");
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error creating new application:", error);
    }
  };

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
    <Layout>
      <TopHeader
        mainText={"New Schedule"}
        subText={"Plan your schedule timely and wisely!"}
      />

      <div className="flex p-[30px] gap-[60px] justify-between ">
        {/* Token Expiry Modal */}
        <Modal isOpen={isTokenExpiryModalOpen} onClose={onTokenExpiryModalClose} isCentered size={"lg"}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Session expired</ModalHeader>
            <ModalBody>
              Your session has expired. You will be redirected to the login page.
            </ModalBody>
          </ModalContent>
        </Modal>



        {/* Left Section: Create New Application */}
        <div className="flex flex-col w-1/2 gap-[20px]">
          <div className="flex h-[350px] justify-center">
            <DatesProvider settings={{ consistentWeeks: true }}>
              <DatePicker
                type="range"
                size="md"
                highlightToday
                hideOutsideDates
                allowSingleDateInRange
                value={calendarValue}
                minDate={new Date()}
                maxDate={
                  new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                }
                onChange={handleCalendarChange}
              />
            </DatesProvider>
            <div className="relative">
              <Button
                className="absolute bottom-[5%] right-[12px]"
                colorScheme="blackAlpha"
                variant="link"
                onClick={handleClear}
              >
                Clear
              </Button>
            </div>
          </div>

          <form noValidate>
            <FormControl isRequired className="flex flex-col gap-5">
              <div className="flex w-full flex-wrap lg:flex-nowrap">
                <FormLabel className="w-full">Type of Arrangement</FormLabel>
                <Select
                  placeholder="Select Regular"
                  value={type}
                  onChange={handleTypeSelect}
                  required
                >
                  <option value={"Regular"}>Regular</option>
                  <option value={"Ad Hoc"}>Ad-hoc</option>
                </Select>
              </div>

              <div className="flex w-full flex-wrap gap-5 lg:flex-nowrap lg:gap-4">
                <div className="w-full lg:w-1/2">
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    placeholder="Start Date"
                    name="startDate"
                    value={formattedDate.startDate}
                    readOnly
                  />
                </div>
                <div className="w-full lg:w-1/2">
                  <FormLabel>End Date</FormLabel>
                  <Input
                    placeholder="End Date"
                    name="endDate"
                    value={formattedDate.endDate}
                    readOnly
                  />
                </div>
              </div>
              <div className="flex w-full flex-wrap lg:flex-nowrap">
                <FormLabel className="w-full">Timeslot</FormLabel>
                <Select
                  placeholder="Select the timeslot"
                  value={timeSlot}
                  onChange={handleTimeSlot}
                >
                  <option value={"am"}>AM (09:00 - 13:00)</option>
                  <option value={"pm"}>PM (14:00 - 18:00)</option>
                  <option value={"fullDay"}>Full Day (09:00 - 18:00)</option>
                </Select>
              </div>
              <div className="flex w-full flex-wrap lg:flex-nowrap">
                <FormLabel className="w-full mr-8" requiredIndicator>
                  Reporting Manager
                </FormLabel>
                <Input
                  className="text-black"
                  placeholder="John Doe"
                  variant={"filled"}
                  value={employeeInfo.reporting_manager}
                  isReadOnly
                />
              </div>
              <div>
                <FormLabel className="w-full">Reason</FormLabel>
                <Textarea
                  value={reason}
                  onChange={handleReasonChange}
                  placeholder="Write your reason here..."
                  size="sm"
                />
              </div>
              <Button
                colorScheme="green"
                variant="solid"
                isLoading={loading}
                loadingText="Submitting"
                onClick={createNewApplication}
                isDisabled={
                  formattedDate.startDate != "" &&
                  formattedDate.endDate != "" &&
                  type != "" &&
                  timeSlot != "" &&
                  reason != ""
                    ? false
                    : true
                }
              >
                Submit
              </Button>
            </FormControl>
          </form>
        </div>

        <Modal
          onClose={onModalSubmitClose}
          isOpen={isModalSubmitOpen}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={5}>
            <ModalCloseButton />
            <div className="flex flex-col justify-center pt-6 gap-3">
              <div className="flex justify-center">
                {responseMessage.status === 201 ? (
                  <IoCheckmarkCircleOutline
                    className="w-12 h-12"
                    style={{ color: "#3EAC3E" }}
                  />
                ) : (
                  <PiWarningCircle
                    className="w-12 h-12"
                    style={{ color: "#D13838" }}
                  />
                )}
              </div>

              <ModalBody className="text-center">
                {responseMessage.message}
              </ModalBody>
              <ModalFooter>
                <Button
                  className="flex w-full"
                  onClick={onModalSubmitClose}
                  colorScheme={responseMessage.status === 201 ? "green" : "red"}
                >
                  {responseMessage.status === 201 ? "OK" : "Close"}
                </Button>
              </ModalFooter>
            </div>
          </ModalContent>
        </Modal>

        {/* Right Section: Pending Application List */}
        <div className="w-1/2">
          <h1 className="text-2xl font-bold">Pending Applications</h1>
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
    </Layout>
  );
}
