'use client'

import { useState, useEffect } from 'react';
import { Table, Thead, Tbody, Tfoot, Tr, Th, Td, TableCaption, TableContainer, useToast, Button, ButtonGroup, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Flex } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import TopHeader from "@/components/TopHeader";

export default function ManageBlacklistPage() {
    const router = useRouter();
    const toast = useToast();
    const [blacklists, setBlacklists] = useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBlacklistID, setSelectedBlacklistID] = useState(0);
    const [selectedBlacklistStartDate, setSelectedBlacklistStartDate] = useState("");
    const [selectedBlacklistEndDate, setSelectedBlacklistEndDate] = useState("");
    const [selectedBlacklistTimeSlot, setSelectedBlacklistTimeSlot] = useState("");

    const determineDisplayTimeSlot = (startDateTime, endDateTime) => {
        let startDateObject = new Date(startDateTime);
        let endDateObject = new Date(endDateTime);
        let startTimePeriod = `${String(startDateObject.getHours()).padStart(2, "0")}:${String(startDateObject.getMinutes()).padStart(2, "0")}:${String(startDateObject.getSeconds()).padStart(2, "0")}`;
        let endTimePeriod = `${String(endDateObject.getHours()).padStart(2, "0")}:${String(endDateObject.getMinutes()).padStart(2, "0")}:${String(endDateObject.getSeconds()).padStart(2, "0")}`;
        if (startTimePeriod === "09:00:00" && endTimePeriod === "13:00:00") {
            return "AM";
        } else if (startTimePeriod === "14:00:00" && endTimePeriod === "18:00:00") {
            return "PM";
        } else if (startTimePeriod === "09:00:00" && endTimePeriod === "18:00:00") {
            return "Full - Day"
        } else
            return "Invaild";
    };
    const retrieveBlacklists = async () => {
        let response = await fetch('/api/blacklist/getBlacklistDates', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        if (response.ok) {
            let data = await response.json();
            data.map(blacklist => {
                blacklist.timeSlot = determineDisplayTimeSlot(blacklist.start_date, blacklist.end_date);
            });
            setBlacklists(data);
        } else if (response.status === 403 || response.status === 401) {
            toast({
                title: "Unauthorized",
                description: "You are not authorized to view this page",
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top-right"
            });
            router.replace('/');
        } else {
            toast({
                title: "Error",
                description: "Failed to retrieve blacklist dates",
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top-right"
            });
        }
    };
    const handleDeleteBlacklist = (id, startDate, EndDate, timeSlot) => {
        setSelectedBlacklistID(id);
        setSelectedBlacklistStartDate(startDate);
        setSelectedBlacklistEndDate(EndDate);
        setSelectedBlacklistTimeSlot(timeSlot);
        setIsDeleteModalOpen(true);
    };
    const deleteBlacklist = async () => {
        let response = await fetch(`/api/blacklist/deleteBlacklistDate/${selectedBlacklistID}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        if (response.ok) {
            setIsDeleteModalOpen(false);
            toast({
                title: "Success",
                description: "Blacklist date deleted successfully",
                status: "success",
                duration: 9000,
                isClosable: true,
                position: "top-right"
            });
            router.refresh();
            retrieveBlacklists();
        } else {
            toast({
                title: "Error",
                description: "Failed to delete blacklist date",
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top-right"
            });
        }
    };
    const handleAddBlacklist = () => {
        router.push('/blacklist/create');
    };
    const handleEditBlacklist = (id) => {
        router.push(`/blacklist/edit/${id}`);
    };
    useEffect(() => {
        retrieveBlacklists();
    }, []);
    return (
        <main>
            <TopHeader mainText={`Manage Blacklisted Dates`} subText={`Control when your subordinates can submit applications`} />
            <Flex justifyContent='flex-end' p={4}>
                <Button colorScheme='green' onClick={() => handleAddBlacklist()}>Add Blacklist Date</Button>
            </Flex>
            <TableContainer>
                <Table variant='simple'>
                    <TableCaption>Current Blacklists</TableCaption>
                    <Thead>
                        <Tr>
                            <Th>Start Date</Th>
                            <Th>End Date</Th>
                            <Th>Time Slot</Th>
                            <Th>Remarks</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {blacklists.map((blacklist, index) => (
                            <Tr key={index}>
                                <Td>{new Date(blacklist.start_date).toLocaleDateString('en-SG')}</Td>
                                <Td>{new Date(blacklist.end_date).toLocaleDateString('en-SG')}</Td>
                                <Td>{blacklist.timeSlot}</Td>
                                <Td>{blacklist.remarks ? blacklist.remarks : "No Remarks Provided"}</Td>
                                <Td>
                                    <ButtonGroup>
                                        <Button colorScheme='blue' size='sm' onClick={() => handleEditBlacklist(blacklist.blacklist_id)}>Edit</Button>
                                        <Button colorScheme='red' size='sm' onClick={() => handleDeleteBlacklist(blacklist.blacklist_id, new Date(blacklist.start_date).toLocaleDateString('en-SG'), new Date(blacklist.end_date).toLocaleDateString('en-SG'), blacklist.timeSlot)}>Delete</Button>
                                    </ButtonGroup>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                    <Tfoot>
                        <Tr>
                            <Th>Start Date</Th>
                            <Th>End Date</Th>
                            <Th>Time Slot</Th>
                            <Th>Remarks</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Tfoot>
                </Table>
            </TableContainer>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Delete Blacklist Date</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <strong>Start Date:</strong>  {selectedBlacklistStartDate}<br />
                        <strong>End Date:</strong> {selectedBlacklistEndDate}<br />
                        <strong>Time Slot:</strong> {selectedBlacklistTimeSlot}<br />
                        Are you sure you want to delete this blacklist date?
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme='red' onClick={() => deleteBlacklist()}>Delete</Button>
                        <Button onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </main>
    )
}