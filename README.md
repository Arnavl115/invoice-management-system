# InvoiceS

**InvoiceS** (formerly EventPro) is a comprehensive, client-side, browser-based financial and dashboard management application. It features a sleek, purely dynamic architecture without the need for a traditional backend routing framework, making it ultra-portable and lightning-fast.

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white" />
</p>

## 🚀 Features

- **Robust Authentication:** Secure Firebase Authentication via Email/Password credentials. Includes a demo bypass mode for public review.
- **Financial Intel (Dashboard):** Real-time tracked KPIs (Net Liquidity, Burn Rate, Budget Variance, Revenue).
- **Interactive Data Visualization:** 
  - Dynamic Line Chart (`Expense Velocity`) mapping your historical data contextually across trailing 6-month blocks.
  - Interactive Radar Chart (`Cash Flow Distribution`) plotting logic automatically by matching text strings inside your expenses to categorize spending (Taxes, CapEx, Payroll, OpEx).
  - Built-in "Expand" functionality for detailed breakdown modals.
- **Ledger Systems:** High-density, minimalist data tables matching modern FinTech standards for both Invoices and Expenses. Includes real-time item counting.
- **Oracle Dashboard:** Dedicated section showing backend execution of theoretical SQL Relational schemas in real-time as users modify the DOM.
- **Excel Sink Network:** Complete `.xlsx` import and export processing logic. Data entered on the UI can be mapped iteratively back directly to a spreadsheet (including Base64 injections of the generated ChartJs canvases!).
- **Multi-Theme Engine:** Toggle dynamically via local storage persistence between High-Contrast OLED (Dark), Notebook (Light), and warm espresso (Coffee) GUI themes.
- **Floating Calculator:** Native floating JS draggable calculator UI engineered for the dashboard to run quick financial math without context switching.

## 🛠️ Tech Stack & Sources

This project relies purely on powerful client-side CDNs integrated via standard ES6 Javascript:

*   **UI/UX Formatting:** [Tailwind CSS v3](https://tailwindcss.com/)
*   **Typography:** [Plus Jakarta Sans (Google Fonts)](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
*   **Iconography:** [FontAwesome v6.4.0 (Cloudflare CDN)](https://fontawesome.com/)
*   **Database & Auth:** [Firebase v10.9.0 via SDK Compat](https://firebase.google.com/docs/web/setup) 
*   **Data Visualization:** [Chart.js v3.9.1](https://www.chartjs.org/)
*   **Spreadsheet IO:** [ExcelJS v4.3.0](https://github.com/exceljs/exceljs) & [FileSaver.js](https://github.com/eligrey/FileSaver.js)

## ⚙️ Installation & Usage

Because the core architecture relies absolutely purely on the DOM and CDN parsing, the app requires exactly zero backend node packages to execute!

1. Clone the repository: `git clone https://github.com/your-username/InvoiceS.git`
2. Open `dbms.html` in your favorite modern browser (Brave, Chrome, Firefox, Safari).
3. Connect your own Firebase Config inside `script.js` (Lines 1-10) to initialize cloud persistence.
4. Interact or enter Demo Mode!

## 👥 Project Team
*   **Arnav Gupta** (Register No: 24BCE1204)
*   **Ayushi Das** (Register No: 24BCE1438)

---
*Created as part of a comprehensive DBMS design initiative pushing the boundaries of client-side local caching, responsive styling overrides, and real-time database architecture synchronization without intermediary application frameworks.*
