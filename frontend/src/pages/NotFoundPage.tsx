// frontend/src/pages/NotFoundPage.tsx
// 404 Page — Koi bhi wrong URL pe aaye

import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-indigo-300">404</h1>
        <p className="text-2xl font-semibold text-gray-700 mt-4">
          Page nahi mili! 😅
        </p>
        <p className="text-gray-400 mt-2">
          Yeh URL exist nahi karta.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
        >
          Dashboard pe wapas jao
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
