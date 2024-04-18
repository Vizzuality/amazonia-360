"use client";

import { useCallback, useEffect, useState } from "react";

import {
  EmailShareButton,
  FacebookShareButton,
  TwitterShareButton,
} from "react-share";

import { usePathname } from "next/navigation";

import { Facebook, Twitter, Mail, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function ShareReport() {
  const pathname = usePathname();

  const [currentUrl, setCurrentUrl] = useState<string>("");

  const [shareLinkBtnText, setShareLinkBtnText] = useState("Copy");
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, [pathname]);

  const copyShareLink = useCallback(() => {
    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        setShareLinkBtnText("Copied");
        setTimeout(function () {
          setShareLinkBtnText("Copy");
        }, 5000);
      })
      .catch((err: ErrorEvent) => {
        console.info(err.message);
      });
  }, [currentUrl]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="space-x-2">
          <Share2 className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        {" "}
        <h3 className="font-bold text-xl">Share</h3>
        <div className="flex flex-col space-y-2 px-6 pb-10 pt-4">
          <p className="text-base text-gray-500">
            Copy and paste link to share
          </p>
          <div className="flex w-full space-x-2">
            <div className="bg-background flex h-10 rounded-md border px-3 py-2 text-sm text-gray-900">
              <p className="w-[410px] truncate">{currentUrl}</p>
            </div>
            <Button className="w-20" onClick={copyShareLink}>
              {shareLinkBtnText}
            </Button>
          </div>
          <div className="flex space-x-4 pt-6">
            <Button className="rounded-full">
              <FacebookShareButton
                url={currentUrl}
                title={"Amazonia360 Report"}
                aria-label="share facebook"
              >
                <Facebook className="fill-white text-white" size={16} />
              </FacebookShareButton>
            </Button>

            <Button className="rounded-full">
              <TwitterShareButton
                url={currentUrl}
                title={"Amazonia360 Report"}
                aria-label="share twitter"
              >
                <Twitter className="fill-white text-white" size={16} />
              </TwitterShareButton>
            </Button>

            <Button className="rounded-full">
              <EmailShareButton
                url={currentUrl}
                title={"Amazonia360 Report"}
                // subject={"I want to share this Amazonia360 report with you"}
                body={""}
                aria-label="share email"
              >
                <Mail className="fill-white text-yellow-400" size={16} />
              </EmailShareButton>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
