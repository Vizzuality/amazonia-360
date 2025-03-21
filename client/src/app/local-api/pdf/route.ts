import puppeteer from "puppeteer";

async function getBrowser() {
  return await puppeteer.launch({
    args: [
      "--disable-web-security",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials",
      "--disable-features=BlockInsecurePrivateNetworkRequests",
    ],
    browser: "chrome",
    headless: true,
  });
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    const browser = await getBrowser();
    const page = await browser.newPage();

    // set Headers
    const Authorization = request.headers.get("Authorization");

    if (Authorization) {
      await page.setExtraHTTPHeaders({ Authorization });
    }

    await page.goto(url, { waitUntil: "networkidle0" });

    await sleep(1000); // Wait for page to load

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
    });
    await browser.close();

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="output.pdf"',
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(JSON.stringify({ error: "Failed to generate PDF" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
