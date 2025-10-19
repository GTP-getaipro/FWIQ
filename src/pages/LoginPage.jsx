import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useToast } from '@/components/ui/use-toast';
import Logo from '@/components/Logo';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validationRules = {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    },
    password: {
      required: true,
      minLength: 8,
      message: 'Password must be at least 8 characters',
    },
  };

  const { values, errors, handleChange, validateForm, isValid } =
    useFormValidation(
      {
        email: '',
        password: '',
      },
      validationRules
    );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    const { error } = await signIn(values.email, values.password);
    setIsLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        toast({
          variant: 'destructive',
          title: 'Email Not Verified',
          description: 'Please check your inbox to verify your email before logging in.',
        });
        navigate('/verify-email');
      }
      // The signIn function in SupabaseAuthContext already shows a toast for other errors
    } else {
      // On successful login, redirect to dashboard or onboarding
      console.log('Login successful, redirecting...');
      
      // Wait a moment for auth state to update, then redirect
      setTimeout(() => {
        // Check if user needs onboarding by looking at their profile
        const checkAndRedirect = async () => {
          try {
            // Ensure user ID exists before making the query
            if (!user?.id) {
              console.log('No user ID available, redirecting to onboarding');
              navigate('/onboarding/email-integration', { replace: true });
              return;
            }

            const { data: profile, error } = await supabase
              .from('profiles')
              .select('onboarding_step')
              .eq('id', user.id)
              .single();

            if (error && error.code === 'PGRST116') {
              // No profile exists, redirect to onboarding
              navigate('/onboarding/email-integration', { replace: true });
            } else if (profile && profile.onboarding_step && profile.onboarding_step !== 'completed') {
              // Profile exists but onboarding not complete
              navigate('/onboarding', { replace: true });
            } else {
              // Profile complete, go to dashboard
              navigate('/dashboard', { replace: true });
            }
          } catch (err) {
            console.error('Error checking profile for redirect:', err);
            // Fallback to dashboard
            navigate('/dashboard', { replace: true });
          }
        };
        
        checkAndRedirect();
      }, 500); // Wait 500ms for auth state to update
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-blue-50">
      <Helmet>
        <title>Login - FloWorx</title>
        <meta
          name="description"
          content="Sign in to your FloWorx account securely"
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-6"
            >
              <Logo />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-gray-800 mb-2"
            >
              Welcome Back
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600"
            >
              Sign in to your FloWorx account
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="email" className="text-gray-700 mb-2 block">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  className="pl-10 bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label htmlFor="password" className="text-gray-700 mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-between"
            >
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
              >
                Forgot password?
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;