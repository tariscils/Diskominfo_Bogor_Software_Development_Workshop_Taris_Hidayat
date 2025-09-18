"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting || isLoading) {
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    setErrors({}); // Clear previous errors

    try {
      // Call login API
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Set session data
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminData", JSON.stringify(data.data.admin));
        console.log("Login successful:", data.data.admin); // Debug log
        
        // Show success message
        message.success(data.message || "Login berhasil! Mengalihkan ke dashboard...");
        
        // Small delay to show the success message
        setTimeout(() => {
          router.push("/admin");
        }, 1000);
      } else {
        // Handle different types of errors
        const newErrors = {};
        
        if (data.errors) {
          // Handle field-specific errors
          if (data.errors.username) newErrors.username = data.errors.username;
          if (data.errors.password) newErrors.password = data.errors.password;
          if (data.errors.general) newErrors.general = data.errors.general;
        }
        
        // Fallback to general error message
        if (Object.keys(newErrors).length === 0) {
          newErrors.general = data.message || "Username atau password salah";
        }
        
        setErrors(newErrors);
        
        // Show error message
        message.error(data.message || "Login gagal");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = "Terjadi kesalahan jaringan. Periksa koneksi internet Anda.";
      setErrors({ general: errorMessage });
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-full flex justify-center mb-4">
            <img src="/uciha.png" alt="Uciha" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Admin Login
          </h1>
          <p className="text-gray-600">
            Masuk ke panel administrasi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg text-black transition duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.username ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan username"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg text-black transition duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                  errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4.03 3.97a.75.75 0 011.06 0l11 11a.75.75 0 11-1.06 1.06l-1.86-1.86a9.74 9.74 0 01-3.17 1.16c-3.92.77-7.9-1.4-9.98-4.89a1.75 1.75 0 010-1.8A12.09 12.09 0 015.9 5.06L4.03 3.97zM7.8 7.74l1.27 1.27a2.5 2.5 0 013.92 2.95l1.03 1.03a4 4 0 00-6.22-5.25z"/><path d="M10.56 13.44L7.5 10.38a2.5 2.5 0 003.06 3.06z"/><path d="M10 5c3.92-.77 7.9 1.4 9.98 4.89.3.5.3 1.3 0 1.8-.82 1.36-1.9 2.53-3.13 3.43l-1.07-1.06A8.58 8.58 0 0018.48 10C16.7 7.16 13.38 5.5 10 5z"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3c-4.18 0-7.9 2.52-9.98 6.11a1.75 1.75 0 000 1.78C2.1 14.48 5.82 17 10 17s7.9-2.52 9.98-6.11a1.75 1.75 0 000-1.78C17.9 5.52 14.18 3 10 3zm0 2c3.38 0 6.7 1.66 8.48 4.5C16.7 12.84 13.38 14.5 10 14.5S3.3 12.84 1.52 9.5C3.3 6.66 6.62 5 10 5zm0 2.5A3 3 0 1010 14a3 3 0 000-6.5z"/></svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {(errors.general || errors.submit) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-600">{errors.general || errors.submit}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className={`w-full font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center ${
              (isSubmitting || isLoading)
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {(isSubmitting || isLoading) ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Kembali ke Beranda
          </a>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Workshop Demo:</strong> Username: admin, Password: admin123
          </p>
          <p className="text-xs text-yellow-700 mt-2">
            API Endpoint: <code className="bg-yellow-100 px-1 rounded">POST /api/login</code>
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Jalankan <code className="bg-yellow-100 px-1 rounded">npm run create-admin</code> untuk membuat admin default
          </p>
        </div>
      </div>
    </div>
  );
}
