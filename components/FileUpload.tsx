'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

export default function FileUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // ১. এক্সেল ফাইলের হেডলাইন অনুযায়ী ডাটা ফরম্যাট করা
          const rawData = results.data.map((item: any) => ({
            name_en: item['product name']?.trim(), // 'product name' কলাম
            price: parseFloat(item['price']) || 0,   // 'price' কলাম
            unit: item['unit']?.trim() || 'KG'       // 'unit' কলাম
          })).filter(item => item.name_en); // নাম না থাকলে সেটি বাদ দিবে

          // ২. ডুপ্লিকেট ডাটা রিমুভ করা (এরর ফিক্স করার জন্য)
          const uniqueData = Array.from(new Map(rawData.map(item => [item.name_en, item])).values());

          // ৩. ডাটাবেজে আপলোড করা
          const { error } = await supabase
            .from('products')
            .upsert(uniqueData, { onConflict: 'name_en' });

          if (error) throw error;

          alert("ইনভেন্টরি সফলভাবে আপডেট হয়েছে!");
          if (onUploadSuccess) onUploadSuccess();
        } catch (error: any) {
          console.error("Upload Error:", error);
          alert("এরর: " + (error.message || "CSV ফরম্যাট চেক করুন"));
        } finally {
          setUploading(false);
          e.target.value = null;
        }
      }
    });
  };

  return (
    <div className="relative">
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFile} 
        className="hidden" 
        id="csv-input" 
        disabled={uploading}
      />
      
      <label 
        htmlFor="csv-input"
        className={`
          flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer
          ${uploading 
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
            : 'bg-[#0a0a0a] border border-dashed border-gray-700 text-gray-400 hover:border-green-500 hover:text-white'}
        `}
      >
        {uploading ? <Loader2 size={16} className="animate-spin text-green-500" /> : <FileSpreadsheet size={16} className="text-green-500" />}
        {uploading ? 'Processing...' : 'Upload Products CSV'}
      </label>
    </div>
  );
}