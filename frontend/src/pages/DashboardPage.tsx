// frontend/src/pages/DashboardPage.tsx
// TODO: Step 6 mein poora Dashboard banayenge

import { useAuthStore } from '@/store/authStore';

const DashboardPage = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-indigo-600">
          🎯 Dashboard
        </h1>
        <p className="text-gray-600 mt-3 text-lg">
          Welcome, <span className="font-bold text-indigo-500">{user?.name}</span>! 👋
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Role: <span className="capitalize font-medium">{user?.role}</span>
        </p>
        <p className="text-gray-500 mt-2">
          Step 6 mein poora Dashboard aayega!
        </p>
        <button
          onClick={logout}
          className="mt-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
