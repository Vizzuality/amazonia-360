import { NextResponse } from "next/server";

import puppeteer from "puppeteer";

export async function GET(request: Request) {
  console.log("REQUEST ----->", request);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    Authorization: request.headers.get("Authorization") || "",
  });

  await page.goto("http://localhost:3000/report/results");

  await page.emulateMediaType("screen");

  const pdfBuffer = await page.pdf({ format: "A4" });

  const response = new NextResponse(pdfBuffer);
  response.headers.set("content-type", "application/pdf");
  await browser.close();
  return response;
}
