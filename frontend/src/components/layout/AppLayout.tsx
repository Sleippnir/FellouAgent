import React from 'react';
import { Outlet } from 'react-router-dom';

const AppLayout: React.FC = () => {
  return (
    <div>
      <header>
        <h1>Voice Interview System</h1>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <p>© 2024 Voice Interview System</p>
      </footer>
    </div>
  );
};

export default AppLayout;
