import chromium from "@sparticuz/chromium-min";
import puppeteer, { Browser } from "puppeteer";
import puppeteerCore, { Browser as CoreBrowser } from "puppeteer-core";

import { env } from "@/env.mjs";

export const dynamic = "force-dynamic";

const remoteExecutablePath =
  "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar";
let browser: Browser | CoreBrowser;

async function getBrowser() {
  if (browser) return browser;

  if (!!process.env.NEXT_PUBLIC_VERCEL_ENV) {
    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(remoteExecutablePath),
      headless: chromium.headless,
      timeout: 120000,
    });

    return browser;
  }

  if (process.env.NODE_ENV === "production") {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: "/usr/bin/chromium-browser",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=IsolateOrigins",
        "--disable-site-isolation-trials",
        "--disable-features=BlockInsecurePrivateNetworkRequests",
      ],
      timeout: 120000,
    });

    return browser;
  }

  browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials",
      "--disable-features=BlockInsecurePrivateNetworkRequests",
    ],
    browser: "chrome",
    headless: true,
    timeout: 120000,
  });

  return browser;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.authenticate({
      username: env.BASIC_AUTH_USER,
      password: env.BASIC_AUTH_PASSWORD,
    });

    await page.goto(url, { waitUntil: "networkidle0", timeout: 0 });

    await sleep(1000); // Wait for page to load

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
    });
    await page.close();

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
