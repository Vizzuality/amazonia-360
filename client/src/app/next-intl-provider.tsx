"use client";

import { PropsWithChildren } from "react";

import { AbstractIntlMessages, NextIntlClientProvider } from "next-intl";

type NextIntlProviderProps = PropsWithChildren & {
  messages: AbstractIntlMessages;
  locale: string;
};

const NextIntlProvider = ({ messages, locale, children }: NextIntlProviderProps) => {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
};

export default NextIntlProvider;
