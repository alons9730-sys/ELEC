import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ScheduleProvider } from './store/ScheduleContext';
import { Toaster } from 'sonner';

function App() {
  return (
    <ScheduleProvider>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-center"
        theme="dark"
        toastOptions={{
          style: { background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7' },
        }}
      />
    </ScheduleProvider>
  );
}

export default App;