'use client'
import React, { forwardRef } from 'react';

// সংখ্যাকে কথায় রূপান্তর (In Words)
const numberToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? 'and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
    return convert(Math.floor(n / 100000)) + ' Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
  };
  return num === 0 ? 'Zero Taka Only' : (convert(Math.floor(num)) + ' Taka Only').replace(/\s+/g, ' ').trim();
};

const InvoicePrint = forwardRef(({ data, items }: any, ref: any) => {
  if (!data) return null;

  return (
    <div ref={ref} className="invoice-container-main">
      <div className="invoice-page">
        {/* Header */}
        <div className="invoice-header">
          <div className="company-info">
            <h1 className="logo-text">SEALAND AGRO</h1>
            <p className="sub-text">House # 3, Road # Nobinagar 16, Dhaka Uddan, Mohammadpur</p>
            <p className="sub-text">Mobile: +8801714114396 | Email: sealandagro@gmail.com</p>
          </div>
          <div className="invoice-details">
            <h2 className="title-large">INVOICE</h2>
            <p className="date-text">Date: {new Date().toLocaleDateString('en-GB')}</p>
            <p className="inv-no"># {data.invoice_number}</p>
          </div>
        </div>

        {/* Customer Information Section */}
        <div className="info-section">
          <div className="bill-to">
            <p className="label-top">BILL TO:</p>
            <p className="client-name">{data?.customer_name || "N/A"}</p>
          </div>
          
          <div className="ship-to">
            <p className="label-top">CUSTOMER ADDRESS:</p>
            <p className="address-display">
              {/* ডাটাবেস থেকে আসা অ্যাড্রেস এখানে সরাসরি বসবে */}
              {data?.customer_address ? data.customer_address : "No address available"}
            </p>
          </div>
        </div>

        {/* Table Section */}
        <div className="items-table-section">
          <table className="main-table">
            <thead>
              <tr>
                <th style={{width: '5%'}}>SL</th>
                <th style={{width: '55%', textAlign: 'left'}}>PRODUCT NAME</th>
                <th style={{width: '10%'}}>QTY</th>
                <th style={{width: '15%', textAlign: 'right'}}>PRICE</th>
                <th style={{width: '15%', textAlign: 'right'}}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items && items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td className="product-cell">{item.product_name}</td>
                  <td>{item.qty}</td>
                  <td style={{textAlign: 'right'}}>{item.unit_price} TK</td>
                  <td style={{textAlign: 'right', fontWeight: 'bold'}}>{item.total} TK</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total & Words Section */}
        <div className="bottom-summary">
          <div className="words-box">
            <span className="label-top">IN WORDS:</span>
            <p className="words-display">{numberToWords(data.total_amount)}</p>
          </div>
          <div className="grand-total-display">
            <span className="total-label">GRAND TOTAL</span>
            <p className="total-amount">{data.total_amount} <small>TK</small></p>
          </div>
        </div>

        {/* Signatures */}
        <div className="signature-area">
          <div className="sign-box">
            <div className="sign-line"></div>
            <p>CUSTOMER SIGNATURE</p>
          </div>
          <div className="sign-box">
            <div className="sign-line blue-bold"></div>
            <p className="authorized">AUTHORIZED SIGN</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .invoice-container-main { 
          background: #ffffff !important; 
          width: 100%; 
          color: #000000 !important;
        }

        .invoice-page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 15mm;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
          background: white !important;
        }

        .invoice-header { 
          display: flex; 
          justify-content: space-between; 
          border-bottom: 2px solid #1e3a8a !important; 
          padding-bottom: 10px; 
          margin-bottom: 25px; 
        }

        .logo-text { color: #1e3a8a !important; font-size: 28px; font-weight: 800; margin: 0; }
        .sub-text { font-size: 11px; color: #444 !important; margin: 2px 0; }
        .title-large { font-size: 35px; font-weight: 900; color: #f1f1f1 !important; margin: 0; position: absolute; right: 15mm; opacity: 0.5; z-index: 0; }
        .date-text { color: #000 !important; font-size: 12px; position: relative; z-index: 1; }
        .inv-no { font-weight: 800; color: #2563eb !important; font-size: 14px; text-align: right; position: relative; z-index: 1; }
        
        /* কাস্টমার ইনফো সেকশন ফিক্স */
        .info-section { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px; 
          border-left: 4px solid #2563eb; 
          padding-left: 15px; 
        }
        .label-top { font-size: 10px; font-weight: 900; color: #666 !important; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .client-name { font-size: 18px; font-weight: 800; margin: 0; text-transform: uppercase; color: #000 !important; }
        .address-display { font-size: 12px; color: #333 !important; font-weight: 500; max-width: 250px; line-height: 1.4; }
        .ship-to { text-align: right; }

        .items-table-section { flex-grow: 1; margin-top: 10px; }
        .main-table { width: 100%; border-collapse: collapse; }
        .main-table th { background: #1e3a8a !important; color: white !important; font-size: 12px; padding: 12px; text-transform: uppercase; -webkit-print-color-adjust: exact; }
        .main-table td { padding: 10px; border-bottom: 1px solid #e5e7eb !important; font-size: 13px; text-align: center; color: #000 !important; }
        .product-cell { text-align: left !important; font-weight: 600; text-transform: uppercase; }
        
        .bottom-summary { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 20px; }
        .words-display { font-size: 13px; font-style: italic; font-weight: 700; color: #222 !important; margin-top: 5px; max-width: 400px; text-transform: capitalize; }
        
        .grand-total-display { background: #f8fafc !important; padding: 20px 40px; border-radius: 15px; text-align: right; border: 1px solid #e2e8f0; -webkit-print-color-adjust: exact; }
        .total-label { font-size: 11px; font-weight: 900; color: #2563eb !important; letter-spacing: 1px; }
        .total-amount { font-size: 32px; font-weight: 900; color: #1e3a8a !important; margin: 0; }
        
        .signature-area { display: flex; justify-content: space-between; margin-top: 60px; gap: 80px; }
        .sign-box { flex: 1; text-align: center; }
        .sign-line { border-top: 1px solid #000 !important; margin-bottom: 8px; }
        .blue-bold { border-top: 3px solid #1e3a8a !important; }
        .sign-box p { font-size: 11px; font-weight: 800; color: #333 !important; margin: 0; text-transform: uppercase; }
        .authorized { color: #1e3a8a !important; }

        @media print {
          @page { 
            size: A4; 
            margin: 10mm; 
          }
          body * { visibility: hidden !important; }
          .invoice-container-main, .invoice-container-main * { visibility: visible !important; }
          .invoice-container-main { position: absolute; left: 0; top: 0; width: 100% !important; background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
});

InvoicePrint.displayName = 'InvoicePrint';
export default InvoicePrint;