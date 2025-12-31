import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agents from './pages/master/Agents';
import Tickets from './pages/Tickets';
import Migration from './pages/Migration';
import Training from './pages/Training';
import ImplementationPrint from './pages/ImplementationPrint';
import ClientOnboarding from './pages/ClientOnboarding';
import CustomerService from './pages/CustomerService';

import Campuses from './pages/master/Campuses';
import SLA from './pages/master/SLA';
import Holidays from './pages/master/Holidays';

import Sources from './pages/master/Sources';
import Scopes from './pages/master/Scopes';
import Materials from './pages/master/Materials';
import PrintResults from './pages/master/PrintResults';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="migration" element={<Migration />} />
            <Route path="implementation/print" element={<ImplementationPrint />} />
            <Route path="onboarding-clients" element={<ClientOnboarding />} />
            <Route path="training" element={<Training />} />
            <Route path="customer-service" element={<CustomerService />} />

            {/* Master Data Routes */}
            <Route path="master/agents" element={<Agents />} />
            <Route path="master/campuses" element={<Campuses />} />
            <Route path="master/sla" element={<SLA />} />
            <Route path="master/sources" element={<Sources />} />
            <Route path="master/scopes" element={<Scopes />} />
            <Route path="master/materials" element={<Materials />} />
            <Route path="master/print-results" element={<PrintResults />} />
            <Route path="master/holidays" element={<Holidays />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

