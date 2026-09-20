import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useRef, useState } from "react";
import { downloadStandaloneHtml } from "../../components/exportStandaloneHtml";

const implications = [
  {
    number: "01",
    title: "투자의 중심이 ‘학습’에서 ‘추론’으로 이동",
    body: "기업의 AI 서비스가 실제 고객 접점으로 확장되면서 반복적인 추론을 효율적으로 처리하는 반도체와 데이터센터 수요가 커질 전망입니다.",
  },
  {
    number: "02",
    title: "전력 효율이 새로운 경쟁력이 될 것",
    body: "성능만큼 전력 소비와 냉각 비용이 중요한 구매 기준이 됩니다. 저전력 칩과 전력 관리 기술을 보유한 기업에 기회가 열립니다.",
  },
  {
    number: "03",
    title: "공급망 다변화 압력이 더 강해질 가능성",
    body: "첨단 패키징과 고대역폭 메모리의 병목이 이어지며 기업들은 단일 공급처 의존도를 낮추고 장기 공급 계약을 확대할 것으로 보입니다.",
  },
];

const chartData = [
  { year: "2024", value: 128, x: 54, y: 178 },
  { year: "2025", value: 176, x: 151, y: 149 },
  { year: "2026", value: 238, x: 248, y: 112 },
  { year: "2027", value: 311, x: 345, y: 69 },
  { year: "2028", value: 402, x: 442, y: 24 },
];

function MarketChart() {
  const points = chartData.map((item) => `${item.x},${item.y}`).join(" ");
  return (
    <div className="chart-wrap">
      <svg
        viewBox="0 0 500 245"
        role="img"
        aria-label="2024년부터 2028년까지 AI 반도체 시장 전망 차트"
      >
        <title>AI 반도체 시장 전망, 단위 십억 달러</title>
        {[24, 75, 126, 178].map((y) => (
          <line key={y} x1="54" y1={y} x2="458" y2={y} className="chart-grid" />
        ))}
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#314ee7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#314ee7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`54,202 ${points} 442,202`} fill="url(#area)" />
        <polyline points={points} className="chart-line" />
        {chartData.map((item, index) => (
          <g key={item.year}>
            <circle cx={item.x} cy={item.y} r="5" className="chart-dot" />
            <text
              x={item.x}
              y={item.y - 14}
              textAnchor="middle"
              className="chart-value"
            >
              {item.value}
            </text>
            <text x={item.x} y="226" textAnchor="middle" className="chart-year">
              {item.year}
              {index === 4 ? "E" : ""}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Page() {
  const exportTarget = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    if (!exportTarget.current || exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      await downloadStandaloneHtml({
        target: exportTarget.current,
        filename: "briefly.html",
        title: "Briefly · AI 반도체 시장 전망",
      });
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "HTML 내보내기에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <Box className="page-shell" ref={exportTarget}>
      <header className="topbar">
        <Container size="lg" className="topbar-inner">
          <Group gap="sm">
            <div className="brand-mark">B</div>
            <Text fw={800} size="lg" c="#111827">
              Briefly
            </Text>
          </Group>
          <Group gap="md">
            <Group gap="xs">
              <span className="live-dot" />
              <Text size="sm" fw={600} c="dimmed">
                오늘의 브리핑
              </Text>
            </Group>
            <Button
              component="a"
              href="/mixed"
              data-export-ignore
              size="xs"
              variant="subtle"
            >
              혼합 스타일 테스트
            </Button>
            <Button
              data-export-ignore
              loading={exporting}
              onClick={handleExport}
              size="xs"
              variant="light"
            >
              HTML 내보내기
            </Button>
          </Group>
        </Container>
      </header>

      <main>
        {exportError && (
          <Container size="lg" mt="md" data-export-ignore>
            <Alert color="red" title="HTML 내보내기 실패" role="alert">
              {exportError}
            </Alert>
          </Container>
        )}
        <Container size="lg" py={{ base: 36, sm: 64 }}>
          <article>
            <section className="article-hero">
              <Badge variant="light" color="indigo" size="lg" radius="sm">
                테크 · 산업
              </Badge>
              <Title order={1} className="article-title">
                AI 반도체 시장, 2028년까지
                <br className="desktop-break" /> 3배 이상 성장 전망
              </Title>
              <Text className="dek">
                생성형 AI 서비스의 확산이 데이터센터 투자를 끌어올리며, 고성능
                반도체 시장의 성장 속도가 예상보다 빨라지고 있습니다.
              </Text>
              <Group gap="sm" mt="xl" className="meta-row">
                <Text size="sm" fw={700}>
                  2025. 06. 18
                </Text>
                <span className="meta-divider" />
                <Text size="sm" c="dimmed">
                  Global Tech Review
                </Text>
                <span className="meta-divider" />
                <Text size="sm" c="dimmed">
                  읽는 시간 4분
                </Text>
              </Group>
            </section>

            <Grid
              gap={{ base: 28, md: 48 }}
              mt={{ base: 40, md: 64 }}
              align="stretch"
            >
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Paper
                  className="summary-card"
                  radius="lg"
                  p={{ base: "xl", sm: 32 }}
                >
                  <Text className="eyebrow">3줄 요약</Text>
                  <Stack gap="lg" mt="lg">
                    {[
                      "글로벌 AI 반도체 시장은 2024년 1,280억 달러에서 2028년 4,020억 달러 규모로 성장할 전망입니다.",
                      "추론용 칩과 고대역폭 메모리 수요가 성장을 주도하고, 데이터센터 전력 효율이 핵심 경쟁 요소로 떠오릅니다.",
                      "공급 병목과 지정학적 변수는 남아 있지만, 주요 기업의 설비 투자는 향후 2년간 계속 확대될 가능성이 큽니다.",
                    ].map((item, index) => (
                      <Group
                        key={item}
                        align="flex-start"
                        wrap="nowrap"
                        gap="md"
                      >
                        <ThemeIcon
                          variant="filled"
                          color="indigo"
                          radius="xl"
                          size={28}
                        >
                          {index + 1}
                        </ThemeIcon>
                        <Text className="summary-copy">{item}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Paper>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Paper
                  className="metric-card"
                  radius="lg"
                  p={{ base: "xl", sm: 32 }}
                >
                  <Text className="eyebrow muted">핵심 수치</Text>
                  <Text className="metric-number">$402B</Text>
                  <Text c="dimmed" mt={-4}>
                    2028년 예상 시장 규모
                  </Text>
                  <Divider my="xl" color="rgba(255,255,255,.14)" />
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="rgba(255,255,255,.7)">
                      연평균 성장률
                    </Text>
                    <Text fw={800} c="white">
                      33.1%
                    </Text>
                  </Group>
                  <Progress
                    value={78}
                    size="sm"
                    radius="xl"
                    color="cyan"
                    bg="rgba(255,255,255,.1)"
                  />
                </Paper>
              </Grid.Col>
            </Grid>

            <section className="content-section">
              <div className="section-label">
                <span>01</span>
                <Text>상세 내용</Text>
              </div>
              <div className="article-body">
                <Text>
                  시장의 성장축은 대규모 언어 모델을 만드는 ‘학습’에서 실제
                  서비스가 답변을 생성하는 ‘추론’으로 넓어지고 있습니다.
                  기업들이 챗봇, 검색, 업무 자동화에 AI를 적용하면서 하루에도
                  수억 건의 연산을 안정적으로 처리해야 하기 때문입니다.
                </Text>
                <Text>
                  이에 따라 GPU뿐 아니라 용도별 가속기, 고대역폭 메모리(HBM),
                  첨단 패키징 분야의 수요도 함께 증가하고 있습니다. 보고서는
                  관련 설비 투자가 2026년까지 두 자릿수 증가세를 이어갈 것으로
                  내다봤습니다.
                </Text>
                <blockquote>
                  “이제 시장의 질문은 더 큰 모델을 만들 수 있는지가 아니라,
                  얼마나 효율적으로 운영할 수 있는지로 바뀌고 있다.”
                </blockquote>
                <Text>
                  다만 빠른 성장에는 제약도 있습니다. 데이터센터의 전력 확보,
                  일부 핵심 부품의 생산 병목, 국가별 수출 규제는 공급 확대
                  속도를 늦출 수 있는 변수입니다. 단기 실적보다 공급 능력과 고객
                  다변화 수준을 함께 살펴볼 필요가 있습니다.
                </Text>
              </div>
            </section>

            <section className="content-section">
              <div className="section-label">
                <span>02</span>
                <Text>뉴스 시사점</Text>
              </div>
              <div className="implication-grid">
                {implications.map((item) => (
                  <Paper
                    key={item.number}
                    className="implication-card"
                    radius="lg"
                    p="xl"
                  >
                    <Text className="implication-number">{item.number}</Text>
                    <Title order={3}>{item.title}</Title>
                    <Text c="dimmed" mt="md" lh={1.75}>
                      {item.body}
                    </Text>
                  </Paper>
                ))}
              </div>
            </section>

            <section className="content-section">
              <div className="section-label">
                <span>03</span>
                <Text>시장 전망</Text>
              </div>
              <Paper
                className="chart-card"
                radius="lg"
                p={{ base: "lg", sm: 32 }}
              >
                <Group justify="space-between" align="flex-start" mb="lg">
                  <div>
                    <Title order={2}>글로벌 AI 반도체 시장 규모</Title>
                    <Text c="dimmed" size="sm" mt={6}>
                      단위: 십억 달러
                    </Text>
                  </div>
                  <Badge variant="outline" color="gray">
                    2028E
                  </Badge>
                </Group>
                <MarketChart />
                <Text size="xs" c="dimmed" mt="md">
                  자료: Global Tech Review, 2025 · E는 전망치
                </Text>
              </Paper>
            </section>
          </article>
        </Container>
      </main>
      <footer>
        <Container size="lg">
          <Group justify="space-between" py="xl">
            <Text fw={800}>Briefly</Text>
            <Text size="xs" c="dimmed">
              복잡한 뉴스를 선명하게
            </Text>
          </Group>
        </Container>
      </footer>
    </Box>
  );
}
