'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        try {
          const rawData = results.data.map((item: any) => ({
            name_en: item['product name']?.trim(),
            price: parseFloat(item['price']) || 0,
            unit: item['unit']?.trim() || 'KG'
          })).filter((item: any) => item.name_en);

          const uniqueData = Array.from(new Map(rawData.map((item: any) => [item.name_en, item])).values());
          const { error } = await supabase.from('products').upsert(uniqueData, { onConflict: 'name_en' });

          if (error) throw error;
          alert("Inventory Updated!");
          if (onUploadSuccess) onUploadSuccess();
        } catch (error: any) {
          alert("Error: " + error.message);
        } finally {
          setUploading(false);
          e.target.value = null;
        }
      }
    });
  };

  return (
    <div className="relative z-50">
      <input type="file" accept=".csv" onChange={handleFile} className="hidden" id="csv-input" disabled={uploading} />
      <label 
        htmlFor="csv-input"
        className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer border shadow-lg min-w-[140px] ${
          uploading ? 'bg-gray-900 text-gray-600 border-gray-800' : 'bg-black border-gray-800 text-gray-400 hover:border-green-500 hover:text-white active:scale-95'
        }`}
      >
        {uploading ? <Loader2 size={16} className="animate-spin text-green-500" /> : <FileSpreadsheet size={16} className="text-green-500" />}
        {uploading ? 'Wait...' : 'Upload CSV'}
      </label>
    </div>
  );
}