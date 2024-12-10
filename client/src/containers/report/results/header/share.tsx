"use client";

import { useCallback, useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { DialogTitle } from "@radix-ui/react-dialog";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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
        <Button variant="outline">
          <Share2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle className="sr-only">Share Report</DialogTitle>
        <div className="mb-6 flex flex-col space-y-2">
          <h3 className="text-xl font-bold text-blue-500">Share</h3>

          <p className="text-base font-medium text-foreground">Copy and paste link to share</p>
        </div>
        <div className="mb-6 flex w-full space-x-2">
          <div className="flex h-10 w-[376px] rounded-sm border bg-background px-3 py-2 text-sm text-gray-900">
            <p className="truncate text-base font-normal text-foreground">{currentUrl}</p>
          </div>
          <Button className="w-20 py-5" onClick={copyShareLink}>
            {shareLinkBtnText}
          </Button>
        </div>
        {/* <div className="flex space-x-2">
            <Button className="rounded-full h-10 w-10" variant="outline">
              <FacebookShareButton
                url={currentUrl}
                title={"AmazoniaForever360+ Report"}
                aria-label="share facebook"
              >
                <Facebook className="fill-blue-400 text-blue-400" size={16} />
              </FacebookShareButton>
            </Button>

            <Button className="rounded-full h-10 w-10" variant="outline">
              <TwitterShareButton
                url={currentUrl}
                title={"AmazoniaForever360+ Report"}
                aria-label="share twitter"
              >
                <Twitter className="fill-blue-400 text-blue-400" size={16} />
              </TwitterShareButton>
            </Button>

            <Button className="group rounded-full h-10 w-10" variant="outline">
              <EmailShareButton
                url={currentUrl}
                title={"AmazoniaForever360+ Report"}
                subject={"I want to share this AmazoniaForever360+ report with you"}
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
                title={"AmazoniaForever360+ Report"}
                summary={"AmazoniaForever360+ Report"}
                source={"AmazoniaForever360+"}
                aria-label="share linkedin"
              >
                <LinkedinIcon className="fill-blue-400 text-blue-400" size={16} />
              </LinkedinShareButton>
            </Button>
          </div> */}
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
