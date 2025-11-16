import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { FiX, FiEye, FiEyeOff, FiShield, FiMail, FiLock, FiUser, FiGithub } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaMicrosoft } from 'react-icons/fa';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConfirmPasswordField, setShowConfirmPasswordField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset form when tab changes
  useEffect(() => {
    setActiveTab(initialTab);
    setError('');
    loginFormik.resetForm();
    registerFormik.resetForm();
  }, [initialTab]);

  // Login form
  const loginFormik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        setError('');
        await login(values.email, values.password);
        onClose();
        // Navigate to dashboard after successful login
        navigate('/dashboard');
      } catch (err) {
        console.error('Login error:', err);
        if (err.response?.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('An error occurred during login. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Register form
  const registerFormik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Please confirm your password'),
      agreeToTerms: Yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
    }),
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        setError('');
        
        // Use the user's input name as username (make it alphanumeric)
        let username = values.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        
        // Try to register with the simple username first
        try {
          await register({
            username: username,
            email: values.email,
            first_name: values.name.split(' ')[0] || values.name,
            last_name: values.name.split(' ').slice(1).join(' ') || '',
            password: values.password,
          });
        } catch (err) {
          // If username is taken, add a small random number
          if (err.response?.data?.error?.includes('Username already taken')) {
            const randomNum = Math.floor(Math.random() * 100);
            username = `${username}${randomNum}`;
            
            await register({
              username: username,
              email: values.email,
              first_name: values.name.split(' ')[0] || values.name,
              last_name: values.name.split(' ').slice(1).join(' ') || '',
              password: values.password,
            });
          } else {
            throw err; // Re-throw other errors
          }
        }
        
        // Then automatically log them in
        await login(values.email, values.password);
        
        onClose();
        // Navigate to dashboard after successful registration and login
        navigate('/dashboard');
      } catch (err) {
        console.error('Registration error:', err);
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('An error occurred during registration. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleSocialLogin = async (provider) => {
    if (provider === 'google') {
      try {
        setIsLoading(true);
        setError('');
        await googleLogin();
        // The page will redirect to Google OAuth, so we don't need to close modal or navigate
        // The callback will handle the redirect back to the app
      } catch (err) {
        console.error('Google login error:', err);
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('An error occurred during Google login. Please try again.');
        }
        setIsLoading(false);
      }
    } else {
      // TODO: Implement other social login providers
      console.log(`Social login with ${provider} - not implemented yet`);
      setError(`${provider} login is not implemented yet. Please use email login.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm auth-modal-backdrop"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl mx-auto transform transition-all duration-300 ease-out modal-entrance">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden auth-modal-content max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 auth-modal-close"
          >
            <FiX className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex flex-col lg:flex-row min-h-[600px] lg:min-h-[650px]">
            {/* Left Panel - Plain White Background - No Scroll */}
            <div className="hidden lg:flex lg:w-1/2 bg-white p-8 xl:p-12 relative overflow-hidden h-full auth-left-panel-no-scroll">
              
              <div className="relative z-10 flex flex-col h-full overflow-hidden">
                {/* Top Logo */}
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-white rounded-xl shadow-lg mr-4">
                    <FiShield className="w-6 h-6 text-black" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">PhishGuard</h1>
                </div>

                {/* Main Image Container - No Scroll */}
                <div className="flex-1 flex flex-col justify-center items-center overflow-hidden">
                  <div className="relative w-full h-full flex items-center justify-center px-4 overflow-hidden">
                    {/* Dynamic Image Display */}
                    <div className="relative auth-image-container w-full h-full overflow-hidden">
                      {/* Main Image - Dynamic based on active tab */}
                      <img 
                        src={activeTab === 'login' ? "/login_image1.png" : "/registration_image.png"}
                        alt={activeTab === 'login' ? "PhishGuard Login Illustration" : "PhishGuard Registration Illustration"}
                        className="w-full h-full object-contain rounded-2xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Dots/Pagination */}
                <div className="flex justify-center space-x-2 mt-6">
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTab === 'login' ? 'bg-blue-500 w-3 h-3' : 'bg-gray-300'}`}></div>
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTab === 'register' ? 'bg-blue-500 w-3 h-3' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-center">
              {/* Tabs */}
              <div className="flex space-x-6 sm:space-x-8 mb-6 sm:mb-8">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`text-base font-semibold transition-all duration-200 auth-tab ${
                    activeTab === 'login'
                      ? 'text-gray-900 border-b-2 border-blue-500 pb-2 active'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Log in
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`text-base font-semibold transition-all duration-200 auth-tab ${
                    activeTab === 'register'
                      ? 'text-gray-900 border-b-2 border-blue-500 pb-2 active'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                {activeTab === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                {activeTab === 'login' 
                  ? 'Sign in to your PhishGuard account' 
                  : 'Join thousands of users protecting their inboxes'
                }
              </p>

              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl error-message">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Social login buttons */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 social-login-button"
                >
                  <FcGoogle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Google</span>
                </button>
                <button
                  onClick={() => handleSocialLogin('github')}
                  className="flex items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 social-login-button"
                >
                  <FiGithub className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">GitHub</span>
                </button>
                <button
                  onClick={() => handleSocialLogin('apple')}
                  className="flex items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 social-login-button"
                >
                  <FaApple className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Apple</span>
                </button>
                <button
                  onClick={() => handleSocialLogin('microsoft')}
                  className="flex items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 social-login-button"
                >
                  <FaMicrosoft className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Microsoft</span>
                </button>
              </div>

              {/* Separator */}
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    Or {activeTab === 'login' ? 'sign in' : 'sign up'} with email
                  </span>
                </div>
              </div>

              {/* Forms */}
              {activeTab === 'login' ? (
                <form onSubmit={loginFormik.handleSubmit} className="space-y-5 sm:space-y-6">
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-3">
                      Email address
                    </label>
                    <div className="focus-ring">
                      <input
                        id="login-email"
                        type="email"
                        {...loginFormik.getFieldProps('email')}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 auth-input text-base"
                        placeholder="Enter your email"
                      />
                    </div>
                    {loginFormik.touched.email && loginFormik.errors.email && (
                      <p className="mt-2 text-sm text-red-600">{loginFormik.errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-3">
                      Password
                    </label>
                    <div className="relative focus-ring">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        {...loginFormik.getFieldProps('password')}
                        className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 auth-input text-base"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors password-toggle"
                      >
                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                    {loginFormik.touched.password && loginFormik.errors.password && (
                      <p className="mt-2 text-sm text-red-600">{loginFormik.errors.password}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors">
                      Forgot your password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gray-900 text-white py-4 px-6 rounded-xl font-semibold hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed auth-button text-base"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spinner mr-3"></div>
                        Signing in...
                      </div>
                    ) : (
                      'Sign in to account'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={registerFormik.handleSubmit} className="space-y-5 sm:space-y-6">
                  <div>
                    <label htmlFor="register-name" className="block text-sm font-semibold text-gray-700 mb-3">
                      Full name
                    </label>
                    <div className="focus-ring">
                      <input
                        id="register-name"
                        type="text"
                        {...registerFormik.getFieldProps('name')}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 auth-input text-base"
                        placeholder="Enter your full name"
                      />
                    </div>
                    {registerFormik.touched.name && registerFormik.errors.name && (
                      <p className="mt-2 text-sm text-red-600">{registerFormik.errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="register-email" className="block text-sm font-semibold text-gray-700 mb-3">
                      Email address
                    </label>
                    <div className="focus-ring">
                      <input
                        id="register-email"
                        type="email"
                        {...registerFormik.getFieldProps('email')}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 auth-input text-base"
                        placeholder="Enter your email"
                      />
                    </div>
                    {registerFormik.touched.email && registerFormik.errors.email && (
                      <p className="mt-2 text-sm text-red-600">{registerFormik.errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="register-password" className="block text-sm font-semibold text-gray-700 mb-3">
                      Password
                    </label>
                    <div className="relative focus-ring">
                      <input
                        id="register-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...registerFormik.getFieldProps('password')}
                        className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 auth-input text-base"
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors password-toggle"
                      >
                        {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                    {registerFormik.touched.password && registerFormik.errors.password && (
                      <p className="mt-2 text-sm text-red-600">{registerFormik.errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="register-confirm-password" className="block text-sm font-semibold text-gray-700 mb-3">
                      Confirm password
                    </label>
                    <div className="relative focus-ring">
                      <input
                        id="register-confirm-password"
                        type={showConfirmPasswordField ? 'text' : 'password'}
                        {...registerFormik.getFieldProps('confirmPassword')}
                        className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 auth-input text-base"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPasswordField(!showConfirmPasswordField)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors password-toggle"
                      >
                        {showConfirmPasswordField ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                    {registerFormik.touched.confirmPassword && registerFormik.errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600">{registerFormik.errors.confirmPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...registerFormik.getFieldProps('agreeToTerms')}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                      />
                      <span className="text-sm text-gray-600 leading-relaxed">
                        I agree to the{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-500 font-medium transition-colors">
                          Terms of Service
                        </a>
                        {' '}and{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-500 font-medium transition-colors">
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                    {registerFormik.touched.agreeToTerms && registerFormik.errors.agreeToTerms && (
                      <p className="mt-2 text-sm text-red-600">{registerFormik.errors.agreeToTerms}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !registerFormik.values.agreeToTerms}
                    className="w-full bg-gray-900 text-white py-4 px-6 rounded-xl font-semibold hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed auth-button text-base"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spinner mr-3"></div>
                        Creating account...
                      </div>
                    ) : (
                      'Create account'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 