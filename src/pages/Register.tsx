import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser as PersonIcon,
  FaEnvelope as EmailIcon,
  FaLock as LockIcon,
  FaGoogle as GoogleIcon,
  FaImage as ImageIcon,
  FaTimes as CloseIcon
} from 'react-icons/fa';
import authService from '../services/authService';
import userSettings from '../utils/userSettings';
import { compressImage } from '../utils/utils';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileImage: '',
    icrRatio: 10, // Default ICR ratio of 1:10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should not exceed 10MB');
        return;
      }
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        setError('Only JPEG, PNG, and GIF images are allowed');
        return;
      }
      try {
        setLoading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = reader.result as string;
            const compressedImage = await compressImage(base64);
            setImagePreview(compressedImage);
            setFormData((prev) => ({ ...prev, profileImage: compressedImage }));
            setError('');
          } catch (err) {
            setError('Error compressing image');
          } finally {
            setLoading(false);
          }
        };
        reader.onerror = () => {
          setError('Error reading file');
          setLoading(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setError('Error processing image');
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await authService.register(registrationData);
      
      // Ensure ICR ratio is saved in the user object
      if (response.user && formData.icrRatio) {
        userSettings.updateUserIcrRatio(formData.icrRatio);
      }
      
      setShowSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-screen bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4] flex items-center justify-center overflow-hidden">
      {/* Subtle background pattern (optional) */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[length:40px_40px]" />

      {/* Increased max-w from xs to md and removed scrolling */}
      <div className="relative w-full max-w-md h-full flex flex-col items-center justify-center px-4 sm:px-0">
        {/* Card container with more spacing and no scroll */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 sm:p-8 w-full">
          {/* Branding */}
          <h3 
            className="text-center mb-3 text-[#8B7355] font-bold font-serif text-2xl sm:text-3xl"
          >
            SugARate
          </h3>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <PersonIcon />
              </span>
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                autoFocus
                disabled={loading}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-10 pr-3 py-3 border border-[#D4C5B9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355] hover:border-[#8B7355] disabled:opacity-50 transition-all"
              />
            </div>

            {/* Email Field */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <EmailIcon />
              </span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                disabled={loading}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-3 py-3 border border-[#D4C5B9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355] hover:border-[#8B7355] disabled:opacity-50 transition-all"
              />
            </div>

            {/* Password & Confirm Password Fields */}
            {['password', 'confirmPassword'].map((field) => (
              <div key={field} className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <LockIcon />
                </span>
                <input
                  type="password"
                  name={field}
                  placeholder={
                    field === 'password' ? 'Password' : 'Confirm Password'
                  }
                  required
                  disabled={loading}
                  value={formData[field as keyof typeof formData]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                  className="w-full pl-10 pr-3 py-3 border border-[#D4C5B9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355] hover:border-[#8B7355] disabled:opacity-50 transition-all"
                />
              </div>
            ))}

            {/* ICR Ratio Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-[#8B7355] mb-2">
                Insulin-to-Carb Ratio (ICR)
                <span className="ml-1 text-xs text-[#8B7355]/70">
                  (1 unit of insulin covers how many grams of carbs?)
                </span>
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={formData.icrRatio}
                  onChange={(e) => setFormData({ ...formData, icrRatio: parseInt(e.target.value) })}
                  className="w-full h-2 bg-[#D4C5B9] rounded-lg appearance-none cursor-pointer accent-[#8B7355]"
                />
                <span className="ml-3 min-w-[3rem] px-3 py-1 bg-[#8B7355]/10 rounded-lg text-[#8B7355] font-medium text-center">
                  1:{formData.icrRatio}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#8B7355]/70">
                This helps calculate insulin requirements based on carbohydrate intake.
              </p>
            </div>
            
            {/* Profile Image Upload / Preview */}
            {imagePreview ? (
              <div className="relative mt-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setFormData((prev) => ({ ...prev, profileImage: '' }));
                  }}
                  disabled={loading}
                  className="absolute right-2 top-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-all"
                >
                  <CloseIcon />
                </button>
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="w-full rounded-xl max-h-48 object-cover shadow-md"
                />
              </div>
            ) : (
              <label className="flex items-center justify-center w-full mt-2 mb-4 p-3 border border-[#D4C5B9] text-gray-600 rounded-xl cursor-pointer hover:border-[#8B7355] transition-all">
                <ImageIcon className="mr-2" />
                Add Profile Picture
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
              </label>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-white font-medium bg-gradient-to-r from-[#8B7355] to-[#A68A64] hover:shadow-lg disabled:opacity-50 transform hover:scale-[1.02] transition-all"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

    
      

            {/* Navigate to Login */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              disabled={loading}
              className="w-full py-3 rounded-xl text-[#8B7355] hover:bg-[#8B7355]/10 transition-all disabled:opacity-50"
            >
              Already have an account? Sign In
            </button>
          </form>
        </div>
      </div>

      {/* Success Snackbar */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg border border-green-100 bg-green-50 text-green-700">
          Registration successful!
        </div>
      )}
    </div>
  );
};

export default Register;
