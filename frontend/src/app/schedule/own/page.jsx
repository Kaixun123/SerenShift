"use client";
import Calendar from "@/components/Calendar";
import "@/components/Calendar.css";

export default function OwnSchedulePage() {
  return (
    <main>
      <div className="flex h-screen">
        <div className="calendar-fullscreen flex-grow">
          <Calendar />
        </div>
      </div>
    </main>
  );
}
