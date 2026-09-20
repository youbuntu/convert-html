import { Button, Text } from "@mantine/core";
import { type RefObject, useState } from "react";
import { printStandaloneHtml } from "./printStandaloneHtml";

export function PdfExportButton({
  targetRef,
  title,
  size = "sm",
  color = "indigo",
}: {
  targetRef: RefObject<HTMLDivElement | null>;
  title: string;
  size?: "xs" | "sm";
  color?: string;
}) {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePrint() {
    if (!targetRef.current || printing) return;
    setPrinting(true);
    setError(null);
    try {
      await printStandaloneHtml({ target: targetRef.current, title });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "PDF 인쇄 문서를 준비하지 못했습니다.",
      );
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div data-export-ignore>
      <Button
        variant="outline"
        color={color}
        size={size}
        loading={printing}
        onClick={handlePrint}
      >
        PDF 내보내기
      </Button>
      {error && (
        <Text role="alert" size="xs" c="red" maw={280}>
          {error}
        </Text>
      )}
    </div>
  );
}
