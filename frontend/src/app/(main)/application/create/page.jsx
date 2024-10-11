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
} from "@chakra-ui/react";

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

        const formData = new FormData();
        formData.append('id', employeeInfo.id);
        formData.append('application_type', type);
        formData.append('start_date', formattedStartDateTime);
        formData.append('end_date', formattedEndDateTime);
        formData.append('requestor_remarks', reason);
        files.forEach(file => {
          formData.append('files', file);
        });

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
        setLoading(false);
        setFiles([])
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
          <div className="flex w-full flex-wrap gap-5 lg:flex-nowrap lg:gap-4 mt-4">
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
        </div>

        {/* Section: Form */}
        <div className="flex flex-col w-1/2 mt-2 gap-[20px]">
          <Text as='b' mb={3} fontSize={"2xl"}>Enter your Application Details</Text>
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

              {/* <div className="flex w-full flex-wrap gap-5 lg:flex-nowrap lg:gap-4">
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
              </div> */}
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
              <div>
                <FileUploader onFilesChange={handleFilesChange} />
              </div>
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
