import { z } from "zod";

/**
 * Given a PostgreSQL database URL and a database password, assemble a final URL
 * string using the separate password, if defined, as the `password` component
 * of the original URL, otherwise leaving the original URL unchanged (whether it
 * includes a password or not).
 */
export const getDatabaseUrlFromUrlAndPassword = (url: string, password?: string): string => {
  const parsedUrl = new URL(url);

  const databaseUrlSchema = z.object({
    protocol: z.enum(["postgres:", "postgresql:"]),
    username: z.string().min(1),
    // the parsed `host` property includes the port, if specified
    host: z.string().min(1),
    pathname: z.string().min(1),
    password: z.string().optional(),
  });

  const databaseUrl = databaseUrlSchema.parse({
    protocol: parsedUrl.protocol,
    username: parsedUrl.username,
    host: parsedUrl.host,
    pathname: parsedUrl.pathname,
    password: parsedUrl.password,
  });

  const finalPassword = password ?? databaseUrl.password;
  const passwordPart = finalPassword ? `:${encodeURIComponent(finalPassword)}` : "";

  const fullPostgresUrl = `${databaseUrl.protocol}//${databaseUrl.username}${passwordPart}@${databaseUrl.host}${databaseUrl.pathname}`;

  return fullPostgresUrl;
};
