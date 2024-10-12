"use client";
// import components
import TopHeader from "@/components/TopHeader";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FileUploader from "@/components/FileUpload";

// chakra-ui
import {
  FormControl,
  Text,
  FormLabel,
  Input,
  Select,
  Button,
  Textarea,
  useToast,
  Tooltip,
  Box
} from "@chakra-ui/react";
import { AiOutlineInfoCircle } from "react-icons/ai";

// mantine
import { DatePicker, DatesProvider } from "@mantine/dates";

export default function NewApplicationPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState({
    id: 0,
    reporting_manager: "",
  });
  const [calendarValue, setCalendarValue] = useState([]);
  const [formattedDate, setFormattedDate] = useState({
    startDate: "",
    endDate: "",
  });
  const [type, setType] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState([]);
  const [clearFiles, setClearFiles] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceError, setRecurrenceError] = useState(""); // error handling

  // Tooltip messages based on application type
  const startDateTooltipMessage =
    type === "Regular"
      ? "This is the starting date of the single instance of the regular event."
      : "This is the date when the one-time event starts.";

  const endDateTooltipMessage =
    type === "Regular"
      ? "This is the duration of the single instance of the regular event."
      : "This is the end date for the one-time event.";

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

  const handleFilesChange = (files) => {
    setFiles(files);
  };

  // Validate recurrence end date is after the event end date
  const handleRecurrenceEndDateChange = (e) => {
    const selectedRecurrenceEndDate = new Date(e.target.value);
    const eventEndDate = new Date(formattedDate.endDate);

    if (selectedRecurrenceEndDate <= eventEndDate) {
      setRecurrenceError("Recurrence end date must be after the event end date.");
    } else {
      setRecurrenceError("");
    }
    setRecurrenceEndDate(e.target.value);
  };

  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        const managerName =
          data.manager.first_name + " " + data.manager.last_name;
        setEmployeeInfo({
          id: data.id,
          reporting_manager: managerName,
        });
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    }

    fetchEmployeeData();
  }, []);

  const createNewApplication = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formattedDate.startDate) {
      toast({
        title: "Start Date is required.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    if (!formattedDate.endDate) {
      toast({
        title: "End Date is required.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    if (!type) {
      toast({
        title: "Please select a type of arrangement.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    if (!timeSlot) {
      toast({
        title: "Please select a timeslot.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    if (!reason) {
      toast({
        title: "Please provide a reason for your application.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }
    if (type == "Regular" && !recurrenceRule) {
      toast({
        title: "Please provide a reccurence rule for your regular application.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    if (type == "Regular" && !recurrenceEndDate) {
      toast({
        title: "Please provide a reccurence end date for your regular application.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }
    try {
      if (
        employeeInfo.length != 0 &&
        type != "" &&
        timeSlot != "" &&
        reason != "" &&
        (!recurrenceError) // Ensure no recurrence error exists
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

        const formData = new FormData();
        formData.append('id', employeeInfo.id);
        formData.append('application_type', type);
        formData.append('startDate', formattedStartDateTime);
        formData.append('endDate', formattedEndDateTime);
        formData.append('requestor_remarks', reason);
        files.forEach(file => {
          formData.append('files', file);
        });

        //append only for regular applications 
        if (type == "Regular") {
          formData.append("recurrence_rule", recurrenceRule);
          formData.append("recurrence_end_date", recurrenceEndDate);
        }

        const response = await fetch("/api/application/createNewApplication", {
          method: "POST",
          body: formData,
        });

        if (response.status === 201) {
          const result = await response.json();
          toast({
            title: result.message,
            position: "top-right",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        } else {
          const errorMessage = await response.json();
          toast({
            title: errorMessage.message,
            position: "top-right",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }

        setCalendarValue([]);
        setFormattedDate({
          startDate: "",
          endDate: "",
        });
        setType("");
        setTimeSlot("");
        setReason("");
        setFiles([]);
        setClearFiles(true);
        setTimeout(() => setClearFiles(false), 500);
        setRecurrenceRule("");
        setRecurrenceEndDate("");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error creating new application:", error);
    }
  };

  return (
    <main>
      <TopHeader
        mainText={"New Application"}
        subText={"Plan your schedule timely and wisely!"}
      />

      <div className="flex p-[40px] gap-[60px] justify-between ">
        {/* Section: Calender */}
        <div className="flex flex-col w-1/2 gap-[5px]">
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
          <div className="flex w-full flex-wrap gap-5 lg:flex-nowrap lg:gap-4 mt-5">
            <div className="w-full lg:w-1/2">
              <FormLabel>
                <Box display="inline-flex" alignItems="center" gap={2}>
                  {type === "Regular" ? "Event Start" : "Start Date"}{" "}
                  <Tooltip label={startDateTooltipMessage} fontSize="md">
                    <span>
                      <AiOutlineInfoCircle size={15} color="grey" />
                    </span>
                  </Tooltip>
                </Box>
              </FormLabel>
              <Input
                placeholder="Start Date"
                name="startDate"
                value={formattedDate.startDate}
                readOnly
              />
            </div>
            <div className="w-full lg:w-1/2">
              <FormLabel>
                <Box display="inline-flex" alignItems="center" gap={2}>
                  {type === "Regular" ? "Event End" : "Start End"}{" "}
                  <Tooltip label={endDateTooltipMessage} fontSize="md">
                    <span>
                      <AiOutlineInfoCircle size={15} color="grey" />
                    </span>
                  </Tooltip>
                </Box>
              </FormLabel>
              <Input
                placeholder="End Date"
                name="endDate"
                value={formattedDate.endDate}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Section: Form */}
        <div className="flex flex-col w-1/2 mt-1 gap-[20px]">
          <Text as='b' mb={3} fontSize={"2xl"}>Enter your Application Details</Text>
          <form noValidate>
            <FormControl isRequired className="flex flex-col gap-5">
              <div className="flex w-full flex-wrap lg:flex-nowrap">
                <FormLabel className="w-full">Type of Arrangement</FormLabel>
                <Select
                  placeholder="Select Type"
                  value={type}
                  onChange={handleTypeSelect}
                  required
                >
                  <option value={"Regular"}>Regular</option>
                  <option value={"Ad Hoc"}>Ad-hoc</option>
                </Select>
              </div>

              {type === "Regular" && (
                <>
                  <div className="flex w-full flex-wrap lg:flex-nowrap">
                    <FormLabel className="w-full">Recurrence Rule</FormLabel>
                    <Select
                      placeholder="Select Recurrence Rule"
                      value={recurrenceRule}
                      onChange={(e) => setRecurrenceRule(e.target.value)}
                    >
                      <option value={"week"}>Weekly</option>
                      <option value={"month"}>Monthly</option>
                    </Select>
                  </div>

                  <div isinvalid={recurrenceError ? "true" : undefined}>
                    <FormLabel className="w-full" isrequired={"true"} sx={{ ".chakra-form__required-indicator": { display: "none" } }}>
                      <Box display="inline-flex" alignItems="center">
                        Recurrence End Date{" "}
                        {/* Add the required asterisk */}
                        <Text color="red.500" as="span" ml={1}>
                          *
                        </Text>
                        {/* Tooltip with info icon */}
                        <Tooltip label="Select when the regular arrangement should stop" fontSize="md">
                          <span>
                            <AiOutlineInfoCircle size={18} color="grey" style={{ marginLeft: "5px" }} />
                          </span>
                        </Tooltip>
                      </Box>
                    </FormLabel>

                    <Input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={handleRecurrenceEndDateChange}
                      min={formattedDate.endDate ? formattedDate.endDate : ""}
                    />

                    {recurrenceError && (
                      <Text color="red.500" fontSize="sm">
                        {recurrenceError}
                      </Text>
                    )}
                  </div>
                </>
              )}

              <div className="flex w-full flex-wrap lg:flex-nowrap">
                <FormLabel className="w-full">Timeslot</FormLabel>
                <Select
                  placeholder="Select the timeslot"
                  value={timeSlot}
                  onChange={handleTimeSlot}
                  required
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
                  required
                />
              </div>
              <div>
                <FileUploader onFilesChange={handleFilesChange} clearFiles={clearFiles} />
              </div>
              <input type="hidden" name="startDate" value={formattedDate.startDate} />
              <input type="hidden" name="endDate" value={formattedDate.endDate} />
              <Button
                colorScheme="green"
                variant="solid"
                isLoading={loading}
                loadingText="Submitting"
                onClick={createNewApplication}
                spinnerPlacement="end"
                isDisabled={
                  formattedDate.startDate != "" &&
                    formattedDate.endDate != "" &&
                    type != "" &&
                    timeSlot != "" &&
                    reason != ""
                    ? false
                    : true &&
                      !recurrenceError // ensure no errors
                      ? false
                      : true
                }
              >
                Submit
              </Button>
            </FormControl>
          </form>
        </div>
      </div>
    </main>
  );
}
