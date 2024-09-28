'use client';
import Button from '@mui/material/Button';
import Calendar from '@/components/Calendar';
import { Layout } from "@/components/Layout";
import '@/components/Calendar.css';

export default function DummyPage() {
    return (
        <Layout>
            <div className="flex h-screen items-center justify-center overflow-hidden p-4">
                <div className="calendar-fullscreen">
                    <Calendar />
                </div>
            </div>
        </Layout>
    );
}
