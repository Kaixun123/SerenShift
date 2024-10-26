'use client'

import { useState, useEffect } from 'react';
import { useToast, FormControl, FormLabel, FormErrorMessage, FormHelperText, Box, Flex, Heading, Formcontrol, Text, Input, Select, Button, Textarea, Tooltip } from '@chakra-ui/react';
import TopHeader from "@/components/TopHeader";
import { Indicator } from "@mantine/core";
import { DatePicker, DatesProvider } from "@mantine/dates";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { useRouter } from 'next/navigation'

export default function CreateBlacklistPage() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [calendarValue, setCalendarValue] = useState([]);
    const [formattedDate, setFormattedDate] = useState({
        startDate: "",
        endDate: "",
    });
    const [timeSlot, setTimeSlot] = useState("");
    const [remarks, setRemarks] = useState("");
    const [recurrenceRule, setRecurrenceRule] = useState("Select Recurrence Rule");
    const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
    const [recurrenceError, setRecurrenceError] = useState("");
    const today = new Date();
    const nextYear = new Date(
        today.getFullYear() + 1,
        today.getMonth(),
        today.getDate()
    );
    const maxRecurrenceEndDate = nextYear.toISOString().split("T")[0];
    const [Existingblacklists, setExistingBlacklists] = useState([]);

    const handleCalendarChange = (selectedDates) => {
        setCalendarValue(selectedDates);
        const [newStartDate, newEndDate] = selectedDates;
        setFormattedDate({
            startDate: newStartDate ? new Date(newStartDate).toDateString() : "",
            endDate: newEndDate ? new Date(newEndDate).toDateString() : "",
        });
    };
    const handleRecurrenceEndDateChange = (e) => {
        const selectedRecurrenceEndDate = new Date(e.target.value);
        const eventEndDate = new Date(formattedDate.endDate);

        if (selectedRecurrenceEndDate <= eventEndDate) {
            setRecurrenceError(
                "Recurrence end date must be after the event end date."
            );
        } else {
            setRecurrenceError("");
        }
        setRecurrenceEndDate(e.target.value);
    };
    const handleTimeSlot = (e) => {
        setTimeSlot(e.target.value);
    };
    const handleRemarksChange = (e) => {
        setRemarks(e.target.value);
    }
    const handleClear = () => {
        setCalendarValue([]);
        setFormattedDate({
            startDate: "",
            endDate: "",
        });
        setTimeSlot("");
        setRemarks("");
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };
    const handleCreateBlacklist = async (e) => {
        try {
            e.preventDefault();
            setLoading(true);
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
            let formData = {
                startDateTime: formattedStartDateTime,
                endDateTime: formattedEndDateTime,
                remarks: remarks,
            }
            if (recurrenceRule !== "Select Recurrence Rule") {
                formData.recurrenceRule = recurrenceRule;
                formData.recurrenceEndDate = recurrenceEndDate;
            }
            let response = await fetch("/api/blacklist/createBlacklistDate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            if (response.status === 201) {
                let result = await response.json();
                toast({
                    title: result.message,
                    position: "top-right",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
                router.push("/blacklist/manage");
            } else {
                let errorMessage = await response.json();
                toast({
                    title: errorMessage.message,
                    position: "top-right",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error("Error creating new blacklist:", error);
        }
    }
    const handleRetrieveExistingBlacklistDates = async () => {
        let response = await fetch("/api/blacklist/getBlacklistDates");
        if (response.ok) {
            let data = await response.json();
            setExistingBlacklists(data);
        } else {
            toast({
                title: "Error",
                description: "Failed to retrieve existing blacklisted dates",
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top-right"
            });
        }
    }
    const dayRenderer = (date) => {
        const blacklistedDates = Existingblacklists.map((item) =>
            new Date(item.start_date).toDateString()
        );
        const day = date.getDate();
        const isBlacklisted = blacklistedDates.includes(date.toDateString());

        return (
            <Indicator
                size={6}
                color="red"
                offset={-5}
                disabled={!isBlacklisted}
            >
                <div>{day}</div>
            </Indicator>
        );
    };
    useEffect(() => {
        handleRetrieveExistingBlacklistDates();
    }, []);
    return (
        <main>
            <TopHeader mainText={"Create Blacklist Date"} />
            <div className="flex p-[40px] gap-[60px] justify-between ">
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
                                renderDay={dayRenderer}
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
                                    {"Start Date"}
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
                                    {"End Date"}
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
                <div className="flex flex-col w-1/2 mt-1 gap-[20px]">
                    <Text as="b" mb={3} fontSize={"2xl"}>
                        Enter Blacklist Details
                    </Text>
                    <form noValidate>
                        <FormControl isRequired className="flex flex-col gap-5">
                            <div className="flex w-full flex-wrap lg:flex-nowrap">
                                <FormLabel className="w-full">Recurrence Rule</FormLabel>
                                <Select
                                    value={recurrenceRule}
                                    onChange={(e) => setRecurrenceRule(e.target.value)}
                                >
                                    <option value={"Select Recurrence Rule"} selected>Select Recurrence Rule</option>
                                    <option value={"week"}>Weekly</option>
                                    <option value={"month"}>Monthly</option>
                                </Select>
                            </div>
                            {recurrenceRule != "Select Recurrence Rule" && (
                                <div isinvalid={recurrenceError ? "true" : undefined}>
                                    <FormLabel
                                        className="w-full"
                                        isrequired={"true"}
                                        sx={{
                                            ".chakra-form__required-indicator": { display: "none" },
                                        }}
                                    >
                                        <Box display="inline-flex" alignItems="center">
                                            Recurrence End Date
                                            <Text color="red.500" as="span" ml={1}>
                                                *
                                            </Text>
                                            <Tooltip
                                                label="Select when the regular arrangement should stop"
                                                fontSize="md"
                                            >
                                                <span>
                                                    <AiOutlineInfoCircle
                                                        size={18}
                                                        color="grey"
                                                        style={{ marginLeft: "5px" }}
                                                    />
                                                </span>
                                            </Tooltip>
                                        </Box>
                                    </FormLabel>
                                    <Input
                                        type="date"
                                        value={recurrenceEndDate}
                                        onChange={handleRecurrenceEndDateChange}
                                        min={formattedDate.endDate ? formattedDate.endDate : ""}
                                        max={maxRecurrenceEndDate}
                                    />

                                    {recurrenceError && (
                                        <Text color="red.500" fontSize="sm">
                                            {recurrenceError}
                                        </Text>
                                    )}
                                </div>)}
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
                            <div>
                                <FormLabel className="w-full">Remarks</FormLabel>
                                <Textarea
                                    value={remarks}
                                    onChange={handleRemarksChange}
                                    placeholder="Write your remarks here..."
                                    size="sm"
                                    required
                                />
                            </div>
                            <input
                                type="hidden"
                                name="startDate"
                                value={formattedDate.startDate}
                            />
                            <input
                                type="hidden"
                                name="endDate"
                                value={formattedDate.endDate}
                            />
                            <Button
                                colorScheme="green"
                                variant="solid"
                                isLoading={loading}
                                loadingText="Submitting"
                                onClick={handleCreateBlacklist}
                                spinnerPlacement="end"
                                isDisabled={
                                    !(
                                        formattedDate.startDate &&
                                        formattedDate.endDate &&
                                        timeSlot &&
                                        remarks &&
                                        !recurrenceError
                                    )
                                }
                            >
                                Submit
                            </Button>
                        </FormControl>
                    </form>
                </div>
            </div>
        </main >
    )
}