"use client";
import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  InputGroup,
  InputRightElement,
  Image,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState("");
  const toast = useToast();
  const route = useRouter();
  const handleClick = () => setShow(!show);

  const validateEmailDomain = (email) => {
    const domainPattern = /^.*@allinone\.com\.[a-z]{2,}$/i;
    return domainPattern.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateEmailDomain(email)) {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          emailAddress: email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // const data = await response.json();
        // console.log('Login successful:', data);
        // Handle successful login here (e.g., redirect to another page)
        toast({
          title: "Login Success",
          description: "Redirecting..",
          status: "success",
          isClosable: true,
        });
        sessionStorage.setItem('jwt', data.token);
        route.push("/");
      } else {
        console.error("Login failed");
        // Handle login failure here (e.g., show an error message)
        toast({
          title: "Login Failed",
          description: "You have enter the wrong email/password.",
          status: "error",
          isClosable: true,
        });
        setEmail("");
        setPassword("");
      }
    } else {
      toast({
        title: "Incorrect email Address",
        description: "you have entered a invalid email address.",
        status: "error",
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
          <Image
            src="/serenShiftLogo.jpg"
            alt="Logo"
            boxSize="150px"
            borderRadius="full"
            objectFit="contain"
            mx="auto"
            mb={4}
          />
          <form onSubmit={handleSubmit}>
            <FormControl id="email" isRequired>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                mb={4}
                placeholder="Enter your email"
                variant="flushed"
              />
            </FormControl>
            <FormControl id="password" isRequired mt={4}>
              <FormLabel>Password</FormLabel>
              <InputGroup size="md">
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  mb={6}
                  placeholder="Enter your password"
                  variant="flushed"
                />
                <InputRightElement width="4.5rem">
                  <Button h="1.75rem" size="sm" onClick={handleClick}>
                    {show ? "Hide" : "Show"}
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
