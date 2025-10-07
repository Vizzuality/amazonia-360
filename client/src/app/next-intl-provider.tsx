"use client";

import { PropsWithChildren } from "react";

import { AbstractIntlMessages, Locale, NextIntlClientProvider } from "next-intl";

type NextIntlProviderProps = PropsWithChildren & {
  messages: AbstractIntlMessages;
  locale: Locale;
};

const NextIntlProvider = ({ messages, locale, children }: NextIntlProviderProps) => {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
};

export default NextIntlProvider;
