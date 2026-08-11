'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 1. wait for the animation (2.2 seconds)
    const timer = setTimeout(() => {
      setFadeOut(true); // start the fade out effect

      // 2. redirect after the transition (400ms)
      setTimeout(() => {
        const token = localStorage.getItem('token');
        if (token) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      }, 400);
    }, 2200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-500 ease-out ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-12 px-4">
        {/* IIT LOGO */}
        <div className="transform transition-transform duration-700 hover:scale-105">
          <img
            src="/iit-logo.png"
            alt="IIT Logo"
            className="w-72 sm:w-96 h-auto object-contain"
          />
        </div>

        {/* LOADING SPINNER */}
        <div className="flex items-center justify-center pt-4">
          <svg
            className="w-8 h-8 text-[#1b2a4e] animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3.5"
            ></circle>
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
    </div>
  );
}