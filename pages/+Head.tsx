// https://vike.dev/Head

import { ColorSchemeScript } from "@mantine/core";
import logoUrl from "../assets/logo.svg";

export function Head() {
  return (
    <>
      <link rel="icon" href={logoUrl} />
      <ColorSchemeScript />
    </>
  );
}
