import Axios, { AxiosError, AxiosRequestConfig } from "axios";
import qs from "query-string";

export const AXIOS_INSTANCE = Axios.create({
  baseURL: "/custom-api",
});

export const API = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source();

  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    headers: {
      ...config.headers,
      ...options?.headers,
    },
    cancelToken: source.token,
    paramsSerializer: (params) => {
      return qs.stringify(params);
    },
  }).then((response) => response.data);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

// In some case with react-query and swr you want to be able to override the return error type so you can also do it here like this
export type ErrorType<Error> = AxiosError<Error>;

export default API;
