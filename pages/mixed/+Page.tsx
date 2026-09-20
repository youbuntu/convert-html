import { Alert, Badge, Button, Progress, Table } from "@mantine/core";
import { useRef, useState } from "react";
import { downloadStandaloneHtml } from "../../components/exportStandaloneHtml";

const metrics = [
  {
    label: "월간 활성 사용자",
    value: "24,860",
    unit: "명",
    change: "+18.6%",
    description: "지난달 대비 3,898명 증가",
  },
  {
    label: "신규 프로젝트",
    value: "148",
    unit: "개",
    change: "+12.1%",
    description: "팀의 아이디어가 실행으로",
  },
  {
    label: "목표 달성률",
    value: "86",
    unit: "%",
    change: "+7.0%p",
    description: "분기 목표에 한 걸음 더",
  },
];

const channels = [
  { name: "직접 방문", users: "10,442", share: 42, color: "teal" },
  { name: "검색", users: "7,458", share: 30, color: "indigo" },
  { name: "추천 및 소셜", users: "4,972", share: 20, color: "cyan" },
  { name: "기타", users: "1,988", share: 8, color: "gray" },
];

const projects = [
  {
    name: "온보딩 경험 개선",
    team: "제품 디자인",
    owner: "김지윤",
    progress: 92,
    status: "검토 중",
    color: "indigo",
  },
  {
    name: "리포트 자동화",
    team: "플랫폼",
    owner: "이도현",
    progress: 68,
    status: "진행 중",
    color: "teal",
  },
  {
    name: "고객 인터뷰",
    team: "리서치",
    owner: "박서연",
    progress: 100,
    status: "완료",
    color: "gray",
  },
];

export default function Page() {
  const exportTarget = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (!exportTarget.current || exporting) return;
    setExporting(true);
    setError(null);
    try {
      await downloadStandaloneHtml({
        target: exportTarget.current,
        filename: "mixed-report.html",
        title: "월간 워크스페이스 리포트",
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "HTML 내보내기에 실패했습니다.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      ref={exportTarget}
      data-testid="mixed-page"
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <a
            href="/"
            className="flex items-center gap-3 text-slate-900 no-underline"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-800 text-lg font-bold text-white">
              B
            </span>
            <span className="text-lg font-bold tracking-tight">
              Briefly{" "}
              <span className="font-normal text-slate-400">/ workspace</span>
            </span>
          </a>
          <nav
            aria-label="페이지 이동"
            data-export-ignore
            className="flex items-center gap-4"
          >
            <a
              href="/"
              className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-emerald-800 hover:underline"
            >
              뉴스 브리핑
            </a>
            <Button
              color="teal"
              radius="md"
              loading={exporting}
              onClick={handleExport}
            >
              HTML 내보내기
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
        {error && (
          <div data-export-ignore className="mb-6">
            <Alert color="red" title="HTML 내보내기 실패" role="alert">
              {error}
            </Alert>
          </div>
        )}

        <section
          aria-labelledby="report-title"
          className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
        >
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold tracking-[0.18em] text-emerald-800">
                WORKSPACE REPORT
              </span>
              <Badge color="teal" variant="light" radius="sm">
                2026년 9월
              </Badge>
            </div>
            <h1
              id="report-title"
              className="text-3xl leading-tight font-bold tracking-tight sm:text-5xl"
            >
              함께 만든 성장의 기록
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 break-keep text-slate-500">
              숫자로 살펴보는 이번 달의 변화와 팀의 다음 걸음.
              <br className="hidden sm:block" /> 중요한 성과를 한 페이지에
              모았습니다.
            </p>
          </div>
          <div className="text-sm leading-6 text-slate-500 sm:text-right">
            <p className="font-semibold text-slate-700">09.01 — 09.30</p>
            <p>내보내기 테스트용 예시 데이터</p>
          </div>
        </section>

        <section
          aria-label="핵심 지표"
          data-testid="metric-grid"
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-slate-500">
                  {metric.label}
                </h2>
                <Badge color="teal" variant="light" size="sm">
                  {metric.change}
                </Badge>
              </div>
              <p className="mt-6 text-4xl font-bold tracking-tight tabular-nums">
                {metric.value}
                <span className="ml-2 text-base font-medium text-slate-400">
                  {metric.unit}
                </span>
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {metric.description}
              </p>
            </article>
          ))}
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section
            aria-labelledby="trend-title"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="trend-title" className="text-lg font-bold">
                  꾸준히 넓어지는 연결
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  최근 6개월 활성 사용자 · 단위: 천 명
                </p>
              </div>
              <Badge variant="dot" color="teal">
                활성 사용자
              </Badge>
            </div>
            <svg
              viewBox="0 0 560 260"
              role="img"
              aria-labelledby="trend-chart-title"
              className="mt-8 block h-auto w-full"
              data-testid="trend-chart"
            >
              <title id="trend-chart-title">
                4월 12.4천 명에서 9월 24.9천 명으로 증가한 활성 사용자
              </title>
              <defs>
                <linearGradient
                  id="mixed-chart-area"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[40, 95, 150, 205].map((y) => (
                <line
                  key={y}
                  x1="40"
                  x2="530"
                  y1={y}
                  y2={y}
                  className="stroke-slate-100"
                  strokeDasharray="4 5"
                />
              ))}
              <path
                d="M40 184 L138 166 L236 130 L334 114 L432 73 L530 36 L530 205 L40 205 Z"
                fill="url(#mixed-chart-area)"
              />
              <path
                d="M40 184 L138 166 L236 130 L334 114 L432 73 L530 36"
                fill="none"
                className="stroke-emerald-600"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {[
                { x: 40, y: 184, month: "4월" },
                { x: 138, y: 166, month: "5월" },
                { x: 236, y: 130, month: "6월" },
                { x: 334, y: 114, month: "7월" },
                { x: 432, y: 73, month: "8월" },
                { x: 530, y: 36, month: "9월" },
              ].map((point) => (
                <g key={point.month}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    className="fill-white stroke-emerald-600"
                    strokeWidth="3"
                  />
                  <text
                    x={point.x}
                    y="238"
                    textAnchor="middle"
                    className="fill-slate-400 text-xs"
                  >
                    {point.month}
                  </text>
                </g>
              ))}
            </svg>
            <div className="mt-3 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              <span aria-hidden="true" className="font-bold">
                ↗
              </span>
              <p>
                6개월 전보다 약 <strong>2배</strong> 많은 사람들이
                워크스페이스를 사용하고 있습니다.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="channel-title"
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-2"
          >
            <h2 id="channel-title" className="text-lg font-bold">
              우리를 찾아오는 경로
            </h2>
            <p className="mt-1 text-sm text-slate-500">채널별 유입 비중</p>
            <div className="mt-8 space-y-6">
              {channels.map((channel) => (
                <div key={channel.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{channel.name}</span>
                    <span className="font-bold tabular-nums">
                      {channel.share}%
                    </span>
                  </div>
                  <Progress
                    value={channel.share}
                    color={channel.color}
                    size="sm"
                    radius="xl"
                    aria-label={`${channel.name} 비중`}
                  />
                  <p className="mt-2 text-xs tabular-nums text-slate-400">
                    {channel.users}명
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section
          aria-labelledby="projects-title"
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="projects-title" className="text-lg font-bold">
                팀이 움직이는 방향
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                이번 달 주요 프로젝트 현황
              </p>
            </div>
            <Badge variant="outline" color="gray">
              프로젝트 3개
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table
              horizontalSpacing="md"
              verticalSpacing="lg"
              highlightOnHover
              className="min-w-[640px]"
            >
              <Table.Caption>2026년 9월 프로젝트 진행 현황</Table.Caption>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>프로젝트</Table.Th>
                  <Table.Th>담당자</Table.Th>
                  <Table.Th>진행률</Table.Th>
                  <Table.Th>상태</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {projects.map((project) => (
                  <Table.Tr key={project.name}>
                    <Table.Td>
                      <p className="font-semibold text-slate-800">
                        {project.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {project.team}
                      </p>
                    </Table.Td>
                    <Table.Td>
                      <span className="text-sm text-slate-600">
                        {project.owner}
                      </span>
                    </Table.Td>
                    <Table.Td>
                      <div className="flex min-w-36 items-center gap-3">
                        <div className="flex-1">
                          <Progress
                            value={project.progress}
                            color={project.color}
                            size="sm"
                            aria-label={`${project.name} 진행률`}
                          />
                        </div>
                        <span className="w-10 text-right text-xs tabular-nums text-slate-500">
                          {project.progress}%
                        </span>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={project.color} variant="light">
                        {project.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </section>

        <section
          aria-labelledby="next-title"
          className="mt-6 grid gap-6 rounded-2xl bg-emerald-900 p-8 text-white sm:grid-cols-[1fr_2fr] sm:p-10"
        >
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-emerald-300">
              WHAT'S NEXT
            </p>
            <h2 id="next-title" className="mt-3 text-2xl font-bold">
              다음 달의 한 걸음
            </h2>
          </div>
          <div>
            <p className="text-lg leading-8 break-keep text-emerald-50">
              더 쉽고, 더 자연스럽게.
              <br />
              처음 만나는 순간부터 좋은 경험을 만듭니다.
            </p>
            <p className="mt-4 text-sm leading-7 text-emerald-200">
              온보딩 개선안을 적용하고, 고객 인터뷰에서 발견한 불편함을 제품에
              반영합니다. 작은 변화가 쌓여 더 큰 성장을 만듭니다.
            </p>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400">
          <span className="font-bold text-slate-600">Briefly Workspace</span>
          <span>월간 리포트 · 2026.09 · 예시 데이터</span>
        </div>
      </main>
    </div>
  );
}
