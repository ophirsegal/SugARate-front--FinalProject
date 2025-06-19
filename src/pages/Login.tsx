import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import authService from '../services/authService';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.login(formData);
      setShowSuccess(true);
      setTimeout(() => navigate('/home'), 1500);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler for Google OAuth login using a popup window
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      // Request the Google auth URL from your backend
      const response = await axios.get(`${API_URL}/auth/google/url`, {
        withCredentials: true,
      });
      if (response.data.url) {
        // Open the URL in a popup window
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          response.data.url,
          "googleLogin",
          `width=${width},height=${height},left=${left},top=${top}`
        );
        if (!popup) {
          setError("Popup blocked. Please allow popups and try again.");
          return;
        }
        // Listen for messages from the popup window
        const handleMessage = (event: MessageEvent) => {
          console.log("Received message from popup:", event);
          // Check that the message comes from your server origin.
          // In development, your server is running at 'http://localhost:5000'
          if (event.origin !== 'http://localhost:5000') {
            console.warn(`Unexpected message origin: ${event.origin}`);
            return;
          }
          const { token, user } = event.data;
          if (token && user) {
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            navigate("/home");
          } else {
            console.warn("Token or user data missing in message:", event.data);
          }
          window.removeEventListener("message", handleMessage);
        };
        window.addEventListener("message", handleMessage, false);
      } else {
        setError("Failed to get Google authentication URL.");
      }
    } catch (error) {
      console.error("Google login error:", error);
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4] fixed top-0 left-0 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[length:40px_40px]" />
      
      <div className="w-full max-w-md px-6 relative">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-h-[90vh] overflow-y-auto border border-white/20">
          <div className="text-center mb-8">
            <h3 
              className="text-3xl sm:text-4xl font-bold mb-3 text-[#8B7355] tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              SugARate
            </h3>
            <p className="text-gray-600 text-sm">
              Join our community of people managing diabetes together
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center">
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-500 group-hover:text-[#8B7355] transition-colors">
                <MdEmail className="h-5 w-5" />
              </span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                autoFocus
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 border border-[#D4C5B9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355] hover:border-[#8B7355] disabled:opacity-50 transition-all"
              />
            </div>

            <div className="relative group">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-500 group-hover:text-[#8B7355] transition-colors">
                <RiLockPasswordLine className="h-5 w-5" />
              </span>
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 border border-[#D4C5B9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355] hover:border-[#8B7355] disabled:opacity-50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-white font-medium bg-gradient-to-r from-[#8B7355] to-[#A68A64] hover:shadow-lg disabled:opacity-50 transform hover:scale-[1.02] transition-all duration-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <hr className="flex-grow border-t border-[#D4C5B9]" />
            <span className="mx-4 text-[#8B7355] text-sm font-medium">or</span>
            <hr className="flex-grow border-t border-[#D4C5B9]" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center mb-6 py-3 px-4 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
          >
            <FcGoogle className="w-5 h-5 mr-3" />
            Continue with Google
          </button>

          <div className="text-center text-gray-600">
            Don't have an account?{' '}
            <span
              onClick={() => navigate('/register')}
              className="text-[#8B7355] hover:text-[#9E876A] cursor-pointer font-medium hover:underline transition-all"
            >
              Sign Up
            </span>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-50 text-green-700 px-6 py-3 rounded-xl shadow-lg border border-green-100 animate-fade-in">
          Login successful!
        </div>
      )}
    </div>
  );
};

export default Login;
