import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
    const token = localStorage.getItem('token');

    // Simple check: if token exists, render child routes (Outlet)
    // Otherwise redirect to login
    // In a real app we might validate token expiration here

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
