import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import CandidateDashboard from './components/dashboard/CandidateDashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <CandidateDashboard />,
      },
    ],
  },
]);

export default router;
