'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // আপনার সুপাবেস কনফিগ পাথ
import { Upload, Loader2, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';

export default function CSVUploader({ onRefresh }: { onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        // ডেটাবেজে আপলোড (upsert ব্যবহার করলে আগের ডেটা থাকলে আপডেট হবে, না থাকলে নতুন তৈরি হবে)
        const { error } = await supabase
          .from('products') 
          .upsert(results.data, { onConflict: 'id' }); // আপনার টেবিলের ইউনিক কলাম (যেমন ID) দিন

        if (error) {
          console.error("Upload error:", error);
          alert("আপলোডে সমস্যা হয়েছে!");
        } else {
          alert("ডেটা সফলভাবে আপলোড হয়েছে!");
          onRefresh(); // ইনভেন্টরি লিস্ট রিফ্রেশ করার জন্য
        }
        setLoading(false);
      }
    });
  };

  return (
    <label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl cursor-pointer transition-all font-bold text-xs uppercase italic">
      {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
      {loading ? "Uploading..." : "Import CSV"}
      <input type="file" accept=".csv" className="hidden" onChange={handleUpload} />
    </label>
  );
}