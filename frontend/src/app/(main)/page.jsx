"use client";
import TopHeader from "@/components/TopHeader";
import { useEffect, useState } from "react";

export default function Home() {
  const [employee, setEmployee] = useState({ name: "" });
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        const response = await fetch("/api/auth/me"); // Adjust the API endpoint if necessary
        const data = await response.json();
        setEmployee({
          name: `${data.first_name} ${data.last_name}`, // Combine first name and last name
        });
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        let date = new Date();
        if (date.getHours() >= 12 && date.getHours() < 18) {
          setGreeting("Good Afternoon");
        }
        else if (date.getHours() >= 18) {
          setGreeting("Good Evening");
        } else {
          setGreeting("Good Morning");
        }
      }
    }
    fetchEmployeeData();
  }, []);

  return (
    <main>
      <TopHeader
        mainText={`${greeting}, ${employee.name}!`} // Dynamically render employee name
        subText={`Glad to see you back in the office`} // Dynamically render position
      />
      <div className="p-[30px]">content</div>
    </main>
  );
}
