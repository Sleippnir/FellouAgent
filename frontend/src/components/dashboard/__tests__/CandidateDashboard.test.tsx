import React from 'react';
import { render, screen } from '@testing-library/react';
import CandidateDashboard from '../CandidateDashboard';

describe('CandidateDashboard', () => {
  it('renders the dashboard title', () => {
    render(<CandidateDashboard />);
    const titleElement = screen.getByText(/Candidate Dashboard/i);
    expect(titleElement).toBeInTheDocument();
  });

  it('renders the welcome message', () => {
    render(<CandidateDashboard />);
    const messageElement = screen.getByText(/Welcome to your dashboard/i);
    expect(messageElement).toBeInTheDocument();
  });
});
