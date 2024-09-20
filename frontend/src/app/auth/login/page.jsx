'use client'
import { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, Heading, VStack, useToast, InputGroup, InputRightElement } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [show, setShow] = useState('');
    const toast = useToast();
    const route = useRouter();
    const handleClick = () => setShow(!show);

    const validateEmailDomain = (email) => {
        const domain = '@allinone.com.sg';
        return email.endsWith(domain);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateEmailDomain(email)) {
            const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailAddress: email,
                    password,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Login successful:', data);
                // Handle successful login here (e.g., redirect to another page)
                toast({
                    title: 'Login Success',
                    description: 'Redirecting..',
                    status: 'success',
                    isClosable: true,
                });
                route.push('/');
            } else {
                console.error('Login failed');
                // Handle login failure here (e.g., show an error message)
                toast({
                    title: 'Login Failed',
                    description: 'You have enter the wrong email/password.',
                    status: 'error',
                    isClosable: true,
                });
            }
        } else {
            toast({
                title: 'Incorrect email Address',
                description: 'you have entered a invalid email address.',
                status: 'error',
                isClosable: true,
            });
            setEmail("");
            setPassword("");
        }


    };

    return (
        <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100vh"
            bg="gray.100"
        >
            <Box
                p={8}
                width="80vh"
                borderWidth={1}
                borderRadius={8}
                boxShadow="lg"
                bg="white"
            >
                <VStack spacing={4} align="stretch">
                    <Heading as="h1" size="lg" textAlign="center" mb={4}>
                        put logo if there is one
                    </Heading>
                    <form onSubmit={handleSubmit}>
                        <FormControl id="email" isRequired>
                            <FormLabel>Email Address</FormLabel>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                mb={4}
                                placeholder='Enter your email'
                                variant='flushed'
                            />
                        </FormControl>
                        <FormControl id="password" isRequired mt={4}>
                            <FormLabel>Password</FormLabel>
                            <InputGroup size='md'>
                                <Input
                                    type={show ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    mb={6}
                                    placeholder='Enter your password'
                                    variant='flushed'
                                />
                                <InputRightElement width='4.5rem'>
                                    <Button h='1.75rem' size='sm' onClick={handleClick}>
                                        {show ? 'Hide' : 'Show'}
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>
                        <Button
                            type="submit"
                            colorScheme="blue"
                            size="lg"
                            width="full"
                            mt={4}
                            onClick={handleSubmit}
                        >
                            Login
                        </Button>
                    </form>
                </VStack>
            </Box>
        </Box>
    );
};

export default LoginPage;