'use client'
import { Layout } from "@/components/Layout";
import TopHeader from "@/components/TopHeader";
import { useEffect, useState } from "react";

export default function Home() {
  const [employee, setEmployee] = useState({ name: '' });

  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        const response = await fetch('/api/auth/me'); // Adjust the API endpoint if necessary
        const data = await response.json();
        setEmployee({
          name: `${data.first_name} ${data.last_name}`, // Combine first name and last name
        });
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    }
    fetchEmployeeData();
  }, []);

  return (
    <Layout>
      <TopHeader
        mainText={`Good Morning, ${employee.name}!`}  // Dynamically render employee name
        subText={`Glad to see you back in the office`}  // Dynamically render position
      />
      <div className="p-[30px]">content</div>
    </Layout>
  );
}
