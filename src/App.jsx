import { useState, useEffect, useReducer, useCallback, useRef } from "react";
import {
  CheckCircle, Circle, FileText, ChevronRight, ChevronDown, Plus, Trash2,
  AlertCircle, Zap, Lightbulb, ArrowRight, Download, Upload, MapPin,
  RotateCcw, Copy, Loader, ChevronUp, Star, Play, Check, X, Home,
  PenTool, Brain, RefreshCw, Sliders, BookOpen, Target, Eye, Award,
  HelpCircle, ArrowUpRight, Edit3, ClipboardList, FileDown,
} from "lucide-react";
// docx & file-saver: 동적 import (번들 분리 + Vercel 호환)

/* ══════════════════════════════════════════════════════════════════
   2026 수업혁신사례연구대회 · 코칭 시스템 v5
   "추적기가 아닌, 1등을 만드는 코치"

   핵심 설계 원칙:
   1. 보고서를 앱 안에서 직접 작성 (섹션별 에디터)
   2. 모든 입력에 심사기준 기반 실시간 코칭
   3. 자가평가 → AI평가 → 개선 루프
   4. 첫 사용자도 5분 안에 시작 가능한 온보딩
   5. API 없이도 100% 기능 동작
   ══════════════════════════════════════════════════════════════════ */

// ─── 지역 ───
const REGIONS = {
  busan:   { label:"부산광역시", short:"부산", color:"#0ea5e9", policy:"AI시대를 선도하는 인간중심 미래교육 · BeAT(AI튜터) · 프로젝트B30 · 미래형학교(IB)" },
  ulsan:   { label:"울산광역시", short:"울산", color:"#10b981", policy:"한 명의 아이도 포기하지 않는 울산교육 · 맞춤형 수업 혁신" },
  seoul:   { label:"서울특별시", short:"서울", color:"#6366f1", policy:"함께 성장하는 서울교육 · 기초학력 보장 · 디지털 리터러시" },
  gyeonggi:{ label:"경기도",    short:"경기", color:"#f59e0b", policy:"미래교육 · 학생 맞춤 교육과정 · AI 디지털 교과서" },
  other:   { label:"기타 시도", short:"기타", color:"#64748b", policy:"해당 시도교육청 주요업무계획 참조" },
};

// ─── 일정 ───
const NATIONAL_DEADLINE = new Date("2026-09-22T18:00:00");
const SIDO_DEADLINE     = new Date("2026-07-31T18:00:00");

// ─── 심사기준 (공식 운영계획 붙임1 · 정확 반영) ───
const REPORT_RUBRIC = [
  { id:"r1", group:"교육과정의 방향 및 수업 혁신 노력 반영", gMax:50, sub:"교육과정 방향 반영", max:20,
    questions:["수업 설계·실천이 교육과정 인간상·핵심역량 방향과 일치하는가?","성취기준·핵심 개념 기반 깊이 있는 학습이 이루어지도록 수업을 구성하였는가?","학생의 삶과 연계된 학습 경험을 고려하여 수업을 구성하였는가?"],
    tip:"2022 개정 교육과정 총론의 인간상(자기주도적인 사람, 창의적인 사람, 교양있는 사람, 더불어 사는 사람)과 핵심역량을 보고서 첫 문장부터 명시하세요. 성취기준 코드를 직접 인용하면 강력합니다.",
    winnerPattern:"1등급 보고서는 '교육과정 → 성취기준 → 수업설계'의 연쇄를 첫 2쪽 안에 명확히 보여줍니다. 추상적 당위가 아닌 구체적 문서 근거를 제시합니다." },
  { id:"r2", group:"교육과정의 방향 및 수업 혁신 노력 반영", gMax:50, sub:"학생 참여 중심 수업", max:20,
    questions:["학생의 질문 활성화, 토의·토론·프로젝트·탐구 등 능동적 참여를 유도하는 수업인가?","학생의 사고 과정과 상호작용, 협력이 수업 전반에 드러나며 학습 주체가 학생으로 전환되었는가?"],
    tip:"'교사가 무엇을 했는가'가 아니라 '학생이 무엇을 했는가' 중심으로 서술하세요. 학생 발화 비율, 질문 횟수 등 정량 지표가 있으면 결정적입니다.",
    winnerPattern:"우수작은 수업 장면을 에피소드로 묘사합니다: 'A학생이 ~라고 질문하자, 모둠원들이 ~를 탐구하기 시작했다.' 교사 관점이 아닌 학생 관점 서술." },
  { id:"r3", group:"교육과정의 방향 및 수업 혁신 노력 반영", gMax:50, sub:"교육환경 변화 및 수업 혁신 노력", max:10,
    questions:["AI 도구·학습지원 SW 등 교육환경 변화를 반영한 수업 혁신 노력이 드러나는가?","교수·학습과 평가의 연계를 통해 학습의 질을 개선하려는 노력이 반영되었는가?"],
    tip:"AI 도구를 '사용했다'가 아니라 '왜 이 도구가 이 학습 목표에 적합한지' 교육적 근거를 제시하세요. 2026년 신설된 AI 윤리(개인정보·연령·API출처) 요건도 반드시 명시.",
    winnerPattern:"단순 도구 소개가 아닌 '도구 → 학습 과정 변화 → 성취도 향상'의 인과관계를 보여줍니다." },
  { id:"r4", group:"현장 적합성 및 연구 방법 적절성", gMax:20, sub:"현장 적합성", max:10,
    questions:["학생 특성·학교 여건을 고려한 실제 적용 가능한 수업 설계인가?","자기주도적 학습이 실제 수업에서 실현 가능한 구조인가?","일반 교사가 무리 없이 적용할 수 있는 현실적 모델인가?"],
    tip:"'이상적 수업'이 아닌 '현실적 수업' 모델이어야 합니다. 학급 인원수, 시수 제약, 기자재 현황 등 현실 조건을 명시하면 현장 적합성 점수가 올라갑니다.",
    winnerPattern:"'36명 학급에서 40분 내에 실행 가능한 구조'처럼 구체적 조건을 명시합니다." },
  { id:"r5", group:"현장 적합성 및 연구 방법 적절성", gMax:20, sub:"연구 방법 적절성", max:10,
    questions:["연구 과제 해결에 적합한 연구 방법을 활용하였는가?","다양한 사례·연구 방법을 검토하였는가?","연구수업 결과 분석·근거 제시가 충실하였는가?"],
    tip:"사전-사후 비교만으로는 부족합니다. 정량(t-검정/빈도분석) + 정성(면담/관찰) 혼합 방법이 필수. 통계적 유의성까지 제시하면 최고점.",
    winnerPattern:"연구문제 3개 → 각각에 대응하는 검증 방법 → 결과 → 해석의 4단계 구조." },
  { id:"r6", group:"내용과 실천의 정합성", gMax:15, sub:"실천의 충실성", max:10,
    questions:["보고서 내용이 실제 수업 실천으로 일관되게 구현되었는가?","수업 설계-실행-평가가 유기적으로 연결되었는가?","형식적 제시가 아닌 실제 수업 변화로 이어졌는가?"],
    tip:"보고서에 쓴 전략이 동영상에도 그대로 보여야 합니다. 보고서 ↔ 동영상 불일치는 가장 흔한 감점 원인.",
    winnerPattern:"'보고서 3장의 전략 A를 적용한 장면이 동영상 12분 30초에 등장'처럼 교차 참조를 명시합니다." },
  { id:"r7", group:"내용과 실천의 정합성", gMax:15, sub:"성찰 및 환류", max:5,
    questions:["실천 과정에 대한 성찰과 환류를 통해 연구 내용을 보완하며 수행하였는가?"],
    tip:"'반성'이 아니라 '변경 이력'을 보여주세요: '1차 적용 → 문제 발견 → 수정 → 2차 적용'의 순환 구조.",
    winnerPattern:"최소 2회 이상의 수정-재적용 사이클을 구체적 날짜와 함께 제시합니다." },
  { id:"r8", group:"현장 교육 기여도", gMax:15, sub:"확산 가능성", max:10,
    questions:["다른 학급·학년·교과에도 적용 가능하도록 구조화되어 있는가?","수업 절차·자료·운영 방식이 명확히 제시되었는가?","함께학교 '수업의 숲' 서비스 등을 통해 수업 나눔 노력을 지속적으로 하였는가?"],
    tip:"확산 10점은 '쓸 수 있는 모델 제공'입니다. 수업 절차를 표 1장으로 정리하고, 함께학교(togetherschool.go.kr) '수업의 숲'에 공유한 이력을 명시하세요.",
    winnerPattern:"'수업 모델 카드' 1장 + 전문적학습공동체 나눔 기록 + 수업의 숲 업로드 캡처." },
  { id:"r9", group:"현장 교육 기여도", gMax:15, sub:"기여도", max:5,
    questions:["학생의 학습 성장과 학교 수업 문화 개선에 기여할 수 있던 사례인가?"],
    tip:"개인 수업 사례를 넘어 '학교 수업 문화 변화'까지 연결하세요. 동료 교사 반응, 학교 차원 적용 계획 등.",
    winnerPattern:"'본 수업 모델을 적용한 동학년 3학급에서도 유사한 변화가 관찰되었다'는 확장 근거." },
];

const VIDEO_RUBRIC = [
  { id:"v1", group:"학생 참여의 실제성", gMax:40, sub:"학생 활동", max:20,
    questions:["학생이 수업 중 지속적으로 학습 활동에 참여하는가?","단순 참여가 아닌 말하고·생각하고·선택하는 주체로 등장하는가?","자기주도적 활동이 다수 학생에게 나타나는가?"],
    tip:"카메라는 학생을 비추세요. 교사가 설명하는 장면이 길면 감점. 학생 발화, 모둠 토론, 자료 탐색 장면이 70% 이상이어야 합니다." },
  { id:"v2", group:"학생 참여의 실제성", gMax:40, sub:"학습 상호작용", max:20,
    questions:["학생-학생, 학생-교사 간 유의미한 상호작용이 실제 관찰되는가?","단순 발문-응답을 넘어 사고 확장 의사소통이 이루어지는가?"],
    tip:"'네/아니오' 응답이 아닌 학생 간 대화가 들려야 합니다. 마이크 배치를 학생 모둠 쪽에 놓으세요." },
  { id:"v3", group:"수업 운영의 적절성", gMax:30, sub:"수업 운영", max:20,
    questions:["학습이 끊기지 않고 하나의 흐름으로 자연스럽게 진행되는가?","성취기준 근거 교수·학습과 평가가 일관성 있게 이루어지는가?"],
    tip:"편집 없는 원본 영상이므로 수업 흐름이 자연스러워야 합니다. 전환이 매끄럽지 않으면 연습하세요." },
  { id:"v4", group:"수업 운영의 적절성", gMax:30, sub:"교사의 개입", max:10,
    questions:["교사 설명·개입이 학습 촉진 방향인가?","학생 사고를 대신하지 않고 질문·피드백으로 지원하는가?"],
    tip:"교사는 '퍼실리테이터'로. 직접 답을 주지 말고 질문으로 유도하는 장면을 보여주세요." },
  { id:"v5", group:"과정 중심 평가의 적합성", gMax:20, sub:"관찰 및 환류", max:20,
    questions:["수업 중 학생 이해·사고를 확인하는 장면이 존재하는가?","교사 질문·관찰·피드백이 학습 방향 조정에 사용되는가?","평가가 학습을 돕는 기능으로 작동하는가?"],
    tip:"수업 중간에 학생 활동을 확인하고 피드백하는 장면이 핵심. 형성평가 장면을 의도적으로 설계하세요." },
  { id:"v6", group:"수업 재현 가능성", gMax:10, sub:"수업 현실성", max:10,
    questions:["연출된 공개수업이 아닌 일상 수업으로 자연스럽게 진행되는가?","특정 교사 역량이 아닌 일반 수업으로 재현 가능한가?"],
    tip:"'너무 완벽한' 수업은 오히려 감점. 자연스러운 돌발 상황 대처가 더 높은 점수를 받습니다." },
];

const PENALTY_ITEMS = [
  { item:"분량 25쪽 기준 1~2쪽 미만 초과", p:0.5 },
  { item:"분량 2~3쪽 미만 초과", p:1 },
  { item:"분량 3~4쪽 미만 초과", p:1.5 },
  { item:"분량 4쪽 이상 초과", p:2 },
  { item:"[보고서] 제본·인쇄·표지 규정 미준수 (건당)", p:0.5 },
  { item:"[동영상] 자막 외 별도 영상 삽입 등 (건당)", p:1 },
  { item:"[공통] 연구자·학생 정보 노출 (건당)", p:1 },
  { item:"공동연구 시 필요성·목적 미포함", p:2 },
];

// ─── 보고서 섹션 (에디터용) ───
const SECTIONS = [
  { id:"s1", num:"Ⅰ", title:"연구의 필요성 및 목적", pages:"2~3쪽",
    guide:"이 섹션에서 심사위원이 확인하는 것: ①교육과정 근거가 있는가 ②현장의 실제 문제에서 출발했는가 ③연구 목적이 명확한가",
    checklist:["2022 개정 교육과정 인간상·핵심역량 명시","성취기준 코드 직접 인용","우리 학교/학급의 실제 문제 제시","연구 문제 3개 이내 명확 진술","지역 교육과정(시도 정책) 연계 근거"],
    template:"1. 연구의 필요성\n  가. 교육과정적 근거 (2022 개정 교육과정에서는...)\n  나. 현장 문제 인식 (본교 N학년 학생들의 현황...)\n  다. 선행 연구 시사점\n\n2. 연구의 목적\n  가. 연구 목적\n  나. 연구 문제\n    1) 연구문제 1: (인지적 영역)\n    2) 연구문제 2: (정의적 영역)\n    3) 연구문제 3: (실천적 영역)" },
  { id:"s2", num:"Ⅱ", title:"이론적 배경", pages:"3~4쪽",
    guide:"핵심 이론 2~3개를 수업 실천과 연결하세요. 이론 '나열'이 아닌 이론 '활용 근거'",
    checklist:["핵심 이론 2~3개 선정 (수업 전략과 직결)","선행 연구 동향 (최근 5년)","2022 개정 교육과정 연계","이론 → 수업설계 연결고리 명시"],
    template:"1. 이론적 배경\n  가. [핵심이론1] (예: 학생참여중심수업)\n  나. [핵심이론2] (예: 과정중심평가)\n  다. [핵심이론3] (예: AI활용교육)\n\n2. 선행 연구 분석\n  가. 국내 연구 동향\n  나. 시사점 도출" },
  { id:"s3", num:"Ⅲ", title:"수업 설계 및 적용", pages:"8~10쪽 (핵심)",
    guide:"가장 큰 비중. 심사위원이 가장 오래 읽는 부분. 교사 활동이 아닌 '학생이 무엇을 했는가' 중심으로.",
    checklist:["교수학습 과정안 (2회분 이상)","학생 참여 활동 구체적 묘사","AI·SW 활용 시 교육적 근거 + 윤리 고려","주차별 수업 실행 기록","QR코드 미삽입 (심사 제외됨)","학생 활동 사진/산출물 설명"],
    template:"1. 수업 설계\n  가. 수업 모형 및 전략\n  나. 교수학습 과정안\n    [과정안 1: 단원명 / 차시 / 성취기준]\n    [과정안 2: ...]\n\n2. 수업 적용\n  가. 1차 적용 (N월 N일~)\n    - 수업 장면 기록\n    - 학생 반응 및 변화\n  나. 2차 적용 (수정 후)\n  다. AI/SW 활용 내역 및 윤리적 고려" },
  { id:"s4", num:"Ⅳ", title:"학생의 변화 및 결과 분석", pages:"5~6쪽",
    guide:"데이터가 핵심. 사전-사후 비교 + 에피소드. 정량과 정성 모두 필요.",
    checklist:["사전-사후 정량 비교 (표·그래프)","통계 검정 (t-검정 등)","질적 관찰 기록 (초점학생 에피소드)","인지·정의 영역 모두 분석","연구문제별 결과 정리"],
    template:"1. 정량적 분석\n  가. 사전-사후 검사 결과\n    [표: 영역별 평균 비교]\n    [t-검정 결과: t=__, p=__]\n  나. 수업 참여 지표 변화\n\n2. 정성적 분석\n  가. 초점학생 변화 에피소드\n    - A학생: ...\n    - B학생: ...\n  나. 학생 면담/설문 주요 응답\n\n3. 연구문제별 종합" },
  { id:"s5", num:"Ⅴ", title:"환류 및 수업 개선", pages:"2~3쪽",
    guide:"'반성'이 아니라 '수정→재적용 이력'. 최소 2회 순환을 보여주세요.",
    checklist:["수업→분석→개선→재적용 순환 구조","구체적 수정 내용과 이유","교사 성찰 기록","2회 이상 순환 사이클"],
    template:"1. 환류 과정\n  가. 1차 적용 후 분석\n    - 발견된 문제점\n    - 수정 방향\n  나. 2차 적용 및 결과\n    - 수정 효과 확인\n\n2. 교사 성찰\n  가. 수업관에 대한 변화\n  나. 후속 실천 계획" },
  { id:"s6", num:"Ⅵ", title:"결론 및 일반화·확산", pages:"2~3쪽",
    guide:"확산 10점은 큰 배점. '수업의 숲' 공유, 동학년 적용, 모델 카드 제공.",
    checklist:["연구문제별 결론","다른 학교 적용 가능 모델 구조화","함께학교 '수업의 숲' 공유 기록","전문적학습공동체 나눔 기록","제한점·후속 연구"],
    template:"1. 결론\n  가. 연구문제 1 결론\n  나. 연구문제 2 결론\n  다. 연구문제 3 결론\n\n2. 일반화 및 확산\n  가. 수업 모델 카드 (1장 요약)\n  나. 함께학교 '수업의 숲' 공유\n  다. 전문적학습공동체 나눔\n\n3. 제한점 및 후속 연구" },
];

// ─── 스타일 ───
const C = { bg:"#f8fafc", card:"#fff", border:"#e2e8f0", primary:"#4f46e5", primaryLight:"#eef2ff", text:"#1e293b", sub:"#64748b", muted:"#94a3b8", ok:"#059669", okLight:"#ecfdf5", warn:"#f59e0b", warnLight:"#fffbeb", danger:"#dc2626", dangerLight:"#fef2f2" };
const sCard = { background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:16, marginBottom:12 };
const sBtn = (bg,color,sm) => ({ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, border:"none", borderRadius:10, cursor:"pointer", fontWeight:600, background:bg, color, fontSize:sm?12:14, padding:sm?"6px 12px":"10px 18px", whiteSpace:"nowrap" });
const sPill = (bg,color) => ({ display:"inline-flex", alignItems:"center", gap:3, fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20, background:bg, color });

// ─── State ───
const INIT = () => ({
  onboarded: false, region:"", subject:"", grade:"", topic:"",
  view:"home",
  sections: SECTIONS.reduce((a,s) => ({ ...a, [s.id]:{ content:"", selfScores:{}, notes:"" } }), {}),
  logs: [],
  analysis: [
    { id:1, label:"학습 흥미도", pre:"", post:"" },
    { id:2, label:"수업 참여도", pre:"", post:"" },
    { id:3, label:"자기효능감", pre:"", post:"" },
    { id:4, label:"발표 횟수(주평균)", pre:"", post:"" },
    { id:5, label:"과제 제출률(%)", pre:"", post:"" },
  ],
  evalHistory: [],
  penalties: new Set(),
  apiProvider:"none", apiKey:"", apiBaseUrl:"", apiModel:"",
  // 참고자료: 우수작, 계획서 예시 등 사용자가 붙여넣은 텍스트
  references: [
    // { id, title, type:"winner"|"plan"|"curriculum"|"other", content, addedAt }
  ],
});

function ser(s) { return { ...s, penalties:[...s.penalties] }; }
function des(o) { return { ...INIT(), ...o, penalties: new Set(o.penalties||[]) }; }

function reducer(st, a) {
  switch(a.type) {
    case "SET": return { ...st, [a.k]: a.v };
    case "ONBOARD": return { ...st, onboarded:true, region:a.region, subject:a.subject, grade:a.grade, topic:a.topic };
    case "SET_SECTION": return { ...st, sections: { ...st.sections, [a.id]: { ...st.sections[a.id], ...a.data } } };
    case "ADD_LOG": return { ...st, logs:[...st.logs, { ...a.log, id:Date.now(), at:new Date().toISOString() }] };
    case "DEL_LOG": return { ...st, logs:st.logs.filter(l=>l.id!==a.id) };
    case "SET_ANALYSIS": return { ...st, analysis:a.items };
    case "ADD_EVAL": return { ...st, evalHistory:[...st.evalHistory, { ...a.ev, ts:new Date().toISOString() }] };
    case "TOGGLE_P": { const s=new Set(st.penalties); s.has(a.i)?s.delete(a.i):s.add(a.i); return { ...st, penalties:s }; }
    case "SET_API": return { ...st, apiProvider:a.provider, apiKey:a.key, apiBaseUrl:a.baseUrl||"", apiModel:a.model||"" };
    case "ADD_REF": return { ...st, references:[...st.references, { id:Date.now(), title:a.title, type:a.refType, content:a.content, addedAt:new Date().toISOString() }] };
    case "DEL_REF": return { ...st, references:st.references.filter(r=>r.id!==a.id) };
    case "LOAD": return des(a.data);
    case "RESET": return INIT();
    default: return st;
  }
}

// ─── AI 프로바이더 ───
// cors: true  → 브라우저에서 직접 호출 가능 (CORS 허용)
// cors: false → 서버 사이드 전용 (브라우저에서 Failed to fetch)
// cors: null  → 미확인 (시도는 되지만 실패할 수 있음)
const AI_PROVIDERS = {
  // ── 수동 ──
  none: { label:"없음 (수동 복사 모드)", baseUrl:"", model:"", authStyle:"none", group:"기본", cors:true },

  // ── 브라우저 직접 호출 가능 ──
  claude:   { label:"Claude (Anthropic) ✅ 브라우저 OK", baseUrl:"https://api.anthropic.com", model:"claude-sonnet-4-20250514", authStyle:"anthropic", placeholder:"sk-ant-api...", group:"브라우저 직접 OK", cors:true },
  gemini:   { label:"Google Gemini (AI Studio) ✅ 브라우저 OK", baseUrl:"https://generativelanguage.googleapis.com/v1beta", model:"gemini-2.5-flash", authStyle:"gemini", placeholder:"AIza...", group:"브라우저 직접 OK", cors:true },
  groq:     { label:"Groq ✅ 브라우저 OK", baseUrl:"https://api.groq.com/openai", model:"llama-3.3-70b-versatile", authStyle:"bearer", placeholder:"gsk_...", group:"브라우저 직접 OK", cors:true },
  together: { label:"Together AI ✅ 브라우저 OK", baseUrl:"https://api.together.xyz", model:"meta-llama/Llama-3.3-70B-Instruct-Turbo", authStyle:"bearer", placeholder:"...", group:"브라우저 직접 OK", cors:true },
  fireworks:{ label:"Fireworks AI ✅ 브라우저 OK", baseUrl:"https://api.fireworks.ai/inference", model:"accounts/fireworks/models/llama-v3p3-70b-instruct", authStyle:"bearer", placeholder:"fw_...", group:"브라우저 직접 OK", cors:true },
  ollama:   { label:"Ollama (로컬) ✅ 브라우저 OK", baseUrl:"http://localhost:11434", model:"llama3.1", authStyle:"none", placeholder:"(키 불필요)", group:"브라우저 직접 OK", cors:true,
    note:"Ollama 실행 시 환경변수 OLLAMA_ORIGINS=* 설정이 필요합니다. (ollama serve 전 설정)" },

  // ── 서버 전용 (브라우저에서 CORS 차단) ──
  openai:   { label:"OpenAI (GPT) ⚠ CORS 차단", baseUrl:"https://api.openai.com", model:"gpt-4o", authStyle:"bearer", placeholder:"sk-...", group:"서버 전용 (수동 모드 사용)", cors:false },
  deepseek: { label:"DeepSeek ⚠ CORS 차단", baseUrl:"https://api.deepseek.com", model:"deepseek-chat", authStyle:"bearer", placeholder:"sk-...", group:"서버 전용 (수동 모드 사용)", cors:false },
  mistral:  { label:"Mistral AI ⚠ CORS 차단", baseUrl:"https://api.mistral.ai", model:"mistral-large-latest", authStyle:"bearer", placeholder:"...", group:"서버 전용 (수동 모드 사용)", cors:false },
  perplexity:{ label:"Perplexity ⚠ CORS 차단", baseUrl:"https://api.perplexity.ai", model:"llama-3.1-sonar-large-128k-online", authStyle:"bearer", placeholder:"pplx-...", group:"서버 전용 (수동 모드 사용)", cors:false },
  upstage:  { label:"Upstage Solar (한국) ⚠ CORS 차단", baseUrl:"https://api.upstage.ai", model:"solar-pro", authStyle:"bearer", placeholder:"up_...", group:"서버 전용 (수동 모드 사용)", cors:false },
  cerebras: { label:"Cerebras ⚠ CORS 차단", baseUrl:"https://api.cerebras.ai", model:"llama-3.3-70b", authStyle:"bearer", placeholder:"csk-...", group:"서버 전용 (수동 모드 사용)", cors:false },
  nvidia:   { label:"NVIDIA NIM ⚠ CORS 차단", baseUrl:"https://integrate.api.nvidia.com", model:"meta/llama-3.1-70b-instruct", authStyle:"bearer", placeholder:"nvapi-...", group:"서버 전용 (수동 모드 사용)", cors:false },

  // ── 특수 설정 필요 ──
  vertex:   { label:"Google Vertex AI (설정 필요)", baseUrl:"https://us-central1-aiplatform.googleapis.com/v1beta1/projects/MY_PROJECT/locations/us-central1/endpoints/openapi", model:"google/gemini-2.0-flash-001", authStyle:"bearer", placeholder:"ya29... (gcloud auth print-access-token)", group:"특수 설정 필요", cors:null,
    note:"① Base URL의 MY_PROJECT와 리전을 실제 GCP 프로젝트값으로 변경. ② API 키 란에 `gcloud auth print-access-token` 결과를 입력. ③ CORS 설정 여부에 따라 브라우저 직접 호출이 안 될 수 있음 → 실패 시 수동 모드 사용." },
  azure:    { label:"Azure OpenAI (설정 필요)", baseUrl:"https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT", model:"", authStyle:"azure", placeholder:"Azure API Key", group:"특수 설정 필요", cors:false,
    note:"Base URL을 실제 리소스명/배포명으로 변경. Azure OpenAI는 CORS를 차단하므로 수동 복사 모드 권장." },

  // ── 커스텀 ──
  custom: { label:"커스텀 (OpenAI 호환)", baseUrl:"", model:"", authStyle:"bearer", placeholder:"API 키", group:"커스텀", cors:null },
};

// CORS/네트워크 에러를 사람이 읽을 수 있게 변환
// 실행 환경 감지
function detectEnv() {
  try {
    // iframe 안에서 실행 중인지 (미리보기, 아티팩트 뷰어 등)
    if (window.self !== window.top) return "sandbox";
  } catch { return "sandbox"; } // cross-origin iframe → 접근 차단 = 샌드박스
  return "standalone";
}

function wrapFetchError(e, prov) {
  const isNetErr = e instanceof TypeError && (e.message==="Failed to fetch" || e.message.includes("NetworkError") || e.message.includes("fetch"));
  if (!isNetErr) throw e;

  const env = detectEnv();
  const preset = AI_PROVIDERS[prov];
  const name = preset?.label?.replace(/ [✅⚠].*/,"") || prov;

  // 1) 샌드박스(미리보기) 환경 — 모든 외부 요청 차단됨
  if (env === "sandbox") {
    throw new Error(
      `미리보기 환경에서는 외부 API 호출이 차단됩니다.\n\n` +
      `[해결 방법]\n` +
      `① 지금 당장: 수동 복사 모드 사용 (프롬프트 복사 → ChatGPT/Claude 등에 붙여넣기)\n` +
      `② 완전 해결: 이 앱을 Vite로 로컬 실행하면 API 직접 호출 가능\n` +
      `   → npm create vite@latest → 이 파일을 App.jsx로 복사 → npm run dev`
    );
  }

  // 2) 독립 실행인데 CORS 차단 서비스
  if (preset?.cors === false) {
    throw new Error(`CORS 차단 — ${name}은(는) 브라우저 직접 호출을 차단합니다.\n프롬프트를 복사해 해당 서비스 웹사이트에서 직접 실행하세요.`);
  }

  // 3) Ollama 전용
  if (prov==="ollama") {
    throw new Error("Ollama 연결 실패 — localhost:11434 실행 여부 확인.\n실행 중이라면: OLLAMA_ORIGINS=* 환경변수 설정 후 재시작.");
  }

  // 4) 기타 네트워크 오류
  throw new Error(`네트워크 오류 — ${name} 연결 실패.\nBase URL이 정확한지, 인터넷이 연결되어 있는지 확인하세요.`);
}

async function callAI(prompt, st) {
  const prov = st.apiProvider;
  const key  = st.apiKey;
  const preset = AI_PROVIDERS[prov];
  if (!preset || prov==="none") throw new Error("API 미설정 — 설정 탭에서 서비스를 선택하고 저장하세요.");
  if (!key && preset.authStyle !== "none") throw new Error("API 키가 없습니다 — 설정 탭에서 키를 입력하고 저장하세요.");

  const baseUrl = (st.apiBaseUrl || preset.baseUrl).replace(/\/$/, "");
  const model   = st.apiModel || preset.model;

  try {
    // ── Anthropic (Claude) ──────────────────────────
    if (preset.authStyle === "anthropic") {
      const r = await fetch(`${baseUrl}/v1/messages`, {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({ model, max_tokens:4096, messages:[{role:"user",content:prompt}] })
      });
      const d = await r.json();
      if (d.error) throw new Error(`[Claude] ${d.error.message||JSON.stringify(d.error)}`);
      return d.content?.[0]?.text || JSON.stringify(d);
    }

    // ── Azure OpenAI ────────────────────────────────
    if (preset.authStyle === "azure") {
      const r = await fetch(`${baseUrl}/chat/completions?api-version=2024-08-01-preview`, {
        method:"POST",
        headers:{"Content-Type":"application/json","api-key":key},
        body:JSON.stringify({ max_tokens:4096, messages:[{role:"user",content:prompt}] })
      });
      const d = await r.json();
      if (d.error) throw new Error(`[Azure] ${d.error.message||JSON.stringify(d.error)}`);
      return d.choices?.[0]?.message?.content || JSON.stringify(d);
    }

    // ── Google Gemini (네이티브 API) ─────────────────
    if (preset.authStyle === "gemini") {
      const r = await fetch(`${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ contents:[{parts:[{text:prompt}]}] })
      });
      const d = await r.json();
      if (d.error) throw new Error(`[Gemini] ${d.error.message||JSON.stringify(d.error)}`);
      return d.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(d);
    }

    // ── OpenAI 호환 (Groq·Together·Fireworks·Vertex·Ollama·커스텀 등) ──
    const headers = { "Content-Type":"application/json" };
    if (key && preset.authStyle === "bearer") headers["Authorization"] = `Bearer ${key}`;

    const r = await fetch(`${baseUrl}/v1/chat/completions`, {
      method:"POST", headers,
      body:JSON.stringify({ model, max_tokens:4096, messages:[{role:"user",content:prompt}] })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message||JSON.stringify(d.error));
    return d.choices?.[0]?.message?.content || JSON.stringify(d);

  } catch(e) {
    wrapFetchError(e, prov);
    throw e; // wrapFetchError가 항상 throw하지만 타입 안정성을 위해
  }
}

// 최소 테스트 호출 (연결 확인용)
async function testCallAI(st) {
  const prov = st.apiProvider;
  const preset = AI_PROVIDERS[prov];
  if (!preset || prov==="none") throw new Error("서비스를 선택하세요.");
  if (!st.apiKey && preset.authStyle!=="none") throw new Error("API 키를 입력하세요.");

  // 샌드박스 환경 감지
  if (detectEnv() === "sandbox") {
    throw new Error(
      "미리보기 환경에서는 외부 API 호출이 차단됩니다.\n\n" +
      "이 앱을 Vite로 로컬 실행하면 API 직접 호출이 가능합니다.\n" +
      "지금은 프롬프트 복사 모드를 사용하세요."
    );
  }

  if (preset.cors === false) {
    throw new Error(`CORS 차단 — ${preset.label.replace(/ [✅⚠].*/,"")}은(는) 브라우저에서 직접 호출이 불가합니다.\n수동 복사 모드를 사용하세요.`);
  }

  return callAI("'OK' 두 글자만 출력하세요.", st);
}

function parseJSON(text) {
  const f=text.match(/```json\s*([\s\S]*?)```/);
  if(f){try{return JSON.parse(f[1])}catch{}}
  const s=text.indexOf("{"),e=text.lastIndexOf("}");
  if(s!==-1&&e>s){try{return JSON.parse(text.slice(s,e+1))}catch{}}
  return null;
}

function buildEvalPrompt(rubric, data, type) {
  return `당신은 수업혁신사례연구대회 심사위원(10년 경력)입니다.
아래 심사기준으로 ${type==="report"?"연구보고서":"수업동영상 설명"}을 채점하세요.

## 심사기준 (총 ${rubric.reduce((s,r)=>s+r.max,0)}점)
${rubric.map(r=>`[${r.id}] ${r.sub} (${r.max}점)\n${r.questions.map((q,i)=>`  ${i+1}. ${q}`).join("\n")}`).join("\n\n")}

## 제출 내용
${data}

## JSON만 출력
\`\`\`json
{"scores":[${rubric.map(r=>`{"id":"${r.id}","score":0,"max":${r.max},"reasoning":"근거","improvements":["개선안"]}`).join(",")}],"total":0,"summary":"요약","top3":[{"id":"","gain":0,"action":""}]}
\`\`\`
규칙: 0~max 정수, 보수적 채점, top3는 (max-score) 큰 순`;
}

function buildDraftPrompt(section, st) {
  const refs = st.references;
  const winnerRefs = refs.filter(r=>r.type==="winner").map(r=>`### [우수작: ${r.title}]\n${r.content.slice(0,2000)}`).join("\n\n");
  const planRefs = refs.filter(r=>r.type==="plan").map(r=>`### [계획서: ${r.title}]\n${r.content.slice(0,1500)}`).join("\n\n");
  const otherRefs = refs.filter(r=>r.type==="curriculum"||r.type==="other").map(r=>`### [${r.title}]\n${r.content.slice(0,1000)}`).join("\n\n");
  const logsText = st.logs.length>0 ? st.logs.map(l=>`[${l.date}] ${l.subject} | ${l.strategy}\n관찰: ${l.observation||"-"}\n데이터: ${l.data||"-"}`).join("\n\n") : "(기록 없음)";
  const analysisText = st.analysis.map(a=>`${a.label}: ${a.pre||"?"} → ${a.post||"?"}`).join("\n");
  const rubricItems = REPORT_RUBRIC.filter(r => {
    if(section.id==="s1") return ["r1"].includes(r.id);
    if(section.id==="s2") return ["r1","r3"].includes(r.id);
    if(section.id==="s3") return ["r2","r3","r6"].includes(r.id);
    if(section.id==="s4") return ["r5"].includes(r.id);
    if(section.id==="s5") return ["r7"].includes(r.id);
    if(section.id==="s6") return ["r8","r9"].includes(r.id);
    return false;
  });

  return `당신은 수업혁신사례연구대회 1등급 입상 경험이 있는 교사입니다.
아래 정보를 기반으로 "${section.num}. ${section.title}" 섹션 초안을 작성하세요.

## 기본 정보
- 지역: ${REGIONS[st.region]?.label||"미지정"} (정책: ${REGIONS[st.region]?.policy||""})
- 교과: ${st.subject||"미지정"} · 학년: ${st.grade||"미지정"}
- 주제: ${st.topic||"미지정"}

## 이 섹션의 심사기준 (심사위원이 확인하는 것)
${rubricItems.map(r=>`[${r.sub} ${r.max}점]\n${r.questions.map(q=>`  - ${q}`).join("\n")}\n팁: ${r.tip}`).join("\n\n")}

## 필수 포함 요소
${section.checklist.map(c=>`- ${c}`).join("\n")}

## 권장 구조
${section.template}

## 수업 기록 데이터 (${st.logs.length}건)
${logsText}

## 사전-사후 데이터
${analysisText}

${winnerRefs ? `## 참고: 우수작 사례 (문체·구조 참조용, 표절 금지)\n${winnerRefs}\n` : ""}
${planRefs ? `## 참고: 연구계획서 예시\n${planRefs}\n` : ""}
${otherRefs ? `## 참고: 기타 자료\n${otherRefs}\n` : ""}

## 작성 규칙 (절대 준수)
1. 심사기준 평가질문에 직접 응답하는 내용 포함
2. 구체적 데이터·에피소드 기반 (추상적 당위성 금지)
3. **현직 교사가 직접 쓴 문체** — AI가 쓴 티가 나면 심사 감점
4. 금지 표현: "~것입니다" 반복, "본 연구에서는", "이를 통해", "궁극적으로", "~할 수 있습니다" 남발, "다양한", "효과적인" 등 AI 상투어
5. 권장 표현: "우리 반 아이들은", "수업 중 ~한 장면이 있었다", "~해 보니", "~고민했다" 등 현장 언어
6. 분량: 전체 25쪽 중 이 섹션은 ${section.pages}
7. 마크다운 형식 (## 소제목, 표 등)
8. 데이터가 없는 항목은 [여기에 데이터 입력] 플레이스홀더로 표시`;
}

function buildPlanPrompt(st) {
  const refs = st.references;
  const planRefs = refs.filter(r=>r.type==="plan").map(r=>`### [${r.title}]\n${r.content.slice(0,2000)}`).join("\n\n");
  const winnerRefs = refs.filter(r=>r.type==="winner").map(r=>`### [${r.title}]\n${r.content.slice(0,1000)}`).join("\n\n");

  return `당신은 수업혁신사례연구대회 1등급 입상 교사입니다.
아래 정보로 연구계획서(A4, 표지 포함 7쪽 내외)를 작성하세요.

## 기본 정보
- 지역: ${REGIONS[st.region]?.label||"미지정"} (정책: ${REGIONS[st.region]?.policy||""})
- 교과: ${st.subject||"미지정"} · 학년: ${st.grade||"미지정"}
- 주제: ${st.topic||"미지정"}

## 계획서 구조 ([서식5] 준수)
1. 연구의 필요성 및 목적 (1~1.5쪽)
2. 이론적 배경 (1쪽)
3. 연구 내용 및 방법 (2~2.5쪽)
   - 연구 대상, 기간, 절차
   - 연구 과제별 실행 계획
   - 검증 방법 (사전-사후)
4. 기대 효과 (0.5쪽)
5. 참고 문헌

${planRefs ? `## 참고: 계획서 예시\n${planRefs}\n` : ""}
${winnerRefs ? `## 참고: 우수작 보고서 구조 (방향 참조)\n${winnerRefs}\n` : ""}

## 규칙
1. 2022 개정 교육과정 성취기준 직접 인용
2. 연구문제 3개 (인지/정의/실천)
3. 구체적 주차별 실행 계획 포함
4. 마크다운 형식`;
}

// ─── 계획서 파이프라인 프롬프트 ───
const PLAN_EVAL_ITEMS = [
  {id:"p1",label:"연구 필요성·교육과정 근거",max:15},
  {id:"p2",label:"연구문제 명확성",max:10},
  {id:"p3",label:"수업 설계 구체성",max:15},
  {id:"p4",label:"연구 방법 체계성",max:15},
  {id:"p5",label:"현장 적합성",max:10},
  {id:"p6",label:"문체·형식",max:5},
];

function buildPlanDirPrompt(st) {
  const refs = st.references.slice(0,3).map(r=>`[${r.title}] ${r.content.slice(0,600)}`).join("\n\n");
  return `당신은 수업혁신사례연구대회 심사위원(10년 경력) 겸 1등급 코치입니다.
서로 확실히 다른 연구 방향 3가지를 제안하고, 심사 예상 점수를 매기세요.

## 교사 정보
- 지역: ${REGIONS[st.region]?.label||"미지정"} (정책: ${REGIONS[st.region]?.policy||""})
- 교과: ${st.subject||"미지정"} · 학년: ${st.grade||"미지정"}
- 주제 키워드: ${st.topic||"미지정"}

## 심사기준
[r1] 교육과정 방향 반영 (20점): 인간상·핵심역량·성취기준 기반인가?
[r2] 학생 참여 중심 (20점): 학생 능동 참여 구조인가?
[r3] 수업 혁신 노력 (10점): AI 등 환경 변화 반영?
[r4] 현장 적합성 (10점): 실제 적용 가능한가?
[r5] 연구 방법 (10점): 체계적 연구 설계인가?

## 필수 준수 사항
- 성취기준은 반드시 **2022 개정 교육과정** 기준으로 제시 (2015 개정 성취기준 사용 시 중대 감점)
- AI 활용 시 구체적 도구명(예: 클로바노트, 뤼튼, ChatGPT, Canva AI, 구글 Gemini 등)과 수업 장면에서의 구체적 활용 방법을 명시
- AI가 단순 보조가 아닌, 학습 과정을 근본적으로 변화시키는 역할로 설계

${refs ? `## 참고자료\n${refs}\n` : ""}
## 반드시 아래 JSON만 출력 (다른 텍스트 금지)
\`\`\`json
{"directions":[{"name":"방향명","desc":"핵심 설명 2~3문장","diff":"이 방향만의 차별점","scores":{"r1":0,"r2":0,"r3":0,"r4":0,"r5":0},"total":0,"why":"점수 근거 2문장"}]}
\`\`\`
규칙: 3개, 교수법·도구·평가 관점에서 확실히 다를 것, 0~max 정수, 보수적 채점`;
}

function buildPlanStratPrompt(st, dir) {
  return `당신은 수업혁신사례연구대회 1등급 코치입니다.
선택된 방향의 실행 전략 3가지를 구체적으로 제안하세요.

## 교사: ${st.subject||""} · ${st.grade||""} · ${REGIONS[st.region]?.label||""}
## 선택 방향: "${dir.name}" — ${dir.desc}
차별점: ${dir.diff}

## 심사기준: r1(20) r2(20) r3(10) r4(10) r5(10) = 70점

## JSON만 출력
\`\`\`json
{"strategies":[{"name":"전략명","desc":"3문장 설명","methods":["교수법1","도구2","평가3"],"scores":{"r1":0,"r2":0,"r3":0,"r4":0,"r5":0},"total":0,"why":"근거"}]}
\`\`\`
규칙: 3개, 같은 방향 안에서 실행 방법이 다를 것, ${st.grade||""} 학생 대상 현실적
필수: 성취기준은 반드시 2022 개정 교육과정 기준. AI 도구는 구체적 서비스명+활용 장면 명시.`;
}

function buildPlanStructPrompt(st, dir, strat) {
  return `당신은 수업혁신사례연구대회 1등급 코치입니다.
확정된 방향·전략으로 계획서 뼈대를 설계하세요.

## 확정: ${st.subject||""} · ${st.grade||""}
- 방향: ${dir.name} — ${dir.desc}
- 전략: ${strat.name} — ${strat.desc}
- 방법: ${(strat.methods||[]).join(", ")}

## JSON만 출력
\`\`\`json
{
  "researchQuestions":["연구문제1(인지적)","연구문제2(정의적)","연구문제3(실천적)"],
  "theories":["핵심이론1","핵심이론2"],
  "weeklyPlan":[{"week":"1~2주","activity":"내용","goal":"목표"}],
  "verification":{"quant":"정량 방법","qual":"정성 방법"},
  "standards":["성취기준 코드+내용"]
}
\`\`\`
규칙: 주차 12~16주, 연구문제는 측정 가능하게
필수: 성취기준은 반드시 2022 개정 교육과정(2024~2025 순차 적용) 기준 코드. 절대로 2015 개정 교육과정 성취기준을 사용하지 마세요.
AI 활용 주차에는 구체적 AI 도구명(ChatGPT, Gemini, 뤼튼, 클로바노트, Canva AI 등)과 학생이 AI를 어떻게 사용하는지 구체적 장면을 명시.`;
}

function buildPlanDraftPrompt2(st, dir, strat, struct) {
  const refs = st.references;
  const planRefs = refs.filter(r=>r.type==="plan").map(r=>`[${r.title}]\n${r.content.slice(0,1500)}`).join("\n\n");
  const winRefs = refs.filter(r=>r.type==="winner").map(r=>`[${r.title}]\n${r.content.slice(0,800)}`).join("\n\n");

  return `당신은 수업혁신사례연구대회에서 1등급을 여러 번 수상한 현직 ${st.grade||""} ${st.subject||""} 교사입니다.
아래 설계를 바탕으로 연구계획서(A4 7쪽 분량)를 완성하세요.

## 확정 설계
- 지역: ${REGIONS[st.region]?.label||""} (정책: ${REGIONS[st.region]?.policy||""})
- 방향: ${dir.name} — ${dir.desc}
- 전략: ${strat.name} (${(strat.methods||[]).join(", ")})
- 연구문제: ${(struct.researchQuestions||[]).map((q,i)=>(i+1)+") "+q).join(" / ")}
- 이론: ${(struct.theories||[]).join(", ")}
- 성취기준: ${(struct.standards||[]).join(", ")}

## 계획서 구조 ([서식5])
1. 연구의 필요성 및 목적 (1~1.5쪽)
2. 이론적 배경 (1쪽)
3. 연구 내용 및 방법 (2~2.5쪽) — 주차별 실행 계획 표 포함
4. 기대 효과 (0.5쪽)
5. 참고 문헌

## 주차 계획: ${JSON.stringify(struct.weeklyPlan||[])}
## 검증: 정량(${struct.verification?.quant||""}) + 정성(${struct.verification?.qual||""})

${planRefs ? `## 참고 계획서 (문체·구조 참조)\n${planRefs}\n` : ""}
${winRefs ? `## 참고 우수작\n${winRefs}\n` : ""}

## 작성 규칙 (절대 준수)
1. **현직 교사가 직접 쓴 문체** — AI가 쓴 티가 나면 심사 감점
2. 금지 표현: "~것입니다" 반복, "본 연구에서는", "이를 통해", "궁극적으로", "~할 수 있습니다" 남발, "다양한", "효과적인" 등 AI 상투어
3. 권장 표현: "우리 반 아이들은", "수업 중 ~한 장면이 있었다", "~해 보니", "~고민했다", "~에서 힌트를 얻었다"
4. 성취기준은 반드시 **2022 개정 교육과정** 코드만 사용 (절대 2015 개정 성취기준 사용 금지). 예: [6체02-01]이 2022 개정인지 반드시 확인
5. AI 활용 시 구체적 도구명(ChatGPT, Gemini, 뤼튼, 클로바노트, Canva AI, 패들렛 AI 등) + "학생이 ~할 때 ~를 사용하여 ~한다"는 구체적 활용 장면 기술. "AI 기반 도구" 같은 추상적 표현 금지
6. 학급 인원수, 수업 시수, 교실 환경 등 현실 조건 명시
7. 마크다운 형식 (## 소제목, 표)`;
}

function buildPlanEvalPrompt2(planText) {
  return `당신은 수업혁신사례연구대회 심사위원(10년 경력)입니다.
아래 연구계획서를 엄격하게 채점하세요.

## 채점 기준 (70점 만점)
[p1] 연구 필요성·교육과정 근거 (15점): 2022 개정 교육과정 연계, 성취기준 인용 여부
[p2] 연구문제 명확성 (10점): 인지·정의·실천 영역, 측정 가능성
[p3] 수업 설계 구체성 (15점): 학생 참여 중심, 교수법, AI 활용 근거
[p4] 연구 방법 체계성 (15점): 주차별 계획, 사전-사후, 통계 방법
[p5] 현장 적합성 (10점): 실제 적용 가능성, 학급 현실 반영
[p6] 문체·형식 (5점): 교사 문체(AI 문체면 감점), 서식 준수

## 계획서
${planText}

## JSON만 출력
\`\`\`json
{"scores":[{"id":"p1","score":0,"max":15,"issue":"감점 사유","fix":"개선 방법"},{"id":"p2","score":0,"max":10,"issue":"","fix":""},{"id":"p3","score":0,"max":15,"issue":"","fix":""},{"id":"p4","score":0,"max":15,"issue":"","fix":""},{"id":"p5","score":0,"max":10,"issue":"","fix":""},{"id":"p6","score":0,"max":5,"issue":"","fix":""}],"total":0,"summary":"종합 2문장"}
\`\`\`
규칙: 0~max 정수, 보수적, AI 문체 보이면 p6 감점`;
}

function buildPlanFixPrompt(planText, ev) {
  const weak = ev.scores.filter(s=>s.score<s.max*0.7).sort((a,b)=>(a.score/a.max)-(b.score/b.max));
  const fixes = weak.map(s=>`[${s.id}] 문제: ${s.issue} → 개선: ${s.fix}`).join("\n");
  return `당신은 수업혁신사례연구대회 1등급 교사입니다.
아래 계획서의 약점 부분만 수정하세요. 잘 쓴 부분은 절대 건드리지 마세요.

## 수정 지시 (이것만 고치세요)
${fixes}

## 현재 계획서
${planText}

## 규칙
1. 지적된 부분만 수정, 나머지 100% 유지
2. 앞뒤 문맥과 자연스럽게 연결
3. 현직 교사 문체 (AI 상투어 절대 금지)
4. 전체 계획서를 처음부터 끝까지 출력 (수정 반영 상태로)
5. 마크다운 형식 유지`;
}

// ─── 유틸 ───
const dday = (d) => Math.max(0, Math.ceil((d - new Date()) / 86400000));
const latest = (h,t) => { const f=h.filter(e=>e.type===t); return f.length?f[f.length-1]:null; };
const penaltySum = (ps) => { let t=0; ps.forEach(i=>{if(PENALTY_ITEMS[i])t+=PENALTY_ITEMS[i].p}); return t; };

// ══════════════════════════════
// 온보딩
// ══════════════════════════════
function Onboarding({ dispatch }) {
  const [step, setStep] = useState(0);
  const [region, setRegion] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");

  const steps = [
    { title:"어떤 지역에서 출품하시나요?", sub:"지역 정책과 연계하면 심사에서 유리합니다" },
    { title:"교과와 학년을 알려주세요", sub:"우수작 패턴과 심사 포인트가 달라집니다" },
    { title:"연구 주제가 있으신가요?", sub:"아직 미정이어도 괜찮습니다" },
  ];

  return (
    <div style={{ minHeight:"100dvh", display:"flex", flexDirection:"column", justifyContent:"center", padding:24, background:"linear-gradient(180deg,#1e1b4b,#312e81)" }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ fontSize:14, color:"#a5b4fc", letterSpacing:2, marginBottom:8 }}>2026 수업혁신사례연구대회</div>
        <div style={{ fontSize:28, fontWeight:800, color:"#fff", lineHeight:1.3 }}>목적 달성 코치</div>
        <div style={{ fontSize:13, color:"#818cf8", marginTop:8 }}>5개월간 당신의 1등급을 함께 만듭니다</div>
      </div>

      <div style={{ background:"#fff", borderRadius:20, padding:24, maxWidth:400, width:"100%", margin:"0 auto" }}>
        <div style={{ display:"flex", gap:4, marginBottom:20 }}>
          {[0,1,2].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=step?"#4f46e5":"#e2e8f0" }} />)}
        </div>

        <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:4 }}>{steps[step].title}</div>
        <div style={{ fontSize:12, color:C.sub, marginBottom:16 }}>{steps[step].sub}</div>

        {step===0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {Object.entries(REGIONS).map(([k,v]) => (
              <button key={k} onClick={() => setRegion(k)} style={{ ...sBtn(region===k?v.color:"#f1f5f9", region===k?"#fff":C.sub, true), borderRadius:20, flex:"1 1 auto" }}>
                {v.short}
              </button>
            ))}
            {region && (
              <div style={{ width:"100%", fontSize:11, color:C.sub, marginTop:4, padding:8, background:"#f8fafc", borderRadius:8, lineHeight:1.5 }}>
                <MapPin size={11} style={{verticalAlign:"middle"}} /> {REGIONS[region].policy}
              </div>
            )}
          </div>
        )}

        {step===1 && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="교과 (예: 국어, 수학, 과학, 융합)"
              style={{ padding:10, border:`1px solid ${C.border}`, borderRadius:10, fontSize:14 }} />
            <input value={grade} onChange={e=>setGrade(e.target.value)} placeholder="학년 (예: 초3, 중2, 고1)"
              style={{ padding:10, border:`1px solid ${C.border}`, borderRadius:10, fontSize:14 }} />
          </div>
        )}

        {step===2 && (
          <div>
            <textarea value={topic} onChange={e=>setTopic(e.target.value)} rows={3}
              placeholder="연구 주제 (미정이면 비워두세요)&#10;예: 프로젝트 기반 학습으로 학생 자기주도성 향상"
              style={{ width:"100%", boxSizing:"border-box", padding:10, border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, resize:"none", fontFamily:"inherit" }} />
          </div>
        )}

        <div style={{ display:"flex", justifyContent:"space-between", marginTop:20 }}>
          {step>0 ? <button style={sBtn("#f1f5f9",C.sub,true)} onClick={() => setStep(step-1)}>이전</button> : <div/>}
          {step<2 ? (
            <button style={sBtn(C.primary,"#fff",false)} onClick={() => { if(step===0&&!region)return; if(step===1&&!subject)return; setStep(step+1); }} disabled={step===0&&!region}>
              다음 <ChevronRight size={16}/>
            </button>
          ) : (
            <button style={sBtn(C.primary,"#fff",false)} onClick={() => dispatch({ type:"ONBOARD", region, subject, grade, topic })}>
              시작하기 <ArrowRight size={16}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════
// 하단 네비
// ══════════════════════════════
const TABS = [
  { id:"home", icon:Home, label:"홈" },
  { id:"write", icon:Edit3, label:"작성" },
  { id:"log", icon:PenTool, label:"기록" },
  { id:"eval", icon:Brain, label:"심사" },
  { id:"settings", icon:Sliders, label:"설정" },
];

function Nav({ cur, go }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-around", background:C.card, borderTop:`1px solid ${C.border}`, padding:"6px 0 max(6px,env(safe-area-inset-bottom))", position:"sticky", bottom:0, zIndex:100 }}>
      {TABS.map(t => {
        const on=cur===t.id; const I=t.icon;
        return <button key={t.id} onClick={()=>go(t.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"none", border:"none", cursor:"pointer", padding:"4px 8px", color:on?C.primary:C.muted }}>
          <I size={20} strokeWidth={on?2.5:1.8}/><span style={{ fontSize:10, fontWeight:on?700:500 }}>{t.label}</span>
        </button>;
      })}
    </div>
  );
}

// ══════════════════════════════
// 홈
// ══════════════════════════════
function HomeView({ st, go }) {
  const rEval = latest(st.evalHistory,"report");
  const vEval = latest(st.evalHistory,"video");
  const pen = penaltySum(st.penalties);
  const rS = rEval?.total||0, vS = vEval?.total||0;
  const total = Math.max(0, rS+vS-pen);
  const priority = rEval?.top3?.[0] || vEval?.top3?.[0];

  // 보고서 작성 진행률
  const written = SECTIONS.filter(s => (st.sections[s.id]?.content||"").length > 50).length;
  const selfChecked = SECTIONS.filter(s => {
    const sc = st.sections[s.id]?.selfScores || {};
    return Object.keys(sc).length > 0;
  }).length;

  return (
    <div>
      {/* D-day */}
      <div style={{ background:"linear-gradient(135deg,#1e1b4b,#4338ca)", borderRadius:16, padding:"20px 24px", color:"#fff", position:"relative", overflow:"hidden", marginBottom:12 }}>
        <div style={{ fontSize:10, opacity:.6, letterSpacing:2, marginBottom:4 }}>2026 수업혁신사례연구대회</div>
        <div style={{ display:"flex", alignItems:"baseline", gap:16, flexWrap:"wrap" }}>
          <div>
            <span style={{ fontSize:42, fontWeight:800, lineHeight:1 }}>D-{dday(NATIONAL_DEADLINE)}</span>
            <div style={{ fontSize:10, opacity:.5 }}>전국 9.22 18:00</div>
          </div>
          <div style={{ borderLeft:"1px solid rgba(255,255,255,.2)", paddingLeft:14 }}>
            <span style={{ fontSize:22, fontWeight:700, color:"#fbbf24" }}>D-{dday(SIDO_DEADLINE)}</span>
            <div style={{ fontSize:10, opacity:.5 }}>시도 7.31</div>
          </div>
          <span style={sPill(REGIONS[st.region]?.color||"#64748b","#fff")}><MapPin size={10}/>{REGIONS[st.region]?.short||"미설정"}</span>
        </div>
        {st.topic && <div style={{ fontSize:12, opacity:.7, marginTop:8 }}>주제: {st.topic}</div>}
      </div>

      {/* 내 현황 */}
      <div style={sCard}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>내 현황</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <MiniStat label="보고서 작성" value={`${written}/${SECTIONS.length}`} sub="섹션" color={C.primary} />
          <MiniStat label="자가평가" value={`${selfChecked}/${SECTIONS.length}`} sub="완료" color={C.ok} />
          <MiniStat label="수업 기록" value={st.logs.length} sub="건" color="#7c3aed" />
          <MiniStat label="AI 심사" value={st.evalHistory.length} sub="회" color={C.warn} />
        </div>
      </div>

      {/* 예상 점수 */}
      {(rEval || vEval) && (
        <div style={sCard}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>예상 점수</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
            <ScoreChip label="보고서" score={rS} max={100} color="#6366f1"/>
            <span style={{ color:C.muted }}>+</span>
            <ScoreChip label="동영상" score={vS} max={100} color="#7c3aed"/>
            <span style={{ color:C.muted }}>−</span>
            <ScoreChip label="감점" score={pen} max={0} color={C.danger}/>
            <span style={{ color:C.muted }}>=</span>
            <div style={{ fontSize:28, fontWeight:800, color:C.primary }}>{total}<span style={{ fontSize:12, color:C.muted }}>/200</span></div>
          </div>
        </div>
      )}

      {/* 최우선 개선 */}
      {priority && (
        <div style={{ ...sCard, background:C.warnLight, borderColor:"#fde68a" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
            <Zap size={14} color={C.warn}/><span style={{ fontSize:12, fontWeight:700, color:"#92400e" }}>지금 가장 효과적인 개선</span>
          </div>
          <div style={{ fontSize:13, color:"#78350f", lineHeight:1.5 }}>
            {priority.action} <span style={sPill("#fef3c7","#92400e")}>+{priority.gain}점</span>
          </div>
        </div>
      )}

      {/* 다음 할 일 안내 */}
      <div style={sCard}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>다음 단계 안내</div>
        {written===0 ? (
          <NextStep icon={Edit3} text="보고서 작성을 시작하세요. 섹션별 가이드와 템플릿이 준비되어 있습니다." action="작성 시작" onClick={()=>go("write")} />
        ) : selfChecked < written ? (
          <NextStep icon={ClipboardList} text="작성한 섹션의 자가평가를 완료하세요. 심사기준별 체크리스트로 약점을 미리 파악합니다." action="자가평가" onClick={()=>go("write")} />
        ) : st.logs.length === 0 ? (
          <NextStep icon={PenTool} text="수업 기록을 시작하세요. 매 수업 후 기록이 보고서의 핵심 근거가 됩니다." action="기록 시작" onClick={()=>go("log")} />
        ) : st.evalHistory.length === 0 ? (
          <NextStep icon={Brain} text="AI 심사를 실행하세요. 현재 작성 내용을 200점 기준으로 자동 채점합니다." action="AI 심사" onClick={()=>go("eval")} />
        ) : (
          <NextStep icon={RefreshCw} text="개선 루프: 약점 섹션을 수정하고 재심사하세요. 반복할수록 점수가 올라갑니다." action="보고서 수정" onClick={()=>go("write")} />
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, color }) {
  return (
    <div style={{ flex:1, minWidth:70, textAlign:"center", padding:10, background:`${color}08`, borderRadius:12, border:`1px solid ${color}20` }}>
      <div style={{ fontSize:10, color:C.sub }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:800, color, lineHeight:1.2 }}>{value}</div>
      <div style={{ fontSize:9, color:C.muted }}>{sub}</div>
    </div>
  );
}
function ScoreChip({ label, score, max, color }) {
  return <div style={{ textAlign:"center" }}><div style={{ fontSize:9, color:C.sub }}>{label}</div><div style={{ fontSize:18, fontWeight:800, color }}>{score}</div></div>;
}
function NextStep({ icon:Icon, text, action, onClick }) {
  return (
    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
      <div style={{ width:40, height:40, borderRadius:12, background:C.primaryLight, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={20} color={C.primary}/>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, color:C.sub, lineHeight:1.5, marginBottom:6 }}>{text}</div>
        <button style={sBtn(C.primary,"#fff",true)} onClick={onClick}>{action} <ChevronRight size={14}/></button>
      </div>
    </div>
  );
}

// ══════════════════════════════
// 계획서 파이프라인 컴포넌트
// ══════════════════════════════
function PlanPipeline({ st, dispatch }) {
  const [phase, setPhase] = useState("idle");
  const [dirs, setDirs] = useState(null);
  const [selDir, setSelDir] = useState(null);
  const [strats, setStrats] = useState(null);
  const [selStrat, setSelStrat] = useState(null);
  const [struct, setStruct] = useState(null);
  const [ev1, setEv1] = useState(null);
  const [ev2, setEv2] = useState(null);
  const [logs, setLogs] = useState([]);
  const [err, setErr] = useState(null);
  const [expanded, setExpanded] = useState({dirs:true,strats:true,struct:true,eval:true});
  const busy = useRef(false);
  const logRef = useRef(null);

  const addLog = (m) => { setLogs(p=>[...p,{m,t:Date.now()}]); setTimeout(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},50); };
  const hasApi = st.apiProvider!=="none" && (st.apiKey || AI_PROVIDERS[st.apiProvider]?.authStyle==="none");

  const PHASES = [{id:"directions",l:"방향 탐색",n:1},{id:"pick_dir",l:"방향 선택",n:1},{id:"strategies",l:"전략 구체화",n:2},{id:"pick_strat",l:"전략 선택",n:2},{id:"drafting",l:"본문 작성",n:3},{id:"feedback",l:"피드백 개선",n:4}];
  const phaseNum = (pid) => { const m={directions:0,pick_dir:0,strategies:1,pick_strat:1,drafting:2,feedback:3,done:4,error:-1}; return m[pid]??-1; };

  // Phase 1: 방향 생성
  const startPhase1 = async () => {
    if(busy.current||!hasApi) return;
    busy.current=true;
    setErr(null);setLogs([]);setDirs(null);setStrats(null);setStruct(null);
    setEv1(null);setEv2(null);setSelDir(null);setSelStrat(null);
    try {
      setPhase("directions");
      addLog("Phase 1/4 — 연구 방향 3개를 분석 중...");
      const r1=await callAI(buildPlanDirPrompt(st),st);
      const d1=parseJSON(r1);
      if(!d1?.directions?.length) throw new Error("방향 생성 실패 (JSON 파싱 오류). 다시 시도하세요.");
      d1.directions.sort((a,b)=>(b.total||0)-(a.total||0));
      setDirs(d1.directions);
      setSelDir(0);
      addLog(`✅ 방향 ${d1.directions.length}개 완료 — 아래에서 선택하세요`);
      d1.directions.forEach((d,i)=>addLog(`  ${i===0?"⭐":"  "} ${d.name}: ${d.total}점`));
      setPhase("pick_dir");
    } catch(e) { setErr(e.message); setPhase("error"); addLog(`❌ ${e.message}`); }
    busy.current=false;
  };

  // Phase 2: 전략 생성 (사용자가 방향 선택 후)
  const startPhase2 = async () => {
    if(busy.current||selDir===null||!dirs) return;
    busy.current=true;
    try {
      const chosenDir=dirs[selDir];
      addLog(`→ 방향 "${chosenDir.name}" 확정`);
      setPhase("strategies");
      addLog("Phase 2/4 — 핵심 전략 3개 설계 중...");
      const r2=await callAI(buildPlanStratPrompt(st,chosenDir),st);
      const d2=parseJSON(r2);
      if(!d2?.strategies?.length) throw new Error("전략 생성 실패");
      d2.strategies.sort((a,b)=>(b.total||0)-(a.total||0));
      setStrats(d2.strategies);
      setSelStrat(0);
      addLog(`✅ 전략 ${d2.strategies.length}개 완료 — 아래에서 선택하세요`);
      d2.strategies.forEach((s,i)=>addLog(`  ${i===0?"⭐":"  "} ${s.name}: ${s.total}점`));
      setPhase("pick_strat");
    } catch(e) { setErr(e.message); setPhase("error"); addLog(`❌ ${e.message}`); }
    busy.current=false;
  };

  // Phase 3+4: 뼈대 → 본문 → 채점 → 개선 (사용자가 전략 선택 후 자동 진행)
  const startPhase3 = async () => {
    if(busy.current||selStrat===null||!strats||!dirs||selDir===null) return;
    busy.current=true;
    const chosenDir=dirs[selDir];
    const chosenStrat=strats[selStrat];
    addLog(`→ 전략 "${chosenStrat.name}" 확정`);
    try {
      // Structure
      setPhase("drafting");
      addLog("Phase 3/4 — 연구 뼈대 설계 중...");
      const r3=await callAI(buildPlanStructPrompt(st,chosenDir,chosenStrat),st);
      const d3=parseJSON(r3);
      if(!d3?.researchQuestions) throw new Error("구조 설계 실패");
      setStruct(d3);
      addLog(`✅ 뼈대: 연구문제 ${d3.researchQuestions.length}개, ${(d3.weeklyPlan||[]).length}주 계획`);

      // Draft
      addLog("계획서 본문 작성 중 (7쪽)...");
      const r4=await callAI(buildPlanDraftPrompt2(st,chosenDir,chosenStrat,d3),st);
      dispatch({type:"SET_SECTION",id:"plan",data:{content:r4}});
      addLog(`✅ 초안 완성 (${r4.length}자)`);

      // Eval
      setPhase("feedback");
      addLog("Phase 4/4 — 자동 채점 중...");
      const r5=await callAI(buildPlanEvalPrompt2(r4),st);
      const d5=parseJSON(r5);
      if(!d5?.scores) throw new Error("채점 실패");
      setEv1(d5);
      addLog(`✅ 1차 채점: ${d5.total}/70점`);
      d5.scores.forEach(s=>addLog(`  ${s.id}: ${s.score}/${s.max}${s.issue?" — "+s.issue:""}`));

      let finalText=r4;
      const weak=d5.scores.filter(s=>s.score<s.max*0.7);

      if(weak.length>0) {
        addLog(`약점 ${weak.length}개 → 타겟 개선 중...`);
        const r6=await callAI(buildPlanFixPrompt(r4,d5),st);
        finalText=r6;
        dispatch({type:"SET_SECTION",id:"plan",data:{content:r6}});
        addLog("✅ 개선 완료");

        addLog("최종 채점 중...");
        const r7=await callAI(buildPlanEvalPrompt2(r6),st);
        const d7=parseJSON(r7);
        setEv2(d7);
        const delta=(d7?.total||0)-(d5.total||0);
        addLog(`✅ 최종: ${d7?.total||"?"}/70점 (${delta>=0?"+":""}${delta})`);

        if((d7?.total||0)<49) {
          const weak2=(d7?.scores||[]).filter(s=>s.score<s.max*0.7);
          if(weak2.length>0) {
            addLog(`2차 개선 중 (약점 ${weak2.length}개)...`);
            const r8=await callAI(buildPlanFixPrompt(r6,d7),st);
            finalText=r8;
            dispatch({type:"SET_SECTION",id:"plan",data:{content:r8}});
            const r9=await callAI(buildPlanEvalPrompt2(r8),st);
            const d9=parseJSON(r9);
            setEv2(d9);
            addLog(`✅ 2차 최종: ${d9?.total||"?"}/70점`);
          }
        }
      } else {
        addLog("모든 항목 기준 충족 — 개선 불필요");
      }

      setPhase("done");
      addLog("🎉 계획서 자동 생성 완료!");
    } catch(e) { setErr(e.message); setPhase("error"); addLog(`❌ ${e.message}`); }
    busy.current=false;
  };

  const curPhase=phaseNum(phase);
  const finalEv=ev2||ev1;
  const toggle=(k)=>setExpanded(p=>({...p,[k]:!p[k]}));

  const exportDocx = async () => {
    const text = st.sections.plan?.content || "";
    if(!text) return;
    const [{ Document: Doc, Packer: Pk, Paragraph: Para, HeadingLevel: HL, TextRun: TR, AlignmentType: AT }, { saveAs: sa }] =
      await Promise.all([import("docx"), import("file-saver")]);
    const lines = text.split("\n");
    const children = [];
    for(const line of lines) {
      const trimmed = line.trim();
      if(!trimmed) { children.push(new Para({text:"",spacing:{after:100}})); continue; }
      const h1 = trimmed.match(/^#\s+(.+)/);
      const h2 = trimmed.match(/^##\s+(.+)/);
      const h3 = trimmed.match(/^###\s+(.+)/);
      const h4 = trimmed.match(/^####\s+(.+)/);
      if(h1) { children.push(new Para({text:h1[1],heading:HL.HEADING_1,spacing:{before:300,after:150}})); }
      else if(h2) { children.push(new Para({text:h2[1],heading:HL.HEADING_2,spacing:{before:240,after:120}})); }
      else if(h3) { children.push(new Para({text:h3[1],heading:HL.HEADING_3,spacing:{before:200,after:100}})); }
      else if(h4) { children.push(new Para({text:h4[1],heading:HL.HEADING_4,spacing:{before:160,after:80}})); }
      else {
        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        const runs = parts.filter(Boolean).map(p => {
          const bm = p.match(/^\*\*(.+)\*\*$/);
          if(bm) return new TR({text:bm[1],bold:true,size:22,font:"맑은 고딕"});
          return new TR({text:p,size:22,font:"맑은 고딕"});
        });
        children.push(new Para({children:runs,spacing:{after:80,line:360},alignment:AT.JUSTIFIED}));
      }
    }
    const doc = new Doc({
      styles:{default:{document:{run:{font:"맑은 고딕",size:22}}}},
      sections:[{properties:{page:{margin:{top:1440,right:1440,bottom:1440,left:1440}}},children}]
    });
    const blob = await Pk.toBlob(doc);
    const title = st.topic ? st.topic.replace(/[^가-힣a-zA-Z0-9]/g,"_").slice(0,30) : "연구계획서";
    sa(blob, title+"_계획서.docx");
  };

  return (
    <div style={sCard}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div>
          <div style={{fontSize:14,fontWeight:700}}>연구계획서 (7쪽)</div>
          <div style={{fontSize:11,color:C.sub}}>제출 기한: 3.23~4.2 · [서식5] 준수</div>
        </div>
        {(phase==="idle"||phase==="done"||phase==="error") ? (
          <button style={sBtn("#059669","#fff",false)} onClick={startPhase1} disabled={!hasApi}>
            <Zap size={14}/> {phase==="done"?"재생성":"자동 생성"}
          </button>
        ) : (
          <span style={{...sPill(C.primaryLight,C.primary),padding:"4px 10px"}}>
            <Loader size={11} style={{animation:"spin 1s linear infinite"}}/> 진행 중
          </span>
        )}
      </div>

      {!hasApi && phase==="idle" && (
        <div style={{fontSize:11,color:"#92400e",background:"#fffbeb",borderRadius:8,padding:8,marginBottom:8,lineHeight:1.5}}>
          <AlertCircle size={11} style={{verticalAlign:"middle"}}/> API 연결 필요 — 설정 탭에서 Gemini 등 API를 먼저 연결하세요.
        </div>
      )}

      {/* Phase progress bar */}
      {phase!=="idle" && (
        <div style={{display:"flex",gap:2,marginBottom:10}}>
          {PHASES.map((p,i)=>{
            const done=i<curPhase||(phase==="done");
            const active=i===curPhase&&phase!=="done"&&phase!=="error";
            return (
              <div key={p.id} style={{flex:1,textAlign:"center"}}>
                <div style={{height:4,borderRadius:2,marginBottom:3,background:done?C.ok:active?C.primary:C.border,transition:"background .3s"}}/>
                <div style={{fontSize:9,color:done?C.ok:active?C.primary:C.muted,fontWeight:active||done?700:400}}>
                  {p.n}. {p.l}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live log */}
      {logs.length>0 && (
        <div ref={logRef} style={{background:"#0f172a",borderRadius:8,padding:10,marginBottom:8,maxHeight:160,overflowY:"auto",fontFamily:"'SF Mono',Monaco,Consolas,monospace"}}>
          {logs.map((l,i)=>(
            <div key={i} style={{fontSize:11,lineHeight:1.7,color:
              l.m.startsWith("❌")?"#f87171":
              l.m.startsWith("✅")||l.m.startsWith("🎉")?"#4ade80":
              l.m.startsWith("⭐")?"#fbbf24":
              l.m.startsWith("→")?"#60a5fa":
              l.m.startsWith("Phase")?"#c4b5fd":
              "#94a3b8"
            }}>{l.m}</div>
          ))}
        </div>
      )}

      {/* Error */}
      {err && (
        <div style={{background:C.dangerLight,borderRadius:8,padding:10,marginBottom:8,fontSize:12,color:C.danger}}>
          <AlertCircle size={12} style={{verticalAlign:"middle"}}/> {err}
        </div>
      )}

      {/* Directions */}
      {dirs && (
        <div style={{marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:6,color:C.primary,cursor:"pointer",display:"flex",alignItems:"center",gap:4}} onClick={()=>toggle("dirs")}>
            <Target size={13}/> 연구 방향 ({dirs.length}개)
            {expanded.dirs?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
          </div>
          {expanded.dirs && dirs.map((d,i)=>(
            <div key={i} onClick={()=>phase==="pick_dir"&&setSelDir(i)} style={{background:i===selDir?"#eef2ff":"#f8fafc",borderRadius:10,padding:10,marginBottom:4,borderLeft:`3px solid ${i===selDir?C.primary:C.border}`,cursor:phase==="pick_dir"?"pointer":"default",transition:"all .2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:700,color:i===selDir?C.primary:C.text}}>
                  {i===selDir&&<Star size={11} fill={C.primary} color={C.primary} style={{verticalAlign:"middle",marginRight:3}}/>}{d.name}
                </span>
                <span style={{fontSize:15,fontWeight:800,color:i===selDir?C.primary:C.muted}}>{d.total}<span style={{fontSize:9,color:C.muted}}>/70</span></span>
              </div>
              <div style={{fontSize:11,color:C.sub,marginTop:3,lineHeight:1.5}}>{d.desc}</div>
              <div style={{fontSize:10,color:"#7c3aed",marginTop:2}}>{d.diff}</div>
              <div style={{display:"flex",gap:3,marginTop:4,flexWrap:"wrap"}}>
                {d.scores&&Object.entries(d.scores).map(([k,v])=>{
                  const mx={r1:20,r2:20,r3:10,r4:10,r5:10}[k]||10;
                  return <span key={k} style={sPill(v>=mx*0.7?"#ecfdf5":"#fffbeb",v>=mx*0.7?C.ok:"#92400e")}>{k}:{v}/{mx}</span>;
                })}
              </div>
              {d.why && <div style={{fontSize:10,color:C.muted,marginTop:3,lineHeight:1.4}}>{d.why}</div>}
            </div>
          ))}
          {phase==="pick_dir" && (
            <button style={{...sBtn(C.primary,"#fff",false),width:"100%",marginTop:6,padding:"10px 0",fontSize:13,fontWeight:700}} onClick={startPhase2}>
              <ArrowRight size={14}/> 이 방향으로 진행 →
            </button>
          )}
        </div>
      )}

      {/* Strategies */}
      {strats && (
        <div style={{marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:6,color:"#7c3aed",cursor:"pointer",display:"flex",alignItems:"center",gap:4}} onClick={()=>toggle("strats")}>
            <Lightbulb size={13}/> 핵심 전략 ({strats.length}개)
            {expanded.strats?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
          </div>
          {expanded.strats && strats.map((s,i)=>(
            <div key={i} onClick={()=>phase==="pick_strat"&&setSelStrat(i)} style={{background:i===selStrat?"#f5f3ff":"#f8fafc",borderRadius:10,padding:10,marginBottom:4,borderLeft:`3px solid ${i===selStrat?"#7c3aed":C.border}`,cursor:phase==="pick_strat"?"pointer":"default",transition:"all .2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:700,color:i===selStrat?"#7c3aed":C.text}}>
                  {i===selStrat&&<Star size={11} fill="#7c3aed" color="#7c3aed" style={{verticalAlign:"middle",marginRight:3}}/>}{s.name}
                </span>
                <span style={{fontSize:15,fontWeight:800,color:i===selStrat?"#7c3aed":C.muted}}>{s.total}<span style={{fontSize:9,color:C.muted}}>/70</span></span>
              </div>
              <div style={{fontSize:11,color:C.sub,marginTop:3,lineHeight:1.5}}>{s.desc}</div>
              <div style={{display:"flex",gap:3,marginTop:4,flexWrap:"wrap"}}>
                {(s.methods||[]).map((m,j)=><span key={j} style={sPill("#f5f3ff","#7c3aed")}>{m}</span>)}
              </div>
              {s.why && <div style={{fontSize:10,color:C.muted,marginTop:3,lineHeight:1.4}}>{s.why}</div>}
            </div>
          ))}
          {phase==="pick_strat" && (
            <button style={{...sBtn("#7c3aed","#fff",false),width:"100%",marginTop:6,padding:"10px 0",fontSize:13,fontWeight:700}} onClick={startPhase3}>
              <ArrowRight size={14}/> 이 전략으로 생성 시작 →
            </button>
          )}
        </div>
      )}

      {/* Structure */}
      {struct && (
        <div style={{marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:6,cursor:"pointer",display:"flex",alignItems:"center",gap:4}} onClick={()=>toggle("struct")}>
            <BookOpen size={13} color={C.ok}/> 연구 뼈대
            {expanded.struct?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
          </div>
          {expanded.struct && (
            <div style={{background:"#f0fdf4",borderRadius:8,padding:10}}>
              <div style={{fontSize:11,fontWeight:600,marginBottom:4,color:"#166534"}}>연구문제:</div>
              {(struct.researchQuestions||[]).map((q,i)=>(
                <div key={i} style={{fontSize:11,color:"#166534",lineHeight:1.6,paddingLeft:8}}>{i+1}. {q}</div>
              ))}
              {struct.theories && <div style={{fontSize:10,color:C.ok,marginTop:6}}>이론: {struct.theories.join(", ")}</div>}
              {struct.standards && <div style={{fontSize:10,color:C.ok,marginTop:2}}>성취기준: {(struct.standards||[]).join(", ")}</div>}
              {struct.verification && <div style={{fontSize:10,color:C.ok,marginTop:2}}>검증: {struct.verification.quant} + {struct.verification.qual}</div>}
              {struct.weeklyPlan && (
                <div style={{marginTop:6}}>
                  <div style={{fontSize:10,fontWeight:600,color:"#166534",marginBottom:3}}>주차 계획 ({struct.weeklyPlan.length}주):</div>
                  <div style={{maxHeight:80,overflowY:"auto"}}>
                    {struct.weeklyPlan.map((w,i)=>(
                      <div key={i} style={{fontSize:10,color:C.sub,lineHeight:1.5,display:"flex",gap:4}}>
                        <span style={{fontWeight:600,minWidth:40,color:"#166534"}}>{w.week}</span>
                        <span>{w.activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Eval scores */}
      {finalEv && (
        <div style={{marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:6,cursor:"pointer",display:"flex",alignItems:"center",gap:4}} onClick={()=>toggle("eval")}>
            <Award size={13} color={C.warn}/> 채점 결과
            {expanded.eval?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
          </div>
          {expanded.eval && (<>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
              {ev1 && <div style={{textAlign:"center"}}><div style={{fontSize:9,color:C.muted}}>1차</div><div style={{fontSize:22,fontWeight:800,color:ev2?C.muted:C.primary}}>{ev1.total}</div></div>}
              {ev2 && <>
                <ArrowRight size={14} color={C.muted}/>
                <div style={{textAlign:"center"}}><div style={{fontSize:9,color:C.muted}}>최종</div><div style={{fontSize:22,fontWeight:800,color:C.ok}}>{ev2.total}</div></div>
                <span style={sPill(C.okLight,C.ok)}>+{(ev2.total||0)-(ev1?.total||0)}</span>
              </>}
              <span style={{fontSize:10,color:C.muted}}>/70점</span>
            </div>
            {finalEv.scores?.map(s=>{
              const pct=s.max>0?(s.score/s.max)*100:0;
              const c=pct>=80?C.ok:pct>=60?C.warn:C.danger;
              const label=PLAN_EVAL_ITEMS.find(x=>x.id===s.id)?.label||s.id;
              return (
                <div key={s.id} style={{marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
                    <span style={{color:C.sub}}>{label}</span>
                    <span style={{fontWeight:700,color:c}}>{s.score}/{s.max}</span>
                  </div>
                  <div style={{height:4,background:C.border,borderRadius:2}}>
                    <div style={{height:"100%",width:`${pct}%`,background:c,borderRadius:2,transition:"width .3s"}}/>
                  </div>
                  {s.issue && <div style={{fontSize:10,color:C.muted,marginTop:1}}>{s.issue}</div>}
                </div>
              );
            })}
            {finalEv.summary && <div style={{fontSize:11,color:C.sub,marginTop:6,lineHeight:1.5,fontStyle:"italic"}}>{finalEv.summary}</div>}
          </>)}
        </div>
      )}

      {/* Plan content editor */}
      {st.sections.plan?.content && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{fontSize:12,fontWeight:700}}>계획서 본문 {phase==="done"&&<span style={sPill(C.okLight,C.ok)}>완성</span>}</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:10,color:C.muted}}>{st.sections.plan.content.length}자</span>
              {phase==="done" && (
                <button style={{...sBtn("#2563eb","#fff",true),fontSize:11,padding:"4px 10px"}} onClick={exportDocx}>
                  <FileDown size={12}/> DOCX 내보내기
                </button>
              )}
            </div>
          </div>
          <textarea value={st.sections.plan.content} rows={10}
            onChange={e=>dispatch({type:"SET_SECTION",id:"plan",data:{content:e.target.value}})}
            style={{width:"100%",boxSizing:"border-box",padding:10,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,lineHeight:1.6,resize:"vertical",fontFamily:"inherit"}}/>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════
// 보고서 작성 탭
// ══════════════════════════════
function WriteView({ st, dispatch }) {
  const [openId, setOpenId] = useState(null);
  const [showTip, setShowTip] = useState(null);
  const [genLoading, setGenLoading] = useState(null); // section id or "plan"
  const [genClipboard, setGenClipboard] = useState(null); // {prompt, sectionId}
  const [genPaste, setGenPaste] = useState("");
  const hasApi = st.apiProvider!=="none" && (st.apiKey || AI_PROVIDERS[st.apiProvider]?.authStyle==="none");

  const generateSection = async (section) => {
    const prompt = buildDraftPrompt(section, st);
    if(!hasApi) { setGenClipboard({ prompt, sectionId:section.id }); return; }
    setGenLoading(section.id);
    try {
      const raw = await callAI(prompt, st);
      dispatch({ type:"SET_SECTION", id:section.id, data:{ content:raw } });
    } catch(e) { alert("생성 실패: "+e.message); }
    setGenLoading(null);
  };

  const generatePlan = async () => {
    const prompt = buildPlanPrompt(st);
    if(!hasApi) { setGenClipboard({ prompt, sectionId:"plan" }); return; }
    setGenLoading("plan");
    try {
      const raw = await callAI(prompt, st);
      dispatch({ type:"SET_SECTION", id:"plan", data:{ content:raw } });
    } catch(e) { alert("생성 실패: "+e.message); }
    setGenLoading(null);
  };

  const handleGenPaste = () => {
    if(!genClipboard || !genPaste) return;
    dispatch({ type:"SET_SECTION", id:genClipboard.sectionId, data:{ content:genPaste } });
    setGenClipboard(null); setGenPaste("");
  };

  return (
    <div>
      <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:4 }}>보고서 작성</div>
      <div style={{ fontSize:12, color:C.sub, marginBottom:14, lineHeight:1.5 }}>
        각 섹션을 펼쳐 가이드를 읽고, AI 생성 또는 직접 작성하세요.<br/>
        참고자료(우수작 등)를 설정 탭에서 추가하면 AI가 참조합니다.
      </div>

      {/* 참고자료 현황 */}
      {st.references.length > 0 && (
        <div style={{ ...sCard, background:"#f0fdf4", borderColor:"#bbf7d0" }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.ok, marginBottom:4 }}>
            <BookOpen size={12} style={{verticalAlign:"middle"}}/> 참고자료 {st.references.length}건 등록됨
          </div>
          <div style={{ fontSize:11, color:"#166534" }}>
            {st.references.map(r=>r.title).join(", ")} — AI 생성 시 자동 참조됩니다.
          </div>
        </div>
      )}
      {st.references.length === 0 && (
        <div style={{ ...sCard, background:"#fffbeb", borderColor:"#fde68a" }}>
          <div style={{ fontSize:12, color:"#92400e", lineHeight:1.5 }}>
            <AlertCircle size={12} style={{verticalAlign:"middle"}}/> <strong>참고자료를 추가하면 AI 품질이 크게 향상됩니다.</strong><br/>
            설정 탭 → 참고자료에서 우수작 보고서, 연구계획서 예시 등의 텍스트를 붙여넣으세요.
          </div>
        </div>
      )}

      {/* 연구계획서 — 자동 파이프라인 */}
      <PlanPipeline st={st} dispatch={dispatch}/>

      {/* 클립보드 모드 */}
      {genClipboard && (
        <div style={sCard}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>프롬프트 복사 → AI에 붙여넣기</div>
          <textarea readOnly value={genClipboard.prompt} rows={4}
            style={{ width:"100%", boxSizing:"border-box", padding:8, border:`1px solid ${C.border}`, borderRadius:8, fontSize:11, fontFamily:"monospace", background:"#f8fafc" }} />
          <button style={{ ...sBtn(C.primary,"#fff",true), marginTop:4 }} onClick={()=>navigator.clipboard.writeText(genClipboard.prompt)}><Copy size={12}/> 복사</button>
          <div style={{ fontSize:12, color:C.sub, margin:"8px 0 4px" }}>AI 응답 붙여넣기:</div>
          <textarea value={genPaste} onChange={e=>setGenPaste(e.target.value)} rows={5} placeholder="AI가 생성한 내용을 여기에..."
            style={{ width:"100%", boxSizing:"border-box", padding:8, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, fontFamily:"inherit" }} />
          <div style={{ display:"flex", gap:6, marginTop:6 }}>
            <button style={sBtn(C.ok,"#fff",true)} onClick={handleGenPaste}><Check size={12}/> 반영</button>
            <button style={sBtn("#f1f5f9",C.sub,true)} onClick={()=>{setGenClipboard(null);setGenPaste("")}}><X size={12}/> 취소</button>
          </div>
        </div>
      )}

      <div style={{ fontSize:14, fontWeight:700, color:C.text, margin:"16px 0 8px" }}>연구보고서 (25쪽)</div>

      {SECTIONS.map(s => {
        const data = st.sections[s.id] || {};
        const content = data.content || "";
        const isOpen = openId === s.id;
        const charCount = content.length;
        const checkCount = s.checklist.length;
        const checkedCount = Object.values(data.selfScores||{}).filter(Boolean).length;
        const status = charCount > 50 ? (checkedCount === checkCount ? "완료" : "작성중") : "미작성";
        const statusColor = status==="완료"?C.ok:status==="작성중"?C.warn:C.muted;

        return (
          <div key={s.id} style={{ ...sCard, borderLeft:`3px solid ${statusColor}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }} onClick={() => setOpenId(isOpen?null:s.id)}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{s.num}. {s.title}</div>
                <div style={{ display:"flex", gap:6, marginTop:4 }}>
                  <span style={sPill(statusColor+"18", statusColor)}>{status}</span>
                  <span style={{ fontSize:11, color:C.muted }}>{s.pages}</span>
                  {checkedCount>0 && <span style={sPill(C.okLight,C.ok)}>{checkedCount}/{checkCount} 체크</span>}
                </div>
              </div>
              {isOpen ? <ChevronUp size={18} color={C.muted}/> : <ChevronDown size={18} color={C.muted}/>}
            </div>

            {isOpen && (
              <div style={{ marginTop:12 }}>
                {/* 가이드 */}
                <div style={{ background:"#f0f9ff", borderRadius:10, padding:12, marginBottom:10, fontSize:12, color:"#0c4a6e", lineHeight:1.6 }}>
                  <div style={{ fontWeight:700, marginBottom:4 }}><Eye size={12} style={{verticalAlign:"middle"}}/> 심사위원의 시선</div>
                  {s.guide}
                </div>

                {/* 우수작 패턴 (보고서 항목에만) */}
                {REPORT_RUBRIC.filter(r => {
                  if(s.id==="s1") return ["r1"].includes(r.id);
                  if(s.id==="s2") return ["r1","r3"].includes(r.id);
                  if(s.id==="s3") return ["r2","r3","r6"].includes(r.id);
                  if(s.id==="s4") return ["r5"].includes(r.id);
                  if(s.id==="s5") return ["r7"].includes(r.id);
                  if(s.id==="s6") return ["r8","r9"].includes(r.id);
                  return false;
                }).map(r => (
                  <div key={r.id} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer", fontSize:11, color:C.primary, fontWeight:600 }} onClick={() => setShowTip(showTip===r.id?null:r.id)}>
                      <Lightbulb size={12}/> [{r.sub} {r.max}점] 고득점 전략
                      {showTip===r.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                    </div>
                    {showTip===r.id && (
                      <div style={{ background:"#fffbeb", borderRadius:8, padding:10, marginTop:4, fontSize:11, lineHeight:1.6 }}>
                        <div style={{ color:"#92400e", marginBottom:4 }}><strong>팁:</strong> {r.tip}</div>
                        {r.winnerPattern && <div style={{ color:"#78350f" }}><strong>우수작 패턴:</strong> {r.winnerPattern}</div>}
                      </div>
                    )}
                  </div>
                ))}

                {/* 생성/템플릿 버튼 */}
                <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                  <button style={{ ...sBtn(C.primary,"#fff",true), flex:1 }} onClick={() => generateSection(s)} disabled={genLoading===s.id}>
                    {genLoading===s.id ? <Loader size={12} style={{animation:"spin 1s linear infinite"}}/> : <Zap size={12}/>}
                    {content ? " AI 재생성" : " AI로 초안 생성"}
                  </button>
                  {!content && (
                    <button style={{ ...sBtn("#f1f5f9",C.sub,true), flex:1 }}
                      onClick={() => dispatch({ type:"SET_SECTION", id:s.id, data:{ content:s.template } })}>
                      <BookOpen size={12}/> 템플릿으로 시작
                    </button>
                  )}
                </div>

                {/* 에디터 */}
                <textarea value={content} rows={10}
                  onChange={e => dispatch({ type:"SET_SECTION", id:s.id, data:{ content:e.target.value } })}
                  placeholder={`${s.title} 내용을 여기에 작성하세요...\n\n가이드와 템플릿을 참고하세요.`}
                  style={{ width:"100%", boxSizing:"border-box", padding:12, border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, lineHeight:1.7, resize:"vertical", fontFamily:"inherit", minHeight:200 }} />
                <div style={{ fontSize:10, color:C.muted, textAlign:"right", marginTop:2 }}>{charCount}자</div>

                {/* 자가평가 체크리스트 */}
                <div style={{ marginTop:12, background:"#f8fafc", borderRadius:10, padding:12 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:8 }}>
                    <ClipboardList size={13} style={{verticalAlign:"middle"}}/> 자가평가 체크리스트
                  </div>
                  {s.checklist.map((item, idx) => {
                    const checked = data.selfScores?.[idx] || false;
                    return (
                      <label key={idx} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"4px 0", fontSize:12, color:C.sub, cursor:"pointer", lineHeight:1.5 }}>
                        <input type="checkbox" checked={checked} style={{ marginTop:3 }}
                          onChange={() => {
                            const sc = { ...(data.selfScores||{}) };
                            sc[idx] = !checked;
                            dispatch({ type:"SET_SECTION", id:s.id, data:{ selfScores:sc } });
                          }} />
                        {item}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════
// 수업 기록 탭
// ══════════════════════════════
function LogView({ st, dispatch }) {
  const [form, setForm] = useState({});
  const [openId, setOpenId] = useState(null);

  return (
    <div>
      <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:4 }}>수업 기록</div>
      <div style={{ fontSize:12, color:C.sub, marginBottom:14, lineHeight:1.5 }}>
        매 수업 후 기록하세요. 이 데이터가 보고서 Ⅲ·Ⅳ장의 핵심 근거이며, AI 심사 시 자동 포함됩니다.
      </div>

      <div style={sCard}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>새 기록</div>
        {[
          {k:"date",l:"날짜",ph:"2026-06-01",half:true},
          {k:"subject",l:"교과/단원",ph:st.subject?`${st.subject} ...`:"국어 3단원",half:true},
          {k:"strategy",l:"적용 전략",ph:"패드 활용 동료 평가"},
          {k:"observation",l:"학생 관찰",ph:"A학생: 발표 3→7회 증가",ta:true},
          {k:"data",l:"정량 데이터",ph:"발표 4.2→6.8회\n제출률 85%→94%",ta:true},
          {k:"reflection",l:"교사 성찰",ph:"학생 주도 평가 기준이 효과적",ta:true},
        ].map(f => (
          <div key={f.k} style={{ marginBottom:6, flex:f.half?"1 1 calc(50% - 4px)":"1 1 100%", display:"inline-block", width:f.half?"calc(50% - 4px)":"100%", verticalAlign:"top", paddingRight:f.half?4:0, boxSizing:"border-box" }}>
            <label style={{ fontSize:11, color:C.sub, display:"block", marginBottom:2 }}>{f.l}</label>
            {f.ta ? (
              <textarea value={form[f.k]||""} onChange={e=>setForm({...form,[f.k]:e.target.value})} placeholder={f.ph} rows={2}
                style={{ width:"100%", boxSizing:"border-box", padding:8, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, resize:"vertical", fontFamily:"inherit" }} />
            ) : (
              <input value={form[f.k]||""} onChange={e=>setForm({...form,[f.k]:e.target.value})} placeholder={f.ph}
                style={{ width:"100%", boxSizing:"border-box", padding:8, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12 }} />
            )}
          </div>
        ))}
        <div style={{ textAlign:"right", marginTop:4 }}>
          <button style={sBtn(C.primary,"#fff",true)} onClick={() => { if(!form.date||!form.subject)return; dispatch({type:"ADD_LOG",log:form}); setForm({}); }}>
            <Plus size={14}/> 기록 추가
          </button>
        </div>
      </div>

      <div style={{ fontSize:13, fontWeight:700, margin:"12px 0 8px" }}>기록 목록 <span style={sPill(C.primaryLight,C.primary)}>{st.logs.length}건</span></div>
      {st.logs.length===0 && <div style={{ ...sCard, textAlign:"center", color:C.muted, fontSize:12, padding:24 }}>아직 기록이 없습니다</div>}
      {[...st.logs].reverse().map(l => (
        <div key={l.id} style={sCard}>
          <div style={{ display:"flex", justifyContent:"space-between", cursor:"pointer" }} onClick={() => setOpenId(openId===l.id?null:l.id)}>
            <div><strong style={{ fontSize:13 }}>{l.date}</strong> <span style={{ fontSize:12, color:C.sub }}>{l.subject}</span> {l.strategy && <span style={sPill(C.primaryLight,C.primary)}>{l.strategy}</span>}</div>
            {openId===l.id?<ChevronUp size={16} color={C.muted}/>:<ChevronDown size={16} color={C.muted}/>}
          </div>
          {openId===l.id && (
            <div style={{ marginTop:8, fontSize:12, color:C.sub, lineHeight:1.6 }}>
              {l.observation && <div><strong>관찰:</strong> {l.observation}</div>}
              {l.data && <div><strong>데이터:</strong> {l.data}</div>}
              {l.reflection && <div><strong>성찰:</strong> {l.reflection}</div>}
              <button style={{ ...sBtn(C.dangerLight,C.danger,true), marginTop:6 }} onClick={() => dispatch({type:"DEL_LOG",id:l.id})}><Trash2 size={12}/> 삭제</button>
            </div>
          )}
        </div>
      ))}

      <div style={{ fontSize:13, fontWeight:700, margin:"16px 0 8px" }}>사전-사후 데이터</div>
      <div style={sCard}>
        {st.analysis.map((a,i) => (
          <div key={a.id} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:C.sub, minWidth:90 }}>{a.label}</span>
            <input placeholder="사전" value={a.pre} style={{ flex:1, minWidth:50, padding:6, border:`1px solid ${C.border}`, borderRadius:6, fontSize:12, boxSizing:"border-box" }}
              onChange={e => { const items=[...st.analysis]; items[i]={...items[i],pre:e.target.value}; dispatch({type:"SET_ANALYSIS",items}); }} />
            <ArrowRight size={12} color={C.muted}/>
            <input placeholder="사후" value={a.post} style={{ flex:1, minWidth:50, padding:6, border:`1px solid ${C.border}`, borderRadius:6, fontSize:12, boxSizing:"border-box" }}
              onChange={e => { const items=[...st.analysis]; items[i]={...items[i],post:e.target.value}; dispatch({type:"SET_ANALYSIS",items}); }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════
// AI 심사 + 개선 루프 통합 탭
// ══════════════════════════════
function EvalView({ st, dispatch }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [paste, setPaste] = useState("");
  const [activeType, setActiveType] = useState("report");
  const hasApi = st.apiProvider!=="none" && (st.apiKey || AI_PROVIDERS[st.apiProvider]?.authStyle==="none");

  const buildData = () => {
    const secs = SECTIONS.map(s => `### ${s.num}. ${s.title}\n${st.sections[s.id]?.content || "(미작성)"}`).join("\n\n");
    const logs = st.logs.length>0 ? st.logs.map(l => `[${l.date}] ${l.subject} | ${l.strategy}\n관찰: ${l.observation||"-"}\n데이터: ${l.data||"-"}`).join("\n\n") : "(기록 없음)";
    const anal = st.analysis.map(a => `${a.label}: ${a.pre||"?"} → ${a.post||"?"}`).join("\n");
    return `## 보고서 초안\n${secs}\n\n## 수업 기록 (${st.logs.length}건)\n${logs}\n\n## 사전-사후\n${anal}`;
  };

  const run = async (type) => {
    const rubric = type==="report" ? REPORT_RUBRIC : VIDEO_RUBRIC;
    const prompt = buildEvalPrompt(rubric, buildData(), type);
    if(!hasApi) { setClipboard(prompt); setActiveType(type); return; }
    setLoading(true); setError(null);
    try {
      const raw = await callAI(prompt, st);
      const p = parseJSON(raw);
      if(!p) throw new Error("파싱 실패");
      dispatch({type:"ADD_EVAL",ev:{type,scores:p.scores,total:p.total,summary:p.summary,top3:p.top3||p.top3_priorities}});
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const handlePaste = () => {
    const p = parseJSON(paste);
    if(!p) { setError("JSON 파싱 실패"); return; }
    dispatch({type:"ADD_EVAL",ev:{type:activeType,scores:p.scores,total:p.total,summary:p.summary,top3:p.top3||p.top3_priorities}});
    setClipboard(null); setPaste("");
  };

  const rEval = latest(st.evalHistory,"report");
  const vEval = latest(st.evalHistory,"video");

  // ROI
  const roi = [];
  [rEval,vEval].forEach((ev,ti) => {
    if(!ev?.scores) return;
    const rub = ti===0?REPORT_RUBRIC:VIDEO_RUBRIC;
    ev.scores.forEach(s => { const g=s.max-s.score; if(g>0) roi.push({...s,tLabel:ti===0?"보고서":"동영상",gain:g,rubric:rub.find(r=>r.id===s.id)}); });
  });
  roi.sort((a,b) => b.gain-a.gain);

  return (
    <div>
      <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:4 }}>AI 심사 & 개선</div>
      <div style={{ fontSize:12, color:C.sub, marginBottom:14, lineHeight:1.5 }}>
        작성한 보고서·수업 기록을 심사기준 200점으로 자동 채점합니다.
        {!hasApi && " API 없이도 프롬프트 복사→AI 붙여넣기로 동작합니다."}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <button style={sBtn("#6366f1","#fff",false)} onClick={()=>run("report")} disabled={loading}>
          {loading?<Loader size={14} style={{animation:"spin 1s linear infinite"}}/>:<FileText size={14}/>} 보고서 심사
        </button>
        <button style={sBtn("#7c3aed","#fff",false)} onClick={()=>run("video")} disabled={loading}>
          {loading?<Loader size={14} style={{animation:"spin 1s linear infinite"}}/>:<Play size={14}/>} 동영상 심사
        </button>
      </div>

      {error && <div style={{ ...sCard, background:C.dangerLight }}><span style={{ fontSize:12, color:C.danger }}><AlertCircle size={14}/> {error}</span></div>}

      {clipboard && (
        <div style={sCard}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>프롬프트 복사 → AI에 붙여넣기</div>
          <textarea readOnly value={clipboard} rows={5} style={{ width:"100%", boxSizing:"border-box", padding:8, border:`1px solid ${C.border}`, borderRadius:8, fontSize:11, fontFamily:"monospace", background:"#f8fafc" }} />
          <button style={{ ...sBtn(C.primary,"#fff",true), marginTop:4 }} onClick={() => navigator.clipboard.writeText(clipboard)}><Copy size={12}/> 복사</button>
          <div style={{ fontSize:12, color:C.sub, margin:"8px 0 4px" }}>AI 응답 붙여넣기:</div>
          <textarea value={paste} onChange={e=>setPaste(e.target.value)} rows={5} placeholder="JSON 응답을 여기에..."
            style={{ width:"100%", boxSizing:"border-box", padding:8, border:`1px solid ${C.border}`, borderRadius:8, fontSize:11, fontFamily:"monospace" }} />
          <div style={{ display:"flex", gap:6, marginTop:6 }}>
            <button style={sBtn(C.ok,"#fff",true)} onClick={handlePaste}><Check size={12}/> 반영</button>
            <button style={sBtn("#f1f5f9",C.sub,true)} onClick={()=>{setClipboard(null);setPaste("")}}><X size={12}/> 취소</button>
          </div>
        </div>
      )}

      {rEval && <EvalCard ev={rEval} title="보고서" rubric={REPORT_RUBRIC} color="#6366f1"/>}
      {vEval && <EvalCard ev={vEval} title="동영상" rubric={VIDEO_RUBRIC} color="#7c3aed"/>}

      {/* 감점 */}
      <div style={{ ...sCard, marginTop:4 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>감점 체크</div>
        {PENALTY_ITEMS.map((p,i) => (
          <label key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 0", fontSize:12, color:C.sub, cursor:"pointer" }}>
            <input type="checkbox" checked={st.penalties.has(i)} onChange={()=>dispatch({type:"TOGGLE_P",i})} />
            <span style={{ flex:1 }}>{p.item}</span>
            <span style={sPill(C.dangerLight,C.danger)}>-{p.p}</span>
          </label>
        ))}
      </div>

      {/* ROI */}
      {roi.length>0 && (
        <>
          <div style={{ fontSize:14, fontWeight:700, margin:"16px 0 8px" }}>개선 ROI 순위</div>
          <div style={{ fontSize:11, color:C.sub, marginBottom:8 }}>위에서부터 개선하면 점수 상승 효과 최대</div>
          {roi.slice(0,8).map((item,i) => (
            <div key={`${item.id}-${i}`} style={{ ...sCard, borderLeft:`3px solid ${i===0?C.danger:i<3?C.warn:C.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <span style={sPill(i===0?C.dangerLight:i<3?C.warnLight:"#f1f5f9",i===0?C.danger:i<3?"#92400e":C.sub)}>#{i+1} {item.tLabel}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.text, marginLeft:6 }}>{item.rubric?.sub||item.id}</span>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:C.muted }}>{item.score}/{item.max}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:C.ok }}>+{item.gain}점</div>
                </div>
              </div>
              {item.improvements?.map((imp,j) => (
                <div key={j} style={{ fontSize:12, color:C.primary, display:"flex", gap:4, marginTop:4, lineHeight:1.4 }}>
                  <ArrowUpRight size={12} style={{ flexShrink:0, marginTop:1 }}/> {imp}
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function EvalCard({ ev, title, rubric, color }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...sCard, borderLeft:`3px solid ${color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }} onClick={()=>setOpen(!open)}>
        <div>
          <div style={{ fontSize:13, fontWeight:700 }}>{title} 심사 결과</div>
          <div style={{ fontSize:10, color:C.muted }}>{new Date(ev.ts).toLocaleString("ko-KR")}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:24, fontWeight:800, color }}>{ev.total}</span><span style={{ fontSize:12, color:C.muted }}>/100</span>
          {open?<ChevronUp size={16}/>:<ChevronDown size={16}/>}
        </div>
      </div>
      {ev.summary && <div style={{ fontSize:12, color:C.sub, marginTop:6, lineHeight:1.5 }}>{ev.summary}</div>}
      {open && ev.scores?.map(s => {
        const r = rubric.find(x=>x.id===s.id);
        const pct = s.max>0?(s.score/s.max)*100:0;
        const bc = pct>=80?C.ok:pct>=60?C.warn:C.danger;
        return (
          <div key={s.id} style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontSize:12, fontWeight:600 }}>{r?.sub||s.id}</span>
              <span style={{ fontSize:12, fontWeight:700, color:bc }}>{s.score}/{s.max}</span>
            </div>
            <div style={{ height:4, background:C.border, borderRadius:2, marginBottom:4 }}>
              <div style={{ height:"100%", width:`${pct}%`, background:bc, borderRadius:2 }}/>
            </div>
            {s.reasoning && <div style={{ fontSize:11, color:C.sub, lineHeight:1.4 }}>{s.reasoning}</div>}
            {s.improvements?.map((imp,i) => (
              <div key={i} style={{ fontSize:11, color:C.primary, display:"flex", gap:4, marginTop:2 }}>
                <Lightbulb size={11} style={{flexShrink:0,marginTop:1}}/> {imp}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════
// 설정
// ══════════════════════════════
function SettingsView({ st, dispatch }) {
  const [pI, setPI] = useState(st.apiProvider);
  const [kI, setKI] = useState(st.apiKey);
  const [bI, setBI] = useState(st.apiBaseUrl||"");
  const [mI, setMI] = useState(st.apiModel||"");
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | "testing" | "ok" | "fail"
  const [testMsg, setTestMsg]   = useState("");
  const fRef = useRef();
  const preset = AI_PROVIDERS[pI] || AI_PROVIDERS.custom;

  const handleProviderChange = (v) => {
    setPI(v); setTestStatus(null); setTestMsg("");
    const p = AI_PROVIDERS[v];
    if (p) { setBI(p.baseUrl); setMI(p.model); }
  };
  const handleSave = () => {
    dispatch({ type:"SET_API", provider:pI, key:kI, baseUrl:bI, model:mI });
    setSaved(true); setTestStatus(null);
    setTimeout(()=>setSaved(false), 2000);
  };
  const handleTest = async () => {
    setTestStatus("testing"); setTestMsg("");
    try {
      const mockSt = { apiProvider:pI, apiKey:kI, apiBaseUrl:bI, apiModel:mI };
      const res = await testCallAI(mockSt);
      setTestStatus("ok");
      setTestMsg(res?.replace(/\n/g," ")?.slice(0,40)||"응답 수신");
    } catch(e) {
      setTestStatus("fail");
      setTestMsg(e.message?.slice(0,80)||"알 수 없는 오류");
    }
  };

  return (
    <div>
      <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:14 }}>설정</div>

      <div style={sCard}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>내 정보</div>
        <div style={{ fontSize:12, color:C.sub, lineHeight:1.6 }}>
          지역: <strong>{REGIONS[st.region]?.label||"미설정"}</strong><br/>
          교과: <strong>{st.subject||"미설정"}</strong> · 학년: <strong>{st.grade||"미설정"}</strong><br/>
          {st.topic && <>주제: <strong>{st.topic}</strong></>}
        </div>
        <button style={{ ...sBtn("#f1f5f9",C.sub,true), marginTop:8 }} onClick={() => dispatch({type:"SET",k:"onboarded",v:false})}>
          <RotateCcw size={12}/> 기본정보 다시 설정
        </button>
      </div>

      <div style={sCard}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>AI API 연결</div>

        {/* 샌드박스 환경 감지 배너 */}
        {detectEnv()==="sandbox" && (
          <div style={{ background:"linear-gradient(135deg,#1e1b4b,#312e81)", borderRadius:10, padding:"10px 12px", marginBottom:10, color:"#e0e7ff", fontSize:11, lineHeight:1.7 }}>
            <strong style={{ color:"#fbbf24" }}>⚡ 미리보기 환경</strong> — 외부 API 직접 호출이 차단됩니다.<br/>
            <strong style={{ color:"#fff" }}>프롬프트 복사 모드</strong>로 모든 기능을 사용할 수 있습니다:<br/>
            ① 작성/심사 탭에서 버튼 클릭 → 프롬프트 자동 복사<br/>
            ② ChatGPT·Claude 등 원하는 AI에 붙여넣기 → 응답 복사<br/>
            ③ 앱에 붙여넣기 → 반영 완료<br/>
            <span style={{ color:"#a5b4fc", fontSize:10 }}>Vite로 로컬 실행하면 원클릭 API 호출이 가능합니다.</span>
          </div>
        )}

        <div style={{ fontSize:11, color:C.sub, marginBottom:10, lineHeight:1.5 }}>
          {detectEnv()==="standalone"
            ? <>Claude·Gemini·Groq·Together·Fireworks 등 <strong>브라우저 호출 가능 서비스</strong>를 연결하면 원클릭 생성·심사.<br/>API 없이도 프롬프트 복사 모드로 100% 동작합니다.</>
            : <>아래에서 서비스를 선택해 키를 저장하면, Vite 실행 시 자동 연결됩니다.<br/><strong>지금은 수동 복사 모드로 모든 기능이 동작합니다.</strong></>
          }
        </div>

        {/* 프로바이더 선택 — 그룹별 */}
        <label style={{ fontSize:11, color:C.sub, display:"block", marginBottom:4 }}>서비스 선택</label>
        <select value={pI} onChange={e=>handleProviderChange(e.target.value)}
          style={{ width:"100%", padding:8, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, marginBottom:10, boxSizing:"border-box", background:"#fff" }}>
          {(() => {
            const groups = {};
            Object.entries(AI_PROVIDERS).forEach(([k,v]) => {
              const g = v.group||"기타";
              if (!groups[g]) groups[g] = [];
              groups[g].push([k,v]);
            });
            return Object.entries(groups).map(([g, items]) => (
              <optgroup key={g} label={g}>
                {items.map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </optgroup>
            ));
          })()}
        </select>

        {/* CORS 차단 서비스 경고 */}
        {preset.cors === false && (
          <div style={{ background:"#fef2f2", border:`1px solid #fecaca`, borderRadius:8, padding:"8px 10px", marginBottom:10, fontSize:11, color:C.danger, lineHeight:1.6 }}>
            <AlertCircle size={11} style={{verticalAlign:"middle",marginRight:3}}/><strong>브라우저 직접 호출 불가 (CORS 차단)</strong><br/>
            이 서비스는 보안상 브라우저에서 API를 직접 호출할 수 없습니다.<br/>
            <strong>해결 방법:</strong> 저장 후 작성·심사 탭에서 "프롬프트 복사" 버튼으로 프롬프트를 복사해, 해당 서비스 웹사이트에서 직접 실행하세요.
          </div>
        )}

        {/* CORS 미확인 서비스 주의 */}
        {preset.cors === null && pI!=="none" && (
          <div style={{ background:"#fffbeb", border:`1px solid #fde68a`, borderRadius:8, padding:"6px 10px", marginBottom:8, fontSize:11, color:"#92400e", lineHeight:1.5 }}>
            <AlertCircle size={11} style={{verticalAlign:"middle",marginRight:3}}/> CORS 지원 미확인 서비스입니다. 연결 테스트로 확인하세요.
          </div>
        )}

        {/* 프로바이더별 설정 안내 노트 */}
        {preset.note && (
          <div style={{ background:"#f0f9ff", border:`1px solid #bae6fd`, borderRadius:8, padding:"8px 10px", marginBottom:10, fontSize:11, color:"#0c4a6e", lineHeight:1.6 }}>
            <HelpCircle size={11} style={{verticalAlign:"middle",marginRight:3}}/><strong>설정 안내:</strong> {preset.note}
          </div>
        )}

        {/* AWS Bedrock 불가 안내 */}
        {pI==="custom" && (
          <div style={{ background:"#f8fafc", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", marginBottom:8, fontSize:10, color:C.sub, lineHeight:1.5 }}>
            ※ AWS Bedrock은 브라우저에서 SigV4 서명 인증이 필요해 직접 연결 불가. 프록시 서버를 구성하거나 수동 모드를 사용하세요.
          </div>
        )}

        {pI!=="none" && (
          <>
            {/* API 키 */}
            {preset.authStyle !== "none" && (
              <>
                <label style={{ fontSize:11, color:C.sub, display:"block", marginBottom:4 }}>
                  {pI==="vertex" ? "Access Token" : pI==="azure" ? "API 키 (리소스 → 키 및 엔드포인트)" : "API 키"}
                </label>
                <input type="password" value={kI} onChange={e=>setKI(e.target.value)} placeholder={preset.placeholder||"API Key"}
                  style={{ width:"100%", boxSizing:"border-box", padding:8, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, marginBottom:8 }}/>
              </>
            )}

            {/* Base URL */}
            <label style={{ fontSize:11, color:C.sub, display:"block", marginBottom:4 }}>
              Base URL{pI!=="custom" && pI!=="vertex" && pI!=="azure" && <span style={{ color:C.muted }}> (자동 · 변경 가능)</span>}
            </label>
            <input value={bI} onChange={e=>setBI(e.target.value)} placeholder="https://api.example.com"
              style={{ width:"100%", boxSizing:"border-box", padding:8, border:`1px solid ${C.border}`, borderRadius:8, fontSize:11, marginBottom:8, fontFamily:"monospace", color:C.text }}/>

            {/* 모델명 — Azure는 배포명에 포함되므로 숨김 */}
            {pI!=="azure" && (
              <>
                <label style={{ fontSize:11, color:C.sub, display:"block", marginBottom:4 }}>
                  모델{pI!=="custom" && <span style={{ color:C.muted }}> (자동 · 변경 가능)</span>}
                </label>
                <input value={mI} onChange={e=>setMI(e.target.value)} placeholder="모델명 (예: gpt-4o)"
                  style={{ width:"100%", boxSizing:"border-box", padding:8, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, marginBottom:10 }}/>
              </>
            )}
          </>
        )}

        {/* 저장 + 연결 테스트 */}
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <button style={{ ...sBtn(saved?C.ok:C.primary,"#fff",true), transition:"background .2s" }} onClick={handleSave}>
            {saved ? <><Check size={12}/> 저장 완료</> : <><Check size={12}/> 저장</>}
          </button>
          {pI!=="none" && preset.cors !== false && (
            <button style={sBtn("#f1f5f9",C.sub,true)} onClick={handleTest} disabled={testStatus==="testing"}>
              {testStatus==="testing"
                ? <><Loader size={12} style={{animation:"spin 1s linear infinite"}}/> 테스트 중…</>
                : <><Zap size={12}/> 연결 테스트</>}
            </button>
          )}
        </div>

        {/* 실제 연결 상태 표시 */}
        {testStatus==="ok" && (
          <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6, fontSize:11, color:C.ok }}>
            <CheckCircle size={13}/> <strong>연결 성공</strong> — 응답: "{testMsg}"
          </div>
        )}
        {testStatus==="fail" && (
          <div style={{ marginTop:8, display:"flex", alignItems:"flex-start", gap:6, fontSize:11, color:C.danger }}>
            <AlertCircle size={13} style={{flexShrink:0,marginTop:1}}/> <span><strong>연결 실패</strong> — {testMsg}</span>
          </div>
        )}
        {testStatus===null && st.apiProvider!=="none" && (() => {
          const saved_preset = AI_PROVIDERS[st.apiProvider];
          const name = saved_preset?.label?.replace(/ [✅⚠].*/,"") || st.apiProvider;
          if (saved_preset?.cors === false) {
            return (
              <div style={{ marginTop:8, fontSize:11, color:"#92400e" }}>
                <AlertCircle size={11} style={{verticalAlign:"middle"}}/> 저장된 서비스: <strong>{name}</strong> — CORS 차단 서비스이므로 <strong>수동 복사 모드</strong>로 동작합니다.
              </div>
            );
          }
          return (
            <div style={{ marginTop:8, fontSize:11, color:C.muted }}>
              저장된 서비스: <strong style={{color:C.sub}}>{name}</strong> — 연결 테스트로 실제 동작을 확인하세요.
            </div>
          );
        })()}
      </div>

      <div style={sCard}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>데이터</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          <button style={sBtn("#f1f5f9",C.sub,true)} onClick={() => {
            const b=new Blob([JSON.stringify(ser(st),null,2)],{type:"application/json"});
            const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=`coach_${new Date().toISOString().slice(0,10)}.json`; a.click();
          }}><Download size={12}/> 내보내기</button>
          <button style={sBtn("#f1f5f9",C.sub,true)} onClick={()=>fRef.current?.click()}><Upload size={12}/> 가져오기</button>
          <input ref={fRef} type="file" accept=".json" style={{display:"none"}} onChange={e => {
            const f=e.target.files[0]; if(!f)return;
            const r=new FileReader(); r.onload=ev=>{try{dispatch({type:"LOAD",data:JSON.parse(ev.target.result)})}catch{alert("형식 오류")}}; r.readAsText(f);
          }}/>
          <button style={sBtn(C.dangerLight,C.danger,true)} onClick={()=>{if(confirm("초기화?"))dispatch({type:"RESET"})}}><RotateCcw size={12}/> 초기화</button>
        </div>
      </div>

      {/* ── 참고자료 관리 ── */}
      <div style={sCard}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>📚 참고자료 관리</div>
        <div style={{ fontSize:11, color:C.sub, marginBottom:10, lineHeight:1.5 }}>
          우수작 보고서, 연구계획서 예시, 교육과정 문서 등의 텍스트를 붙여넣으세요.<br/>
          AI 초안 생성 · 자동 심사 시 컨텍스트로 자동 참조됩니다.
        </div>
        <RefManager st={st} dispatch={dispatch}/>
      </div>

      {/* 심사기준 전체 참조 */}
      <div style={sCard}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>심사기준 전체 (붙임1)</div>
        <RubRef title="1차 연구보고서 100점" rubric={REPORT_RUBRIC} color="#6366f1"/>
        <RubRef title="2차 수업동영상 100점" rubric={VIDEO_RUBRIC} color="#7c3aed"/>
      </div>
    </div>
  );
}

const REF_TYPE_LABELS = { winner:"우수작", plan:"계획서", curriculum:"교육과정", other:"기타" };
const REF_TYPE_COLORS = { winner:"#6366f1", plan:"#0ea5e9", curriculum:"#10b981", other:"#64748b" };

function RefManager({ st, dispatch }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("winner");
  const [content, setContent] = useState("");
  const canAdd = title.trim() && content.trim();
  return (
    <>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="자료 제목 (예: 2025 부산 1등급 보고서)" style={{ width:"100%", padding:"7px 10px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, marginBottom:6, boxSizing:"border-box" }}/>
      <div style={{ display:"flex", gap:6, marginBottom:6, flexWrap:"wrap" }}>
        {Object.entries(REF_TYPE_LABELS).map(([k,v]) => (
          <label key={k} style={{ fontSize:11, display:"flex", alignItems:"center", gap:3, cursor:"pointer" }}>
            <input type="radio" name="refType" checked={type===k} onChange={()=>setType(k)} style={{ accentColor:REF_TYPE_COLORS[k] }}/> {v}
          </label>
        ))}
      </div>
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="자료 내용을 여기에 붙여넣기..." rows={4} style={{ width:"100%", padding:"7px 10px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:11, lineHeight:1.5, resize:"vertical", boxSizing:"border-box", marginBottom:6 }}/>
      <button style={{ ...sBtn(C.primary,"#fff",true), width:"100%", justifyContent:"center", opacity:canAdd?1:0.5 }} disabled={!canAdd} onClick={() => { dispatch({ type:"ADD_REF", title:title.trim(), refType:type, content:content.trim() }); setTitle(""); setContent(""); }}>
        <Plus size={12}/> 참고자료 추가
      </button>
      {st.references?.length > 0 && (
        <div style={{ marginTop:10 }}>
          <div style={{ fontSize:11, fontWeight:600, marginBottom:6, color:C.sub }}>등록된 자료 ({st.references.length}건)</div>
          {st.references.map(ref => (
            <div key={ref.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 8px", background:"#f8fafc", borderRadius:6, marginBottom:4 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  <span style={{ display:"inline-block", padding:"1px 5px", borderRadius:4, fontSize:9, fontWeight:700, color:"#fff", background:REF_TYPE_COLORS[ref.type]||"#64748b", marginRight:4 }}>{REF_TYPE_LABELS[ref.type]||"기타"}</span>
                  {ref.title}
                </div>
                <div style={{ fontSize:10, color:C.sub }}>{ref.content.length.toLocaleString()}자</div>
              </div>
              <button onClick={() => dispatch({ type:"DEL_REF", id:ref.id })} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:C.danger }}><Trash2 size={13}/></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function RubRef({ title, rubric, color }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:4, padding:"4px 0" }} onClick={()=>setOpen(!open)}>
        {open?<ChevronDown size={14} color={color}/>:<ChevronRight size={14} color={color}/>}
        <span style={{ fontSize:12, fontWeight:600, color }}>{title}</span>
      </div>
      {open && rubric.map(r => (
        <div key={r.id} style={{ paddingLeft:16, marginBottom:6 }}>
          <div style={{ fontSize:11, fontWeight:600 }}>[{r.id}] {r.sub} ({r.max}점)</div>
          {r.questions.map((q,i) => <div key={i} style={{ fontSize:11, color:C.sub, paddingLeft:8, lineHeight:1.5 }}>• {q}</div>)}
          {r.tip && <div style={{ fontSize:10, color:C.primary, marginTop:2, lineHeight:1.4 }}>💡 {r.tip}</div>}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════
// App
// ══════════════════════════════
export default function App() {
  const [st, dispatch] = useReducer(reducer, null, () => {
    try { const s=localStorage.getItem("coach_v5"); return s?des(JSON.parse(s)):INIT(); } catch{return INIT();}
  });

  useEffect(() => { try{localStorage.setItem("coach_v5",JSON.stringify(ser(st)))}catch{} }, [st]);

  const go = useCallback(v => dispatch({type:"SET",k:"view",v}), []);

  if (!st.onboarded) return <Onboarding dispatch={dispatch}/>;

  return (
    <div style={{ background:C.bg, minHeight:"100dvh", display:"flex", flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <div style={{ flex:1, maxWidth:480, width:"100%", margin:"0 auto", padding:"12px 16px 80px", boxSizing:"border-box" }}>
        {st.view==="home" && <HomeView st={st} go={go}/>}
        {st.view==="write" && <WriteView st={st} dispatch={dispatch}/>}
        {st.view==="log" && <LogView st={st} dispatch={dispatch}/>}
        {st.view==="eval" && <EvalView st={st} dispatch={dispatch}/>}
        {st.view==="settings" && <SettingsView st={st} dispatch={dispatch}/>}
      </div>
      <Nav cur={st.view} go={go}/>
      <style>{`*{-webkit-tap-highlight-color:transparent}input,textarea,select,button{font-family:inherit}@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}`}</style>
    </div>
  );
}
