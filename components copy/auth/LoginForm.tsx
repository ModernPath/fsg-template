'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '../ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { createClient } from '@/utils/supabase/client';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Schema for passwordless login (email only)
const passwordlessSchema = z.object({
  email: z.string().email()
});

type PasswordlessFormData = z.infer<typeof passwordlessSchema>;

export default function LoginForm() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordless, setIsPasswordless] = useState(false);
  const supabase = createClient();
  const locale = params.locale as string;
  const nextUrl = searchParams.get('next') || `/${locale}/dashboard`;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerPasswordless,
    handleSubmit: handleSubmitPasswordless,
    formState: { errors: passwordlessErrors },
    watch: watchPasswordless,
  } = useForm<PasswordlessFormData>({
    resolver: zodResolver(passwordlessSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        setError(t('invalidCredentials'));
        return;
      }

      // Check if user is admin for admin route redirect
      if (nextUrl.includes('/admin')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (!profile?.is_admin) {
          setError(t('unauthorized'));
          return;
        }
      }

      router.push(nextUrl);
    } catch (err) {
      setError(t('loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPasswordless = async (data: PasswordlessFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(nextUrl)}`
        }
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Redirect to check email page
      router.push(`/${locale}/auth/check-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(t('loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(nextUrl)}`
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(t('loginError'));
    }
  };

  const togglePasswordless = () => {
    setIsPasswordless(!isPasswordless);
    setError(null);
  };

  return (
    <>
      {isPasswordless ? (
        <form onSubmit={handleSubmitPasswordless(onSubmitPasswordless)} className="space-y-8">
          {error && (
            <Alert variant="destructive" className="mb-8">
              {error}
            </Alert>
          )}

          <div className="space-y-3">
            <Label htmlFor="email" className="text-base font-medium text-gray-700 dark:text-gray-300">
              {t('email')}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              {...registerPasswordless('email')}
              className={`appearance-none block w-full px-4 py-3 text-lg border rounded-xl shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all
                ${passwordlessErrors.email ? 'border-red-300' : 'border-gray-300'}`}
            />
            {passwordlessErrors.email && (
              <p className="mt-2 text-sm text-red-600">{t('invalidEmail')}</p>
            )}
          </div>

          <div className="pt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('passwordlessDescription')}
            </p>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-xl text-lg font-medium text-white 
                bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all hover:scale-105"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-3 h-5 w-5" />
                  {t('signingIn')}
                </>
              ) : (
                t('passwordlessLogin')
              )}
            </Button>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={togglePasswordless}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              {t('signIn')} {t('withPassword')}
            </button>
          </div>


        </form>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {error && (
            <Alert variant="destructive" className="mb-8">
              {error}
            </Alert>
          )}

          <div className="space-y-3">
            <Label htmlFor="email" className="text-base font-medium text-gray-700 dark:text-gray-300">
              {t('email')}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              {...register('email')}
              className={`appearance-none block w-full px-4 py-3 text-lg border rounded-xl shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all
                ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{t('invalidEmail')}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="password" className="text-base font-medium text-gray-700 dark:text-gray-300">
              {t('password')}
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              {...register('password')}
              className={`appearance-none block w-full px-4 py-3 text-lg border rounded-xl shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all
                ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{t('invalidPassword')}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all"
              />
              <label htmlFor="remember-me" className="ml-3 text-base text-gray-700 dark:text-gray-300">
                {t('rememberMe')}
              </label>
            </div>

            <div className="text-base">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-all">
                {t('forgotPassword')}
              </a>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-xl text-lg font-medium text-white 
                bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all hover:scale-105"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-3 h-5 w-5" />
                  {t('signingIn')}
                </>
              ) : (
                t('signIn')
              )}
            </Button>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={togglePasswordless}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              {t('passwordlessLogin')}
            </button>
          </div>



          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-base">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {t('orContinueWith')}
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full inline-flex justify-center py-4 px-6 border border-gray-300 rounded-xl shadow-sm 
                  bg-white text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900
                  dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700
                  transform transition-all hover:scale-105"
                onClick={() => handleOAuthSignIn('google')}
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full inline-flex justify-center py-4 px-6 border border-gray-300 rounded-xl shadow-sm 
                  bg-white text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900
                  dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700
                  transform transition-all hover:scale-105"
                onClick={() => handleOAuthSignIn('github')}
              >
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub
              </Button>
            </div>
          </div>
        </form>
      )}
    </>
  );
} 