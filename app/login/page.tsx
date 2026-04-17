"use client";
import { useState } from "react";
import { supabase } from '../../lib/supabase'; 
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
      // ১. Supabase Auth দিয়ে সাইন-ইন
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // ২. প্রোফাইল টেবিল থেকে ইউজারের রোল চেক করা
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user?.id)
        .single();

      if (profileError || !profile) {
        throw new Error("আপনার প্রোফাইল তথ্য পাওয়া যায়নি।");
      }

      // ৩. রোল ভেরিফিকেশন (The Guard)
      // শুধুমাত্র 'admin' এবং 'staff' এই পোর্টালে ঢুকতে পারবে
      if (profile.role !== 'admin' && profile.role !== 'staff') {
        // যদি বিটুবি বা সাধারণ ইউজার হয়, তবে সেশন ক্লিয়ার করে দিন
        await supabase.auth.signOut();
        setError("এক্সেস ডিনাইড! এই পোর্টালটি শুধুমাত্র এডমিন ও স্টাফদের জন্য।");
        setLoading(false);
        return;
      }

      // ৪. রোল ঠিক থাকলে ড্যাশবোর্ডে রিডাইরেক্ট
      router.push("/"); 
      
      setTimeout(() => {
        router.refresh();
      }, 100);

    } catch (err: any) {
      console.error("Login Error:", err.message);
      setError(err.message === "Invalid login credentials" 
        ? "ইমেল বা পাসওয়ার্ড ভুল।" 
        : err.message);
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
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-xs text-center font-bold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block tracking-wider">Email Address</label>
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

          <div className="relative">
            <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block tracking-wider">Password</label>
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

          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-[0.15em]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Authorizing...
              </>
            ) : (
              "Sign In to ERP"
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-500 text-[10px] font-medium italic opacity-50">
          Authorized personnel only. Access monitored by SeaLand Agro.
        </p>
      </div>
    </div>
  );
}

