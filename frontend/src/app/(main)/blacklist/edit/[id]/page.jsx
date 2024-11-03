'use client'

import { useState, useEffect } from 'react';
import { useToast, FormControl, FormLabel, FormErrorMessage, FormHelperText, Box, Flex, Heading, Formcontrol, Text, Input, Select, Button, Textarea, Tooltip } from '@chakra-ui/react';
import TopHeader from "@/components/TopHeader";
import { Indicator } from "@mantine/core";
import { DatePicker, DatesProvider } from "@mantine/dates";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { useRouter } from 'next/navigation'

export default function EditBlacklistPage({ params }) {
    const blacklistID = params.id;
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
    const [Existingblacklists, setExistingBlacklists] = useState([]);
    const [defaultDisplayDate, setDefaultDisplayDate] = useState(new Date());

    const handleCalendarChange = (selectedDates) => {
        setCalendarValue(selectedDates);
        const [newStartDate, newEndDate] = selectedDates;
        setFormattedDate({
            startDate: newStartDate ? new Date(newStartDate).toDateString() : "",
            endDate: newEndDate ? new Date(newEndDate).toDateString() : "",
        });
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
    const retrieveSelectedBlacklist = async () => {
        let response = await fetch(`/api/blacklist/getBlacklistDate/${blacklistID}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.ok) {
            let data = await response.json();
            let startDateObject = new Date(data.start_date);
            let endDateObject = new Date(data.end_date);
            setCalendarValue([formatDate(startDateObject), formatDate(endDateObject)]);
            setFormattedDate({
                startDate: startDateObject.toDateString(),
                endDate: endDateObject.toDateString(),
            });
            setDefaultDisplayDate(startDateObject);
            let startTimePeriod = `${String(startDateObject.getHours()).padStart(2, "0")}:${String(startDateObject.getMinutes()).padStart(2, "0")}:${String(startDateObject.getSeconds()).padStart(2, "0")}`;
            let endTimePeriodd = `${String(endDateObject.getHours()).padStart(2, "0")}:${String(endDateObject.getMinutes()).padStart(2, "0")}:${String(endDateObject.getSeconds()).padStart(2, "0")}`;
            if (startTimePeriod === "09:00:00" && endTimePeriodd === "13:00:00") {
                setTimeSlot("am");
            } else if (startTimePeriod === "14:00:00" && endTimePeriodd === "18:00:00") {
                setTimeSlot("pm");
            } else if (startTimePeriod === "09:00:00" && endTimePeriodd === "18:00:00") {
                setTimeSlot("fullDay");
            }
            setRemarks(data.remarks);
        } else {
            toast({
                title: "Error",
                description: "Failed to retrieve blacklist date",
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top-right"
            });
        }
    }
    const handleUpdateBlacklist = async (e) => {
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
            let response = await fetch(`/api/blacklist/updateBlacklistDate/${blacklistID}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            if (response.status === 200) {
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
            console.error("Error updating existing blacklist:", error);
        } finally {
            setLoading(false);
        }
    }
    const handleRetrieveExistingBlacklistDates = async () => {
        let response = await fetch("/api/blacklist/getBlacklistDates");
        if (response.ok) {
            let data = await response.json();
            setExistingBlacklists(data);
        } else if (response.status == 401 || response.status == 403) {
            toast({
                title: "Unauthorized",
                description: "You are not authorized to view this page",
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top-right"
            });
            router.push("/");
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
        retrieveSelectedBlacklist();
        handleRetrieveExistingBlacklistDates();
    }, []);
    return (
        <main>
            <TopHeader mainText={"Update Blacklisted Date"} />
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
                                excludeDate={(date) =>
                                    Existingblacklists
                                        .map((item) => new Date(item.start_date).toDateString())
                                        .includes(date.toDateString())
                                }
                                DefaultDate={defaultDisplayDate}
                            />
                        </DatesProvider>
                        <div className="relative">
                            <Button
                                className="absolute bottom-[5%] right-[12px]"
                                colorScheme="blackAlpha"
                                variant="link"
                                onClick={retrieveSelectedBlacklist}
                            >
                                Reset
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
                                onClick={handleUpdateBlacklist}
                                spinnerPlacement="end"
                                isDisabled={
                                    !(
                                        formattedDate.startDate &&
                                        formattedDate.endDate &&
                                        timeSlot &&
                                        remarks
                                    )
                                }
                            >
                                Update
                            </Button>
                        </FormControl>
                    </form>
                </div>
            </div>
        </main >
    )
}