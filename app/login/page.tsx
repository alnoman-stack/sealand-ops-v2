"use client";
import { useState } from "react";
import { supabase } from '../../lib/supabase'; // আপনার ফাইলের নাম অনুযায়ী পাথ
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // সঠিক পাথ: আপনার মেইন ফাইলটি যেহেতু app/page.tsx তে, তাই শুধু "/" হবে
      router.push("/"); 
      
      // পেজ রিফ্রেশ করে সেশন আপডেট করা
      setTimeout(() => {
        router.refresh();
      }, 100);

    } catch (err: any) {
      // বাংলা এরর মেসেজ আরও স্পষ্ট করা হলো
      setError("ইমেল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4 font-sans">
      <div className="w-full max-w-md bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-700 p-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">SeaLand <span className="text-blue-500">Agro</span></h1>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest">Operations Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
              <input
                type="email"
                required
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="name@sealandagro.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl py-3 pl-11 pr-12 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Processing...
              </>
            ) : (
              "Sign In to ERP"
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-500 text-xs italic">
          Authorized personnel only. SeaLand Agro © 2026
        </p>
      </div>
    </div>
  );
}