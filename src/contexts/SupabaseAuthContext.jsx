
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authFetch, setAuthFetch] = useState(() => window.fetch);

  const ensureUserProfile = useCallback(async (user) => {
    try {
      // Validate user object first
      if (!user || !user.id || !user.email) {
        console.error('❌ Invalid user object:', { user });
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'Invalid user data. Please try signing out and back in.',
        });
        return;
      }

      console.log('🔍 Ensuring profile for user:', { id: user.id, email: user.email });

      // Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, onboarding_step')
        .eq('id', user.id)
        .single();

      // If profile doesn't exist, create it
      if (fetchError && fetchError.code === 'PGRST116') {
        console.log('🔄 Creating missing profile for user:', user.email);
        
        // Try to create profile with upsert to handle race conditions
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            onboarding_step: 'email_integration',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Failed to create user profile:', insertError);
          
          // If RLS error, try using a different approach
          if (insertError.code === '42501') {
            console.log('🔄 RLS error detected, trying alternative approach...');
            
            // Try to create profile using a stored procedure or direct insert
            // This might work if the user is properly authenticated
            try {
              const { data: altProfile, error: altError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  email: user.email,
                  onboarding_step: 'email_integration'
                })
                .select()
                .single();
                
              if (altError) {
                throw altError;
              }
              
              console.log('✅ Profile created via alternative method');
            } catch (altError) {
              console.error('❌ Alternative profile creation also failed:', altError);
              toast({
                variant: 'destructive',
                title: 'Profile Creation Failed',
                description: 'Unable to create user profile due to security restrictions. Please contact support.',
              });
            }
          } else {
            toast({
              variant: 'destructive',
              title: 'Profile Creation Failed',
              description: 'Failed to create user profile. Please try logging out and back in.',
            });
          }
        } else {
          console.log('✅ User profile created successfully');
          toast({
            title: 'Profile Created',
            description: 'Your profile has been created successfully.',
          });
        }
      } else if (fetchError) {
        console.error('❌ Error checking user profile:', fetchError);
        toast({
          variant: 'destructive',
          title: 'Profile Check Failed',
          description: 'Failed to check user profile. Please try refreshing the page.',
        });
      } else if (existingProfile) {
        console.log('✅ User profile exists:', existingProfile.onboarding_step);
      }
    } catch (error) {
      console.error('❌ Error ensuring user profile:', error);
      toast({
        variant: 'destructive',
        title: 'Profile Error',
        description: 'An error occurred while checking your profile. Please try refreshing the page.',
      });
    }
  }, [toast]);

  const handleOAuthSession = useCallback(
    async (currentSession) => {

      // More lenient check - try to handle session even with partial tokens
      if (currentSession && currentSession.user) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          console.error('No user found after OAuth');
          // Handle OAuth user verification issues more gracefully
          toast({
            title: "Authentication Issue",
            description: "Could not verify user after OAuth. Please try again.",
          });
          return;
        }

        const sessionProvider = currentSession.user.app_metadata?.provider;
        if (!sessionProvider) {
          return;
        }

        // Map session provider to our internal provider names
        const provider = sessionProvider === 'google' || sessionProvider === 'email' ? 'gmail' : sessionProvider;

        // Try to get tokens from different possible locations
        const accessToken = currentSession.provider_token || currentSession.access_token;
        const refreshToken = currentSession.provider_refresh_token || currentSession.refresh_token;

        console.log('🔍 OAuth Session Token Analysis:', {
          provider,
          hasProviderToken: !!currentSession.provider_token,
          hasAccessToken: !!currentSession.access_token,
          hasProviderRefreshToken: !!currentSession.provider_refresh_token,
          hasRefreshToken: !!currentSession.refresh_token,
          finalAccessToken: !!accessToken,
          finalRefreshToken: !!refreshToken,
          sessionKeys: Object.keys(currentSession)
        });

        if (accessToken) {
          // Validate that we have a refresh token
          if (!refreshToken) {
            console.warn('⚠️ No refresh token found in OAuth session - this will cause issues later');
            toast({
              variant: "destructive",
              title: "Incomplete OAuth Data",
              description: "The OAuth session is missing refresh token. Please reconnect your account.",
            });
            return;
          }
          // Get provider-specific scopes
          const getProviderScopes = (provider) => {
            if (provider === 'gmail') {
              return [
                'https://www.googleapis.com/auth/gmail.labels',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.modify'
              ];
            } else if (provider === 'outlook') {
              return [
                'Mail.Read',
                'Mail.ReadWrite',
                'Mail.Send',
                'MailboxSettings.ReadWrite',
                'User.Read'
              ];
            }
            return [];
          };

          // Note: Token storage is now handled by customOAuthService.js
          // This context only handles session management
          console.log('📝 OAuth session processed - tokens stored by OAuth service');

          toast({
            title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connected`,
            description: "Your email account has been connected successfully.",
          });
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ No access token found in OAuth session:', {
              provider_token: !!currentSession.provider_token,
              access_token: !!currentSession.access_token,
              sessionKeys: Object.keys(currentSession)
            });
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Invalid OAuth session:', {
            hasSession: !!currentSession,
            hasUser: !!currentSession?.user
          });
        }
      }
    },
    [toast]
  );

  useEffect(() => {
    setLoading(true);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user });
      
      // Handle OAuth integration logic
      if (event === "SIGNED_IN" && session?.provider_token) {
        await handleOAuthSession(session);
      }

      // Ensure user profile exists on sign in
      if (event === "SIGNED_IN" && session?.user) {
        console.log('🔐 User signed in, ensuring profile exists...');
        console.log('📊 Session details:', {
          user_id: session.user?.id,
          email: session.user?.email,
          access_token_length: session.access_token?.length || 0
        });
        
        // Add a longer delay to ensure the user is fully authenticated
        setTimeout(async () => {
          try {
            // Double-check that we have a valid user object
            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
              console.error('❌ Error getting user after sign in:', userError);
              toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'Failed to verify user authentication. Please try signing out and back in.',
              });
              return;
            }
            
            if (currentUser && currentUser.id && currentUser.email) {
              console.log('✅ Valid user found, ensuring profile...');
              await ensureUserProfile(currentUser);
            } else {
              console.error('❌ Invalid user after sign in:', currentUser);
              toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'Invalid user data received. Please try signing out and back in.',
              });
            }
          } catch (error) {
            console.error('❌ Error in profile creation process:', error);
            toast({
              variant: 'destructive',
              title: 'Profile Creation Error',
              description: 'An error occurred while creating your profile. Please try refreshing the page.',
            });
          }
        }, 1000); // Increased delay to 1 second
      }

      // Set user and session state regardless of the event.
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Also check the initial session on app load.
    const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
    };
    checkInitialSession();


    return () => {
      subscription.unsubscribe();
    };
  }, [handleOAuthSession]);

  useEffect(() => {
    const wrappedFetch = async (input, init = {}) => {
      const accessToken = session?.access_token;
      const res = await window.fetch(input, {
        ...init,
        headers: {
          ...init.headers,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (res.status === 401) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("401 Unauthorized detected, logging out...");
        }
        await supabase.auth.signOut();
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }

      return res;
    };

    setAuthFetch(() => wrappedFetch);
  }, [session]);

  const signUp = useCallback(
    async (email, password, options) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...options,
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign up Failed",
          description: error.message || "Something went wrong",
        });
      } else if (data.user) {
        // Create profile immediately after successful signup
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              onboarding_step: 'email_integration',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Failed to create user profile during signup:', profileError);
            // Don't show error to user as the signup was successful
            // Profile will be created on first login as fallback
          } else {
            console.log('✅ User profile created successfully during signup');
          }
        } catch (profileError) {
          console.error('Error creating profile during signup:', profileError);
          // Profile will be created on first login as fallback
        }
      }

      return { data, error };
    },
    [toast]
  );

  const signIn = useCallback(
    async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign in Failed",
          description: error.message || "Something went wrong",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });
      }

      return { error };
    },
    [toast]
  );

  const signInWithOAuth = useCallback(
    async (provider, options) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Starting OAuth for provider:', provider, 'with options:', options);
      }
      
      // Get provider-specific OAuth options
      const getProviderOAuthOptions = (provider) => {
        const baseOptions = {
          redirectTo: `${window.location.origin}/onboarding/email-integration`,
        };

        if (provider === 'gmail') {
          return {
            ...baseOptions,
            scopes: 'https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          };
        } else if (provider === 'outlook') {
          return {
            ...baseOptions,
            scopes: 'offline_access Mail.Read Mail.ReadWrite Mail.Send MailboxSettings.ReadWrite User.Read openid profile email',
            queryParams: {
              response_mode: 'query',
              prompt: 'consent'
            }
          };
        }
        
        return baseOptions;
      };

      const providerOptions = getProviderOAuthOptions(provider);
      
      try {
        // Import the custom OAuth service for development (uses localhost redirect URI)
        const { customOAuthService } = await import('@/lib/customOAuthService');
        
        // Get current user info for OAuth flow
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User must be authenticated to connect email providers');
        }

        // Get business name from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('client_config')
          .eq('id', user.id)
          .single();

        const businessName = profile?.client_config?.business_name || 'Business';

        // Use custom OAuth flow with localhost redirect URI for development
        const result = await customOAuthService.startOAuthFlow(
          provider,
          businessName,
          user.id
        );

        if (process.env.NODE_ENV === 'development') {
          console.log('📡 Custom OAuth response:', result);
        }

        // The custom OAuth flow handles the redirect internally
        // No need to redirect manually

      } catch (error) {
        console.error('❌ Direct OAuth sign-in failed:', error);
        toast({
          variant: "destructive",
          title: "OAuth Connection Failed",
          description: error.message,
        });
      }
    },
    [toast]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    } else {
      toast({
        title: "Logged Out",
        description: "You've been successfully logged out.",
      });
    }

    return { error };
  }, [toast]);

  const resetPasswordForEmail = useCallback(
    async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Password Reset Failed",
          description: error.message || "Something went wrong",
        });
      } else {
        toast({
          title: "Reset Email Sent",
          description: "Please check your email for password reset instructions.",
        });
      }
      return { error };
    },
    [toast]
  );

  const updateUserPassword = useCallback(
    async (password) => {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          variant: "destructive",
          title: "Password Update Failed",
          description: error.message || "Something went wrong",
        });
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated.",
        });
      }
      return { error };
    },
    [toast]
  );

  const createProfileManually = useCallback(async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'No User Found',
        description: 'Please sign in first before creating a profile.',
      });
      return { success: false };
    }

    try {
      console.log('🔧 Manual profile creation for user:', user.email);
      await ensureUserProfile(user);
      
      toast({
        title: 'Profile Creation Attempted',
        description: 'Profile creation process completed. Please check if your profile was created successfully.',
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Manual profile creation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Profile Creation Failed',
        description: 'Failed to create profile manually. Please try signing out and back in.',
      });
      
      return { success: false, error: error.message };
    }
  }, [user, ensureUserProfile, toast]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signUp,
      signIn,
      signInWithOAuth,
      signOut,
      resetPasswordForEmail,
      updateUserPassword,
      authFetch,
      createProfileManually,
    }),
    [
      user,
      session,
      loading,
      signUp,
      signIn,
      signInWithOAuth,
      signOut,
      resetPasswordForEmail,
      updateUserPassword,
      authFetch,
      createProfileManually,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
