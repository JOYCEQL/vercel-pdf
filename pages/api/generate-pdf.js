import chromium from 'chrome-aws-lambda';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  console.log('Starting PDF generation...');
  
  try {
    const browser = await chromium.puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    console.log('Browser launched successfully');

    const page = await browser.newPage();
    
    // Set content with proper encoding and font loading
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="zh">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');
            
            * {
              font-family: 'Noto Sans SC', sans-serif;
            }
            
            body {
              margin: 0;
              padding: 20px;
              font-size: 14px;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          ${req.body.content}
        </body>
      </html>
    `, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    console.log('Content and fonts loaded');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      preferCSSPageSize: true,
    });

    console.log('PDF generated successfully');
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
    res.send(pdf);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ 
      error: 'PDF generation failed',
      details: error.message,
      stack: error.stack 
    });
  }
}