"use client"

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AdvertiserAnalytics from "./components/advertiser";
import StaffAnalytics from "./components/staff";
import SuperAnalytics from "./components/super";
import { Container } from "@mui/material";

export default function Analytics() {
    const { data: session } = useSession();
    if (!session) redirect('/login');
    
    let analyticsComponent;
    switch (session.user.role) {
        case 'advertiser':
            analyticsComponent = <AdvertiserAnalytics />;
            break;
        case 'doctor':
            // redirect to home
            redirect('/new');
        case 'staff':
            analyticsComponent = <StaffAnalytics />;
            break;
        case 'super':
            analyticsComponent = <SuperAnalytics />;
            break;
        default:
            redirect('/new'); 
    }

    return (
        <Container maxWidth="xl" style={{ marginTop: '80px', fontFamily: 'Roboto, sans-serif', marginBottom: '250px' }}>
            {/* Insert role specific analytics from above switch statement here */}
            {analyticsComponent}
        </Container>
    );
}
    