import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const THEME_COOKIE = "THEME-G1N-X1Z";
export const SITE_SETTINGS_COOKIE = "SITE-G1N-X2F";

export interface SiteSettings {
  hideCli: boolean;
  pauseGradient: boolean;
}

const defaultSiteSettings: SiteSettings = {
  hideCli: false,
  pauseGradient: false,
};

export type CookieSerializer<T> = (value: T) => string;
export type CookieDeserializer<T, U extends string = string> = (value: U) => T;
export const cookieSerializer = <T>(value: T) =>
  Buffer.from(JSON.stringify(value)).toString("base64");
export const cookieDeserializer = <T>(value: string) =>
  JSON.parse(Buffer.from(value, "base64").toString("utf-8")) as T;

const setCookieObject = <T = any>(
  store: ReadonlyRequestCookies,
  cookie: string,
  value?: T,
  serializer?: CookieSerializer<T>,
  options?: ResponseCookie
) => {
  if (!value) return store.delete(cookie).getAll().join("\n");

  const defaultSerializer: CookieSerializer<T> = cookieSerializer;
  const toSerialized = serializer ?? defaultSerializer;

  const responseCookies = store.set(cookie, toSerialized(value), options);
  return responseCookies.getAll().join("\n");
};

const getCookieObject = <T = any>(
  store: ReadonlyRequestCookies,
  cookie: string,
  deserializer?: CookieDeserializer<T>
): T | undefined => {
  const rawValue = store.get(cookie)?.value;
  if (!rawValue) return undefined;

  const defaultDeserializer: CookieDeserializer<T> = cookieDeserializer;
  const toDeserialized = deserializer ?? defaultDeserializer;

  return toDeserialized(rawValue);
};

const buildCookieRepo = <T = any>(
  cookieStore: ReadonlyRequestCookies,
  cookie: string,
  transformer: {
    serialize?: CookieSerializer<T>;
    deserialize?: CookieDeserializer<T>;
  } = {},
  cookieOptions?: ResponseCookie
) => {
  return {
    get() {
      return getCookieObject<T>(cookieStore, cookie, transformer.deserialize);
    },
    set(value?: T) {
      return setCookieObject<T>(
        cookieStore,
        cookie,
        value,
        transformer.serialize,
        cookieOptions
      );
    },
  };
};

export const cookie = (cookies: () => ReadonlyRequestCookies) => {
  const cookieStore = cookies();

  return {
    theme: buildCookieRepo<Theme>(cookieStore, THEME_COOKIE, {
      serialize: (value: Theme) => value,
      deserialize: (value: string) => value as Theme,
    }),
    site: buildCookieRepo(cookieStore, SITE_SETTINGS_COOKIE),
  };
};

export type CookieRepo = ReturnType<typeof cookie>;
