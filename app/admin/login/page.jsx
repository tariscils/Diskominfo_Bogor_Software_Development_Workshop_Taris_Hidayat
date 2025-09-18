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
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg text-black transition duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan password"
              disabled={isLoading}
            />
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
