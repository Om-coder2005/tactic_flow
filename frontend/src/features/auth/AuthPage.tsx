import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      
      let payload;
      if (isLogin) {
        // OAuth2PasswordRequestForm expects form data
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        payload = formData;
      } else {
        payload = JSON.stringify({ name, email, password });
      }

      const res = await apiClient<{ user: any }>(endpoint, {
        method: 'POST',
        headers: isLogin ? { 'Content-Type': 'application/x-www-form-urlencoded' } : { 'Content-Type': 'application/json' },
        body: payload
      });

      // Update Zustand state
      useAuthStore.setState({ isAuthenticated: true, user: res.user });
      
      // Navigate to the board
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed.');
    }
  };

  const handleGuest = async () => {
    try {
      const res = await apiClient<{ user: any }>('/auth/guest', {
        method: 'POST'
      });
      useAuthStore.setState({ isAuthenticated: true, user: res.user });
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Guest login failed.');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-white">
      <div className="w-full max-w-md p-8 bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-600">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Login to TacticFlow' : 'Create an Account'}
        </h2>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full p-2 border border-surface-300 dark:border-surface-500 rounded-md bg-transparent"
                required={!isLogin}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full p-2 border border-surface-300 dark:border-surface-500 rounded-md bg-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full p-2 border border-surface-300 dark:border-surface-500 rounded-md bg-transparent"
              required
            />
          </div>
          
          <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-4 text-center">
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-500 hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-surface-300 dark:border-surface-500"></div>
            <span className="flex-shrink-0 mx-4 text-surface-500 text-sm">or</span>
            <div className="flex-grow border-t border-surface-300 dark:border-surface-500"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGuest}
            className="w-full py-2 bg-surface-200 dark:bg-surface-800 hover:bg-surface-300 dark:hover:bg-surface-700 text-surface-900 dark:text-white rounded-md font-medium transition-colors"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};
