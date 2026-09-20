import type { Config } from "vike/types";
import vikeReact from "vike-react/config";

// Default config (can be overridden by pages)
// https://vike.dev/config

const config: Config = {
  // https://vike.dev/head-tags
  title: "Briefly | 오늘의 뉴스 브리핑",
  description: "핵심만 선명하게 정리한 뉴스 요약과 시사점",

  extends: [vikeReact],

  // https://vike.dev/server
  server: true,
};

export default config;
