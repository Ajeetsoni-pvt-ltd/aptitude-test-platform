// frontend/src/pages/RegisterPage.tsx
// ─────────────────────────────────────────────────────────────
// Register Page — Name + Email + Password + Confirm Password
// Success → /dashboard pe auto-login hoga
// ─────────────────────────────────────────────────────────────

import { useState, } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// ─── Form Errors Type ──────────────────────────────────────────
interface FormErrors {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: '', email: '', password: '', confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    clearError();
  };

  // ─── Validation ────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: FormErrors = { name: '', email: '', password: '', confirmPassword: '' };
    let isValid = true;

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Naam kam se kam 2 characters ka hona chahiye.';
      isValid = false;
    }
    if (!formData.email.trim()) {
      errors.email = 'Email required hai.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Valid email daalo.';
      isValid = false;
    }
    if (!formData.password) {
      errors.password = 'Password required hai.';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password kam se kam 6 characters ka hona chahiye.';
      isValid = false;
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Password confirm karo.';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Dono passwords match nahi kar rahe!';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // ─── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(formData);
      navigate('/dashboard', { replace: true });
    } catch {
      // Error store mein hai
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ─── Header ────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📝</div>
          <h1 className="text-3xl font-bold text-gray-900">Join Us Today!</h1>
          <p className="text-gray-500 mt-1">Free account banao aur practice shuru karo</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              Naya Account Banao 🚀
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Apni details bharo aur shuru karo
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* ─── API Error ─────────────────────────────── */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <span className="text-red-500 text-lg">⚠️</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  Full Name
                </Label>
                <Input
                  id="name" name="name" type="text"
                  placeholder="Ajeet Soni"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`h-11 ${formErrors.name ? 'border-red-400' : ''}`}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs">⚠ {formErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email" name="email" type="email"
                  placeholder="ajeet@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`h-11 ${formErrors.email ? 'border-red-400' : ''}`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs">⚠ {formErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password" name="password" type="password"
                  placeholder="••••••••  (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`h-11 ${formErrors.password ? 'border-red-400' : ''}`}
                />
                {formErrors.password && (
                  <p className="text-red-500 text-xs">⚠ {formErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword" name="confirmPassword" type="password"
                  placeholder="••••••••  (dobara likhao)"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`h-11 ${formErrors.confirmPassword ? 'border-red-400' : ''}`}
                />
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-xs">⚠ {formErrors.confirmPassword}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Account ban raha hai...
                  </span>
                ) : (
                  '🚀 Register Karo'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <p className="text-gray-500 text-sm">
              Pehle se account hai?{' '}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
              >
                ← Login karo
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
