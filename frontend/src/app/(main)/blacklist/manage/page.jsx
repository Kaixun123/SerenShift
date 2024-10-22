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
    const retrieveBlacklists = async () => {
        let response = await fetch('/api/blacklist/getBlacklistedDates', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        if (response.ok) {
            let data = await response.json();
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
    }
    const handleDeleteBlacklist = async (id) => {
        setSelectedBlacklistID(id);
        setIsDeleteModalOpen(false);
    }
    const deleteBlacklist = async () => {
        let response = await fetch(`/api/blacklist/deleteBlacklist/${selectedBlacklistID}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        if (response.ok) {
            toast({
                title: "Success",
                description: "Blacklist date deleted successfully",
                status: "success",
                duration: 9000,
                isClosable: true,
                position: "top-right"
            });
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
            <TopHeader mainText={`Manage Blacklist`} subText={`Control when your subordinates can submit applications`} />
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
                            <Th>Remarks</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {blacklists.map((blacklist, index) => (
                            <Tr key={index}>
                                <Td>{new Date(blacklist.start_date).toLocaleString('en-SG')}</Td>
                                <Td>{new Date(blacklist.end_date).toLocaleString('en-SG')}</Td>
                                <Td>{blacklist.remarks ? blacklist.remarks : "No Remarks Provided"}</Td>
                                <Td>
                                    <ButtonGroup>
                                        <Button colorScheme='blue' size='sm' onClick={() => handleEditBlacklist(blacklist._id)}>Edit</Button>
                                        <Button colorScheme='red' size='sm' onClick={() => deleteBlacklist(blacklist._id)}>Delete</Button>
                                    </ButtonGroup>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                    <Tfoot>
                        <Tr>
                            <Th>Start Date</Th>
                            <Th>End Date</Th>
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
                        Start Date: {blacklists.find(blacklist => blacklist._id === selectedBlacklistID)?.startDate}<br />
                        End Date: {blacklists.find(blacklist => blacklist._id === selectedBlacklistID)?.endDate}<br />
                        Are you sure you want to delete this blacklist date?
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme='red' onClick={() => handleDeleteBlacklist(selectedBlacklistID)}>Delete</Button>
                        <Button onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </main>
    )
}