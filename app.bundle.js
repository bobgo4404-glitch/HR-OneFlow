
/* src/utils/common.js */
function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

function money(value) {
  return new Intl.NumberFormat("ko-KR").format(Number(value || 0));
}

function byId(list, id) {
  return list.find((item) => item.id === id);
}

function withinDays(dateString, days) {
  if (!dateString) return false;
  const now = new Date();
  const target = new Date(dateString);
  const diff = (target - now) / 86400000;
  return diff >= 0 && diff <= days;
}

function defaultEmployeeFields(item = {}) {
  return {
    email: "",
    phone: "",
    address: "",
    emergencyContact: "",
    residentNumber: "",
    contractEndDate: "",
    probationEndDate: "",
    jobFamily: "",
    positionTitle: "",
    education: "",
    careerSummary: "",
    certifications: "",
    familyNotes: "",
    militaryService: "",
    disabilityVeteran: "",
    ...item
  };
}

function normalizeResidentNumber(value = "") {
  const digits = String(value).replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

function maskResidentNumber(value = "") {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 7) return value || "-";
  return `${digits.slice(0, 6)}-${digits[6]}******`;
}

function birthDateFromResidentNumber(value = "") {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 7) return null;
  const front = digits.slice(0, 6);
  const code = digits[6];
  const yearPrefix = ["1", "2", "5", "6"].includes(code)
    ? "19"
    : ["3", "4", "7", "8"].includes(code)
      ? "20"
      : ["9", "0"].includes(code)
        ? "18"
        : null;
  if (!yearPrefix) return null;
  const full = `${yearPrefix}${front.slice(0, 2)}-${front.slice(2, 4)}-${front.slice(4, 6)}`;
  const date = new Date(full);
  if (Number.isNaN(date.getTime())) return null;
  return full;
}

function ageFromResidentNumber(value = "", today = new Date()) {
  const birth = birthDateFromResidentNumber(value);
  if (!birth) return null;
  const birthDate = new Date(birth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 0 ? age : null;
}

function koreanAgeFromResidentNumber(value = "", today = new Date()) {
  const birth = birthDateFromResidentNumber(value);
  if (!birth) return null;
  const birthDate = new Date(birth);
  const age = today.getFullYear() - birthDate.getFullYear() + 1;
  return age > 0 ? age : null;
}

function tenureYears(hireDate = "", today = new Date()) {
  if (!hireDate) return null;
  const start = new Date(hireDate);
  if (Number.isNaN(start.getTime())) return null;
  const years = (today - start) / 31557600000;
  return years >= 0 ? years : null;
}

function annualSalaryToMonthlyPayroll(value = 0) {
  return Math.round(annualSalaryWon(value) / 12);
}

function annualSalaryWon(value = 0) {
  const numeric = Number(value || 0);
  if (!numeric) return 0;
  return numeric >= 1000000 ? numeric : numeric * 10000;
}

function sumMonthlyPayrollBase(employees = []) {
  return employees.reduce((acc, item) => acc + annualSalaryToMonthlyPayroll(item.annualSalary), 0);
}

function recommendedCompRate(cycle = {}) {
  if (Number(cycle.recommendedIncreaseRate || 0) > 0) return Number(cycle.recommendedIncreaseRate || 0);
  const completionRate = Number(cycle.completionRate || 0);
  if (completionRate >= 95) return 6;
  if (completionRate >= 85) return 4.5;
  if (completionRate >= 70) return 3.5;
  return 2.5;
}

function recommendedCompBudget(cycle = {}, employees = []) {
  const targetCount = Math.min(Number(cycle.targetCount || employees.length || 0), employees.length || Number(cycle.targetCount || 0));
  if (!targetCount) return 0;
  const relevantEmployees = employees.slice(0, targetCount);
  const baseAnnual = relevantEmployees.reduce((acc, item) => acc + annualSalaryWon(item.annualSalary), 0);
  return Math.round(baseAnnual * (recommendedCompRate(cycle) / 100));
}

function reviewCompetencyModel(jobFamily = "", job = "") {
  const source = `${jobFamily} ${job}`.toLowerCase();
  if (/개발|engineer|tech|it|product/.test(source)) {
    return {
      expertise: "기술 전문성",
      collaboration: "협업",
      execution: "개발 실행력",
      leadership: "문제해결/리딩"
    };
  }
  if (/영업|sales|business|account/.test(source)) {
    return {
      expertise: "영업 전문성",
      collaboration: "고객/내부 협업",
      execution: "목표 달성력",
      leadership: "영향력/주도성"
    };
  }
  if (/hr|인사|people|recruit|talent/.test(source)) {
    return {
      expertise: "인사 전문성",
      collaboration: "조직 협업",
      execution: "운영 정확성",
      leadership: "변화 주도"
    };
  }
  return {
    expertise: "전문성",
    collaboration: "협업",
    execution: "실행력",
    leadership: "리더십"
  };
}

function scoreGrade(score = 0) {
  const numeric = Number(score || 0);
  if (numeric >= 95) return "S";
  if (numeric >= 85) return "A";
  if (numeric >= 75) return "B";
  return "C";
}

function compRateByGrade(grade = "") {
  if (grade === "S") return 8;
  if (grade === "A") return 5;
  if (grade === "B") return 3;
  return 0;
}

function normalizeReviewStage(stage = {}, fallback = {}) {
  const competencyScores = {
    expertiseScore: 0,
    collaborationScore: 0,
    executionScore: 0,
    leadershipScore: 0,
    ...(stage.competencyScores || fallback.competencyScores || {})
  };
  const competencyAverage = Math.round((
    Number(competencyScores.expertiseScore || 0)
    + Number(competencyScores.collaborationScore || 0)
    + Number(competencyScores.executionScore || 0)
    + Number(competencyScores.leadershipScore || 0)
  ) / 4);
  const jobScore = Number(stage.jobScore ?? fallback.jobScore ?? 0);
  return {
    status: "draft",
    jobScore,
    competencyScores,
    competencyAverage: Number(stage.competencyAverage ?? competencyAverage),
    finalScore: Number(stage.finalScore ?? Math.round((jobScore * 0.7) + (competencyAverage * 0.3))),
    comment: "",
    submittedAt: "",
    ...stage
  };
}

function selectedReviewStage(entry = null) {
  if (!entry) return null;
  if (entry.reviewStages?.final?.status === "finalized") return "final";
  if (entry.reviewStages?.manager?.status === "submitted") return "manager";
  if (entry.reviewStages?.self?.status === "submitted") return "self";
  return null;
}

function reviewStageLabel(phase = "") {
  if (phase === "self") return "자기평가";
  if (phase === "manager") return "1차평가";
  if (phase === "final") return "2차평가";
  return "-";
}

function reviewStageStatusLabel(phase = "", entry = null) {
  const stage = entry?.reviewStages?.[phase];
  if (!stage) return "미입력";
  if (phase === "final") return stage.status === "finalized" ? "확정" : stage.status === "submitted" ? "검토중" : "작성중";
  return stage.status === "submitted" ? "제출" : "작성중";
}

function buildCompRecommendations(cycle = {}, employees = []) {
  const reviewEntries = Array.isArray(cycle.reviewEntries) ? cycle.reviewEntries : [];
  const targetEmployees = employees.slice(0, Math.max(0, Number(cycle.targetCount || employees.length || 0)));
  return targetEmployees.map((employee) => {
    const entry = reviewEntries.find((item) => item.employeeId === employee.id) || null;
    const grade = entry?.grade || scoreGrade(entry?.finalScore || 0);
    const recommendedRate = compRateByGrade(grade);
    const baseAnnual = annualSalaryWon(employee.annualSalary);
    return {
      employeeId: employee.id,
      grade,
      finalScore: Number(entry?.finalScore || 0),
      recommendedRate,
      recommendedIncreaseAmount: Math.round(baseAnnual * (recommendedRate / 100))
    };
  });
}

function recommendedCompPlanForPeriod(period = "", plans = []) {
  const activePlans = plans.filter((item) => ["approved", "completed", "simulated"].includes(item.status));
  if (!activePlans.length) return null;
  if (!period) {
    return [...activePlans].sort((a, b) => String(b.effectiveMonth || "").localeCompare(String(a.effectiveMonth || "")))[0] || null;
  }
  const exact = activePlans.find((item) => item.effectiveMonth === period);
  if (exact) return exact;
  const eligible = activePlans
    .filter((item) => item.effectiveMonth && item.effectiveMonth <= period)
    .sort((a, b) => String(b.effectiveMonth || "").localeCompare(String(a.effectiveMonth || "")));
  return eligible[0] || [...activePlans].sort((a, b) => String(b.effectiveMonth || "").localeCompare(String(a.effectiveMonth || "")))[0] || null;
}

function evaluationChecklistItems(cycle = {}, hasCompPlan = false) {
  const completionRate = Number(cycle.completionRate || 0);
  const status = String(cycle.status || "planning");
  return [
    { key: "framework", label: "평가 기준/등급체계 확정", done: completionRate >= 10 || ["ongoing", "completed", "approved", "finalized"].includes(status) },
    { key: "goal", label: "목표/KPI 합의 완료", done: completionRate >= 25 || ["completed", "approved", "finalized"].includes(status) },
    { key: "selfReview", label: "자기평가 제출", done: completionRate >= 45 || ["completed", "approved", "finalized"].includes(status) },
    { key: "managerReview", label: "1차/2차 평가 완료", done: completionRate >= 70 || ["completed", "approved", "finalized"].includes(status) },
    { key: "calibration", label: "캘리브레이션 및 등급 확정", done: completionRate >= 85 || ["completed", "approved", "finalized"].includes(status) },
    { key: "compensation", label: "보상 반영 계획 연계", done: hasCompPlan }
  ];
}

function evaluationChecklistSummary(cycle = {}, hasCompPlan = false) {
  const items = evaluationChecklistItems(cycle, hasCompPlan);
  const doneCount = items.filter((item) => item.done).length;
  return { items, doneCount, totalCount: items.length };
}

function validateResidentNumber(value = "") {
  const normalized = normalizeResidentNumber(value);
  const digits = normalized.replace(/\D/g, "");
  if (digits.length !== 13) {
    return { valid: false, message: "주민등록번호는 13자리여야 합니다.", normalized };
  }
  if (!/^\d{13}$/.test(digits)) {
    return { valid: false, message: "주민등록번호 형식이 올바르지 않습니다.", normalized };
  }
  const birth = birthDateFromResidentNumber(digits);
  if (!birth) {
    return { valid: false, message: "주민등록번호의 생년월일이 올바르지 않습니다.", normalized };
  }
  const birthDate = new Date(birth);
  if (birthDate > new Date()) {
    return { valid: false, message: "주민등록번호의 생년월일이 현재일보다 이후입니다.", normalized };
  }
  const multipliers = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  const sum = digits
    .slice(0, 12)
    .split("")
    .reduce((acc, digit, index) => acc + Number(digit) * multipliers[index], 0);
  const checkDigit = (11 - (sum % 11)) % 10;
  if (checkDigit !== Number(digits[12])) {
    return { valid: false, message: "주민등록번호 검증번호가 일치하지 않습니다.", normalized };
  }
  return { valid: true, message: "", normalized, birthDate: birth };
}

function normalizedOrg(item) {
  return {
    orgType: "팀",
    costCenter: "",
    securityLevel: "medium",
    ...item
  };
}

function normalizedPayrollRule(item) {
  return {
    category: "지급",
    taxType: "과세",
    paymentType: "고정",
    targetType: "전사",
    note: "",
    ...item
  };
}

function normalizedPayrollPeriod(item) {
  return {
    payType: "월급",
    cutoffDate: "",
    payDate: "",
    note: "",
    ...item
  };
}

function normalizedCourse(item) {
  return {
    type: "필수교육",
    target: "전사",
    owner: "",
    deliveryType: "온라인",
    cycle: "연간",
    dueDate: "",
    completionCriteria: "과정 이수",
    note: "",
    completionRate: 0,
    status: "active",
    ...item
  };
}

function normalizedCourseAssignment(item) {
  return {
    status: "assigned",
    completedAt: "",
    certificateName: "",
    note: "",
    ...item
  };
}

function normalizedPayrollEntry(item) {
  return {
    basePay: 0,
    bonusPay: 0,
    deductionPay: 0,
    netPay: 0,
    status: "drafting",
    ...item
  };
}

function normalizedResignation(item) {
  return {
    resignationType: "자진퇴사",
    interviewNote: "",
    handoverDate: "",
    checklistItems: [
      { key: "letter", label: "사직서", done: false },
      { key: "handover", label: "인수인계", done: false },
      { key: "asset", label: "자산반납", done: false },
      { key: "account", label: "계정회수", done: false },
      { key: "settlement", label: "퇴직정산", done: false }
    ],
    unusedLeaveDays: 0,
    expectedRetirementPay: 0,
    settlementDueDate: "",
    settlementStatus: "draft",
    ...item
  };
}

function resignationChecklistProgress(item) {
  const checklistItems = normalizedResignation(item).checklistItems;
  const doneCount = checklistItems.filter((entry) => entry.done).length;
  return { doneCount, totalCount: checklistItems.length };
}

function downloadAsJson(filename, data) {
  const href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${filename}.json`;
  anchor.click();
}

function downloadAsCsv(filename, columns, rows) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const header = columns.map((column) => escape(column.label)).join(",");
  const body = rows.map((row) => columns.map((column) => escape(row[column.key])).join(",")).join("\n");
  const csv = [header, body].filter(Boolean).join("\n");
  const href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${filename}.csv`;
  anchor.click();
}

function downloadAsText(filename, text, extension = "txt") {
  const href = "data:text/plain;charset=utf-8," + encodeURIComponent(String(text ?? ""));
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${filename}.${extension}`;
  anchor.click();
}

function escapePrintHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function openPrintWindow({ title, subtitle = "", sections = [] }) {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=980,height=760");
  if (!popup) {
    alert("브라우저에서 출력 창이 차단되었습니다. 팝업 허용 후 다시 시도하세요.");
    return false;
  }
  const html = `
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <title>${escapePrintHtml(title)}</title>
        <style>
          body { margin: 0; padding: 28px; color: #1f2933; font: 14px/1.6 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; }
          h1 { margin: 0 0 8px; font-size: 28px; }
          .subtitle { margin-bottom: 20px; color: #5b6570; }
          .section { margin-bottom: 18px; border: 1px solid #d9dee3; border-radius: 12px; padding: 16px; }
          .section h2 { margin: 0 0 12px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px 8px; border-bottom: 1px solid #e6eaee; text-align: left; vertical-align: top; }
          th { width: 160px; color: #5b6570; font-weight: 700; }
          .small { color: #5b6570; font-size: 12px; }
          @media print {
            body { padding: 0; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>${escapePrintHtml(title)}</h1>
        ${subtitle ? `<div class="subtitle">${escapePrintHtml(subtitle)}</div>` : ""}
        ${sections.map((section) => `
          <section class="section">
            <h2>${escapePrintHtml(section.title)}</h2>
            <table>
              <tbody>
                ${(section.rows || []).map((row) => `
                  <tr>
                    <th>${escapePrintHtml(row.label)}</th>
                    <td>${escapePrintHtml(row.value)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </section>
        `).join("")}
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  return true;
}

function downloadAttachmentSummary({ attachment, ownerLabel = "" }) {
  if (!attachment) return false;
  const lines = [
    "인사 통합관리 시스템 첨부 요약",
    "",
    `파일명: ${attachment.name || "-"}`,
    `대상: ${ownerLabel || "-"}`,
    `구분: ${attachment.category || "-"}`,
    `등록일시: ${attachment.uploadedAt || "-"}`,
    `등록자: ${attachment.uploadedBy || "-"}`,
    `효력일: ${attachment.effectiveFrom || "-"}`,
    `만료일: ${attachment.expiresAt || "-"}`,
    `대상유형: ${attachment.targetType || "-"}`,
    `대상ID: ${attachment.targetId || "-"}`
  ];
  downloadAsText((attachment.name || "attachment").replace(/\.[^.]+$/, "") || "attachment", lines.join("\n"));
  return true;
}

const CODE_LABELS = {
  active: "운영중",
  approved: "승인",
  assigned: "배정",
  applied: "신청",
  calculated: "계산완료",
  closed: "마감",
  completed: "완료",
  draft: "작성중",
  drafting: "작성중",
  failed: "실패",
  finalized: "확정",
  generated: "생성완료",
  hired: "최종합격",
  high: "높음",
  imported: "반영완료",
  in_review: "검토중",
  low: "낮음",
  medium: "보통",
  offboarding: "퇴직절차 진행",
  ongoing: "진행중",
  open: "진행중",
  pending: "승인대기",
  posted: "게시중",
  preboarding: "입사준비",
  provisioning: "계정/장비 준비",
  rejected: "반려",
  resolved: "해소",
  review_needed: "검토필요",
  signing: "서류서명",
  submitted: "승인대기",
  success: "성공",
  simulated: "시뮬레이션",
  training_pending: "교육대기",
  validated: "검증완료",
  verified: "검증완료",
  screening: "서류검토",
  interview_1: "1차 면접",
  interview_2: "2차 면접",
  offer: "처우협의",
  eligible: "승진후보",
  planning: "계획",
  hrAction: "발령",
  resignation: "퇴직",
  HQ: "본사",
  Factory: "공장"
};

function labelCode(value) {
  return CODE_LABELS[value] || value;
}

function labelStage(value) {
  return labelCode(value);
}



/* src/data/seed.js */
function createSeedData(schemaVersion = 2) {
  return {
    schemaVersion,
    tenant: { id: "tenant-1", companyName: "", scale: "", employees: 0 },
    entities: [],
    sites: [],
    orgs: [],
    jobFamilies: [],
    gradeCodes: [],
    positionCodes: [],
    permissionPolicies: [
      { id: "perm-1", role: "시스템 관리자", scope: "전사", payrollAccess: "full", employeeAccess: "full", approvalScope: "all" },
      { id: "perm-2", role: "HR 관리자", scope: "전사", payrollAccess: "limited", employeeAccess: "full", approvalScope: "hr" },
      { id: "perm-3", role: "급여 담당자", scope: "전사", payrollAccess: "full", employeeAccess: "masked", approvalScope: "payroll" },
      { id: "perm-4", role: "조직장", scope: "소속조직", payrollAccess: "none", employeeAccess: "team", approvalScope: "team" },
      { id: "perm-5", role: "구성원", scope: "본인", payrollAccess: "self", employeeAccess: "self", approvalScope: "none" }
    ],
    employees: [],
    recruitmentRequests: [],
    applicants: [],
    recruitmentStageHistories: [],
    onboarding: [],
    hrActions: [],
    leaveRequests: [],
    leaveBalances: [],
    attendanceClosures: [],
    courses: [],
    courseAssignments: [],
    evaluationCycles: [],
    evaluationAppeals: [],
    calibrations: [],
    compensationPlans: [],
    payrollRules: [],
    payrollPeriods: [],
    payrollEntries: [],
    payrollAnomalies: [],
    promotionCandidates: [],
    resignations: [],
    helpdesk: [],
    approvals: [],
    documentTemplates: [],
    generatedDocuments: [],
    attachments: [],
    changeHistory: [],
    policyVersions: [],
    bulkUploads: [],
    integrationJobs: [],
    orgSimulations: [],
    policyImpacts: [],
    auditLogs: []
  };
}



/* src/utils/appData.js */
function appDataNormalizeData({
  data,
  createSeedData,
  schemaVersion,
  defaultEmployeeFields,
  normalizedOrg,
  normalizedPayrollRule,
  normalizedPayrollPeriod,
  normalizedResignation,
  resignationChecklistProgress
}) {
  const seed = createSeedData(schemaVersion);
  const normalized = { ...seed, ...data };
  [
    "entities", "sites", "orgs", "jobFamilies", "gradeCodes", "positionCodes", "permissionPolicies", "employees", "recruitmentRequests", "applicants", "recruitmentStageHistories", "onboarding",
    "hrActions", "leaveRequests", "leaveBalances", "attendanceClosures", "courses", "courseAssignments", "evaluationCycles",
    "evaluationAppeals", "calibrations", "compensationPlans", "payrollRules", "payrollPeriods", "payrollEntries",
    "payrollAnomalies", "promotionCandidates", "resignations", "helpdesk", "approvals",
    "documentTemplates", "generatedDocuments", "attachments", "changeHistory", "policyVersions", "bulkUploads", "integrationJobs",
    "orgSimulations", "policyImpacts", "auditLogs"
  ].forEach((key) => {
    normalized[key] = Array.isArray(normalized[key]) ? normalized[key] : seed[key];
  });
  normalized.schemaVersion = schemaVersion;
  normalized.orgs = normalized.orgs.map((item) => normalizedOrg(item));
  normalized.recruitmentRequests = normalized.recruitmentRequests.map((item) => ({
    employmentType: "정규직",
    workLocation: "서울 본사",
    openDate: "",
    closeDate: "",
    preferredQualifications: "",
    postingStatus: item.status || "draft",
    ...item
  }));
  normalized.applicants = normalized.applicants.map((item) => ({
    status: "진행중",
    email: "",
    phone: "",
    appliedAt: "",
    interviewComment: "",
    desiredGrade: "",
    jobFamily: "",
    expectedJoinDate: "",
    ...item
  }));
  normalized.onboarding = normalized.onboarding.map((item) => ({
    applicantId: "",
    sourceRequestId: "",
    name: "",
    joinDate: "",
    orgId: "",
    job: "",
    jobFamily: "",
    grade: "",
    employmentType: "정규직",
    annualSalary: 0,
    email: "",
    phone: "",
    workLocation: "",
    status: "preboarding",
    checklistDone: 0,
    checklistTotal: 5,
    employeeNo: "",
    ...item
  }));
  normalized.evaluationCycles = normalized.evaluationCycles.map((item) => {
    const goalItems = Array.isArray(item.goalItems)
      ? item.goalItems.map((goal) => ({
        id: goal.id || `goal-${Math.random().toString(16).slice(2, 8)}`,
        employeeId: "",
        goalTitle: "",
        targetMetric: "",
        weight: 0,
        progress: 0,
        resultNote: "",
        ...goal
      }))
      : [];
    const reviewEntries = Array.isArray(item.reviewEntries)
      ? item.reviewEntries.map((entry) => {
        const fallbackScores = {
          expertiseScore: Number(entry.competencyScores?.expertiseScore || entry.competencyScore || 0),
          collaborationScore: Number(entry.competencyScores?.collaborationScore || entry.competencyScore || 0),
          executionScore: Number(entry.competencyScores?.executionScore || entry.competencyScore || 0),
          leadershipScore: Number(entry.competencyScores?.leadershipScore || entry.competencyScore || 0)
        };
        const reviewStages = {
          self: normalizeReviewStage(entry.reviewStages?.self || {}, { jobScore: entry.jobScore, competencyScores: fallbackScores, comment: entry.comment }),
          manager: normalizeReviewStage(entry.reviewStages?.manager || {}, { jobScore: entry.jobScore, competencyScores: fallbackScores, comment: entry.comment }),
          final: normalizeReviewStage(entry.reviewStages?.final || {}, { jobScore: entry.jobScore, competencyScores: fallbackScores, comment: entry.comment })
        };
        const activePhase = selectedReviewStage({ reviewStages }) || "final";
        const activeStage = reviewStages[activePhase];
        return {
          employeeId: "",
          jobScore: Number(activeStage.jobScore || 0),
          competencyAverage: Number(activeStage.competencyAverage || 0),
          finalScore: Number(activeStage.finalScore || 0),
          grade: scoreGrade(activeStage.finalScore || 0),
          comment: "",
          competencyScores: activeStage.competencyScores,
          reviewStages,
          selfStatus: reviewStages.self.status,
          managerStatus: reviewStages.manager.status,
          finalStatus: reviewStages.final.status,
          ...entry,
          competencyAverage: Number(entry.competencyAverage ?? activeStage.competencyAverage),
          finalScore: Number(entry.finalScore || activeStage.finalScore || 0),
          grade: entry.grade || scoreGrade(entry.finalScore || activeStage.finalScore || 0),
          comment: entry.comment || activeStage.comment || "",
          jobScore: Number(entry.jobScore ?? activeStage.jobScore ?? 0),
          competencyScores: entry.competencyScores || activeStage.competencyScores,
          reviewStages
        };
      })
      : [];
    return {
      status: "planning",
      completionRate: 0,
      recommendedIncreaseRate: 0,
      goalItems,
      reviewEntries,
      ...item,
      goalItems,
      reviewEntries
    };
  });
  normalized.compensationPlans = normalized.compensationPlans.map((item) => ({
    effectiveMonth: "",
    avgIncreaseRate: 0,
    linkedPayrollPeriodId: "",
    note: "",
    gradeBudgetMatrix: [],
    recommendationRows: [],
    ...item
  }));
  normalized.leaveRequests = normalized.leaveRequests.map((item) => ({
    status: "imported",
    note: "",
    ...item
  }));
  normalized.courses = normalized.courses.map((item) => normalizedCourse(item));
  normalized.courseAssignments = normalized.courseAssignments.map((item) => normalizedCourseAssignment(item));
  normalized.payrollRules = normalized.payrollRules.map((item) => normalizedPayrollRule(item));
  normalized.payrollPeriods = normalized.payrollPeriods.map((item) => normalizedPayrollPeriod({
    linkedCompPlanId: "",
    baseGrossPay: 0,
    compensationGrossPay: 0,
    ...item
  }));
  normalized.payrollEntries = normalized.payrollEntries.map((item) => normalizedPayrollEntry(item));
  normalized.resignations = normalized.resignations.map((item) => {
    const normalizedItem = normalizedResignation(item);
    const progress = resignationChecklistProgress(normalizedItem);
    normalizedItem.checklistDone = progress.doneCount;
    normalizedItem.checklistTotal = progress.totalCount;
    return normalizedItem;
  });
  normalized.employees = normalized.employees.map((item) => defaultEmployeeFields({
    sourceOnboardingId: "",
    ...item
  }));
  return normalized;
}

function appDataSyncApprovalQueue({ data, byId, employeeName, nowStamp }) {
  data.approvals = data.approvals || [];
  data.approvals = data.approvals.filter((item) => {
    if (item.status !== "pending") return true;
    if (item.type === "recruitmentRequest") return byId(data.recruitmentRequests, item.targetId)?.status === "submitted";
    if (item.type === "leaveRequest") return false;
    if (item.type === "resignation") return byId(data.resignations, item.targetId)?.status === "applied";
    return true;
  });
  const ensureApproval = (type, targetId, title, requester, approver) => {
    const exists = data.approvals.some((item) => item.type === type && item.targetId === targetId && item.status === "pending");
    if (!exists) {
      data.approvals.unshift({
        id: "appr-" + Date.now() + "-" + Math.random().toString(16).slice(2, 6),
        type,
        targetId,
        title,
        requester,
        approver,
        status: "pending",
        submittedAt: nowStamp()
      });
    }
  };
  data.recruitmentRequests.filter((item) => item.status === "submitted").forEach((item) => {
    ensureApproval("recruitmentRequest", item.id, item.title, item.owner, "HR 관리자");
  });
  data.resignations.filter((item) => item.status === "applied").forEach((item) => {
    ensureApproval("resignation", item.id, `${employeeName(item.employeeId)} 퇴직 승인`, employeeName(item.employeeId), "HR 관리자");
  });
}

function appDataExportByType({
  type,
  exportCsv,
  filteredRecruitmentRequests,
  orgName,
  postingStatusLabel,
  filteredVisibleEmployees,
  visibleOrgs,
  normalizedOrg,
  employeeName,
  leaveBalanceRows,
  payrollPeriods,
  normalizedPayrollPeriod,
  visibleResignations,
  normalizedResignation
}) {
  if (type === "recruitment") {
    return exportCsv("recruitment-postings", [
      { key: "title", label: "공고명" },
      { key: "orgName", label: "부서" },
      { key: "jobRole", label: "직무" },
      { key: "headcount", label: "채용인원" },
      { key: "workLocation", label: "근무지" },
      { key: "postingStatus", label: "상태" }
    ], filteredRecruitmentRequests().map((item) => ({
      ...item,
      orgName: orgName(item.orgId),
      postingStatus: postingStatusLabel(item)
    })));
  }
  if (type === "people") {
    return exportCsv("employee-cards", [
      { key: "id", label: "사번" },
      { key: "name", label: "성명" },
      { key: "orgName", label: "부서" },
      { key: "job", label: "직무" },
      { key: "grade", label: "직급" },
      { key: "employmentType", label: "고용형태" },
      { key: "status", label: "재직상태" }
    ], filteredVisibleEmployees().map((item) => ({
      ...item,
      orgName: orgName(item.orgId)
    })));
  }
  if (type === "org") {
    return exportCsv("organization", [
      { key: "name", label: "조직명" },
      { key: "parentName", label: "상위조직" },
      { key: "leaderName", label: "조직장" },
      { key: "orgType", label: "유형" },
      { key: "costCenter", label: "원가센터" },
      { key: "status", label: "상태" }
    ], visibleOrgs().map((item) => ({
      ...normalizedOrg(item),
      parentName: item.parentId ? orgName(item.parentId) : "",
      leaderName: employeeName(item.leader)
    })));
  }
  if (type === "attendance") {
    return exportCsv("leave-balance", [
      { key: "employeeName", label: "직원" },
      { key: "orgName", label: "부서" },
      { key: "grantedDays", label: "발생" },
      { key: "carryoverDays", label: "이월" },
      { key: "adjustmentDays", label: "조정" },
      { key: "usedDays", label: "사용" },
      { key: "remainingDays", label: "잔여" }
    ], leaveBalanceRows(2026).map((item) => ({
      ...item,
      employeeName: item.employee.name,
      orgName: orgName(item.employee.orgId)
    })));
  }
  if (type === "payroll") {
    return exportCsv("payroll-periods", [
      { key: "period", label: "지급월" },
      { key: "payType", label: "지급구분" },
      { key: "employeeCount", label: "대상인원" },
      { key: "grossPay", label: "총지급액" },
      { key: "anomalies", label: "이상치" },
      { key: "status", label: "상태" }
    ], payrollPeriods.map((item) => normalizedPayrollPeriod(item)));
  }
  if (type === "exit") {
    return exportCsv("resignations", [
      { key: "employeeName", label: "직원" },
      { key: "resignationType", label: "퇴직유형" },
      { key: "lastDate", label: "퇴직일" },
      { key: "reason", label: "사유" },
      { key: "settlementStatus", label: "정산상태" },
      { key: "status", label: "진행상태" }
    ], visibleResignations().map((item) => ({
      ...normalizedResignation(item),
      employeeName: employeeName(item.employeeId)
    })));
  }
  return null;
}



/* src/pages/corePages.js */
function renderDashboardPage(ctx) {
  const {
    state,
    kpis,
    visibleApplicants,
    visibleAttendanceClosures,
    visibleResignations,
    visibleEmployees,
    leaveBalanceRows,
    withinDays,
    defaultEmployeeFields,
    postingStatusLabel,
    visibleRecruitmentRequests,
    requestCandidates,
    visibleOrgs,
    visibleCourses,
    visiblePromotionCandidates,
    pendingApprovals,
    labelStage
  } = ctx;
  const KPI = kpis();
  const visibleApplicantList = visibleApplicants();
  const visibleAttendanceList = visibleAttendanceClosures();
  const visibleResignationList = visibleResignations();
  const visibleLogs = (state.data.auditLogs || []).slice(0, 6);
  const employees = visibleEmployees();
  const leaveRows = leaveBalanceRows(2026);
  const contractAlerts = employees.filter((item) => withinDays(defaultEmployeeFields(item).contractEndDate, 60));
  const probationAlerts = employees.filter((item) => withinDays(defaultEmployeeFields(item).probationEndDate, 45));
  const longOpenPositions = visibleRecruitmentRequests().filter((item) => {
    if (!item.openDate || postingStatusLabel(item) === "closed") return false;
    const openDays = Math.round((new Date() - new Date(item.openDate)) / 86400000);
    return openDays >= 30 && requestCandidates(item.id).length < item.headcount;
  });
  const monthlyJoiners = employees.filter((item) => String(item.hireDate || "").startsWith("2026-03")).length;
  const monthlyLeavers = visibleResignationList.filter((item) => String(item.lastDate || "").startsWith("2026-03")).length;
  const orgSummary = visibleOrgs().map((org) => ({
    name: org.name,
    count: employees.filter((employee) => employee.orgId === org.id).length
  })).sort((a, b) => b.count - a.count).slice(0, 4);
  const trainingPending = visibleEmployees().length
    ? Math.max(0, visibleEmployees().length - Math.round(visibleEmployees().length * ((visibleCourses()[0]?.completionRate || 0) / 100)))
    : 0;
  const activeSubSection = state.subSection || "overview";
  const overviewView = `
    <section class="kpis">
      ${KPI.map((item) => `
        <article class="stat-card">
          <h3>${item.label}</h3>
          <strong>${item.value}</strong>
          <span>${item.note}</span>
        </article>
      `).join("")}
      <article class="stat-card"><h3>월 입사자</h3><strong>${monthlyJoiners}</strong><span>2026-03 기준</span></article>
      <article class="stat-card"><h3>월 퇴사자</h3><strong>${monthlyLeavers}</strong><span>2026-03 기준</span></article>
    </section>
    <section class="grid-2">
      <article class="card">
        <div class="section-title"><h3>채용 파이프라인</h3><button class="link-button" data-nav-link="recruitment">채용으로 이동</button></div>
        <div class="pipeline">
          ${["screening","interview_1","interview_2","offer","hired","rejected"].map((stage) => `
            <div class="lane">
              <h4>${labelStage(stage)}</h4>
              ${visibleApplicantList.filter((item) => item.stage === stage).map((item) => `
                <div class="item-card">
                  <strong>${item.name}</strong>
                  <small>${item.channel} · ${item.score}점</small>
                </div>
              `).join("") || '<div class="empty">대상 없음</div>'}
            </div>
          `).join("")}
        </div>
      </article>
      <article class="card">
        <div class="section-title"><h3>부서별 인원 현황</h3><button class="link-button" data-nav-link="org">조직으로 이동</button></div>
        <div class="metric-list">
          ${orgSummary.map((item) => `<div class="metric-row"><span>${item.name}</span><strong>${item.count}명</strong></div>`).join("") || '<div class="empty">집계 대상 없음</div>'}
        </div>
      </article>
    </section>
  `;
  const riskView = `
    <section class="grid-3">
      <article class="card">
        <h3>연차 사용 현황</h3>
        <div class="metric-list">
          <div class="metric-row"><span>발생연차</span><strong>${leaveRows.reduce((acc, item) => acc + item.grantedDays + item.carryoverDays + item.adjustmentDays, 0)}일</strong></div>
          <div class="metric-row"><span>사용연차</span><strong>${leaveRows.reduce((acc, item) => acc + item.usedDays, 0)}일</strong></div>
          <div class="metric-row"><span>잔여연차</span><strong>${leaveRows.reduce((acc, item) => acc + item.remainingDays, 0)}일</strong></div>
        </div>
      </article>
      <article class="card">
        <h3>운영 리스크</h3>
        <div class="metric-list">
          <div class="metric-row"><span>근태 미마감 조직</span><strong>${visibleAttendanceList.filter((item) => item.status !== "closed").length}개</strong></div>
          <div class="metric-row"><span>급여 이상치</span><strong>${state.data.payrollPeriods.reduce((acc, item) => acc + item.anomalies, 0)}건</strong></div>
          <div class="metric-row"><span>연계 실패</span><strong>${state.data.integrationJobs.filter((item) => item.status === "failed").length}건</strong></div>
          <div class="metric-row"><span>진행 중 퇴직</span><strong>${visibleResignationList.filter((item) => item.status !== "finalized").length}건</strong></div>
        </div>
      </article>
      <article class="card">
        <h3>핵심 승인 대기</h3>
        <div class="mini-list">
          ${pendingApprovals().slice(0, 4).map((item) => `<div class="mini-item"><strong>${item.title}</strong><small>${item.requester} · ${item.submittedAt}</small></div>`).join("") || '<div class="empty">대기 중인 승인 없음</div>'}
        </div>
      </article>
    </section>
    <section class="grid-3">
      <article class="card">
        <h3>알림</h3>
        <div class="mini-list">
          <div class="mini-item"><strong>계약만료 예정 ${contractAlerts.length}명</strong><small>${contractAlerts.map((item) => item.name).join(", ") || "대상 없음"}</small></div>
          <div class="mini-item"><strong>수습종료 예정 ${probationAlerts.length}명</strong><small>${probationAlerts.map((item) => item.name).join(", ") || "대상 없음"}</small></div>
          <div class="mini-item"><strong>장기 미충원 포지션 ${longOpenPositions.length}건</strong><small>${longOpenPositions.map((item) => item.title).join(", ") || "대상 없음"}</small></div>
        </div>
      </article>
      <article class="card">
        <h3>교육/평가 연결</h3>
        <div class="mini-list">
          <div class="mini-item"><strong>필수교육 미이수 ${trainingPending}명</strong><small>${visibleCourses()[0]?.title || "필수교육"} 기준 추정</small></div>
          <div class="mini-item"><strong>평가 완료율 ${state.data.evaluationCycles[0]?.completionRate || 0}%</strong><small>${state.data.evaluationCycles[0]?.title || "-"}</small></div>
          <div class="mini-item"><strong>교육 추천 후보 ${visiblePromotionCandidates().filter((item) => !item.trainingReady).length}명</strong><small>승진 후보 중 교육 미충족 대상</small></div>
        </div>
      </article>
      <article class="card">
        <h3>최근 인사 이벤트</h3>
        <div class="mini-list">
          ${visibleLogs.map((log) => `<div class="mini-item"><strong>${log.action}</strong><small>${log.actor} · ${log.at}</small></div>`).join("")}
        </div>
      </article>
    </section>
  `;
  return activeSubSection === "risk" ? riskView : overviewView;
}

function renderRecruitmentPage(ctx) {
  const {
    state, filteredRecruitmentRequests, byId, requestCandidates, candidateStageHistory, candidateAttachments,
    entityChangeHistory, visibleApplicants, visibleOrgs, orgName, postingStatusLabel, badge, labelStage, labelCode
  } = ctx;
  const requests = filteredRecruitmentRequests();
  if (!state.selectedPostingId || !requests.some((item) => item.id === state.selectedPostingId)) state.selectedPostingId = requests[0]?.id || null;
  const selectedPosting = byId(state.data.recruitmentRequests, state.selectedPostingId) || requests[0] || null;
  const applicants = selectedPosting ? requestCandidates(selectedPosting.id) : [];
  if (!state.selectedCandidateId || !applicants.some((item) => item.id === state.selectedCandidateId)) state.selectedCandidateId = applicants[0]?.id || null;
  const selectedCandidate = byId(state.data.applicants, state.selectedCandidateId) || applicants[0] || null;
  const candidateHistory = selectedCandidate ? candidateStageHistory(selectedCandidate.id) : [];
  const candidateFiles = selectedCandidate ? candidateAttachments(selectedCandidate.id) : [];
  const postingChanges = selectedPosting ? entityChangeHistory("recruitmentRequest", selectedPosting.id).slice(0, 6) : [];
  const candidateChanges = selectedCandidate ? entityChangeHistory("candidate", selectedCandidate.id).slice(0, 6) : [];
  const totalApplicants = requests.reduce((acc, item) => acc + requestCandidates(item.id).length, 0);
  const hiredApplicants = requests.reduce((acc, item) => acc + requestCandidates(item.id).filter((candidate) => candidate.stage === "hired").length, 0);
  const avgDays = requests.length ? Math.round(requests.reduce((acc, item) => {
    if (!item.openDate || !item.closeDate) return acc;
    return acc + Math.max(0, Math.round((new Date(item.closeDate) - new Date(item.openDate)) / 86400000));
  }, 0) / requests.length) : 0;
  const channelSummary = ["사람인", "원티드", "잡코리아", "추천"].map((channel) => `${channel} ${visibleApplicants().filter((item) => item.channel === channel).length}명`).join(" / ");
  const activeSubSection = state.subSection || "posting";
  const summaryCards = `
    <section class="grid-3">
      <article class="stat-card"><h3>공고 수</h3><strong>${requests.length}</strong><span>현재 사업장 기준</span></article>
      <article class="stat-card"><h3>지원자 수</h3><strong>${totalApplicants}</strong><span>전체 공고 합산</span></article>
      <article class="stat-card"><h3>최종합격</h3><strong>${hiredApplicants}</strong><span>인사카드 연동 대상</span></article>
    </section>
  `;
  const postingView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>채용공고</h3>
        <div class="filters"><button class="button-secondary" data-export="recruitment">다운로드</button><button class="button" data-open="recruitmentRequest">공고 등록</button></div>
      </div>
      <div class="filters stretch" style="margin-bottom:14px;">
        <label class="inline-field">공고/직무 검색<input type="text" id="recruitmentQueryInput" value="${state.recruitmentFilters.query}" placeholder="예: 프론트엔드, 생산관리" /></label>
        <label class="inline-field">부서<select id="recruitmentOrgFilter"><option value="">전체</option>${visibleOrgs().map((item) => `<option value="${item.id}" ${state.recruitmentFilters.orgId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
        <label class="inline-field">공고상태<select id="recruitmentStatusFilter"><option value="">전체</option>${["draft","posted","closed","approved","submitted"].map((item) => `<option value="${item}" ${state.recruitmentFilters.status === item ? "selected" : ""}>${labelCode(item)}</option>`).join("")}</select></label>
      </div>
      <table>
        <thead><tr><th>공고명</th><th>부서</th><th>직무</th><th>인원</th><th>근무지</th><th>접수기간</th><th>상태</th></tr></thead>
        <tbody>
          ${requests.map((item) => `
            <tr class="${item.id === state.selectedPostingId ? "is-selected" : ""}" data-posting-row="${item.id}">
              <td>${item.title}</td>
              <td>${orgName(item.orgId)}</td>
              <td>${item.jobRole}</td>
              <td>${item.headcount}</td>
              <td>${item.workLocation || "-"}</td>
              <td>${item.openDate || "-"}${item.closeDate ? ` ~ ${item.closeDate}` : ""}</td>
              <td>${badge(postingStatusLabel(item))}</td>
            </tr>
          `).join("") || '<tr><td colspan="7"><div class="empty">조건에 맞는 공고가 없습니다.</div></td></tr>'}
        </tbody>
      </table>
    </section>
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="detail-section">
          <div class="toolbar">
            <h3>공고 상세</h3>
            ${selectedPosting ? '<div class="filters"><button class="button-secondary" id="postingCopyButton">공고 복사</button></div>' : ""}
          </div>
          ${selectedPosting ? `
            <form class="detail-form" id="postingDetailForm">
              <input type="hidden" name="id" value="${selectedPosting.id}" />
              <label>공고명<input type="text" name="title" value="${selectedPosting.title}" required /></label>
              <label>채용부서<select name="orgId">${visibleOrgs().map((item) => `<option value="${item.id}" ${selectedPosting.orgId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
              <label>직무<input type="text" name="jobRole" value="${selectedPosting.jobRole}" required /></label>
              <label>채용인원<input type="number" name="headcount" value="${selectedPosting.headcount}" required /></label>
              <label>고용형태<select name="employmentType">${["정규직","계약직","파견직"].map((item) => `<option value="${item}" ${selectedPosting.employmentType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>근무지<input type="text" name="workLocation" value="${selectedPosting.workLocation || ""}" /></label>
              <label>접수시작일<input type="date" name="openDate" value="${selectedPosting.openDate || ""}" /></label>
              <label>접수마감일<input type="date" name="closeDate" value="${selectedPosting.closeDate || ""}" /></label>
              <label>공고상태<select name="postingStatus">${["draft","posted","closed"].map((item) => `<option value="${item}" ${postingStatusLabel(selectedPosting) === item ? "selected" : ""}>${labelCode(item)}</option>`).join("")}</select></label>
              <label>희망입사일<input type="date" name="requestedJoinDate" value="${selectedPosting.requestedJoinDate || ""}" /></label>
              <label class="full">자격요건<textarea name="reason">${selectedPosting.reason || ""}</textarea></label>
              <label class="full">우대사항<textarea name="preferredQualifications">${selectedPosting.preferredQualifications || ""}</textarea></label>
              <div class="full actions">
                <button type="submit" class="button">저장</button>
                <button type="button" class="button-secondary" id="postingPrintButton">출력</button>
              </div>
            </form>
          ` : '<div class="empty">선택된 공고가 없습니다.</div>'}
        </section>
        <section class="detail-section">
          <h3>공고 변경 이력</h3>
          <div class="history-list">
            ${postingChanges.map((item) => `
              <div class="history-item">
                <strong>${item.field}</strong>
                <div class="small-note">${item.changedBy} · ${item.changedAt}</div>
                <div class="small-note">${item.beforeValue || "-"} -> ${item.afterValue || "-"}</div>
              </div>
            `).join("") || '<div class="empty">변경 이력이 없습니다.</div>'}
          </div>
        </section>
      </article>
    </section>
  `;
  const pipelineView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>지원자 파이프라인</h3>
        <div class="filters"><button class="button-secondary" data-export="recruitment">다운로드</button><button class="button" data-open="applicant">지원자 등록</button></div>
      </div>
      <div class="pipeline">
        ${["screening","interview_1","interview_2","offer","hired","rejected"].map((stage) => `
          <div class="lane">
            <h4>${labelStage(stage)}</h4>
            ${applicants.filter((item) => item.stage === stage).map((item) => `
              <div class="item-card ${item.id === state.selectedCandidateId ? "is-selected" : ""}" data-candidate-row="${item.id}">
                <strong>${item.name}</strong>
                <small>${item.channel} · ${item.score}점 · ${item.status || "진행중"}</small>
                <div class="actions" style="margin-top:8px;">
                  <button class="button-secondary" data-applicant-action="advance" data-id="${item.id}" ${["hired", "rejected"].includes(item.stage) ? "disabled" : ""}>다음 단계</button>
                  ${stage === "offer" ? `<button class="button" data-applicant-action="hire" data-id="${item.id}" ${state.data.onboarding.some((entry) => entry.applicantId === item.id) ? "disabled" : ""}>입사확정</button>` : ""}
                </div>
              </div>
            `).join("") || '<div class="empty">대상 없음</div>'}
          </div>
        `).join("")}
      </div>
    </section>
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="detail-section">
          <h3>지원자 상세</h3>
          ${selectedCandidate ? `
            <form class="detail-form" id="candidateDetailForm">
              <input type="hidden" name="id" value="${selectedCandidate.id}" />
              <label>지원자명<input type="text" name="name" value="${selectedCandidate.name}" required /></label>
              <label>지원경로<select name="channel">${["사람인","원티드","잡코리아","추천"].map((item) => `<option value="${item}" ${selectedCandidate.channel === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>이메일<input type="text" name="email" value="${selectedCandidate.email || ""}" /></label>
              <label>연락처<input type="text" name="phone" value="${selectedCandidate.phone || ""}" /></label>
              <label>지원일<input type="date" name="appliedAt" value="${selectedCandidate.appliedAt || ""}" /></label>
              <label>전형상태<select name="status">${["진행중","합격검토","보류","불합격"].map((item) => `<option value="${item}" ${selectedCandidate.status === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>현재단계<select name="stage">${["screening","interview_1","interview_2","offer","hired","rejected"].map((item) => `<option value="${item}" ${selectedCandidate.stage === item ? "selected" : ""}>${labelStage(item)}</option>`).join("")}</select></label>
              <label>평가점수<input type="number" name="score" value="${selectedCandidate.score}" /></label>
              <label>처우협의(만원)<input type="number" name="proposedSalary" value="${selectedCandidate.proposedSalary || 0}" /></label>
              <label>예상입사일<input type="date" name="expectedJoinDate" value="${selectedCandidate.expectedJoinDate || ""}" /></label>
              <label>직군<input type="text" name="jobFamily" value="${selectedCandidate.jobFamily || ""}" placeholder="사무직 / 생산직" /></label>
              <label>제안직급<input type="text" name="desiredGrade" value="${selectedCandidate.desiredGrade || ""}" placeholder="예: S2" /></label>
              <label class="full">면접 코멘트<textarea name="interviewComment">${selectedCandidate.interviewComment || ""}</textarea></label>
              <label class="full">메모<textarea name="notes">${selectedCandidate.notes || ""}</textarea></label>
              <div class="full actions">
                <button type="submit" class="button">저장</button>
                <button type="button" class="button-secondary" id="candidateAttachmentButton">서류 등록</button>
              </div>
            </form>
          ` : '<div class="empty">선택된 지원자가 없습니다.</div>'}
        </section>
        <section class="detail-section">
          <h3>전형 이력</h3>
          <div class="history-list">
            ${candidateHistory.map((item) => `
              <div class="history-item">
                <strong>${item.stage}</strong>
                <div class="small-note">${item.changedBy} · ${item.changedAt}</div>
                <div class="small-note">${item.result} · ${item.comment}</div>
              </div>
            `).join("") || '<div class="empty">전형 이력이 없습니다.</div>'}
          </div>
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>첨부 서류</h3>
          <div class="attachment-list">
            ${candidateFiles.map((item) => `
              <div class="attachment-item">
                <strong>${item.name}</strong>
                <div class="small-note">${item.category} · ${item.uploadedAt}</div>
                <div class="actions" style="margin-top:8px;">
                  <button type="button" class="button-secondary" data-attachment-download="${item.id}">다운로드</button>
                </div>
              </div>
            `).join("") || '<div class="empty">등록된 지원 서류가 없습니다.</div>'}
          </div>
        </section>
        <section class="detail-section">
          <h3>지원자 변경 이력</h3>
          <div class="history-list">
            ${candidateChanges.map((item) => `
              <div class="history-item">
                <strong>${item.field}</strong>
                <div class="small-note">${item.changedBy} · ${item.changedAt}</div>
                <div class="small-note">${item.beforeValue || "-"} -> ${item.afterValue || "-"}</div>
              </div>
            `).join("") || '<div class="empty">변경 이력이 없습니다.</div>'}
          </div>
        </section>
      </article>
    </section>
  `;
  const reportView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>공고별 채용 현황</h3>
          <div class="filters"><button class="button-secondary" data-export="recruitment">다운로드</button></div>
        </div>
        <table>
          <thead><tr><th>공고명</th><th>부서</th><th>지원자</th><th>최종합격</th><th>상태</th></tr></thead>
          <tbody>
            ${requests.map((item) => {
              const candidates = requestCandidates(item.id);
              return `
                <tr>
                  <td>${item.title}</td>
                  <td>${orgName(item.orgId)}</td>
                  <td>${candidates.length}명</td>
                  <td>${candidates.filter((candidate) => candidate.stage === "hired").length}명</td>
                  <td>${badge(postingStatusLabel(item))}</td>
                </tr>
              `;
            }).join("") || '<tr><td colspan="5"><div class="empty">집계 대상 공고가 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>리포트 요약</h3>
        <div class="meta-list">
          <div class="meta-item"><strong>단계별 합격률</strong><span>${totalApplicants ? Math.round((hiredApplicants / totalApplicants) * 100) : 0}%</span></div>
          <div class="meta-item"><strong>채용 소요기간</strong><span>${avgDays}일</span></div>
          <div class="meta-item"><strong>채널별 유입</strong><span>${channelSummary}</span></div>
          <div class="meta-item"><strong>평균 평가점수</strong><span>${totalApplicants ? Math.round(visibleApplicants().reduce((acc, item) => acc + Number(item.score || 0), 0) / totalApplicants) : 0}점</span></div>
        </div>
      </article>
    </section>
    <section class="grid-3">
      ${["screening","interview_1","interview_2","offer","hired","rejected"].map((stage) => `
        <article class="card">
          <h3>${labelStage(stage)}</h3>
          <div class="metric-list">
            <div class="metric-row"><span>인원</span><strong>${visibleApplicants().filter((item) => item.stage === stage).length}명</strong></div>
            <div class="metric-row"><span>비중</span><strong>${totalApplicants ? Math.round((visibleApplicants().filter((item) => item.stage === stage).length / totalApplicants) * 100) : 0}%</strong></div>
          </div>
        </article>
      `).join("")}
    </section>
  `;
  return `${summaryCards}${activeSubSection === "pipeline" ? pipelineView : activeSubSection === "report" ? reportView : postingView}`;
}

function renderPeoplePage(ctx) {
  const {
    state, filteredVisibleEmployees, visibleHrActions, defaultEmployeeFields, byId,
    employeeAttachments, employeeChangeHistory, visibleOrgs, orgName, badge, employeeName, permissions,
    ageFromResidentNumber, birthDateFromResidentNumber, koreanAgeFromResidentNumber, maskResidentNumber, tenureYears
  } = ctx;
  const employees = filteredVisibleEmployees();
  const actions = visibleHrActions();
  if (!state.selectedEmployeeId || !employees.some((item) => item.id === state.selectedEmployeeId)) state.selectedEmployeeId = employees[0]?.id || null;
  const selectedEmployee = defaultEmployeeFields(byId(state.data.employees, state.selectedEmployeeId) || employees[0] || {});
  const attachments = selectedEmployee.id ? employeeAttachments(selectedEmployee.id) : [];
  const history = selectedEmployee.id ? employeeChangeHistory(selectedEmployee.id).slice(0, 8) : [];
  const canEdit = permissions.canEditPeople();
  const canDelete = permissions.canDeletePeople();
  const canViewSensitive = selectedEmployee.id ? permissions.canViewSensitiveEmployee(selectedEmployee.id) : false;
  const canViewSalary = selectedEmployee.id ? permissions.canViewSalary(selectedEmployee.id) : false;
  const activeSubSection = state.subSection || "dashboard";
  const dashboardFilters = state.peopleDashboardFilters || { grade: "", tenureBand: "", leaderOnly: "", siteCompare: "current" };
  const dashboardBaseEmployees = (dashboardFilters.siteCompare === "all" && canEdit)
    ? state.data.employees.map((item) => defaultEmployeeFields(item))
    : employees;
  const filteredDashboardEmployees = dashboardBaseEmployees.filter((item) => {
    const employee = defaultEmployeeFields(item);
    const tenure = tenureYears(employee.hireDate);
    const isLeader = state.data.orgs.some((org) => org.leader === employee.id);
    const tenureMatched =
      !dashboardFilters.tenureBand ||
      (dashboardFilters.tenureBand === "under1" && tenure !== null && tenure < 1) ||
      (dashboardFilters.tenureBand === "1to3" && tenure !== null && tenure >= 1 && tenure < 3) ||
      (dashboardFilters.tenureBand === "3to5" && tenure !== null && tenure >= 3 && tenure < 5) ||
      (dashboardFilters.tenureBand === "over5" && tenure !== null && tenure >= 5);
    return (
      (!dashboardFilters.grade || employee.grade === dashboardFilters.grade) &&
      tenureMatched &&
      (!dashboardFilters.leaderOnly || (dashboardFilters.leaderOnly === "leader" ? isLeader : !isLeader))
    );
  });
  const activeEmployees = filteredDashboardEmployees.filter((item) => item.status === "재직");
  const ageBands = [
    { label: "20대", min: 20, max: 29 },
    { label: "30대", min: 30, max: 39 },
    { label: "40대", min: 40, max: 49 },
    { label: "50대 이상", min: 50, max: 200 }
  ];
  const ageSummary = ageBands.map((band) => ({
    ...band,
    count: activeEmployees.filter((item) => {
      const age = ageFromResidentNumber(item.residentNumber);
      return age !== null && age >= band.min && age <= band.max;
    }).length
  }));
  const orgSummary = visibleOrgs().map((org) => ({
    label: org.name,
    count: activeEmployees.filter((employee) => employee.orgId === org.id).length
  })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);
  const employmentSummary = ["정규직", "계약직", "파견직"].map((type) => ({
    label: type,
    count: filteredDashboardEmployees.filter((item) => item.employmentType === type).length
  }));
  const jobFamilySummary = ["사무직", "생산직", "연구직"].map((type) => ({
    label: type,
    count: filteredDashboardEmployees.filter((item) => (item.jobFamily || "미분류") === type).length
  })).filter((item) => item.count > 0);
  const ageValues = activeEmployees.map((item) => ageFromResidentNumber(item.residentNumber)).filter((value) => value !== null);
  const averageAge = ageValues.length ? (ageValues.reduce((sum, value) => sum + value, 0) / ageValues.length).toFixed(1) : "-";
  const maxBar = Math.max(1, ...orgSummary.map((item) => item.count), ...employmentSummary.map((item) => item.count), ...ageSummary.map((item) => item.count), ...jobFamilySummary.map((item) => item.count));
  const dashboardView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>인사 대시보드 필터</h3>
        <div class="filters"><span class="badge neutral">${filteredDashboardEmployees.length}명 집계</span></div>
      </div>
      <div class="filters stretch">
        <label class="inline-field">직급<select id="peopleDashboardGradeFilter"><option value="">전체</option>${[...new Set(state.data.employees.map((item) => item.grade).filter(Boolean))].map((item) => `<option value="${item}" ${dashboardFilters.grade === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
        <label class="inline-field">입사연차<select id="peopleDashboardTenureFilter"><option value="">전체</option><option value="under1" ${dashboardFilters.tenureBand === "under1" ? "selected" : ""}>1년 미만</option><option value="1to3" ${dashboardFilters.tenureBand === "1to3" ? "selected" : ""}>1년 이상 3년 미만</option><option value="3to5" ${dashboardFilters.tenureBand === "3to5" ? "selected" : ""}>3년 이상 5년 미만</option><option value="over5" ${dashboardFilters.tenureBand === "over5" ? "selected" : ""}>5년 이상</option></select></label>
        <label class="inline-field">조직장 여부<select id="peopleDashboardLeaderFilter"><option value="">전체</option><option value="leader" ${dashboardFilters.leaderOnly === "leader" ? "selected" : ""}>조직장만</option><option value="member" ${dashboardFilters.leaderOnly === "member" ? "selected" : ""}>비조직장만</option></select></label>
        <label class="inline-field">사업장 비교<select id="peopleDashboardSiteFilter"><option value="current" ${dashboardFilters.siteCompare === "current" ? "selected" : ""}>현재 사업장</option>${canEdit ? `<option value="all" ${dashboardFilters.siteCompare === "all" ? "selected" : ""}>전체 사업장 비교</option>` : ""}</select></label>
      </div>
    </section>
    <section class="kpis">
      <article class="stat-card"><h3>전체 인원</h3><strong>${filteredDashboardEmployees.length}</strong><span>현재 필터 기준</span></article>
      <article class="stat-card"><h3>재직 인원</h3><strong>${activeEmployees.length}</strong><span>휴직/퇴직 제외</span></article>
      <article class="stat-card"><h3>평균 연령</h3><strong>${averageAge}</strong><span>주민번호 기준 만 나이</span></article>
      <article class="stat-card"><h3>계약직</h3><strong>${employmentSummary.find((item) => item.label === "계약직")?.count || 0}</strong><span>계약 종료 관리 대상</span></article>
      <article class="stat-card"><h3>인사 이벤트</h3><strong>${actions.length}</strong><span>발령/변동 누적</span></article>
    </section>
    <section class="grid-2">
      <article class="card">
        <div class="section-title"><h3>조직별 인원 분포</h3><span class="badge neutral">${orgSummary.length}개 조직</span></div>
        <div class="bar-list">
          ${orgSummary.map((item) => `
            <div class="bar-row">
              <div class="bar-meta"><span>${item.label}</span><strong>${item.count}명</strong></div>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.max(8, Math.round((item.count / maxBar) * 100))}%"></div></div>
            </div>
          `).join("") || '<div class="empty">집계할 조직이 없습니다.</div>'}
        </div>
      </article>
      <article class="card">
        <div class="section-title"><h3>연령대 분포</h3><span class="badge neutral">만 나이 기준</span></div>
        <div class="bar-list">
          ${ageSummary.map((item) => `
            <div class="bar-row">
              <div class="bar-meta"><span>${item.label}</span><strong>${item.count}명</strong></div>
              <div class="bar-track"><div class="bar-fill accent" style="width:${Math.max(item.count ? 8 : 0, Math.round((item.count / maxBar) * 100))}%"></div></div>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
    <section class="grid-3">
      <article class="card">
        <h3>고용형태 구성</h3>
        <div class="bar-list compact">
          ${employmentSummary.map((item) => `
            <div class="bar-row">
              <div class="bar-meta"><span>${item.label}</span><strong>${item.count}명</strong></div>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.max(item.count ? 8 : 0, Math.round((item.count / maxBar) * 100))}%"></div></div>
            </div>
          `).join("")}
        </div>
      </article>
      <article class="card">
        <h3>직군 구성</h3>
        <div class="bar-list compact">
          ${jobFamilySummary.map((item) => `
            <div class="bar-row">
              <div class="bar-meta"><span>${item.label}</span><strong>${item.count}명</strong></div>
              <div class="bar-track"><div class="bar-fill accent" style="width:${Math.max(item.count ? 8 : 0, Math.round((item.count / maxBar) * 100))}%"></div></div>
            </div>
          `).join("") || '<div class="empty">직군 데이터가 없습니다.</div>'}
        </div>
      </article>
      <article class="card">
        <h3>인사 운영 포인트</h3>
        <div class="mini-list">
          <div class="mini-item"><strong>수습 관리 대상</strong><small>${filteredDashboardEmployees.filter((item) => item.probationEndDate).length}명</small></div>
          <div class="mini-item"><strong>계약 종료 관리</strong><small>${filteredDashboardEmployees.filter((item) => item.contractEndDate).length}명</small></div>
          <div class="mini-item"><strong>주민번호 등록률</strong><small>${filteredDashboardEmployees.filter((item) => item.residentNumber).length}/${filteredDashboardEmployees.length || 0}명</small></div>
        </div>
      </article>
    </section>
    ${dashboardFilters.siteCompare === "all" && canEdit ? `
      <section class="table-card">
        <div class="toolbar">
          <h3>사업장별 비교</h3>
          <div class="filters"><span class="badge neutral">${state.data.sites.length}개 사업장</span></div>
        </div>
        <div class="bar-list">
          ${state.data.sites.map((site) => {
            const siteEmployeeCount = state.data.employees.filter((employee) => {
              const org = state.data.orgs.find((item) => item.id === employee.orgId);
              return org?.siteId === site.id;
            }).length;
            return `
              <div class="bar-row">
                <div class="bar-meta"><span>${site.name}</span><strong>${siteEmployeeCount}명</strong></div>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.max(siteEmployeeCount ? 8 : 0, Math.round((siteEmployeeCount / Math.max(1, state.data.employees.length)) * 100))}%"></div></div>
              </div>
            `;
          }).join("")}
        </div>
      </section>
    ` : ""}
  `;
  const listView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>인사카드</h3>
        <div class="filters"><button class="button-secondary" data-export="people">다운로드</button>${canEdit ? '<button class="button" data-open="employee">직원 등록</button>' : ""}</div>
      </div>
      <div class="filters stretch" style="margin-bottom:14px;">
        <label class="inline-field">이름/사번/직무 검색<input type="text" id="peopleQueryInput" value="${state.peopleFilters.query}" placeholder="예: 김하늘, 사번, 인사" /></label>
        <label class="inline-field">부서<select id="peopleOrgFilter"><option value="">전체</option>${visibleOrgs().map((item) => `<option value="${item.id}" ${state.peopleFilters.orgId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
        <label class="inline-field">고용형태<select id="peopleEmploymentFilter"><option value="">전체</option>${["정규직","계약직","파견직"].map((item) => `<option value="${item}" ${state.peopleFilters.employmentType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
        <label class="inline-field">재직상태<select id="peopleStatusFilter"><option value="">전체</option>${["재직","휴직","퇴직"].map((item) => `<option value="${item}" ${state.peopleFilters.status === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
      </div>
      <table>
        <thead><tr><th>사번</th><th>이름</th><th>조직</th><th>직무</th><th>직급</th><th>고용형태</th><th>상태</th></tr></thead>
        <tbody>
          ${employees.map((item) => `
            <tr class="${item.id === state.selectedEmployeeId ? "is-selected" : ""}" data-employee-row="${item.id}">
              <td>${item.id}</td>
              <td>${item.name}</td>
              <td>${orgName(item.orgId)}</td>
              <td>${item.job}</td>
              <td>${item.grade}</td>
              <td>${item.employmentType}</td>
              <td>${badge(item.status === "재직" ? "active" : "warn")}</td>
            </tr>
          `).join("") || '<tr><td colspan="7"><div class="empty">조건에 맞는 직원이 없습니다.</div></td></tr>'}
        </tbody>
      </table>
    </section>
  `;
  const cardView = `
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="detail-section">
          <div class="toolbar">
            <h3>인사카드 상세</h3>
            <div class="filters">
              ${selectedEmployee.id && canEdit ? '<button type="button" class="button-secondary" id="employeeQuickEditButton">인사카드 수정</button>' : ""}
              ${selectedEmployee.id ? badge(selectedEmployee.status === "재직" ? "active" : selectedEmployee.status) : ""}
              ${selectedEmployee.id ? badge(selectedEmployee.employmentType) : ""}
            </div>
          </div>
          ${selectedEmployee.id ? `
            <form class="detail-form" id="employeeDetailForm">
              <input type="hidden" name="id" value="${selectedEmployee.id}" />
              <label>성명<input type="text" name="name" value="${selectedEmployee.name}" ${canEdit ? "required" : "disabled"} /></label>
              <label>사번<input type="text" value="${selectedEmployee.id}" disabled /></label>
              <label>주민등록번호<input type="text" name="residentNumber" value="${canViewSensitive ? (selectedEmployee.residentNumber || "") : ""}" placeholder="${canViewSensitive ? "예: 900415-2000001" : "비공개"}" ${canEdit && canViewSensitive ? "" : "disabled"} /></label>
              <label>생년월일<input type="text" value="${canViewSensitive ? (birthDateFromResidentNumber(selectedEmployee.residentNumber) || "-") : "비공개"}" disabled /></label>
              <label>만 나이<input type="text" value="${canViewSensitive ? (ageFromResidentNumber(selectedEmployee.residentNumber) ?? "-") : "비공개"}" disabled /></label>
              <label>한국식 나이<input type="text" value="${canViewSensitive ? (koreanAgeFromResidentNumber(selectedEmployee.residentNumber) ?? "-") : "비공개"}" disabled /></label>
              <label>조직<select name="orgId" ${canEdit ? "" : "disabled"}>${visibleOrgs().map((item) => `<option value="${item.id}" ${selectedEmployee.orgId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
              <label>직무<input type="text" name="job" value="${selectedEmployee.job}" ${canEdit ? "required" : "disabled"} /></label>
              <label>직군<input type="text" name="jobFamily" value="${selectedEmployee.jobFamily || ""}" placeholder="사무직 / 생산직" ${canEdit ? "" : "disabled"} /></label>
              <label>직급<input type="text" name="grade" value="${selectedEmployee.grade}" ${canEdit ? "required" : "disabled"} /></label>
              <label>직책<input type="text" name="positionTitle" value="${selectedEmployee.positionTitle || ""}" placeholder="팀장, 반장 등" ${canEdit ? "" : "disabled"} /></label>
              <label>권한역할<select name="role" ${canEdit ? "" : "disabled"}>${["시스템 관리자","HR 관리자","급여 담당자","본부장","조직장","구성원"].map((item) => `<option value="${item}" ${selectedEmployee.role === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>고용형태<select name="employmentType" ${canEdit ? "" : "disabled"}>${["정규직","계약직","파견직"].map((item) => `<option value="${item}" ${selectedEmployee.employmentType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>재직상태<select name="status" ${canEdit ? "" : "disabled"}>${["재직","휴직","퇴직"].map((item) => `<option value="${item}" ${selectedEmployee.status === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>입사일<input type="date" name="hireDate" value="${selectedEmployee.hireDate || ""}" ${canEdit ? "" : "disabled"} /></label>
              <label>수습종료일<input type="date" name="probationEndDate" value="${selectedEmployee.probationEndDate || ""}" ${canEdit ? "" : "disabled"} /></label>
              <label>계약종료일<input type="date" name="contractEndDate" value="${selectedEmployee.contractEndDate || ""}" ${canEdit ? "" : "disabled"} /></label>
              <label>이메일<input type="text" name="email" value="${canViewSensitive ? (selectedEmployee.email || "") : ""}" placeholder="${canViewSensitive ? "" : "비공개"}" ${canEdit && canViewSensitive ? "" : "disabled"} /></label>
              <label>연락처<input type="text" name="phone" value="${canViewSensitive ? (selectedEmployee.phone || "") : ""}" placeholder="${canViewSensitive ? "" : "비공개"}" ${canEdit && canViewSensitive ? "" : "disabled"} /></label>
              <label>비상연락처<input type="text" name="emergencyContact" value="${canViewSensitive ? (selectedEmployee.emergencyContact || "") : ""}" placeholder="${canViewSensitive ? "" : "비공개"}" ${canEdit && canViewSensitive ? "" : "disabled"} /></label>
              <label class="full">주소<input type="text" name="address" value="${canViewSensitive ? (selectedEmployee.address || "") : ""}" placeholder="${canViewSensitive ? "" : "비공개"}" ${canEdit && canViewSensitive ? "" : "disabled"} /></label>
              <label class="full">학력<textarea name="education" ${canEdit ? "" : "disabled"}>${selectedEmployee.education || ""}</textarea></label>
              <label class="full">경력사항<textarea name="careerSummary" ${canEdit ? "" : "disabled"}>${selectedEmployee.careerSummary || ""}</textarea></label>
              <label class="full">자격사항<textarea name="certifications" ${canEdit ? "" : "disabled"}>${selectedEmployee.certifications || ""}</textarea></label>
              <label class="full">가족사항<textarea name="familyNotes" ${canEdit ? "" : "disabled"}>${selectedEmployee.familyNotes || ""}</textarea></label>
              <label>병역<input type="text" name="militaryService" value="${selectedEmployee.militaryService || ""}" ${canEdit ? "" : "disabled"} /></label>
              <label>장애/보훈<input type="text" name="disabilityVeteran" value="${selectedEmployee.disabilityVeteran || ""}" ${canEdit ? "" : "disabled"} /></label>
              <label>연봉(만원)<input type="number" name="annualSalary" value="${canViewSalary ? (selectedEmployee.annualSalary || 0) : 0}" ${canEdit && canViewSalary ? "" : "disabled"} /></label>
              <div class="full actions">
                ${canEdit ? '<button type="submit" class="button">저장</button>' : ""}
                <button type="button" class="button-secondary" id="employeePrintButton">출력</button>
                ${canDelete ? '<button type="button" class="button-danger" id="employeeDeleteButton">삭제</button>' : ""}
              </div>
            </form>
          ` : '<div class="empty">선택된 직원이 없습니다.</div>'}
        </section>
        <section class="detail-section">
          <h3>인사 이력 이벤트</h3>
          <div class="mini-list">
            ${actions.filter((item) => !selectedEmployee.id || item.employeeId === selectedEmployee.id).map((item) => `
              <div class="mini-item">
                <strong>${employeeName(item.employeeId)} · ${item.type}</strong>
                <small>${item.effectiveDate} · ${badge(item.status)}</small>
              </div>
            `).join("") || '<div class="empty">이력 없음</div>'}
          </div>
        </section>
      </article>
    </section>
  `;
  const historyView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>인사 이벤트 이력</h3>
          <div class="filters">${selectedEmployee.id ? `<span class="badge brand">${selectedEmployee.name}</span>` : ""}</div>
        </div>
        <table>
          <thead><tr><th>대상자</th><th>이력유형</th><th>발효일</th><th>상태</th><th>메모</th></tr></thead>
          <tbody>
            ${actions.filter((item) => !selectedEmployee.id || item.employeeId === selectedEmployee.id).map((item) => `
              <tr>
                <td>${employeeName(item.employeeId)}</td>
                <td>${item.type}</td>
                <td>${item.effectiveDate}</td>
                <td>${badge(item.status)}</td>
                <td>${item.note || "-"}</td>
              </tr>
            `).join("") || '<tr><td colspan="5"><div class="empty">이력 없음</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>변경 이력</h3>
          <div class="history-list">
            ${history.map((item) => `
              <div class="history-item">
                <strong>${item.field}</strong>
                <div class="small-note">${item.changedBy} · ${item.changedAt}</div>
                <div class="small-note">${item.beforeValue || "-"} -> ${item.afterValue || "-"}</div>
              </div>
            `).join("") || '<div class="empty">변경 이력이 없습니다.</div>'}
          </div>
        </section>
        <section class="detail-section">
          <h3>이력 요약</h3>
          <div class="meta-list">
            <div class="meta-item"><strong>선택 직원 이력 수</strong><span>${actions.filter((item) => !selectedEmployee.id || item.employeeId === selectedEmployee.id).length}건</span></div>
            <div class="meta-item"><strong>미확정 발령</strong><span>${actions.filter((item) => item.status !== "finalized").length}건</span></div>
            <div class="meta-item"><strong>변경 이력</strong><span>${history.length}건</span></div>
          </div>
        </section>
      </article>
    </section>
  `;
  const attachmentView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>직원 첨부문서</h3>
          <div class="filters">
            ${selectedEmployee.id && canEdit ? '<button class="button-secondary" id="employeeAttachmentButton">첨부 등록</button>' : ""}
            ${selectedEmployee.id ? `<span class="badge brand">${selectedEmployee.name}</span>` : ""}
          </div>
        </div>
        <div class="attachment-list">
          ${attachments.map((item) => `
            <div class="attachment-item">
              <strong>${item.name}</strong>
              <div class="small-note">${item.category} · ${item.uploadedAt} · ${item.uploadedBy}</div>
              <div class="small-note">${item.effectiveFrom ? `효력 ${item.effectiveFrom}` : "효력일 미지정"}${item.expiresAt ? ` · 만료 ${item.expiresAt}` : ""}</div>
              <div class="actions" style="margin-top:8px;">
                <button type="button" class="button-secondary" data-attachment-download="${item.id}">다운로드</button>
              </div>
            </div>
          `).join("") || '<div class="empty">등록된 첨부가 없습니다.</div>'}
        </div>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>문서 분류 요약</h3>
          <div class="meta-list">
            <div class="meta-item"><strong>전체 문서</strong><span>${attachments.length}건</span></div>
            <div class="meta-item"><strong>근로계약/증빙</strong><span>${attachments.filter((item) => ["근로계약서", "증빙서류"].includes(item.category)).length}건</span></div>
            <div class="meta-item"><strong>자격/기타</strong><span>${attachments.filter((item) => !["근로계약서", "증빙서류"].includes(item.category)).length}건</span></div>
          </div>
        </section>
        <section class="detail-section">
          <h3>문서 변경 이력</h3>
          <div class="history-list">
            ${history.map((item) => `
              <div class="history-item">
                <strong>${item.field}</strong>
                <div class="small-note">${item.changedBy} · ${item.changedAt}</div>
                <div class="small-note">${item.beforeValue || "-"} -> ${item.afterValue || "-"}</div>
              </div>
            `).join("") || '<div class="empty">변경 이력이 없습니다.</div>'}
          </div>
        </section>
      </article>
    </section>
  `;
  return activeSubSection === "dashboard"
    ? dashboardView
    : activeSubSection === "history"
      ? historyView
      : activeSubSection === "attachment"
        ? attachmentView
        : `${listView}${cardView}`;
}



/* src/pages/opsPages.js */
function renderOrgPage(ctx) {
  const { state, visibleOrgs, normalizedOrg, entityChangeHistory, currentSite, visibleEmployees, orgName, employeeName, badge, labelCode, workflowSnapshot } = ctx;
  const orgs = visibleOrgs().map((item) => normalizedOrg(item));
  const flow = typeof workflowSnapshot === "function"
    ? workflowSnapshot()
    : { rows: [], orgBlockedCount: 0, orgReadyCount: 0, reviewPendingCount: 0, compLinkedCount: 0, payrollLinkedCount: 0, approvalPendingCount: 0 };
  const hasEntitySiteBase = (state.data.entities || []).length && (state.data.sites || []).length;
  if (!state.selectedOrgId || !orgs.some((item) => item.id === state.selectedOrgId)) state.selectedOrgId = orgs[0]?.id || null;
  const selectedOrg = orgs.find((item) => item.id === state.selectedOrgId) || null;
  const orgChanges = selectedOrg ? entityChangeHistory("org", selectedOrg.id).slice(0, 6) : [];
  const activeSubSection = state.subSection || "structure";
  const summaryCards = `
    <section class="grid-3">
      <article class="stat-card"><h3>조직 수</h3><strong>${orgs.length}</strong><span>${currentSite().name} 기준</span></article>
      <article class="stat-card"><h3>직군 코드</h3><strong>${(state.data.jobFamilies || []).length}</strong><span>사무/생산 체계</span></article>
      <article class="stat-card"><h3>권한 정책</h3><strong>${(state.data.permissionPolicies || []).length}</strong><span>역할별 범위 정의</span></article>
    </section>
  `;
  const structureView = `
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="table-card">
          <div class="toolbar">
            <h3>조직 목록</h3>
            <div class="filters"><button class="button-secondary" data-export="org">다운로드</button><button class="button" data-open="org">조직 추가</button></div>
          </div>
          <table>
            <thead><tr><th>조직명</th><th>상위조직</th><th>리더</th><th>유형</th><th>원가센터</th><th>상태</th></tr></thead>
            <tbody>
              ${orgs.map((org) => `
                <tr class="${org.id === state.selectedOrgId ? "is-selected" : ""}" data-org-row="${org.id}">
                  <td>${org.name}</td>
                  <td>${org.parentId ? orgName(org.parentId) : "-"}</td>
                  <td>${employeeName(org.leader)}</td>
                  <td>${org.orgType}</td>
                  <td>${org.costCenter || "-"}</td>
                  <td>${badge(org.status)}</td>
                </tr>
              `).join("") || `<tr><td colspan="6"><div class="empty">${hasEntitySiteBase ? "등록된 조직이 없습니다. 상단의 조직 추가로 시작하세요." : "먼저 운영자 콘솔에서 법인/사업장을 등록한 뒤 조직을 생성하세요."}</div></td></tr>`}
            </tbody>
          </table>
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>조직 상세</h3>
          ${selectedOrg ? `
            <form class="detail-form" id="orgDetailForm">
              <input type="hidden" name="id" value="${selectedOrg.id}" />
              <label>조직명<input type="text" name="name" value="${selectedOrg.name}" /></label>
              <label>상위조직<select name="parentId"><option value="">없음</option>${orgs.filter((item) => item.id !== selectedOrg.id).map((item) => `<option value="${item.id}" ${selectedOrg.parentId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
              <label>조직장<select name="leader">${visibleEmployees().map((item) => `<option value="${item.id}" ${selectedOrg.leader === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
              <label>정원<input type="number" name="headcount" value="${selectedOrg.headcount}" /></label>
              <label>조직유형<select name="orgType">${["본부","실","팀","파트"].map((item) => `<option value="${item}" ${selectedOrg.orgType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>원가센터<input type="text" name="costCenter" value="${selectedOrg.costCenter || ""}" /></label>
              <label>보안등급<select name="securityLevel">${["high","medium","low"].map((item) => `<option value="${item}" ${selectedOrg.securityLevel === item ? "selected" : ""}>${labelCode(item)}</option>`).join("")}</select></label>
              <label>상태<select name="status">${["active","closed"].map((item) => `<option value="${item}" ${selectedOrg.status === item ? "selected" : ""}>${labelCode(item)}</option>`).join("")}</select></label>
              <div class="full actions"><button type="submit" class="button">저장</button></div>
            </form>
          ` : `<div class="empty">${hasEntitySiteBase ? "선택된 조직이 없습니다." : "조직 기준정보를 만들려면 법인과 사업장부터 등록해야 합니다."}</div>`}
        </section>
        <section class="detail-section">
          <h3>조직 변경 이력</h3>
          <div class="history-list">
            ${orgChanges.map((item) => `
              <div class="history-item">
                <strong>${item.field}</strong>
                <div class="small-note">${item.changedBy} · ${item.changedAt}</div>
                <div class="small-note">${item.beforeValue || "-"} -> ${item.afterValue || "-"}</div>
              </div>
            `).join("") || '<div class="empty">변경 이력이 없습니다.</div>'}
          </div>
        </section>
      </article>
    </section>
  `;
  const permissionView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>권한 매트릭스</h3>
        <div class="filters"><button class="button-secondary" data-export="org">다운로드</button></div>
      </div>
      <table><thead><tr><th>역할</th><th>데이터 범위</th><th>급여접근</th><th>인사접근</th><th>승인범위</th></tr></thead><tbody>${(state.data.permissionPolicies || []).map((item) => `<tr><td>${item.role}</td><td>${item.scope}</td><td>${item.payrollAccess}</td><td>${item.employeeAccess}</td><td>${item.approvalScope}</td></tr>`).join("")}</tbody></table>
    </section>
    <section class="table-card">
      <div class="toolbar">
        <h3>조직-평가-보상 연동 상태</h3>
        <div class="filters"><span class="badge neutral">${flow.rows.length}개 조직</span></div>
      </div>
      <table>
        <thead><tr><th>조직</th><th>리더/권한</th><th>평가 준비</th><th>보상 연계</th><th>승진/퇴직 영향</th></tr></thead>
        <tbody>
          ${flow.rows.map((item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.leaderAssigned ? "리더 지정" : "리더 미지정"} / ${item.permissionOwnerAssigned ? "역할 지정" : "권한 오너 필요"}</td>
              <td>${item.currentCycleTitle} · ${item.reviewCompletion}%</td>
              <td>${item.compLinked ? "보상안 연결" : "보상안 미생성"}</td>
              <td>승진 ${item.promotionCount}명 / 퇴직 ${item.exitCount}건</td>
            </tr>
          `).join("") || '<tr><td colspan="5"><div class="empty">연동 상태를 계산할 조직이 없습니다.</div></td></tr>'}
        </tbody>
      </table>
    </section>
    <section class="grid-3">
      ${(state.data.permissionPolicies || []).map((item) => `
        <article class="card">
          <h3>${item.role}</h3>
          <div class="meta-list">
            <div class="meta-item"><strong>범위</strong><span>${item.scope}</span></div>
            <div class="meta-item"><strong>급여</strong><span>${item.payrollAccess}</span></div>
            <div class="meta-item"><strong>인사</strong><span>${item.employeeAccess}</span></div>
            <div class="meta-item"><strong>승인</strong><span>${item.approvalScope}</span></div>
          </div>
        </article>
      `).join("")}
    </section>
  `;
  const codeView = `
    <section class="grid-3">
      <article class="table-card">
        <h3>직군 코드</h3>
        <table><thead><tr><th>코드</th><th>명칭</th><th>상태</th></tr></thead><tbody>${(state.data.jobFamilies || []).map((item) => `<tr><td>${item.code}</td><td>${item.name}</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody></table>
      </article>
      <article class="table-card">
        <h3>직급 코드</h3>
        <table><thead><tr><th>코드</th><th>명칭</th><th>트랙</th><th>상태</th></tr></thead><tbody>${(state.data.gradeCodes || []).map((item) => `<tr><td>${item.code}</td><td>${item.name}</td><td>${item.track}</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody></table>
      </article>
      <article class="table-card">
        <h3>직책 코드</h3>
        <table><thead><tr><th>코드</th><th>명칭</th><th>상태</th></tr></thead><tbody>${(state.data.positionCodes || []).map((item) => `<tr><td>${item.code}</td><td>${item.name}</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody></table>
      </article>
    </section>
  `;
  return `${summaryCards}${activeSubSection === "permission" ? permissionView : activeSubSection === "code" ? codeView : structureView}`;
}

function renderAttendancePage(ctx) {
  const { state, leaveBalanceRows, visibleLeaveRequests, visibleAttendanceClosures, orgName, employeeName, badge } = ctx;
  const currentYear = 2026;
  const leaveRows = leaveBalanceRows(currentYear);
  const leaveRequests = visibleLeaveRequests().filter((item) => String(item.from || "").startsWith(String(currentYear)));
  const attendanceClosures = visibleAttendanceClosures();
  const leaveChanges = (state.data.changeHistory || []).filter((item) => ["leaveBalance", "leaveUsage"].includes(item.entityType)).slice(0, 8);
  const activeSubSection = state.subSection || "balance";
  const summaryCards = `
    <section class="grid-3">
      <article class="stat-card"><h3>발생연차</h3><strong>${leaveRows.reduce((acc, item) => acc + item.grantedDays + item.carryoverDays + item.adjustmentDays, 0)}</strong><span>${currentYear}년 기준</span></article>
      <article class="stat-card"><h3>사용연차</h3><strong>${leaveRows.reduce((acc, item) => acc + item.usedDays, 0)}</strong><span>그룹웨어 반영분 포함</span></article>
      <article class="stat-card"><h3>잔여연차</h3><strong>${leaveRows.reduce((acc, item) => acc + item.remainingDays, 0)}</strong><span>직원별 잔여 합계</span></article>
    </section>
  `;
  const balanceView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>연차 원장</h3>
        <div class="filters">
          <button class="button-secondary" data-export="attendance">다운로드</button>
          <button class="button" data-open="leaveGrant">발생연차 입력</button>
        </div>
      </div>
      <table>
        <thead><tr><th>직원</th><th>부서</th><th>발생</th><th>이월</th><th>조정</th><th>사용</th><th>잔여</th></tr></thead>
        <tbody>
          ${leaveRows.map((item) => `
            <tr>
              <td>${item.employee.name}</td>
              <td>${orgName(item.employee.orgId)}</td>
              <td>${item.grantedDays}</td>
              <td>${item.carryoverDays}</td>
              <td>${item.adjustmentDays}</td>
              <td>${item.usedDays}</td>
              <td>${item.remainingDays}</td>
            </tr>
          `).join("") || '<tr><td colspan="7"><div class="empty">등록된 연차 원장이 없습니다.</div></td></tr>'}
        </tbody>
      </table>
    </section>
    <section class="table-card">
      <div class="toolbar">
        <h3>연차 변경 이력</h3>
        <div class="filters"><span class="badge neutral">${leaveChanges.length}건</span></div>
      </div>
      <div class="history-list">
        ${leaveChanges.map((item) => `
          <div class="history-item">
            <strong>${item.field}</strong>
            <div class="small-note">${item.changedBy} · ${item.changedAt}</div>
            <div class="small-note">${item.beforeValue || "-"} -> ${item.afterValue || "-"}</div>
          </div>
        `).join("") || '<div class="empty">변경 이력이 없습니다.</div>'}
      </div>
    </section>
  `;
  const usageView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>사용연차 반영내역</h3>
        <div class="filters">
          <button class="button-secondary" data-export="attendance">다운로드</button>
          <button class="button" data-open="leaveUsageBatch">일괄입력</button>
        </div>
      </div>
      <table>
        <thead><tr><th>직원</th><th>유형</th><th>사용기간</th><th>일수</th><th>반영상태</th><th>메모</th></tr></thead>
        <tbody>
          ${leaveRequests.map((item) => `
            <tr>
              <td>${employeeName(item.employeeId)}</td>
              <td>${item.leaveType}</td>
              <td>${item.from}${item.from !== item.to ? ` ~ ${item.to}` : ""}</td>
              <td>${item.days}</td>
              <td>${badge(item.status)}</td>
              <td>${item.note || "-"}</td>
            </tr>
          `).join("") || '<tr><td colspan="6"><div class="empty">반영된 사용연차가 없습니다.</div></td></tr>'}
        </tbody>
      </table>
    </section>
    <section class="table-card">
      <div class="toolbar">
        <h3>반영 이력</h3>
        <div class="filters"><span class="badge neutral">${leaveChanges.filter((item) => item.entityType === "leaveUsage").length}건</span></div>
      </div>
      <div class="history-list">
        ${leaveChanges.filter((item) => item.entityType === "leaveUsage").map((item) => `
          <div class="history-item">
            <strong>${item.field}</strong>
            <div class="small-note">${item.changedBy} · ${item.changedAt}</div>
            <div class="small-note">${item.beforeValue || "-"} -> ${item.afterValue || "-"}</div>
          </div>
        `).join("") || '<div class="empty">반영 이력이 없습니다.</div>'}
      </div>
    </section>
  `;
  const closingView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>근태 마감 참고</h3>
        <div class="filters"><button class="button" data-open="timeClose">마감 회차 추가</button></div>
      </div>
      <table>
        <thead><tr><th>기간</th><th>조직</th><th>이상치</th><th>미승인</th><th>상태</th></tr></thead>
        <tbody>
          ${attendanceClosures.map((item) => `
            <tr>
              <td>${item.period}</td>
              <td>${orgName(item.orgId)}</td>
              <td>${item.anomalies}</td>
              <td>${item.pendingApprovals}</td>
              <td>${badge(item.status)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
    <section class="grid-3">
      <article class="card"><h3>마감 회차</h3><div class="metric-list"><div class="metric-row"><span>전체</span><strong>${attendanceClosures.length}건</strong></div></div></article>
      <article class="card"><h3>진행 중</h3><div class="metric-list"><div class="metric-row"><span>미마감</span><strong>${attendanceClosures.filter((item) => item.status !== "closed").length}건</strong></div></div></article>
      <article class="card"><h3>이상치</h3><div class="metric-list"><div class="metric-row"><span>누적</span><strong>${attendanceClosures.reduce((acc, item) => acc + Number(item.anomalies || 0), 0)}건</strong></div></div></article>
    </section>
  `;
  return `${summaryCards}${activeSubSection === "usage" ? usageView : activeSubSection === "closing" ? closingView : balanceView}`;
}

function renderPayrollPage(ctx) {
  const {
    state, visiblePayrollAnomalies, normalizedPayrollPeriod, normalizedPayrollRule, payrollAuditLogs,
    entityChangeHistory, money, badge, byId, employeeName, labelCode, permissions, visibleEmployees, workflowSnapshot
  } = ctx;
  const flow = typeof workflowSnapshot === "function"
    ? workflowSnapshot()
    : { rows: [], orgBlockedCount: 0, orgReadyCount: 0, reviewPendingCount: 0, compLinkedCount: 0, payrollLinkedCount: 0, approvalPendingCount: 0 };
  const canEditPayroll = permissions.canEditPayroll();
  const anomalies = visiblePayrollAnomalies();
  const periods = state.data.payrollPeriods.map((item) => normalizedPayrollPeriod(item));
  const rules = state.data.payrollRules.map((item) => normalizedPayrollRule(item));
  const activeEmployees = visibleEmployees().filter((item) => item.status === "재직");
  const openCompPlans = state.data.compensationPlans.filter((item) => ["simulated", "approved", "completed"].includes(item.status));
  if (!state.selectedPayrollPeriodId || !periods.some((item) => item.id === state.selectedPayrollPeriodId)) state.selectedPayrollPeriodId = periods[0]?.id || null;
  if (!state.selectedPayrollRuleId || !rules.some((item) => item.id === state.selectedPayrollRuleId)) state.selectedPayrollRuleId = rules[0]?.id || null;
  const selectedPeriod = periods.find((item) => item.id === state.selectedPayrollPeriodId) || null;
  const selectedRule = rules.find((item) => item.id === state.selectedPayrollRuleId) || null;
  const payrollLogs = payrollAuditLogs().slice(0, 8);
  const periodChanges = selectedPeriod ? entityChangeHistory("payrollPeriod", selectedPeriod.id).slice(0, 6) : [];
  const ruleChanges = selectedRule ? entityChangeHistory("payrollRule", selectedRule.id).slice(0, 6) : [];
  const linkedCompPlan = selectedPeriod ? byId(state.data.compensationPlans, selectedPeriod.linkedCompPlanId) : null;
  const payrollEntries = selectedPeriod
    ? (state.data.payrollEntries || []).filter((item) => item.periodId === selectedPeriod.id).map((item) => normalizedPayrollEntry(item))
    : [];
  const activeSubSection = state.subSection || "period";
  const summaryCards = `
    <section class="grid-3">
      <article class="stat-card"><h3>급여 회차</h3><strong>${periods.length}</strong><span>등록된 지급 주기</span></article>
      <article class="stat-card"><h3>활성 규칙</h3><strong>${rules.filter((item) => item.status === "active").length}</strong><span>지급/공제 기준</span></article>
      <article class="stat-card"><h3>급여 로그</h3><strong>${payrollLogs.length}</strong><span>최근 변경 기록</span></article>
    </section>
  `;
  const periodView = `
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="table-card">
          <div class="toolbar">
            <h3>급여 회차</h3>
            <div class="filters"><button class="button-secondary" data-export="payroll">다운로드</button>${canEditPayroll ? '<button class="button" data-open="payroll">급여 회차 생성</button>' : ""}</div>
          </div>
          <table>
            <thead><tr><th>지급월</th><th>지급구분</th><th>대상 인원</th><th>총지급액</th><th>이상치</th><th>상태</th><th>액션</th></tr></thead>
            <tbody>
              ${periods.map((item) => `
                <tr class="${item.id === state.selectedPayrollPeriodId ? "is-selected" : ""}" data-payroll-period-row="${item.id}">
                  <td>${item.period}</td>
                  <td>${item.payType}</td>
                  <td>${item.employeeCount}</td>
                  <td>${money(item.grossPay)}원</td>
                  <td>${item.anomalies}</td>
                  <td>${badge(item.status)}</td>
                  <td>${canEditPayroll ? `<div class="actions"><button class="button-secondary" data-payroll-action="calculate" data-id="${item.id}">계산</button><button class="button-secondary" data-payroll-action="verify" data-id="${item.id}">검증</button><button class="button" data-payroll-action="close" data-id="${item.id}">마감</button></div>` : '<span class="small-note">조회 전용</span>'}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>급여주기 상세</h3>
          ${selectedPeriod ? `
            <form class="detail-form" id="payrollPeriodForm">
              <input type="hidden" name="id" value="${selectedPeriod.id}" />
              <label>지급월<input type="month" name="period" value="${selectedPeriod.period}" /></label>
              <label>지급구분<select name="payType">${["월급","상여","성과급"].map((item) => `<option value="${item}" ${selectedPeriod.payType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>대상 인원<input type="number" name="employeeCount" value="${selectedPeriod.employeeCount}" /></label>
              <label>총지급액<input type="number" name="grossPay" value="${selectedPeriod.grossPay}" /></label>
              <label>고정급 합계<input type="number" name="baseGrossPay" value="${selectedPeriod.baseGrossPay || 0}" /></label>
              <label>보상 반영액<input type="number" name="compensationGrossPay" value="${selectedPeriod.compensationGrossPay || 0}" /></label>
              <label>연계 보상안<select name="linkedCompPlanId"><option value="">없음</option>${openCompPlans.map((item) => `<option value="${item.id}" ${selectedPeriod.linkedCompPlanId === item.id ? "selected" : ""}>${byId(state.data.evaluationCycles, item.cycleId)?.title || "-"} · ${item.effectiveMonth || "-"}</option>`).join("")}</select></label>
              <label>마감기준일<input type="date" name="cutoffDate" value="${selectedPeriod.cutoffDate || ""}" /></label>
              <label>지급예정일<input type="date" name="payDate" value="${selectedPeriod.payDate || ""}" /></label>
              <label>진행상태<select name="status">${["drafting","calculated","verified","closed"].map((item) => `<option value="${item}" ${selectedPeriod.status === item ? "selected" : ""}>${labelCode(item)}</option>`).join("")}</select></label>
              <label>이상치 건수<input type="number" name="anomalies" value="${selectedPeriod.anomalies}" /></label>
              <label class="full">메모<textarea name="note">${selectedPeriod.note || ""}</textarea></label>
              <div class="full actions">${canEditPayroll ? '<button type="submit" class="button">저장</button>' : ""}<button type="button" class="button-secondary" id="payrollPrintButton">출력</button></div>
            </form>
          ` : '<div class="empty">선택된 회차가 없습니다.</div>'}
        </section>
        <section class="detail-section">
          <h3>급여 산출 기준</h3>
          ${selectedPeriod ? `
            <div class="meta-list">
              <div class="meta-item"><strong>현재 재직자</strong><span>${activeEmployees.length}명</span></div>
              <div class="meta-item"><strong>월 고정급 합계</strong><span>${money(selectedPeriod.baseGrossPay || sumMonthlyPayrollBase(activeEmployees))}원</span></div>
              <div class="meta-item"><strong>연계 보상안</strong><span>${linkedCompPlan ? (byId(state.data.evaluationCycles, linkedCompPlan.cycleId)?.title || "-") : "없음"}</span></div>
              <div class="meta-item"><strong>보상 반영액</strong><span>${money(selectedPeriod.compensationGrossPay || 0)}원</span></div>
              <div class="meta-item"><strong>승인 대기</strong><span>${flow.approvalPendingCount}건</span></div>
              <div class="meta-item"><strong>조직 준비 미완료</strong><span>${flow.orgBlockedCount}개</span></div>
            </div>
          ` : '<div class="empty">회차를 선택하면 산출 기준을 확인할 수 있습니다.</div>'}
        </section>
        <section class="detail-section">
          <h3>직원별 명세</h3>
          ${selectedPeriod ? '<div class="filters" style="margin-bottom:12px;"><button class="button-secondary" data-export-payroll-entries="selected">명세 다운로드</button></div>' : ""}
          <table>
            <thead><tr><th>직원</th><th>기본급</th><th>보상</th><th>공제</th><th>실지급</th><th>상태</th></tr></thead>
            <tbody>
              ${payrollEntries.map((item) => `
                <tr>
                  <td>${employeeName(item.employeeId)}</td>
                  <td>${money(item.basePay)}원</td>
                  <td>${money(item.bonusPay)}원</td>
                  <td>${money(item.deductionPay)}원</td>
                  <td>${money(item.netPay)}원</td>
                  <td>${badge(item.status)}</td>
                </tr>
              `).join("") || '<tr><td colspan="6"><div class="empty">계산된 직원별 명세가 없습니다.</div></td></tr>'}
            </tbody>
          </table>
        </section>
        <section class="detail-section">
          <h3>회차 변경 이력</h3>
          <div class="history-list">
            ${periodChanges.map((item) => `
              <div class="history-item">
                <strong>${item.field}</strong>
                <div class="small-note">${item.changedBy} · ${item.changedAt}</div>
                <div class="small-note">${item.beforeValue || "-"} -> ${item.afterValue || "-"}</div>
              </div>
            `).join("") || '<div class="empty">변경 이력이 없습니다.</div>'}
          </div>
        </section>
      </article>
    </section>
  `;
  const ruleView = `
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="table-card">
          <div class="toolbar">
            <h3>급여 규칙</h3>
            <div class="filters"><button class="button-secondary" data-export="payroll">다운로드</button>${canEditPayroll ? '<button class="button" data-open="payRule">규칙 추가</button>' : ""}</div>
          </div>
          <table>
            <thead><tr><th>코드</th><th>규칙명</th><th>구분</th><th>과세</th><th>지급방식</th><th>상태</th></tr></thead>
            <tbody>
              ${rules.map((item) => `
                <tr class="${item.id === state.selectedPayrollRuleId ? "is-selected" : ""}" data-payroll-rule-row="${item.id}">
                  <td>${item.code}</td>
                  <td>${item.name}</td>
                  <td>${item.category}</td>
                  <td>${item.taxType}</td>
                  <td>${item.paymentType}</td>
                  <td>${badge(item.status)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>규칙 상세</h3>
          ${selectedRule ? `
            <form class="detail-form" id="payrollRuleForm">
              <input type="hidden" name="id" value="${selectedRule.id}" />
              <label>규칙 코드<input type="text" name="code" value="${selectedRule.code}" /></label>
              <label>규칙명<input type="text" name="name" value="${selectedRule.name}" /></label>
              <label>항목구분<select name="category">${["지급","공제"].map((item) => `<option value="${item}" ${selectedRule.category === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>과세구분<select name="taxType">${["과세","비과세"].map((item) => `<option value="${item}" ${selectedRule.taxType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>지급방식<select name="paymentType">${["고정","변동"].map((item) => `<option value="${item}" ${selectedRule.paymentType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>대상구분<input type="text" name="targetType" value="${selectedRule.targetType || ""}" /></label>
              <label>효력일<input type="date" name="effectiveFrom" value="${selectedRule.effectiveFrom || ""}" /></label>
              <label>상태<select name="status">${["active","closed"].map((item) => `<option value="${item}" ${selectedRule.status === item ? "selected" : ""}>${labelCode(item)}</option>`).join("")}</select></label>
              <label class="full">계산식<textarea name="formula">${selectedRule.formula || ""}</textarea></label>
              <label class="full">설명<textarea name="note">${selectedRule.note || ""}</textarea></label>
              <div class="full actions">${canEditPayroll ? '<button type="submit" class="button">저장</button>' : '<span class="small-note">급여 수정 권한이 없습니다.</span>'}</div>
            </form>
          ` : '<div class="empty">선택된 규칙이 없습니다.</div>'}
        </section>
        <section class="detail-section">
          <h3>규칙 변경 이력</h3>
          <div class="history-list">
            ${ruleChanges.map((item) => `
              <div class="history-item">
                <strong>${item.field}</strong>
                <div class="small-note">${item.changedBy} · ${item.changedAt}</div>
                <div class="small-note">${item.beforeValue || "-"} -> ${item.afterValue || "-"}</div>
              </div>
            `).join("") || '<div class="empty">변경 이력이 없습니다.</div>'}
          </div>
        </section>
      </article>
    </section>
  `;
  const auditView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>급여 이상치 점검</h3>
        <div class="filters">${canEditPayroll ? '<button class="button-secondary" data-open="payAnomaly">이상치 등록</button>' : ""}</div>
      </div>
      <table>
        <thead><tr><th>지급월</th><th>직원</th><th>유형</th><th>심각도</th><th>메모</th><th>상태</th><th>액션</th></tr></thead>
        <tbody>
          ${anomalies.map((item) => `
            <tr>
              <td>${byId(state.data.payrollPeriods, item.periodId)?.period || "-"}</td>
              <td>${employeeName(item.employeeId)}</td>
              <td>${item.type}</td>
              <td>${badge(item.severity === "high" ? "failed" : "submitted")}</td>
              <td>${item.note}</td>
              <td>${badge(item.status)}</td>
              <td>${canEditPayroll ? `<button class="button-secondary" data-anomaly-action="resolve" data-id="${item.id}" ${item.status === "resolved" ? "disabled" : ""}>해소</button>` : '<span class="small-note">조회 전용</span>'}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
    <section class="table-card">
      <div class="toolbar">
        <h3>급여 감사로그</h3>
        <div class="filters"><span class="badge neutral">${payrollLogs.length}건</span></div>
      </div>
      <table>
        <thead><tr><th>시각</th><th>행위자</th><th>액션</th><th>대상</th></tr></thead>
        <tbody>
          ${payrollLogs.map((item) => `
            <tr>
              <td>${item.at}</td>
              <td>${item.actor}</td>
              <td>${item.action}</td>
              <td>${item.target}</td>
            </tr>
          `).join("") || '<tr><td colspan="4"><div class="empty">급여 로그가 없습니다.</div></td></tr>'}
        </tbody>
      </table>
    </section>
    <section class="card">
      <h3>전사 흐름 점검</h3>
      <div class="mini-list">
        <div class="mini-item"><strong>조직/권한 기준</strong><small>준비 완료 ${flow.orgReadyCount}개 / 보완 필요 ${flow.orgBlockedCount}개 조직</small></div>
        <div class="mini-item"><strong>평가/보상 연계</strong><small>보상 연계 ${flow.compLinkedCount}건 / 급여 반영 ${flow.payrollLinkedCount}건</small></div>
        <div class="mini-item"><strong>승인 병목</strong><small>현재 승인 대기 ${flow.approvalPendingCount}건은 마감 전에 정리해야 합니다.</small></div>
      </div>
    </section>
  `;
  return `${summaryCards}${activeSubSection === "rule" ? ruleView : activeSubSection === "audit" ? auditView : periodView}`;
}



/* src/pages/lifecyclePages.js */
function renderOnboardingPage(ctx) {
  const { state, visibleOnboarding, orgName, badge, visibleOrgs, money } = ctx;
  const onboardingItems = visibleOnboarding();
  if (!state.selectedOnboardingId || !onboardingItems.some((item) => item.id === state.selectedOnboardingId)) state.selectedOnboardingId = onboardingItems[0]?.id || null;
  const selected = onboardingItems.find((item) => item.id === state.selectedOnboardingId) || null;
  const activeSubSection = ctx.state?.subSection || "preboarding";
  const summaryCards = `
    <section class="grid-3">
      <article class="stat-card"><h3>온보딩 건수</h3><strong>${onboardingItems.length}</strong><span>현재 사업장 기준</span></article>
      <article class="stat-card"><h3>완료</h3><strong>${onboardingItems.filter((item) => item.status === "completed").length}</strong><span>입사완료 대상</span></article>
      <article class="stat-card"><h3>진행 중</h3><strong>${onboardingItems.filter((item) => item.status !== "completed").length}</strong><span>체크리스트 진행</span></article>
    </section>
  `;
  const preboardingView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>입사예정자 목록</h3>
        <div class="filters"><button class="button-secondary" data-open="onboarding">온보딩 등록</button></div>
      </div>
      <table>
        <thead><tr><th>이름</th><th>입사일</th><th>직무/직급</th><th>조직</th><th>상태</th><th>체크리스트</th><th>액션</th></tr></thead>
        <tbody>
          ${onboardingItems.map((item) => `
            <tr class="${item.id === state.selectedOnboardingId ? "is-selected" : ""}" data-onboarding-row="${item.id}">
              <td>${item.name}</td>
              <td>${item.joinDate}</td>
              <td>${item.job || "-"} / ${item.grade || "-"}</td>
              <td>${orgName(item.orgId)}</td>
              <td>${badge(item.status)}</td>
              <td>${item.checklistDone}/${item.checklistTotal}</td>
              <td>
                <div class="actions">
                  <button class="button-secondary" data-onboarding-action="progress" data-id="${item.id}" ${item.status === "completed" ? "disabled" : ""}>진행 +1</button>
                  <button class="button" data-onboarding-action="complete" data-id="${item.id}" ${item.status === "completed" ? "disabled" : ""}>입사완료</button>
                </div>
              </td>
            </tr>
          `).join("") || '<tr><td colspan="7"><div class="empty">진행 중인 온보딩 없음</div></td></tr>'}
        </tbody>
      </table>
    </section>
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="detail-section">
          <h3>입사 전환 정보</h3>
          ${selected ? `
            <form class="detail-form" id="onboardingDetailForm">
              <input type="hidden" name="id" value="${selected.id}" />
              <label>이름<input type="text" name="name" value="${selected.name || ""}" required /></label>
              <label>입사일<input type="date" name="joinDate" value="${selected.joinDate || ""}" required /></label>
              <label>배치 조직<select name="orgId">${visibleOrgs().map((item) => `<option value="${item.id}" ${selected.orgId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
              <label>직무<input type="text" name="job" value="${selected.job || ""}" required /></label>
              <label>직군<input type="text" name="jobFamily" value="${selected.jobFamily || ""}" /></label>
              <label>직급<input type="text" name="grade" value="${selected.grade || ""}" required /></label>
              <label>고용형태<select name="employmentType">${["정규직","계약직","파견직"].map((item) => `<option value="${item}" ${selected.employmentType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>연봉(만원)<input type="number" name="annualSalary" value="${selected.annualSalary || 0}" required /></label>
              <label>이메일<input type="text" name="email" value="${selected.email || ""}" /></label>
              <label>연락처<input type="text" name="phone" value="${selected.phone || ""}" /></label>
              <label>근무지<input type="text" name="workLocation" value="${selected.workLocation || ""}" /></label>
              <div class="full actions"><button type="submit" class="button">저장</button></div>
            </form>
          ` : '<div class="empty">선택된 대상이 없습니다.</div>'}
        </section>
      </article>
    </section>
  `;
  const checklistView = `
    <section class="grid-2">
      ${onboardingItems.map((item) => `
        <article class="card">
          <div class="section-title"><h3>${item.name}</h3><span>${badge(item.status)}</span></div>
          <div class="metric-list">
            <div class="metric-row"><span>입사일</span><strong>${item.joinDate}</strong></div>
            <div class="metric-row"><span>배치조직</span><strong>${orgName(item.orgId)}</strong></div>
            <div class="metric-row"><span>직무/직급</span><strong>${item.job || "-"} / ${item.grade || "-"}</strong></div>
            <div class="metric-row"><span>연봉</span><strong>${money(item.annualSalary || 0)}만원</strong></div>
            <div class="metric-row"><span>체크리스트</span><strong>${item.checklistDone}/${item.checklistTotal}</strong></div>
          </div>
          <div class="actions" style="margin-top:12px;">
            <button class="button-secondary" data-onboarding-action="progress" data-id="${item.id}" ${item.status === "completed" ? "disabled" : ""}>진행 +1</button>
            <button class="button" data-onboarding-action="complete" data-id="${item.id}" ${item.status === "completed" ? "disabled" : ""}>입사완료</button>
          </div>
        </article>
      `).join("") || '<div class="empty">준비 체크리스트 대상이 없습니다.</div>'}
    </section>
  `;
  const accessView = `
    <section class="grid-2">
      ${onboardingItems.map((item) => {
        const checks = [
          { label: "이메일/그룹웨어", done: Boolean(item.email) },
          { label: "연락처/서류", done: Boolean(item.phone) },
          { label: "조직/근무지 배치", done: Boolean(item.orgId && item.workLocation) },
          { label: "직무/직급 세팅", done: Boolean(item.job && item.grade) }
        ];
        return `
          <article class="card">
            <div class="section-title"><h3>${item.name}</h3><span>${badge(item.status)}</span></div>
            <div class="mini-list">
              ${checks.map((check) => `<div class="mini-item"><strong>${check.label}</strong><small>${check.done ? "준비 완료" : "미준비"}</small></div>`).join("")}
            </div>
          </article>
        `;
      }).join("") || '<div class="empty">계정/장비 준비 대상이 없습니다.</div>'}
    </section>
  `;
  const firstDayView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>첫 주 운영 캘린더</h3>
          <div class="filters"><span class="badge neutral">${onboardingItems.length}명 대상</span></div>
        </div>
        <table>
          <thead><tr><th>대상자</th><th>입사일</th><th>Day 1</th><th>Day 3</th><th>Week 1</th></tr></thead>
          <tbody>
            ${onboardingItems.map((item) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.joinDate || "-"}</td>
                <td>${item.employeeNo ? "사번 발급" : "사번 준비"}</td>
                <td>${item.email ? "시스템 적응" : "계정 세팅 필요"}</td>
                <td>${item.checklistDone >= Math.max(1, item.checklistTotal - 1) ? "오리엔테이션 완료권" : "체크리스트 추적"}</td>
              </tr>
            `).join("") || '<tr><td colspan="5"><div class="empty">운영 대상이 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>운영 포인트</h3>
        <div class="mini-list">
          <div class="mini-item"><strong>첫날 필수</strong><small>사번, 출입, 메일, 그룹웨어, 근로계약 확인을 Day 1에 완료합니다.</small></div>
          <div class="mini-item"><strong>첫 주 적응</strong><small>버디 지정, 조직 소개, 필수교육 안내를 Week 1 패키지로 운영합니다.</small></div>
          <div class="mini-item"><strong>미완료 추적</strong><small>체크리스트 잔여 항목이 있는 대상자는 리더 승인 전까지 추적합니다.</small></div>
        </div>
      </article>
    </section>
  `;
  return `${summaryCards}${activeSubSection === "checklist" ? checklistView : activeSubSection === "access" ? accessView : activeSubSection === "firstDay" ? firstDayView : preboardingView}`;
}

function renderMovementPage(ctx) {
  const { state, visibleHrActions, visiblePromotionCandidates, employeeName, orgName, badge, labelCode } = ctx;
  const actions = visibleHrActions();
  const promotions = visiblePromotionCandidates();
  if (!state.selectedHrActionId || !actions.some((item) => item.id === state.selectedHrActionId)) state.selectedHrActionId = actions[0]?.id || null;
  const selectedAction = actions.find((item) => item.id === state.selectedHrActionId) || null;
  const activeSubSection = ctx.state?.subSection || "action";
  const summaryCards = `
    <section class="grid-3">
      <article class="stat-card"><h3>발령 건수</h3><strong>${actions.length}</strong><span>현재 사업장 기준</span></article>
      <article class="stat-card"><h3>미확정 발령</h3><strong>${actions.filter((item) => item.status !== "finalized").length}</strong><span>확정 대기</span></article>
      <article class="stat-card"><h3>승진 후보군</h3><strong>${promotions.length}</strong><span>현재 추천 대상</span></article>
    </section>
  `;
  const actionView = `
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="table-card">
          <div class="toolbar">
            <h3>발령/이동 이력</h3>
            <div class="filters"><button class="button" data-open="movement">발령 생성</button></div>
          </div>
          <table>
            <thead><tr><th>대상자</th><th>유형</th><th>조직 변경</th><th>직무/직급 변경</th><th>효력일</th><th>상태</th><th>액션</th></tr></thead>
            <tbody>
              ${actions.map((item) => `
                <tr class="${item.id === state.selectedHrActionId ? "is-selected" : ""}" data-hr-action-row="${item.id}">
                  <td>${employeeName(item.employeeId)}</td>
                  <td>${item.type}</td>
                  <td>${orgName(item.beforeOrgId)} -> ${orgName(item.afterOrgId)}</td>
                  <td>${item.beforeJob || "-"} / ${item.beforeGrade || "-"} -> ${item.afterJob || "-"} / ${item.afterGrade || "-"}</td>
                  <td>${item.effectiveDate}</td>
                  <td>${badge(item.status)}</td>
                  <td>
                    <div class="actions">
                      <button class="button-secondary" data-hr-action="finalize" data-id="${item.id}" ${item.status === "finalized" ? "disabled" : ""}>확정</button>
                      <button class="button" data-generate-doc="hrAction" data-id="${item.id}">발령장</button>
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>발령 비교</h3>
          ${selectedAction ? `
            <div class="meta-list">
              <div class="meta-item"><strong>대상자</strong><span>${employeeName(selectedAction.employeeId)}</span></div>
              <div class="meta-item"><strong>조직</strong><span>${orgName(selectedAction.beforeOrgId)} -> ${orgName(selectedAction.afterOrgId)}</span></div>
              <div class="meta-item"><strong>직무</strong><span>${selectedAction.beforeJob || "-"} -> ${selectedAction.afterJob || "-"}</span></div>
              <div class="meta-item"><strong>직급</strong><span>${selectedAction.beforeGrade || "-"} -> ${selectedAction.afterGrade || "-"}</span></div>
              <div class="meta-item"><strong>효력일</strong><span>${selectedAction.effectiveDate}</span></div>
              <div class="meta-item"><strong>상태</strong><span>${labelCode(selectedAction.status)}</span></div>
            </div>
          ` : '<div class="empty">선택된 발령이 없습니다.</div>'}
        </section>
      </article>
    </section>
  `;
  const candidateView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>승진 후보군</h3>
        <div class="filters"><button class="button" data-open="promotion">후보 등록</button></div>
      </div>
      <table>
        <thead><tr><th>대상자</th><th>현재직급</th><th>목표직급</th><th>점수</th><th>교육 충족</th><th>상태</th></tr></thead>
        <tbody>
          ${promotions.map((item) => `
            <tr>
              <td>${employeeName(item.employeeId)}</td>
              <td>${item.currentGrade}</td>
              <td>${item.targetGrade}</td>
              <td>${item.score}</td>
              <td>${item.trainingReady ? "완료" : "미완료"}</td>
              <td>${badge(item.status)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
  const documentView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>발령 문서 출력</h3>
        <div class="filters"><span class="badge neutral">${actions.length}건</span></div>
      </div>
      <table>
        <thead><tr><th>대상자</th><th>유형</th><th>효력일</th><th>상태</th><th>문서</th></tr></thead>
        <tbody>
          ${actions.map((item) => `
            <tr>
              <td>${employeeName(item.employeeId)}</td>
              <td>${item.type}</td>
              <td>${item.effectiveDate}</td>
              <td>${badge(item.status)}</td>
              <td><button class="button" data-generate-doc="hrAction" data-id="${item.id}">발령장 출력</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
  const readinessView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>발령 후속 준비상태</h3>
          <div class="filters"><span class="badge neutral">${actions.length}건</span></div>
        </div>
        <table>
          <thead><tr><th>대상자</th><th>발령유형</th><th>효력일</th><th>문서</th><th>인수인계</th><th>교육/적응</th></tr></thead>
          <tbody>
            ${actions.map((item) => `
              <tr>
                <td>${employeeName(item.employeeId)}</td>
                <td>${item.type}</td>
                <td>${item.effectiveDate}</td>
                <td>${item.status === "finalized" ? "완료" : "대기"}</td>
                <td>${item.note ? "확인" : "메모 필요"}</td>
                <td>${item.type === "승진" ? "리더 온보딩" : "업무전환 안내"}</td>
              </tr>
            `).join("") || '<tr><td colspan="6"><div class="empty">점검할 발령이 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>후속 조치 가이드</h3>
        <div class="mini-list">
          <div class="mini-item"><strong>문서 동기화</strong><small>발령장, 조직도, 권한, 급여기준 변경을 같은 날짜 기준으로 맞춥니다.</small></div>
          <div class="mini-item"><strong>인수인계 관리</strong><small>조직이동은 최소 1주 인수인계 기간과 책임자 확인을 남깁니다.</small></div>
          <div class="mini-item"><strong>승진 적응 지원</strong><small>리더 승진자는 필수 리더십 교육과 코칭 일정을 함께 등록합니다.</small></div>
        </div>
      </article>
    </section>
  `;
  return `${summaryCards}${activeSubSection === "candidate" ? candidateView : activeSubSection === "readiness" ? readinessView : activeSubSection === "document" ? documentView : actionView}`;
}

function renderExitPage(ctx) {
  const {
    state, visibleResignations, normalizedResignation, entityChangeHistory, byId,
    employeeName, resignationChecklistProgress, badge, labelCode
  } = ctx;
  const resignations = visibleResignations().map((item) => normalizedResignation(item));
  if (!state.selectedResignationId || !resignations.some((item) => item.id === state.selectedResignationId)) state.selectedResignationId = resignations[0]?.id || null;
  const selected = resignations.find((item) => item.id === state.selectedResignationId) || null;
  const resignationChanges = selected ? entityChangeHistory("resignation", selected.id).slice(0, 6) : [];
  const currentYear = 2026;
  const monthlyCount = resignations.filter((item) => String(item.lastDate || "").startsWith(`${currentYear}-`)).length;
  const earlyLeave = resignations.filter((item) => {
    const employee = byId(state.data.employees, item.employeeId);
    if (!employee?.hireDate || !item.lastDate) return false;
    return (new Date(item.lastDate) - new Date(employee.hireDate)) / 86400000 < 365;
  }).length;
  const reasonSummary = resignations.reduce((acc, item) => {
    acc[item.resignationType] = (acc[item.resignationType] || 0) + 1;
    return acc;
  }, {});
  const activeSubSection = state.subSection || "planned";
  const summaryCards = `
    <section class="grid-3">
      <article class="stat-card"><h3>퇴직예정</h3><strong>${resignations.length}</strong><span>현재 사업장 기준</span></article>
      <article class="stat-card"><h3>${currentYear} 퇴직건</h3><strong>${monthlyCount}</strong><span>연도 기준 누적</span></article>
      <article class="stat-card"><h3>1년 이내 퇴직</h3><strong>${earlyLeave}</strong><span>조기 이탈 리스크</span></article>
    </section>
  `;
  const plannedView = `
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="table-card">
          <div class="toolbar">
            <h3>퇴직예정 목록</h3>
            <div class="filters"><button class="button-secondary" data-export="exit">다운로드</button><button class="button" data-open="resignation">퇴직 신청 등록</button></div>
          </div>
          <table>
            <thead><tr><th>직원</th><th>퇴직일</th><th>유형</th><th>사유</th><th>체크리스트</th><th>상태</th></tr></thead>
            <tbody>
              ${resignations.map((item) => {
                const progress = resignationChecklistProgress(item);
                return `
                  <tr class="${item.id === state.selectedResignationId ? "is-selected" : ""}" data-resignation-row="${item.id}">
                    <td>${employeeName(item.employeeId)}</td>
                    <td>${item.lastDate}</td>
                    <td>${item.resignationType}</td>
                    <td>${item.reason}</td>
                    <td>${progress.doneCount}/${progress.totalCount}</td>
                    <td>${badge(item.status)}</td>
                  </tr>
                `;
              }).join("") || '<tr><td colspan="6"><div class="empty">퇴직 데이터가 없습니다.</div></td></tr>'}
            </tbody>
          </table>
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>퇴직 절차 체크리스트</h3>
          <div class="history-list">
            ${(selected?.checklistItems || []).map((item) => `
              <div class="history-item">
                <strong>${item.label}</strong>
                <div class="actions">
                  <button class="button-secondary" data-exit-checklist="${item.key}" data-id="${selected.id}" ${item.done ? "disabled" : ""}>완료 처리</button>
                  ${item.done ? badge("approved") : badge("draft")}
                </div>
              </div>
            `).join("") || '<div class="empty">체크리스트 없음</div>'}
          </div>
        </section>
        <section class="detail-section">
          <h3>퇴직 변경 이력</h3>
          <div class="history-list">
            ${resignationChanges.map((item) => `
              <div class="history-item">
                <strong>${item.field}</strong>
                <div class="small-note">${item.changedBy} · ${item.changedAt}</div>
                <div class="small-note">${item.beforeValue || "-"} -> ${item.afterValue || "-"}</div>
              </div>
            `).join("") || '<div class="empty">변경 이력이 없습니다.</div>'}
          </div>
        </section>
      </article>
    </section>
  `;
  const settlementView = `
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="detail-section">
          <div class="toolbar">
            <h3>퇴직 정산</h3>
            ${selected ? `<div class="filters"><button class="button-secondary" data-generate-doc="resignation" data-id="${selected.id}">퇴직서류</button></div>` : ""}
          </div>
          ${selected ? `
            <form class="detail-form" id="resignationDetailForm">
              <input type="hidden" name="id" value="${selected.id}" />
              <label>퇴직유형<select name="resignationType">${["자진퇴사","계약만료","정년","권고"].map((item) => `<option value="${item}" ${selected.resignationType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>퇴직예정일<input type="date" name="lastDate" value="${selected.lastDate || ""}" /></label>
              <label>인수인계 예정일<input type="date" name="handoverDate" value="${selected.handoverDate || ""}" /></label>
              <label>정산지급 예정일<input type="date" name="settlementDueDate" value="${selected.settlementDueDate || ""}" /></label>
              <label>미사용연차<input type="number" step="0.5" name="unusedLeaveDays" value="${selected.unusedLeaveDays || 0}" /></label>
              <label>예상 퇴직금<input type="number" name="expectedRetirementPay" value="${selected.expectedRetirementPay || 0}" /></label>
              <label>정산상태<select name="settlementStatus">${["draft","in_review","completed"].map((item) => `<option value="${item}" ${selected.settlementStatus === item ? "selected" : ""}>${labelCode(item)}</option>`).join("")}</select></label>
              <label>진행상태<select name="status">${["applied","approved","offboarding","finalized"].map((item) => `<option value="${item}" ${selected.status === item ? "selected" : ""}>${labelCode(item)}</option>`).join("")}</select></label>
              <label class="full">퇴직사유<textarea name="reason">${selected.reason || ""}</textarea></label>
              <label class="full">면담기록<textarea name="interviewNote">${selected.interviewNote || ""}</textarea></label>
              <div class="full actions">
                <button type="submit" class="button">저장</button>
                <button type="button" class="button-secondary" data-resignation-action="approve" data-id="${selected.id}" ${selected.status !== "applied" ? "disabled" : ""}>승인</button>
                <button type="button" class="button" data-resignation-action="finalize" data-id="${selected.id}" ${!["approved", "offboarding"].includes(selected.status) ? "disabled" : ""}>퇴직확정</button>
              </div>
            </form>
          ` : '<div class="empty">선택된 퇴직 건이 없습니다.</div>'}
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>정산 요약</h3>
          <div class="meta-list">
            <div class="meta-item"><strong>정산대기</strong><span>${resignations.filter((item) => item.settlementStatus !== "completed").length}건</span></div>
            <div class="meta-item"><strong>정산완료</strong><span>${resignations.filter((item) => item.settlementStatus === "completed").length}건</span></div>
            <div class="meta-item"><strong>미사용연차 합계</strong><span>${resignations.reduce((acc, item) => acc + Number(item.unusedLeaveDays || 0), 0)}일</span></div>
            <div class="meta-item"><strong>예상 퇴직금 합계</strong><span>${resignations.reduce((acc, item) => acc + Number(item.expectedRetirementPay || 0), 0).toLocaleString("ko-KR")}원</span></div>
          </div>
        </section>
        <section class="detail-section">
          <h3>퇴직 변경 이력</h3>
          <div class="history-list">
            ${resignationChanges.map((item) => `
              <div class="history-item">
                <strong>${item.field}</strong>
                <div class="small-note">${item.changedBy} · ${item.changedAt}</div>
                <div class="small-note">${item.beforeValue || "-"} -> ${item.afterValue || "-"}</div>
              </div>
            `).join("") || '<div class="empty">변경 이력이 없습니다.</div>'}
          </div>
        </section>
      </article>
    </section>
  `;
  const checklistView = `
    <section class="grid-2">
      ${resignations.map((item) => {
        const progress = resignationChecklistProgress(item);
        return `
          <article class="card">
            <div class="section-title"><h3>${employeeName(item.employeeId)}</h3><span>${progress.doneCount}/${progress.totalCount}</span></div>
            <div class="mini-list">
              ${item.checklistItems.map((check) => `
                <div class="mini-item">
                  <strong>${check.label}</strong>
                  <small>${check.done ? "완료" : "미완료"} · ${item.lastDate || "-"} 퇴직 예정</small>
                </div>
              `).join("")}
            </div>
          </article>
        `;
      }).join("") || '<div class="empty">오프보딩 체크리스트 대상이 없습니다.</div>'}
    </section>
  `;
  const analysisView = `
    <section class="grid-3">
      ${Object.entries(reasonSummary).map(([key, value]) => `<article class="stat-card"><h3>${key}</h3><strong>${value}</strong><span>퇴직 유형별 건수</span></article>`).join("") || '<div class="empty">분석 데이터 없음</div>'}
    </section>
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>퇴직 유형 분석</h3>
          <div class="filters"><button class="button-secondary" data-export="exit">다운로드</button></div>
        </div>
        <table>
          <thead><tr><th>직원</th><th>퇴직유형</th><th>퇴직일</th><th>근속 리스크</th><th>정산상태</th></tr></thead>
          <tbody>
            ${resignations.map((item) => {
              const employee = byId(state.data.employees, item.employeeId);
              const shortTenure = employee?.hireDate && item.lastDate && (new Date(item.lastDate) - new Date(employee.hireDate)) / 86400000 < 365;
              return `
                <tr>
                  <td>${employeeName(item.employeeId)}</td>
                  <td>${item.resignationType}</td>
                  <td>${item.lastDate}</td>
                  <td>${shortTenure ? "1년 이내" : "일반"}</td>
                  <td>${badge(item.settlementStatus)}</td>
                </tr>
              `;
            }).join("") || '<tr><td colspan="5"><div class="empty">분석 대상이 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>퇴직 분석 요약</h3>
        <div class="meta-list">
          <div class="meta-item"><strong>${currentYear} 퇴직건</strong><span>${monthlyCount}건</span></div>
          <div class="meta-item"><strong>1년 이내 퇴직</strong><span>${earlyLeave}건</span></div>
          <div class="meta-item"><strong>퇴직예정 전체</strong><span>${resignations.length}건</span></div>
        </div>
      </article>
    </section>
  `;
  return `${summaryCards}${activeSubSection === "checklist" ? checklistView : activeSubSection === "settlement" ? settlementView : activeSubSection === "analysis" ? analysisView : plannedView}`;
}



/* src/pages/supportPages.js */
function renderLearningPage(ctx) {
  const { state, visibleCourses, badge, employeeName, labelCode } = ctx;
  const courses = visibleCourses().map((item) => normalizedCourse(item));
  if (!state.selectedCourseId || !courses.some((item) => item.id === state.selectedCourseId)) state.selectedCourseId = courses[0]?.id || null;
  const selectedCourse = courses.find((item) => item.id === state.selectedCourseId) || null;
  const selectedAssignments = selectedCourse
    ? (state.data.courseAssignments || []).filter((item) => item.courseId === selectedCourse.id).map((item) => normalizedCourseAssignment(item))
    : [];
  const activeSubSection = state.subSection || "course";
  const overdueCourses = courses.filter((item) => item.completionRate < 80);
  const mandatoryCourses = courses.filter((item) => item.type === "필수교육");
  const summaryCards = `
    <section class="grid-3">
      <article class="stat-card"><h3>운영 계획</h3><strong>${courses.length}</strong><span>등록된 교육 계획</span></article>
      <article class="stat-card"><h3>필수교육</h3><strong>${mandatoryCourses.length}</strong><span>전사/법정 의무 과정</span></article>
      <article class="stat-card"><h3>집중 점검</h3><strong>${overdueCourses.length}</strong><span>이수율 80% 미만</span></article>
    </section>
  `;
  const courseView = `
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="table-card">
          <div class="toolbar">
            <h3>교육 계획</h3>
            <div class="filters"><button class="button" data-open="course">교육 계획 등록</button></div>
          </div>
          <table>
            <thead><tr><th>계획명</th><th>유형</th><th>대상</th><th>주관</th><th>완료기준일</th><th>운영상태</th></tr></thead>
            <tbody>
              ${courses.map((item) => `
                <tr class="${item.id === state.selectedCourseId ? "is-selected" : ""}" data-course-row="${item.id}">
                  <td>${item.title}</td>
                  <td>${item.type}</td>
                  <td>${item.target}</td>
                  <td>${item.owner || "-"}</td>
                  <td>${item.dueDate || "-"}</td>
                  <td>${badge(item.status)}</td>
                </tr>
              `).join("") || '<tr><td colspan="6"><div class="empty">등록된 교육 계획이 없습니다.</div></td></tr>'}
            </tbody>
          </table>
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>교육 계획 상세</h3>
          ${selectedCourse ? `
            <form class="detail-form" id="courseDetailForm">
              <input type="hidden" name="id" value="${selectedCourse.id}" />
              <label>계획명<input type="text" name="title" value="${selectedCourse.title}" required /></label>
              <label>유형<select name="type">${["필수교육","직무교육","리더교육"].map((item) => `<option value="${item}" ${selectedCourse.type === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>대상<input type="text" name="target" value="${selectedCourse.target}" required /></label>
              <label>주관부서/담당<input type="text" name="owner" value="${selectedCourse.owner || ""}" /></label>
              <label>교육방식<select name="deliveryType">${["온라인","오프라인","혼합"].map((item) => `<option value="${item}" ${selectedCourse.deliveryType === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>운영주기<select name="cycle">${["연간","반기","분기","수시"].map((item) => `<option value="${item}" ${selectedCourse.cycle === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
              <label>완료기준일<input type="date" name="dueDate" value="${selectedCourse.dueDate || ""}" /></label>
              <label>이수기준<input type="text" name="completionCriteria" value="${selectedCourse.completionCriteria || ""}" /></label>
              <label>이수율(%)<input type="number" name="completionRate" value="${selectedCourse.completionRate || 0}" /></label>
              <label>운영상태<select name="status">${["active","closed","draft"].map((item) => `<option value="${item}" ${selectedCourse.status === item ? "selected" : ""}>${labelCode(item)}</option>`).join("")}</select></label>
              <label class="full">운영 메모<textarea name="note">${selectedCourse.note || ""}</textarea></label>
              <div class="full actions"><button type="submit" class="button">저장</button></div>
            </form>
          ` : '<div class="empty">선택된 교육 계획이 없습니다.</div>'}
        </section>
        <section class="detail-section">
          <h3>운영 기준</h3>
          <div class="mini-list">
            <div class="mini-item"><strong>필수교육 우선</strong><small>법정/보안/개인정보 과정은 전사 대상과 마감 시점을 먼저 관리합니다.</small></div>
            <div class="mini-item"><strong>대상 기준 명확화</strong><small>전사, 조직장, 특정 직무 등 배정 대상을 계획 단계에서 고정합니다.</small></div>
            <div class="mini-item"><strong>이수 목표 관리</strong><small>운영 상태보다 실제 이수율이 낮은 과정을 우선 점검합니다.</small></div>
          </div>
        </section>
      </article>
    </section>
  `;
  const completionView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>이수 점검</h3>
          <div class="filters"><span class="badge neutral">${courses.length}개 과정</span></div>
        </div>
        <table>
          <thead><tr><th>계획명</th><th>대상</th><th>이수율</th><th>판정</th></tr></thead>
          <tbody>
            ${courses.map((item) => `
              <tr>
                <td>${item.title}</td>
                <td>${item.target}</td>
                <td>${item.completionRate}%</td>
                <td>${item.completionRate >= 90 ? badge("approved") : item.completionRate >= 80 ? badge("ongoing") : badge("review_needed")}</td>
              </tr>
            `).join("") || '<tr><td colspan="4"><div class="empty">점검할 교육 계획이 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>점검 포인트</h3>
        <div class="mini-list">
          ${courses.slice(0, 4).map((item) => `
            <div class="mini-item">
              <strong>${item.title}</strong>
              <small>${item.target} · 이수율 ${item.completionRate}% · ${item.completionRate >= 90 ? "안정" : item.completionRate >= 80 ? "추적 필요" : "집중 점검"}</small>
            </div>
          `).join("") || '<div class="empty">점검할 교육 계획이 없습니다.</div>'}
        </div>
      </article>
    </section>
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="table-card">
          <div class="toolbar">
            <h3>대상자 이수관리</h3>
            <div class="filters">${selectedCourse ? '<button class="button-secondary" data-open="courseAssignment">대상자 배정</button>' : ""}</div>
          </div>
          <table>
            <thead><tr><th>대상자</th><th>상태</th><th>수료일</th><th>증빙</th><th>메모</th><th>액션</th></tr></thead>
            <tbody>
              ${selectedAssignments.map((item) => `
                <tr>
                  <td>${employeeName(item.employeeId)}</td>
                  <td>${badge(item.status)}</td>
                  <td>${item.completedAt || "-"}</td>
                  <td>${item.certificateName || "-"}</td>
                  <td>${item.note || "-"}</td>
                  <td><button class="button-secondary" data-course-assignment-edit="${item.id}">수정</button></td>
                </tr>
              `).join("") || '<tr><td colspan="6"><div class="empty">배정된 대상자가 없습니다.</div></td></tr>'}
            </tbody>
          </table>
        </section>
      </article>
    </section>
  `;
  const mandatoryView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>필수교육 집중 점검</h3>
          <div class="filters"><span class="badge neutral">${mandatoryCourses.length}개 과정</span></div>
        </div>
        <table>
          <thead><tr><th>계획명</th><th>대상</th><th>완료기준일</th><th>이수율</th><th>판정</th></tr></thead>
          <tbody>
            ${mandatoryCourses.map((item) => `
              <tr>
                <td>${item.title}</td>
                <td>${item.target}</td>
                <td>${item.dueDate || "-"}</td>
                <td>${item.completionRate}%</td>
                <td>${item.completionRate >= 90 ? "안정" : item.completionRate >= 80 ? "추적 필요" : "집중 점검"}</td>
              </tr>
            `).join("") || '<tr><td colspan="5"><div class="empty">필수교육 계획이 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>점검 포인트</h3>
        <div class="mini-list">
          <div class="mini-item"><strong>법정 교육 우선</strong><small>개인정보, 성희롱예방, 산업안전은 마감 전 100% 완료를 목표로 합니다.</small></div>
          <div class="mini-item"><strong>미이수 추적</strong><small>80% 미만 과정은 조직장 리마인드와 대체 일정 확보가 필요합니다.</small></div>
          <div class="mini-item"><strong>평가 연계</strong><small>필수교육 미이수는 승진/평가 대상 확정 전에 함께 점검합니다.</small></div>
        </div>
      </article>
    </section>
  `;
  return `${summaryCards}${activeSubSection === "mandatory" ? mandatoryView : activeSubSection === "completion" ? completionView : courseView}`;
}

function renderReviewPage(ctx) {
  const {
    state, visibleEvaluationAppeals, visibleCalibrations, byId, employeeName, orgName,
    badge, visibleEmployees, money, visibleOrgs, visibleCourses, visiblePromotionCandidates, labelCode, workflowSnapshot
  } = ctx;
  const safeVisibleEmployees = typeof visibleEmployees === "function" ? visibleEmployees() : [];
  const safeVisibleOrgs = typeof visibleOrgs === "function" ? visibleOrgs() : [];
  const safeVisibleCourses = typeof visibleCourses === "function" ? visibleCourses() : [];
  const safePromotionCandidates = typeof visiblePromotionCandidates === "function" ? visiblePromotionCandidates() : [];
  const safeAppeals = typeof visibleEvaluationAppeals === "function" ? visibleEvaluationAppeals() : [];
  const safeCalibrations = typeof visibleCalibrations === "function" ? visibleCalibrations() : [];
  const flow = typeof workflowSnapshot === "function"
    ? workflowSnapshot()
    : { rows: [], orgBlockedCount: 0, orgReadyCount: 0, reviewPendingCount: 0, compLinkedCount: 0, payrollLinkedCount: 0, approvalPendingCount: 0 };
  const appeals = Array.isArray(safeAppeals) ? safeAppeals : [];
  const calibrations = Array.isArray(safeCalibrations) ? safeCalibrations : [];
  const cycles = state.data.evaluationCycles || [];
  const activeEmployees = safeVisibleEmployees.filter((item) => item.status === "재직");
  const visibleOrgRows = safeVisibleOrgs.map((org) => ({
    id: org.id,
    name: org.name,
    employeeCount: activeEmployees.filter((item) => item.orgId === org.id).length
  })).filter((item) => item.employeeCount > 0);
  if (!state.selectedEvaluationCycleId || !cycles.some((item) => item.id === state.selectedEvaluationCycleId)) state.selectedEvaluationCycleId = cycles[0]?.id || null;
  const selectedCycle = byId(cycles, state.selectedEvaluationCycleId) || null;
  const selectedCompPlan = state.data.compensationPlans.find((item) => item.cycleId === selectedCycle?.id) || null;
  const selectedChecklist = evaluationChecklistSummary(selectedCycle || {}, Boolean(selectedCompPlan));
  const activeSubSection = state.subSection || "framework";
  const currentCycle = selectedCycle || cycles[0] || null;
  const reviewTargets = activeEmployees.slice(0, Math.max(0, Number(currentCycle?.targetCount || activeEmployees.length || 0)));
  if (!state.selectedReviewEmployeeId || !reviewTargets.some((item) => item.id === state.selectedReviewEmployeeId)) state.selectedReviewEmployeeId = reviewTargets[0]?.id || null;
  const selectedReviewEmployee = byId(reviewTargets, state.selectedReviewEmployeeId) || reviewTargets[0] || null;
  const selectedGoalItems = (currentCycle?.goalItems || []).filter((item) => item.employeeId === selectedReviewEmployee?.id);
  const selectedGoalWeight = selectedGoalItems.reduce((acc, item) => acc + Number(item.weight || 0), 0);
  const selectedGoalProgress = selectedGoalWeight
    ? Math.round(selectedGoalItems.reduce((acc, item) => acc + (Number(item.progress || 0) * Number(item.weight || 0)), 0) / selectedGoalWeight)
    : 0;
  const selectedReviewEntry = currentCycle?.reviewEntries?.find((item) => item.employeeId === selectedReviewEmployee?.id) || null;
  const competencyModel = reviewCompetencyModel(selectedReviewEmployee?.jobFamily || "", selectedReviewEmployee?.job || "");
  const selectedPhase = state.selectedReviewPhase || "self";
  const selectedPhaseStage = selectedReviewEntry?.reviewStages?.[selectedPhase] || null;
  const selectedCompetencyScores = {
    expertiseScore: Number(selectedReviewEntry?.competencyScores?.expertiseScore || 0),
    collaborationScore: Number(selectedReviewEntry?.competencyScores?.collaborationScore || 0),
    executionScore: Number(selectedReviewEntry?.competencyScores?.executionScore || 0),
    leadershipScore: Number(selectedReviewEntry?.competencyScores?.leadershipScore || 0)
  };
  const reviewPendingCount = cycles.filter((item) => Number(item.completionRate || 0) < 100).length;
  const linkedCycleCount = cycles.filter((item) => state.data.compensationPlans.some((plan) => plan.cycleId === item.id)).length;
  const summaryCards = `
    <section class="grid-3">
      <article class="stat-card"><h3>평가 사이클</h3><strong>${cycles.length}</strong><span>운영 중/완료 포함</span></article>
      <article class="stat-card"><h3>미완료 사이클</h3><strong>${reviewPendingCount}</strong><span>진행률 100% 미만</span></article>
      <article class="stat-card"><h3>보상 연계율</h3><strong>${cycles.length ? Math.round((linkedCycleCount / cycles.length) * 100) : 0}%</strong><span>${linkedCycleCount}/${cycles.length}개 사이클 연결</span></article>
    </section>
  `;
  const frameworkView = `
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="table-card">
          <div class="toolbar">
            <h3>평가 운영 체크리스트</h3>
            <div class="filters"><button class="button" data-open="reviewCycle">사이클 생성</button></div>
          </div>
          <table>
            <thead><tr><th>평가명</th><th>기간</th><th>대상</th><th>체크리스트</th><th>보상연계</th><th>상태</th></tr></thead>
            <tbody>
              ${cycles.map((item) => {
                const plan = state.data.compensationPlans.find((entry) => entry.cycleId === item.id);
                const checklist = evaluationChecklistSummary(item, Boolean(plan));
                return `
                  <tr class="${item.id === state.selectedEvaluationCycleId ? "is-selected" : ""}" data-review-cycle-row="${item.id}">
                    <td>${item.title}</td>
                    <td>${item.period}</td>
                    <td>${item.targetCount}명</td>
                    <td>${checklist.doneCount}/${checklist.totalCount}</td>
                    <td>${plan ? "연결" : "미연결"}</td>
                    <td>${badge(item.status)}</td>
                  </tr>
                `;
              }).join("") || '<tr><td colspan="6"><div class="empty">등록된 평가 사이클이 없습니다.</div></td></tr>'}
            </tbody>
          </table>
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>선택 사이클 체크리스트</h3>
          ${currentCycle ? `
            <div class="mini-list">
              ${selectedChecklist.items.map((item) => `
                <div class="mini-item">
                  <strong>${item.label}</strong>
                  <small>${item.done ? "완료" : "미완료"}</small>
                </div>
              `).join("")}
            </div>
          ` : '<div class="empty">선택된 평가 사이클이 없습니다.</div>'}
        </section>
        <section class="detail-section">
          <h3>평가 기준 템플릿</h3>
          <div class="mini-list">
            <div class="mini-item"><strong>성과 70 / 역량 30</strong><small>직무별 KPI와 공통 역량을 분리해 평가 기준을 사전 확정합니다.</small></div>
            <div class="mini-item"><strong>평가자 이중화</strong><small>조직장 부재 시 대체 평가자와 최종 리뷰어를 지정합니다.</small></div>
            <div class="mini-item"><strong>마감 잠금</strong><small>자기평가, 리더평가, 캘리브레이션 마감일을 각각 분리해 운영합니다.</small></div>
          </div>
        </section>
      </article>
    </section>
  `;
  const goalView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>조직별 목표/KPI 정렬</h3>
          <div class="filters"><span class="badge neutral">${visibleOrgRows.length}개 조직</span></div>
        </div>
        <table>
          <thead><tr><th>조직</th><th>평가 대상</th><th>목표 상태</th><th>평가 리스크</th></tr></thead>
          <tbody>
            ${visibleOrgRows.map((item) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.employeeCount}명</td>
                <td>${item.employeeCount >= 5 ? "팀 KPI + 개인 목표" : "개인 목표 중심"}</td>
                <td>${item.employeeCount >= 8 ? "캘리브레이션 필요" : "리더 직접 리뷰"}</td>
              </tr>
            `).join("") || '<tr><td colspan="4"><div class="empty">집계 가능한 조직이 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>목표 정렬 포인트</h3>
        <div class="mini-list">
          <div class="mini-item"><strong>평가 대상자</strong><small>${currentCycle?.targetCount || activeEmployees.length}명 기준으로 KPI 합의 여부를 우선 점검합니다.</small></div>
          <div class="mini-item"><strong>평가자 배정</strong><small>조직장/본부장 지정과 평가 대상자 매핑이 완료되어야 실제 평가를 시작할 수 있습니다.</small></div>
          <div class="mini-item"><strong>승진 후보 준비</strong><small>${safePromotionCandidates.filter((item) => !item.trainingReady).length}명은 평가 결과 확정 전에 승진 자격 요건을 별도로 확인해야 합니다.</small></div>
        </div>
      </article>
    </section>
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="table-card">
          <div class="toolbar">
            <h3>개인 목표 설정</h3>
            <div class="filters">${currentCycle ? '<button class="button" data-open="reviewGoal">개인목표 등록</button>' : ""}</div>
          </div>
          <table>
            <thead><tr><th>대상자</th><th>조직</th><th>목표 건수</th><th>가중치 합계</th><th>가중 진척률</th></tr></thead>
            <tbody>
              ${reviewTargets.map((employee) => {
                const employeeGoals = (currentCycle?.goalItems || []).filter((item) => item.employeeId === employee.id);
                const totalWeight = employeeGoals.reduce((acc, item) => acc + Number(item.weight || 0), 0);
                const weightedProgress = totalWeight
                  ? Math.round(employeeGoals.reduce((acc, item) => acc + (Number(item.progress || 0) * Number(item.weight || 0)), 0) / totalWeight)
                  : 0;
                return `
                  <tr class="${employee.id === state.selectedReviewEmployeeId ? "is-selected" : ""}" data-review-employee-row="${employee.id}">
                    <td>${employee.name}</td>
                    <td>${orgName(employee.orgId)}</td>
                    <td>${employeeGoals.length}건</td>
                    <td>${totalWeight}%</td>
                    <td>${weightedProgress}%</td>
                  </tr>
                `;
              }).join("") || '<tr><td colspan="5"><div class="empty">평가 대상자가 없습니다.</div></td></tr>'}
            </tbody>
          </table>
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>선택 대상 목표</h3>
          ${selectedReviewEmployee ? `
            <div class="meta-list">
              <div class="meta-item"><strong>대상자</strong><span>${selectedReviewEmployee.name}</span></div>
              <div class="meta-item"><strong>조직</strong><span>${orgName(selectedReviewEmployee.orgId)}</span></div>
              <div class="meta-item"><strong>등록 목표</strong><span>${selectedGoalItems.length}건</span></div>
              <div class="meta-item"><strong>가중치 합계</strong><span>${selectedGoalWeight}%</span></div>
              <div class="meta-item"><strong>가중 진척률</strong><span>${selectedGoalProgress}%</span></div>
            </div>
            <div class="toolbar" style="margin-top:16px;">
              <h4>목표 목록</h4>
              <div class="filters">
                <span class="badge ${selectedGoalWeight === 100 ? "positive" : selectedGoalWeight > 100 ? "danger" : "neutral"}">가중치 ${selectedGoalWeight}%</span>
              </div>
            </div>
            <div class="mini-list">
              ${selectedGoalItems.map((item) => `
                <div class="mini-item">
                  <strong>${item.goalTitle}</strong>
                  <small>${item.targetMetric || "목표 지표 미설정"} / 가중치 ${item.weight || 0}% / 진척률 ${item.progress || 0}%</small>
                  <small>${item.resultNote || "중간 코멘트 없음"}</small>
                  <small>
                    <button class="button-secondary" data-review-goal-edit="${item.id}">수정</button>
                    <button class="button-secondary" data-review-goal-delete="${item.id}">삭제</button>
                  </small>
                </div>
              `).join("") || '<div class="empty">등록된 개인 목표가 없습니다.</div>'}
            </div>
            ${selectedGoalWeight !== 100 ? `<div class="empty" style="margin-top:12px;">목표 가중치 합이 100%가 되도록 조정해야 평가 확정과 보상 연계가 안정적으로 동작합니다.</div>` : ""}
          ` : '<div class="empty">선택된 평가 대상자가 없습니다.</div>'}
        </section>
      </article>
    </section>
    <section class="grid-3">
      <article class="card"><h3>성과목표</h3><div class="metric-list"><div class="metric-row"><span>팀 KPI</span><strong>${Math.max(1, visibleOrgRows.length)}개 축</strong></div><div class="metric-row"><span>개인 목표</span><strong>${currentCycle?.targetCount || activeEmployees.length}명</strong></div></div></article>
      <article class="card"><h3>역량평가</h3><div class="metric-list"><div class="metric-row"><span>공통역량</span><strong>4개 권장</strong></div><div class="metric-row"><span>직무역량</span><strong>직군별 분리</strong></div></div></article>
      <article class="card"><h3>운영 리스크</h3><div class="metric-list"><div class="metric-row"><span>캘리브레이션 대기</span><strong>${calibrations.filter((item) => item.status !== "approved").length}건</strong></div><div class="metric-row"><span>이의신청 가능성</span><strong>${appeals.filter((item) => item.status !== "closed").length}건</strong></div></div></article>
    </section>
  `;
  const evaluationView = `
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="table-card">
          <div class="toolbar">
            <h3>평가 사이클</h3>
            <div class="filters"><button class="button" data-open="reviewCycle">사이클 생성</button></div>
          </div>
          <table>
            <thead><tr><th>평가명</th><th>기간</th><th>대상</th><th>진행률</th><th>권장 인상률</th><th>예상 예산</th><th>보상 연계</th><th>상태</th></tr></thead>
            <tbody>
              ${cycles.map((item) => `
                <tr class="${item.id === state.selectedEvaluationCycleId ? "is-selected" : ""}" data-review-cycle-row="${item.id}">
                  <td>${item.title}</td>
                  <td>${item.period}</td>
                  <td>${item.targetCount}명</td>
                  <td>${item.completionRate}%</td>
                  <td>${recommendedCompRate(item)}%</td>
                  <td>${money(recommendedCompBudget(item, activeEmployees))}원</td>
                  <td>${state.data.compensationPlans.some((plan) => plan.cycleId === item.id) ? "생성됨" : "미생성"}</td>
                  <td>${badge(item.status)}</td>
                </tr>
              `).join("") || '<tr><td colspan="8"><div class="empty">등록된 평가 사이클이 없습니다.</div></td></tr>'}
            </tbody>
          </table>
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>평가 사이클 상세</h3>
          ${currentCycle ? `
            <form class="detail-form" id="reviewCycleForm">
              <input type="hidden" name="id" value="${currentCycle.id}" />
              <label>평가명<input type="text" name="title" value="${currentCycle.title}" required /></label>
              <label>대상 기간<input type="text" name="period" value="${currentCycle.period}" required /></label>
              <label>대상 인원<input type="number" name="targetCount" value="${currentCycle.targetCount}" required /></label>
              <label>진행률<input type="number" name="completionRate" value="${currentCycle.completionRate || 0}" required /></label>
              <label>권장 인상률(%)<input type="number" name="recommendedIncreaseRate" value="${Number(currentCycle.recommendedIncreaseRate || recommendedCompRate(currentCycle))}" required /></label>
              <label>상태<select name="status">${["planning","ongoing","completed"].map((item) => `<option value="${item}" ${currentCycle.status === item ? "selected" : ""}>${labelCode(item)}</option>`).join("")}</select></label>
              <div class="full actions">
                <button type="submit" class="button">저장</button>
                <button type="button" class="button-secondary" data-review-action="create-comp" data-id="${currentCycle.id}" ${state.data.compensationPlans.some((plan) => plan.cycleId === currentCycle.id) ? "disabled" : ""}>보상안 생성</button>
              </div>
            </form>
          ` : '<div class="empty">선택된 평가 사이클이 없습니다.</div>'}
        </section>
        <section class="detail-section">
          <h3>평가 운영 포인트</h3>
          <div class="mini-list">
            <div class="mini-item"><strong>목표 설정 완료율</strong><small>리더와 구성원의 목표 합의가 선행되어야 합니다.</small></div>
            <div class="mini-item"><strong>평가 제출 지연</strong><small>미제출 조직은 자동 리마인드와 대체 평가자 지정이 필요합니다.</small></div>
            <div class="mini-item"><strong>보상 연계</strong><small>진행률과 인상률을 확인한 뒤 보상안을 생성합니다.</small></div>
          </div>
        </section>
      </article>
    </section>
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="table-card">
          <div class="toolbar">
            <h3>직무/역량 평가점수</h3>
            <div class="filters">${currentCycle ? '<button class="button" data-open="reviewScore">점수 입력</button>' : ""}</div>
          </div>
          <table>
            <thead><tr><th>대상자</th><th>자기평가</th><th>1차평가</th><th>2차평가</th><th>최종점수</th><th>등급</th></tr></thead>
            <tbody>
              ${reviewTargets.map((employee) => {
                const entry = currentCycle?.reviewEntries?.find((item) => item.employeeId === employee.id);
                return `
                  <tr class="${employee.id === state.selectedReviewEmployeeId ? "is-selected" : ""}" data-review-employee-row="${employee.id}">
                    <td>${employee.name}</td>
                    <td>${reviewStageStatusLabel("self", entry)}</td>
                    <td>${reviewStageStatusLabel("manager", entry)}</td>
                    <td>${reviewStageStatusLabel("final", entry)}</td>
                    <td>${entry?.finalScore ?? "-"}</td>
                    <td>${entry?.grade || "-"}</td>
                  </tr>
                `;
              }).join("") || '<tr><td colspan="6"><div class="empty">평가 점수를 입력할 대상이 없습니다.</div></td></tr>'}
            </tbody>
          </table>
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>선택 대상 점수</h3>
          ${selectedReviewEmployee ? `
            <div class="meta-list">
              <div class="meta-item"><strong>대상자</strong><span>${selectedReviewEmployee.name}</span></div>
              <div class="meta-item"><strong>개인 목표</strong><span>${selectedGoalItems.length ? `${selectedGoalItems.length}건 등록` : "미등록"}</span></div>
              <div class="meta-item"><strong>자기평가</strong><span>${reviewStageStatusLabel("self", selectedReviewEntry)}</span></div>
              <div class="meta-item"><strong>1차평가</strong><span>${reviewStageStatusLabel("manager", selectedReviewEntry)}</span></div>
              <div class="meta-item"><strong>2차평가</strong><span>${reviewStageStatusLabel("final", selectedReviewEntry)}</span></div>
              <div class="meta-item"><strong>직무 점수</strong><span>${selectedReviewEntry?.jobScore ?? "-"}</span></div>
              <div class="meta-item"><strong>역량 평균</strong><span>${selectedReviewEntry?.competencyAverage ?? selectedReviewEntry?.competencyScore ?? "-"}</span></div>
              <div class="meta-item"><strong>${competencyModel.expertise}</strong><span>${selectedReviewEntry ? selectedCompetencyScores.expertiseScore : "-"}</span></div>
              <div class="meta-item"><strong>${competencyModel.collaboration}</strong><span>${selectedReviewEntry ? selectedCompetencyScores.collaborationScore : "-"}</span></div>
              <div class="meta-item"><strong>${competencyModel.execution}</strong><span>${selectedReviewEntry ? selectedCompetencyScores.executionScore : "-"}</span></div>
              <div class="meta-item"><strong>${competencyModel.leadership}</strong><span>${selectedReviewEntry ? selectedCompetencyScores.leadershipScore : "-"}</span></div>
              <div class="meta-item"><strong>최종 점수</strong><span>${selectedReviewEntry?.finalScore ?? "-"}</span></div>
              <div class="meta-item"><strong>평가 등급</strong><span>${selectedReviewEntry?.grade || "-"}</span></div>
              <div class="meta-item"><strong>평가 코멘트</strong><span>${selectedReviewEntry?.comment || "-"}</span></div>
            </div>
            <div class="toolbar" style="margin-top:16px;">
              <h4>평가 단계 입력</h4>
              <div class="filters">
                <button class="button-secondary" data-review-phase="self">자기평가</button>
                <button class="button-secondary" data-review-phase="manager">1차평가</button>
                <button class="button-secondary" data-review-phase="final">2차평가</button>
              </div>
            </div>
            <div class="meta-list" style="margin-top:12px;">
              <div class="meta-item"><strong>선택 단계</strong><span>${reviewStageLabel(selectedPhase)}</span></div>
              <div class="meta-item"><strong>단계 점수</strong><span>${selectedPhaseStage?.finalScore ?? "-"}</span></div>
              <div class="meta-item"><strong>단계 코멘트</strong><span>${selectedPhaseStage?.comment || "-"}</span></div>
              <div class="meta-item"><strong>입력일</strong><span>${selectedPhaseStage?.submittedAt || "-"}</span></div>
            </div>
            <div class="mini-list">
              <div class="mini-item"><strong>역량 모델</strong><small>${selectedReviewEmployee.jobFamily || selectedReviewEmployee.job || "공통"} 기준 역량항목을 적용합니다.</small></div>
              <div class="mini-item"><strong>최종 점수 계산</strong><small>직무 70%, 역량 평균 30% 비중으로 자동 계산합니다.</small></div>
            </div>
          ` : '<div class="empty">선택된 평가 대상자가 없습니다.</div>'}
        </section>
      </article>
    </section>
  `;
  const appealView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>평가 이의신청</h3>
          <div class="filters"><button class="button" data-open="appeal">이의신청 등록</button></div>
        </div>
        <table>
          <thead><tr><th>평가 사이클</th><th>대상자</th><th>요청일</th><th>사유</th><th>상태</th></tr></thead>
          <tbody>
            ${appeals.map((item) => `
              <tr>
                <td>${byId(cycles, item.cycleId)?.title || "-"}</td>
                <td>${employeeName(item.employeeId)}</td>
                <td>${item.requestedAt}</td>
                <td>${item.reason}</td>
                <td>${badge(item.status)}</td>
              </tr>
            `).join("") || '<tr><td colspan="5"><div class="empty">등록된 이의신청이 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>처리 가이드</h3>
        <div class="mini-list">
          <div class="mini-item"><strong>증빙 중심 검토</strong><small>평가 코멘트, KPI 달성 근거, 캘리브레이션 메모를 함께 검토합니다.</small></div>
          <div class="mini-item"><strong>처리 SLA</strong><small>이의신청은 7영업일 내 1차 회신, 14영업일 내 최종 결론을 권장합니다.</small></div>
          <div class="mini-item"><strong>재발 방지</strong><small>반복 조직은 평가 기준 설명과 리더 코칭을 별도 운영합니다.</small></div>
        </div>
      </article>
    </section>
  `;
  const calibrationView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>평가 보정/캘리브레이션</h3>
          <div class="filters"><button class="button" data-open="calibration">보정안 등록</button></div>
        </div>
        <table>
          <thead><tr><th>평가 사이클</th><th>조직</th><th>등급 분포</th><th>상태</th></tr></thead>
          <tbody>
            ${calibrations.map((item) => `
              <tr>
                <td>${byId(cycles, item.cycleId)?.title || "-"}</td>
                <td>${orgName(item.orgId)}</td>
                <td>${item.gradeSpread}</td>
                <td>${badge(item.status)}</td>
              </tr>
            `).join("") || '<tr><td colspan="4"><div class="empty">등록된 보정안이 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>분포 점검 포인트</h3>
        <div class="mini-list">
          <div class="mini-item"><strong>조직 간 편차</strong><small>동일 직군인데 등급 분포 차이가 큰 조직은 재검토합니다.</small></div>
          <div class="mini-item"><strong>승진/보상 영향</strong><small>보정 확정 전에는 승진 후보와 보상 시뮬레이션을 잠정치로만 사용합니다.</small></div>
          <div class="mini-item"><strong>확정 기록</strong><small>보정 회의 결과는 회의체, 참석자, 근거를 남겨 추후 이의신청에 대비합니다.</small></div>
        </div>
      </article>
    </section>
  `;
  const linkageView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>평가-보상-급여 연계</h3>
          <div class="filters"><button class="button" data-open="compPlan">보상안 생성</button></div>
        </div>
        <table>
          <thead><tr><th>평가 사이클</th><th>진행률</th><th>보상안</th><th>급여 반영월</th><th>상태</th></tr></thead>
          <tbody>
            ${cycles.map((item) => {
              const plan = state.data.compensationPlans.find((entry) => entry.cycleId === item.id);
              const payrollPeriod = plan?.linkedPayrollPeriodId ? byId(state.data.payrollPeriods, plan.linkedPayrollPeriodId) : null;
              return `
                <tr>
                  <td>${item.title}</td>
                  <td>${item.completionRate}%</td>
                  <td>${plan ? `${money(plan.budget)}원 / ${Number(plan.avgIncreaseRate || 0)}%` : "미생성"}</td>
                  <td>${payrollPeriod?.period || plan?.effectiveMonth || "-"}</td>
                  <td>${plan ? badge(plan.status) : badge("draft")}</td>
                </tr>
              `;
            }).join("") || '<tr><td colspan="5"><div class="empty">연계할 평가 사이클이 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>연계 리스크</h3>
        <div class="meta-list">
          <div class="meta-item"><strong>조직 준비 미완료</strong><span>${flow.orgBlockedCount}개</span></div>
          <div class="meta-item"><strong>보상안 미생성</strong><span>${cycles.filter((item) => !state.data.compensationPlans.some((plan) => plan.cycleId === item.id)).length}개</span></div>
          <div class="meta-item"><strong>급여 미반영</strong><span>${state.data.compensationPlans.filter((item) => !item.linkedPayrollPeriodId).length}건</span></div>
          <div class="meta-item"><strong>권장 예산 최대</strong><span>${currentCycle ? `${money(recommendedCompBudget(currentCycle, activeEmployees))}원` : "-"}</span></div>
        </div>
      </article>
    </section>
    <section class="table-card">
      <div class="toolbar">
        <h3>조직별 평가 준비 게이트</h3>
        <div class="filters"><span class="badge neutral">${flow.rows.length}개 조직</span></div>
      </div>
      <table>
        <thead><tr><th>조직</th><th>평가 리더</th><th>대상 인원</th><th>평가 준비</th><th>후속 영향</th></tr></thead>
        <tbody>
          ${flow.rows.map((item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.leaderAssigned ? "지정" : "미지정"}</td>
              <td>${item.employeeCount}명</td>
              <td>${item.reviewReady ? "평가 가능" : "조직 기준 보완 필요"}</td>
              <td>${item.compLinked ? "보상 연결 가능" : "보상안 대기"}</td>
            </tr>
          `).join("") || '<tr><td colspan="5"><div class="empty">조직별 평가 준비 데이터가 없습니다.</div></td></tr>'}
        </tbody>
      </table>
    </section>
  `;
  return `${summaryCards}${activeSubSection === "goal" ? goalView : activeSubSection === "evaluation" ? evaluationView : activeSubSection === "appeal" ? appealView : activeSubSection === "calibration" ? calibrationView : activeSubSection === "linkage" ? linkageView : frameworkView}`;
}

function renderCompensationPage(ctx) {
  const { state, byId, money, badge, visibleEmployees, workflowSnapshot } = ctx;
  const activeEmployees = visibleEmployees().filter((item) => item.status === "재직");
  const flow = typeof workflowSnapshot === "function"
    ? workflowSnapshot()
    : { rows: [], orgBlockedCount: 0, orgReadyCount: 0, reviewPendingCount: 0, compLinkedCount: 0, payrollLinkedCount: 0, approvalPendingCount: 0 };
  if (!state.selectedCompensationPlanId || !state.data.compensationPlans.some((item) => item.id === state.selectedCompensationPlanId)) state.selectedCompensationPlanId = state.data.compensationPlans[0]?.id || null;
  const selectedPlan = byId(state.data.compensationPlans, state.selectedCompensationPlanId) || null;
  const selectedCycle = byId(state.data.evaluationCycles, selectedPlan?.cycleId) || null;
  const selectedRecommendations = selectedPlan?.recommendationRows?.length
    ? selectedPlan.recommendationRows
    : buildCompRecommendations(selectedCycle || {}, activeEmployees);
  const selectedGradeMatrix = selectedPlan?.gradeBudgetMatrix?.length
    ? selectedPlan.gradeBudgetMatrix
    : ["S", "A", "B", "C"].map((grade) => {
      const rows = selectedRecommendations.filter((item) => item.grade === grade);
      return {
        grade,
        count: rows.length,
        recommendedRate: compRateByGrade(grade),
        budget: rows.reduce((acc, item) => acc + Number(item.recommendedIncreaseAmount || 0), 0)
      };
    });
  const activeSubSection = state.subSection || "budget";
  const summaryCards = `
    <section class="grid-3">
      <article class="stat-card"><h3>보상안 수</h3><strong>${state.data.compensationPlans.length}</strong><span>시뮬레이션 포함</span></article>
      <article class="stat-card"><h3>총 예산</h3><strong>${money(state.data.compensationPlans.reduce((acc, item) => acc + Number(item.budget || 0), 0))}원</strong><span>등록된 보상안 합계</span></article>
      <article class="stat-card"><h3>급여 미반영</h3><strong>${state.data.compensationPlans.filter((item) => !item.linkedPayrollPeriodId).length}</strong><span>급여 회차 연결 필요</span></article>
    </section>
  `;
  const budgetView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>평가 기준 권장 예산</h3>
          <div class="filters"><button class="button" data-open="compPlan">보상안 생성</button></div>
        </div>
        <table>
          <thead><tr><th>평가 사이클</th><th>권장 인상률</th><th>권장 예산</th><th>확정 예산</th><th>편차</th></tr></thead>
          <tbody>
            ${state.data.evaluationCycles.map((cycle) => {
              const plan = state.data.compensationPlans.find((item) => item.cycleId === cycle.id);
              const recommendedBudget = recommendedCompBudget(cycle, activeEmployees);
              const finalBudget = Number(plan?.budget || 0);
              const variance = finalBudget - recommendedBudget;
              return `
                <tr>
                  <td>${cycle.title}</td>
                  <td>${recommendedCompRate(cycle)}%</td>
                  <td>${money(recommendedBudget)}원</td>
                  <td>${plan ? `${money(finalBudget)}원` : "미생성"}</td>
                  <td>${plan ? `${variance > 0 ? "+" : ""}${money(variance)}원` : "-"}</td>
                </tr>
              `;
            }).join("") || '<tr><td colspan="5"><div class="empty">평가 사이클이 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>예산 운영 포인트</h3>
        <div class="mini-list">
          <div class="mini-item"><strong>재직자 기준 예산</strong><small>${activeEmployees.length}명 현원 기준으로 권장 예산을 산출합니다.</small></div>
          <div class="mini-item"><strong>평가 진행률 연계</strong><small>현재 평가 잔여 대상 ${flow.reviewPendingCount}명은 보정 회의 전 확정이 어렵습니다.</small></div>
          <div class="mini-item"><strong>조직 준비 상태</strong><small>리더/권한 준비 미완료 조직 ${flow.orgBlockedCount}개는 보상 반영 전에 정비가 필요합니다.</small></div>
        </div>
      </article>
    </section>
  `;
  const planView = `
    <section class="detail-grid">
      <article class="detail-panel">
        <section class="table-card">
          <div class="toolbar">
            <h3>보상 시뮬레이션</h3>
            <div class="filters"><button class="button" data-open="compPlan">보상안 생성</button></div>
          </div>
          <table>
            <thead><tr><th>평가 사이클</th><th>반영월</th><th>대상 인원</th><th>평균 인상률</th><th>예산</th><th>사용액</th><th>급여 연계</th><th>상태</th></tr></thead>
            <tbody>
              ${state.data.compensationPlans.map((item) => `
                <tr class="${item.id === state.selectedCompensationPlanId ? "is-selected" : ""}" data-comp-plan-row="${item.id}">
                  <td>${byId(state.data.evaluationCycles, item.cycleId)?.title || "-"}</td>
                  <td>${item.effectiveMonth || "-"}</td>
                  <td>${item.targetCount}명</td>
                  <td>${Number(item.avgIncreaseRate || 0)}%</td>
                  <td>${money(item.budget)}원</td>
                  <td>${money(item.usedBudget)}원</td>
                  <td>${item.linkedPayrollPeriodId ? (byId(state.data.payrollPeriods, item.linkedPayrollPeriodId)?.period || "연결됨") : "미연계"}</td>
                  <td>${badge(item.status)}</td>
                </tr>
              `).join("") || '<tr><td colspan="8"><div class="empty">보상안이 없습니다.</div></td></tr>'}
            </tbody>
          </table>
        </section>
      </article>
      <article class="detail-panel">
        <section class="detail-section">
          <h3>보상안 상세</h3>
          ${selectedPlan ? `
            <form class="detail-form" id="compensationPlanForm">
              <input type="hidden" name="id" value="${selectedPlan.id}" />
              <label>평가 사이클<select name="cycleId">${state.data.evaluationCycles.map((item) => `<option value="${item.id}" ${selectedPlan.cycleId === item.id ? "selected" : ""}>${item.title}</option>`).join("")}</select></label>
              <label>반영월<input type="month" name="effectiveMonth" value="${selectedPlan.effectiveMonth || ""}" required /></label>
              <label>대상 인원<input type="number" name="targetCount" value="${selectedPlan.targetCount}" required /></label>
              <label>평균 인상률(%)<input type="number" name="avgIncreaseRate" value="${Number(selectedPlan.avgIncreaseRate || 0)}" required /></label>
              <label>예산<input type="number" name="budget" value="${selectedPlan.budget}" required /></label>
              <label>사용액<input type="number" name="usedBudget" value="${selectedPlan.usedBudget}" required /></label>
              <label>상태<select name="status">${["simulated","approved","completed"].map((item) => `<option value="${item}" ${selectedPlan.status === item ? "selected" : ""}>${labelCode(item)}</option>`).join("")}</select></label>
              <label class="full">메모<textarea name="note">${selectedPlan.note || ""}</textarea></label>
              <div class="full actions">
                <button type="submit" class="button">저장</button>
                <button type="button" class="button-secondary" data-comp-action="approve" data-id="${selectedPlan.id}" ${selectedPlan.status !== "simulated" ? "disabled" : ""}>확정</button>
                <button type="button" class="button-secondary" data-comp-action="complete" data-id="${selectedPlan.id}" ${!selectedPlan.linkedPayrollPeriodId ? "disabled" : ""}>급여반영 완료</button>
              </div>
            </form>
          ` : '<div class="empty">선택된 보상안이 없습니다.</div>'}
        </section>
        <section class="detail-section">
          <h3>보상 반영 포인트</h3>
          ${selectedPlan ? `
            <div class="meta-list">
              <div class="meta-item"><strong>재직자 기준</strong><span>${activeEmployees.length}명</span></div>
              <div class="meta-item"><strong>연계 급여회차</strong><span>${selectedPlan.linkedPayrollPeriodId ? (byId(state.data.payrollPeriods, selectedPlan.linkedPayrollPeriodId)?.period || "-") : "미연계"}</span></div>
              <div class="meta-item"><strong>권장 예산 대비</strong><span>${money(recommendedCompBudget(byId(state.data.evaluationCycles, selectedPlan.cycleId) || {}, activeEmployees))}원</span></div>
              <div class="meta-item"><strong>등급기반 추천액</strong><span>${money(selectedRecommendations.reduce((acc, item) => acc + Number(item.recommendedIncreaseAmount || 0), 0))}원</span></div>
            </div>
            <div class="mini-list">
              ${selectedGradeMatrix.map((item) => `
                <div class="mini-item">
                  <strong>${item.grade}등급</strong>
                  <small>${item.count}명 / 권장 인상률 ${item.recommendedRate}% / 예산 ${money(item.budget)}원</small>
                </div>
              `).join("")}
            </div>
          ` : '<div class="empty">보상안 선택 후 반영 포인트를 확인할 수 있습니다.</div>'}
        </section>
      </article>
    </section>
    <section class="table-card">
      <div class="toolbar">
        <h3>등급별 보상 추천</h3>
        <div class="filters"><span class="badge neutral">${selectedRecommendations.length}명</span></div>
      </div>
      <table>
        <thead><tr><th>대상자</th><th>등급</th><th>최종점수</th><th>권장 인상률</th><th>권장 인상액</th></tr></thead>
        <tbody>
          ${selectedRecommendations.map((item) => `
            <tr>
              <td>${byId(state.data.employees, item.employeeId)?.name || "-"}</td>
              <td>${item.grade}</td>
              <td>${item.finalScore || 0}</td>
              <td>${item.recommendedRate}%</td>
              <td>${money(item.recommendedIncreaseAmount || 0)}원</td>
            </tr>
          `).join("") || '<tr><td colspan="5"><div class="empty">추천 대상이 없습니다.</div></td></tr>'}
        </tbody>
      </table>
    </section>
  `;
  const promotionView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>승진/보상 후보군</h3>
          <div class="filters"><span class="badge neutral">${state.data.promotionCandidates.length}명</span></div>
        </div>
        <table>
          <thead><tr><th>대상자</th><th>목표직급</th><th>점수</th><th>교육 충족</th><th>보상 연결</th></tr></thead>
          <tbody>
            ${state.data.promotionCandidates.map((item) => `
              <tr>
                <td>${byId(state.data.employees, item.employeeId)?.name || "-"}</td>
                <td>${item.targetGrade}</td>
                <td>${item.score}</td>
                <td>${item.trainingReady ? "완료" : "미완료"}</td>
                <td>${item.status || "-"}</td>
              </tr>
            `).join("") || '<tr><td colspan="5"><div class="empty">승진 후보 데이터가 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>승진 반영 포인트</h3>
        <div class="mini-list">
          ${state.data.compensationPlans.map((item) => `
            <div class="mini-item">
              <strong>${byId(state.data.evaluationCycles, item.cycleId)?.title || "-"}</strong>
              <small>대상 ${item.targetCount}명 · 인상률 ${Number(item.avgIncreaseRate || 0)}% · 예산 ${money(item.budget)}원</small>
            </div>
          `).join("") || '<div class="empty">보상안이 없습니다. 평가 완료 후 보상안을 생성하세요.</div>'}
        </div>
      </article>
    </section>
  `;
  const payrollView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>급여 반영 추적</h3>
          <div class="filters"><button class="button" data-open="payroll">급여 회차 생성</button></div>
        </div>
        <table>
          <thead><tr><th>보상안</th><th>반영월</th><th>급여회차</th><th>사용예산</th><th>상태</th></tr></thead>
          <tbody>
            ${state.data.compensationPlans.map((item) => {
              const payroll = item.linkedPayrollPeriodId ? byId(state.data.payrollPeriods, item.linkedPayrollPeriodId) : null;
              return `
                <tr>
                  <td>${byId(state.data.evaluationCycles, item.cycleId)?.title || "-"}</td>
                  <td>${item.effectiveMonth || "-"}</td>
                  <td>${payroll?.period || "미연계"}</td>
                  <td>${money(item.usedBudget)}원</td>
                  <td>${payroll ? badge(payroll.status) : badge("draft")}</td>
                </tr>
              `;
            }).join("") || '<tr><td colspan="5"><div class="empty">추적할 보상안이 없습니다.</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>급여 연계 점검</h3>
        <div class="meta-list">
          <div class="meta-item"><strong>평가 연계</strong><span>${flow.compLinkedCount}건</span></div>
          <div class="meta-item"><strong>연계 완료</strong><span>${state.data.compensationPlans.filter((item) => item.linkedPayrollPeriodId).length}건</span></div>
          <div class="meta-item"><strong>연계 필요</strong><span>${state.data.compensationPlans.filter((item) => !item.linkedPayrollPeriodId).length}건</span></div>
          <div class="meta-item"><strong>월 급여 베이스</strong><span>${money(sumMonthlyPayrollBase(activeEmployees))}원</span></div>
        </div>
      </article>
    </section>
  `;
  return `${summaryCards}${activeSubSection === "plan" ? planView : activeSubSection === "promotion" ? promotionView : activeSubSection === "payroll" ? payrollView : budgetView}`;
}

function renderEssPage(ctx) {
  const {
    state, pendingApprovals, isCurrentSiteOrg, byId, isCurrentSiteEmployee,
    visibleHelpdesk, visibleLeaveRequests, employeeName, badge
  } = ctx;
  const approvals = pendingApprovals().filter((item) => {
    if (item.type === "recruitmentRequest") return isCurrentSiteOrg(byId(state.data.recruitmentRequests, item.targetId)?.orgId);
    if (item.type === "leaveRequest") return isCurrentSiteEmployee(byId(state.data.leaveRequests, item.targetId)?.employeeId);
    if (item.type === "resignation") return isCurrentSiteEmployee(byId(state.data.resignations, item.targetId)?.employeeId);
    return true;
  });
  const requests = visibleHelpdesk();
  const docs = state.data.generatedDocuments.slice(0, 5);
  const activeSubSection = state.subSection || "employee";
  const employeeView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>직원 셀프서비스</h3>
        <div class="filters"><button class="button" data-open="ticket">문의 등록</button></div>
      </div>
      <div class="mini-list">
        ${visibleLeaveRequests().map((item) => `<div class="mini-item"><strong>${employeeName(item.employeeId)} · ${item.leaveType}</strong><small>${item.from}${item.from !== item.to ? ` ~ ${item.to}` : ""} · ${badge(item.status)}</small></div>`).join("") || '<div class="empty">등록된 직원 신청이 없습니다.</div>'}
      </div>
    </section>
  `;
  const managerView = `
    <section class="table-card">
      <div class="toolbar">
        <h3>관리자 셀프서비스</h3>
        <div class="filters"><span class="badge warn">${approvals.length}건</span></div>
      </div>
      <table>
        <thead><tr><th>제목</th><th>요청자</th><th>승인자</th><th>상태</th></tr></thead>
        <tbody>
          ${approvals.map((item) => `
            <tr>
              <td>${item.title}</td>
              <td>${item.requester}</td>
              <td>${item.approver}</td>
              <td>${badge(item.status)}</td>
            </tr>
          `).join("") || '<tr><td colspan="4"><div class="empty">현재 사업장 기준 대기 승인 없음</div></td></tr>'}
        </tbody>
      </table>
    </section>
  `;
  const requestView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>인사 헬프데스크</h3>
          <div class="filters"><button class="button" data-open="ticket">문의 등록</button></div>
        </div>
        <table>
          <thead><tr><th>카테고리</th><th>제목</th><th>담당자</th><th>우선순위</th><th>상태</th></tr></thead>
          <tbody>${requests.map((item) => `<tr><td>${item.category}</td><td>${item.title}</td><td>${item.owner}</td><td>${item.priority}</td><td>${badge(item.status)}</td></tr>`).join("") || '<tr><td colspan="5"><div class="empty">문의 내역이 없습니다.</div></td></tr>'}</tbody>
        </table>
      </article>
      <article class="table-card">
        <div class="toolbar">
          <h3>문서 생성 내역</h3>
          <div class="filters"><span class="badge neutral">${docs.length}건</span></div>
        </div>
        <table>
          <thead><tr><th>문서명</th><th>카테고리</th><th>생성일</th><th>상태</th></tr></thead>
          <tbody>${docs.map((item) => `<tr><td>${item.title}</td><td>${item.category}</td><td>${item.generatedAt}</td><td>${badge(item.status)}</td></tr>`).join("") || '<tr><td colspan="4"><div class="empty">생성 문서 없음</div></td></tr>'}</tbody>
        </table>
      </article>
    </section>
  `;
  return activeSubSection === "manager" ? managerView : activeSubSection === "request" ? requestView : employeeView;
}

function renderAdminPage(ctx) {
  const { state, badge, pendingApprovals, byId, labelCode } = ctx;
  const activeSubSection = state.subSection || "entitySite";
  const entitySiteView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>법인 정보</h3>
          <div class="filters"><button class="button" data-open="entity">법인 등록</button></div>
        </div>
        <table>
          <thead><tr><th>법인명</th><th>코드</th><th>사업장 수</th><th>상태</th><th>액션</th></tr></thead>
          <tbody>${state.data.entities.map((item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.code}</td>
              <td>${state.data.sites.filter((site) => site.entityId === item.id).length}개</td>
              <td>${badge(item.status)}</td>
              <td><div class="actions"><button class="button-danger" data-entity-action="delete" data-id="${item.id}">삭제</button></div></td>
            </tr>
          `).join("")}</tbody>
        </table>
      </article>
      <article class="table-card">
        <div class="toolbar">
          <h3>사업장 정보</h3>
          <div class="filters"><button class="button-secondary" data-open="site">사업장 등록</button></div>
        </div>
        <table>
          <thead><tr><th>사업장명</th><th>법인</th><th>유형</th><th>조직 수</th><th>상태</th><th>액션</th></tr></thead>
          <tbody>${state.data.sites.map((item) => `
            <tr>
              <td>${item.name}</td>
              <td>${byId(state.data.entities, item.entityId)?.name || "-"}</td>
              <td>${labelCode(item.type)}</td>
              <td>${state.data.orgs.filter((org) => org.siteId === item.id).length}개</td>
              <td>${badge(item.status)}</td>
              <td><div class="actions"><button class="button-danger" data-site-action="delete" data-id="${item.id}">삭제</button></div></td>
            </tr>
          `).join("")}</tbody>
        </table>
      </article>
    </section>
  `;
  const policyView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>정책 버전</h3>
          <div class="filters"><button class="button" data-open="policy">정책 등록</button></div>
        </div>
        <table>
          <thead><tr><th>영역</th><th>정책명</th><th>버전</th><th>효력일</th><th>상태</th></tr></thead>
          <tbody>${state.data.policyVersions.map((item) => `<tr><td>${item.area}</td><td>${item.name}</td><td>${item.version}</td><td>${item.effectiveFrom}</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody>
        </table>
      </article>
      <article class="table-card">
        <div class="toolbar">
          <h3>정책 영향도 분석</h3>
          <div class="filters"><button class="button-secondary" data-open="policyImpact">영향도 등록</button></div>
        </div>
        <table>
          <thead><tr><th>정책</th><th>요약</th><th>영향 인원</th><th>상태</th></tr></thead>
          <tbody>${state.data.policyImpacts.map((item) => `<tr><td>${byId(state.data.policyVersions, item.policyId)?.name || "-"}</td><td>${item.summary}</td><td>${item.affectedEmployees}명</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody>
        </table>
      </article>
    </section>
  `;
  const templateView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>문서 템플릿</h3>
          <div class="filters"><button class="button-secondary" data-open="template">템플릿 등록</button></div>
        </div>
        <table>
          <thead><tr><th>카테고리</th><th>템플릿명</th><th>버전</th><th>상태</th></tr></thead>
          <tbody>${state.data.documentTemplates.map((item) => `<tr><td>${item.category}</td><td>${item.name}</td><td>${item.version}</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody>
        </table>
      </article>
      <article class="table-card">
        <div class="toolbar">
          <h3>생성 문서</h3>
          <div class="filters"><span class="badge ok">${state.data.generatedDocuments.length}건</span></div>
        </div>
        <table>
          <thead><tr><th>카테고리</th><th>문서명</th><th>대상</th><th>생성일</th><th>상태</th></tr></thead>
          <tbody>${state.data.generatedDocuments.map((item) => `<tr><td>${item.category}</td><td>${item.title}</td><td>${item.targetType}</td><td>${item.generatedAt}</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody>
        </table>
      </article>
    </section>
  `;
  const integrationView = `
    <section class="grid-3">
      <article class="table-card">
        <div class="toolbar">
          <h3>연계/배치 모니터링</h3>
          <div class="filters"><button class="button-secondary" data-open="integration">연계 작업 등록</button></div>
        </div>
        <table>
          <thead><tr><th>시스템</th><th>작업명</th><th>최근 실행</th><th>상태</th></tr></thead>
          <tbody>${state.data.integrationJobs.map((item) => `<tr><td>${item.system}</td><td>${item.name}</td><td>${item.lastRun}</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody>
        </table>
      </article>
      <article class="table-card">
        <div class="toolbar">
          <h3>대량 업로드/검증</h3>
          <div class="filters"><button class="button-secondary" data-open="bulk">업로드 등록</button></div>
        </div>
        <table>
          <thead><tr><th>유형</th><th>파일</th><th>행수</th><th>오류행</th><th>상태</th></tr></thead>
          <tbody>${state.data.bulkUploads.map((item) => `<tr><td>${item.type}</td><td>${item.fileName}</td><td>${item.rows}</td><td>${item.errorRows}</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody>
        </table>
      </article>
      <article class="table-card">
        <div class="toolbar">
          <h3>조직개편 시뮬레이션</h3>
          <div class="filters"><button class="button-secondary" data-open="orgSim">시뮬레이션 등록</button></div>
        </div>
        <table>
          <thead><tr><th>시뮬레이션명</th><th>영향 인원</th><th>결재 영향</th><th>상태</th></tr></thead>
          <tbody>${state.data.orgSimulations.map((item) => `<tr><td>${item.name}</td><td>${item.impactedEmployees}명</td><td>${item.impactedApprovals}건</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody>
        </table>
      </article>
    </section>
  `;
  const auditView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>승인 대기함</h3>
          <div class="filters"><span class="badge warn">${pendingApprovals().length}건</span></div>
        </div>
        <table>
          <thead><tr><th>유형</th><th>제목</th><th>요청자</th><th>승인자</th><th>상태</th><th>액션</th></tr></thead>
          <tbody>
            ${pendingApprovals().map((item) => `
              <tr>
                <td>${item.type}</td>
                <td>${item.title}</td>
                <td>${item.requester}</td>
                <td>${item.approver}</td>
                <td>${badge(item.status)}</td>
                <td><div class="actions"><button class="button-secondary" data-approval-action="reject" data-id="${item.id}">반려</button><button class="button" data-approval-action="approve" data-id="${item.id}">승인</button></div></td>
              </tr>
            `).join("") || '<tr><td colspan="6"><div class="empty">대기 승인 없음</div></td></tr>'}
          </tbody>
        </table>
      </article>
      <article class="table-card">
        <h3>감사 로그</h3>
        <table>
          <thead><tr><th>시각</th><th>행위자</th><th>액션</th><th>대상</th></tr></thead>
          <tbody>${state.data.auditLogs.map((item) => `<tr><td>${item.at}</td><td>${item.actor}</td><td>${item.action}</td><td>${item.target}</td></tr>`).join("")}</tbody>
        </table>
      </article>
    </section>
  `;
  const dataView = `
    <section class="grid-2">
      <article class="table-card">
        <div class="toolbar">
          <h3>데이터 내보내기</h3>
          <div class="filters"><span class="badge neutral">JSON</span></div>
        </div>
        <p class="section-note">현재 클라우드 워크스페이스 전체 데이터를 JSON 파일로 내려받습니다.</p>
        <div class="actions">
          <button class="button" data-admin-data-action="export">데이터 내보내기</button>
        </div>
      </article>
      <article class="table-card">
        <div class="toolbar">
          <h3>전체 데이터 삭제</h3>
          <div class="filters"><span class="badge danger">주의</span></div>
        </div>
        <p class="section-note">저장된 인사 운영 데이터를 모두 삭제하고 빈 상태로 초기화합니다. 되돌릴 수 없습니다.</p>
        <div class="actions">
          <button class="button-danger" data-admin-data-action="reset">전체 데이터 삭제</button>
        </div>
      </article>
    </section>
  `;
  return activeSubSection === "policy"
    ? policyView
    : activeSubSection === "template"
      ? templateView
      : activeSubSection === "integration"
        ? integrationView
        : activeSubSection === "data"
          ? dataView
        : activeSubSection === "audit"
          ? auditView
          : entitySiteView;
}



/* src/utils/permissions.js */
function createPermissionHelpers(ctx) {
  const { currentUser, currentPolicy, canSeeEmployee } = ctx;

  function canAccessSection(section) {
    const role = currentUser()?.role;
    if (role === "시스템 관리자") return true;
    if (role === "HR 관리자") return true;
    if (role === "급여 담당자") return ["dashboard", "people", "payroll"].includes(section);
    if (role === "조직장" || role === "본부장") {
      return ["dashboard", "people", "attendance", "review", "movement", "exit"].includes(section);
    }
    if (role === "구성원") {
      return ["dashboard", "people", "attendance"].includes(section);
    }
    return section === "dashboard";
  }

  function canCreate(section) {
    const role = currentUser()?.role;
    if (role === "시스템 관리자") return true;
    if (role === "HR 관리자") return section !== "payroll";
    if (role === "급여 담당자") return ["payroll"].includes(section);
    if (role === "조직장" || role === "본부장") return ["review", "movement", "exit"].includes(section);
    if (role === "구성원") return ["exit"].includes(section);
    return false;
  }

  function canEditPeople() {
    return ["시스템 관리자", "HR 관리자"].includes(currentUser()?.role);
  }

  function canDeletePeople() {
    return currentUser()?.role === "시스템 관리자";
  }

  function canViewPayroll() {
    return ["시스템 관리자", "HR 관리자", "급여 담당자"].includes(currentUser()?.role);
  }

  function canEditPayroll() {
    return ["시스템 관리자", "급여 담당자"].includes(currentUser()?.role);
  }

  function canViewSalary(employeeId) {
    const role = currentUser()?.role;
    if (role === "시스템 관리자" || role === "HR 관리자" || role === "급여 담당자") return true;
    if (role === "구성원") return employeeId === currentUser()?.id;
    if (role === "조직장" || role === "본부장") return canSeeEmployee(employeeId);
    return false;
  }

  function canViewSensitiveEmployee(employeeId) {
    const access = currentPolicy()?.employeeAccess;
    if (access === "full") return true;
    if (access === "masked") return false;
    if (access === "team") return canSeeEmployee(employeeId);
    if (access === "self") return employeeId === currentUser()?.id;
    return false;
  }

  function maskValue(value, masked = "비공개") {
    return value ? masked : "-";
  }

  return {
    canAccessSection,
    canCreate,
    canEditPeople,
    canDeletePeople,
    canViewPayroll,
    canEditPayroll,
    canViewSalary,
    canViewSensitiveEmployee,
    maskValue
  };
}



/* src/events/sectionEvents.js */
function sectionBindEvents(ctx) {
  const {
    state,
    el,
    byId,
    nowStamp,
    defaultEmployeeFields,
    normalizedOrg,
    normalizedPayrollPeriod,
    normalizedPayrollRule,
    normalizedResignation,
    resignationChecklistProgress,
    visibleEmployees,
    filteredVisibleEmployees,
    requestCandidates,
    applyFieldChanges,
    appendAuditLog,
    employeeName,
    permissions,
    resetAllData,
    saveData,
    render,
    setSection,
    openSectionForm,
    openDialogByType,
    exportByType,
    generateDocument,
    openPrintWindow,
    downloadAsCsv,
    downloadAttachmentSummary,
    ageFromResidentNumber,
    birthDateFromResidentNumber,
    koreanAgeFromResidentNumber,
    maskResidentNumber,
    normalizeResidentNumber,
    validateResidentNumber,
    orgName,
    money,
    labelStage,
    labelCode
  } = ctx;
  const deny = (message = "현재 사용자 권한으로는 이 작업을 수행할 수 없습니다.") => {
    alert(message);
  };
  const recalculatePayrollPeriod = (period) => {
    const activeEmployees = visibleEmployees().filter((item) => item.status === "재직");
    const autoPlan = period.linkedCompPlanId
      ? byId(state.data.compensationPlans, period.linkedCompPlanId)
      : recommendedCompPlanForPeriod(period.period, state.data.compensationPlans);
    if (autoPlan && !period.linkedCompPlanId) period.linkedCompPlanId = autoPlan.id;
    const linkedPlan = byId(state.data.compensationPlans, period.linkedCompPlanId);
    period.employeeCount = activeEmployees.length;
    period.baseGrossPay = sumMonthlyPayrollBase(activeEmployees);
    period.compensationGrossPay = linkedPlan ? Number(linkedPlan.usedBudget || 0) : 0;
    period.grossPay = period.baseGrossPay + period.compensationGrossPay;
    if (linkedPlan) linkedPlan.linkedPayrollPeriodId = period.id;
    const totalAnnualSalary = Math.max(1, activeEmployees.reduce((acc, item) => acc + annualSalaryWon(item.annualSalary), 0));
    state.data.payrollEntries = (state.data.payrollEntries || []).filter((item) => item.periodId !== period.id);
    activeEmployees.forEach((employee) => {
      const basePay = annualSalaryToMonthlyPayroll(employee.annualSalary);
      const bonusPay = linkedPlan ? Math.round((annualSalaryWon(employee.annualSalary) / totalAnnualSalary) * Number(linkedPlan.usedBudget || 0)) : 0;
      const deductionPay = Math.round((basePay + bonusPay) * 0.11);
      state.data.payrollEntries.push(normalizedPayrollEntry({
        id: `pe-${period.id}-${employee.id}`,
        periodId: period.id,
        employeeId: employee.id,
        basePay,
        bonusPay,
        deductionPay,
        netPay: basePay + bonusPay - deductionPay,
        status: "calculated"
      }));
    });
  };

  el("primaryActionButton").onclick = () => {
    if (state.section === "dashboard") {
      ctx.exportData();
      return;
    }
    if (state.section === "recruitment" && state.subSection === "report") {
      exportByType("recruitment");
      return;
    }
    if (!permissions.canCreate(state.section)) {
      deny();
      return;
    }
    if (state.section === "recruitment" && state.subSection === "pipeline") {
      openDialogByType("applicant");
      return;
    }
    if (state.section === "recruitment" && state.subSection === "posting") {
      openDialogByType("recruitmentRequest");
      return;
    }
    if (state.section === "payroll" && state.subSection === "rule") {
      openDialogByType("payRule");
      return;
    }
    if (state.section === "payroll" && state.subSection === "audit") {
      openDialogByType("payAnomaly");
      return;
    }
    if (state.section === "admin" && state.subSection === "entitySite") {
      openDialogByType("entity");
      return;
    }
    if (state.section === "admin" && state.subSection === "policy") {
      openDialogByType("policy");
      return;
    }
    if (state.section === "admin" && state.subSection === "template") {
      openDialogByType("template");
      return;
    }
    if (state.section === "admin" && state.subSection === "integration") {
      openDialogByType("integration");
      return;
    }
    if (state.section === "admin" && state.subSection === "audit") {
      ctx.exportData();
      return;
    }
    if (state.section === "admin" && state.subSection === "data") {
      ctx.exportData();
      return;
    }
    if (state.section === "attendance" && state.subSection === "balance") {
      openDialogByType("leaveGrant");
      return;
    }
    if (state.section === "attendance" && state.subSection === "usage") {
      openDialogByType("leaveUsageBatch");
      return;
    }
    if (state.section === "attendance" && state.subSection === "closing") {
      openDialogByType("timeClose");
      return;
    }
    if (state.section === "learning" && state.subSection === "completion") {
      openDialogByType("courseAssignment");
      return;
    }
    if (state.section === "movement" && state.subSection === "candidate") {
      openDialogByType("promotion");
      return;
    }
    if (state.section === "movement" && state.subSection === "readiness") {
      openDialogByType("promotion");
      return;
    }
    if (state.section === "movement" && state.subSection === "document") {
      ctx.exportData();
      return;
    }
    if (state.section === "review" && state.subSection === "goal") {
      openDialogByType("reviewGoal");
      return;
    }
    if (state.section === "review" && state.subSection === "evaluation") {
      openDialogByType("reviewScore");
      return;
    }
    if (state.section === "review" && state.subSection === "framework") {
      openDialogByType("reviewCycle");
      return;
    }
    if (state.section === "review" && state.subSection === "appeal") {
      openDialogByType("appeal");
      return;
    }
    if (state.section === "review" && state.subSection === "calibration") {
      openDialogByType("calibration");
      return;
    }
    if (state.section === "review" && state.subSection === "linkage") {
      openDialogByType("compPlan");
      return;
    }
    if (state.section === "compensation" && state.subSection === "payroll") {
      openDialogByType("payroll");
      return;
    }
    if (state.section === "compensation" && state.subSection === "promotion") {
      openDialogByType("promotion");
      return;
    }
    openSectionForm(state.section);
  };
  document.querySelectorAll("[data-open]").forEach((button) => {
    button.onclick = () => {
      const map = {
        employee: "people",
        payroll: "payroll",
        payRule: "payroll",
        payAnomaly: "payroll",
        recruitmentRequest: "recruitment",
        applicant: "recruitment",
        onboarding: "onboarding",
        org: "org",
        movement: "movement",
        promotion: "movement",
        resignation: "exit",
        policy: "admin",
        integration: "admin",
        template: "admin",
        bulk: "admin",
        orgSim: "admin",
        policyImpact: "admin",
        entity: "admin",
        site: "admin"
      };
      const section = map[button.dataset.open] || state.section;
      if (!permissions.canCreate(section)) {
        deny();
        return;
      }
      openDialogByType(button.dataset.open);
    };
  });
  document.querySelectorAll("[data-export]").forEach((button) => {
    button.onclick = () => exportByType(button.dataset.export);
  });
  document.querySelectorAll("[data-admin-data-action]").forEach((button) => {
    button.onclick = async () => {
      if (button.dataset.adminDataAction === "export") {
        ctx.exportData();
        return;
      }
      if (button.dataset.adminDataAction === "reset") {
        await ctx.resetAllData();
      }
    };
  });
  document.querySelectorAll("[data-nav-link]").forEach((button) => {
    button.onclick = () => {
      setSection(button.dataset.navLink);
      render();
    };
  });
  if (state.section === "recruitment") {
    el("recruitmentQueryInput")?.addEventListener("input", (event) => {
      state.recruitmentFilters.query = event.target.value;
      render();
    });
    el("recruitmentOrgFilter")?.addEventListener("change", (event) => {
      state.recruitmentFilters.orgId = event.target.value;
      render();
    });
    el("recruitmentStatusFilter")?.addEventListener("change", (event) => {
      state.recruitmentFilters.status = event.target.value;
      render();
    });
    document.querySelectorAll("[data-posting-row]").forEach((row) => {
      row.onclick = () => {
        state.selectedPostingId = row.dataset.postingRow;
        state.selectedCandidateId = requestCandidates(state.selectedPostingId)[0]?.id || null;
        render();
      };
    });
    document.querySelectorAll("[data-candidate-row]").forEach((card) => {
      card.onclick = () => {
        state.selectedCandidateId = card.dataset.candidateRow;
        render();
      };
    });
    el("postingDetailForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!permissions.canCreate("recruitment")) return deny();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      const posting = byId(state.data.recruitmentRequests, formData.id);
      if (!posting) return;
      const before = { ...posting };
      const updates = {
        title: formData.title,
        orgId: formData.orgId,
        jobRole: formData.jobRole,
        headcount: Number(formData.headcount || 0),
        employmentType: formData.employmentType,
        workLocation: formData.workLocation,
        openDate: formData.openDate,
        closeDate: formData.closeDate,
        postingStatus: formData.postingStatus,
        requestedJoinDate: formData.requestedJoinDate,
        reason: formData.reason,
        preferredQualifications: formData.preferredQualifications
      };
      applyFieldChanges("recruitmentRequest", posting.id, "채용 담당자", before, updates);
      Object.assign(posting, updates);
      appendAuditLog("채용 담당자", "채용공고 수정", posting.title);
      saveData();
      render();
    });
    el("postingCopyButton")?.addEventListener("click", () => {
      if (!permissions.canCreate("recruitment")) return deny();
      const posting = byId(state.data.recruitmentRequests, state.selectedPostingId);
      if (!posting) return;
      const copyId = "req-" + Date.now();
      state.data.recruitmentRequests.unshift({
        ...posting,
        id: copyId,
        title: `${posting.title} (복사본)`,
        postingStatus: "draft",
        status: "submitted"
      });
      state.selectedPostingId = copyId;
      appendAuditLog("채용 담당자", "채용공고 복사", posting.title);
      saveData();
      render();
    });
    el("postingPrintButton")?.addEventListener("click", () => {
      const posting = byId(state.data.recruitmentRequests, state.selectedPostingId);
      if (!posting) return;
      openPrintWindow({
        title: `${posting.title} 채용공고`,
        subtitle: "채용공고 출력본",
        sections: [
          {
            title: "기본 정보",
            rows: [
              { label: "공고명", value: posting.title },
              { label: "채용부서", value: orgName(posting.orgId) },
              { label: "직무", value: posting.jobRole },
              { label: "채용인원", value: `${posting.headcount || 0}명` },
              { label: "고용형태", value: posting.employmentType },
              { label: "근무지", value: posting.workLocation || "-" },
              { label: "접수기간", value: `${posting.openDate || "-"} ~ ${posting.closeDate || "-"}` },
              { label: "상태", value: labelCode(posting.postingStatus || posting.status) }
            ]
          },
          {
            title: "모집 요건",
            rows: [
              { label: "자격요건", value: posting.reason || "-" },
              { label: "우대사항", value: posting.preferredQualifications || "-" },
              { label: "희망입사일", value: posting.requestedJoinDate || "-" }
            ]
          }
        ]
      });
    });
    el("candidateDetailForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!permissions.canCreate("recruitment")) return deny();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      const candidate = byId(state.data.applicants, formData.id);
      if (!candidate) return;
      const previousStage = candidate.stage;
      const before = { ...candidate };
      const updates = {
        name: formData.name,
        channel: formData.channel,
        email: formData.email,
        phone: formData.phone,
        appliedAt: formData.appliedAt,
        status: formData.status,
        stage: formData.stage,
        score: Number(formData.score || 0),
        proposedSalary: Number(formData.proposedSalary || 0),
        desiredGrade: formData.desiredGrade || "",
        expectedJoinDate: formData.expectedJoinDate || "",
        jobFamily: formData.jobFamily || "",
        interviewComment: formData.interviewComment,
        notes: formData.notes
      };
      applyFieldChanges("candidate", candidate.id, "채용 담당자", before, updates);
      Object.assign(candidate, updates);
      if (previousStage !== candidate.stage) {
        state.data.recruitmentStageHistories = state.data.recruitmentStageHistories || [];
        state.data.recruitmentStageHistories.unshift({
          id: "rsh-" + Date.now(),
          candidateId: candidate.id,
          stage: candidate.stage,
          result: candidate.status,
          comment: candidate.interviewComment || candidate.notes || "수동 변경",
          changedAt: nowStamp(),
          changedBy: "채용 담당자"
        });
      }
      appendAuditLog("채용 담당자", "지원자 정보 수정", candidate.name);
      saveData();
      render();
    });
    el("candidateAttachmentButton")?.addEventListener("click", () => {
      if (!permissions.canCreate("recruitment")) return deny();
      const candidateId = state.selectedCandidateId;
      if (!candidateId) return;
      ctx.openModal("지원서류 등록", [
        { name: "name", label: "파일명", required: true },
        { name: "category", label: "서류 구분", type: "select", options: ["이력서", "포트폴리오", "자격증", "기타"].map((item) => ({ value: item, label: item })) }
      ], (data) => {
        state.data.attachments = state.data.attachments || [];
        state.data.attachments.unshift({
          id: "att-" + Date.now(),
          targetType: "candidate",
          targetId: candidateId,
          name: data.name,
          category: data.category,
          uploadedAt: nowStamp(),
          uploadedBy: "채용 담당자"
        });
        appendAuditLog("채용 담당자", "지원서류 등록", data.name);
        saveData();
        render();
      });
    });
    document.querySelectorAll("[data-attachment-download]").forEach((button) => {
      button.onclick = () => {
        const attachment = byId(state.data.attachments || [], button.dataset.attachmentDownload);
        if (attachment?.targetType !== "candidate") return;
        const candidate = byId(state.data.applicants, attachment?.targetId);
        downloadAttachmentSummary({
          attachment,
          ownerLabel: candidate ? `지원자 ${candidate.name}` : "지원자 첨부"
        });
      };
    });
  }
  if (state.section === "people") {
    el("peopleDashboardGradeFilter")?.addEventListener("change", (event) => {
      state.peopleDashboardFilters.grade = event.target.value;
      render();
    });
    el("peopleDashboardTenureFilter")?.addEventListener("change", (event) => {
      state.peopleDashboardFilters.tenureBand = event.target.value;
      render();
    });
    el("peopleDashboardLeaderFilter")?.addEventListener("change", (event) => {
      state.peopleDashboardFilters.leaderOnly = event.target.value;
      render();
    });
    el("peopleDashboardSiteFilter")?.addEventListener("change", (event) => {
      state.peopleDashboardFilters.siteCompare = event.target.value;
      render();
    });
    el("peopleQueryInput")?.addEventListener("input", (event) => {
      state.peopleFilters.query = event.target.value;
      render();
    });
    el("peopleOrgFilter")?.addEventListener("change", (event) => {
      state.peopleFilters.orgId = event.target.value;
      render();
    });
    el("peopleEmploymentFilter")?.addEventListener("change", (event) => {
      state.peopleFilters.employmentType = event.target.value;
      render();
    });
    el("peopleStatusFilter")?.addEventListener("change", (event) => {
      state.peopleFilters.status = event.target.value;
      render();
    });
    document.querySelectorAll("[data-employee-row]").forEach((row) => {
      row.onclick = () => {
        state.selectedEmployeeId = row.dataset.employeeRow;
        render();
      };
    });
    el("employeeDetailForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!permissions.canEditPeople()) return deny();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      const employee = byId(state.data.employees, formData.id);
      if (!employee) return;
      const before = defaultEmployeeFields(employee);
      const residentSource = Object.prototype.hasOwnProperty.call(formData, "residentNumber")
        ? formData.residentNumber
        : before.residentNumber;
      const residentValidation = validateResidentNumber(residentSource);
      if (residentSource && !residentValidation.valid) {
        alert(residentValidation.message);
        return;
      }
      const updates = {
        name: formData.name,
        residentNumber: residentSource ? residentValidation.normalized : before.residentNumber,
        orgId: formData.orgId,
        job: formData.job,
        jobFamily: formData.jobFamily,
        grade: formData.grade,
        positionTitle: formData.positionTitle,
        role: formData.role,
        employmentType: formData.employmentType,
        status: formData.status,
        hireDate: formData.hireDate,
        probationEndDate: formData.probationEndDate,
        contractEndDate: formData.contractEndDate,
        email: Object.prototype.hasOwnProperty.call(formData, "email") ? formData.email : before.email,
        phone: Object.prototype.hasOwnProperty.call(formData, "phone") ? formData.phone : before.phone,
        emergencyContact: Object.prototype.hasOwnProperty.call(formData, "emergencyContact") ? formData.emergencyContact : before.emergencyContact,
        address: Object.prototype.hasOwnProperty.call(formData, "address") ? formData.address : before.address,
        education: formData.education,
        careerSummary: formData.careerSummary,
        certifications: formData.certifications,
        familyNotes: formData.familyNotes,
        militaryService: formData.militaryService,
        disabilityVeteran: formData.disabilityVeteran,
        annualSalary: Object.prototype.hasOwnProperty.call(formData, "annualSalary") ? Number(formData.annualSalary || 0) : before.annualSalary
      };
      applyFieldChanges("employee", employee.id, "HR 관리자", before, updates);
      Object.assign(employee, updates);
      appendAuditLog("HR 관리자", "인사카드 수정", employee.name);
      saveData();
      render();
    });
    el("employeeDeleteButton")?.addEventListener("click", () => {
      if (!permissions.canDeletePeople()) return deny();
      const employeeId = state.selectedEmployeeId;
      if (!employeeId || !confirm("선택한 직원을 삭제하시겠습니까?")) return;
      const index = state.data.employees.findIndex((item) => item.id === employeeId);
      if (index < 0) return;
      const [removed] = state.data.employees.splice(index, 1);
      appendAuditLog("HR 관리자", "직원 삭제", removed.name);
      state.selectedEmployeeId = filteredVisibleEmployees()[0]?.id || null;
      saveData();
      render();
    });
    el("employeePrintButton")?.addEventListener("click", () => {
      const employee = defaultEmployeeFields(byId(state.data.employees, state.selectedEmployeeId));
      if (!employee?.id) return;
      openPrintWindow({
        title: `${employee.name} 인사카드`,
        subtitle: "인사카드 출력본",
        sections: [
          {
            title: "기본 정보",
            rows: [
              { label: "사번", value: employee.id },
              { label: "성명", value: employee.name },
              { label: "주민등록번호", value: permissions.canViewSensitiveEmployee(employee.id) ? maskResidentNumber(employee.residentNumber) : "비공개" },
              { label: "생년월일", value: permissions.canViewSensitiveEmployee(employee.id) ? birthDateFromResidentNumber(employee.residentNumber) || "-" : "비공개" },
              { label: "만 나이", value: permissions.canViewSensitiveEmployee(employee.id) ? ageFromResidentNumber(employee.residentNumber) ?? "-" : "비공개" },
              { label: "한국식 나이", value: permissions.canViewSensitiveEmployee(employee.id) ? koreanAgeFromResidentNumber(employee.residentNumber) ?? "-" : "비공개" },
              { label: "조직", value: orgName(employee.orgId) },
              { label: "직무", value: employee.job || "-" },
              { label: "직군", value: employee.jobFamily || "-" },
              { label: "직급", value: employee.grade || "-" },
              { label: "직책", value: employee.positionTitle || "-" },
              { label: "고용형태", value: employee.employmentType || "-" },
              { label: "재직상태", value: employee.status || "-" }
            ]
          },
          {
            title: "근로 정보",
            rows: [
              { label: "입사일", value: employee.hireDate || "-" },
              { label: "수습종료일", value: employee.probationEndDate || "-" },
              { label: "계약종료일", value: employee.contractEndDate || "-" },
              { label: "이메일", value: permissions.canViewSensitiveEmployee(employee.id) ? employee.email || "-" : "비공개" },
              { label: "연락처", value: permissions.canViewSensitiveEmployee(employee.id) ? employee.phone || "-" : "비공개" },
              { label: "주소", value: permissions.canViewSensitiveEmployee(employee.id) ? employee.address || "-" : "비공개" },
              { label: "연봉(만원)", value: permissions.canViewSalary(employee.id) ? `${money(employee.annualSalary || 0)}만원` : "비공개" }
            ]
          },
          {
            title: "인사 확장 정보",
            rows: [
              { label: "학력", value: employee.education || "-" },
              { label: "경력사항", value: employee.careerSummary || "-" },
              { label: "자격사항", value: employee.certifications || "-" },
              { label: "가족사항", value: employee.familyNotes || "-" },
              { label: "병역", value: employee.militaryService || "-" },
              { label: "장애/보훈", value: employee.disabilityVeteran || "-" }
            ]
          }
        ]
      });
    });
    el("employeeQuickEditButton")?.addEventListener("click", () => {
      if (!permissions.canEditPeople()) return deny();
      const employee = defaultEmployeeFields(byId(state.data.employees, state.selectedEmployeeId) || {});
      if (!employee?.id) return;
      ctx.openModal("인사카드 수정", [
        { name: "id", label: "사번", value: employee.id, readonly: true },
        { name: "name", label: "성명", required: true, value: employee.name || "" },
        { name: "orgId", label: "조직", type: "select", value: employee.orgId || "", options: visibleOrgs().map((item) => ({ value: item.id, label: item.name })) },
        { name: "job", label: "직무", required: true, value: employee.job || "" },
        { name: "jobFamily", label: "직군", value: employee.jobFamily || "" },
        { name: "grade", label: "직급", required: true, value: employee.grade || "" },
        { name: "positionTitle", label: "직책", value: employee.positionTitle || "" },
        { name: "role", label: "권한역할", type: "select", value: employee.role || "구성원", options: ["시스템 관리자","HR 관리자","급여 담당자","본부장","조직장","구성원"].map((item) => ({ value: item, label: item })) },
        { name: "employmentType", label: "고용형태", type: "select", value: employee.employmentType || "정규직", options: ["정규직","계약직","파견직"].map((item) => ({ value: item, label: item })) },
        { name: "status", label: "재직상태", type: "select", value: employee.status || "재직", options: ["재직","휴직","퇴직"].map((item) => ({ value: item, label: item })) },
        { name: "hireDate", label: "입사일", type: "date", value: employee.hireDate || "" },
        { name: "probationEndDate", label: "수습종료일", type: "date", value: employee.probationEndDate || "" },
        { name: "contractEndDate", label: "계약종료일", type: "date", value: employee.contractEndDate || "" },
        { name: "email", label: "이메일", value: employee.email || "" },
        { name: "phone", label: "연락처", value: employee.phone || "" },
        { name: "annualSalary", label: "연봉(만원)", type: "number", value: String(employee.annualSalary || 0), placeholder: "예: 4800" }
      ], (data) => {
        const target = byId(state.data.employees, employee.id);
        if (!target) return;
        const before = defaultEmployeeFields(target);
        const updates = {
          name: data.name,
          orgId: data.orgId,
          job: data.job,
          jobFamily: data.jobFamily,
          grade: data.grade,
          positionTitle: data.positionTitle,
          role: data.role,
          employmentType: data.employmentType,
          status: data.status,
          hireDate: data.hireDate,
          probationEndDate: data.probationEndDate,
          contractEndDate: data.contractEndDate,
          email: data.email,
          phone: data.phone,
          annualSalary: Number(data.annualSalary || 0)
        };
        applyFieldChanges("employee", target.id, "HR 관리자", before, updates);
        Object.assign(target, updates);
        appendAuditLog("HR 관리자", "인사카드 수정", target.name);
        saveData();
        render();
      });
    });
    el("employeeAttachmentButton")?.addEventListener("click", () => {
      if (!permissions.canEditPeople()) return deny();
      const employeeId = state.selectedEmployeeId;
      if (!employeeId) return;
      ctx.openModal("직원 첨부 등록", [
        { name: "name", label: "파일명", required: true },
        { name: "category", label: "서류 구분", type: "select", options: ["근로계약서", "인사발령", "자격증", "증빙서류", "기타"].map((item) => ({ value: item, label: item })) },
        { name: "effectiveFrom", label: "효력일", type: "date" },
        { name: "expiresAt", label: "만료일", type: "date" }
      ], (data) => {
        state.data.attachments = state.data.attachments || [];
        state.data.attachments.unshift({
          id: "att-" + Date.now(),
          targetType: "employee",
          targetId: employeeId,
          name: data.name,
          category: data.category,
          effectiveFrom: data.effectiveFrom,
          expiresAt: data.expiresAt,
          uploadedAt: nowStamp(),
          uploadedBy: "HR 관리자"
        });
        appendAuditLog("HR 관리자", "직원 첨부 등록", data.name);
        saveData();
        render();
      });
    });
    document.querySelectorAll("[data-attachment-download]").forEach((button) => {
      button.onclick = () => {
        const attachment = byId(state.data.attachments || [], button.dataset.attachmentDownload);
        const employee = byId(state.data.employees, attachment?.targetId);
        if (attachment?.targetType !== "employee") return;
        downloadAttachmentSummary({
          attachment,
          ownerLabel: employee ? `직원 ${employee.name}` : "직원 첨부"
        });
      };
    });
  }
  if (state.section === "exit") {
    document.querySelectorAll("[data-resignation-row]").forEach((row) => {
      row.onclick = () => {
        state.selectedResignationId = row.dataset.resignationRow;
        render();
      };
    });
    el("resignationDetailForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!permissions.canCreate("exit")) return deny();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      const item = byId(state.data.resignations, formData.id);
      if (!item) return;
      const before = { ...normalizedResignation(item) };
      const updates = {
        resignationType: formData.resignationType,
        lastDate: formData.lastDate,
        handoverDate: formData.handoverDate,
        settlementDueDate: formData.settlementDueDate,
        unusedLeaveDays: Number(formData.unusedLeaveDays || 0),
        expectedRetirementPay: Number(formData.expectedRetirementPay || 0),
        settlementStatus: formData.settlementStatus,
        status: formData.status,
        reason: formData.reason,
        interviewNote: formData.interviewNote
      };
      applyFieldChanges("resignation", item.id, "HR 관리자", before, updates);
      Object.assign(item, updates);
      appendAuditLog("HR 관리자", "퇴직 상세 수정", employeeName(item.employeeId));
      saveData();
      render();
    });
    document.querySelectorAll("[data-exit-checklist]").forEach((button) => {
      button.onclick = () => {
        if (!permissions.canCreate("exit")) return deny();
        const item = byId(state.data.resignations, button.dataset.id);
        if (!item) return;
        item.checklistItems = normalizedResignation(item).checklistItems.map((entry) =>
          entry.key === button.dataset.exitChecklist ? { ...entry, done: true } : entry
        );
        const progress = resignationChecklistProgress(item);
        item.checklistDone = progress.doneCount;
        item.checklistTotal = progress.totalCount;
        if (item.checklistDone >= 1 && item.status === "approved") item.status = "offboarding";
        appendAuditLog("HR 관리자", "퇴직 체크리스트 완료", `${employeeName(item.employeeId)}:${button.dataset.exitChecklist}`);
        saveData();
        render();
      };
    });
  }
  if (state.section === "payroll") {
    document.querySelectorAll("[data-payroll-period-row]").forEach((row) => {
      row.onclick = () => {
        state.selectedPayrollPeriodId = row.dataset.payrollPeriodRow;
        render();
      };
    });
    document.querySelectorAll("[data-payroll-rule-row]").forEach((row) => {
      row.onclick = () => {
        state.selectedPayrollRuleId = row.dataset.payrollRuleRow;
        render();
      };
    });
    el("payrollPeriodForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!permissions.canEditPayroll()) return deny();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      const period = byId(state.data.payrollPeriods, formData.id);
      if (!period) return;
      const before = { ...normalizedPayrollPeriod(period) };
      const updates = {
        period: formData.period,
        payType: formData.payType,
        employeeCount: Number(formData.employeeCount || 0),
        grossPay: Number(formData.grossPay || 0),
        baseGrossPay: Number(formData.baseGrossPay || 0),
        compensationGrossPay: Number(formData.compensationGrossPay || 0),
        linkedCompPlanId: formData.linkedCompPlanId || recommendedCompPlanForPeriod(formData.period, state.data.compensationPlans)?.id || "",
        cutoffDate: formData.cutoffDate,
        payDate: formData.payDate,
        status: formData.status,
        anomalies: Number(formData.anomalies || 0),
        note: formData.note
      };
      applyFieldChanges("payrollPeriod", period.id, "급여 담당자", before, updates);
      Object.assign(period, updates);
      const linkedPlan = byId(state.data.compensationPlans, period.linkedCompPlanId);
      if (linkedPlan) linkedPlan.linkedPayrollPeriodId = period.id;
      appendAuditLog("급여 담당자", "급여 회차 수정", period.period);
      saveData();
      render();
    });
    el("payrollRuleForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!permissions.canEditPayroll()) return deny();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      const rule = byId(state.data.payrollRules, formData.id);
      if (!rule) return;
      const before = { ...normalizedPayrollRule(rule) };
      const updates = {
        code: formData.code,
        name: formData.name,
        category: formData.category,
        taxType: formData.taxType,
        paymentType: formData.paymentType,
        targetType: formData.targetType,
        effectiveFrom: formData.effectiveFrom,
        status: formData.status,
        formula: formData.formula,
        note: formData.note
      };
      applyFieldChanges("payrollRule", rule.id, "급여 담당자", before, updates);
      Object.assign(rule, updates);
      appendAuditLog("급여 담당자", "급여 규칙 수정", rule.name);
      saveData();
      render();
    });
    el("payrollPrintButton")?.addEventListener("click", () => {
      const period = byId(state.data.payrollPeriods, state.selectedPayrollPeriodId);
      if (!period) return;
      openPrintWindow({
        title: `${period.period} ${period.payType} 급여 회차`,
        subtitle: "급여 기준 정보 출력본",
        sections: [
          {
            title: "회차 정보",
            rows: [
              { label: "지급월", value: period.period },
              { label: "지급구분", value: period.payType || "-" },
              { label: "대상 인원", value: `${period.employeeCount || 0}명` },
              { label: "총지급액", value: `${money(period.grossPay || 0)}원` },
              { label: "마감기준일", value: period.cutoffDate || "-" },
              { label: "지급예정일", value: period.payDate || "-" },
              { label: "상태", value: labelCode(period.status) },
              { label: "이상치", value: `${period.anomalies || 0}건` }
            ]
          },
          {
            title: "운영 메모",
            rows: [
              { label: "메모", value: period.note || "-" }
            ]
          }
        ]
      });
    });
  }
  if (state.section === "org") {
    document.querySelectorAll("[data-org-row]").forEach((row) => {
      row.onclick = () => {
        state.selectedOrgId = row.dataset.orgRow;
        render();
      };
    });
    el("orgDetailForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!permissions.canEditPeople()) return deny();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      const org = byId(state.data.orgs, formData.id);
      if (!org) return;
      const before = { ...normalizedOrg(org) };
      const updates = {
        name: formData.name,
        parentId: formData.parentId,
        leader: formData.leader,
        headcount: Number(formData.headcount || 0),
        orgType: formData.orgType,
        costCenter: formData.costCenter,
        securityLevel: formData.securityLevel,
        status: formData.status
      };
      applyFieldChanges("org", org.id, "HR 관리자", before, updates);
      Object.assign(org, updates);
      appendAuditLog("HR 관리자", "조직 상세 수정", org.name);
      saveData();
      render();
    });
  }
  document.querySelectorAll("[data-applicant-action='advance']").forEach((button) => {
    button.onclick = () => {
      if (!permissions.canCreate("recruitment")) return deny();
      const item = byId(state.data.applicants, button.dataset.id);
      if (!item) return;
      const stages = ["screening", "interview_1", "interview_2", "offer", "hired"];
      const index = stages.indexOf(item.stage);
      if (index >= 0 && index < stages.length - 1) {
        item.stage = stages[index + 1];
        state.data.recruitmentStageHistories = state.data.recruitmentStageHistories || [];
        state.data.recruitmentStageHistories.unshift({
          id: "rsh-" + Date.now(),
          candidateId: item.id,
          stage: item.stage,
          result: item.status || "진행중",
          comment: "단계 이동",
          changedAt: nowStamp(),
          changedBy: "채용 담당자"
        });
      }
      state.selectedCandidateId = item.id;
      appendAuditLog("채용 담당자", "지원자 단계 이동", item.name);
      saveData();
      render();
    };
  });
  document.querySelectorAll("[data-applicant-action='hire']").forEach((button) => {
    button.onclick = () => {
      if (!permissions.canCreate("recruitment")) return deny();
      const applicant = byId(state.data.applicants, button.dataset.id);
      if (!applicant || applicant.stage !== "offer") return;
      if (state.data.onboarding.some((entry) => entry.applicantId === applicant.id)) return;
      const request = byId(state.data.recruitmentRequests, applicant.requestId);
      applicant.stage = "hired";
      state.data.onboarding.unshift({
        id: "onb-" + Date.now(),
        applicantId: applicant.id,
        sourceRequestId: applicant.requestId,
        name: applicant.name,
        joinDate: applicant.expectedJoinDate || request?.requestedJoinDate || new Date().toISOString().slice(0, 10),
        orgId: request?.orgId || state.data.orgs[0]?.id || "",
        job: request?.jobRole || "신규 입사자",
        jobFamily: applicant.jobFamily || "",
        grade: applicant.desiredGrade || "S1",
        employmentType: request?.employmentType || "정규직",
        annualSalary: Number(applicant.proposedSalary || 0),
        email: applicant.email || "",
        phone: applicant.phone || "",
        workLocation: request?.workLocation || "",
        status: "preboarding",
        checklistDone: 0,
        checklistTotal: 5,
        employeeNo: ""
      });
      state.data.recruitmentStageHistories = state.data.recruitmentStageHistories || [];
      state.data.recruitmentStageHistories.unshift({
        id: "rsh-" + Date.now(),
        candidateId: applicant.id,
        stage: "hired",
        result: "최종합격",
        comment: "입사확정 및 온보딩 생성",
        changedAt: nowStamp(),
        changedBy: "채용 담당자"
      });
      appendAuditLog("채용 담당자", "입사확정", applicant.name);
      saveData();
      state.section = "onboarding";
      render();
    };
  });
  document.querySelectorAll("[data-onboarding-action='progress']").forEach((button) => {
    button.onclick = () => {
      if (!permissions.canCreate("onboarding")) return deny();
      const item = byId(state.data.onboarding, button.dataset.id);
      if (!item || item.status === "completed") return;
      item.checklistDone = Math.min(item.checklistDone + 1, item.checklistTotal);
      if (item.checklistDone >= 1) item.status = "signing";
      if (item.checklistDone >= 3) item.status = "provisioning";
      if (item.checklistDone >= 4) item.status = "training_pending";
      appendAuditLog("인사운영", "온보딩 진행", item.name);
      saveData();
      render();
    };
  });
  document.querySelectorAll("[data-onboarding-action='complete']").forEach((button) => {
    button.onclick = () => {
      if (!permissions.canCreate("onboarding")) return deny();
      const item = byId(state.data.onboarding, button.dataset.id);
      if (!item || item.status === "completed") return;
      if (state.data.employees.some((employee) => employee.sourceOnboardingId === item.id)) return;
      item.status = "completed";
      item.checklistDone = item.checklistTotal;
      const employeeId = `emp-${Date.now()}`;
      state.data.employees.unshift(defaultEmployeeFields({
        id: employeeId,
        name: item.name,
        orgId: item.orgId,
        sourceOnboardingId: item.id,
        role: "구성원",
        job: item.job || "신규 입사자",
        jobFamily: item.jobFamily || "",
        grade: item.grade || "S1",
        employmentType: item.employmentType || "정규직",
        status: "재직",
        hireDate: item.joinDate,
        email: item.email || "",
        phone: item.phone || "",
        annualSalary: Number(item.annualSalary || 0)
      }));
      state.selectedEmployeeId = employeeId;
      appendAuditLog("인사운영", "온보딩 완료 및 직원 생성", employeeId);
      saveData();
      state.section = "people";
      render();
    };
  });
  if (state.section === "onboarding") {
    document.querySelectorAll("[data-onboarding-row]").forEach((row) => {
      row.onclick = () => {
        state.selectedOnboardingId = row.dataset.onboardingRow;
        render();
      };
    });
    el("onboardingDetailForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!permissions.canCreate("onboarding")) return deny();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      const item = byId(state.data.onboarding, formData.id);
      if (!item) return;
      const before = { ...item };
      const updates = {
        name: formData.name,
        joinDate: formData.joinDate,
        orgId: formData.orgId,
        job: formData.job,
        jobFamily: formData.jobFamily,
        grade: formData.grade,
        employmentType: formData.employmentType,
        annualSalary: Number(formData.annualSalary || 0),
        email: formData.email,
        phone: formData.phone,
        workLocation: formData.workLocation
      };
      applyFieldChanges("onboarding", item.id, "인사운영", before, updates);
      Object.assign(item, updates);
      appendAuditLog("인사운영", "온보딩 전환정보 수정", item.name);
      saveData();
      render();
    });
  }
  if (state.section === "review") {
    document.querySelectorAll("[data-review-cycle-row]").forEach((row) => {
      row.onclick = () => {
        state.selectedEvaluationCycleId = row.dataset.reviewCycleRow;
        state.selectedReviewGoalId = null;
        render();
      };
    });
    document.querySelectorAll("[data-review-employee-row]").forEach((row) => {
      row.onclick = () => {
        state.selectedReviewEmployeeId = row.dataset.reviewEmployeeRow;
        state.selectedReviewGoalId = null;
        render();
      };
    });
    document.querySelectorAll("[data-review-phase]").forEach((button) => {
      button.onclick = () => {
        state.selectedReviewPhase = button.dataset.reviewPhase;
        openDialogByType("reviewScore");
      };
    });
    document.querySelectorAll("[data-review-goal-edit]").forEach((button) => {
      button.onclick = (event) => {
        event.stopPropagation();
        state.selectedReviewGoalId = button.dataset.reviewGoalEdit;
        openDialogByType("reviewGoal");
      };
    });
    document.querySelectorAll("[data-review-goal-delete]").forEach((button) => {
      button.onclick = (event) => {
        event.stopPropagation();
        if (!permissions.canCreate("review")) return deny();
        const cycle = byId(state.data.evaluationCycles, state.selectedEvaluationCycleId);
        if (!cycle) return;
        const goal = (cycle.goalItems || []).find((item) => item.id === button.dataset.reviewGoalDelete);
        if (!goal) return;
        if (!confirm("이 개인 목표를 삭제하시겠습니까?")) return;
        cycle.goalItems = (cycle.goalItems || []).filter((item) => item.id !== goal.id);
        if (state.selectedReviewGoalId === goal.id) state.selectedReviewGoalId = null;
        appendAuditLog("평가 담당자", "개인 목표 삭제", employeeName(goal.employeeId));
        saveData();
        render();
      };
    });
    el("reviewCycleForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!permissions.canCreate("review")) return deny();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      const cycle = byId(state.data.evaluationCycles, formData.id);
      if (!cycle) return;
      const before = { ...cycle };
      const updates = {
        title: formData.title,
        period: formData.period,
        targetCount: Number(formData.targetCount || 0),
        completionRate: Number(formData.completionRate || 0),
        recommendedIncreaseRate: Number(formData.recommendedIncreaseRate || 0),
        status: formData.status
      };
      applyFieldChanges("evaluationCycle", cycle.id, "평가 담당자", before, updates);
      Object.assign(cycle, updates);
      appendAuditLog("평가 담당자", "평가 사이클 수정", cycle.title);
      saveData();
      render();
    });
    document.querySelectorAll("[data-review-action='create-comp']").forEach((button) => {
      button.onclick = () => {
        state.selectedEvaluationCycleId = button.dataset.id;
        openDialogByType("compPlan");
      };
    });
  }
  if (state.section === "learning") {
    document.querySelectorAll("[data-course-row]").forEach((row) => {
      row.onclick = () => {
        state.selectedCourseId = row.dataset.courseRow;
        render();
      };
    });
    el("courseDetailForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!permissions.canCreate("learning")) return deny();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      const course = byId(state.data.courses, formData.id);
      if (!course) return;
      const before = { ...normalizedCourse(course) };
      const updates = {
        title: formData.title,
        type: formData.type,
        target: formData.target,
        owner: formData.owner,
        deliveryType: formData.deliveryType,
        cycle: formData.cycle,
        dueDate: formData.dueDate,
        completionCriteria: formData.completionCriteria,
        completionRate: Number(formData.completionRate || 0),
        status: formData.status,
        note: formData.note
      };
      applyFieldChanges("course", course.id, "교육 담당자", before, updates);
      Object.assign(course, updates);
      appendAuditLog("교육 담당자", "교육 계획 수정", course.title);
      saveData();
      render();
    });
    document.querySelectorAll("[data-course-assignment-edit]").forEach((button) => {
      button.onclick = () => {
        if (!permissions.canCreate("learning")) return deny();
        const assignment = byId(state.data.courseAssignments || [], button.dataset.courseAssignmentEdit);
        if (!assignment) return;
        ctx.openModal("교육 이수상태 수정", [
          { name: "employeeId", label: "대상자", type: "select", value: assignment.employeeId, options: visibleEmployees().map((item) => ({ value: item.id, label: item.name })) },
          { name: "status", label: "상태", type: "select", value: assignment.status, options: ["assigned", "ongoing", "completed"].map((item) => ({ value: item, label: labelCode(item) })) },
          { name: "completedAt", label: "수료일", type: "date", value: assignment.completedAt || "" },
          { name: "certificateName", label: "증빙명", value: assignment.certificateName || "" },
          { name: "note", label: "메모", type: "textarea", full: true, value: assignment.note || "" }
        ], (data) => {
          const before = { ...assignment };
          const updates = {
            employeeId: data.employeeId,
            status: data.status,
            completedAt: data.completedAt,
            certificateName: data.certificateName,
            note: data.note
          };
          applyFieldChanges("courseAssignment", assignment.id, "교육 담당자", before, updates);
          Object.assign(assignment, updates);
          appendAuditLog("교육 담당자", "교육 이수상태 수정", employeeName(assignment.employeeId));
          saveData();
          render();
        });
      };
    });
  }
  if (state.section === "compensation") {
    document.querySelectorAll("[data-comp-plan-row]").forEach((row) => {
      row.onclick = () => {
        state.selectedCompensationPlanId = row.dataset.compPlanRow;
        render();
      };
    });
    el("compensationPlanForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!permissions.canCreate("compensation")) return deny();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      const plan = byId(state.data.compensationPlans, formData.id);
      if (!plan) return;
      const before = { ...plan };
      const updates = {
        cycleId: formData.cycleId,
        effectiveMonth: formData.effectiveMonth,
        targetCount: Number(formData.targetCount || 0),
        avgIncreaseRate: Number(formData.avgIncreaseRate || 0),
        budget: Number(formData.budget || 0),
        usedBudget: Number(formData.usedBudget || 0),
        status: formData.status,
        note: formData.note
      };
      applyFieldChanges("compensationPlan", plan.id, "보상 담당자", before, updates);
      Object.assign(plan, updates);
      appendAuditLog("보상 담당자", "보상안 수정", byId(state.data.evaluationCycles, plan.cycleId)?.title || plan.id);
      saveData();
      render();
    });
    document.querySelectorAll("[data-comp-action]").forEach((button) => {
      button.onclick = () => {
        if (!permissions.canCreate("compensation")) return deny();
        const plan = byId(state.data.compensationPlans, button.dataset.id);
        if (!plan) return;
        const action = button.dataset.compAction;
        if (action === "approve" && plan.status === "simulated") plan.status = "approved";
        if (action === "complete" && plan.linkedPayrollPeriodId) plan.status = "completed";
        appendAuditLog("보상 담당자", `보상안 ${action}`, byId(state.data.evaluationCycles, plan.cycleId)?.title || plan.id);
        saveData();
        render();
      };
    });
  }
  document.querySelectorAll("[data-payroll-action]").forEach((button) => {
    button.onclick = () => {
      if (!permissions.canEditPayroll()) return deny();
      const item = byId(state.data.payrollPeriods, button.dataset.id);
      if (!item) return;
      const action = button.dataset.payrollAction;
      if (action === "calculate" && ["drafting", "open"].includes(item.status)) {
        recalculatePayrollPeriod(item);
        item.status = "calculated";
      }
      else if (action === "verify" && item.status === "calculated") item.status = "verified";
      else if (action === "close" && item.status === "verified") item.status = "closed";
      else return;
      appendAuditLog("급여 담당자", `급여 ${action}`, item.period);
      saveData();
      render();
    };
  });
  document.querySelectorAll("[data-export-payroll-entries]").forEach((button) => {
    button.onclick = () => {
      if (!state.selectedPayrollPeriodId) return;
      const period = byId(state.data.payrollPeriods, state.selectedPayrollPeriodId);
      const rows = (state.data.payrollEntries || []).filter((item) => item.periodId === state.selectedPayrollPeriodId).map((item) => ({
        employee: employeeName(item.employeeId),
        basePay: item.basePay,
        bonusPay: item.bonusPay,
        deductionPay: item.deductionPay,
        netPay: item.netPay,
        status: labelCode(item.status)
      }));
      if (!rows.length) {
        alert("다운로드할 명세가 없습니다. 먼저 급여 계산을 실행하세요.");
        return;
      }
      downloadAsCsv(`payroll-entries-${period?.period || "period"}`, [
        { key: "employee", label: "직원" },
        { key: "basePay", label: "기본급" },
        { key: "bonusPay", label: "보상" },
        { key: "deductionPay", label: "공제" },
        { key: "netPay", label: "실지급" },
        { key: "status", label: "상태" }
      ], rows);
    };
  });
  document.querySelectorAll("[data-anomaly-action='resolve']").forEach((button) => {
    button.onclick = () => {
      if (!permissions.canEditPayroll()) return deny();
      const item = byId(state.data.payrollAnomalies, button.dataset.id);
      if (!item || item.status === "resolved") return;
      item.status = "resolved";
      const period = byId(state.data.payrollPeriods, item.periodId);
      if (period) period.anomalies = Math.max(0, period.anomalies - 1);
      appendAuditLog("급여 담당자", "급여 이상치 해소", item.type);
      saveData();
      render();
    };
  });
  document.querySelectorAll("[data-hr-action='finalize']").forEach((button) => {
    button.onclick = () => {
      if (!permissions.canCreate("movement")) return deny();
      const item = byId(state.data.hrActions, button.dataset.id);
      if (!item || item.status === "finalized") return;
      item.status = "finalized";
      const employee = byId(state.data.employees, item.employeeId);
      if (employee && item.afterOrgId) employee.orgId = item.afterOrgId;
      if (employee && item.afterJob) employee.job = item.afterJob;
      if (employee && item.afterGrade) employee.grade = item.afterGrade;
      appendAuditLog("HR 관리자", "발령 확정", employeeName(item.employeeId));
      saveData();
      render();
    };
  });
  if (state.section === "movement") {
    document.querySelectorAll("[data-hr-action-row]").forEach((row) => {
      row.onclick = () => {
        state.selectedHrActionId = row.dataset.hrActionRow;
        render();
      };
    });
  }
  document.querySelectorAll("[data-resignation-action]").forEach((button) => {
    button.onclick = () => {
      if (!permissions.canCreate("exit")) return deny();
      const item = byId(state.data.resignations, button.dataset.id);
      if (!item) return;
      const action = button.dataset.resignationAction;
      if (action === "approve") {
        if (item.status !== "applied") return;
        item.status = "approved";
      }
      if (action === "finalize") {
        if (!["approved", "offboarding"].includes(item.status)) return;
        item.status = "finalized";
        const employee = byId(state.data.employees, item.employeeId);
        if (employee) employee.status = "퇴직";
        item.checklistItems = normalizedResignation(item).checklistItems.map((entry) => ({ ...entry, done: true }));
        const progress = resignationChecklistProgress(item);
        item.checklistDone = progress.doneCount;
        item.checklistTotal = progress.totalCount;
        item.settlementStatus = "completed";
      }
      appendAuditLog("HR 관리자", `퇴직 ${action}`, employeeName(item.employeeId));
      saveData();
      render();
    };
  });
  document.querySelectorAll("[data-generate-doc]").forEach((button) => {
    button.onclick = () => {
      if (!permissions.canCreate(state.section)) return deny();
      const type = button.dataset.generateDoc;
      if (type === "hrAction") {
        const item = byId(state.data.hrActions, button.dataset.id);
        if (!item) return;
        generateDocument("발령", "hrAction", item.id, `${employeeName(item.employeeId)} 발령장`);
      }
      if (type === "resignation") {
        const item = byId(state.data.resignations, button.dataset.id);
        if (!item) return;
        generateDocument("퇴직", "resignation", item.id, `${employeeName(item.employeeId)} 퇴직 확인서`);
      }
      saveData();
      render();
    };
  });
  document.querySelectorAll("[data-approval-action]").forEach((button) => {
    button.onclick = () => {
      if (!["시스템 관리자", "HR 관리자"].includes(state.data.employees.find((item) => item.id === state.currentUserId)?.role)) return deny();
      const approval = byId(state.data.approvals, button.dataset.id);
      if (!approval || approval.status !== "pending") return;
      const action = button.dataset.approvalAction;
      approval.status = action === "approve" ? "approved" : "rejected";
      if (approval.type === "recruitmentRequest") {
        const target = byId(state.data.recruitmentRequests, approval.targetId);
        if (target) target.status = action === "approve" ? "approved" : "rejected";
      }
      if (approval.type === "leaveRequest") {
        const target = byId(state.data.leaveRequests, approval.targetId);
        if (target) target.status = action === "approve" ? "approved" : "rejected";
      }
      if (approval.type === "resignation") {
        const target = byId(state.data.resignations, approval.targetId);
        if (target) target.status = action === "approve" ? "approved" : "rejected";
      }
      appendAuditLog("승인자", `승인함 ${action}`, approval.title);
      saveData();
      render();
    };
  });
  document.querySelectorAll("[data-entity-action='delete']").forEach((button) => {
    button.onclick = () => {
      if (!["시스템 관리자", "HR 관리자"].includes(state.data.employees.find((item) => item.id === state.currentUserId)?.role)) return deny();
      const entity = byId(state.data.entities, button.dataset.id);
      if (!entity) return;
      const siteRefs = state.data.sites.filter((item) => item.entityId === entity.id).length;
      const orgRefs = state.data.orgs.filter((item) => item.entityId === entity.id).length;
      if (siteRefs || orgRefs) {
        alert("사업장 또는 조직이 연결된 법인은 삭제할 수 없습니다.");
        return;
      }
      if (state.data.entities.length <= 1) {
        alert("최소 1개의 법인은 유지해야 합니다.");
        return;
      }
      state.data.entities = state.data.entities.filter((item) => item.id !== entity.id);
      if (state.entityId === entity.id) state.entityId = state.data.entities[0]?.id || "";
      appendAuditLog("운영자", "법인 삭제", entity.name);
      saveData();
      render();
    };
  });
  document.querySelectorAll("[data-site-action='delete']").forEach((button) => {
    button.onclick = () => {
      if (!["시스템 관리자", "HR 관리자"].includes(state.data.employees.find((item) => item.id === state.currentUserId)?.role)) return deny();
      const site = byId(state.data.sites, button.dataset.id);
      if (!site) return;
      const orgRefs = state.data.orgs.filter((item) => item.siteId === site.id).length;
      if (orgRefs) {
        alert("조직이 연결된 사업장은 삭제할 수 없습니다.");
        return;
      }
      if (state.data.sites.length <= 1) {
        alert("최소 1개의 사업장은 유지해야 합니다.");
        return;
      }
      state.data.sites = state.data.sites.filter((item) => item.id !== site.id);
      if (state.siteId === site.id) {
        const nextSite = state.data.sites.find((item) => item.entityId === state.entityId) || state.data.sites[0];
        state.siteId = nextSite?.id || "";
      }
      appendAuditLog("운영자", "사업장 삭제", site.name);
      saveData();
      render();
    };
  });
}



/* src/forms/dialogs.js */
function createDialogHelpers(ctx) {
  const {
    state,
    el,
    byId,
    nowStamp,
    defaultEmployeeFields,
    normalizedOrg,
    normalizedPayrollPeriod,
    normalizedPayrollRule,
    normalizedResignation,
    labelCode,
    labelStage,
    normalizeResidentNumber,
    validateResidentNumber,
    visibleOrgs,
    visibleEmployees,
    visibleRecruitmentRequests,
    currentEntity,
    currentSite,
    employeeName,
    orgName,
    applyFieldChanges,
    appendAuditLog,
    saveData,
    render
  } = ctx;

  function closeModal() {
    state.modal = null;
    const root = el("modalRoot");
    root.innerHTML = "";
    root.classList.add("hidden");
  }

  function openModal(title, fields, onSubmit) {
    state.modal = { title, fields, onSubmit };
    const root = el("modalRoot");
    root.classList.remove("hidden");
    root.innerHTML = `
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true">
          <header>
            <div>
              <h3>${title}</h3>
              <p style="margin:8px 0 0;color:var(--muted);">필수 항목만 빠르게 입력하는 시범 운영 등록 폼입니다.</p>
            </div>
            <button class="button-secondary" id="closeModalButton">닫기</button>
          </header>
          <form id="dynamicForm">
            <div class="modal-grid">
              ${fields.map((field) => {
                const options = field.options ? field.options.map((option) => `<option value="${option.value}" ${String(field.value ?? "") === String(option.value) ? "selected" : ""}>${option.label}</option>`).join("") : "";
                const cls = field.full ? "full" : "";
                if (field.type === "hidden") {
                  return `<input type="hidden" name="${field.name}" value="${field.value || ""}" />`;
                }
                if (field.type === "select") {
                  return `<label class="${cls}">${field.label}<select name="${field.name}" ${field.required ? "required" : ""} ${field.readonly ? "disabled" : ""}>${options}</select>${field.readonly ? `<input type="hidden" name="${field.name}" value="${field.value || ""}" />` : ""}</label>`;
                }
                if (field.type === "textarea") {
                  return `<label class="${cls}">${field.label}<textarea name="${field.name}" ${field.required ? "required" : ""} ${field.readonly ? "readonly" : ""}>${field.value || ""}</textarea></label>`;
                }
                return `<label class="${cls}">${field.label}<input type="${field.type || "text"}" name="${field.name}" value="${field.value || ""}" placeholder="${field.placeholder || ""}" ${field.required ? "required" : ""} ${field.readonly ? "readonly" : ""} /></label>`;
              }).join("")}
            </div>
            <footer>
              <button type="button" class="button-secondary" id="cancelModalButton">취소</button>
              <button type="submit" class="button">저장</button>
            </footer>
          </form>
        </section>
      </div>
    `;
    el("closeModalButton").onclick = closeModal;
    el("cancelModalButton").onclick = closeModal;
    el("dynamicForm").onsubmit = (event) => {
      event.preventDefault();
      const formData = Object.fromEntries(new FormData(event.target).entries());
      const result = onSubmit(formData);
      if (result !== false) closeModal();
    };
  }

  function openSectionForm(section) {
    const siteOrgOptions = visibleOrgs().map((item) => ({ value: item.id, label: item.name }));
    const siteEmployeeOptions = visibleEmployees().map((item) => ({ value: item.id, label: item.name }));
    const entityOptions = (state.data.entities || []).map((item) => ({ value: item.id, label: item.name }));
    const siteOptions = (state.data.sites || [])
      .filter((item) => !currentEntity().id || item.entityId === currentEntity().id)
      .map((item) => ({ value: item.id, label: item.name }));
    if (section === "recruitment") {
      openModal("채용요청 등록", [
        { name: "title", label: "채용 제목", required: true },
        { name: "orgId", label: "조직", type: "select", options: siteOrgOptions },
        { name: "jobRole", label: "직무", required: true },
        { name: "headcount", label: "인원", type: "number", required: true },
        { name: "workLocation", label: "근무지", required: true, value: currentSite().name },
        { name: "openDate", label: "접수 시작일", type: "date", required: true },
        { name: "closeDate", label: "접수 마감일", type: "date", required: true },
        { name: "requestedJoinDate", label: "희망 입사일", type: "date", required: true },
        { name: "reason", label: "자격요건", type: "textarea", full: true, required: true },
        { name: "preferredQualifications", label: "우대사항", type: "textarea", full: true, required: true }
      ], (data) => {
        const requestId = "req-" + Date.now();
        state.data.recruitmentRequests.unshift({
          id: requestId,
          orgId: data.orgId,
          title: data.title,
          jobRole: data.jobRole,
          headcount: Number(data.headcount),
          workLocation: data.workLocation,
          openDate: data.openDate,
          closeDate: data.closeDate,
          requestedJoinDate: data.requestedJoinDate,
          reason: data.reason,
          preferredQualifications: data.preferredQualifications,
          status: "submitted",
          owner: "HR 관리자",
          employmentType: "정규직",
          postingStatus: "draft"
        });
        state.selectedPostingId = requestId;
        appendAuditLog("HR 관리자", "채용요청 등록", data.title);
        saveData();
        render();
      });
      return;
    }
    if (section === "onboarding") {
      openModal("온보딩 항목 등록", [
        { name: "name", label: "이름", required: true },
        { name: "joinDate", label: "입사일", type: "date", required: true },
        { name: "orgId", label: "배치 조직", type: "select", options: siteOrgOptions },
        { name: "job", label: "직무", required: true },
        { name: "jobFamily", label: "직군" },
        { name: "grade", label: "직급", required: true },
        { name: "employmentType", label: "고용형태", type: "select", options: ["정규직", "계약직", "파견직"].map((item) => ({ value: item, label: item })) },
        { name: "annualSalary", label: "연봉(만원)", type: "number", required: true },
        { name: "email", label: "이메일" },
        { name: "phone", label: "연락처" },
        { name: "workLocation", label: "근무지", value: currentSite().name }
      ], (data) => {
        state.data.onboarding.unshift({
          id: "onb-" + Date.now(),
          applicantId: "",
          name: data.name,
          joinDate: data.joinDate,
          orgId: data.orgId,
          job: data.job,
          jobFamily: data.jobFamily,
          grade: data.grade,
          employmentType: data.employmentType,
          annualSalary: Number(data.annualSalary || 0),
          email: data.email,
          phone: data.phone,
          workLocation: data.workLocation,
          status: "preboarding",
          checklistDone: 0,
          checklistTotal: 5,
          employeeNo: ""
        });
        appendAuditLog("인사운영", "온보딩 등록", data.name);
        saveData();
        render();
      });
      return;
    }
    if (section === "people") {
      openModal("직원 등록", [
        { name: "name", label: "이름", required: true },
        { name: "residentNumber", label: "주민등록번호", required: true, placeholder: "예: 900415-2000001" },
        { name: "orgId", label: "조직", type: "select", options: siteOrgOptions },
        { name: "job", label: "직무", required: true },
        { name: "jobFamily", label: "직군", type: "select", options: ["사무직", "생산직", "연구직"].map((item) => ({ value: item, label: item })) },
        { name: "grade", label: "직급", required: true },
        { name: "positionTitle", label: "직책" },
        { name: "annualSalary", label: "연봉(만원)", type: "number", required: true, placeholder: "예: 4800" }
      ], (data) => {
        const residentValidation = validateResidentNumber(data.residentNumber);
        if (!residentValidation.valid) {
          alert(residentValidation.message);
          return;
        }
        const employeeId = "emp-" + Date.now();
        state.data.employees.unshift(defaultEmployeeFields({
          id: employeeId,
          name: data.name,
          residentNumber: residentValidation.normalized,
          orgId: data.orgId,
          role: "구성원",
          job: data.job,
          jobFamily: data.jobFamily,
          grade: data.grade,
          positionTitle: data.positionTitle,
          employmentType: "정규직",
          status: "재직",
          hireDate: new Date().toISOString().slice(0, 10),
          annualSalary: Number(data.annualSalary)
        }));
        state.selectedEmployeeId = employeeId;
        appendAuditLog("인사운영", "직원 등록", data.name);
        saveData();
        render();
      });
      return;
    }
    if (section === "org") {
      if (!state.data.entities.length || !state.data.sites.length) {
        alert("조직을 생성하려면 먼저 운영자 콘솔에서 법인과 사업장을 등록해야 합니다.");
        return;
      }
      openModal("조직 추가", [
        { name: "entityId", label: "법인", type: "select", options: entityOptions.length ? entityOptions : [{ value: "", label: "법인 없음" }] },
        { name: "siteId", label: "사업장", type: "select", options: siteOptions.length ? siteOptions : [{ value: "", label: "사업장 없음" }] },
        { name: "name", label: "조직명", required: true },
        { name: "parentId", label: "상위조직", type: "select", options: [{ value: "", label: "없음" }, ...siteOrgOptions] },
        { name: "leader", label: "조직장", type: "select", options: [{ value: "", label: "미지정" }, ...siteEmployeeOptions] },
        { name: "headcount", label: "정원", type: "number", required: true }
      ], (data) => {
        const orgId = "org-" + Date.now();
        state.data.orgs.push(normalizedOrg({
          id: orgId,
          entityId: data.entityId,
          siteId: data.siteId,
          name: data.name,
          parentId: data.parentId,
          leader: data.leader,
          headcount: Number(data.headcount),
          status: "active"
        }));
        state.selectedOrgId = orgId;
        appendAuditLog("HR 관리자", "조직 추가", data.name);
        saveData();
        render();
      });
      return;
    }
    if (section === "attendance") {
      openModal("발생연차 입력", [
        { name: "employeeId", label: "직원", type: "select", options: siteEmployeeOptions },
        { name: "year", label: "연도", type: "number", required: true, value: "2026" },
        { name: "grantedDays", label: "발생연차", type: "number", required: true },
        { name: "carryoverDays", label: "이월연차", type: "number", required: true, value: "0" },
        { name: "adjustmentDays", label: "조정연차", type: "number", required: true, value: "0" }
      ], (data) => {
        state.data.leaveBalances = state.data.leaveBalances || [];
        const existing = state.data.leaveBalances.find((item) => item.employeeId === data.employeeId && Number(item.year) === Number(data.year));
        if (existing) {
          const before = { ...existing };
          existing.grantedDays = Number(data.grantedDays);
          existing.carryoverDays = Number(data.carryoverDays);
          existing.adjustmentDays = Number(data.adjustmentDays);
          applyFieldChanges("leaveBalance", existing.id, "인사담당자", before, existing);
        } else {
          const balanceId = "lb-" + Date.now();
          const created = {
            id: balanceId,
            employeeId: data.employeeId,
            year: Number(data.year),
            grantedDays: Number(data.grantedDays),
            carryoverDays: Number(data.carryoverDays),
            adjustmentDays: Number(data.adjustmentDays)
          };
          state.data.leaveBalances.unshift(created);
          applyFieldChanges("leaveBalance", balanceId, "인사담당자", {}, created);
        }
        appendAuditLog("인사담당자", "발생연차 입력", employeeName(data.employeeId));
        saveData();
        render();
      });
      return;
    }
    if (section === "learning") {
      openModal("교육 계획 등록", [
        { name: "title", label: "계획명", required: true },
        { name: "type", label: "유형", type: "select", options: ["필수교육", "직무교육", "리더교육"].map((item) => ({ value: item, label: item })) },
        { name: "target", label: "대상", required: true },
        { name: "owner", label: "주관부서/담당" },
        { name: "deliveryType", label: "교육방식", type: "select", options: ["온라인", "오프라인", "혼합"].map((item) => ({ value: item, label: item })) },
        { name: "cycle", label: "운영주기", type: "select", options: ["연간", "반기", "분기", "수시"].map((item) => ({ value: item, label: item })) },
        { name: "dueDate", label: "완료기준일", type: "date" },
        { name: "completionCriteria", label: "이수기준", required: true, value: "과정 이수" },
        { name: "completionRate", label: "이수율(%)", type: "number", required: true, value: "0" }
      ], (data) => {
        const courseId = "course-" + Date.now();
        state.data.courses.unshift(normalizedCourse({
          id: courseId,
          title: data.title,
          type: data.type,
          target: data.target,
          owner: data.owner,
          deliveryType: data.deliveryType,
          cycle: data.cycle,
          dueDate: data.dueDate,
          completionCriteria: data.completionCriteria,
          completionRate: Number(data.completionRate || 0),
          status: "active"
        }));
        state.selectedCourseId = courseId;
        appendAuditLog("교육 담당자", "교육 계획 등록", data.title);
        saveData();
        render();
      });
      return;
    }
    if (section === "review") {
      openModal("평가 사이클 생성", [
        { name: "title", label: "평가명", required: true },
        { name: "period", label: "대상 기간", required: true },
        { name: "targetCount", label: "대상 인원", type: "number", required: true },
        { name: "completionRate", label: "현재 진행률", type: "number", required: true, value: "0" },
        { name: "recommendedIncreaseRate", label: "권장 인상률(%)", type: "number", required: true, value: "3.5" },
        { name: "status", label: "상태", type: "select", options: ["planning", "ongoing", "completed"].map((item) => ({ value: item, label: labelCode(item) })) }
      ], (data) => {
        const cycleId = "ev-" + Date.now();
        state.data.evaluationCycles.unshift({
          id: cycleId,
          title: data.title,
          period: data.period,
          status: data.status,
          targetCount: Number(data.targetCount),
          completionRate: Number(data.completionRate || 0),
          recommendedIncreaseRate: Number(data.recommendedIncreaseRate || 0)
        });
        state.selectedEvaluationCycleId = cycleId;
        appendAuditLog("평가 담당자", "평가 사이클 생성", data.title);
        saveData();
        render();
      });
      return;
    }
    if (section === "compensation") {
      const eligibleCycles = state.data.evaluationCycles.filter((item) => ["completed", "approved", "finalized"].includes(item.status) || Number(item.completionRate || 0) >= 80);
      const defaultCycle = byId(state.data.evaluationCycles, state.selectedEvaluationCycleId) || eligibleCycles[0] || state.data.evaluationCycles[0];
      if (!defaultCycle) {
        alert("보상안을 만들 평가 사이클이 없습니다. 평가 사이클을 먼저 등록하세요.");
        return;
      }
      const activeEmployees = visibleEmployees().filter((item) => item.status === "재직");
      const recommendationRows = buildCompRecommendations(defaultCycle, activeEmployees);
      const recommendedBudget = recommendationRows.reduce((acc, item) => acc + Number(item.recommendedIncreaseAmount || 0), 0) || recommendedCompBudget(defaultCycle, activeEmployees);
      const recommendedRate = recommendationRows.length
        ? Math.round((recommendationRows.reduce((acc, item) => acc + Number(item.recommendedRate || 0), 0) / recommendationRows.length) * 10) / 10
        : recommendedCompRate(defaultCycle);
      openModal("보상안 시뮬레이션", [
        { name: "cycleId", label: "평가 사이클", type: "select", value: defaultCycle.id, options: eligibleCycles.length ? eligibleCycles.map((item) => ({ value: item.id, label: item.title })) : state.data.evaluationCycles.map((item) => ({ value: item.id, label: item.title })) },
        { name: "effectiveMonth", label: "반영월", type: "month", required: true },
        { name: "targetCount", label: "대상 인원", type: "number", required: true, value: String(recommendationRows.length || defaultCycle.targetCount || activeEmployees.length || 0) },
        { name: "avgIncreaseRate", label: "평균 인상률(%)", type: "number", required: true, value: String(recommendedRate) },
        { name: "budget", label: "총 예산", type: "number", required: true, value: String(recommendedBudget) }
      ], (data) => {
        const planId = "comp-" + Date.now();
        const cycle = byId(state.data.evaluationCycles, data.cycleId) || defaultCycle;
        const planRecommendations = buildCompRecommendations(cycle, activeEmployees);
        const gradeBudgetMatrix = ["S", "A", "B", "C"].map((grade) => {
          const rows = planRecommendations.filter((item) => item.grade === grade);
          return {
            grade,
            count: rows.length,
            recommendedRate: compRateByGrade(grade),
            budget: rows.reduce((acc, item) => acc + Number(item.recommendedIncreaseAmount || 0), 0)
          };
        });
        const usedBudget = planRecommendations.reduce((acc, item) => acc + Number(item.recommendedIncreaseAmount || 0), 0) || Math.round(Number(data.budget) * 0.9);
        state.data.compensationPlans.unshift({
          id: planId,
          cycleId: data.cycleId,
          effectiveMonth: data.effectiveMonth,
          targetCount: Number(data.targetCount),
          budget: Number(data.budget),
          avgIncreaseRate: Number(data.avgIncreaseRate || 0),
          usedBudget,
          status: "simulated",
          gradeBudgetMatrix,
          recommendationRows: planRecommendations
        });
        state.selectedCompensationPlanId = planId;
        appendAuditLog("보상 담당자", "보상안 시뮬레이션", byId(state.data.evaluationCycles, data.cycleId)?.title || data.cycleId);
        saveData();
        render();
      });
      return;
    }
    if (section === "payroll") {
      const activeEmployees = visibleEmployees().filter((item) => item.status === "재직");
      const defaultPeriod = new Date().toISOString().slice(0, 7);
      const defaultCompPlan = recommendedCompPlanForPeriod(defaultPeriod, state.data.compensationPlans);
      const baseGrossPay = sumMonthlyPayrollBase(activeEmployees);
      const compensationGrossPay = defaultCompPlan ? Number(defaultCompPlan.usedBudget || 0) : 0;
      openModal("급여 회차 생성", [
        { name: "period", label: "지급월", type: "month", required: true, value: defaultPeriod },
        { name: "payType", label: "지급구분", type: "select", options: ["월급", "상여", "성과급"].map((item) => ({ value: item, label: item })) },
        { name: "employeeCount", label: "대상 인원", type: "number", value: String(activeEmployees.length), required: true },
        { name: "baseGrossPay", label: "고정급 합계", type: "number", value: String(baseGrossPay), required: true },
        { name: "compensationGrossPay", label: "보상 반영액", type: "number", value: String(compensationGrossPay), required: true },
        { name: "grossPay", label: "예상 총지급액", type: "number", value: String(baseGrossPay + compensationGrossPay), required: true },
        { name: "linkedCompPlanId", label: "연계 보상안", type: "select", value: defaultCompPlan?.id || "", options: [{ value: "", label: "없음" }, ...state.data.compensationPlans.map((item) => ({ value: item.id, label: `${byId(state.data.evaluationCycles, item.cycleId)?.title || "-"} · ${item.effectiveMonth || "-"}` }))] },
        { name: "cutoffDate", label: "마감기준일", type: "date" },
        { name: "payDate", label: "지급예정일", type: "date" }
      ], (data) => {
        const linkedPlan = byId(state.data.compensationPlans, data.linkedCompPlanId) || recommendedCompPlanForPeriod(data.period, state.data.compensationPlans);
        const finalBaseGrossPay = Number(data.baseGrossPay || 0);
        const finalCompGrossPay = linkedPlan ? Number(linkedPlan.usedBudget || 0) : Number(data.compensationGrossPay || 0);
        const periodId = "pay-" + Date.now();
        state.data.payrollPeriods.unshift(normalizedPayrollPeriod({
          id: periodId,
          period: data.period,
          payType: data.payType,
          employeeCount: Number(data.employeeCount),
          status: "drafting",
          anomalies: 0,
          grossPay: finalBaseGrossPay + finalCompGrossPay,
          baseGrossPay: finalBaseGrossPay,
          compensationGrossPay: finalCompGrossPay,
          linkedCompPlanId: linkedPlan?.id || "",
          cutoffDate: data.cutoffDate,
          payDate: data.payDate
        }));
        if (linkedPlan) linkedPlan.linkedPayrollPeriodId = periodId;
        state.selectedPayrollPeriodId = periodId;
        appendAuditLog("급여 담당자", "급여 회차 생성", data.period);
        saveData();
        render();
      });
      return;
    }
    if (section === "movement") {
      openModal("발령 생성", [
        { name: "employeeId", label: "대상자", type: "select", options: siteEmployeeOptions },
        { name: "type", label: "발령 유형", type: "select", options: ["조직이동", "직무이동", "승진", "겸직"].map((item) => ({ value: item, label: item })) },
        { name: "afterOrgId", label: "변경 조직", type: "select", options: siteOrgOptions },
        { name: "afterJob", label: "변경 직무" },
        { name: "afterGrade", label: "변경 직급" },
        { name: "effectiveDate", label: "효력일", type: "date", required: true }
      ], (data) => {
        const employee = byId(state.data.employees, data.employeeId);
        state.data.hrActions.unshift({
          id: "act-" + Date.now(),
          employeeId: data.employeeId,
          type: data.type,
          beforeOrgId: employee?.orgId || "",
          beforeJob: employee?.job || "",
          beforeGrade: employee?.grade || "",
          afterOrgId: data.afterOrgId,
          afterJob: data.afterJob,
          afterGrade: data.afterGrade,
          effectiveDate: data.effectiveDate,
          status: "approved",
          note: "시범 운영 등록"
        });
        appendAuditLog("HR 관리자", "발령 생성", employeeName(data.employeeId));
        saveData();
        render();
      });
      return;
    }
    if (section === "exit") {
      openModal("퇴직 신청 등록", [
        { name: "employeeId", label: "대상자", type: "select", options: visibleEmployees().filter((item) => item.status === "재직").map((item) => ({ value: item.id, label: item.name })) },
        { name: "resignationType", label: "퇴직유형", type: "select", options: ["자진퇴사", "계약만료", "정년", "권고"].map((item) => ({ value: item, label: item })) },
        { name: "lastDate", label: "최종 근무일", type: "date", required: true },
        { name: "handoverDate", label: "인수인계 예정일", type: "date" },
        { name: "reason", label: "사유", type: "textarea", full: true, required: true }
      ], (data) => {
        const resignationId = "exit-" + Date.now();
        state.data.resignations.unshift(normalizedResignation({
          id: resignationId,
          employeeId: data.employeeId,
          resignationType: data.resignationType,
          reason: data.reason,
          lastDate: data.lastDate,
          handoverDate: data.handoverDate,
          status: "applied",
          checklistDone: 0,
          checklistTotal: 5
        }));
        state.selectedResignationId = resignationId;
        appendAuditLog("구성원", "퇴직 신청 등록", employeeName(data.employeeId));
        saveData();
        render();
      });
      return;
    }
    if (section === "admin") {
      openModal("정책 버전 등록", [
        { name: "area", label: "영역", type: "select", options: ["근태", "휴가", "평가", "보상", "급여", "승진"].map((item) => ({ value: item, label: item })) },
        { name: "name", label: "정책명", required: true },
        { name: "version", label: "버전", required: true },
        { name: "effectiveFrom", label: "효력일", type: "date", required: true }
      ], (data) => {
        state.data.policyVersions.unshift({
          id: "pol-" + Date.now(),
          area: data.area,
          name: data.name,
          version: data.version,
          effectiveFrom: data.effectiveFrom,
          status: "active"
        });
        appendAuditLog("운영자", "정책 버전 등록", data.name);
        saveData();
        render();
      });
    }
  }

  function openDialogByType(type) {
    const siteOrgOptions = visibleOrgs().map((item) => ({ value: item.id, label: item.name }));
    const siteEmployeeOptions = visibleEmployees().map((item) => ({ value: item.id, label: item.name }));
    if (type === "recruitmentRequest") return openSectionForm("recruitment");
    if (type === "applicant") {
      openModal("지원자 등록", [
        { name: "requestId", label: "채용 요청", type: "select", options: visibleRecruitmentRequests().map((item) => ({ value: item.id, label: item.title })) },
        { name: "name", label: "지원자명", required: true },
        { name: "channel", label: "채널", type: "select", options: ["사람인", "원티드", "잡코리아", "추천"].map((item) => ({ value: item, label: item })) },
        { name: "email", label: "이메일" },
        { name: "phone", label: "연락처" },
        { name: "score", label: "초기 평가점수", type: "number", required: true },
        { name: "proposedSalary", label: "제안 연봉(만원)", type: "number", value: "0" },
        { name: "desiredGrade", label: "제안 직급" },
        { name: "jobFamily", label: "직군" },
        { name: "expectedJoinDate", label: "예상 입사일", type: "date" }
      ], (data) => {
        const candidateId = "app-" + Date.now();
        state.data.applicants.unshift({
          id: candidateId,
          requestId: data.requestId,
          name: data.name,
          channel: data.channel,
          stage: "screening",
          score: Number(data.score),
          proposedSalary: Number(data.proposedSalary || 0),
          desiredGrade: data.desiredGrade || "",
          jobFamily: data.jobFamily || "",
          notes: "",
          status: "진행중",
          email: data.email,
          phone: data.phone,
          expectedJoinDate: data.expectedJoinDate || "",
          appliedAt: new Date().toISOString().slice(0, 10),
          interviewComment: ""
        });
        state.data.recruitmentStageHistories = state.data.recruitmentStageHistories || [];
        state.data.recruitmentStageHistories.unshift({
          id: "rsh-" + Date.now(),
          candidateId,
          stage: "screening",
          result: "접수",
          comment: "지원자 최초 등록",
          changedAt: nowStamp(),
          changedBy: "채용 담당자"
        });
        state.selectedPostingId = data.requestId;
        state.selectedCandidateId = candidateId;
        appendAuditLog("채용 담당자", "지원자 등록", data.name);
        saveData();
        render();
      });
      return;
    }
    if (type === "onboarding") return openSectionForm("onboarding");
    if (type === "employee") return openSectionForm("people");
    if (type === "org") return openSectionForm("org");
    if (type === "leave") return openSectionForm("attendance");
    if (type === "timeClose") {
      openModal("근태 마감 회차 추가", [
        { name: "period", label: "대상 월", type: "month", required: true },
        { name: "orgId", label: "조직", type: "select", options: siteOrgOptions },
        { name: "anomalies", label: "이상치 건수", type: "number", required: true },
        { name: "pendingApprovals", label: "미승인 건수", type: "number", required: true }
      ], (data) => {
        state.data.attendanceClosures.unshift({
          id: "tc-" + Date.now(),
          period: data.period,
          orgId: data.orgId,
          anomalies: Number(data.anomalies),
          pendingApprovals: Number(data.pendingApprovals),
          status: "open"
        });
        appendAuditLog("근태 담당자", "근태 마감 회차 추가", data.period);
        saveData();
        render();
      });
      return;
    }
    if (type === "leaveGrant") return openSectionForm("attendance");
    if (type === "leaveUsageBatch") {
      openModal("사용연차 일괄입력", [
        { name: "year", label: "연도", type: "number", required: true, value: "2026" },
        { name: "rows", label: "입력값", type: "textarea", full: true, required: true, value: "emp-1,연차,2026-03-20,2026-03-20,1,3월 반영\nemp-2,반차,2026-03-21,2026-03-21,0.5,반차 반영" }
      ], (data) => {
        const lines = data.rows.split("\n").map((line) => line.trim()).filter(Boolean);
        lines.forEach((line) => {
          const [employeeId, leaveType, from, to, days, note] = line.split(",").map((item) => item.trim());
          if (!employeeId || !from || !days) return;
          const leaveId = "leave-" + Date.now() + "-" + Math.random().toString(16).slice(2, 5);
          const created = {
            id: leaveId,
            employeeId,
            leaveType: leaveType || "연차",
            from,
            to: to || from,
            days: Number(days),
            status: "imported",
            note: note || "일괄 반영"
          };
          state.data.leaveRequests.unshift(created);
          applyFieldChanges("leaveUsage", leaveId, "인사담당자", {}, created);
        });
        appendAuditLog("인사담당자", "사용연차 일괄입력", `${lines.length}건`);
        saveData();
        render();
      });
      return;
    }
    if (type === "course") return openSectionForm("learning");
    if (type === "courseAssignment") {
      const selectedCourseId = state.selectedCourseId;
      if (!selectedCourseId) {
        alert("먼저 교육 계획을 선택하세요.");
        return;
      }
      openModal("교육 대상자 배정", [
        { name: "employeeId", label: "대상자", type: "select", options: visibleEmployees().map((item) => ({ value: item.id, label: item.name })) },
        { name: "status", label: "상태", type: "select", options: ["assigned", "ongoing", "completed"].map((item) => ({ value: item, label: labelCode(item) })) },
        { name: "completedAt", label: "수료일", type: "date" },
        { name: "certificateName", label: "증빙명" },
        { name: "note", label: "메모", type: "textarea", full: true }
      ], (data) => {
        state.data.courseAssignments.unshift(normalizedCourseAssignment({
          id: "ca-" + Date.now(),
          courseId: selectedCourseId,
          employeeId: data.employeeId,
          status: data.status,
          completedAt: data.completedAt,
          certificateName: data.certificateName,
          note: data.note
        }));
        appendAuditLog("교육 담당자", "교육 대상자 배정", employeeName(data.employeeId));
        saveData();
        render();
      });
      return;
    }
    if (type === "reviewCycle") return openSectionForm("review");
    if (type === "reviewGoal") {
      const cycle = byId(state.data.evaluationCycles, state.selectedEvaluationCycleId);
      if (!cycle) {
        alert("먼저 평가 사이클을 선택하세요.");
        return;
      }
      const editingGoal = (cycle.goalItems || []).find((item) => item.id === state.selectedReviewGoalId) || null;
      openModal(editingGoal ? "개인 목표 수정" : "개인 목표 등록", [
        { name: "goalId", type: "hidden", value: editingGoal?.id || "" },
        { name: "employeeId", label: "대상자", type: "select", value: editingGoal?.employeeId || state.selectedReviewEmployeeId || "", options: visibleEmployees().filter((item) => item.status === "재직").map((item) => ({ value: item.id, label: item.name })) },
        { name: "goalTitle", label: "개인 목표", required: true, value: editingGoal?.goalTitle || "" },
        { name: "targetMetric", label: "목표 지표", required: true, value: editingGoal?.targetMetric || "매출 120%, 프로젝트 납기 95% 등" },
        { name: "weight", label: "가중치(%)", type: "number", required: true, value: String(editingGoal?.weight ?? 25) },
        { name: "progress", label: "진척률(%)", type: "number", required: true, value: String(editingGoal?.progress ?? 0) },
        { name: "resultNote", label: "중간 코멘트", type: "textarea", full: true, value: editingGoal?.resultNote || "분기 실적/주요 결과를 기록하세요." }
      ], (data) => {
        cycle.goalItems = Array.isArray(cycle.goalItems) ? cycle.goalItems : [];
        const nextWeight = Number(data.weight || 0);
        const sameEmployeeWeight = cycle.goalItems
          .filter((item) => item.employeeId === data.employeeId && item.id !== data.goalId)
          .reduce((acc, item) => acc + Number(item.weight || 0), 0);
        if (sameEmployeeWeight + nextWeight > 100) {
          alert(`가중치 합이 ${sameEmployeeWeight + nextWeight}%입니다. 개인 목표 합계는 100% 이하여야 합니다.`);
          return false;
        }
        const payload = {
          id: data.goalId || "goal-" + Date.now(),
          employeeId: data.employeeId,
          goalTitle: data.goalTitle,
          targetMetric: data.targetMetric || "",
          weight: nextWeight,
          progress: Number(data.progress || 0),
          resultNote: data.resultNote || ""
        };
        const existing = cycle.goalItems.find((item) => item.id === payload.id);
        if (existing) Object.assign(existing, payload);
        else cycle.goalItems.unshift(payload);
        state.selectedReviewEmployeeId = data.employeeId;
        state.selectedReviewGoalId = payload.id;
        appendAuditLog("평가 담당자", "개인 목표 등록", employeeName(data.employeeId));
        saveData();
        render();
      });
      return;
    }
    if (type === "reviewScore") {
      const cycle = byId(state.data.evaluationCycles, state.selectedEvaluationCycleId);
      if (!cycle) {
        alert("먼저 평가 사이클을 선택하세요.");
        return;
      }
      const targetEmployee = byId(state.data.employees, state.selectedReviewEmployeeId) || byId(visibleEmployees(), state.selectedReviewEmployeeId) || null;
      const competencyModel = reviewCompetencyModel(targetEmployee?.jobFamily || "", targetEmployee?.job || "");
      const existing = cycle.reviewEntries.find((item) => item.employeeId === state.selectedReviewEmployeeId) || null;
      const phase = state.selectedReviewPhase || "self";
      const existingStage = existing?.reviewStages?.[phase] || normalizeReviewStage({}, {});
      openModal(`${reviewStageLabel(phase)} 입력`, [
        { name: "phase", type: "hidden", value: phase },
        { name: "employeeId", label: "대상자", type: "select", value: existing?.employeeId || state.selectedReviewEmployeeId || "", options: visibleEmployees().filter((item) => item.status === "재직").map((item) => ({ value: item.id, label: item.name })) },
        { name: "jobScore", label: "직무 점수", type: "number", required: true, value: String(existingStage?.jobScore ?? 0) },
        { name: "expertiseScore", label: competencyModel.expertise, type: "number", required: true, value: String(existingStage?.competencyScores?.expertiseScore ?? 0) },
        { name: "collaborationScore", label: competencyModel.collaboration, type: "number", required: true, value: String(existingStage?.competencyScores?.collaborationScore ?? 0) },
        { name: "executionScore", label: competencyModel.execution, type: "number", required: true, value: String(existingStage?.competencyScores?.executionScore ?? 0) },
        { name: "leadershipScore", label: competencyModel.leadership, type: "number", required: true, value: String(existingStage?.competencyScores?.leadershipScore ?? 0) },
        { name: "comment", label: "평가 코멘트", type: "textarea", full: true, value: existingStage?.comment || "" }
      ], (data) => {
        cycle.reviewEntries = Array.isArray(cycle.reviewEntries) ? cycle.reviewEntries : [];
        const scoreValues = [data.jobScore, data.expertiseScore, data.collaborationScore, data.executionScore, data.leadershipScore].map((item) => Number(item || 0));
        if (scoreValues.some((item) => item < 0 || item > 100)) {
          alert("평가 점수는 0점 이상 100점 이하로 입력하세요.");
          return false;
        }
        const existing = cycle.reviewEntries.find((item) => item.employeeId === data.employeeId);
        const competencyScores = {
          expertiseScore: Number(data.expertiseScore || 0),
          collaborationScore: Number(data.collaborationScore || 0),
          executionScore: Number(data.executionScore || 0),
          leadershipScore: Number(data.leadershipScore || 0)
        };
        const competencyAverage = Math.round((
          competencyScores.expertiseScore
          + competencyScores.collaborationScore
          + competencyScores.executionScore
          + competencyScores.leadershipScore
        ) / 4);
        const finalScore = Math.round((Number(data.jobScore || 0) * 0.7) + (competencyAverage * 0.3));
        const reviewStages = existing?.reviewStages || {
          self: normalizeReviewStage({}, {}),
          manager: normalizeReviewStage({}, {}),
          final: normalizeReviewStage({}, {})
        };
        reviewStages[data.phase] = normalizeReviewStage({
          status: data.phase === "final" ? "finalized" : "submitted",
          jobScore: Number(data.jobScore || 0),
          competencyScores,
          competencyAverage,
          finalScore,
          comment: data.comment || "",
          submittedAt: new Date().toISOString().slice(0, 10)
        }, {});
        const finalStage = reviewStages.final.status === "finalized"
          ? reviewStages.final
          : reviewStages.manager.status === "submitted"
            ? reviewStages.manager
            : reviewStages.self;
        const payload = {
          employeeId: data.employeeId,
          jobScore: Number(finalStage.jobScore || 0),
          competencyScores: finalStage.competencyScores,
          competencyAverage: Number(finalStage.competencyAverage || 0),
          finalScore: Number(finalStage.finalScore || 0),
          grade: scoreGrade(finalStage.finalScore || 0),
          comment: finalStage.comment || "",
          reviewStages,
          selfStatus: reviewStages.self.status,
          managerStatus: reviewStages.manager.status,
          finalStatus: reviewStages.final.status
        };
        if (existing) Object.assign(existing, payload);
        else cycle.reviewEntries.unshift(payload);
        state.selectedReviewEmployeeId = data.employeeId;
        appendAuditLog("평가 담당자", `${reviewStageLabel(data.phase)} 입력`, employeeName(data.employeeId));
        saveData();
        render();
      });
      return;
    }
    if (type === "appeal") {
      openModal("평가 이의신청 등록", [
        { name: "cycleId", label: "평가 사이클", type: "select", options: state.data.evaluationCycles.map((item) => ({ value: item.id, label: item.title })) },
        { name: "employeeId", label: "대상자", type: "select", options: siteEmployeeOptions },
        { name: "requestedAt", label: "요청일", type: "date", required: true },
        { name: "reason", label: "사유", type: "textarea", full: true, required: true }
      ], (data) => {
        state.data.evaluationAppeals.unshift({
          id: "appeal-" + Date.now(),
          cycleId: data.cycleId,
          employeeId: data.employeeId,
          reason: data.reason,
          status: "submitted",
          requestedAt: data.requestedAt
        });
        appendAuditLog("평가 담당자", "평가 이의신청 등록", employeeName(data.employeeId));
        saveData();
        render();
      });
      return;
    }
    if (type === "calibration") {
      openModal("평가 보정 등록", [
        { name: "cycleId", label: "평가 사이클", type: "select", options: state.data.evaluationCycles.map((item) => ({ value: item.id, label: item.title })) },
        { name: "orgId", label: "조직", type: "select", options: siteOrgOptions },
        { name: "gradeSpread", label: "등급 분포", required: true }
      ], (data) => {
        state.data.calibrations.unshift({
          id: "cal-" + Date.now(),
          cycleId: data.cycleId,
          orgId: data.orgId,
          gradeSpread: data.gradeSpread,
          status: "in_review"
        });
        appendAuditLog("평가 담당자", "평가 보정 등록", orgName(data.orgId));
        saveData();
        render();
      });
      return;
    }
    if (type === "compPlan") return openSectionForm("compensation");
    if (type === "payroll") return openSectionForm("payroll");
    if (type === "payAnomaly") {
      openModal("급여 이상치 등록", [
        { name: "periodId", label: "급여 회차", type: "select", options: state.data.payrollPeriods.map((item) => ({ value: item.id, label: item.period })) },
        { name: "employeeId", label: "직원", type: "select", options: siteEmployeeOptions },
        { name: "type", label: "이상 유형", required: true },
        { name: "severity", label: "심각도", type: "select", options: [{ value: "high", label: "높음" }, { value: "medium", label: "보통" }] },
        { name: "note", label: "메모", type: "textarea", full: true, required: true }
      ], (data) => {
        state.data.payrollAnomalies.unshift({
          id: "an-" + Date.now(),
          periodId: data.periodId,
          employeeId: data.employeeId,
          type: data.type,
          severity: data.severity,
          note: data.note,
          status: "open"
        });
        const period = byId(state.data.payrollPeriods, data.periodId);
        if (period) period.anomalies += 1;
        appendAuditLog("급여 담당자", "급여 이상치 등록", employeeName(data.employeeId));
        saveData();
        render();
      });
      return;
    }
    if (type === "movement") return openSectionForm("movement");
    if (type === "promotion") {
      openModal("승진 후보 등록", [
        { name: "employeeId", label: "대상자", type: "select", options: siteEmployeeOptions },
        { name: "currentGrade", label: "현재 직급", required: true },
        { name: "targetGrade", label: "목표 직급", required: true },
        { name: "score", label: "점수", type: "number", required: true },
        { name: "tenureMonths", label: "직급 체류개월", type: "number", required: true },
        { name: "trainingReady", label: "교육 충족", type: "select", options: [{ value: "true", label: "완료" }, { value: "false", label: "미완료" }] }
      ], (data) => {
        state.data.promotionCandidates.unshift({
          id: "pro-" + Date.now(),
          employeeId: data.employeeId,
          currentGrade: data.currentGrade,
          targetGrade: data.targetGrade,
          score: Number(data.score),
          tenureMonths: Number(data.tenureMonths),
          trainingReady: data.trainingReady === "true",
          status: Number(data.score) >= 85 ? "eligible" : "review_needed"
        });
        appendAuditLog("HR 관리자", "승진 후보 등록", employeeName(data.employeeId));
        saveData();
        render();
      });
      return;
    }
    if (type === "resignation") return openSectionForm("exit");
    if (type === "policy") return openSectionForm("admin");
    if (type === "entity") {
      openModal("법인 등록", [
        { name: "name", label: "법인명", required: true },
        { name: "code", label: "법인 코드", required: true },
        { name: "status", label: "상태", type: "select", options: ["active", "closed"].map((item) => ({ value: item, label: labelCode(item) })) }
      ], (data) => {
        const entityId = "ent-" + Date.now();
        state.data.entities.unshift({
          id: entityId,
          name: data.name,
          code: data.code,
          status: data.status
        });
        state.entityId = entityId;
        appendAuditLog("운영자", "법인 등록", data.name);
        saveData();
        render();
      });
      return;
    }
    if (type === "site") {
      openModal("사업장 등록", [
        { name: "entityId", label: "법인", type: "select", options: state.data.entities.map((item) => ({ value: item.id, label: item.name })) },
        { name: "name", label: "사업장명", required: true },
        { name: "type", label: "사업장 유형", type: "select", options: [{ value: "HQ", label: "본사" }, { value: "Factory", label: "공장" }] },
        { name: "status", label: "상태", type: "select", options: ["active", "closed"].map((item) => ({ value: item, label: labelCode(item) })) }
      ], (data) => {
        const siteId = "site-" + Date.now();
        state.data.sites.unshift({
          id: siteId,
          entityId: data.entityId,
          name: data.name,
          type: data.type,
          status: data.status
        });
        state.entityId = data.entityId;
        state.siteId = siteId;
        appendAuditLog("운영자", "사업장 등록", data.name);
        saveData();
        render();
      });
      return;
    }
    if (type === "template") {
      openModal("문서 템플릿 등록", [
        { name: "category", label: "카테고리", type: "select", options: ["발령", "증명서", "평가", "급여", "퇴직"].map((item) => ({ value: item, label: item })) },
        { name: "name", label: "템플릿명", required: true },
        { name: "version", label: "버전", required: true }
      ], (data) => {
        state.data.documentTemplates.unshift({
          id: "tpl-" + Date.now(),
          category: data.category,
          name: data.name,
          version: data.version,
          status: "active"
        });
        appendAuditLog("운영자", "문서 템플릿 등록", data.name);
        saveData();
        render();
      });
      return;
    }
    if (type === "payRule") {
      openModal("급여 규칙 등록", [
        { name: "code", label: "규칙 코드", required: true },
        { name: "name", label: "규칙명", required: true },
        { name: "category", label: "항목구분", type: "select", options: ["지급", "공제"].map((item) => ({ value: item, label: item })) },
        { name: "taxType", label: "과세구분", type: "select", options: ["과세", "비과세"].map((item) => ({ value: item, label: item })) },
        { name: "paymentType", label: "지급방식", type: "select", options: ["고정", "변동"].map((item) => ({ value: item, label: item })) },
        { name: "targetType", label: "대상구분", required: true },
        { name: "formula", label: "계산식", type: "textarea", full: true, required: true },
        { name: "effectiveFrom", label: "효력일", type: "date", required: true },
        { name: "note", label: "설명", type: "textarea", full: true }
      ], (data) => {
        const ruleId = "rule-" + Date.now();
        state.data.payrollRules.unshift(normalizedPayrollRule({
          id: ruleId,
          code: data.code,
          name: data.name,
          category: data.category,
          taxType: data.taxType,
          paymentType: data.paymentType,
          targetType: data.targetType,
          formula: data.formula,
          effectiveFrom: data.effectiveFrom,
          status: "active",
          note: data.note
        }));
        state.selectedPayrollRuleId = ruleId;
        appendAuditLog("급여 담당자", "급여 규칙 등록", data.name);
        saveData();
        render();
      });
      return;
    }
    if (type === "bulk") {
      openModal("대량 업로드 등록", [
        { name: "type", label: "업로드 유형", required: true },
        { name: "fileName", label: "파일명", required: true },
        { name: "rows", label: "행 수", type: "number", required: true },
        { name: "errorRows", label: "오류 행 수", type: "number", required: true }
      ], (data) => {
        state.data.bulkUploads.unshift({
          id: "bulk-" + Date.now(),
          type: data.type,
          fileName: data.fileName,
          rows: Number(data.rows),
          errorRows: Number(data.errorRows),
          status: Number(data.errorRows) > 0 ? "validated" : "approved"
        });
        appendAuditLog("운영자", "대량 업로드 등록", data.fileName);
        saveData();
        render();
      });
      return;
    }
    if (type === "integration") {
      openModal("연계 작업 등록", [
        { name: "system", label: "시스템", required: true },
        { name: "name", label: "작업명", required: true },
        { name: "status", label: "상태", type: "select", options: ["success", "failed", "open"].map((item) => ({ value: item, label: labelCode(item) })) }
      ], (data) => {
        state.data.integrationJobs.unshift({
          id: "int-" + Date.now(),
          system: data.system,
          name: data.name,
          status: data.status,
          lastRun: nowStamp()
        });
        appendAuditLog("운영자", "연계 작업 등록", data.name);
        saveData();
        render();
      });
      return;
    }
    if (type === "orgSim") {
      openModal("조직개편 시뮬레이션 등록", [
        { name: "name", label: "시뮬레이션명", required: true },
        { name: "impactedEmployees", label: "영향 인원", type: "number", required: true },
        { name: "impactedApprovals", label: "결재 영향 건수", type: "number", required: true }
      ], (data) => {
        state.data.orgSimulations.unshift({
          id: "sim-" + Date.now(),
          name: data.name,
          impactedEmployees: Number(data.impactedEmployees),
          impactedApprovals: Number(data.impactedApprovals),
          status: "draft"
        });
        appendAuditLog("운영자", "조직개편 시뮬레이션 등록", data.name);
        saveData();
        render();
      });
      return;
    }
    if (type === "policyImpact") {
      openModal("정책 영향도 등록", [
        { name: "policyId", label: "정책", type: "select", options: state.data.policyVersions.map((item) => ({ value: item.id, label: item.name })) },
        { name: "summary", label: "영향 요약", required: true },
        { name: "affectedEmployees", label: "영향 인원", type: "number", required: true }
      ], (data) => {
        state.data.policyImpacts.unshift({
          id: "impact-" + Date.now(),
          policyId: data.policyId,
          summary: data.summary,
          affectedEmployees: Number(data.affectedEmployees),
          status: "review"
        });
        appendAuditLog("운영자", "정책 영향도 등록", byId(state.data.policyVersions, data.policyId)?.name || data.policyId);
        saveData();
        render();
      });
      return;
    }
  }

  return {
    openModal,
    closeModal,
    openSectionForm,
    openDialogByType
  };
}



/* src/selectors/hrSelectors.js */
function createHrSelectors(ctx) {
  const { state, byId, defaultEmployeeFields } = ctx;
  const fallbackEntity = { id: "", name: "법인 미설정", code: "", status: "draft" };
  const fallbackSite = { id: "", entityId: "", name: "사업장 미설정", type: "", status: "draft" };

  function currentEntity() {
    return byId(state.data.entities, state.entityId) || state.data.entities[0] || fallbackEntity;
  }

  function currentSite() {
    return byId(state.data.sites, state.siteId) || state.data.sites[0] || fallbackSite;
  }

  function currentUser() {
    const matched = byId(state.data.employees, state.currentUserId);
    if (matched) return matched;
    const email = state.authUser?.email || "";
    return {
      id: state.authUser?.uid || "",
      name: email ? email.split("@")[0] : "시스템 관리자",
      role: "시스템 관리자",
      orgId: "",
      email
    };
  }

  function currentPolicy() {
    return byId(state.data.permissionPolicies, (state.data.permissionPolicies || []).find((item) => item.role === currentUser()?.role)?.id)
      || (state.data.permissionPolicies || []).find((item) => item.role === currentUser()?.role)
      || { role: currentUser()?.role || "", scope: "전사", payrollAccess: "none", employeeAccess: "none", approvalScope: "none" };
  }

  function employeeName(id) {
    return byId(state.data.employees, id)?.name || "-";
  }

  function orgName(id) {
    return byId(state.data.orgs, id)?.name || "-";
  }

  function orgForEmployee(employeeId) {
    const employee = byId(state.data.employees, employeeId);
    return employee ? byId(state.data.orgs, employee.orgId) : null;
  }

  function isCurrentSiteOrg(orgId) {
    if (!orgId) return false;
    return byId(state.data.orgs, orgId)?.siteId === currentSite().id;
  }

  function isCurrentSiteEmployee(employeeId) {
    return orgForEmployee(employeeId)?.siteId === currentSite().id;
  }

  function canSeeEmployee(employeeId) {
    const policy = currentPolicy();
    const user = currentUser();
    if (!employeeId) return false;
    if (policy.employeeAccess === "full" || policy.employeeAccess === "masked") {
      return isCurrentSiteEmployee(employeeId);
    }
    if (policy.employeeAccess === "team") {
      const employee = byId(state.data.employees, employeeId);
      return !!employee && employee.orgId === user?.orgId;
    }
    if (policy.employeeAccess === "self") {
      return employeeId === user?.id;
    }
    return false;
  }

  function canSeeOrg(orgId) {
    const policy = currentPolicy();
    const user = currentUser();
    if (!orgId) return false;
    if (policy.scope === "전사") return isCurrentSiteOrg(orgId);
    if (policy.scope === "소속조직") return byId(state.data.employees, user?.id)?.orgId === orgId;
    if (policy.scope === "본인") return false;
    return false;
  }

  function visibleOrgs() {
    return state.data.orgs.filter((item) => canSeeOrg(item.id));
  }

  function visibleEmployees() {
    return state.data.employees.filter((item) => canSeeEmployee(item.id));
  }

  function visibleRecruitmentRequests() {
    return state.data.recruitmentRequests.filter((item) => canSeeOrg(item.orgId));
  }

  function visibleApplicants() {
    return state.data.applicants.filter((item) => {
      const request = byId(state.data.recruitmentRequests, item.requestId);
      return request ? canSeeOrg(request.orgId) : false;
    });
  }

  function visibleOnboarding() {
    return state.data.onboarding.filter((item) => canSeeOrg(item.orgId));
  }

  function visibleHrActions() {
    return state.data.hrActions.filter((item) => {
      if (item.afterOrgId) return canSeeOrg(item.afterOrgId);
      if (item.beforeOrgId) return canSeeOrg(item.beforeOrgId);
      return canSeeEmployee(item.employeeId);
    });
  }

  function visibleLeaveRequests() {
    return state.data.leaveRequests.filter((item) => canSeeEmployee(item.employeeId));
  }

  function visibleLeaveBalances() {
    return (state.data.leaveBalances || []).filter((item) => canSeeEmployee(item.employeeId));
  }

  function visibleAttendanceClosures() {
    return state.data.attendanceClosures.filter((item) => canSeeOrg(item.orgId));
  }

  function visibleCourses() {
    return state.data.courses;
  }

  function visibleEvaluationAppeals() {
    return state.data.evaluationAppeals.filter((item) => canSeeEmployee(item.employeeId));
  }

  function visibleCalibrations() {
    return state.data.calibrations.filter((item) => canSeeOrg(item.orgId));
  }

  function visiblePayrollAnomalies() {
    return state.data.payrollAnomalies.filter((item) => canSeeEmployee(item.employeeId));
  }

  function payrollAuditLogs() {
    return (state.data.auditLogs || []).filter((item) => item.actor.includes("급여") || item.action.includes("급여"));
  }

  function visiblePromotionCandidates() {
    return state.data.promotionCandidates.filter((item) => canSeeEmployee(item.employeeId));
  }

  function visibleResignations() {
    return state.data.resignations.filter((item) => canSeeEmployee(item.employeeId));
  }

  function visibleHelpdesk() {
    return state.data.helpdesk;
  }

  function candidateAttachments(candidateId) {
    return (state.data.attachments || []).filter((item) => item.targetType === "candidate" && item.targetId === candidateId);
  }

  function candidateStageHistory(candidateId) {
    return (state.data.recruitmentStageHistories || []).filter((item) => item.candidateId === candidateId);
  }

  function filteredRecruitmentRequests() {
    const query = state.recruitmentFilters.query.trim().toLowerCase();
    return visibleRecruitmentRequests().filter((item) => {
      const haystack = [item.title, item.jobRole, item.workLocation, orgName(item.orgId)].join(" ").toLowerCase();
      return (
        (!query || haystack.includes(query)) &&
        (!state.recruitmentFilters.orgId || item.orgId === state.recruitmentFilters.orgId) &&
        (!state.recruitmentFilters.status || (item.postingStatus || item.status) === state.recruitmentFilters.status)
      );
    });
  }

  function requestCandidates(requestId) {
    return visibleApplicants().filter((item) => item.requestId === requestId);
  }

  function leaveUsedDays(employeeId, year) {
    return visibleLeaveRequests()
      .filter((item) => item.employeeId === employeeId && String(item.from || "").startsWith(String(year)))
      .reduce((acc, item) => acc + Number(item.days || 0), 0);
  }

  function leaveBalanceRows(year = new Date().getFullYear()) {
    return visibleLeaveBalances().map((item) => {
      const employee = defaultEmployeeFields(byId(state.data.employees, item.employeeId) || {});
      const usedDays = leaveUsedDays(item.employeeId, year);
      const totalGranted = Number(item.grantedDays || 0) + Number(item.carryoverDays || 0) + Number(item.adjustmentDays || 0);
      return {
        ...item,
        employee,
        usedDays,
        remainingDays: Number((totalGranted - usedDays).toFixed(1))
      };
    }).filter((item) => item.year === year);
  }

  function postingStatusLabel(item) {
    return item.postingStatus || item.status;
  }

  function employeeAttachments(employeeId) {
    return (state.data.attachments || []).filter((item) => item.targetType === "employee" && item.targetId === employeeId);
  }

  function employeeChangeHistory(employeeId) {
    return (state.data.changeHistory || []).filter((item) => item.entityType === "employee" && item.entityId === employeeId);
  }

  function entityChangeHistory(entityType, entityId) {
    return (state.data.changeHistory || []).filter((item) => item.entityType === entityType && item.entityId === entityId);
  }

  function filteredVisibleEmployees() {
    const query = state.peopleFilters.query.trim().toLowerCase();
    return visibleEmployees().filter((item) => {
      const employee = defaultEmployeeFields(item);
      const haystack = [employee.id, employee.name, employee.job, employee.positionTitle, employee.email].join(" ").toLowerCase();
      return (
        (!query || haystack.includes(query)) &&
        (!state.peopleFilters.orgId || employee.orgId === state.peopleFilters.orgId) &&
        (!state.peopleFilters.employmentType || employee.employmentType === state.peopleFilters.employmentType) &&
        (!state.peopleFilters.status || employee.status === state.peopleFilters.status)
      );
    });
  }

  function pendingApprovals() {
    return (state.data.approvals || []).filter((item) => item.status === "pending");
  }

  function kpis() {
    const activeEmployees = visibleEmployees().filter((item) => item.status === "재직").length;
    const openReq = visibleRecruitmentRequests().filter((item) => ["approved", "submitted"].includes(item.status)).length;
    const onboardingOpen = visibleOnboarding().filter((item) => item.status !== "completed").length;
    const payrollOpen = state.data.payrollPeriods.filter((item) => item.status !== "closed").length;
    const exitOpen = visibleResignations().filter((item) => item.status !== "finalized").length;
    const currentCycle = state.data.evaluationCycles[0];
    return [
      { label: "재직 인원", value: activeEmployees, note: "현재 재직 기준" },
      { label: "채용 진행", value: openReq, note: "승인/게시/면접 포함" },
      { label: "온보딩 진행", value: onboardingOpen, note: "입사 예정자 기준" },
      { label: "평가 진행률", value: `${currentCycle?.completionRate || 0}%`, note: currentCycle?.title || "-" },
      { label: "급여 미마감", value: payrollOpen, note: "현재 회차 기준" },
      { label: "퇴직 진행", value: exitOpen, note: "퇴직 절차 포함" }
    ];
  }

  function workflowRows() {
    const visibleEmployeeRows = visibleEmployees();
    const resignations = visibleResignations();
    const promotions = visiblePromotionCandidates();
    const currentCycle = state.data.evaluationCycles[0] || null;
    const activePlans = state.data.compensationPlans || [];
    return visibleOrgs().map((org) => {
      const employees = visibleEmployeeRows.filter((item) => item.orgId === org.id && item.status === "재직");
      const planForCycle = currentCycle ? activePlans.find((item) => item.cycleId === currentCycle.id) : null;
      return {
        id: org.id,
        name: org.name,
        employeeCount: employees.length,
        leaderAssigned: Boolean(org.leader),
        permissionOwnerAssigned: employees.some((item) => ["조직장", "본부장", "HR 관리자"].includes(item.role)),
        currentCycleTitle: currentCycle?.title || "-",
        reviewReady: Boolean(currentCycle) && Boolean(org.leader) && employees.length > 0,
        reviewCompletion: currentCycle?.completionRate || 0,
        compLinked: Boolean(planForCycle),
        promotionCount: promotions.filter((item) => byId(state.data.employees, item.employeeId)?.orgId === org.id).length,
        exitCount: resignations.filter((item) => byId(state.data.employees, item.employeeId)?.orgId === org.id && item.status !== "finalized").length
      };
    }).filter((item) => item.employeeCount > 0);
  }

  function workflowSnapshot() {
    const rows = workflowRows();
    const currentCycle = state.data.evaluationCycles[0] || null;
    const mandatoryCourses = visibleCourses().filter((item) => item.type === "필수교육");
    const linkedPlans = (state.data.compensationPlans || []).filter((item) => item.cycleId === currentCycle?.id);
    const linkedPayrollPeriods = (state.data.payrollPeriods || []).filter((item) => item.linkedCompPlanId);
    return {
      rows,
      currentCycle,
      orgReadyCount: rows.filter((item) => item.leaderAssigned && item.permissionOwnerAssigned).length,
      orgBlockedCount: rows.filter((item) => !item.leaderAssigned || !item.permissionOwnerAssigned).length,
      mandatoryRiskCount: mandatoryCourses.filter((item) => Number(item.completionRate || 0) < 90).length,
      reviewPendingCount: currentCycle ? Math.max(0, Number(currentCycle.targetCount || 0) - Math.round((Number(currentCycle.targetCount || 0) * Number(currentCycle.completionRate || 0)) / 100)) : 0,
      compLinkedCount: linkedPlans.length,
      payrollLinkedCount: linkedPayrollPeriods.length,
      approvalPendingCount: pendingApprovals().length
    };
  }

  return {
    currentEntity,
    currentSite,
    currentUser,
    currentPolicy,
    employeeName,
    orgName,
    orgForEmployee,
    isCurrentSiteOrg,
    isCurrentSiteEmployee,
    canSeeEmployee,
    canSeeOrg,
    visibleOrgs,
    visibleEmployees,
    visibleRecruitmentRequests,
    visibleApplicants,
    visibleOnboarding,
    visibleHrActions,
    visibleLeaveRequests,
    visibleLeaveBalances,
    visibleAttendanceClosures,
    visibleCourses,
    visibleEvaluationAppeals,
    visibleCalibrations,
    visiblePayrollAnomalies,
    payrollAuditLogs,
    visiblePromotionCandidates,
    visibleResignations,
    visibleHelpdesk,
    candidateAttachments,
    candidateStageHistory,
    filteredRecruitmentRequests,
    requestCandidates,
    leaveBalanceRows,
    postingStatusLabel,
    employeeAttachments,
    employeeChangeHistory,
    entityChangeHistory,
    filteredVisibleEmployees,
    pendingApprovals,
    kpis,
    workflowRows,
    workflowSnapshot
  };
}



/* src/app/app.js */

      const SCHEMA_VERSION = 2;
      const REMEMBER_EMAIL_KEY = "hr-oneflow-remember-email";
      const LOCAL_DATA_KEY = "hr-oneflow-local-data";
      const FIREBASE_CONFIG = {
        apiKey: "AIzaSyAshH-m68KF79ZGwEGEK8Fzg1uI5GP2TUw",
        authDomain: "hr-oneflow.firebaseapp.com",
        databaseURL: "https://hr-oneflow-default-rtdb.firebaseio.com",
        projectId: "hr-oneflow",
        storageBucket: "hr-oneflow.firebasestorage.app",
        messagingSenderId: "526783034091",
        appId: "1:526783034091:web:b9e4bbb7772eb9972104ae",
        measurementId: "G-ZJV7E00DTN"
      };
      const CLOUD_DATA_PATH = "hrOneFlow/appState";

      function initFirebaseServices() {
        if (!window.firebase) return { enabled: false, app: null, auth: null, db: null };
        const app = window.firebase.apps?.length ? window.firebase.app() : window.firebase.initializeApp(FIREBASE_CONFIG);
        try {
          if (typeof window.firebase.analytics === "function" && location.protocol.startsWith("http")) {
            window.firebase.analytics(app);
          }
        } catch (error) {
          console.warn("Firebase analytics initialization skipped.", error);
        }
        return {
          enabled: true,
          app,
          auth: window.firebase.auth(app),
          db: window.firebase.database(app)
        };
      }
      async function ensureSessionPersistence(auth) {
        if (!auth || !window.firebase?.auth?.Auth?.Persistence?.SESSION) return;
        await auth.setPersistence(window.firebase.auth.Auth.Persistence.SESSION);
      }
      const NAV_ITEMS = [
        { id: "dashboard", label: "대시보드" },
        { id: "recruitment", label: "채용" },
        { id: "onboarding", label: "온보딩" },
        { id: "people", label: "인사기본" },
        { id: "org", label: "조직/권한" },
        { id: "attendance", label: "근태" },
        { id: "learning", label: "교육" },
        { id: "review", label: "평가" },
        { id: "compensation", label: "보상" },
        { id: "payroll", label: "급여" },
        { id: "movement", label: "승진/이동/발령" },
        { id: "exit", label: "퇴직" },
        { id: "admin", label: "운영자 콘솔" }
      ];
      const SUBSECTION_ITEMS = {
        dashboard: [
          { id: "overview", label: "종합현황" },
          { id: "risk", label: "알림/리스크" }
        ],
        recruitment: [
          { id: "posting", label: "채용공고" },
          { id: "pipeline", label: "지원자 파이프라인" },
          { id: "report", label: "채용리포트" }
        ],
        onboarding: [
          { id: "preboarding", label: "입사예정자" },
          { id: "checklist", label: "준비 체크리스트" },
          { id: "access", label: "계정/장비/문서" },
          { id: "firstDay", label: "첫 주 운영" }
        ],
        people: [
          { id: "dashboard", label: "인사 대시보드" },
          { id: "card", label: "인사카드" },
          { id: "history", label: "인사이력" },
          { id: "attachment", label: "첨부문서" }
        ],
        org: [
          { id: "structure", label: "조직정보" },
          { id: "permission", label: "권한정책" },
          { id: "code", label: "코드관리" }
        ],
        attendance: [
          { id: "balance", label: "연차원장" },
          { id: "usage", label: "사용내역 반영" },
          { id: "closing", label: "근태마감" }
        ],
        learning: [
          { id: "course", label: "교육계획" },
          { id: "mandatory", label: "필수교육 점검" },
          { id: "completion", label: "대상자 이수관리" }
        ],
        review: [
          { id: "framework", label: "평가기준/체크리스트" },
          { id: "goal", label: "목표/KPI 정렬" },
          { id: "evaluation", label: "평가 운영" },
          { id: "appeal", label: "이의신청" },
          { id: "calibration", label: "보정/캘리브레이션" },
          { id: "linkage", label: "보상 연계" }
        ],
        compensation: [
          { id: "budget", label: "예산 가이드" },
          { id: "plan", label: "보상 시뮬레이션" },
          { id: "promotion", label: "승진후보" },
          { id: "payroll", label: "급여 반영 추적" }
        ],
        payroll: [
          { id: "period", label: "급여주기" },
          { id: "rule", label: "급여규칙" },
          { id: "audit", label: "이상치/감사로그" }
        ],
        movement: [
          { id: "action", label: "발령관리" },
          { id: "candidate", label: "승진후보" },
          { id: "readiness", label: "후속 준비상태" },
          { id: "document", label: "문서출력" }
        ],
        exit: [
          { id: "planned", label: "퇴직예정" },
          { id: "checklist", label: "오프보딩 체크리스트" },
          { id: "settlement", label: "퇴직정산" },
          { id: "analysis", label: "퇴직분석" }
        ],
        admin: [
          { id: "entitySite", label: "법인/사업장" },
          { id: "policy", label: "정책/코드" },
          { id: "template", label: "문서/템플릿" },
          { id: "integration", label: "연계/업로드" },
          { id: "audit", label: "감사로그" },
          { id: "data", label: "데이터 관리" }
        ]
      };

      const SECTION_META = {
        dashboard: { title: "대시보드", description: "채용, 인원, 평가, 급여, 퇴직까지 핵심 운영 지표를 한눈에 확인합니다.", action: "운영 리포트 생성" },
        recruitment: { title: "채용", description: "채용요청부터 지원자, 면접, 오퍼, 입사확정까지 채용 파이프라인을 관리합니다.", action: "채용요청 등록" },
        onboarding: { title: "온보딩", description: "입사 예정자의 서류, 사번, 계정, 교육, 체크리스트를 연결 관리합니다.", action: "온보딩 항목 등록" },
        people: { title: "인사기본", description: "인사카드, 계약, 인사이력, 재직 상태를 기준일 이력으로 관리합니다.", action: "직원 등록" },
        org: { title: "조직/권한", description: "조직도, 역할, 결재선, 민감정보 접근 범위를 설정합니다.", action: "조직 추가" },
        attendance: { title: "근태", description: "출퇴근, 휴가, 초과근무, 월 근태 마감과 이상치 점검을 운영합니다.", action: "휴가 신청 등록" },
        learning: { title: "교육", description: "필수교육 계획, 대상 배정, 이수 점검을 운영합니다.", action: "교육 계획 등록" },
        review: { title: "평가", description: "목표설정, 성과/역량 평가, 확정 상태를 주기 단위로 운영합니다.", action: "평가 사이클 생성" },
        compensation: { title: "보상", description: "평가 확정 결과를 바탕으로 보상안을 시뮬레이션하고 승인합니다.", action: "보상안 시뮬레이션" },
        payroll: { title: "급여", description: "근태와 보상 결과를 반영해 급여를 계산하고 검증 및 마감합니다.", action: "급여 회차 생성" },
        movement: { title: "승진/이동/발령", description: "승진 후보군, 조직이동, 발령 확정과 후행 영향도를 관리합니다.", action: "발령 생성" },
        exit: { title: "퇴직", description: "퇴직 신청부터 오프보딩, 정산, 계정 종료까지 누락 없이 처리합니다.", action: "퇴직 신청 등록" },
        admin: { title: "운영자 콘솔", description: "정책, 코드, 템플릿, 업로드, 로그, 연계 오류를 운영 관점에서 관리합니다.", action: "정책 버전 등록" }
      };
      const SUBSECTION_META = {
        dashboard: {
          overview: { title: "종합현황", description: "인원, 채용, 급여, 퇴직 핵심 현황을 한눈에 확인합니다.", action: "운영 리포트 생성" },
          risk: { title: "알림/리스크", description: "계약만료, 수습종료, 미처리 승인과 운영 리스크를 점검합니다.", action: "운영 리포트 생성" }
        },
        recruitment: {
          posting: { title: "채용공고", description: "공고 목록과 상세 입력, 공고 변경 이력을 관리합니다.", action: "공고 등록" },
          pipeline: { title: "지원자 파이프라인", description: "지원자 단계 이동, 면접 의견, 첨부 서류를 관리합니다.", action: "지원자 등록" },
          report: { title: "채용리포트", description: "공고별 지원 현황과 단계별 성과를 리포트로 조회합니다.", action: "리포트 다운로드" }
        },
        onboarding: {
          preboarding: { title: "입사예정자", description: "입사 예정자와 배치 예정 정보를 관리합니다.", action: "온보딩 항목 등록" },
          checklist: { title: "준비 체크리스트", description: "서류, 계정, 장비, 교육 준비 상태를 점검합니다.", action: "온보딩 항목 등록" },
          access: { title: "계정/장비/문서", description: "메일, 그룹웨어, 노트북, 입사서류 준비 상태를 확인합니다.", action: "온보딩 항목 등록" },
          firstDay: { title: "첫 주 운영", description: "첫 출근부터 교육, 버디, 오리엔테이션 일정을 운영합니다.", action: "온보딩 항목 등록" }
        },
        people: {
          dashboard: { title: "인사 대시보드", description: "인사카드 기준 인원 통계와 구성 분포를 대시보드로 조회합니다.", action: "직원 등록" },
          card: { title: "인사카드", description: "직원 기본정보와 재직 상태를 관리합니다.", action: "직원 등록" },
          history: { title: "인사이력", description: "발령, 상태 변경, 인사 이벤트 이력을 조회합니다.", action: "직원 등록" },
          attachment: { title: "첨부문서", description: "직원별 첨부 문서와 변경 이력을 조회합니다.", action: "직원 등록" }
        },
        org: {
          structure: { title: "조직정보", description: "법인/사업장/조직 구조와 조직장을 관리합니다.", action: "조직 추가" },
          permission: { title: "권한정책", description: "역할별 접근 범위와 민감정보 정책을 관리합니다.", action: "조직 추가" },
          code: { title: "코드관리", description: "직군, 직급, 직책 코드를 관리합니다.", action: "조직 추가" }
        },
        attendance: {
          balance: { title: "연차원장", description: "직원별 발생, 사용, 잔여 연차를 조회합니다.", action: "발생연차 입력" },
          usage: { title: "사용내역 반영", description: "그룹웨어 사용 내역과 수동 조정분을 반영합니다.", action: "사용내역 반영" },
          closing: { title: "근태마감", description: "월별 근태 마감과 이상치 현황을 관리합니다.", action: "마감 회차 추가" }
        },
        learning: {
          course: { title: "교육계획", description: "필수교육과 직무교육의 대상, 운영 상태, 이수 목표를 관리합니다.", action: "교육 계획 등록" },
          mandatory: { title: "필수교육 점검", description: "법정/보안/개인정보 필수교육 누락 대상을 집중 점검합니다.", action: "교육 계획 등록" },
          completion: { title: "대상자 이수관리", description: "과정별 배정 대상자와 수료 증빙을 관리합니다.", action: "대상자 배정" }
        },
        review: {
          framework: { title: "평가기준/체크리스트", description: "평가 전 준비 항목과 운영 체크리스트를 점검합니다.", action: "사이클 생성" },
          goal: { title: "목표/KPI 정렬", description: "조직별 목표 수립, 평가 대상, 평가자 배정 리스크를 점검합니다.", action: "사이클 생성" },
          evaluation: { title: "평가 운영", description: "평가 사이클별 진행률, 대상자, 확정 상태를 운영합니다.", action: "사이클 생성" },
          appeal: { title: "이의신청", description: "평가 이의신청 접수와 처리 상태를 관리합니다.", action: "이의신청 등록" },
          calibration: { title: "보정/캘리브레이션", description: "조직별 등급 분포 보정을 관리합니다.", action: "보정안 등록" },
          linkage: { title: "보상 연계", description: "평가 결과와 보상/급여 반영 상태를 연결 관리합니다.", action: "보상안 시뮬레이션" }
        },
        compensation: {
          budget: { title: "예산 가이드", description: "평가 사이클별 권장 예산과 확정 예산 편차를 점검합니다.", action: "보상안 시뮬레이션" },
          plan: { title: "보상 시뮬레이션", description: "평가 결과 기반 보상안을 시뮬레이션합니다.", action: "보상안 시뮬레이션" },
          promotion: { title: "승진후보", description: "승진 후보 현황과 추천 상태를 점검합니다.", action: "승진 후보 등록" },
          payroll: { title: "급여 반영 추적", description: "보상안이 실제 급여 회차에 반영되었는지 추적합니다.", action: "급여 회차 생성" }
        },
        payroll: {
          period: { title: "급여주기", description: "급여 회차별 계산, 검증, 마감 상태를 관리합니다.", action: "급여 회차 생성" },
          rule: { title: "급여규칙", description: "급여 항목과 계산 규칙을 관리합니다.", action: "급여 규칙 등록" },
          audit: { title: "이상치/감사로그", description: "급여 이상치와 변경 로그를 점검합니다.", action: "이상치 등록" }
        },
        movement: {
          action: { title: "발령관리", description: "조직이동, 승진, 발령 확정 상태를 관리합니다.", action: "발령 생성" },
          candidate: { title: "승진후보", description: "승진 후보군과 준비 상태를 점검합니다.", action: "승진 후보 등록" },
          readiness: { title: "후속 준비상태", description: "발령 후 계정, 문서, 인수인계, 교육 준비를 점검합니다.", action: "승진 후보 등록" },
          document: { title: "문서출력", description: "발령장과 인사변동 문서 출력을 관리합니다.", action: "데이터 내보내기" }
        },
        exit: {
          planned: { title: "퇴직예정", description: "퇴직 신청과 체크리스트 진행 상태를 관리합니다.", action: "퇴직 신청 등록" },
          checklist: { title: "오프보딩 체크리스트", description: "자산 반납, 계정 회수, 정산 누락을 항목별로 점검합니다.", action: "퇴직 신청 등록" },
          settlement: { title: "퇴직정산", description: "미사용 연차와 퇴직 정산 정보를 관리합니다.", action: "퇴직 신청 등록" },
          analysis: { title: "퇴직분석", description: "퇴직 유형과 기간별 현황을 분석합니다.", action: "퇴직 신청 등록" }
        },
        admin: {
          entitySite: { title: "법인/사업장", description: "법인과 사업장 기준정보를 관리합니다.", action: "법인 등록" },
          policy: { title: "정책/코드", description: "정책 버전과 코드 정책을 관리합니다.", action: "정책 버전 등록" },
          template: { title: "문서/템플릿", description: "문서 템플릿과 생성 문서를 관리합니다.", action: "템플릿 등록" },
          integration: { title: "연계/업로드", description: "연계 작업과 대량 업로드를 관리합니다.", action: "연계 작업 등록" },
          audit: { title: "감사로그", description: "운영 로그와 변경 기록을 조회합니다.", action: "데이터 내보내기" },
          data: { title: "데이터 관리", description: "클라우드 데이터 내보내기와 전체 데이터 삭제를 운영자 기준으로 관리합니다.", action: "데이터 내보내기" }
        }
      };

      const state = {
        section: "dashboard",
        subSection: "",
        entityId: "ent-1",
        siteId: "site-1",
        currentUserId: "",
        authUser: null,
        authReady: false,
        authError: "",
        modal: null,
        selectedEmployeeId: null,
        peopleFilters: {
          query: "",
          orgId: "",
          employmentType: "",
          status: ""
        },
        peopleDashboardFilters: {
          grade: "",
          tenureBand: "",
          leaderOnly: "",
          siteCompare: "current"
        },
        selectedResignationId: null,
        selectedPayrollPeriodId: null,
        selectedPayrollRuleId: null,
        selectedOrgId: null,
        selectedPostingId: null,
        selectedCandidateId: null,
        selectedOnboardingId: null,
        selectedEvaluationCycleId: null,
        selectedReviewEmployeeId: null,
        selectedReviewGoalId: null,
        selectedReviewPhase: "self",
        selectedCompensationPlanId: null,
        selectedCourseId: null,
        selectedHrActionId: null,
        recruitmentFilters: {
          query: "",
          orgId: "",
          status: ""
        },
        data: null
      };


      const firebaseServices = initFirebaseServices();
      let dataRef = null;
      let dataListener = null;
      let saveTimer = null;

      function loadLocalBackup() {
        try {
          const raw = window.localStorage.getItem(LOCAL_DATA_KEY);
          if (!raw) return null;
          return normalizeData(JSON.parse(raw));
        } catch (error) {
          console.warn("Failed to load local backup.", error);
          return null;
        }
      }

      function saveLocalBackup() {
        try {
          if (!state.data) return;
          window.localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(state.data));
        } catch (error) {
          console.warn("Failed to save local backup.", error);
        }
      }

      function syncCurrentUserIdFromAuth() {
        const existing = byId(state.data?.employees || [], state.currentUserId);
        if (existing) return;
        const authEmail = state.authUser?.email || "";
        if (!authEmail) return;
        const matchedEmployee = (state.data.employees || []).find((item) => item.email && item.email === authEmail);
        if (matchedEmployee) state.currentUserId = matchedEmployee.id;
      }

      async function loadData() {
        const localBackup = loadLocalBackup();
        if (!firebaseServices.enabled || !state.authUser) {
          state.data = localBackup || createSeedData(SCHEMA_VERSION);
          syncCurrentUserIdFromAuth();
          return;
        }
        try {
          const snapshot = await firebaseServices.db.ref(CLOUD_DATA_PATH).get();
          state.data = snapshot.exists() ? normalizeData(snapshot.val()) : (localBackup || createSeedData(SCHEMA_VERSION));
          syncCurrentUserIdFromAuth();
          saveLocalBackup();
        } catch (error) {
          console.error("Failed to load cloud data.", error);
          state.authError = "클라우드 데이터를 불러오지 못했습니다.";
          state.data = localBackup || createSeedData(SCHEMA_VERSION);
          syncCurrentUserIdFromAuth();
        }
      }

      function saveData() {
        state.data.schemaVersion = SCHEMA_VERSION;
        saveLocalBackup();
        if (!firebaseServices.enabled || !state.authUser) return;
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(async () => {
          try {
            await firebaseServices.db.ref(CLOUD_DATA_PATH).set(state.data);
            saveLocalBackup();
          } catch (error) {
            console.error("Failed to save cloud data.", error);
            state.authError = "클라우드 저장에 실패했습니다.";
            renderAuthGate();
          }
        }, 200);
      }

      function $(selector) { return document.querySelector(selector); }
      function el(id) { return document.getElementById(id); }
      function appendAuditLog(actor, action, target) {
        state.data.auditLogs = state.data.auditLogs || [];
        state.data.auditLogs.unshift({
          id: "log-" + Date.now() + "-" + Math.random().toString(16).slice(2, 6),
          actor,
          action,
          target,
          at: nowStamp()
        });
      }
      const selectors = createHrSelectors({ state, byId, defaultEmployeeFields });
      const {
        currentEntity,
        currentSite,
        currentUser,
        currentPolicy,
        employeeName,
        orgName,
        isCurrentSiteOrg,
        isCurrentSiteEmployee,
        canSeeEmployee,
        visibleOrgs,
        visibleEmployees,
        visibleRecruitmentRequests,
        visibleApplicants,
        visibleOnboarding,
        visibleHrActions,
        visibleLeaveRequests,
        visibleAttendanceClosures,
        visibleCourses,
        visibleEvaluationAppeals,
        visibleCalibrations,
        visiblePayrollAnomalies,
        payrollAuditLogs,
        visiblePromotionCandidates,
        visibleResignations,
        visibleHelpdesk,
        candidateAttachments,
        candidateStageHistory,
        filteredRecruitmentRequests,
        requestCandidates,
        leaveBalanceRows,
        postingStatusLabel,
        employeeAttachments,
        employeeChangeHistory,
        entityChangeHistory,
        filteredVisibleEmployees,
        pendingApprovals,
        kpis,
        workflowRows,
        workflowSnapshot
      } = selectors;
      const permissions = createPermissionHelpers({
        currentUser,
        currentPolicy,
        canSeeEmployee
      });
      function recordFieldChange(entityType, entityId, changedBy, field, beforeValue, afterValue) {
        state.data.changeHistory = state.data.changeHistory || [];
        state.data.changeHistory.unshift({
          id: "chg-" + Date.now() + "-" + Math.random().toString(16).slice(2, 6),
          entityType,
          entityId,
          changedAt: nowStamp(),
          changedBy,
          field,
          beforeValue: String(beforeValue ?? ""),
          afterValue: String(afterValue ?? "")
        });
      }
      function applyFieldChanges(entityType, entityId, changedBy, before, updates) {
        Object.entries(updates).forEach(([field, value]) => {
          if (String(before[field] ?? "") !== String(value ?? "")) {
            recordFieldChange(entityType, entityId, changedBy, field, before[field], value);
          }
        });
      }
      function activeTemplate(category) {
        return (state.data.documentTemplates || []).find((item) => item.category === category && item.status === "active");
      }
      function normalizeData(data) {
        return appDataNormalizeData({
          data,
          createSeedData,
          schemaVersion: SCHEMA_VERSION,
          defaultEmployeeFields,
          normalizedOrg,
          normalizedPayrollRule,
          normalizedPayrollPeriod,
          normalizedResignation,
          resignationChecklistProgress
        });
      }
      function syncApprovalQueue() {
        appDataSyncApprovalQueue({
          data: state.data,
          byId,
          employeeName,
          nowStamp
        });
      }
      function generateDocument(category, targetType, targetId, title) {
        const template = activeTemplate(category);
        if (!template) {
          alert(`${category} 문서용 활성 템플릿이 없습니다. 템플릿을 먼저 등록하세요.`);
          return false;
        }
        state.data.generatedDocuments = state.data.generatedDocuments || [];
        state.data.generatedDocuments.unshift({
          id: "doc-" + Date.now(),
          templateId: template.id,
          category,
          targetType,
          targetId,
          title,
          generatedAt: nowStamp(),
          status: "generated"
        });
        appendAuditLog("운영자", `${category} 문서 생성`, title);
        return true;
      }
      function badge(status) {
        const map = {
          approved: ["승인", "ok"],
          assigned: ["배정", "neutral"],
          active: ["운영중", "ok"],
          finalized: ["확정", "ok"],
          closed: ["마감", "ok"],
          posted: ["게시중", "brand"],
          planning: ["계획", "neutral"],
          draft: ["작성중", "neutral"],
          hired: ["최종합격", "ok"],
          open: ["진행중", "brand"],
          ongoing: ["진행중", "brand"],
          simulated: ["시뮬레이션", "warn"],
          calculated: ["계산완료", "brand"],
          verified: ["검증완료", "brand"],
          submitted: ["승인대기", "warn"],
          imported: ["반영완료", "neutral"],
          docs_pending: ["서류대기", "warn"],
          offboarding: ["오프보딩", "warn"],
          failed: ["실패", "danger"],
          rejected: ["반려", "danger"],
          pending: ["승인대기", "warn"],
          generated: ["생성완료", "ok"],
          resolved: ["해소", "ok"],
          eligible: ["후보", "ok"],
          review_needed: ["검토필요", "warn"],
          in_review: ["검토중", "warn"]
        };
        const item = map[status] || [status, "neutral"];
        return `<span class="badge ${item[1]}">${item[0]}</span>`;
      }

      function exportData() {
        downloadAsJson(`hr-one-suite-${new Date().toISOString().slice(0, 10)}`, state.data);
      }
      async function resetAllData() {
        if (!window.confirm("클라우드에 저장된 전체 데이터를 삭제하고 빈 상태로 초기화하시겠습니까?")) return;
        const nextData = normalizeData(createSeedData(SCHEMA_VERSION));
        state.data = nextData;
        state.selectedEmployeeId = null;
        state.selectedResignationId = null;
        state.selectedPayrollPeriodId = null;
        state.selectedPayrollRuleId = null;
        state.selectedOrgId = null;
        state.selectedPostingId = null;
        state.selectedCandidateId = null;
        state.selectedOnboardingId = null;
        state.selectedEvaluationCycleId = null;
        state.selectedCompensationPlanId = null;
        state.selectedCourseId = null;
        state.selectedHrActionId = null;
        state.peopleFilters = { query: "", orgId: "", employmentType: "", status: "" };
        state.peopleDashboardFilters = { grade: "", tenureBand: "", leaderOnly: "", siteCompare: "current" };
        state.recruitmentFilters = { query: "", orgId: "", status: "" };
        setSection("admin", "data");
        appendAuditLog("운영자", "전체 데이터 삭제", "클라우드 워크스페이스");
        if (firebaseServices.enabled && state.authUser) {
          await firebaseServices.db.ref(CLOUD_DATA_PATH).set(state.data);
        } else {
          saveData();
        }
        render();
      }
      function exportCsv(filename, columns, rows) {
        downloadAsCsv(`${filename}-${new Date().toISOString().slice(0, 10)}`, columns, rows);
      }
      function exportByType(type) {
        return appDataExportByType({
          type,
          exportCsv,
          filteredRecruitmentRequests,
          orgName,
          postingStatusLabel,
          filteredVisibleEmployees,
          visibleOrgs,
          normalizedOrg,
          employeeName,
          leaveBalanceRows,
          payrollPeriods: state.data.payrollPeriods,
          normalizedPayrollPeriod,
          visibleResignations,
          normalizedResignation
        });
      }
      function sectionSubItems(section = state.section) {
        return SUBSECTION_ITEMS[section] || [];
      }
      function ensureValidSubSection(section = state.section) {
        const items = sectionSubItems(section);
        if (!items.length) {
          state.subSection = "";
          return;
        }
        if (!items.some((item) => item.id === state.subSection)) {
          state.subSection = items[0].id;
        }
      }
      function setSection(section, subSection = null) {
        if (!NAV_ITEMS.some((item) => item.id === section)) {
          state.section = "dashboard";
          state.subSection = sectionSubItems("dashboard")[0]?.id || "";
          return;
        }
        state.section = section;
        const items = sectionSubItems(section);
        if (!items.length) {
          state.subSection = "";
          return;
        }
        state.subSection = items.some((item) => item.id === subSection) ? subSection : items[0].id;
      }

      function renderNav() {
        el("navMenu").innerHTML = NAV_ITEMS.filter((item) => permissions.canAccessSection(item.id)).map((item) => `
          <div class="nav-group">
            <button class="${item.id === state.section ? "active" : ""}" data-nav="${item.id}">${item.label}</button>
            ${item.id === state.section && sectionSubItems(item.id).length ? `
              <div class="nav-submenu">
                ${sectionSubItems(item.id).map((subItem) => `
                  <button class="${subItem.id === state.subSection ? "active" : ""}" data-subnav="${subItem.id}" data-nav-parent="${item.id}">${subItem.label}</button>
                `).join("")}
              </div>
            ` : ""}
          </div>
        `).join("");
        el("navMenu").querySelectorAll("[data-nav]").forEach((button) => {
          button.onclick = () => {
            setSection(button.dataset.nav);
            render();
            window.scrollTo({ top: 0, behavior: "smooth" });
          };
        });
        el("navMenu").querySelectorAll("[data-subnav]").forEach((button) => {
          button.onclick = () => {
            setSection(button.dataset.navParent, button.dataset.subnav);
            render();
          };
        });
      }

      function renderScope() {
        const entity = currentEntity();
        const site = currentSite();
        const user = currentUser();
        const openApprovals =
          pendingApprovals().length;
        el("scopeCard").innerHTML = `
          <div><strong>${state.data.tenant.companyName}</strong><span>${state.data.tenant.scale}</span></div>
          <div><strong>법인</strong><span>${entity.name}</span></div>
          <div><strong>사업장</strong><span>${site.name}</span></div>
          <div><strong>사용자</strong><span>${user?.name || "-"} · ${user?.role || "-"}</span></div>
          <div><strong>승인 대기</strong><span>${openApprovals}건</span></div>
        `;
      }

      function renderSection() {
        if (!NAV_ITEMS.some((item) => item.id === state.section)) {
          setSection("dashboard");
        }
        if (!permissions.canAccessSection(state.section)) {
          return `
            <section class="card">
              <h3>접근 권한 없음</h3>
              <div class="empty">현재 사용자 권한으로는 이 메뉴에 접근할 수 없습니다.</div>
            </section>
          `;
        }
        switch (state.section) {
          case "dashboard": return renderDashboardPage({
            state, kpis, visibleApplicants, visibleAttendanceClosures, visibleResignations,
            visibleEmployees, leaveBalanceRows, withinDays, defaultEmployeeFields,
            postingStatusLabel, visibleRecruitmentRequests, requestCandidates,
            visibleOrgs, visibleCourses, visiblePromotionCandidates, pendingApprovals, labelStage, labelCode
          });
          case "recruitment": return renderRecruitmentPage({
            state, filteredRecruitmentRequests, byId, requestCandidates, candidateStageHistory,
            candidateAttachments, entityChangeHistory, visibleApplicants, visibleOrgs,
            orgName, postingStatusLabel, badge, labelStage, labelCode
          });
          case "onboarding": return renderOnboardingPage({
            state, visibleOnboarding, orgName, badge, visibleOrgs, money
          });
          case "people": return renderPeoplePage({
            state, filteredVisibleEmployees, visibleHrActions, defaultEmployeeFields,
            byId, employeeAttachments, employeeChangeHistory, visibleOrgs, orgName,
            badge, employeeName, permissions, ageFromResidentNumber,
            birthDateFromResidentNumber, koreanAgeFromResidentNumber, maskResidentNumber,
            tenureYears
          });
          case "org": return renderOrgPage({
            state, visibleOrgs, normalizedOrg, entityChangeHistory, currentSite,
            visibleEmployees, orgName, employeeName, badge, labelCode, workflowSnapshot
          });
          case "attendance": return renderAttendancePage({
            state, leaveBalanceRows, visibleLeaveRequests, visibleAttendanceClosures,
            orgName, employeeName, badge, labelCode
          });
          case "learning": return renderLearningPage({
            state, visibleCourses, badge, employeeName, labelCode
          });
          case "review": return renderReviewPage({
            state, visibleEvaluationAppeals, visibleCalibrations, byId, employeeName, orgName, badge, visibleEmployees, money,
            visibleOrgs, visibleCourses, visiblePromotionCandidates, labelCode, workflowSnapshot
          });
          case "compensation": return renderCompensationPage({
            state, byId, money, badge, visibleEmployees, workflowSnapshot
          });
          case "payroll": return renderPayrollPage({
            state, visiblePayrollAnomalies, normalizedPayrollPeriod, normalizedPayrollRule,
            payrollAuditLogs, entityChangeHistory, money, badge, byId, employeeName, labelCode, permissions, visibleEmployees, workflowSnapshot
          });
          case "movement": return renderMovementPage({
            state, visibleHrActions, visiblePromotionCandidates, employeeName, orgName, badge, labelCode
          });
          case "exit": return renderExitPage({
            state, visibleResignations, normalizedResignation, entityChangeHistory,
            byId, employeeName, resignationChecklistProgress, badge, labelCode
          });
          case "admin": return renderAdminPage({
            state, badge, pendingApprovals, byId, labelCode
          });
          default: return renderDashboardPage({
            state, kpis, visibleApplicants, visibleAttendanceClosures, visibleResignations,
            visibleEmployees, leaveBalanceRows, withinDays, defaultEmployeeFields,
            postingStatusLabel, visibleRecruitmentRequests, requestCandidates,
            visibleOrgs, visibleCourses, visiblePromotionCandidates, pendingApprovals
          });
        }
      }

      function setSectionMeta() {
        if (!NAV_ITEMS.some((item) => item.id === state.section)) {
          setSection("dashboard");
        }
        ensureValidSubSection();
        const meta = SUBSECTION_META[state.section]?.[state.subSection] || SECTION_META[state.section];
        const readOnlyPrimary = (
          state.section === "dashboard" ||
          (state.section === "recruitment" && state.subSection === "report") ||
          (state.section === "admin" && state.subSection === "audit") ||
          (state.section === "movement" && state.subSection === "document")
        );
        el("pageTitle").textContent = meta.title;
        el("pageDescription").textContent = meta.description;
        el("primaryActionButton").textContent = meta.action;
        el("primaryActionButton").disabled = readOnlyPrimary ? false : !permissions.canCreate(state.section);
        el("siteSwitchButton").textContent = `사업장: ${currentSite().name}`;
        el("entitySwitchButton").textContent = `법인: ${currentEntity().name}`;
        const authLabel = state.authUser?.email ? `${state.authUser.email}` : currentUser().name;
        el("userSwitchButton").textContent = `로그아웃: ${authLabel} (${currentUser().role})`;
      }

      function render() {
        if (!state.authUser) return;
        syncApprovalQueue();
        setSectionMeta();
        renderNav();
        renderScope();
        try {
          el("appContent").innerHTML = renderSection();
        } catch (error) {
          console.error("Section render failed", state.section, state.subSection, error);
          el("appContent").innerHTML = `
            <section class="card">
              <h3>화면 렌더 오류</h3>
              <div class="empty">
                ${SECTION_META[state.section]?.title || state.section} / ${SUBSECTION_META[state.section]?.[state.subSection]?.title || state.subSection || "-"} 화면을 불러오는 중 오류가 발생했습니다.
                <br /><br />
                오류 메시지: ${(error && error.message) ? String(error.message) : "알 수 없는 오류"}
              </div>
            </section>
          `;
        }
        bindSectionEvents();
      }

      function setAppVisibility(isVisible) {
        el("appShell").classList.toggle("hidden", !isVisible);
      }

      function renderAuthGate(mode = "signin") {
        const root = el("authRoot");
        const rememberedEmail = window.localStorage.getItem(REMEMBER_EMAIL_KEY) || "";
        if (state.authUser) {
          root.innerHTML = "";
          root.classList.add("hidden");
          setAppVisibility(true);
          return;
        }
        root.classList.remove("hidden");
        setAppVisibility(false);
        root.innerHTML = `
          <div class="auth-shell">
            <section class="auth-layout">
              <article class="auth-brand-panel">
                <span class="auth-kicker">HR OneFlow</span>
                <h1>인사 운영을 한 화면에서 정리하는 업무 허브</h1>
                <p>채용, 인사기본, 교육, 평가, 보상, 급여, 퇴직 흐름을 일관된 데이터 기준으로 관리합니다.</p>
                <div class="auth-feature-list">
                  <div class="auth-feature">
                    <strong>Employee Lifecycle</strong>
                    <span>채용부터 퇴직까지 연결된 운영 흐름</span>
                  </div>
                  <div class="auth-feature">
                    <strong>Operational Records</strong>
                    <span>변경 이력, 문서, 정산 기준을 한 곳에서 관리</span>
                  </div>
                  <div class="auth-feature">
                    <strong>Cloud Workspace</strong>
                    <span>어느 브라우저에서든 같은 데이터 기준으로 이어서 작업</span>
                  </div>
                </div>
              </article>
              <article class="auth-card">
                <div class="auth-card-header">
                  <span class="auth-badge">${mode === "signup" ? "Create Access" : "Secure Sign In"}</span>
                  <h2>인사 통합관리 시스템</h2>
                  <p>${mode === "signup" ? "운영 계정을 생성해 업무 공간을 시작합니다." : "등록된 계정으로 로그인해 업무 공간에 접근합니다."}</p>
                </div>
                <form class="auth-form" id="authForm" data-mode="${mode}">
                  <label class="auth-field">
                    <span>이메일</span>
                    <input type="email" name="email" placeholder="name@company.com" value="${rememberedEmail}" required />
                  </label>
                  <label class="auth-field">
                    <span>비밀번호</span>
                    <input type="password" name="password" placeholder="비밀번호" required />
                  </label>
                  <label class="auth-check">
                    <input type="checkbox" name="rememberEmail" ${rememberedEmail ? "checked" : ""} />
                    <span>아이디 저장</span>
                  </label>
                  <div class="auth-actions">
                    <button type="submit" class="button">${mode === "signup" ? "계정 생성" : "로그인"}</button>
                    <button type="button" class="button-secondary" id="toggleAuthModeButton">${mode === "signup" ? "기존 계정 로그인" : "새 계정 만들기"}</button>
                  </div>
                </form>
                ${state.authError ? `<div class="auth-error">${state.authError}</div>` : ""}
              </article>
            </section>
          </div>
        `;
        el("authForm")?.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (!firebaseServices.enabled) {
            state.authError = "Firebase SDK를 불러오지 못했습니다.";
            renderAuthGate(mode);
            return;
          }
          const formData = Object.fromEntries(new FormData(event.target).entries());
          state.authError = "";
          if (formData.rememberEmail) window.localStorage.setItem(REMEMBER_EMAIL_KEY, formData.email);
          else window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
          try {
            await ensureSessionPersistence(firebaseServices.auth);
            if (mode === "signup") {
              await firebaseServices.auth.createUserWithEmailAndPassword(formData.email, formData.password);
            } else {
              await firebaseServices.auth.signInWithEmailAndPassword(formData.email, formData.password);
            }
          } catch (error) {
            state.authError = error.message || "로그인에 실패했습니다.";
            renderAuthGate(mode);
          }
        });
        el("toggleAuthModeButton")?.addEventListener("click", () => {
          state.authError = "";
          renderAuthGate(mode === "signup" ? "signin" : "signup");
        });
      }

      function subscribeCloudData() {
        if (!firebaseServices.enabled || !state.authUser) return;
        if (dataRef && dataListener) dataRef.off("value", dataListener);
        dataRef = firebaseServices.db.ref(CLOUD_DATA_PATH);
        dataListener = (snapshot) => {
          if (!snapshot.exists()) return;
          state.data = normalizeData(snapshot.val());
          syncCurrentUserIdFromAuth();
          saveLocalBackup();
          render();
        };
        dataRef.on("value", dataListener);
      }

      const dialogHelpers = createDialogHelpers({
        state,
        el,
        byId,
        nowStamp,
        defaultEmployeeFields,
        normalizedOrg,
        normalizedPayrollPeriod,
        normalizedPayrollRule,
        normalizedResignation,
        labelCode,
        labelStage,
        normalizeResidentNumber,
        validateResidentNumber,
        currentEntity,
        visibleOrgs,
        visibleEmployees,
        visibleRecruitmentRequests,
        currentSite,
        employeeName,
        orgName,
        applyFieldChanges,
        appendAuditLog,
        saveData,
        render
      });
      const { openModal, openSectionForm, openDialogByType } = dialogHelpers;

      function bindSectionEvents() {
        sectionBindEvents({
          state,
          el,
          byId,
          nowStamp,
          defaultEmployeeFields,
          normalizedOrg,
          normalizedPayrollPeriod,
          normalizedPayrollRule,
          normalizedResignation,
          resignationChecklistProgress,
          visibleEmployees,
          filteredVisibleEmployees,
          requestCandidates,
          applyFieldChanges,
          appendAuditLog,
          employeeName,
          permissions,
          resetAllData,
          saveData,
          render,
          setSection,
          openSectionForm,
          openDialogByType,
          exportByType,
          exportData,
          downloadAsCsv,
          generateDocument,
          openModal,
          openPrintWindow,
          downloadAttachmentSummary,
          ageFromResidentNumber,
          birthDateFromResidentNumber,
          koreanAgeFromResidentNumber,
          maskResidentNumber,
          normalizeResidentNumber,
          validateResidentNumber,
          orgName,
          money,
          labelStage,
          labelCode
        });
      }

      function bindGlobalEvents() {
        el("userSwitchButton").onclick = async () => {
          if (!firebaseServices.enabled) return;
          await firebaseServices.auth.signOut();
        };
        el("entitySwitchButton").onclick = () => {
          if (!state.data.entities.length) return;
          const currentIndex = state.data.entities.findIndex((item) => item.id === state.entityId);
          const next = state.data.entities[(currentIndex + 1) % state.data.entities.length];
          state.entityId = next.id;
          const entitySites = state.data.sites.filter((item) => item.entityId === next.id);
          if (!entitySites.some((item) => item.id === state.siteId)) {
            state.siteId = entitySites[0]?.id || state.data.sites[0]?.id || "";
          }
          render();
        };
        el("siteSwitchButton").onclick = () => {
          if (!state.data.sites.length) return;
          const entitySites = state.data.sites.filter((item) => item.entityId === state.entityId);
          const sitePool = entitySites.length ? entitySites : state.data.sites;
          const currentIndex = sitePool.findIndex((item) => item.id === state.siteId);
          const next = sitePool[(currentIndex + 1) % sitePool.length];
          state.siteId = next.id;
          render();
        };
      }
      bindGlobalEvents();
      renderAuthGate();
      if (!firebaseServices.enabled) {
        state.authError = "Firebase SDK가 로드되지 않아 로그인 기능을 사용할 수 없습니다.";
        renderAuthGate();
      } else {
        ensureSessionPersistence(firebaseServices.auth).catch((error) => {
          console.warn("Firebase auth session persistence setup failed.", error);
        });
        firebaseServices.auth.onAuthStateChanged(async (user) => {
          state.authUser = user;
          state.authReady = true;
          state.authError = "";
          if (!user) {
            if (dataRef && dataListener) dataRef.off("value", dataListener);
            state.data = createSeedData(SCHEMA_VERSION);
            renderAuthGate();
            return;
          }
          await loadData();
          ensureValidSubSection();
          syncApprovalQueue();
          subscribeCloudData();
          renderAuthGate();
          render();
        });
      }
