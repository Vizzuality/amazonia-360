"use client";

import { useCallback, useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { Share2 } from "lucide-react";

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
        }, 1000);
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
          <span>Share</span>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <div className="flex flex-col space-y-2 mb-6">
          <h3 className="font-bold text-xl text-blue-500">Share</h3>

          <p className="text-base text-foreground font-medium">
            Copy and paste link to share
          </p>
        </div>
        <div className="flex w-full space-x-2 mb-6">
          <div className="bg-background flex h-10 rounded-sm border px-3 py-2 text-sm text-gray-900 w-[376px]">
            <p className="truncate text-foreground text-base font-normal">
              {currentUrl}
            </p>
          </div>
          <Button className="py-5 w-20" onClick={copyShareLink}>
            {shareLinkBtnText}
          </Button>
        </div>
        {/* <div className="flex space-x-2">
            <Button className="rounded-full h-10 w-10" variant="outline">
              <FacebookShareButton
                url={currentUrl}
                title={"Amazonia360 Report"}
                aria-label="share facebook"
              >
                <Facebook className="fill-blue-400 text-blue-400" size={16} />
              </FacebookShareButton>
            </Button>

            <Button className="rounded-full h-10 w-10" variant="outline">
              <TwitterShareButton
                url={currentUrl}
                title={"Amazonia360 Report"}
                aria-label="share twitter"
              >
                <Twitter className="fill-blue-400 text-blue-400" size={16} />
              </TwitterShareButton>
            </Button>

            <Button className="group rounded-full h-10 w-10" variant="outline">
              <EmailShareButton
                url={currentUrl}
                title={"Amazonia360 Report"}
                subject={"I want to share this Amazonia360 report with you"}
                body={""}
                aria-label="share email"
              >
                <Mail
                  className="fill-blue-400 text-white group-hover:text-blue-50"
                  size={20}
                />
              </EmailShareButton>
            </Button>

            <Button className="rounded-full h-10 w-10" variant="outline">
              <LinkedinShareButton
                url={currentUrl}
                title={"Amazonia360 Report"}
                summary={"Amazonia360 Report"}
                source={"Amazonia360"}
                aria-label="share linkedin"
              >
                <LinkedinIcon className="fill-blue-400 text-blue-400" size={16} />
              </LinkedinShareButton>
            </Button>
          </div> */}
      </DialogContent>
    </Dialog>
  );
}
