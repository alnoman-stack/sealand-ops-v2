'use client'
import React, { forwardRef } from 'react';

// সংখ্যাকে কথায় রূপান্তর
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
            <p className="tagline">A COMMITMENT TO FRESHNESS!</p>
            <p className="sub-text">House # 3, Road # Nobinagar 16, Dhaka Uddan, Mohammadpur</p>
            <p className="sub-text">Mobile: +8801714114396 | Email: sealandagro@gmail.com</p>
          </div>
          <div className="invoice-details">
            <h2 className="invoice-title">INVOICE</h2>
            <div className="meta-info">
              <p><strong>Date:</strong> {data?.created_at ? new Date(data.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</p>
              <p className="inv-no"># {data.invoice_number}</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="info-grid">
          <div className="info-box">
            <p className="label">BILL TO:</p>
            <p className="value-name">{data?.customer_name || "N/A"}</p>
          </div>
          <div className="info-box text-right">
            <p className="label">CUSTOMER ADDRESS:</p>
            <p className="value-address">{data?.customer_address || "No address available"}</p>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: '8%' }}>SL</th>
                <th style={{ width: '52%', textAlign: 'left' }}>PRODUCT DESCRIPTION</th>
                <th style={{ width: '10%' }}>QTY</th>
                <th style={{ width: '15%', textAlign: 'right' }}>UNIT PRICE</th>
                <th style={{ width: '15%', textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td className="product-name">{item.product_name}</td>
                  <td>{item.qty}</td>
                  <td style={{ textAlign: 'right' }}>{item.unit_price} TK</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.total} TK</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="summary-section">
          <div className="words-area">
            <p className="label">IN WORDS:</p>
            <p className="words-text">{numberToWords(data.total_amount)}</p>
          </div>
          <div className="total-area">
            <p className="label">GRAND TOTAL</p>
            <p className="amount-text">{data.total_amount} <span className="currency">TK</span></p>
          </div>
        </div>

        {/* Signatures */}
        <div className="footer-signs">
          <div className="sign-column">
            <div className="line"></div>
            <p>CUSTOMER SIGNATURE</p>
          </div>
          <div className="sign-column">
            <div className="line auth-line"></div>
            <p className="auth-text">AUTHORIZED SIGNATURE</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .invoice-container-main {
          background: #ffffff !important;
          width: 100%;
          color: #000000 !important;
          padding: 0;
          margin: 0;
        }

        .invoice-page {
          width: 210mm;
          min-height: 290mm;
          margin: 0 auto;
          padding: 20mm 15mm;
          background: white !important;
          display: flex;
          flex-direction: column;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 3px solid #1E3A8A;
          padding-bottom: 15px;
          margin-bottom: 30px;
        }

        .logo-text { font-size: 32px; font-weight: 800; color: #1E3A8A !important; margin: 0; }
        .tagline { font-size: 10px; font-weight: 900; color: #666666 !important; margin-top: 5px; letter-spacing: 2px; font-style: italic; }
        .sub-text { font-size: 11px; color: #333333 !important; margin: 3px 0; }

        .invoice-title { font-size: 40px; font-weight: 900; color: #E5E7EB !important; margin: 0; line-height: 1; text-align: right; }
        .meta-info { margin-top: -10px; text-align: right; }
        .meta-info p { font-size: 13px; margin: 2px 0; }
        .inv-no { color: #2563EB !important; font-weight: 800; font-size: 16px; }

        .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; border-left: 5px solid #2563EB; padding-left: 15px; }
        .label { font-size: 10px; font-weight: 900; color: #6B7280 !important; margin-bottom: 5px; text-transform: uppercase; }
        .value-name { font-size: 20px; font-weight: 800; color: #000000 !important; text-transform: uppercase; }
        .value-address { font-size: 12px; color: #374151 !important; max-width: 300px; line-height: 1.5; }
        .text-right { text-align: right; }

        .table-container { flex-grow: 1; margin-bottom: 30px; }
        .invoice-table { width: 100%; border-collapse: collapse; }
        .invoice-table th { background: #1E3A8A !important; color: #ffffff !important; padding: 12px; font-size: 12px; text-transform: uppercase; border: 1px solid #1E3A8A; }
        .invoice-table td { padding: 12px; border-bottom: 1px solid #E5E7EB; font-size: 13px; color: #000000 !important; text-align: center; }
        .product-name { text-align: left !important; font-weight: 700; text-transform: uppercase; color: #111827 !important; }

        .summary-section { display: flex; justify-content: space-between; align-items: flex-end; padding: 20px; background: #F9FAFB; border-radius: 10px; }
        .words-text { font-size: 13px; font-weight: 700; font-style: italic; color: #1F2937 !important; text-transform: capitalize; margin-top: 5px; }
        .amount-text { font-size: 36px; font-weight: 900; color: #1E3A8A !important; margin: 0; line-height: 1; }
        .currency { font-size: 14px; color: #2563EB; }

        .footer-signs { display: flex; justify-content: space-between; margin-top: 60px; gap: 100px; }
        .sign-column { flex: 1; text-align: center; }
        .line { border-top: 1px solid #000000; margin-bottom: 10px; }
        .auth-line { border-top: 2px solid #1E3A8A; }
        .sign-column p { font-size: 11px; font-weight: 800; color: #374151 !important; text-transform: uppercase; }
        .auth-text { color: #1E3A8A !important; }

        @media print {
          .invoice-page { padding: 10mm; margin: 0; width: 100%; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
});

InvoicePrint.displayName = 'InvoicePrint';
export default InvoicePrint;