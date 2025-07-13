
import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon } from './icons';

interface LoginPageProps {
  onLogin: (user: { name: string; email: string }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Seed initial user data
  useEffect(() => {
    if (!localStorage.getItem('empyra_users')) {
      const defaultUsers = [{ name: 'Pitambar Singh (Admin)', email: 'admin@empyra.com', password: 'password' }];
      localStorage.setItem('empyra_users', JSON.stringify(defaultUsers));
    }
  }, []);

  const getUsers = () => {
    const users = localStorage.getItem('empyra_users');
    try {
        return users ? JSON.parse(users) : [];
    } catch (e) {
        return [];
    }
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setMessage('');
  }

  const handleViewChange = (newView: 'login' | 'register' | 'forgot') => {
    clearForm();
    setView(newView);
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = getUsers();
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (user) {
      onLogin({ name: user.name, email: user.email });
    } else {
      setError('Invalid email or password.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const users = getUsers();
    
    if (users.some((u: any) => u.email === email)) {
      setError('An account with this email already exists.');
      return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('empyra_users', JSON.stringify(users));
    setMessage('Registration successful! Please log in.');
    handleViewChange('login');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage(`If an account with email ${email} exists, a password reset link has been sent. (This is a demo).`);
    setTimeout(() => handleViewChange('login'), 4000);
  }

  const renderLogin = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="you@example.com" required />
      </div>
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <button type="button" onClick={() => handleViewChange('forgot')} className="text-sm text-sky-600 hover:underline">Forgot password?</button>
        </div>
        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="••••••••" required />
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {message && <p className="text-green-500 text-sm text-center">{message}</p>}
      <div>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700">Sign In</button>
      </div>
      <p className="text-center text-sm">
        Don't have an account? <button type="button" onClick={() => handleViewChange('register')} className="font-medium text-sky-600 hover:underline">Register</button>
      </p>
    </form>
  );

  const renderRegister = () => (
    <form onSubmit={handleRegister} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="Your Name" required />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="you@example.com" required />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="••••••••" required />
      </div>
       {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <div>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700">Create Account</button>
      </div>
      <p className="text-center text-sm">
        Already have an account? <button type="button" onClick={() => handleViewChange('login')} className="font-medium text-sky-600 hover:underline">Sign In</button>
      </p>
    </form>
  );
  
  const renderForgotPassword = () => (
    <form onSubmit={handleForgotPassword} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="Enter your email" required />
      </div>
      {message && <p className="text-sky-600 text-sm text-center">{message}</p>}
      <div>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700">Send Reset Link</button>
      </div>
       <p className="text-center text-sm">
        Remembered your password? <button type="button" onClick={() => handleViewChange('login')} className="font-medium text-sky-600 hover:underline">Back to Login</button>
      </p>
    </form>
  );

  const titles = {
      login: { title: 'Admin Login', subtitle: 'Welcome back, please sign in.'},
      register: { title: 'Create an Account', subtitle: 'Join the EMPYRA system.'},
      forgot: { title: 'Reset Password', subtitle: 'Enter your email to receive a reset link.'}
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <ShieldCheckIcon className="h-16 w-16 text-sky-500 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-4">EMPYRA</h1>
            <span className="text-lg text-sky-500 -mt-1 block font-semibold">FaceAttend</span>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-1">{titles[view].title}</h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">{titles[view].subtitle}</p>
            
            {view === 'login' && renderLogin()}
            {view === 'register' && renderRegister()}
            {view === 'forgot' && renderForgotPassword()}
        </div>

        <footer className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8 px-4">
            <p className="font-bold">EMPYRA FaceAttend is not just an app — it’s a system for loyalty, security, and future.</p>
            <p className="mt-4">Powered by EMPYRA | CEO – Pitambar Singh</p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;