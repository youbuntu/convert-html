// https://vike.dev/Head

import { ColorSchemeScript } from "@mantine/core";
import logoUrl from "../assets/favicon.svg";

export function Head() {
  return (
    <>
      <link rel="icon" href={logoUrl} />
      <ColorSchemeScript />
    </>
  );
}
