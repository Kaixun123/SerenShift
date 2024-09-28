'use client';
import Calendar from '@/components/Calendar';
import { Layout } from "@/components/Layout";
import '@/components/Calendar.css';

export default function DummyPage() {
    return (
        <Layout>
            <div className="flex h-screen">
                <div className="calendar-fullscreen flex-grow">
                    <Calendar />
                </div>
            </div>
        </Layout>
    );
}
