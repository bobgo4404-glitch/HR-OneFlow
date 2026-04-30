(() => {
  "use strict";

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

  const APP_ROOT = "hrOperations/live";
  const SCHEMA_VERSION = 1;
  const DEFAULT_PAGE_SIZE = 12;
  const DENSE_PAGE_SIZE = 15;
  const BOOTSTRAP_ADMIN_EMAILS = ["jiwon2@yujintechnology.com"];

  const ROLE_LABELS = [
    "시스템 관리자",
    "HR 관리자",
    "평가 담당자",
    "보상 담당자",
    "조직장",
    "구성원"
  ];

  const NAV_ITEMS = [
    { id: "dashboard", label: "대시보드", tabs: [{ id: "overview", label: "전체 현황" }] },
    { id: "orgs", label: "조직", tabs: [{ id: "structure", label: "조직 현황" }, { id: "people", label: "구성원" }, { id: "roles", label: "역할/권한" }] },
    { id: "reviews", label: "평가", tabs: [{ id: "cycles", label: "평가 사이클" }, { id: "criteria", label: "기준 설정" }, { id: "results", label: "결과 현황" }, { id: "calibration", label: "등급 보정" }] },
    { id: "compensation", label: "보상", tabs: [{ id: "plans", label: "보상안" }, { id: "rules", label: "보상 기준" }, { id: "items", label: "대상자 조정" }, { id: "salary", label: "연봉 기초정보" }, { id: "budget", label: "예산 분석" }] },
    { id: "stats", label: "통계", tabs: [{ id: "overview", label: "종합" }, { id: "demographics", label: "기초 통계" }, { id: "organization", label: "조직 통계" }, { id: "review", label: "평가 통계" }, { id: "compensation", label: "보상 통계" }, { id: "certificates", label: "증명서 통계" }] },
    { id: "certificates", label: "증명서", tabs: [{ id: "issued", label: "발급 이력" }, { id: "templates", label: "템플릿" }] },
    { id: "admin", label: "관리자", tabs: [{ id: "users", label: "사용자/권한" }, { id: "audit", label: "감사로그" }, { id: "system", label: "시스템" }] }
  ];

  const SECTION_META = {
    dashboard: { title: "대시보드", description: "조직, 평가, 보상, 증명서 운영 지표를 한눈에 확인합니다.", action: "구성원 등록" },
    orgs: { title: "조직", description: "조직 구조, 구성원 배치, 역할과 권한을 관리합니다.", action: "조직 등록" },
    reviews: { title: "평가", description: "평가 사이클, 평가 기준, 결과 분포와 등급 보정을 운영합니다.", action: "평가 사이클" },
    compensation: { title: "보상", description: "평가등급별 보상 기준, 보상안, 연봉 기초정보와 예산을 관리합니다.", action: "보상안 등록" },
    stats: { title: "통계", description: "인력 기초정보, 평가, 보상 데이터를 운영 지표로 분석합니다.", action: "통계 내보내기" },
    certificates: { title: "증명서", description: "인사담당자가 재직증명서, 경력증명서 등 공식 문서를 직접 발급하고 이력을 관리합니다.", action: "증명서 발급" },
    admin: { title: "관리자", description: "사용자 권한, 운영 설정, 감사로그, 데이터 백업을 관리합니다.", action: "데이터 백업" }
  };

  const state = {
    authUser: null,
    profile: null,
    data: emptyData(),
    section: "dashboard",
    tab: "overview",
    selectedEmployeeId: "",
    filters: {
      employeeQuery: "",
      employeeStatus: "",
      employeeOrg: "",
      employeeGrade: "",
      employeeType: "",
      reviewQuery: "",
      reviewCycle: "",
      reviewGrade: "",
      reviewStatus: "",
      compQuery: "",
      compPlan: "",
      compStatus: "",
      certificateQuery: "",
      certificateType: "",
      certificateFrom: "",
      certificateTo: "",
      auditQuery: ""
    },
    pagination: {},
    listeners: [],
    isBooting: false
  };

  const els = {
    authRoot: byId("authRoot"),
    appShell: byId("appShell"),
    navMenu: byId("navMenu"),
    workspaceCard: byId("workspaceCard"),
    pageBreadcrumb: byId("pageBreadcrumb"),
    pageTitle: byId("pageTitle"),
    pageDescription: byId("pageDescription"),
    tabBar: byId("tabBar"),
    appContent: byId("appContent"),
    userMenuButton: byId("userMenuButton"),
    exportButton: byId("exportButton"),
    primaryActionButton: byId("primaryActionButton"),
    modalRoot: byId("modalRoot"),
    toastRoot: byId("toastRoot")
  };

  const firebaseServices = initFirebase();

  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleInput);

  bootAuth();

  function byId(id) {
    return document.getElementById(id);
  }

  function initFirebase() {
    if (!window.firebase) return { enabled: false };
    const app = window.firebase.apps?.length ? window.firebase.app() : window.firebase.initializeApp(FIREBASE_CONFIG);
    return {
      enabled: true,
      app,
      auth: window.firebase.auth(app),
      db: window.firebase.database(app)
    };
  }

  function bootAuth() {
    renderAuth();
    if (!firebaseServices.enabled) {
      renderAuth("Firebase SDK를 불러오지 못했습니다. 배포 환경과 네트워크를 확인하세요.");
      return;
    }
    firebaseServices.auth.setPersistence?.(window.firebase.auth.Auth.Persistence.SESSION).catch(() => {});
    firebaseServices.auth.onAuthStateChanged(async (user) => {
      state.authUser = user;
      detachListeners();
      if (!user) {
        state.profile = null;
        state.data = emptyData();
        renderAuth();
        return;
      }
      try {
        state.isBooting = true;
        showShellLoading();
        await ensureProfile();
        await ensureWorkspace();
        await ensureOperationalDefaults();
        await loadPermittedData();
        subscribePermittedData();
        state.isBooting = false;
        render();
      } catch (error) {
        state.isBooting = false;
        console.error(error);
        renderAuth(formatBootError(error));
      }
    });
  }

  function formatBootError(error) {
    const message = String(error?.message || error || "");
    if (/permission.?denied/i.test(message)) {
      return "초기화 중 오류가 발생했습니다: Firebase Realtime Database 권한이 거부되었습니다. Firebase 콘솔에서 이 폴더의 database.rules.json 내용을 Realtime Database Rules에 반영한 뒤 다시 로그인하세요.";
    }
    return `초기화 중 오류가 발생했습니다: ${message}`;
  }

  function dbPath(path = "") {
    return path ? `${APP_ROOT}/${path}` : APP_ROOT;
  }

  async function ensureWorkspace() {
    const metaRef = firebaseServices.db.ref(dbPath("meta"));
    const metaSnap = await metaRef.get();
    if (metaSnap.exists()) return;
    const seed = createSeedData();
    seed.meta.initializedBy = state.authUser.email || state.authUser.uid;
    const updates = {};
    Object.entries(seed).forEach(([key, value]) => {
      if (key !== "profiles") updates[key] = value;
    });
    await firebaseServices.db.ref(dbPath()).update(updates);
  }

  async function ensureOperationalDefaults() {
    if (!canAdmin()) return;
    const now = nowStamp();
    const [settingsSnap, templatesSnap, metaSnap] = await Promise.all([
      firebaseServices.db.ref(dbPath("settings")).get(),
      firebaseServices.db.ref(dbPath("certificates/templates")).get(),
      firebaseServices.db.ref(dbPath("meta")).get()
    ]);
    const settings = settingsSnap.val() || {};
    const templates = templatesSnap.val() || {};
    const meta = metaSnap.val() || {};
    const updates = {};
    Object.assign(updates, legacySeedCleanupUpdates(meta));
    if (!Object.keys(settings.reviewCriteria || {}).length) updates["settings/reviewCriteria"] = defaultReviewCriteria(now);
    if (!Object.keys(settings.reviewGrades || {}).length) updates["settings/reviewGrades"] = defaultReviewGrades(now);
    if (!Object.keys(settings.compensationRules || {}).length) updates["settings/compensationRules"] = defaultCompensationRules(now);
    const defaultCodeValues = defaultCodes();
    Object.entries(defaultCodeValues).forEach(([key, values]) => {
      if (!Array.isArray(settings.codes?.[key]) || !settings.codes[key].length) updates[`settings/codes/${key}`] = values;
    });
    if (!Object.keys(templates || {}).length) {
      updates["certificates/templates"] = defaultCertificateTemplates(now);
    } else {
      const careerTemplate = templates["tmpl-002"];
      if (careerTemplate && (careerTemplate.type === "경력증명서" || careerTemplate.name === "경력증명서") && !String(careerTemplate.body || "").includes("담당 업무")) {
        updates["certificates/templates/tmpl-002"] = {
          ...careerTemplate,
          ...careerCertificateTemplate(now),
          id: careerTemplate.id || "tmpl-002",
          owner: careerTemplate.owner || "People팀",
          status: careerTemplate.status || "active",
          version: Math.max(Number(careerTemplate.version || 1), 2),
          previousVersion: Number(careerTemplate.version || 1),
          updatedAt: now
        };
      }
    }
    if (!meta.certificateNoPrefix) updates["meta/certificateNoPrefix"] = "CERT";
    if (!meta.certificateNoDigits) updates["meta/certificateNoDigits"] = 6;
    if (Object.keys(updates).length) {
      updates["meta/defaultsUpdatedAt"] = now;
      await firebaseServices.db.ref(dbPath()).update(updates);
    }
  }

  async function ensureProfile() {
    const uid = state.authUser.uid;
    const profileRef = firebaseServices.db.ref(dbPath(`profiles/${uid}`));
    const profileSnap = await profileRef.get();
    if (profileSnap.exists()) {
      const existing = profileSnap.val() || {};
      state.profile = {
        uid,
        email: existing.email || state.authUser.email || "",
        displayName: existing.displayName || state.authUser.email || "사용자",
        role: isBootstrapAdminEmail(state.authUser.email) ? "시스템 관리자" : existing.role || "구성원",
        employeeId: existing.employeeId || "",
        status: existing.status || "active",
        ...existing
      };
      if (isBootstrapAdminEmail(state.authUser.email) && existing.role !== "시스템 관리자") {
        await profileRef.update({
          role: "시스템 관리자",
          status: "active",
          updatedAt: nowStamp()
        });
        state.profile.role = "시스템 관리자";
        state.profile.status = "active";
      }
      return;
    }

    let firstUser = false;
    try {
      const metaSnap = await firebaseServices.db.ref(dbPath("meta")).get();
      firstUser = !metaSnap.exists();
    } catch {
      firstUser = false;
    }

    let employees = [];
    try {
      const employeesSnap = await firebaseServices.db.ref(dbPath("employees")).get();
      employees = Object.values(employeesSnap.val() || {});
    } catch {
      employees = [];
    }
    const matchedEmployee = employees.find((item) => sameEmail(item.email, state.authUser.email));
    const profile = {
      uid,
      email: state.authUser.email || "",
      displayName: matchedEmployee?.name || state.authUser.email || "사용자",
      role: firstUser || isBootstrapAdminEmail(state.authUser.email) ? "시스템 관리자" : matchedEmployee?.role || "구성원",
      employeeId: matchedEmployee?.id || "",
      status: "active",
      createdAt: nowStamp(),
      updatedAt: nowStamp()
    };
    await profileRef.set(profile);
    state.profile = profile;
  }

  async function loadPermittedData() {
    const paths = permittedPaths();
    const pairs = await Promise.all(paths.map(async (path) => {
      const snap = await firebaseServices.db.ref(dbPath(path)).get();
      return [path, snap.val()];
    }));
    const next = emptyData();
    pairs.forEach(([path, value]) => assignPath(next, path, value || defaultPathValue(path)));
    state.data = normalizeData(next);
  }

  function subscribePermittedData() {
    detachListeners();
    permittedPaths().forEach((path) => {
      const ref = firebaseServices.db.ref(dbPath(path));
      const handler = (snapshot) => {
        assignPath(state.data, path, snapshot.val() || defaultPathValue(path));
        state.data = normalizeData(state.data);
        if (path === `profiles/${state.authUser.uid}`) {
          state.profile = { uid: state.authUser.uid, ...(snapshot.val() || {}) };
        }
        render();
      };
      ref.on("value", handler);
      state.listeners.push({ ref, handler });
    });
  }

  function detachListeners() {
    state.listeners.forEach(({ ref, handler }) => ref.off("value", handler));
    state.listeners = [];
  }

  function permittedPaths() {
    const paths = [
      "meta",
      "orgs",
      "employees",
      "reviews",
      "compensationPlans",
      "certificates",
      "approvals",
      "settings",
      `profiles/${state.authUser.uid}`
    ];
    if (canViewSalarySection()) paths.push("salaryBasics", "salaryHistory", "compensationItems");
    if (isAdminLike()) paths.push("profiles", "auditLogs");
    return [...new Set(paths)];
  }

  function defaultPathValue(path) {
    if (path === "meta") return {};
    if (path.includes("/")) return {};
    return {};
  }

  function assignPath(target, path, value) {
    const parts = path.split("/");
    let ref = target;
    parts.slice(0, -1).forEach((part) => {
      ref[part] = ref[part] || {};
      ref = ref[part];
    });
    ref[parts[parts.length - 1]] = value;
  }

  function emptyData() {
    return {
      meta: {},
      profiles: {},
      orgs: {},
      employees: {},
      reviews: { cycles: {}, results: {} },
      compensationPlans: {},
      compensationItems: {},
      certificates: { requests: {}, templates: {}, templateVersions: {}, issued: {} },
      salaryBasics: {},
      salaryHistory: {},
      approvals: {},
      auditLogs: {},
      settings: { roles: {}, codes: {}, reviewCriteria: {}, reviewGrades: {}, compensationRules: {} }
    };
  }

  function normalizeData(data) {
    const next = { ...emptyData(), ...(data || {}) };
    next.reviews = { cycles: {}, results: {}, ...(next.reviews || {}) };
    next.compensationItems = next.compensationItems || {};
    next.certificates = { requests: {}, templates: {}, templateVersions: {}, issued: {}, ...(next.certificates || {}) };
    next.settings = { roles: {}, codes: {}, reviewCriteria: {}, reviewGrades: {}, compensationRules: {}, ...(next.settings || {}) };
    next.settings.codes = { ...defaultCodes(), ...(next.settings.codes || {}) };
    next.settings.reviewCriteria = next.settings.reviewCriteria || {};
    next.settings.reviewGrades = next.settings.reviewGrades || {};
    next.settings.compensationRules = next.settings.compensationRules || {};
    next.profiles = next.profiles || {};
    if (state.authUser && next.profiles[state.authUser.uid]) {
      state.profile = { uid: state.authUser.uid, ...next.profiles[state.authUser.uid] };
    }
    return next;
  }

  function renderAuth(error = "") {
    els.appShell.classList.add("hidden");
    els.authRoot.classList.remove("hidden");
    els.authRoot.innerHTML = `
      <section class="auth-shell">
        <div class="auth-card">
          <div class="auth-copy">
            <div class="login-brand">
              <span>HR OneFlow</span>
            </div>
            <div class="login-title">
              <span class="auth-kicker">SECURE WORKSPACE</span>
              <strong>인사 운영 시스템</strong>
              <p>권한이 부여된 계정으로 로그인하세요.</p>
            </div>
          </div>
          <form class="auth-form" id="authForm">
            <div class="auth-form-head">
              <span>LOGIN</span>
              <h1>로그인</h1>
              <p>Firebase 계정으로 접속합니다.</p>
            </div>
            <label class="field">
              <span>이메일</span>
              <input name="email" type="email" autocomplete="email" required />
            </label>
            <label class="field">
              <span>비밀번호</span>
              <input name="password" type="password" autocomplete="current-password" required minlength="6" />
            </label>
            <div class="row-actions">
              <button class="button primary" type="submit" data-auth-mode="signin">로그인</button>
              <button class="button" type="submit" data-auth-mode="signup">계정 생성</button>
            </div>
            ${error ? `<div class="notice">${escapeHtml(error)}</div>` : ""}
          </form>
        </div>
      </section>
    `;
    byId("authForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitter = event.submitter;
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      try {
        if (submitter?.dataset.authMode === "signup") {
          await firebaseServices.auth.createUserWithEmailAndPassword(values.email, values.password);
        } else {
          await firebaseServices.auth.signInWithEmailAndPassword(values.email, values.password);
        }
      } catch (authError) {
        renderAuth(authError.message || "로그인에 실패했습니다.");
      }
    });
  }

  function showShellLoading() {
    els.authRoot.classList.add("hidden");
    els.appShell.classList.remove("hidden");
    els.appContent.innerHTML = `<div class="empty">Firebase 데이터를 불러오는 중입니다.</div>`;
  }

  function render() {
    if (!state.authUser || state.isBooting) return;
    ensureValidRoute();
    els.authRoot.classList.add("hidden");
    els.appShell.classList.remove("hidden");
    renderWorkspace();
    renderNav();
    renderHeader();
    renderTabs();
    els.appContent.innerHTML = renderSection();
    hydrateResponsiveTables();
  }

  function hydrateResponsiveTables() {
    els.appContent.querySelectorAll("table").forEach((table) => {
      const headers = Array.from(table.querySelectorAll("thead th")).map((item) => item.textContent.trim());
      table.querySelectorAll("tbody tr").forEach((row) => {
        Array.from(row.children).forEach((cell, index) => {
          if (cell.tagName !== "TD" || cell.hasAttribute("data-label")) return;
          cell.dataset.label = headers[index] || "";
        });
      });
    });
  }

  function renderWorkspace() {
    if (!els.workspaceCard) return;
    const meta = state.data.meta || {};
    els.workspaceCard.innerHTML = `
      <div><strong>${escapeHtml(meta.companyName || "회사 미설정")}</strong><span>${escapeHtml(meta.environment || "운영")}</span></div>
      <div><strong>${escapeHtml(currentProfile().displayName || "-")}</strong><span>${escapeHtml(currentRole())}</span></div>
      <div><strong>DB 경로</strong><span>${APP_ROOT}</span></div>
    `;
  }

  function renderNav() {
    els.navMenu.innerHTML = NAV_ITEMS
      .filter((item) => canAccessSection(item.id))
      .map((item) => `<button type="button" class="${item.id === state.section ? "active" : ""}" data-nav="${item.id}">${item.label}</button>`)
      .join("");
  }

  function renderHeader() {
    const meta = SECTION_META[state.section] || SECTION_META.dashboard;
    const tab = currentTabs().find((item) => item.id === state.tab);
    els.pageBreadcrumb.textContent = `${meta.title}${tab ? ` / ${tab.label}` : ""}`;
    els.pageTitle.textContent = tab?.label || meta.title;
    els.pageDescription.textContent = meta.description;
    els.primaryActionButton.textContent = primaryActionLabel();
    els.primaryActionButton.disabled = !primaryActionAllowed();
    els.exportButton.disabled = !canExport();
    const label = `${currentProfile().displayName || state.authUser.email} · ${currentRole()}`;
    els.userMenuButton.textContent = "로그아웃";
    els.userMenuButton.title = label;
  }

  function renderTabs() {
    els.tabBar.innerHTML = currentTabs()
      .map((tab) => `<button type="button" class="${tab.id === state.tab ? "active" : ""}" data-tab="${tab.id}">${tab.label}</button>`)
      .join("");
  }

  function renderSection() {
    if (!canAccessSection(state.section)) {
      return `<div class="empty">현재 권한으로 접근할 수 없는 메뉴입니다.</div>`;
    }
    switch (state.section) {
      case "orgs": return renderOrgs();
      case "reviews": return renderReviews();
      case "compensation": return renderCompensation();
      case "stats": return renderStats();
      case "certificates": return renderCertificates();
      case "admin": return renderAdmin();
      default: return renderDashboard();
    }
  }

  function renderDashboard() {
    const employees = visibleEmployees();
    const activeEmployees = employees.filter((item) => item.status === "재직");
    const orgs = list(state.data.orgs);
    const reviewCycles = list(state.data.reviews.cycles);
    const activeReview = reviewCycles[0];
    const compPlans = list(state.data.compensationPlans);
    const certificateIssued = list(state.data.certificates.issued).sort((a, b) => String(b.issuedAt || b.id).localeCompare(String(a.issuedAt || a.id)));
    const currentMonth = monthLabel(nowStamp());
    const certificateIssuedThisMonth = certificateIssued.filter((item) => monthLabel(item.issuedAt) === currentMonth);
    const salaryRows = list(state.data.salaryBasics).filter((item) => employees.some((employee) => employee.id === item.employeeId));
    const salaryValues = salaryRows.map((item) => Number(item.annualSalary || 0)).filter(Boolean);
    const salaryCount = salaryValues.length;
    const salaryAverage = salaryValues.length ? Math.round(salaryValues.reduce((sum, value) => sum + value, 0) / salaryValues.length) : 0;
    const salaryCoverage = activeEmployees.length ? Math.round((salaryCount / activeEmployees.length) * 100) : 0;
    const totalCompBudget = compPlans.reduce((sum, item) => sum + Number(item.budget || 0), 0);
    const logs = latestAudit(6);
    const orgRows = orgs.map((org) => ({
      label: org.name,
      count: activeEmployees.filter((employee) => employee.orgId === org.id).length
    })).filter((item) => item.count > 0);
    const statusRows = ["재직", "휴직", "퇴직"].map((status) => ({
      label: status,
      count: employees.filter((item) => item.status === status).length
    }));
    const reviewProgressRows = reviewCycles.slice(0, 4).map((cycle) => ({ label: cycle.title, count: Number(cycle.progress || 0) }));
    const salaryBands = [
      { label: "5천 미만", count: salaryValues.filter((value) => value < 5000).length },
      { label: "5천~7천", count: salaryValues.filter((value) => value >= 5000 && value < 7000).length },
      { label: "7천 이상", count: salaryValues.filter((value) => value >= 7000).length }
    ];
    const riskItems = [
      { title: "평가 미확정", value: `${reviewCycles.filter((item) => item.status !== "confirmed").length}건`, level: reviewCycles.some((item) => item.status !== "confirmed") ? "warn" : "ok", note: "사이클 확정 필요" },
      { title: "보상안 검토", value: `${compPlans.filter((item) => item.status !== "closed").length}건`, level: compPlans.some((item) => item.status !== "closed") ? "warn" : "ok", note: "예산/대상 검토" },
      { title: "이번달 증명서", value: `${certificateIssuedThisMonth.length}건`, level: "ok", note: "직접 발급 이력" },
      { title: "연봉정보 미등록", value: canViewSalarySection() ? `${Math.max(0, activeEmployees.length - salaryCount)}명` : "권한 필요", level: canViewSalarySection() && activeEmployees.length - salaryCount ? "danger" : "ok", note: "재직자 기준" }
    ];
    return `
      <section class="grid four">
        ${stat("조직 수", `${orgs.length}개`, `재직 ${activeEmployees.length}명`)}
        ${stat("평가 진행률", `${Number(activeReview?.progress || 0)}%`, activeReview?.title || "평가 사이클 없음")}
        ${stat("보상 예산", `${money(totalCompBudget)}원`, `${compPlans.length}개 보상안`)}
        ${stat("연봉 등록률", canViewSalarySection() ? `${salaryCoverage}%` : "권한 필요", canViewSalarySection() ? `${salaryCount}/${activeEmployees.length}명 등록` : "보상/관리자 권한")}
      </section>

      <section class="dashboard-layout">
        <article class="panel chart-panel">
          <div class="panel-title">
            <div>
              <h2>인원 구성</h2>
              <p>재직 상태와 조직별 인원 분포입니다.</p>
            </div>
          </div>
          <div class="people-chart">
            ${donutChart(statusRows, employees.length)}
            <div class="chart-side">
              ${barList(orgRows, activeEmployees.length)}
            </div>
          </div>
        </article>

        <article class="panel chart-panel">
          <div class="panel-title">
            <div>
              <h2>평가 진행</h2>
              <p>평가 사이클별 진행률을 확인합니다.</p>
            </div>
            <button class="button link" data-nav="reviews">평가로 이동</button>
          </div>
          ${barList(reviewProgressRows, 100)}
        </article>
      </section>

      <section class="dashboard-layout">
        <article class="panel chart-panel">
          <div class="panel-title">
            <div>
              <h2>운영 리스크</h2>
              <p>오늘 우선 처리해야 할 항목입니다.</p>
            </div>
          </div>
          <div class="risk-grid">
            ${riskItems.map((item) => `
              <div class="risk-card ${item.level}">
                <span>${escapeHtml(item.title)}</span>
                <strong>${escapeHtml(item.value)}</strong>
                <small>${escapeHtml(item.note)}</small>
              </div>
            `).join("")}
          </div>
        </article>

        <article class="panel chart-panel">
          <div class="panel-title">
            <div>
              <h2>평가·보상 상태</h2>
              <p>평가 진행률과 보상안 예산입니다.</p>
            </div>
            <button class="button link" data-nav="compensation">보상으로 이동</button>
          </div>
          <div class="mini-metrics">
            <div>
              <span>평가 사이클</span>
              <strong>${escapeHtml(activeReview?.title || "미등록")}</strong>
              <div class="progress-track"><div class="progress-fill" style="width:${clamp(Number(activeReview?.progress || 0), 0, 100)}%"></div></div>
              <small>${Number(activeReview?.progress || 0)}% 진행</small>
            </div>
            <div>
              <span>보상안 예산</span>
              <strong>${money(totalCompBudget)}원</strong>
              <small>${compPlans.length}개 보상안 기준</small>
            </div>
            <div>
              <span>연봉 평균</span>
              <strong>${canViewSalarySection() ? `${money(salaryAverage)}만원` : "권한 필요"}</strong>
              <small>기초정보 등록자 기준</small>
            </div>
          </div>
        </article>
      </section>

      <section class="dashboard-layout">
        <article class="panel chart-panel">
          <div class="panel-title">
            <div>
              <h2>연봉 기초정보 분포</h2>
              <p>월 지급액 산정 없이 연봉 수준만 확인합니다.</p>
            </div>
            <button class="button link" data-nav="compensation">보상으로 이동</button>
          </div>
          ${canViewSalarySection() ? barList(salaryBands, Math.max(1, salaryCount)) : `<div class="empty">연봉 기초정보 접근 권한이 필요합니다.</div>`}
        </article>

        <article class="table-panel">
          <div class="toolbar">
            <h2>최근 증명서 발급</h2>
            <div class="filters"><button class="button" data-nav="certificates">증명서로 이동</button></div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>대상자</th><th>증명서</th><th>용도</th><th>발급일</th></tr></thead>
              <tbody>
                ${certificateIssued.slice(0, 6).map((item) => `
                  <tr>
                    <td>${employeeName(item.employeeId)}</td>
                    <td>${escapeHtml(item.type)}</td>
                    <td>${escapeHtml(item.purpose || "-")}</td>
                    <td>${formatDateTime(item.issuedAt)}</td>
                  </tr>
                `).join("")}
                ${!certificateIssued.length ? `<tr><td colspan="4"><div class="empty">아직 발급된 증명서가 없습니다.</div></td></tr>` : ""}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="grid two">
        <article class="panel">
          <div class="panel-title">
            <div>
              <h2>최근 감사로그</h2>
              <p>주요 데이터 변경 내역입니다.</p>
            </div>
          </div>
          <div class="timeline">
            ${logs.map((item) => timelineItem(item.action, `${item.actor} · ${item.target || "-"} · ${formatDateTime(item.at)}`)).join("") || `<div class="empty">감사로그가 없습니다.</div>`}
          </div>
        </article>
      </section>
    `;
  }

  function renderEmployees() {
    if (state.tab === "changes") return renderChangeLog("employee");
    const rows = filteredEmployees();
    const page = paginateRows("employees", rows);
    return `
      <section class="table-panel">
        <div class="toolbar">
          <h2>직원 목록</h2>
          <div class="filters">
            <input data-filter="employeeQuery" placeholder="성명, 이메일, 사번 검색" value="${escapeAttr(state.filters.employeeQuery)}" />
            <select data-filter="employeeOrg">
              ${option("", "전체 조직", state.filters.employeeOrg)}
              ${orgOptions().map((item) => option(item.value, item.label, state.filters.employeeOrg)).join("")}
            </select>
            <select data-filter="employeeGrade">
              ${option("", "전체 직급", state.filters.employeeGrade)}
              ${codeValues("grades").map((item) => option(item, item, state.filters.employeeGrade)).join("")}
            </select>
            <select data-filter="employeeType">
              ${option("", "전체 고용형태", state.filters.employeeType)}
              ${codeValues("employmentTypes").map((item) => option(item, item, state.filters.employeeType)).join("")}
            </select>
            <select data-filter="employeeStatus">
              ${option("", "전체 상태", state.filters.employeeStatus)}
              ${codeValues("employeeStatuses").map((item) => option(item, item, state.filters.employeeStatus)).join("")}
            </select>
            ${canWrite("employees") ? `
              <button class="button" data-action="download-employee-template">양식 다운로드</button>
              <button class="button" data-action="upload-employee-template">엑셀 업로드</button>
              <button class="button" data-action="bulk-employees">붙여넣기 등록</button>
            ` : ""}
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>사번</th><th>성명</th><th>조직</th><th>직무/직급</th><th>고용형태</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => `
                <tr>
                  <td>${escapeHtml(item.employeeNo || item.id)}</td>
                  <td><strong>${escapeHtml(item.name)}</strong><br /><small>${escapeHtml(item.email || "-")}</small></td>
                  <td>${orgName(item.orgId)}</td>
                  <td>${escapeHtml(item.jobTitle || "-")}<br /><small>${escapeHtml(item.grade || "-")}</small></td>
                  <td>${escapeHtml(item.employmentType || "-")}</td>
                  <td>${badge(item.status)}</td>
                  <td class="row-actions">
                    <button class="button" data-action="view-employee" data-id="${item.id}">상세</button>
                    ${canIssueCertificate() ? `<button class="button" data-action="issue-certificate-for-employee" data-employee-id="${item.id}">증명서 발급</button>` : ""}
                    ${canWrite("employees") ? `
                      <button class="button" data-action="edit-employee" data-id="${item.id}">수정</button>
                    ` : ""}
                    ${canDeleteEmployee() ? `<button class="button danger" data-action="delete-employee" data-id="${item.id}">삭제</button>` : ""}
                  </td>
                </tr>
              `).join("") || `<tr><td colspan="7"><div class="empty">직원이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
      ${renderEmployeeDetail()}
    `;
  }

  function renderEmployeeDetail() {
    const employee = state.selectedEmployeeId ? state.data.employees[state.selectedEmployeeId] : visibleEmployees()[0];
    if (!employee) return "";
    const salary = salaryForEmployee(employee.id);
    return `
      <section class="detail-panel">
        <div class="panel-title">
          <div>
            <h2>${escapeHtml(employee.name)} 상세</h2>
            <p>${escapeHtml(employee.email || "-")}</p>
          </div>
          <div class="row-actions">
            ${canIssueCertificate() ? `<button class="button" data-action="issue-certificate-for-employee" data-employee-id="${employee.id}">증명서 발급</button>` : ""}
            ${canViewSalary(employee.id) ? `<button class="button" data-action="edit-salary" data-employee-id="${employee.id}">연봉 기초정보</button>` : ""}
            ${canDeleteEmployee() ? `<button class="button danger" data-action="delete-employee" data-id="${employee.id}">삭제</button>` : ""}
          </div>
        </div>
        <div class="grid three">
          <div class="meta-list">
            ${meta("사번", employee.employeeNo || employee.id)}
            ${meta("조직", orgName(employee.orgId))}
            ${meta("직무", employee.jobTitle)}
            ${meta("직급", employee.grade)}
          </div>
          <div class="meta-list">
            ${meta("입사일", employee.hireDate)}
            ${meta("성별", employee.gender || "미입력")}
            ${meta("연령", employee.birthDate ? `${ageFromBirthDate(employee.birthDate)}세` : "미입력")}
            ${meta("고용형태", employee.employmentType)}
            ${meta("재직상태", employee.status)}
            ${meta("권한역할", employee.role)}
          </div>
          <div class="meta-list">
            ${meta("연봉정보", canViewSalary(employee.id) ? `${money(salary?.annualSalary || 0)}만원` : "비공개")}
            ${meta("적용일", canViewSalary(employee.id) ? salary?.effectiveDate || "-" : "비공개")}
            ${meta("보상등급", canViewSalary(employee.id) ? salary?.payGrade || "-" : "비공개")}
            ${meta("최종수정", formatDateTime(employee.updatedAt))}
          </div>
        </div>
      </section>
    `;
  }

  function renderOrgs() {
    if (state.tab === "people") return renderEmployees();
    if (state.tab === "roles") return renderOrgRoles();
    const rows = list(state.data.orgs);
    const page = paginateRows("orgs", rows);
    return `
      <section class="grid three">
        ${stat("조직 수", `${rows.length}개`, "활성/비활성 포함")}
        ${stat("정원", `${rows.reduce((sum, item) => sum + Number(item.headcount || 0), 0)}명`, "조직별 기준")}
        ${stat("조직장 지정", `${rows.filter((item) => item.leaderId).length}개`, "권한 연계 기준")}
      </section>
      <section class="table-panel">
        <div class="toolbar">
          <h2>조직 목록</h2>
          ${canWrite("orgs") ? `
            <div class="row-actions">
              <button class="button" data-action="download-org-template">양식 다운로드</button>
              <button class="button primary" data-action="upload-org-template">엑셀 업로드</button>
              <button class="button" data-action="bulk-orgs">붙여넣기 등록</button>
            </div>
          ` : ""}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>조직</th><th>상위조직</th><th>조직장</th><th>정원</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => `
                <tr>
                  <td><strong>${escapeHtml(item.name)}</strong><br /><small>${escapeHtml(item.site || "-")}</small></td>
                  <td>${orgName(item.parentId)}</td>
                  <td>${employeeName(item.leaderId)}</td>
                  <td>${item.headcount || 0}명</td>
                  <td>${badge(item.status)}</td>
                  <td class="row-actions">
                    ${canWrite("orgs") ? `
                      <button class="button" data-action="edit-org" data-id="${item.id}">수정</button>
                      <button class="button danger" data-action="delete-org" data-id="${item.id}">삭제</button>
                    ` : "-"}
                  </td>
                </tr>
              `).join("") || `<tr><td colspan="6"><div class="empty">조직이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

function renderOrgRoles() {
  const roles = ROLE_LABELS.map((role) => ({
    label: role,
    count: visibleEmployees().filter((item) => item.role === role).length
  }));
    return `
      <section class="dashboard-layout">
        <article class="panel chart-panel">
          <div class="panel-title"><div><h2>역할별 사용자</h2><p>앱 접근 권한 기준입니다.</p></div></div>
          ${barList(roles, Math.max(1, visibleEmployees().length))}
        </article>
        <article class="panel">
          <div class="panel-title"><div><h2>권한 운영 기준</h2><p>조직/평가/보상/증명서 중심의 역할 설계입니다.</p></div></div>
          <div class="risk-grid">
            <div class="risk-card ok"><span>시스템 관리자</span><strong>전체</strong><small>사용자와 시스템 설정 관리</small></div>
            <div class="risk-card ok"><span>HR 관리자</span><strong>조직·증명서</strong><small>구성원, 조직, 증명서 발급</small></div>
            <div class="risk-card warn"><span>평가 담당자</span><strong>평가</strong><small>평가 사이클과 보정 관리</small></div>
            <div class="risk-card warn"><span>보상 담당자</span><strong>보상</strong><small>보상안과 연봉 기초정보 관리</small></div>
          </div>
        </article>
      </section>
    `;
  }

  function renderReviewComp() {
    if (state.tab === "compensation") return renderCompPlans();
    const rows = list(state.data.reviews.cycles);
    const page = paginateRows("review-comp-cycles", rows);
    return `
      <section class="table-panel">
        <div class="toolbar"><h2>평가 사이클</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>사이클</th><th>기간</th><th>대상</th><th>진행률</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => `
                <tr>
                  <td><strong>${escapeHtml(item.title)}</strong></td>
                  <td>${escapeHtml(item.period)}</td>
                  <td>${item.targetCount}명</td>
                  <td>${item.progress}%</td>
                  <td>${badge(item.status)}</td>
                  <td class="row-actions">
                    ${canWrite("reviews") ? `
                      <button class="button" data-action="edit-cycle" data-id="${item.id}">수정</button>
                      <button class="button danger" data-action="delete-cycle" data-id="${item.id}">삭제</button>
                    ` : "-"}
                  </td>
                </tr>
              `).join("") || `<tr><td colspan="6"><div class="empty">평가 사이클이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function renderReviews() {
    if (state.tab === "criteria") return renderReviewCriteria();
    if (state.tab === "results") return renderReviewResults();
    if (state.tab === "calibration") return renderReviewCalibration();
    const rows = list(state.data.reviews.cycles);
    const page = paginateRows("review-cycles", rows);
    return `
      <section class="grid three">
        ${stat("평가 사이클", `${rows.length}건`, "운영 중/종료 포함")}
        ${stat("평균 진행률", `${rows.length ? Math.round(rows.reduce((sum, item) => sum + Number(item.progress || 0), 0) / rows.length) : 0}%`, "전체 사이클 기준")}
        ${stat("확정 대기", `${rows.filter((item) => item.status !== "confirmed").length}건`, "보정/확정 필요")}
      </section>
      <section class="table-panel">
        <div class="toolbar"><h2>평가 사이클</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>사이클</th><th>기간</th><th>대상</th><th>진행률</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => `
                <tr>
                  <td><strong>${escapeHtml(item.title)}</strong></td>
                  <td>${escapeHtml(item.period)}</td>
                  <td>${item.targetCount}명</td>
                  <td><div class="progress-track"><div class="progress-fill" style="width:${clamp(Number(item.progress || 0), 0, 100)}%"></div></div><small>${item.progress}%</small></td>
                  <td>${badge(item.status)}</td>
                  <td class="row-actions">
                    ${canWrite("reviews") ? `
                      <button class="button" data-action="edit-cycle" data-id="${item.id}">수정</button>
                      <button class="button danger" data-action="delete-cycle" data-id="${item.id}">삭제</button>
                    ` : "-"}
                  </td>
                </tr>
              `).join("") || `<tr><td colspan="6"><div class="empty">평가 사이클이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function renderReviewCriteria() {
    const criteria = reviewCriteriaRows();
    const grades = reviewGradeRows();
    const totalWeight = criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    const criteriaPage = paginateRows("review-criteria", criteria, DENSE_PAGE_SIZE);
    const gradePage = paginateRows("review-grades", grades, DENSE_PAGE_SIZE);
    return `
      <section class="grid four">
        ${stat("평가 항목", `${criteria.length}개`, "성과/역량/리더십 기준")}
        ${stat("가중치 합계", `${totalWeight}%`, totalWeight === 100 ? "운영 기준 충족" : "100% 기준 점검 필요")}
        ${stat("평가 등급", `${grades.length}개`, "점수 구간 기준")}
        ${stat("활성 기준", `${criteria.filter((item) => item.status !== "inactive").length}개`, "현재 적용 항목")}
      </section>
      <section class="table-panel">
        <div class="toolbar">
          <div><h2>평가 항목 기준</h2><p>평가 결과 입력 전에 항목과 가중치를 먼저 확정합니다.</p></div>
          ${canWrite("reviews") ? `<button class="button primary" data-action="new-review-criterion">항목 추가</button>` : ""}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>항목</th><th>영역</th><th>가중치</th><th>설명</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              ${criteriaPage.rows.map((item) => `
                <tr>
                  <td><strong>${escapeHtml(item.name)}</strong></td>
                  <td>${escapeHtml(item.category || "-")}</td>
                  <td>${Number(item.weight || 0)}%</td>
                  <td>${escapeHtml(item.description || "-")}</td>
                  <td>${badge(item.status || "active")}</td>
                  <td class="row-actions">
                    ${canWrite("reviews") ? `
                      <button class="button" data-action="edit-review-criterion" data-id="${item.id}">수정</button>
                      <button class="button danger" data-action="delete-review-criterion" data-id="${item.id}">삭제</button>
                    ` : "-"}
                  </td>
                </tr>
              `).join("") || `<tr><td colspan="6"><div class="empty">평가 항목 기준이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(criteriaPage)}
      </section>
      <section class="table-panel">
        <div class="toolbar">
          <div><h2>평가 등급 산정 기준</h2><p>점수 구간과 목표 분포를 기준으로 등급을 운영합니다.</p></div>
          ${canWrite("reviews") ? `<button class="button primary" data-action="new-review-grade">등급 추가</button>` : ""}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>등급</th><th>점수 구간</th><th>목표 분포</th><th>설명</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              ${gradePage.rows.map((item) => `
                <tr>
                  <td><strong>${escapeHtml(item.grade)}</strong></td>
                  <td>${Number(item.scoreMin || 0)}~${Number(item.scoreMax || 0)}점</td>
                  <td>${Number(item.targetRatio || 0)}%</td>
                  <td>${escapeHtml(item.description || "-")}</td>
                  <td>${badge(item.status || "active")}</td>
                  <td class="row-actions">
                    ${canWrite("reviews") ? `
                      <button class="button" data-action="edit-review-grade" data-id="${item.id}">수정</button>
                      <button class="button danger" data-action="delete-review-grade" data-id="${item.id}">삭제</button>
                    ` : "-"}
                  </td>
                </tr>
              `).join("") || `<tr><td colspan="6"><div class="empty">평가 등급 기준이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(gradePage)}
      </section>
    `;
  }

  function renderReviewResults() {
    const employees = visibleEmployees().filter((item) => item.status !== "퇴직");
    const rows = list(state.data.reviews.results).filter((item) => employees.some((employee) => employee.id === item.employeeId));
    const source = rows.length ? rows : reviewResultsForStats(employees);
    const results = filteredReviewResults(source);
    const page = paginateRows("review-results", results);
    const ctx = { activeEmployees: employees, orgs: list(state.data.orgs), employeeIds: new Set(employees.map((item) => item.id)) };
    return `
      <section class="grid three">
        ${stat("결과 데이터", `${rows.length}건`, results.some((item) => item.derived) ? "구성원 기준 예시 포함" : "등록 결과")}
        ${stat("평균 점수", `${average(results.map((item) => item.score))}점`, "평가 결과 기준")}
        ${stat("상위 등급", `${results.filter((item) => ["S", "A"].includes(item.grade)).length}명`, "S/A 등급")}
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel">
          <div class="panel-title"><div><h2>평가 등급 분포</h2><p>등록된 평가 결과 기준입니다.</p></div></div>
          ${barList(countBy(results, (item) => item.grade || "미입력"), Math.max(1, results.length))}
        </article>
        <article class="panel chart-panel">
          <div class="panel-title"><div><h2>조직별 평가 대상</h2><p>평가 대상 인원 분포입니다.</p></div></div>
          ${barList(orgHeadcountRows(ctx), Math.max(1, employees.length))}
        </article>
      </section>
      <section class="table-panel">
        <div class="toolbar">
          <h2>평가 결과 목록</h2>
          <div class="filters">
            <input data-filter="reviewQuery" placeholder="구성원, 조직 검색" value="${escapeAttr(state.filters.reviewQuery)}" />
            <select data-filter="reviewCycle">
              ${option("", "전체 사이클", state.filters.reviewCycle)}
              ${list(state.data.reviews.cycles).map((item) => option(item.id, item.title, state.filters.reviewCycle)).join("")}
            </select>
            <select data-filter="reviewGrade">
              ${option("", "전체 등급", state.filters.reviewGrade)}
              ${reviewGradeRows().map((item) => option(item.grade, item.grade, state.filters.reviewGrade)).join("")}
            </select>
            <select data-filter="reviewStatus">
              ${option("", "전체 상태", state.filters.reviewStatus)}
              ${["draft", "review", "confirmed"].map((item) => option(item, statusLabel(item), state.filters.reviewStatus)).join("")}
            </select>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>구성원</th><th>조직</th><th>사이클</th><th>등급</th><th>점수</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => {
                const employee = employeeById(item.employeeId);
                return `
                  <tr>
                    <td>${employeeName(item.employeeId)}</td>
                    <td>${orgName(employee?.orgId)}</td>
                    <td>${cycleName(item.cycleId)}</td>
                    <td>${escapeHtml(item.grade || "미입력")}</td>
                    <td>${item.score ? `${item.score}점` : "-"}</td>
                    <td>${item.derived ? badge("draft") : badge(item.status)}</td>
                    <td class="row-actions">
                      ${canWrite("reviews") && !item.derived ? `
                        <button class="button" data-action="edit-review-result" data-id="${item.id}">수정</button>
                        <button class="button" data-action="confirm-review-result" data-id="${item.id}">확정</button>
                        <button class="button danger" data-action="delete-review-result" data-id="${item.id}">삭제</button>
                      ` : canWrite("reviews") ? `<button class="button" data-action="new-review-result" data-employee-id="${item.employeeId}">결과 입력</button>` : "-"}
                    </td>
                  </tr>
                `;
              }).join("") || `<tr><td colspan="7"><div class="empty">평가 결과가 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function renderReviewCalibration() {
    return `
      <section class="grid three">
        ${stat("보정 필요 조직", "2개", "등급 쏠림 확인")}
        ${stat("확정 전 대상", `${visibleEmployees().filter((item) => item.status === "재직").length}명`, "재직자 기준")}
        ${stat("보정 상태", "검토중", "평가 담당자 확인")}
      </section>
      <section class="panel">
        <div class="panel-title"><div><h2>등급 보정 운영 기준</h2><p>평가 결과 확정 전 조직별 등급 분포와 보상 영향도를 확인합니다.</p></div></div>
        <div class="risk-grid">
          <div class="risk-card warn"><span>상위등급 편중</span><strong>제품개발실</strong><small>A 이상 비중이 기준보다 높습니다.</small></div>
          <div class="risk-card ok"><span>분포 안정</span><strong>People팀</strong><small>권장 분포 내에서 운영 중입니다.</small></div>
          <div class="risk-card warn"><span>결과 미입력</span><strong>성장사업팀</strong><small>평가 결과 확정 전 입력 보완이 필요합니다.</small></div>
          <div class="risk-card ok"><span>보상 연결</span><strong>준비됨</strong><small>확정 후 보상안 생성이 가능합니다.</small></div>
        </div>
      </section>
    `;
  }

  function renderCompensation() {
    if (state.tab === "salary") return renderSalary();
    if (state.tab === "items") return renderCompItems();
    if (state.tab === "budget") return renderCompBudget();
    if (state.tab === "rules") return renderCompRules();
    return renderCompPlans();
  }

  function renderCompRules() {
    const rows = compensationRuleRows();
    const activeRows = rows.filter((item) => item.status !== "inactive");
    const page = paginateRows("comp-rules", rows, DENSE_PAGE_SIZE);
    const minRate = rows.length ? Math.min(...rows.map((item) => Number(item.minRaiseRate || 0))) : 0;
    const maxRate = rows.length ? Math.max(...rows.map((item) => Number(item.maxRaiseRate || 0))) : 0;
    return `
      <section class="grid four">
        ${stat("보상 기준", `${rows.length}개`, "평가등급별 운영")}
        ${stat("활성 기준", `${activeRows.length}개`, "현재 적용")}
        ${stat("최고 기준 인상률", `${Math.max(0, ...rows.map((item) => Number(item.targetRaiseRate || 0)))}%`, "목표 인상률")}
        ${stat("기준 범위", `${minRate}~${maxRate}%`, "최소~최대")}
      </section>
      <section class="notice">보상 기준은 급여 계산 기능이 아니라 평가등급별 연봉 조정 가이드입니다. 실제 대상자 조정 화면에서 기준 대비 편차를 검토하는 운영 자료로 사용합니다.</section>
      <section class="table-panel">
        <div class="toolbar">
          <div><h2>평가등급별 보상 기준</h2><p>등급별 권장 인상률, 허용 범위, 예산 가중치를 관리합니다.</p></div>
          ${canWrite("compensation") ? `<button class="button primary" data-action="new-comp-rule">기준 추가</button>` : ""}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>평가등급</th><th>권장 인상률</th><th>허용 범위</th><th>예산 가중치</th><th>운영 가이드</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => `
                <tr>
                  <td><strong>${escapeHtml(item.grade)}</strong></td>
                  <td>${Number(item.targetRaiseRate || 0)}%</td>
                  <td>${Number(item.minRaiseRate || 0)}~${Number(item.maxRaiseRate || 0)}%</td>
                  <td>${Number(item.budgetWeight || 0)}</td>
                  <td>${escapeHtml(item.guidance || "-")}</td>
                  <td>${badge(item.status || "active")}</td>
                  <td class="row-actions">
                    ${canWrite("compensation") ? `
                      <button class="button" data-action="edit-comp-rule" data-id="${item.id}">수정</button>
                      <button class="button danger" data-action="delete-comp-rule" data-id="${item.id}">삭제</button>
                    ` : "-"}
                  </td>
                </tr>
              `).join("") || `<tr><td colspan="7"><div class="empty">보상 기준이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function renderCompBudget() {
    const plans = list(state.data.compensationPlans);
    const total = plans.reduce((sum, item) => sum + Number(item.budget || 0), 0);
    const byPlan = plans.map((item) => ({ label: item.title, count: Number(item.budget || 0) }));
    const salaryValues = list(state.data.salaryBasics).map((item) => Number(item.annualSalary || 0)).filter(Boolean);
    const itemRows = list(state.data.compensationItems);
    const proposedTotal = itemRows.reduce((sum, item) => sum + Number(item.proposedIncrease || 0), 0);
    const canViewSalary = canViewSalarySection();
    return `
      <section class="grid four">
        ${stat("총 보상 예산", `${money(total)}원`, `${plans.length}개 보상안`)}
        ${stat("조정 제안액", `${money(proposedTotal)}만원`, `${itemRows.length}명 대상`)}
        ${stat("예산 사용률", `${percent(proposedTotal * 10000, total)}%`, "대상자 조정 기준")}
        ${stat("평균 연봉", canViewSalary ? `${salaryValues.length ? money(Math.round(salaryValues.reduce((a, b) => a + b, 0) / salaryValues.length)) : 0}만원` : "권한 필요", "연봉 기초정보 기준")}
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel">
          <div class="panel-title"><div><h2>보상안별 예산</h2><p>등록된 보상안 예산 분포입니다.</p></div></div>
          ${barList(byPlan, Math.max(1, total))}
        </article>
        <article class="panel chart-panel">
          <div class="panel-title"><div><h2>연봉 구간</h2><p>기초정보 등록자 기준입니다.</p></div></div>
          ${canViewSalary ? barList([
            { label: "5천 미만", count: salaryValues.filter((value) => value < 5000).length },
            { label: "5천~7천", count: salaryValues.filter((value) => value >= 5000 && value < 7000).length },
            { label: "7천 이상", count: salaryValues.filter((value) => value >= 7000).length }
          ], Math.max(1, salaryValues.length)) : `<div class="empty">연봉 기초정보 접근 권한이 필요합니다.</div>`}
        </article>
      </section>
      ${statsTable("대상자별 보상 조정 요약", ["대상자", "조직", "현재연봉", "제안인상", "제안연봉", "상태"], compensationItemRows(itemRows))}
    `;
  }

  function renderCompPlans() {
    const rows = list(state.data.compensationPlans);
    const page = paginateRows("comp-plans", rows);
    return `
      <section class="notice">보상안은 평가 결과와 현재 연봉 수준을 참고하는 의사결정 자료입니다. 월 지급액 산정이나 명세 계산은 이 시스템에서 처리하지 않습니다.</section>
      <section class="table-panel">
        <div class="toolbar"><h2>보상안</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>보상안</th><th>평가 사이클</th><th>대상</th><th>예산</th><th>조정액</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => {
                const itemRows = list(state.data.compensationItems).filter((row) => row.planId === item.id);
                const proposed = itemRows.reduce((sum, row) => sum + Number(row.proposedIncrease || 0), 0);
                return `
                  <tr>
                    <td><strong>${escapeHtml(item.title)}</strong><br /><small>${escapeHtml(item.memo || "-")}</small></td>
                    <td>${cycleName(item.cycleId)}</td>
                    <td>${itemRows.length || item.targetCount}명</td>
                    <td>${money(item.budget)}원</td>
                    <td>${money(proposed)}만원<br /><small>${percent(proposed * 10000, Number(item.budget || 0))}% 사용</small></td>
                    <td>${badge(item.status)}</td>
                    <td class="row-actions">
                      ${canWrite("compensation") ? `
                        <button class="button" data-action="edit-comp-plan" data-id="${item.id}">수정</button>
                        <button class="button" data-action="generate-comp-items" data-id="${item.id}">자동생성</button>
                        <button class="button" data-action="new-comp-item" data-id="${item.id}">대상자</button>
                        <button class="button" data-action="approve-comp-plan" data-id="${item.id}">승인</button>
                        <button class="button danger" data-action="delete-comp-plan" data-id="${item.id}">삭제</button>
                      ` : "-"}
                    </td>
                  </tr>
                `;
              }).join("") || `<tr><td colspan="7"><div class="empty">보상안이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function renderCompItems() {
    const rows = filteredCompItems(list(state.data.compensationItems));
    const page = paginateRows("comp-items", rows);
    const totalIncrease = rows.reduce((sum, item) => sum + Number(item.proposedIncrease || 0), 0);
    return `
      <section class="grid four">
        ${stat("조정 대상", `${rows.length}명`, "등록된 대상자")}
        ${stat("제안 인상액", `${money(totalIncrease)}만원`, "연봉 수준 기준")}
        ${stat("승인 대기", `${rows.filter((item) => item.status !== "approved").length}명`, "검토 필요")}
        ${stat("평균 인상률", `${average(rows.map((item) => Number(item.raiseRate || 0)))}%`, "대상자 기준")}
      </section>
      <section class="table-panel">
        <div class="toolbar">
          <h2>대상자별 보상 조정</h2>
          <div class="filters">
            <input data-filter="compQuery" placeholder="구성원, 조직 검색" value="${escapeAttr(state.filters.compQuery)}" />
            <select data-filter="compPlan">
              ${option("", "전체 보상안", state.filters.compPlan)}
              ${list(state.data.compensationPlans).map((item) => option(item.id, item.title, state.filters.compPlan)).join("")}
            </select>
            <select data-filter="compStatus">
              ${option("", "전체 상태", state.filters.compStatus)}
              ${["draft", "review", "approved", "closed"].map((item) => option(item, statusLabel(item), state.filters.compStatus)).join("")}
            </select>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>대상자</th><th>보상안</th><th>현재 연봉</th><th>제안 인상</th><th>제안 연봉</th><th>인상률</th><th>평가/기준</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => {
                const review = latestReviewForEmployee(item.employeeId);
                const rule = compensationRuleForGrade(review?.grade);
                return `
                  <tr>
                    <td><strong>${employeeName(item.employeeId)}</strong><br /><small>${orgName(employeeById(item.employeeId)?.orgId)}</small></td>
                    <td>${compPlanName(item.planId)}</td>
                    <td>${money(item.currentAnnualSalary)}만원</td>
                    <td>${money(item.proposedIncrease)}만원</td>
                    <td><strong>${money(item.proposedAnnualSalary)}만원</strong></td>
                    <td>${Number(item.raiseRate || 0)}%</td>
                    <td>${review?.grade ? `${escapeHtml(review.grade)} / ${Number(rule?.targetRaiseRate || 0)}%` : "미입력"}</td>
                    <td>${badge(item.status)}</td>
                    <td class="row-actions">
                      ${canWrite("compensation") ? `
                        <button class="button" data-action="edit-comp-item" data-id="${item.id}">수정</button>
                        <button class="button" data-action="approve-comp-item" data-id="${item.id}">승인</button>
                        <button class="button danger" data-action="delete-comp-item" data-id="${item.id}">삭제</button>
                      ` : "-"}
                    </td>
                  </tr>
                `;
              }).join("") || `<tr><td colspan="9"><div class="empty">보상 조정 대상자가 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function renderSalary() {
    if (!canViewSalarySection()) return `<div class="empty">연봉 기초정보 접근 권한이 없습니다.</div>`;
    if (state.tab === "band") return renderSalaryBands();
    if (state.tab === "history") return renderSalaryHistory();
    const rows = visibleEmployees().filter((item) => item.status !== "퇴직");
    const page = paginateRows("salary", rows);
    return `
      <section class="notice">연봉 기초정보는 연봉 수준과 변경 이력만 관리합니다. 월 지급액 산정, 공제, 지급 회차, 명세 생성은 제외됩니다.</section>
      <section class="table-panel">
        <div class="toolbar"><h2>직원별 연봉</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>직원</th><th>조직</th><th>직군/직급</th><th>연봉 수준</th><th>보상등급</th><th>적용일</th><th>작업</th></tr></thead>
            <tbody>
              ${page.rows.map((employee) => {
                const salary = salaryForEmployee(employee.id);
                return `
                  <tr>
                    <td><strong>${escapeHtml(employee.name)}</strong><br /><small>${escapeHtml(employee.employeeNo || employee.id)}</small></td>
                    <td>${orgName(employee.orgId)}</td>
                    <td>${escapeHtml(employee.jobFamily || "-")} / ${escapeHtml(employee.grade || "-")}</td>
                    <td><strong>${salary ? `${money(salary.annualSalary)}만원` : "미등록"}</strong></td>
                    <td>${escapeHtml(salary?.payGrade || "-")}</td>
                    <td>${escapeHtml(salary?.effectiveDate || "-")}</td>
                    <td class="row-actions">
                      ${canWriteSalary() ? `
                        <button class="button" data-action="edit-salary" data-employee-id="${employee.id}">수정</button>
                        ${salary ? `<button class="button danger" data-action="delete-salary" data-employee-id="${employee.id}">삭제</button>` : ""}
                      ` : "-"}
                    </td>
                  </tr>
                `;
              }).join("") || `<tr><td colspan="7"><div class="empty">직원이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function renderSalaryBands() {
    const salaryRows = list(state.data.salaryBasics);
    const byGrade = groupSalary(salaryRows, (item) => employeeById(item.employeeId)?.grade || "미분류");
    const byFamily = groupSalary(salaryRows, (item) => employeeById(item.employeeId)?.jobFamily || "미분류");
    return `
      <section class="grid two">
        ${salaryBandTable("직급별 연봉 수준", byGrade, "직급")}
        ${salaryBandTable("직군별 연봉 수준", byFamily, "직군")}
      </section>
    `;
  }

  function renderSalaryHistory() {
    const rows = list(state.data.salaryHistory);
    const page = paginateRows("salary-history", rows, DENSE_PAGE_SIZE);
    return `
      <section class="table-panel">
        <div class="toolbar"><h2>연봉 변경 이력</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>직원</th><th>변경일</th><th>변경자</th><th>이전</th><th>변경</th><th>사유</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => `
                <tr>
                  <td>${employeeName(item.employeeId)}</td>
                  <td>${formatDateTime(item.changedAt)}</td>
                  <td>${escapeHtml(item.changedBy || "-")}</td>
                  <td>${item.beforeAnnualSalary ? `${money(item.beforeAnnualSalary)}만원` : "-"}</td>
                  <td>${item.afterAnnualSalary ? `${money(item.afterAnnualSalary)}만원` : "-"}</td>
                  <td>${escapeHtml(item.reason || "-")}</td>
                </tr>
              `).join("") || `<tr><td colspan="6"><div class="empty">변경 이력이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function renderStats() {
    const context = statsContext();
    if (state.tab === "demographics") return renderDemographicStats(context);
    if (state.tab === "organization") return renderOrganizationStats(context);
    if (state.tab === "review") return renderReviewStats(context);
    if (state.tab === "compensation") return renderCompensationStats(context);
    if (state.tab === "certificates") return renderCertificateStats(context);
    return renderOverviewStats(context);
  }

  function statsContext() {
    const employees = visibleEmployees();
    const activeEmployees = employees.filter((item) => item.status === "재직");
    const employeeIds = new Set(employees.map((item) => item.id));
    const salaryRows = canViewSalarySection() ? list(state.data.salaryBasics).filter((item) => employeeIds.has(item.employeeId)) : [];
    return {
      employees,
      activeEmployees,
      employeeIds,
      orgs: list(state.data.orgs),
      cycles: list(state.data.reviews.cycles),
      plans: list(state.data.compensationPlans),
      salaryRows,
      salaryValues: salaryRows.map((item) => Number(item.annualSalary || 0)).filter(Boolean),
      reviewResults: reviewResultsForStats(activeEmployees),
      certificateIssued: list(state.data.certificates.issued).filter((item) => !item.employeeId || employeeIds.has(item.employeeId)),
      certificateTemplates: list(state.data.certificates.templates)
    };
  }

  function renderOverviewStats(ctx) {
    const headcount = ctx.orgs.reduce((sum, item) => sum + Number(item.headcount || 0), 0);
    const reviewAvg = average(ctx.cycles.map((item) => Number(item.progress || 0)));
    const issuedThisMonth = ctx.certificateIssued.filter((item) => monthLabel(item.issuedAt) === monthLabel(nowStamp())).length;
    return `
      <section class="grid four">
        ${stat("재직 인원", `${ctx.activeEmployees.length}명`, `전체 ${ctx.employees.length}명`)}
        ${stat("조직 충원율", `${percent(ctx.activeEmployees.length, headcount)}%`, `${ctx.activeEmployees.length}/${headcount || 0}명`)}
        ${stat("평가 진행률", `${reviewAvg}%`, `${ctx.cycles.length}개 사이클 평균`)}
        ${stat("증명서 발급", `${issuedThisMonth}건`, `누적 ${ctx.certificateIssued.length}건`)}
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel"><div class="panel-title"><div><h2>조직별 인원</h2><p>재직자 기준 구성입니다.</p></div></div>${barList(orgHeadcountRows(ctx), Math.max(1, ctx.activeEmployees.length))}</article>
        <article class="panel chart-panel"><div class="panel-title"><div><h2>운영 상태</h2><p>평가, 보상, 증명서 처리 현황입니다.</p></div></div>${barList([
          { label: "평가 미확정", count: ctx.cycles.filter((item) => item.status !== "confirmed").length },
          { label: "보상안 검토", count: ctx.plans.filter((item) => item.status !== "closed").length },
          { label: "이번달 증명서", count: issuedThisMonth },
          { label: "연봉 미등록", count: canViewSalarySection() ? Math.max(0, ctx.activeEmployees.length - ctx.salaryRows.length) : 0 }
        ], Math.max(1, ctx.cycles.length + ctx.plans.length + ctx.certificateIssued.length))}</article>
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel"><div class="panel-title"><div><h2>직군 구성</h2><p>재직 구성원 직군 분포입니다.</p></div></div>${barList(countBy(ctx.activeEmployees, (item) => item.jobFamily || "미분류"), Math.max(1, ctx.activeEmployees.length))}</article>
        <article class="panel chart-panel"><div class="panel-title"><div><h2>증명서 발급 유형</h2><p>발급된 증명서 종류별 건수입니다.</p></div></div>${barList(countBy(ctx.certificateIssued, (item) => item.type || "미분류"), Math.max(1, ctx.certificateIssued.length))}</article>
      </section>
      ${statsTable("조직 운영 요약", ["조직", "재직", "정원", "충원율", "조직장"], orgSummaryRows(ctx))}
    `;
  }

  function renderDemographicStats(ctx) {
    const knownGender = ctx.employees.filter((item) => item.gender).length;
    const knownBirth = ctx.employees.filter((item) => item.birthDate).length;
    const avgAge = average(ctx.employees.map((item) => ageFromBirthDate(item.birthDate)).filter(Boolean));
    return `
      <section class="grid four">
        ${stat("전체 구성원", `${ctx.employees.length}명`, `재직 ${ctx.activeEmployees.length}명`)}
        ${stat("성별 입력률", `${percent(knownGender, ctx.employees.length)}%`, `${knownGender}/${ctx.employees.length}명`)}
        ${stat("생년월일 입력률", `${percent(knownBirth, ctx.employees.length)}%`, `${knownBirth}/${ctx.employees.length}명`)}
        ${stat("평균 연령", `${avgAge || 0}세`, "생년월일 입력자 기준")}
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel"><div class="panel-title"><div><h2>남녀 성비</h2><p>구성원 기초정보의 성별 기준입니다.</p></div></div>${donutChart(genderRows(ctx.employees), ctx.employees.length)}</article>
        <article class="panel chart-panel"><div class="panel-title"><div><h2>연령대</h2><p>생년월일 기준 연령대 분포입니다.</p></div></div>${barList(ageBandRows(ctx.employees), Math.max(1, ctx.employees.length))}</article>
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel"><div class="panel-title"><div><h2>근속연수</h2><p>입사일 기준 재직 기간 분포입니다.</p></div></div>${barList(tenureRows(ctx.employees), Math.max(1, ctx.employees.length))}</article>
        <article class="panel chart-panel"><div class="panel-title"><div><h2>고용형태</h2><p>정규직, 계약직 등 고용형태 기준입니다.</p></div></div>${barList(countBy(ctx.employees, (item) => item.employmentType || "미입력"), Math.max(1, ctx.employees.length))}</article>
      </section>
      ${statsTable("조직별 기초정보", ["조직", "인원", "남성", "여성", "평균연령", "평균근속"], demographicOrgRows(ctx))}
    `;
  }

  function renderOrganizationStats(ctx) {
    const headcount = ctx.orgs.reduce((sum, item) => sum + Number(item.headcount || 0), 0);
    const leaderCount = ctx.orgs.filter((item) => item.leaderId).length;
    return `
      <section class="grid four">
        ${stat("재직 인원", `${ctx.activeEmployees.length}명`, `전체 ${ctx.employees.length}명`)}
        ${stat("조직 수", `${ctx.orgs.length}개`, "활성/비활성 포함")}
        ${stat("정원 대비", `${headcount - ctx.activeEmployees.length}명`, "남은 정원")}
        ${stat("조직장 지정률", `${percent(leaderCount, ctx.orgs.length)}%`, `${leaderCount}/${ctx.orgs.length}개`)}
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel"><div class="panel-title"><div><h2>조직별 재직 인원</h2><p>조직별 실제 배치 현황입니다.</p></div></div>${barList(orgHeadcountRows(ctx), Math.max(1, ctx.activeEmployees.length))}</article>
        <article class="panel chart-panel"><div class="panel-title"><div><h2>재직 상태</h2><p>전체 구성원 상태 분포입니다.</p></div></div>${donutChart(countBy(ctx.employees, (item) => item.status || "미분류"), ctx.employees.length)}</article>
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel"><div class="panel-title"><div><h2>고용형태</h2><p>계약 형태별 구성입니다.</p></div></div>${barList(countBy(ctx.employees, (item) => item.employmentType || "미분류"), Math.max(1, ctx.employees.length))}</article>
        <article class="panel chart-panel"><div class="panel-title"><div><h2>직급 분포</h2><p>재직자 직급 기준입니다.</p></div></div>${barList(countBy(ctx.activeEmployees, (item) => item.grade || "미분류"), Math.max(1, ctx.activeEmployees.length))}</article>
      </section>
      ${statsTable("조직별 상세", ["조직", "상위조직", "재직", "정원", "충원율", "조직장", "상태"], orgDetailRows(ctx))}
    `;
  }

  function renderReviewStats(ctx) {
    const results = ctx.reviewResults;
    const actualCount = list(state.data.reviews.results).filter((item) => ctx.employeeIds.has(item.employeeId)).length;
    const avgScore = average(results.map((item) => Number(item.score || 0)).filter(Boolean));
    return `
      <section class="grid four">
        ${stat("평가 사이클", `${ctx.cycles.length}건`, "등록 기준")}
        ${stat("평균 진행률", `${average(ctx.cycles.map((item) => Number(item.progress || 0)))}%`, "전체 사이클")}
        ${stat("결과 등록", `${actualCount}건`, results.some((item) => item.derived) ? "미등록 시 구성원 기준 예시 포함" : "실제 등록")}
        ${stat("평균 점수", `${avgScore}점`, "평가 결과 기준")}
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel"><div class="panel-title"><div><h2>사이클별 진행률</h2><p>평가 운영 진척도입니다.</p></div></div>${barList(ctx.cycles.map((item) => ({ label: item.title, count: Number(item.progress || 0) })), 100)}</article>
        <article class="panel chart-panel"><div class="panel-title"><div><h2>등급 분포</h2><p>평가 결과 등급별 분포입니다.</p></div></div>${barList(countBy(results, (item) => item.grade || "미입력"), Math.max(1, results.length))}</article>
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel"><div class="panel-title"><div><h2>평가 상태</h2><p>사이클 상태별 건수입니다.</p></div></div>${barList(countBy(ctx.cycles, (item) => statusLabel(item.status)), Math.max(1, ctx.cycles.length))}</article>
        <article class="panel chart-panel"><div class="panel-title"><div><h2>조직별 평가 대상</h2><p>재직 구성원 기준입니다.</p></div></div>${barList(orgHeadcountRows(ctx), Math.max(1, ctx.activeEmployees.length))}</article>
      </section>
      ${statsTable("평가 결과 상세", ["구성원", "조직", "사이클", "등급", "점수", "상태"], reviewResultRows(ctx, results))}
    `;
  }

  function renderCompensationStats(ctx) {
    const total = ctx.plans.reduce((sum, item) => sum + Number(item.budget || 0), 0);
    const canViewSalary = canViewSalarySection();
    return `
      <section class="grid four">
        ${stat("보상 예산", `${money(total)}원`, `${ctx.plans.length}개 보상안`)}
        ${stat("인당 예산", ctx.activeEmployees.length ? `${money(Math.round(total / ctx.activeEmployees.length))}원` : "0원", "재직자 기준")}
        ${stat("평균 연봉", canViewSalary ? `${money(average(ctx.salaryValues))}만원` : "권한 필요", "연봉 기초정보")}
        ${stat("연봉 등록률", canViewSalary ? `${percent(ctx.salaryRows.length, ctx.activeEmployees.length)}%` : "권한 필요", canViewSalary ? `${ctx.salaryRows.length}/${ctx.activeEmployees.length}명` : "보상/관리자 권한")}
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel"><div class="panel-title"><div><h2>보상안 예산</h2><p>보상안별 예산 배분입니다.</p></div></div>${barList(ctx.plans.map((item) => ({ label: item.title, count: Number(item.budget || 0) })), Math.max(1, total))}</article>
        <article class="panel chart-panel"><div class="panel-title"><div><h2>보상안 상태</h2><p>보상안 처리 단계입니다.</p></div></div>${barList(countBy(ctx.plans, (item) => statusLabel(item.status)), Math.max(1, ctx.plans.length))}</article>
      </section>
      ${canViewSalary ? `
        <section class="dashboard-layout">
          <article class="panel chart-panel"><div class="panel-title"><div><h2>연봉 구간</h2><p>연봉 기초정보 분포입니다.</p></div></div>${barList(salaryBandRows(ctx.salaryValues), Math.max(1, ctx.salaryValues.length))}</article>
          <article class="panel chart-panel"><div class="panel-title"><div><h2>직군별 연봉 등록</h2><p>직군별 연봉 기초정보 등록 현황입니다.</p></div></div>${barList(countBy(ctx.salaryRows, (item) => employeeById(item.employeeId)?.jobFamily || "미분류"), Math.max(1, ctx.salaryRows.length))}</article>
        </section>
        <section class="grid two">
          ${salaryBandTable("조직별 연봉 수준", groupSalary(ctx.salaryRows, (item) => orgName(employeeById(item.employeeId)?.orgId)), "조직")}
          ${salaryBandTable("직급별 연봉 수준", groupSalary(ctx.salaryRows, (item) => employeeById(item.employeeId)?.grade || "미분류"), "직급")}
        </section>
      ` : `<section class="empty">연봉 기초정보 통계는 시스템 관리자, HR 관리자, 보상 담당자만 볼 수 있습니다.</section>`}
    `;
  }

  function renderCertificateStats(ctx) {
    const issuedThisMonth = ctx.certificateIssued.filter((item) => monthLabel(item.issuedAt) === monthLabel(nowStamp())).length;
    const uniqueEmployees = new Set(ctx.certificateIssued.map((item) => item.employeeId).filter(Boolean)).size;
    return `
      <section class="grid four">
        ${stat("발급 이력", `${ctx.certificateIssued.length}건`, "전체 발급")}
        ${stat("이번달 발급", `${issuedThisMonth}건`, monthLabel(nowStamp()))}
        ${stat("발급 대상자", `${uniqueEmployees}명`, "누적 기준")}
        ${stat("템플릿", `${ctx.certificateTemplates.length}개`, "운영 서식")}
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel"><div class="panel-title"><div><h2>증명서 종류</h2><p>유형별 발급 분포입니다.</p></div></div>${donutChart(countBy(ctx.certificateIssued, (item) => item.type || "미분류"), ctx.certificateIssued.length)}</article>
        <article class="panel chart-panel"><div class="panel-title"><div><h2>월별 발급</h2><p>발급일 기준 월별 추이입니다.</p></div></div>${barList(countBy(ctx.certificateIssued, (item) => monthLabel(item.issuedAt)), Math.max(1, ctx.certificateIssued.length))}</article>
      </section>
      <section class="dashboard-layout">
        <article class="panel chart-panel"><div class="panel-title"><div><h2>조직별 발급</h2><p>대상자 소속 조직 기준입니다.</p></div></div>${barList(countBy(ctx.certificateIssued, (item) => orgName(employeeById(item.employeeId)?.orgId)), Math.max(1, ctx.certificateIssued.length))}</article>
        <article class="panel chart-panel"><div class="panel-title"><div><h2>제출처 분포</h2><p>발급 문서의 제출처 기준입니다.</p></div></div>${barList(countBy(ctx.certificateIssued, (item) => item.submitTo || "미입력"), Math.max(1, ctx.certificateIssued.length))}</article>
      </section>
      ${statsTable("증명서 발급 상세", ["대상자", "조직", "증명서", "용도", "제출처", "발급일"], certificateDetailRows(ctx))}
    `;
  }

  function renderCertificates() {
    if (state.tab === "templates") return renderCertificateTemplates();
    return renderCertificateIssued();
  }

  function renderCertificateTemplates() {
    const templates = certificateTemplateRows();
    const page = paginateRows("certificate-templates", templates, 6);
    return `
      <section class="grid two">
        ${page.rows.map((item) => `
          <article class="panel certificate-template-card">
            <div class="panel-title">
              <div><h2>${escapeHtml(item.name)}</h2><p>${escapeHtml(item.description || "")}</p></div>
              <div class="row-actions">
                ${badge(item.status)}
                <button class="button" data-action="preview-certificate-template" data-id="${item.id}">미리보기</button>
                ${canIssueCertificate() ? `<button class="button" data-action="edit-certificate-template" data-id="${item.id}">수정</button>` : ""}
                ${canIssueCertificate() ? `<button class="button danger" data-action="delete-certificate-template" data-id="${item.id}">삭제</button>` : ""}
              </div>
            </div>
            <div class="template-preview">
              <div class="template-preview-head">
                <span>OFFICIAL FORM</span>
                <small>${escapeHtml(item.type || item.name)}</small>
              </div>
              <strong>${escapeHtml(item.title || item.name)}</strong>
              <div class="template-preview-lines" aria-hidden="true"><i></i><i></i><i></i></div>
              <p>${escapeHtml(templatePreviewText(item.body || ""))}</p>
            </div>
            <div class="meta-list">
              ${meta("종류", item.type || item.name)}
              ${meta("버전", `v${Number(item.version || 1)}`)}
              ${meta("용도", item.useCase)}
              ${meta("담당", item.owner)}
              ${meta("변수", "{{employeeName}}, {{orgName}}, {{companyName}}, {{legalName}}, {{representativeName}}, {{issueNo}}")}
              ${meta("최종수정", formatDateTime(item.updatedAt))}
            </div>
          </article>
        `).join("") || `<div class="empty">템플릿이 없습니다.</div>`}
      </section>
      ${renderPager(page)}
    `;
  }

  function renderCertificateIssued() {
    const issued = filteredCertificateIssued(list(state.data.certificates.issued)).sort((a, b) => String(b.issuedAt || b.id).localeCompare(String(a.issuedAt || a.id)));
    const page = paginateRows("certificate-issued", issued);
    const issuedThisMonth = issued.filter((item) => monthLabel(item.issuedAt) === monthLabel(nowStamp())).length;
    const uniqueEmployees = new Set(issued.map((item) => item.employeeId).filter(Boolean)).size;
    return `
      <section class="grid four">
        ${stat("전체 발급", `${issued.length}건`, "누적 이력")}
        ${stat("이번달 발급", `${issuedThisMonth}건`, monthLabel(nowStamp()))}
        ${stat("발급 대상자", `${uniqueEmployees}명`, "누적 기준")}
        ${stat("운영 템플릿", `${certificateTemplateRows().filter((item) => item.status !== "inactive").length}개`, "사용 가능")}
      </section>
      <section class="table-panel">
        <div class="toolbar">
          <h2>증명서 발급 이력</h2>
          <div class="filters">
            <input data-filter="certificateQuery" placeholder="발급번호, 대상자, 제출처 검색" value="${escapeAttr(state.filters.certificateQuery)}" />
            <select data-filter="certificateType">
              ${option("", "전체 증명서", state.filters.certificateType)}
              ${certificateTypeOptions().map((item) => option(item, item, state.filters.certificateType)).join("")}
            </select>
            <input data-filter="certificateFrom" type="date" value="${escapeAttr(state.filters.certificateFrom)}" />
            <input data-filter="certificateTo" type="date" value="${escapeAttr(state.filters.certificateTo)}" />
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>발급번호</th><th>대상자</th><th>증명서</th><th>용도</th><th>제출처</th><th>발급일</th><th>발급자</th><th>작업</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => `
                <tr>
                  <td>${escapeHtml(item.issueNo)}</td>
                  <td>${employeeName(item.employeeId)}</td>
                  <td>${escapeHtml(item.type)}</td>
                  <td>${escapeHtml(item.purpose || "-")}</td>
                  <td>${escapeHtml(item.submitTo || "-")}</td>
                  <td>${formatDateTime(item.issuedAt)}</td>
                  <td>${escapeHtml(item.issuedBy || "-")}</td>
                  <td class="row-actions">
                    <button class="button" data-action="preview-certificate-issued" data-id="${item.id}">문서 보기</button>
                    ${canIssueCertificate() ? `<button class="button danger" data-action="delete-certificate-issued" data-id="${item.id}">삭제</button>` : ""}
                  </td>
                </tr>
              `).join("") || `<tr><td colspan="8"><div class="empty">발급 이력이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function renderAdmin() {
    if (!isAdminLike()) return `<div class="empty">관리자 권한이 필요합니다.</div>`;
    if (state.tab === "audit") return renderAudit();
    if (state.tab === "system") return renderSystem();
    const rows = Object.entries(state.data.profiles || {}).map(([uid, item]) => ({ uid, ...item }));
    const page = paginateRows("admin-users", rows);
    return `
      <section class="table-panel">
        <div class="toolbar"><h2>사용자/권한</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>사용자</th><th>이메일</th><th>역할</th><th>직원 연결</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => `
                <tr>
                  <td>${escapeHtml(item.displayName || "-")}</td>
                  <td>${escapeHtml(item.email || "-")}</td>
                  <td>${escapeHtml(item.role || "-")}</td>
                  <td>${employeeName(item.employeeId)}</td>
                  <td>${badge(item.status || "active")}</td>
                  <td>${canAdmin() ? `<button class="button" data-action="edit-profile" data-uid="${item.uid}">권한 변경</button>` : "-"}</td>
                </tr>
              `).join("") || `<tr><td colspan="6"><div class="empty">사용자 프로필이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function renderAudit() {
    const query = state.filters.auditQuery.trim().toLowerCase();
    const rows = list(state.data.auditLogs).filter((item) => !query || [item.actor, item.action, item.target].some((value) => String(value || "").toLowerCase().includes(query)));
    const page = paginateRows("audit", rows, DENSE_PAGE_SIZE);
    return `
      <section class="table-panel">
        <div class="toolbar">
          <h2>감사로그</h2>
          <div class="filters"><input data-filter="auditQuery" placeholder="작업, 대상, 사용자 검색" value="${escapeAttr(state.filters.auditQuery)}" /></div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>일시</th><th>사용자</th><th>작업</th><th>대상</th><th>경로</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => `
                <tr>
                  <td>${formatDateTime(item.at)}</td>
                  <td>${escapeHtml(item.actor || "-")}</td>
                  <td>${escapeHtml(item.action || "-")}</td>
                  <td>${escapeHtml(item.target || "-")}</td>
                  <td>${escapeHtml(item.path || "-")}</td>
                </tr>
              `).join("") || `<tr><td colspan="5"><div class="empty">감사로그가 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function renderSystem() {
    const metaData = state.data.meta || {};
    const sealImage = metaData.sealImage || "";
    return `
      <section class="grid two">
        <article class="panel">
          <div class="panel-title">
            <div><h2>회사 기본정보</h2><p>증명서와 운영 화면에 공통으로 사용됩니다.</p></div>
            ${canAdmin() ? `<button class="button" data-action="edit-company-settings">수정</button>` : ""}
          </div>
          <div class="meta-list">
            ${meta("Firebase 경로", APP_ROOT)}
            ${meta("스키마 버전", metaData.schemaVersion || SCHEMA_VERSION)}
            ${meta("회사명", metaData.companyName || "-")}
            ${meta("법인명", metaData.legalName || metaData.companyName || "-")}
            ${meta("대표자", metaData.representativeName || "-")}
            ${meta("사업자등록번호", metaData.businessNo || "-")}
            ${meta("주소", metaData.companyAddress || "-")}
            ${meta("인사 연락처", metaData.hrContact || "-")}
            ${meta("환경", metaData.environment || "-")}
            ${meta("직인", sealImage ? "등록됨" : "미등록")}
            ${meta("증명서 번호", `${metaData.certificateNoPrefix || "CERT"}-YYYY-${"0".repeat(Number(metaData.certificateNoDigits || 6))}`)}
          </div>
        </article>
        <article class="panel seal-panel">
          <div class="panel-title">
            <div><h2>증명서 직인</h2><p>등록한 이미지는 증명서 발급 문서와 인쇄본에 자동 삽입됩니다.</p></div>
          </div>
          <div class="seal-preview">
            ${sealImage ? `<img src="${escapeAttr(sealImage)}" alt="등록된 직인" />` : `<span>직인 미등록</span>`}
          </div>
          <div class="row-actions seal-actions">
            ${canAdmin() ? `<button class="button primary" data-action="upload-certificate-seal">직인 이미지 등록</button>` : ""}
            ${canAdmin() && sealImage ? `<button class="button danger" data-action="delete-certificate-seal">직인 삭제</button>` : ""}
          </div>
          <div class="notice">투명 배경 PNG 이미지를 권장합니다. 업로드 시 문서용 크기로 자동 압축되어 Firebase에 저장됩니다.</div>
        </article>
        ${renderCodeSettingsPanel()}
        <article class="panel">
          <div class="panel-title"><h2>운영 기준</h2></div>
          <div class="notice">권한은 화면 제어와 Firebase Database Rules를 함께 적용해야 운영 수준이 됩니다. 이 폴더의 database.rules.json을 Firebase Realtime Database 규칙에 반영하세요.</div>
          <div class="row-actions" style="margin-top:12px">
            <button class="button" data-action="download-backup">JSON 백업</button>
            <button class="button danger" data-action="reset-seed">운영 데이터 초기화</button>
          </div>
        </article>
      </section>
    `;
  }

  function renderCodeSettingsPanel() {
    return `
      <article class="panel full-span">
        <div class="panel-title">
          <div><h2>운영 코드 설정</h2><p>조직, 구성원 등록, 일괄 업로드, 통계 필터에서 공통으로 사용하는 기준값입니다.</p></div>
        </div>
        <div class="code-settings-grid">
          ${codeCatalog().map((item) => {
            const values = codeValues(item.key);
            return `
              <div class="code-card">
                <div>
                  <strong>${escapeHtml(item.label)}</strong>
                  <p>${escapeHtml(item.description)}</p>
                </div>
                <div class="code-values">${values.slice(0, 8).map((value) => `<span>${escapeHtml(value)}</span>`).join("")}${values.length > 8 ? `<span>+${values.length - 8}</span>` : ""}</div>
                ${canAdmin() ? `<button class="button" data-action="edit-code-list" data-id="${escapeAttr(item.key)}">수정</button>` : ""}
              </div>
            `;
          }).join("")}
        </div>
      </article>
    `;
  }

  function renderChangeLog(entityType) {
    const rows = list(state.data.auditLogs).filter((item) => item.entityType === entityType || item.path?.includes(entityType));
    const page = paginateRows(`changes-${entityType}`, rows, DENSE_PAGE_SIZE);
    return `
      <section class="table-panel">
        <div class="toolbar"><h2>변경 이력</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>일시</th><th>사용자</th><th>작업</th><th>대상</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => `
                <tr><td>${formatDateTime(item.at)}</td><td>${escapeHtml(item.actor)}</td><td>${escapeHtml(item.action)}</td><td>${escapeHtml(item.target)}</td></tr>
              `).join("") || `<tr><td colspan="4"><div class="empty">변경 이력이 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function handleClick(event) {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.closeModal !== undefined) {
      closeModal();
      return;
    }
    if (target.dataset.printDocument !== undefined) {
      printModalDocument();
      return;
    }
    if (target.dataset.pageKey) {
      state.pagination[target.dataset.pageKey] = Number(target.dataset.pageValue || 1);
      render();
      return;
    }
    if (target.dataset.nav) {
      state.section = target.dataset.nav;
      state.tab = currentTabs()[0]?.id || "";
      resetPagination();
      render();
      return;
    }
    if (target.dataset.tab) {
      state.tab = target.dataset.tab;
      resetPagination();
      render();
      return;
    }
    if (target.id === "userMenuButton") {
      firebaseServices.auth.signOut();
      return;
    }
    if (target.id === "exportButton") {
      downloadJson("hr-oneflow-backup.json", state.data);
      return;
    }
    if (target.id === "primaryActionButton") {
      handlePrimaryAction();
      return;
    }
    const action = target.dataset.action;
    if (!action) return;
    const id = target.dataset.id;
    const uid = target.dataset.uid;
    const employeeId = target.dataset.employeeId;
    const actionMap = {
      "view-employee": () => { state.selectedEmployeeId = id; render(); },
      "edit-employee": () => openEmployeeForm(id),
      "delete-employee": () => deleteEmployee(id),
      "bulk-employees": () => openEmployeeBulkForm(),
      "download-employee-template": () => downloadEmployeeTemplate(),
      "upload-employee-template": () => uploadBulkExcel("employees"),
      "edit-org": () => openOrgForm(id),
      "delete-org": () => deleteOrg(id),
      "bulk-orgs": () => openOrgBulkForm(),
      "download-org-template": () => downloadOrgTemplate(),
      "upload-org-template": () => uploadBulkExcel("orgs"),
      "edit-cycle": () => openCycleForm(id),
      "delete-cycle": () => deleteCycle(id),
      "new-review-criterion": () => openReviewCriterionForm(),
      "edit-review-criterion": () => openReviewCriterionForm(id),
      "delete-review-criterion": () => deleteReviewCriterion(id),
      "new-review-grade": () => openReviewGradeForm(),
      "edit-review-grade": () => openReviewGradeForm(id),
      "delete-review-grade": () => deleteReviewGrade(id),
      "new-review-result": () => openReviewResultForm("", employeeId),
      "edit-review-result": () => openReviewResultForm(id),
      "confirm-review-result": () => updateReviewResultStatus(id, "confirmed"),
      "delete-review-result": () => deleteReviewResult(id),
      "edit-comp-plan": () => openCompPlanForm(id),
      "delete-comp-plan": () => deleteCompPlan(id),
      "approve-comp-plan": () => updateCompPlanStatus(id, "approved"),
      "generate-comp-items": () => generateCompItemsFromPlan(id),
      "new-comp-rule": () => openCompRuleForm(),
      "edit-comp-rule": () => openCompRuleForm(id),
      "delete-comp-rule": () => deleteCompRule(id),
      "new-comp-item": () => openCompItemForm("", id),
      "edit-comp-item": () => openCompItemForm(id),
      "approve-comp-item": () => updateCompItemStatus(id, "approved"),
      "delete-comp-item": () => deleteCompItem(id),
      "edit-salary": () => openSalaryForm(employeeId),
      "delete-salary": () => deleteSalary(employeeId),
      "issue-certificate-for-employee": () => openCertificateForm(employeeId),
      "edit-profile": () => openProfileForm(uid),
      "edit-certificate-template": () => openCertificateTemplateForm(id),
      "preview-certificate-template": () => previewCertificateTemplate(id),
      "preview-certificate-issued": () => previewCertificateIssued(id),
      "delete-certificate-template": () => deleteCertificateTemplate(id),
      "delete-certificate-issued": () => deleteCertificateIssued(id),
      "edit-company-settings": () => openCompanySettingsForm(),
      "upload-certificate-seal": uploadCertificateSeal,
      "delete-certificate-seal": deleteCertificateSeal,
      "edit-code-list": () => openCodeListForm(id),
      "download-backup": () => downloadJson("hr-oneflow-backup.json", state.data),
      "reset-seed": resetSeedData
    };
    actionMap[action]?.();
  }

  function handleInput(event) {
    const key = event.target.dataset.filter;
    if (!key) return;
    state.filters[key] = event.target.value;
    resetPagination();
    render();
  }

  function handlePrimaryAction() {
    if (!primaryActionAllowed()) return;
    if (state.section === "orgs" && state.tab === "people") return openEmployeeForm();
    if (state.section === "orgs") return openOrgForm();
    if (state.section === "reviews" && state.tab === "criteria") return openReviewCriterionForm();
    if (state.section === "reviews" && state.tab === "results") return openReviewResultForm();
    if (state.section === "reviews") return openCycleForm();
    if (state.section === "compensation" && state.tab === "rules") return openCompRuleForm();
    if (state.section === "compensation" && state.tab === "salary") return openSalaryForm();
    if (state.section === "compensation" && state.tab === "items") return openCompItemForm();
    if (state.section === "compensation") return openCompPlanForm();
    if (state.section === "stats") return downloadJson("hr-oneflow-stats.json", state.data);
    if (state.section === "certificates" && state.tab === "templates") return openCertificateTemplateForm();
    if (state.section === "certificates") return openCertificateForm();
    if (state.section === "admin" && state.tab === "system") return openCompanySettingsForm();
    if (state.section === "admin") return downloadJson("hr-oneflow-backup.json", state.data);
    return openEmployeeForm();
  }

  function primaryActionLabel() {
    if (state.section === "orgs" && state.tab === "people") return "구성원 등록";
    if (state.section === "reviews" && state.tab === "criteria") return "평가 기준 추가";
    if (state.section === "reviews" && state.tab === "results") return "평가 결과 입력";
    if (state.section === "reviews") return "평가 사이클";
    if (state.section === "compensation" && state.tab === "rules") return "보상 기준 추가";
    if (state.section === "compensation" && state.tab === "items") return "대상자 추가";
    if (state.section === "compensation" && state.tab === "salary") return "연봉 수정";
    if (state.section === "stats") return "통계 내보내기";
    if (state.section === "certificates" && state.tab === "templates") return "템플릿 등록";
    if (state.section === "certificates") return "증명서 발급";
    if (state.section === "admin" && state.tab === "system") return "회사정보 수정";
    return SECTION_META[state.section]?.action || "등록";
  }

  function primaryActionAllowed() {
    if (state.section === "dashboard") return canWrite("employees");
    if (state.section === "compensation" && state.tab === "salary") return canWriteSalary();
    if (state.section === "stats") return true;
    if (state.section === "admin" && state.tab === "system") return canAdmin();
    if (state.section === "admin") return isAdminLike();
    if (state.section === "certificates" && state.tab === "templates") return canIssueCertificate();
    if (state.section === "certificates") return canIssueCertificate();
    return canWrite(state.section);
  }

  function canExport() {
    return isAdminLike();
  }

  function openEmployeeForm(id = "") {
    if (!canWrite("employees")) return toast("직원 수정 권한이 없습니다.");
    const item = id ? state.data.employees[id] : {};
    openForm({
      title: id ? "직원 수정" : "직원 등록",
      fields: [
        { name: "name", label: "성명", required: true, value: item.name },
        { name: "employeeNo", label: "사번", required: true, value: item.employeeNo },
        { name: "email", label: "이메일", type: "email", required: true, value: item.email },
        { name: "orgId", label: "조직", type: "select", required: true, value: item.orgId, options: orgOptions() },
        { name: "jobTitle", label: "직무", required: true, value: item.jobTitle },
        { name: "jobFamily", label: "직군", type: "select", value: item.jobFamily || codeValues("jobFamilies")[0] || "", options: codeSelectOptions("jobFamilies", item.jobFamily) },
        { name: "grade", label: "직급", type: "select", value: item.grade || codeValues("grades")[0] || "", options: codeSelectOptions("grades", item.grade) },
        { name: "gender", label: "성별", type: "select", value: item.gender || "", options: [{ value: "", label: "미입력" }, "남성", "여성", "기타"].map((value) => typeof value === "string" ? toOption(value) : value) },
        { name: "birthDate", label: "생년월일", type: "date", value: item.birthDate },
        { name: "employmentType", label: "고용형태", type: "select", value: item.employmentType || codeValues("employmentTypes")[0] || "정규직", options: codeSelectOptions("employmentTypes", item.employmentType) },
        { name: "role", label: "역할", type: "select", value: item.role || "구성원", options: ROLE_LABELS.map(toOption) },
        { name: "status", label: "재직상태", type: "select", value: item.status || codeValues("employeeStatuses")[0] || "재직", options: codeSelectOptions("employeeStatuses", item.status) },
        { name: "hireDate", label: "입사일", type: "date", value: item.hireDate },
        { name: "phone", label: "연락처", value: item.phone },
        { name: "memo", label: "메모", type: "textarea", full: true, value: item.memo }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["name", "employeeNo", "email", "orgId", "jobTitle"]);
        if (!isEmail(values.email)) throw new Error("이메일 형식이 올바르지 않습니다.");
        const nextId = id || makeId("emp");
        const duplicate = list(state.data.employees).find((employee) => employee.id !== nextId && sameEmail(employee.email, values.email));
        if (duplicate) throw new Error("이미 등록된 이메일입니다.");
        const record = {
          ...item,
          ...values,
          id: nextId,
          createdAt: item.createdAt || nowStamp(),
          updatedAt: nowStamp()
        };
        await writeUpdates({ [`employees/${nextId}`]: record }, id ? "직원 수정" : "직원 등록", record.name, "employee");
        state.selectedEmployeeId = nextId;
        toast("직원 정보가 저장되었습니다.");
      }
    });
  }

  function openOrgForm(id = "") {
    if (!canWrite("orgs")) return toast("조직 수정 권한이 없습니다.");
    const item = id ? state.data.orgs[id] : {};
    openForm({
      title: id ? "조직 수정" : "조직 등록",
      fields: [
        { name: "name", label: "조직명", required: true, value: item.name },
        { name: "parentId", label: "상위조직", type: "select", value: item.parentId || "", options: [{ value: "", label: "없음" }, ...orgOptions(id)] },
        { name: "leaderId", label: "조직장", type: "select", value: item.leaderId || "", options: [{ value: "", label: "미지정" }, ...employeeOptions()] },
        { name: "site", label: "사업장", type: "select", value: item.site || codeValues("sites")[0] || "서울 본사", options: codeSelectOptions("sites", item.site) },
        { name: "headcount", label: "정원", type: "number", value: item.headcount || 0 },
        { name: "status", label: "상태", type: "select", value: item.status || "active", options: ["active", "inactive"].map(toOption) }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["name"]);
        const nextId = id || makeId("org");
        const record = { ...item, ...values, id: nextId, headcount: Number(values.headcount || 0), updatedAt: nowStamp(), createdAt: item.createdAt || nowStamp() };
        await writeUpdates({ [`orgs/${nextId}`]: record }, id ? "조직 수정" : "조직 등록", record.name, "org");
        toast("조직 정보가 저장되었습니다.");
      }
    });
  }

  function openOrgBulkForm() {
    if (!canWrite("orgs")) return toast("조직 일괄등록 권한이 없습니다.");
    openForm({
      title: "조직 일괄등록",
      fields: [
        {
          name: "bulkText",
          label: "붙여넣기 데이터",
          type: "textarea",
          full: true,
          required: true,
          placeholder: "조직명,상위조직명,조직장,사업장,정원,상태\n제품개발실,대표이사,DEV-014,서울 본사,12,active\n성장사업팀,대표이사,GRO-007,서울 본사,7,active"
        }
      ],
      onSubmit: async (values) => {
        const rows = parseDelimitedRows(values.bulkText);
        return previewBulkImport("orgs", rows, "붙여넣기 데이터");
      }
    });
  }

  function openEmployeeBulkForm() {
    if (!canWrite("employees")) return toast("구성원 일괄등록 권한이 없습니다.");
    openForm({
      title: "구성원 일괄등록",
      fields: [
        {
          name: "bulkText",
          label: "붙여넣기 데이터",
          type: "textarea",
          full: true,
          required: true,
          placeholder: "사번,성명,이메일,조직명,직무,직군,직급,성별,생년월일,고용형태,재직상태,입사일,연락처,역할\nDEV-030,홍길동,gildong.hong@example.com,제품개발실,Backend Engineer,개발직,S2,남성,1994-05-20,정규직,재직,2026-04-01,010-0000-0000,구성원"
        }
      ],
      onSubmit: async (values) => {
        const rows = parseDelimitedRows(values.bulkText);
        return previewBulkImport("employees", rows, "붙여넣기 데이터");
      }
    });
  }

  function previewBulkImport(type, rows, sourceName = "") {
    const plan = type === "orgs" ? buildOrgImportPlan(rows, sourceName) : buildEmployeeImportPlan(rows, sourceName);
    openBulkImportPreview(plan);
    return false;
  }

  async function saveBulkOrgs(rows) {
    const plan = buildOrgImportPlan(rows);
    if (plan.errorCount) throw new Error(firstImportError(plan));
    await commitBulkImportPlan(plan);
  }

  async function saveBulkEmployees(rows) {
    const plan = buildEmployeeImportPlan(rows);
    if (plan.errorCount) throw new Error(firstImportError(plan));
    await commitBulkImportPlan(plan);
  }

  function buildOrgImportPlan(rows, sourceName = "") {
    if (!rows.length) throw new Error("등록할 조직 데이터가 없습니다.");
    const plan = createBulkImportPlan("orgs", "조직", sourceName);
    const now = nowStamp();
    const orgNameMap = new Map(list(state.data.orgs).map((org) => [normalizeKey(org.name), org.id]));
    const fileNameMap = new Map();
    const sites = codeValues("sites");
    const staged = rows.map((row, index) => {
      const [name = "", parentName = "", leaderKey = "", site = "", headcount = "", status = ""] = row;
      const errors = [];
      const warnings = [];
      const key = normalizeKey(name);
      let id = "";
      if (!name) errors.push("조직명은 필수입니다.");
      if (key && fileNameMap.has(key)) errors.push(`${fileNameMap.get(key).rowNumber}행과 조직명이 중복됩니다.`);
      if (key && !fileNameMap.has(key)) {
        id = orgNameMap.get(key) || makeId("org");
        fileNameMap.set(key, { id, rowNumber: index + 1 });
        orgNameMap.set(key, id);
      }
      const item = {
        rowNumber: index + 1,
        key: name || "(조직명 없음)",
        action: state.data.orgs[id] ? "수정" : "신규",
        errors,
        warnings,
        data: { id, name, parentName, leaderKey, site, headcount, status }
      };
      plan.rows.push(item);
      return item;
    });

    staged.forEach((item) => {
      const { id, name, parentName, leaderKey, site, headcount, status } = item.data;
      if (item.errors.length) return;
      const parentId = parentName ? orgNameMap.get(normalizeKey(parentName)) || "" : "";
      if (parentName && !parentId) item.errors.push(`상위조직 '${parentName}'을 찾을 수 없습니다.`);
      if (parentId && parentId === id) item.errors.push("상위조직은 자기 자신으로 지정할 수 없습니다.");
      const leaderId = leaderKey ? resolveEmployeeId(leaderKey) : "";
      if (leaderKey && !leaderId) item.warnings.push(`조직장 '${leaderKey}'을 찾지 못해 미지정으로 저장됩니다.`);
      const headcountValue = headcount === "" ? null : Number(headcount);
      if (headcount !== "" && (!Number.isFinite(headcountValue) || headcountValue < 0)) item.errors.push("정원은 0 이상의 숫자로 입력하세요.");
      const normalizedStatus = normalizeOrgStatus(status);
      if (status && !normalizedStatus) item.warnings.push("상태는 active 또는 inactive만 허용되어 기존값/active로 저장됩니다.");
      const normalizedSite = normalizeAllowedValue(site, sites);
      if (site && !normalizedSite) item.warnings.push(`사업장 '${site}'은 등록된 코드가 아니어서 기존값/${sites[0] || "서울 본사"}로 저장됩니다.`);
      if (item.errors.length) return;
      const current = state.data.orgs[id] || {};
      const record = {
        ...current,
        id,
        name,
        parentId,
        leaderId,
        site: normalizedSite || current.site || sites[0] || "서울 본사",
        headcount: headcountValue === null ? Number(current.headcount || 0) : headcountValue,
        status: normalizedStatus || current.status || "active",
        createdAt: current.createdAt || now,
        updatedAt: now
      };
      item.record = record;
      plan.updates[`orgs/${id}`] = record;
    });
    return finalizeBulkImportPlan(plan);
  }

  function buildEmployeeImportPlan(rows, sourceName = "") {
    if (!rows.length) throw new Error("등록할 구성원 데이터가 없습니다.");
    const plan = createBulkImportPlan("employees", "구성원", sourceName);
    const now = nowStamp();
    const existingByNo = new Map();
    const existingByEmail = new Map();
    const fileNoMap = new Map();
    const fileEmailMap = new Map();
    const employmentTypes = codeValues("employmentTypes");
    const employeeStatuses = codeValues("employeeStatuses");
    const jobFamilies = codeValues("jobFamilies");
    const grades = codeValues("grades");
    list(state.data.employees).forEach((item) => {
      if (item.employeeNo) existingByNo.set(normalizeKey(item.employeeNo), item.id);
      if (item.email) existingByEmail.set(normalizeKey(item.email), item.id);
    });

    rows.forEach((row, index) => {
      const [employeeNo = "", name = "", email = "", orgKey = "", jobTitle = "", jobFamily = "", grade = "", gender = "", birthDate = "", employmentType = "", status = "", hireDate = "", phone = "", role = ""] = row;
      const errors = [];
      const warnings = [];
      if (!employeeNo || !name || !email || !orgKey) errors.push("사번, 성명, 이메일, 조직명은 필수입니다.");
      if (email && !isEmail(email)) errors.push("이메일 형식이 올바르지 않습니다.");
      const noKey = normalizeKey(employeeNo);
      const emailKey = normalizeKey(email);
      if (noKey && fileNoMap.has(noKey)) errors.push(`${fileNoMap.get(noKey)}행과 사번이 중복됩니다.`);
      if (emailKey && fileEmailMap.has(emailKey)) errors.push(`${fileEmailMap.get(emailKey)}행과 이메일이 중복됩니다.`);
      if (noKey) fileNoMap.set(noKey, index + 1);
      if (emailKey) fileEmailMap.set(emailKey, index + 1);
      const existingNoId = noKey ? existingByNo.get(noKey) : "";
      const existingEmailId = emailKey ? existingByEmail.get(emailKey) : "";
      if (existingNoId && existingEmailId && existingNoId !== existingEmailId) errors.push("사번과 이메일이 서로 다른 기존 구성원에 연결되어 있습니다.");
      const id = existingNoId || existingEmailId || makeId("emp");
      const orgId = resolveOrgId(orgKey);
      if (orgKey && !orgId) errors.push(`조직 '${orgKey}'을 찾을 수 없습니다.`);
      if (birthDate && !isDateLike(birthDate)) errors.push("생년월일은 YYYY-MM-DD 형식으로 입력하세요.");
      if (hireDate && !isDateLike(hireDate)) errors.push("입사일은 YYYY-MM-DD 형식으로 입력하세요.");
      const normalizedEmploymentType = normalizeAllowedValue(employmentType, employmentTypes);
      if (employmentType && !normalizedEmploymentType) warnings.push(`고용형태 '${employmentType}'은 등록된 코드가 아니어서 기존값/정규직으로 저장됩니다.`);
      const normalizedStatus = normalizeAllowedValue(status, employeeStatuses);
      if (status && !normalizedStatus) warnings.push(`재직상태 '${status}'은 등록된 코드가 아니어서 기존값/재직으로 저장됩니다.`);
      const normalizedGender = normalizeAllowedValue(gender, ["남성", "여성", "기타"]);
      if (gender && !normalizedGender) warnings.push(`성별 '${gender}'은 허용값이 아니어서 빈 값으로 저장됩니다.`);
      const normalizedJobFamily = normalizeAllowedValue(jobFamily, jobFamilies);
      if (jobFamily && !normalizedJobFamily) warnings.push(`직군 '${jobFamily}'은 등록된 코드가 아니어서 기존값/빈 값으로 저장됩니다.`);
      const normalizedGrade = normalizeAllowedValue(grade, grades);
      if (grade && !normalizedGrade) warnings.push(`직급 '${grade}'은 등록된 코드가 아니어서 기존값/빈 값으로 저장됩니다.`);
      const normalizedRole = normalizeRole(role);
      if (role && !normalizedRole) warnings.push(`역할 '${role}'은 등록된 역할이 아니어서 기존값/구성원으로 저장됩니다.`);
      const current = state.data.employees[id] || {};
      const item = {
        rowNumber: index + 1,
        key: employeeNo || email || "(사번 없음)",
        action: state.data.employees[id] ? "수정" : "신규",
        errors,
        warnings
      };
      if (!errors.length) {
        const record = {
          ...current,
          id,
          employeeNo,
          name,
          email,
          orgId,
          jobTitle: jobTitle || current.jobTitle || "-",
          jobFamily: normalizedJobFamily || current.jobFamily || "",
          grade: normalizedGrade || current.grade || "",
          gender: normalizedGender || current.gender || "",
          birthDate: birthDate || current.birthDate || "",
          employmentType: normalizedEmploymentType || current.employmentType || "정규직",
          status: normalizedStatus || current.status || "재직",
          hireDate: hireDate || current.hireDate || "",
          phone: phone || current.phone || "",
          role: normalizedRole || current.role || "구성원",
          createdAt: current.createdAt || now,
          updatedAt: now
        };
        item.record = record;
        plan.updates[`employees/${id}`] = record;
      }
      plan.rows.push(item);
    });
    return finalizeBulkImportPlan(plan);
  }

  function createBulkImportPlan(type, label, sourceName = "") {
    return {
      type,
      label,
      sourceName,
      rows: [],
      updates: {},
      createCount: 0,
      updateCount: 0,
      validCount: 0,
      errorCount: 0,
      warningCount: 0,
      action: `${label} 엑셀 일괄등록`,
      entityType: type === "orgs" ? "org" : "employee"
    };
  }

  function finalizeBulkImportPlan(plan) {
    plan.rows.forEach((row) => {
      row.status = row.errors.length ? "오류" : row.warnings.length ? "확인 필요" : "정상";
    });
    plan.errorCount = plan.rows.filter((row) => row.errors.length).length;
    plan.warningCount = plan.rows.filter((row) => row.warnings.length).length;
    plan.validCount = plan.rows.filter((row) => !row.errors.length).length;
    plan.createCount = plan.rows.filter((row) => !row.errors.length && row.action === "신규").length;
    plan.updateCount = plan.rows.filter((row) => !row.errors.length && row.action === "수정").length;
    return plan;
  }

  function openBulkImportPreview(plan) {
    const shownRows = plan.rows.slice(0, 120);
    const hasErrors = plan.errorCount > 0;
    els.modalRoot.classList.remove("hidden");
    els.modalRoot.innerHTML = `
      <section class="modal bulk-modal" role="dialog" aria-modal="true">
        <header>
          <h2>${escapeHtml(plan.label)} 일괄등록 미리보기</h2>
          <p>${escapeHtml(plan.sourceName || "업로드 데이터")} · 오류가 없을 때만 저장할 수 있습니다.</p>
        </header>
        <div class="bulk-body">
          <div class="bulk-summary">
            ${bulkMetric("전체", `${plan.rows.length}행`)}
            ${bulkMetric("저장 가능", `${plan.validCount}행`)}
            ${bulkMetric("신규", `${plan.createCount}건`)}
            ${bulkMetric("수정", `${plan.updateCount}건`)}
            ${bulkMetric("오류", `${plan.errorCount}건`, plan.errorCount ? "danger" : "ok")}
            ${bulkMetric("확인 필요", `${plan.warningCount}건`, plan.warningCount ? "warn" : "ok")}
          </div>
          ${hasErrors ? `<div class="notice danger">오류가 있는 행은 저장할 수 없습니다. 파일을 수정한 뒤 다시 업로드하세요.</div>` : ""}
          <div class="table-wrap bulk-table-wrap">
            <table>
              <thead><tr><th>행</th><th>구분</th><th>키</th><th>상태</th><th>검증 결과</th></tr></thead>
              <tbody>
                ${shownRows.map((row) => `
                  <tr class="${row.errors.length ? "import-error" : row.warnings.length ? "import-warning" : ""}">
                    <td data-label="행">${row.rowNumber}</td>
                    <td data-label="구분">${escapeHtml(row.action)}</td>
                    <td data-label="키">${escapeHtml(row.key)}</td>
                    <td data-label="상태">${importStatus(row)}</td>
                    <td data-label="검증 결과"><div class="import-messages">${importMessages(row)}</div></td>
                  </tr>
                `).join("")}
                ${plan.rows.length > shownRows.length ? `<tr><td colspan="5"><div class="empty">이외 ${plan.rows.length - shownRows.length}행이 더 있습니다.</div></td></tr>` : ""}
              </tbody>
            </table>
          </div>
        </div>
        <footer>
          <button class="button" type="button" data-close-modal>취소</button>
          <button class="button primary" type="button" id="bulkImportApply" ${hasErrors || !plan.validCount ? "disabled" : ""}>저장 반영</button>
        </footer>
      </section>
    `;
    els.modalRoot.querySelector("[data-close-modal]").onclick = closeModal;
    const applyButton = byId("bulkImportApply");
    if (applyButton) {
      applyButton.onclick = async () => {
        applyButton.disabled = true;
        try {
          await commitBulkImportPlan(plan);
          closeModal();
        } catch (error) {
          applyButton.disabled = false;
          toast(error.message || String(error));
        }
      };
    }
  }

  function bulkMetric(label, value, level = "") {
    return `<div class="bulk-metric ${level}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function importStatus(row) {
    const cls = row.errors.length ? "danger" : row.warnings.length ? "warn" : "ok";
    return `<span class="import-status ${cls}">${escapeHtml(row.status)}</span>`;
  }

  function importMessages(row) {
    const messages = [
      ...row.errors.map((message) => ({ type: "error", message })),
      ...row.warnings.map((message) => ({ type: "warn", message }))
    ];
    if (!messages.length) return `<span class="muted">문제 없음</span>`;
    return messages.map((item) => `<span class="${item.type}">${escapeHtml(item.message)}</span>`).join("");
  }

  async function commitBulkImportPlan(plan) {
    if (plan.errorCount) throw new Error("오류가 있는 일괄등록은 저장할 수 없습니다.");
    if (!plan.validCount) throw new Error("저장할 수 있는 행이 없습니다.");
    const updates = { ...plan.updates };
    await writeUpdates(updates, plan.action, `${plan.validCount}건`, plan.entityType);
    toast(`${plan.label} ${plan.validCount}건이 저장되었습니다. 신규 ${plan.createCount}건, 수정 ${plan.updateCount}건`);
  }

  function firstImportError(plan) {
    const row = plan.rows.find((item) => item.errors.length);
    return row ? `${row.rowNumber}행: ${row.errors[0]}` : "일괄등록 데이터에 오류가 있습니다.";
  }

  function normalizeOrgStatus(value) {
    const key = normalizeKey(value);
    if (!key) return "";
    const aliases = { active: "active", inactive: "inactive", "활성": "active", "비활성": "inactive" };
    return aliases[key] || "";
  }

  function normalizeAllowedValue(value, allowedValues) {
    const key = normalizeKey(value);
    if (!key) return "";
    return allowedValues.find((item) => normalizeKey(item) === key) || "";
  }

  function normalizeRole(value) {
    return normalizeAllowedValue(value, ROLE_LABELS);
  }

  function isDateLike(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function openCycleForm(id = "") {
    if (!canWrite("reviews")) return toast("평가 권한이 없습니다.");
    const item = id ? state.data.reviews.cycles[id] : {};
    openForm({
      title: id ? "평가 사이클 수정" : "평가 사이클 등록",
      fields: [
        { name: "title", label: "사이클명", required: true, value: item.title },
        { name: "period", label: "기간", required: true, value: item.period || "2026 상반기" },
        { name: "targetCount", label: "대상 인원", type: "number", value: item.targetCount || visibleEmployees().length },
        { name: "progress", label: "진행률", type: "number", value: item.progress || 0 },
        { name: "status", label: "상태", type: "select", value: item.status || "planning", options: ["planning", "open", "closed", "confirmed"].map(toOption) }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["title", "period"]);
        const nextId = id || makeId("cycle");
        const record = { ...item, ...values, id: nextId, targetCount: Number(values.targetCount || 0), progress: Number(values.progress || 0), updatedAt: nowStamp(), createdAt: item.createdAt || nowStamp() };
        await writeUpdates({ [`reviews/cycles/${nextId}`]: record }, id ? "평가 사이클 수정" : "평가 사이클 등록", record.title, "reviewCycle");
        toast("평가 사이클이 저장되었습니다.");
      }
    });
  }

  function openReviewCriterionForm(id = "") {
    if (!canWrite("reviews")) return toast("평가 기준 관리 권한이 없습니다.");
    const item = id ? state.data.settings.reviewCriteria[id] || reviewCriteriaRows().find((row) => row.id === id) || {} : {};
    openForm({
      title: id ? "평가 항목 기준 수정" : "평가 항목 기준 추가",
      fields: [
        { name: "name", label: "항목명", required: true, value: item.name || "" },
        { name: "category", label: "영역", required: true, value: item.category || "성과" },
        { name: "weight", label: "가중치(%)", type: "number", required: true, value: item.weight ?? 0 },
        { name: "status", label: "상태", type: "select", value: item.status || "active", options: ["active", "inactive"].map(toOption) },
        { name: "description", label: "설명", type: "textarea", full: true, value: item.description || "" }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["name", "category", "weight"]);
        const weight = Number(values.weight || 0);
        if (weight < 0 || weight > 100) throw new Error("가중치는 0~100 사이로 입력하세요.");
        const nextId = id || makeId("criterion");
        const record = { ...item, ...values, id: nextId, weight, updatedAt: nowStamp(), createdAt: item.createdAt || nowStamp() };
        await writeUpdates({ [`settings/reviewCriteria/${nextId}`]: record }, id ? "평가 항목 기준 수정" : "평가 항목 기준 추가", record.name, "reviewCriterion");
        toast("평가 항목 기준이 저장되었습니다.");
      }
    });
  }

  function openReviewGradeForm(id = "") {
    if (!canWrite("reviews")) return toast("평가 등급 기준 관리 권한이 없습니다.");
    const item = id ? state.data.settings.reviewGrades[id] || reviewGradeRows().find((row) => row.id === id) || {} : {};
    openForm({
      title: id ? "평가 등급 기준 수정" : "평가 등급 기준 추가",
      fields: [
        { name: "grade", label: "등급", required: true, value: item.grade || "" },
        { name: "scoreMin", label: "최소 점수", type: "number", required: true, value: item.scoreMin ?? 0 },
        { name: "scoreMax", label: "최대 점수", type: "number", required: true, value: item.scoreMax ?? 100 },
        { name: "targetRatio", label: "목표 분포(%)", type: "number", value: item.targetRatio ?? 0 },
        { name: "status", label: "상태", type: "select", value: item.status || "active", options: ["active", "inactive"].map(toOption) },
        { name: "description", label: "설명", type: "textarea", full: true, value: item.description || "" }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["grade", "scoreMin", "scoreMax"]);
        const scoreMin = Number(values.scoreMin || 0);
        const scoreMax = Number(values.scoreMax || 0);
        if (scoreMin < 0 || scoreMax > 100 || scoreMin > scoreMax) throw new Error("점수 구간은 0~100 사이의 올바른 범위로 입력하세요.");
        const nextId = id || `grade-${values.grade.toLowerCase()}-${Date.now().toString(36)}`;
        const record = { ...item, ...values, id: nextId, scoreMin, scoreMax, targetRatio: Number(values.targetRatio || 0), updatedAt: nowStamp(), createdAt: item.createdAt || nowStamp() };
        await writeUpdates({ [`settings/reviewGrades/${nextId}`]: record }, id ? "평가 등급 기준 수정" : "평가 등급 기준 추가", record.grade, "reviewGrade");
        toast("평가 등급 기준이 저장되었습니다.");
      }
    });
  }

  function openReviewResultForm(id = "", presetEmployeeId = "") {
    if (!canWrite("reviews")) return toast("평가 결과 입력 권한이 없습니다.");
    const item = id ? state.data.reviews.results[id] : {};
    const employeeId = item.employeeId || presetEmployeeId || visibleEmployees()[0]?.id || "";
    openForm({
      title: id ? "평가 결과 수정" : "평가 결과 입력",
      fields: [
        { name: "cycleId", label: "평가 사이클", type: "select", required: true, value: item.cycleId || list(state.data.reviews.cycles)[0]?.id || "", options: list(state.data.reviews.cycles).map((cycle) => ({ value: cycle.id, label: cycle.title })) },
        { name: "employeeId", label: "대상자", type: "select", required: true, value: employeeId, options: employeeOptions(employeeId) },
        { name: "grade", label: "평가 등급", type: "select", required: true, value: item.grade || "B", options: reviewGradeRows().map((row) => ({ value: row.grade, label: `${row.grade} (${row.scoreMin}~${row.scoreMax}점)` })) },
        { name: "score", label: "평가 점수", type: "number", required: true, value: item.score || 80 },
        { name: "status", label: "상태", type: "select", value: item.status || "draft", options: ["draft", "review", "confirmed"].map(toOption) },
        { name: "comment", label: "평가 메모", type: "textarea", full: true, value: item.comment || "" }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["cycleId", "employeeId", "grade", "score"]);
        const score = Number(values.score || 0);
        if (score < 0 || score > 100) throw new Error("평가 점수는 0~100 사이로 입력하세요.");
        const nextId = id || makeId("result");
        const record = {
          ...item,
          ...values,
          id: nextId,
          score,
          updatedAt: nowStamp(),
          createdAt: item.createdAt || nowStamp(),
          updatedBy: currentProfile().uid
        };
        await writeUpdates({ [`reviews/results/${nextId}`]: record }, id ? "평가 결과 수정" : "평가 결과 입력", `${employeeName(record.employeeId)} ${record.grade}`, "reviewResult");
        toast("평가 결과가 저장되었습니다.");
      }
    });
  }

  async function updateReviewResultStatus(id, status) {
    if (!canWrite("reviews")) return toast("평가 결과 처리 권한이 없습니다.");
    const item = state.data.reviews.results[id];
    if (!item) return;
    await writeUpdates({
      [`reviews/results/${id}/status`]: status,
      [`reviews/results/${id}/updatedAt`]: nowStamp(),
      [`reviews/results/${id}/updatedBy`]: currentProfile().uid
    }, status === "confirmed" ? "평가 결과 확정" : "평가 결과 상태 변경", employeeName(item.employeeId), "reviewResult");
    toast(status === "confirmed" ? "평가 결과가 확정되었습니다." : "평가 결과 상태가 변경되었습니다.");
  }

  async function deleteReviewResult(id) {
    if (!canWrite("reviews")) return toast("평가 결과 삭제 권한이 없습니다.");
    const item = state.data.reviews.results[id];
    if (!item) return;
    if (!confirm(`${employeeName(item.employeeId)}의 평가 결과를 삭제할까요?`)) return;
    await writeUpdates({ [`reviews/results/${id}`]: null }, "평가 결과 삭제", employeeName(item.employeeId), "reviewResult");
    toast("평가 결과가 삭제되었습니다.");
  }

  function openCompPlanForm(id = "") {
    if (!canWrite("compensation")) return toast("보상 권한이 없습니다.");
    const item = id ? state.data.compensationPlans[id] : {};
    openForm({
      title: id ? "보상안 수정" : "보상안 등록",
      fields: [
        { name: "title", label: "보상안명", required: true, value: item.title },
        { name: "cycleId", label: "평가 사이클", type: "select", value: item.cycleId, options: list(state.data.reviews.cycles).map((cycle) => ({ value: cycle.id, label: cycle.title })) },
        { name: "targetCount", label: "대상 인원", type: "number", value: item.targetCount || visibleEmployees().length },
        { name: "budget", label: "총 예산(원)", type: "number", value: item.budget || 0 },
        { name: "status", label: "상태", type: "select", value: item.status || "draft", options: ["draft", "review", "approved", "closed"].map(toOption) },
        { name: "memo", label: "메모", type: "textarea", full: true, value: item.memo }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["title"]);
        const nextId = id || makeId("comp");
        const record = { ...item, ...values, id: nextId, targetCount: Number(values.targetCount || 0), budget: Number(values.budget || 0), updatedAt: nowStamp(), createdAt: item.createdAt || nowStamp() };
        await writeUpdates({ [`compensationPlans/${nextId}`]: record }, id ? "보상안 수정" : "보상안 등록", record.title, "compensationPlan");
        toast("보상안이 저장되었습니다.");
      }
    });
  }

  function openCompRuleForm(id = "") {
    if (!canWrite("compensation")) return toast("보상 기준 관리 권한이 없습니다.");
    const item = id ? state.data.settings.compensationRules[id] || compensationRuleRows().find((row) => row.id === id) || {} : {};
    openForm({
      title: id ? "보상 기준 수정" : "보상 기준 추가",
      fields: [
        { name: "grade", label: "평가등급", type: "select", required: true, value: item.grade || reviewGradeRows()[0]?.grade || "A", options: reviewGradeRows().map((row) => ({ value: row.grade, label: row.grade })) },
        { name: "targetRaiseRate", label: "권장 인상률(%)", type: "number", required: true, value: item.targetRaiseRate ?? 0 },
        { name: "minRaiseRate", label: "최소 인상률(%)", type: "number", required: true, value: item.minRaiseRate ?? 0 },
        { name: "maxRaiseRate", label: "최대 인상률(%)", type: "number", required: true, value: item.maxRaiseRate ?? 0 },
        { name: "budgetWeight", label: "예산 가중치", type: "number", value: item.budgetWeight ?? 1 },
        { name: "status", label: "상태", type: "select", value: item.status || "active", options: ["active", "inactive"].map(toOption) },
        { name: "guidance", label: "운영 가이드", type: "textarea", full: true, value: item.guidance || "" }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["grade", "targetRaiseRate", "minRaiseRate", "maxRaiseRate"]);
        const minRaiseRate = Number(values.minRaiseRate || 0);
        const maxRaiseRate = Number(values.maxRaiseRate || 0);
        const targetRaiseRate = Number(values.targetRaiseRate || 0);
        if (minRaiseRate > maxRaiseRate) throw new Error("최소 인상률은 최대 인상률보다 클 수 없습니다.");
        if (targetRaiseRate < minRaiseRate || targetRaiseRate > maxRaiseRate) throw new Error("권장 인상률은 허용 범위 안에 있어야 합니다.");
        const nextId = id || `compRule-${values.grade.toLowerCase()}-${Date.now().toString(36)}`;
        const record = {
          ...item,
          ...values,
          id: nextId,
          targetRaiseRate,
          minRaiseRate,
          maxRaiseRate,
          budgetWeight: Number(values.budgetWeight || 1),
          updatedAt: nowStamp(),
          createdAt: item.createdAt || nowStamp()
        };
        await writeUpdates({ [`settings/compensationRules/${nextId}`]: record }, id ? "보상 기준 수정" : "보상 기준 추가", record.grade, "compensationRule");
        toast("보상 기준이 저장되었습니다.");
      }
    });
  }

  function openCompItemForm(id = "", presetPlanId = "") {
    if (!canWrite("compensation")) return toast("보상 조정 권한이 없습니다.");
    const item = id ? state.data.compensationItems[id] : {};
    const employeeId = item.employeeId || visibleEmployees()[0]?.id || "";
    const salary = salaryForEmployee(employeeId);
    openForm({
      title: id ? "대상자 보상 조정 수정" : "대상자 보상 조정",
      fields: [
        { name: "planId", label: "보상안", type: "select", required: true, value: item.planId || presetPlanId || list(state.data.compensationPlans)[0]?.id || "", options: list(state.data.compensationPlans).map((plan) => ({ value: plan.id, label: plan.title })) },
        { name: "employeeId", label: "대상자", type: "select", required: true, value: employeeId, options: employeeOptions(employeeId) },
        { name: "currentAnnualSalary", label: "현재 연봉(만원)", type: "number", required: true, value: item.currentAnnualSalary || salary?.annualSalary || "" },
        { name: "proposedIncrease", label: "제안 인상액(만원)", type: "number", required: true, value: item.proposedIncrease || 0 },
        { name: "proposedAnnualSalary", label: "제안 연봉(만원)", type: "number", value: item.proposedAnnualSalary || "" },
        { name: "status", label: "상태", type: "select", value: item.status || "draft", options: ["draft", "review", "approved", "closed"].map(toOption) },
        { name: "memo", label: "조정 사유", type: "textarea", full: true, value: item.memo || "" }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["planId", "employeeId", "currentAnnualSalary", "proposedIncrease"]);
        const currentAnnualSalary = Number(values.currentAnnualSalary || 0);
        const proposedIncrease = Number(values.proposedIncrease || 0);
        const proposedAnnualSalary = Number(values.proposedAnnualSalary || 0) || currentAnnualSalary + proposedIncrease;
        const raiseRate = currentAnnualSalary ? Math.round((proposedIncrease / currentAnnualSalary) * 1000) / 10 : 0;
        const nextId = id || makeId("compItem");
        const record = {
          ...item,
          ...values,
          id: nextId,
          currentAnnualSalary,
          proposedIncrease,
          proposedAnnualSalary,
          raiseRate,
          updatedAt: nowStamp(),
          createdAt: item.createdAt || nowStamp(),
          updatedBy: currentProfile().uid
        };
        await writeUpdates({ [`compensationItems/${nextId}`]: record }, id ? "보상 대상자 수정" : "보상 대상자 추가", `${employeeName(record.employeeId)} ${money(proposedIncrease)}만원`, "compensationItem");
        toast("대상자 보상 조정이 저장되었습니다.");
      }
    });
  }

  async function generateCompItemsFromPlan(planId) {
    if (!canWrite("compensation")) return toast("보상안 자동 생성 권한이 없습니다.");
    const plan = state.data.compensationPlans[planId];
    if (!plan) return toast("보상안을 찾을 수 없습니다.");
    const confirmedResults = list(state.data.reviews.results)
      .filter((item) => !item.derived && item.cycleId === plan.cycleId && item.status === "confirmed");
    if (!confirmedResults.length) return toast("확정된 평가 결과가 없어 자동 생성할 수 없습니다.");

    const existingEmployees = new Set(list(state.data.compensationItems)
      .filter((item) => item.planId === planId)
      .map((item) => item.employeeId));
    const allowedEmployees = new Set(visibleEmployees().filter((item) => item.status !== "퇴직").map((item) => item.id));
    const updates = {};
    let created = 0;
    let skippedExisting = 0;
    let skippedSalary = 0;
    let skippedRule = 0;

    confirmedResults.forEach((result) => {
      if (!allowedEmployees.has(result.employeeId)) return;
      if (existingEmployees.has(result.employeeId)) {
        skippedExisting += 1;
        return;
      }
      const salary = salaryForEmployee(result.employeeId);
      if (!salary?.annualSalary) {
        skippedSalary += 1;
        return;
      }
      const rule = compensationRuleForGrade(result.grade);
      if (!rule || rule.status === "inactive") {
        skippedRule += 1;
        return;
      }
      const currentAnnualSalary = Number(salary.annualSalary || 0);
      const raiseRate = Number(rule.targetRaiseRate || 0);
      const proposedIncrease = Math.round(currentAnnualSalary * raiseRate / 100);
      const proposedAnnualSalary = currentAnnualSalary + proposedIncrease;
      const id = makeId("compItem");
      updates[`compensationItems/${id}`] = {
        id,
        planId,
        employeeId: result.employeeId,
        reviewResultId: result.id,
        ruleId: rule.id || "",
        currentAnnualSalary,
        proposedIncrease,
        proposedAnnualSalary,
        raiseRate,
        status: "draft",
        memo: `평가등급 ${result.grade} / 권장 인상률 ${raiseRate}% 기준 자동 생성`,
        createdAt: nowStamp(),
        updatedAt: nowStamp(),
        updatedBy: currentProfile().uid
      };
      existingEmployees.add(result.employeeId);
      created += 1;
    });

    if (!created) {
      return toast(`생성할 대상자가 없습니다. 중복 ${skippedExisting}명, 연봉정보 없음 ${skippedSalary}명, 보상기준 없음 ${skippedRule}명`);
    }
    updates[`compensationPlans/${planId}/targetCount`] = existingEmployees.size;
    updates[`compensationPlans/${planId}/updatedAt`] = nowStamp();
    await writeUpdates(updates, "평가 결과 기반 보상 대상자 자동 생성", plan.title, "compensationItem");
    toast(`보상 대상자 ${created}명이 자동 생성되었습니다. 중복 ${skippedExisting}명, 연봉정보 없음 ${skippedSalary}명, 보상기준 없음 ${skippedRule}명`);
  }

  async function updateCompItemStatus(id, status) {
    if (!canWrite("compensation")) return toast("보상 조정 처리 권한이 없습니다.");
    const item = state.data.compensationItems[id];
    if (!item) return;
    await writeUpdates({
      [`compensationItems/${id}/status`]: status,
      [`compensationItems/${id}/updatedAt`]: nowStamp(),
      [`compensationItems/${id}/updatedBy`]: currentProfile().uid
    }, status === "approved" ? "보상 대상자 승인" : "보상 대상자 상태 변경", employeeName(item.employeeId), "compensationItem");
    toast("대상자 보상 상태가 변경되었습니다.");
  }

  async function updateCompPlanStatus(id, status) {
    if (!canWrite("compensation")) return toast("보상안 처리 권한이 없습니다.");
    const item = state.data.compensationPlans[id];
    if (!item) return;
    await writeUpdates({
      [`compensationPlans/${id}/status`]: status,
      [`compensationPlans/${id}/updatedAt`]: nowStamp()
    }, status === "approved" ? "보상안 승인" : "보상안 상태 변경", item.title, "compensationPlan");
    toast("보상안 상태가 변경되었습니다.");
  }

  async function deleteCompItem(id) {
    if (!canWrite("compensation")) return toast("보상 대상자 삭제 권한이 없습니다.");
    const item = state.data.compensationItems[id];
    if (!item) return;
    if (!confirm(`${employeeName(item.employeeId)} 대상자 조정을 삭제할까요?`)) return;
    await writeUpdates({ [`compensationItems/${id}`]: null }, "보상 대상자 삭제", employeeName(item.employeeId), "compensationItem");
    toast("대상자 보상 조정이 삭제되었습니다.");
  }

  function openSalaryForm(employeeId = "") {
    if (!canWriteSalary()) return toast("연봉 기초정보 수정 권한이 없습니다.");
    const employee = employeeId ? employeeById(employeeId) : null;
    const item = employeeId ? salaryForEmployee(employeeId) : {};
    openForm({
      title: "연봉 기초정보 수정",
      fields: [
        { name: "employeeId", label: "직원", type: "select", required: true, value: employee?.id || "", options: employeeOptions(employee?.id) },
        { name: "annualSalary", label: "연봉 수준(만원)", type: "number", required: true, value: item?.annualSalary || "" },
        { name: "payGrade", label: "보상등급", value: item?.payGrade || "" },
        { name: "effectiveDate", label: "적용일", type: "date", required: true, value: item?.effectiveDate || today() },
        { name: "reason", label: "변경 사유", type: "textarea", full: true }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["employeeId", "annualSalary", "effectiveDate"]);
        const existing = salaryForEmployee(values.employeeId);
        const id = existing?.id || `salary-${values.employeeId}`;
        const annualSalary = Number(values.annualSalary || 0);
        if (annualSalary <= 0) throw new Error("연봉 수준은 0보다 커야 합니다.");
        const record = {
          ...(existing || {}),
          id,
          employeeId: values.employeeId,
          annualSalary,
          payGrade: values.payGrade || "",
          effectiveDate: values.effectiveDate,
          updatedAt: nowStamp(),
          updatedBy: currentProfile().uid
        };
        const historyId = makeId("salaryHistory");
        await writeUpdates({
          [`salaryBasics/${id}`]: record,
          [`salaryHistory/${historyId}`]: {
            id: historyId,
            employeeId: values.employeeId,
            beforeAnnualSalary: Number(existing?.annualSalary || 0),
            afterAnnualSalary: annualSalary,
            reason: values.reason || "",
            changedAt: nowStamp(),
            changedBy: currentProfile().displayName || currentProfile().email || currentProfile().uid
          }
        }, "연봉 기초정보 변경", employeeName(values.employeeId), "salary");
        toast("연봉 기초정보가 저장되었습니다.");
      }
    });
  }

  async function deleteEmployee(id) {
    if (!canDeleteEmployee()) return toast("구성원 삭제는 시스템 관리자 권한이 필요합니다.");
    const item = state.data.employees[id];
    if (!item) return;
    if (currentProfile().employeeId === id) return toast("현재 로그인 계정과 연결된 구성원은 삭제할 수 없습니다. 관리자에서 계정 연결을 먼저 해제하세요.");
    if (!confirm(`${item.name} 구성원을 삭제할까요? 연봉 기초정보, 평가 결과, 증명서 이력도 함께 삭제됩니다.`)) return;
    const updates = { [`employees/${id}`]: null };
    list(state.data.salaryBasics).filter((row) => row.employeeId === id).forEach((row) => { updates[`salaryBasics/${row.id}`] = null; });
    list(state.data.salaryHistory).filter((row) => row.employeeId === id).forEach((row) => { updates[`salaryHistory/${row.id}`] = null; });
    list(state.data.reviews.results).filter((row) => row.employeeId === id).forEach((row) => { updates[`reviews/results/${row.id}`] = null; });
    list(state.data.compensationItems).filter((row) => row.employeeId === id).forEach((row) => { updates[`compensationItems/${row.id}`] = null; });
    list(state.data.certificates.requests).filter((row) => row.employeeId === id).forEach((row) => { updates[`certificates/requests/${row.id}`] = null; });
    list(state.data.certificates.issued).filter((row) => row.employeeId === id).forEach((row) => { updates[`certificates/issued/${row.id}`] = null; });
    Object.entries(state.data.profiles || {}).forEach(([uid, profile]) => {
      if (profile?.employeeId === id) {
        updates[`profiles/${uid}/employeeId`] = "";
        updates[`profiles/${uid}/updatedAt`] = nowStamp();
      }
    });
    await writeUpdates(updates, "구성원 삭제", item.name, "employee");
    if (state.selectedEmployeeId === id) state.selectedEmployeeId = "";
    toast("구성원과 연결 데이터가 삭제되었습니다.");
  }

  async function deleteOrg(id) {
    if (!canWrite("orgs")) return toast("조직 삭제 권한이 없습니다.");
    const item = state.data.orgs[id];
    if (!item) return;
    if (list(state.data.orgs).some((org) => org.parentId === id)) return toast("하위 조직이 있는 조직은 삭제할 수 없습니다. 하위 조직을 먼저 정리하세요.");
    if (list(state.data.employees).some((employee) => employee.orgId === id)) return toast("구성원이 배치된 조직은 삭제할 수 없습니다. 구성원 조직을 먼저 변경하세요.");
    if (!confirm(`${item.name} 조직을 삭제할까요?`)) return;
    await writeUpdates({ [`orgs/${id}`]: null }, "조직 삭제", item.name, "org");
    toast("조직이 삭제되었습니다.");
  }

  async function deleteCycle(id) {
    if (!canWrite("reviews")) return toast("평가 삭제 권한이 없습니다.");
    const item = state.data.reviews.cycles[id];
    if (!item) return;
    if (list(state.data.compensationPlans).some((plan) => plan.cycleId === id)) return toast("보상안과 연결된 평가 사이클은 삭제할 수 없습니다. 보상안을 먼저 정리하세요.");
    if (!confirm(`${item.title} 평가 사이클을 삭제할까요? 연결된 평가 결과도 함께 삭제됩니다.`)) return;
    const updates = { [`reviews/cycles/${id}`]: null };
    list(state.data.reviews.results).filter((row) => row.cycleId === id).forEach((row) => { updates[`reviews/results/${row.id}`] = null; });
    await writeUpdates(updates, "평가 사이클 삭제", item.title, "reviewCycle");
    toast("평가 사이클이 삭제되었습니다.");
  }

  async function deleteReviewCriterion(id) {
    if (!canWrite("reviews")) return toast("평가 기준 삭제 권한이 없습니다.");
    const item = state.data.settings.reviewCriteria[id];
    if (!item) return toast("삭제할 평가 항목 기준이 없습니다.");
    if (!confirm(`${item.name} 평가 항목 기준을 삭제할까요?`)) return;
    await writeUpdates({ [`settings/reviewCriteria/${id}`]: null }, "평가 항목 기준 삭제", item.name, "reviewCriterion");
    toast("평가 항목 기준이 삭제되었습니다.");
  }

  async function deleteReviewGrade(id) {
    if (!canWrite("reviews")) return toast("평가 등급 기준 삭제 권한이 없습니다.");
    const item = state.data.settings.reviewGrades[id];
    if (!item) return toast("삭제할 평가 등급 기준이 없습니다.");
    if (!confirm(`${item.grade} 등급 기준을 삭제할까요?`)) return;
    await writeUpdates({ [`settings/reviewGrades/${id}`]: null }, "평가 등급 기준 삭제", item.grade, "reviewGrade");
    toast("평가 등급 기준이 삭제되었습니다.");
  }

  async function deleteCompPlan(id) {
    if (!canWrite("compensation")) return toast("보상안 삭제 권한이 없습니다.");
    const item = state.data.compensationPlans[id];
    if (!item) return;
    if (!confirm(`${item.title} 보상안을 삭제할까요? 연결된 대상자 조정도 함께 삭제됩니다.`)) return;
    const updates = { [`compensationPlans/${id}`]: null };
    list(state.data.compensationItems).filter((row) => row.planId === id).forEach((row) => { updates[`compensationItems/${row.id}`] = null; });
    await writeUpdates(updates, "보상안 삭제", item.title, "compensationPlan");
    toast("보상안이 삭제되었습니다.");
  }

  async function deleteCompRule(id) {
    if (!canWrite("compensation")) return toast("보상 기준 삭제 권한이 없습니다.");
    const item = state.data.settings.compensationRules[id];
    if (!item) return toast("삭제할 보상 기준이 없습니다.");
    if (!confirm(`${item.grade} 등급 보상 기준을 삭제할까요?`)) return;
    await writeUpdates({ [`settings/compensationRules/${id}`]: null }, "보상 기준 삭제", item.grade, "compensationRule");
    toast("보상 기준이 삭제되었습니다.");
  }

  async function deleteSalary(employeeId) {
    if (!canWriteSalary()) return toast("연봉 기초정보 삭제 권한이 없습니다.");
    const item = salaryForEmployee(employeeId);
    if (!item) return toast("삭제할 연봉 기초정보가 없습니다.");
    const name = employeeName(employeeId);
    if (!confirm(`${name}의 연봉 기초정보를 삭제할까요? 삭제 이력은 감사 목적으로 남습니다.`)) return;
    const historyId = makeId("salaryHistory");
    await writeUpdates({
      [`salaryBasics/${item.id}`]: null,
      [`salaryHistory/${historyId}`]: {
        id: historyId,
        employeeId,
        beforeAnnualSalary: Number(item.annualSalary || 0),
        afterAnnualSalary: 0,
        reason: "연봉 기초정보 삭제",
        changedAt: nowStamp(),
        changedBy: currentProfile().displayName || currentProfile().email || currentProfile().uid
      }
    }, "연봉 기초정보 삭제", name, "salary");
    toast("연봉 기초정보가 삭제되었습니다.");
  }

  function openCertificateForm(presetEmployeeId = "") {
    if (!canIssueCertificate()) return toast("증명서 발급 권한이 없습니다.");
    const employees = visibleEmployees();
    if (!employees.length) return toast("증명서를 발급하려면 구성원을 먼저 등록하세요.");
    const defaultEmployeeId = presetEmployeeId || employees[0]?.id || "";
    const templates = certificateTemplateRows().filter((item) => item.status !== "inactive");
    if (!templates.length) return toast("사용 가능한 증명서 템플릿이 없습니다.");
    openForm({
      title: "증명서 즉시 발급",
      fields: [
        { name: "employeeId", label: "대상자", type: "select", required: true, value: defaultEmployeeId, options: employeeOptions(defaultEmployeeId) },
        { name: "templateId", label: "증명서 템플릿", type: "select", required: true, options: templates.map((item) => ({ value: item.id, label: item.name })) },
        { name: "purpose", label: "용도", required: true },
        { name: "submitTo", label: "제출처" },
        { name: "workEndDate", label: "근무 종료일", type: "date" },
        { name: "duties", label: "담당 업무", type: "textarea", full: true },
        { name: "memo", label: "발급 메모", type: "textarea", full: true }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["employeeId", "templateId", "purpose"]);
        const template = state.data.certificates.templates[values.templateId] || certificateTemplateRows().find((item) => item.id === values.templateId);
        if (!template) throw new Error("증명서 템플릿을 선택하세요.");
        const issueId = makeId("issued");
        const issuedAt = nowStamp();
        const issueNo = generateCertificateIssueNo(issuedAt);
        const record = {
          ...values,
          id: issueId,
          issueNo,
          type: template.type || template.name,
          templateName: template.name,
          templateVersion: Number(template.version || 1),
          status: "issued",
          issuedAt,
          issuedBy: currentProfile().displayName || currentProfile().email || currentProfile().uid,
          createdAt: issuedAt,
          updatedAt: issuedAt
        };
        const document = buildCertificateDocument(record, { template, issueNo, issuedAt });
        await writeUpdates({
          [`certificates/issued/${issueId}`]: {
            ...record,
            document
          }
        }, "증명서 직접 발급", `${employeeName(record.employeeId)} ${record.type}`, "certificateIssued");
        toast("증명서가 발급되었습니다.");
      }
    });
  }

  function openCertificateTemplateForm(id = "") {
    if (!canIssueCertificate()) return toast("증명서 템플릿 관리 권한이 없습니다.");
    const item = id ? state.data.certificates.templates[id] || certificateTemplateRows().find((row) => row.id === id) || {} : {};
    openForm({
      title: id ? "증명서 템플릿 수정" : "증명서 템플릿 등록",
      fields: [
        { name: "name", label: "템플릿명", required: true, value: item.name || "" },
        { name: "type", label: "증명서 종류", required: true, value: item.type || item.name || "" },
        { name: "title", label: "문서 제목", required: true, value: item.title || item.name || "" },
        { name: "useCase", label: "용도", value: item.useCase || "" },
        { name: "owner", label: "담당", value: item.owner || currentProfile().displayName || "People팀" },
        { name: "status", label: "상태", type: "select", value: item.status || "active", options: ["active", "draft", "inactive"].map(toOption) },
        { name: "description", label: "설명", type: "textarea", full: true, value: item.description || "" },
        { name: "body", label: "본문 템플릿", type: "textarea", full: true, value: item.body || defaultCertificateBody() },
        { name: "footer", label: "하단 문구", type: "textarea", full: true, value: certificateFooterText(item.footer || "{{issuedAt}}\n{{legalName}}\n대표이사 {{representativeName}}") }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["name", "type", "title", "body"]);
        const nextId = id || makeId("tmpl");
        const now = nowStamp();
        const currentVersion = Number(item.version || 1);
        const nextVersion = id ? currentVersion + 1 : 1;
        const record = {
          ...item,
          ...values,
          id: nextId,
          version: nextVersion,
          previousVersion: id ? currentVersion : 0,
          versionedAt: now,
          updatedAt: now,
          createdAt: item.createdAt || now
        };
        const updates = { [`certificates/templates/${nextId}`]: record };
        if (id && item.id) {
          updates[`certificates/templateVersions/${nextId}/v${currentVersion}`] = {
            ...item,
            archivedAt: now,
            archivedBy: currentProfile().uid
          };
        }
        await writeUpdates(updates, id ? "증명서 템플릿 수정" : "증명서 템플릿 등록", record.name, "certificateTemplate");
        toast("증명서 템플릿이 저장되었습니다.");
      }
    });
  }

  function previewCertificateTemplate(id) {
    const template = state.data.certificates.templates[id] || certificateTemplateRows().find((item) => item.id === id);
    if (!template) return;
    const employee = visibleEmployees()[0] || list(state.data.employees)[0] || {};
    const request = {
      id: "preview",
      employeeId: employee.id,
      templateId: template.id,
      type: template.type || template.name,
      purpose: "제출용",
      submitTo: "제출기관",
      requestedAt: nowStamp()
    };
    openCertificateDocument(buildCertificateDocument(request, { template, issueNo: "CERT-PREVIEW", issuedAt: nowStamp() }), "템플릿 미리보기");
  }

  function previewCertificateIssued(id) {
    const issued = state.data.certificates.issued[id];
    if (!issued) return;
    const request = state.data.certificates.requests[issued.requestId] || issued;
    openCertificateDocument(issued.document || buildCertificateDocument(request, { issueNo: issued.issueNo, issuedAt: issued.issuedAt }), "발급 문서");
  }

  async function deleteCertificateTemplate(id) {
    if (!canIssueCertificate()) return toast("증명서 템플릿 삭제 권한이 없습니다.");
    const item = state.data.certificates.templates[id] || certificateTemplateRows().find((row) => row.id === id);
    if (!item) return;
    if (!confirm(`${item.name} 템플릿을 삭제할까요?`)) return;
    await writeUpdates({
      [`certificates/templates/${id}`]: null,
      [`certificates/templateVersions/${id}`]: null
    }, "증명서 템플릿 삭제", item.name, "certificateTemplate");
    toast("증명서 템플릿이 삭제되었습니다.");
  }

  async function deleteCertificateIssued(id) {
    if (!canIssueCertificate()) return toast("증명서 발급 이력 삭제 권한이 없습니다.");
    const item = state.data.certificates.issued[id];
    if (!item) return;
    if (!confirm(`${item.issueNo || item.type} 발급 이력을 삭제할까요?`)) return;
    await writeUpdates({ [`certificates/issued/${id}`]: null }, "증명서 발급 이력 삭제", `${employeeName(item.employeeId)} ${item.type}`, "certificateIssued");
    toast("증명서 발급 이력이 삭제되었습니다.");
  }

  function openCompanySettingsForm() {
    if (!canAdmin()) return toast("회사 기본정보 수정은 시스템 관리자 권한이 필요합니다.");
    const metaData = state.data.meta || {};
    openForm({
      title: "회사 기본정보 수정",
      fields: [
        { name: "companyName", label: "회사명", required: true, value: metaData.companyName || "" },
        { name: "legalName", label: "법인명", value: metaData.legalName || metaData.companyName || "" },
        { name: "representativeName", label: "대표자", value: metaData.representativeName || "" },
        { name: "businessNo", label: "사업자등록번호", value: metaData.businessNo || "" },
        { name: "environment", label: "운영 환경", value: metaData.environment || "Firebase 운영" },
        { name: "hrContact", label: "인사 연락처", value: metaData.hrContact || "" },
        { name: "certificateNoPrefix", label: "증명서 번호 Prefix", value: metaData.certificateNoPrefix || "CERT" },
        { name: "certificateNoDigits", label: "증명서 번호 자리수", type: "number", value: metaData.certificateNoDigits || 6 },
        { name: "companyAddress", label: "주소", type: "textarea", full: true, value: metaData.companyAddress || "" }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["companyName"]);
        const now = nowStamp();
        const digits = clamp(Number(values.certificateNoDigits || 6), 3, 9);
        const prefix = String(values.certificateNoPrefix || "CERT").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16) || "CERT";
        await writeUpdates({
          "meta/schemaVersion": SCHEMA_VERSION,
          "meta/companyName": values.companyName.trim(),
          "meta/legalName": (values.legalName || values.companyName).trim(),
          "meta/representativeName": values.representativeName.trim(),
          "meta/businessNo": values.businessNo.trim(),
          "meta/environment": values.environment.trim() || "Firebase 운영",
          "meta/hrContact": values.hrContact.trim(),
          "meta/certificateNoPrefix": prefix,
          "meta/certificateNoDigits": digits,
          "meta/companyAddress": values.companyAddress.trim(),
          "meta/updatedAt": now
        }, "회사 기본정보 수정", values.companyName, "meta");
        toast("회사 기본정보가 저장되었습니다.");
      }
    });
  }

  function openCodeListForm(key) {
    if (!canAdmin()) return toast("운영 코드 설정은 시스템 관리자만 수정할 수 있습니다.");
    const config = codeCatalog().find((item) => item.key === key);
    if (!config) return toast("수정할 코드 항목을 찾을 수 없습니다.");
    openForm({
      title: `${config.label} 코드 수정`,
      fields: [
        {
          name: "values",
          label: "코드값",
          type: "textarea",
          full: true,
          required: true,
          value: codeValues(key).join("\n"),
          placeholder: "한 줄에 하나씩 입력하세요."
        }
      ],
      onSubmit: async (values) => {
        const nextValues = uniqueValues(String(values.values || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean));
        if (!nextValues.length) throw new Error("코드값을 1개 이상 입력하세요.");
        await writeUpdates({ [`settings/codes/${key}`]: nextValues }, "운영 코드 수정", config.label, "settings");
        toast(`${config.label} 코드가 저장되었습니다.`);
      }
    });
  }

  function uploadCertificateSeal() {
    if (!canAdmin()) return toast("직인 등록은 시스템 관리자 권한이 필요합니다.");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await normalizeSealImage(file);
        const now = nowStamp();
        await writeUpdates({
          "meta/sealImage": dataUrl,
          "meta/sealImageName": file.name,
          "meta/sealImageUpdatedAt": now,
          "meta/updatedAt": now
        }, "증명서 직인 등록", file.name, "meta");
        toast("직인 이미지가 등록되었습니다. 이후 증명서에 자동 삽입됩니다.");
      } catch (error) {
        toast(error.message || String(error));
      }
    };
    input.click();
  }

  async function deleteCertificateSeal() {
    if (!canAdmin()) return toast("직인 삭제는 시스템 관리자 권한이 필요합니다.");
    if (!state.data.meta?.sealImage) return toast("등록된 직인이 없습니다.");
    if (!confirm("등록된 증명서 직인 이미지를 삭제할까요?")) return;
    const now = nowStamp();
    await writeUpdates({
      "meta/sealImage": null,
      "meta/sealImageName": null,
      "meta/sealImageUpdatedAt": null,
      "meta/updatedAt": now
    }, "증명서 직인 삭제", "직인 이미지", "meta");
    toast("직인 이미지가 삭제되었습니다.");
  }

  function openProfileForm(uid) {
    if (!canAdmin()) return toast("시스템 관리자 권한이 필요합니다.");
    const item = state.data.profiles[uid];
    if (!item) return;
    openForm({
      title: "사용자 권한 변경",
      fields: [
        { name: "displayName", label: "표시명", required: true, value: item.displayName },
        { name: "role", label: "역할", type: "select", required: true, value: item.role, options: ROLE_LABELS.map(toOption) },
        { name: "employeeId", label: "직원 연결", type: "select", value: item.employeeId || "", options: [{ value: "", label: "미연결" }, ...employeeOptions()] },
        { name: "status", label: "상태", type: "select", value: item.status || "active", options: ["active", "disabled"].map(toOption) }
      ],
      onSubmit: async (values) => {
        validateRequired(values, ["displayName", "role"]);
        await writeUpdates({
          [`profiles/${uid}`]: { ...item, ...values, uid, updatedAt: nowStamp() }
        }, "사용자 권한 변경", values.displayName, "profile");
        toast("사용자 권한이 저장되었습니다.");
      }
    });
  }

  async function resetSeedData() {
    if (!canAdmin()) return;
    if (!confirm("현재 운영 데이터를 빈 초기 상태로 되돌립니다. 구성원, 조직, 평가, 보상, 증명서 발급 이력이 삭제됩니다. 계속할까요?")) return;
    const seed = createSeedData();
    const updates = resetOperationalDataUpdates(seed);
    updates.profiles = state.data.profiles || {};
    await firebaseServices.db.ref(dbPath()).update(updates);
    await loadPermittedData();
    render();
    toast("운영 데이터를 초기화했습니다.");
  }

  function resetOperationalDataUpdates(seed) {
    return {
      meta: seed.meta,
      orgs: null,
      employees: null,
      reviews: null,
      compensationPlans: null,
      compensationItems: null,
      salaryBasics: null,
      salaryHistory: null,
      approvals: null,
      auditLogs: null,
      "certificates/requests": null,
      "certificates/templateVersions": null,
      "certificates/issued": null,
      "certificates/templates": seed.certificates.templates,
      settings: seed.settings
    };
  }

  function legacySeedCleanupUpdates(meta = {}) {
    const updates = {};
    [
      "orgs/org-ceo", "orgs/org-hr", "orgs/org-dev", "orgs/org-growth", "orgs/org-finance",
      "employees/emp-001", "employees/emp-002", "employees/emp-003", "employees/emp-004", "employees/emp-005", "employees/emp-006", "employees/emp-007", "employees/emp-008",
      "reviews/cycles/cycle-001", "reviews/cycles/cycle-002", "reviews/cycles/cycle-003",
      "reviews/results/result-001", "reviews/results/result-002", "reviews/results/result-003", "reviews/results/result-004", "reviews/results/result-005", "reviews/results/result-006", "reviews/results/result-007", "reviews/results/result-008",
      "compensationPlans/comp-001", "compensationPlans/comp-002", "compensationPlans/comp-003",
      "compensationItems/compItem-001", "compensationItems/compItem-002", "compensationItems/compItem-003",
      "salaryBasics/salary-emp-001", "salaryBasics/salary-emp-002", "salaryBasics/salary-emp-003", "salaryBasics/salary-emp-004", "salaryBasics/salary-emp-005", "salaryBasics/salary-emp-006", "salaryBasics/salary-emp-007", "salaryBasics/salary-emp-008",
      "salaryHistory/salaryHistory-001",
      "certificates/issued/issued-001", "certificates/issued/issued-002",
      "auditLogs/audit-001"
    ].forEach((path) => { updates[path] = null; });
    if (meta.companyName === "세움테크 주식회사") updates["meta/companyName"] = "";
    if (meta.legalName === "세움테크 주식회사") updates["meta/legalName"] = "";
    if (meta.representativeName === "홍길동") updates["meta/representativeName"] = "";
    if (meta.businessNo === "000-00-00000") updates["meta/businessNo"] = "";
    if (meta.companyAddress === "서울특별시 강남구 테헤란로 000") updates["meta/companyAddress"] = "";
    if (meta.hrContact === "people@seumtech.co.kr") updates["meta/hrContact"] = "";
    return updates;
  }

  function openForm({ title, fields, onSubmit }) {
    els.modalRoot.classList.remove("hidden");
    els.modalRoot.innerHTML = `
      <section class="modal" role="dialog" aria-modal="true">
        <header><h2>${escapeHtml(title)}</h2></header>
        <form id="modalForm">
          <div class="form-grid">
            ${fields.map(renderField).join("")}
          </div>
          <footer>
            <button class="button" type="button" data-close-modal>취소</button>
            <button class="button primary" type="submit">저장</button>
          </footer>
        </form>
      </section>
    `;
    els.modalRoot.querySelector("[data-close-modal]").onclick = closeModal;
    els.modalRoot.querySelector("#modalForm").onsubmit = async (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      try {
        const result = await onSubmit(values);
        if (result !== false) closeModal();
      } catch (error) {
        toast(error.message || String(error));
      }
    };
  }

  function renderField(field) {
    const value = field.value ?? "";
    const required = field.required ? "required" : "";
    const full = field.full ? " full" : "";
    const placeholder = field.placeholder ? ` placeholder="${escapeAttr(field.placeholder)}"` : "";
    if (field.type === "select") {
      return `
        <label class="field${full}">
          <span>${escapeHtml(field.label)}</span>
          <select name="${field.name}" ${required}>
            ${(field.options || []).map((item) => option(item.value, item.label, value)).join("")}
          </select>
        </label>
      `;
    }
    if (field.type === "textarea") {
      return `
        <label class="field${full}">
          <span>${escapeHtml(field.label)}</span>
          <textarea name="${field.name}" ${required}${placeholder}>${escapeHtml(value)}</textarea>
        </label>
      `;
    }
    return `
      <label class="field${full}">
        <span>${escapeHtml(field.label)}</span>
        <input name="${field.name}" type="${field.type || "text"}" value="${escapeAttr(value)}" ${required}${placeholder} />
      </label>
    `;
  }

  function closeModal() {
    els.modalRoot.classList.add("hidden");
    els.modalRoot.innerHTML = "";
  }

  async function normalizeSealImage(file) {
    if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 업로드할 수 있습니다.");
    if (file.size > 5 * 1024 * 1024) throw new Error("직인 이미지는 5MB 이하 파일을 사용하세요.");
    const image = await loadImageFromFile(file);
    const maxSizes = [360, 280, 220];
    for (const maxSize of maxSizes) {
      const dataUrl = sealCanvasDataUrl(image, maxSize);
      if (dataUrl.length <= 550000) return dataUrl;
    }
    throw new Error("직인 이미지가 너무 큽니다. 배경이 투명한 작은 PNG 파일을 사용하세요.");
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("직인 이미지를 읽을 수 없습니다."));
      };
      image.src = url;
    });
  }

  function sealCanvasDataUrl(image, maxSize) {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) throw new Error("이미지 크기를 확인할 수 없습니다.");
    const ratio = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * ratio));
    const height = Math.max(1, Math.round(sourceHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  }

  function downloadOrgTemplate() {
    const headers = ["조직명", "상위조직명", "조직장", "사업장", "정원", "상태"];
    const examples = [
      ["제품개발실", "대표이사", "DEV-014", "서울 본사", 12, "active"],
      ["성장사업팀", "대표이사", "GRO-007", "서울 본사", 7, "active"]
    ];
    downloadWorkbookTemplate("HR_조직_일괄등록_양식.xlsx", "조직일괄등록", [headers, ...examples], [
      ["상태", "active 또는 inactive"],
      ["조직장", "사번, 성명, 이메일 중 하나 입력"],
      ["상위조직명", "같은 양식 안에 먼저 또는 함께 입력된 조직명도 사용 가능"]
    ]);
  }

  function downloadEmployeeTemplate() {
    const headers = ["사번", "성명", "이메일", "조직명", "직무", "직군", "직급", "성별", "생년월일", "고용형태", "재직상태", "입사일", "연락처", "역할"];
    const examples = [
      ["DEV-030", "홍길동", "gildong.hong@example.com", "제품개발실", "Backend Engineer", "개발직", "S2", "남성", "1994-05-20", "정규직", "재직", "2026-04-01", "010-0000-0000", "구성원"],
      ["HR-020", "김지원", "jiwon.kim@example.com", "People팀", "People Partner", "사무직", "S1", "여성", "1997-09-12", "정규직", "재직", "2026-03-15", "010-1111-1111", "HR 관리자"]
    ];
    downloadWorkbookTemplate("HR_구성원_일괄등록_양식.xlsx", "구성원일괄등록", [headers, ...examples], [
      ["필수값", "사번, 성명, 이메일, 조직명"],
      ["조직명", "이미 등록된 조직명 또는 조직 ID"],
      ["역할", ROLE_LABELS.join(", ")],
      ["성별", "남성, 여성, 기타 또는 빈 값"]
    ]);
  }

  function downloadWorkbookTemplate(filename, sheetName, rows, guideRows) {
    if (!window.XLSX) {
      downloadJson(filename.replace(/\.xlsx$/i, ".json"), { sheetName, rows, guideRows });
      toast("엑셀 라이브러리를 불러오지 못해 JSON 양식으로 내려받았습니다.");
      return;
    }
    const workbook = window.XLSX.utils.book_new();
    const sheet = window.XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = rows[0].map((header) => ({ wch: Math.max(12, String(header).length + 8) }));
    window.XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    const guide = window.XLSX.utils.aoa_to_sheet([["항목", "설명"], ...guideRows]);
    guide["!cols"] = [{ wch: 18 }, { wch: 64 }];
    window.XLSX.utils.book_append_sheet(workbook, guide, "작성가이드");
    window.XLSX.writeFile(workbook, filename);
  }

  function uploadBulkExcel(type) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv,.tsv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const rows = await readBulkFileRows(file);
        previewBulkImport(type, rows, file.name);
      } catch (error) {
        toast(error.message || String(error));
      }
    };
    input.click();
  }

  async function readBulkFileRows(file) {
    const lower = file.name.toLowerCase();
    if ((lower.endsWith(".xlsx") || lower.endsWith(".xls")) && window.XLSX) {
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false, dateNF: "yyyy-mm-dd" }).map((row) => row.map(formatImportCell));
      return normalizeImportedRows(rows);
    }
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      throw new Error("엑셀 파일을 읽기 위한 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도하세요.");
    }
    return parseDelimitedRows(await file.text());
  }

  function normalizeImportedRows(rows) {
    const normalized = rows
      .map((row) => row.map((cell) => String(cell ?? "").trim()))
      .filter((row) => row.some((cell) => cell));
    if (normalized.length && looksLikeBulkHeader(normalized[0])) normalized.shift();
    return normalized;
  }

  function formatImportCell(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    return String(value ?? "").trim();
  }

  async function writeUpdates(updates, action, target, entityType = "") {
    const auditId = makeId("audit");
    updates[`auditLogs/${auditId}`] = {
      id: auditId,
      actor: currentProfile().displayName || currentProfile().email || state.authUser.email,
      actorUid: state.authUser.uid,
      action,
      target: target || "",
      entityType,
      path: Object.keys(updates).filter((key) => !key.startsWith("auditLogs/")).join(", "),
      at: nowStamp()
    };
    await firebaseServices.db.ref(dbPath()).update(updates);
  }

  function currentTabs() {
    return NAV_ITEMS.find((item) => item.id === state.section)?.tabs || [];
  }

  function ensureValidRoute() {
    if (!canAccessSection(state.section)) state.section = "dashboard";
    const tabs = currentTabs();
    if (tabs.length && !tabs.some((item) => item.id === state.tab)) state.tab = tabs[0].id;
  }

  function currentProfile() {
    return state.profile || {};
  }

  function currentRole() {
    return currentProfile().role || "구성원";
  }

  function canAdmin() {
    return currentRole() === "시스템 관리자";
  }

  function isAdminLike() {
    return ["시스템 관리자", "HR 관리자"].includes(currentRole());
  }

  function canAccessSection(section) {
    const role = currentRole();
    const baseSections = ["dashboard", "orgs", "reviews", "compensation", "stats", "certificates", "admin"];
    if (role === "시스템 관리자") return baseSections.includes(section);
    if (role === "HR 관리자") return baseSections.includes(section);
    if (role === "보상 담당자") return ["dashboard", "orgs", "compensation", "stats", "certificates"].includes(section);
    if (role === "평가 담당자") return ["dashboard", "orgs", "reviews", "stats", "certificates"].includes(section);
    if (role === "조직장") return ["dashboard", "orgs", "reviews", "stats", "certificates"].includes(section);
    return ["dashboard", "orgs", "certificates"].includes(section);
  }

  function canWrite(section) {
    const role = currentRole();
    if (role === "시스템 관리자") return true;
    if (role === "HR 관리자") return ["employees", "orgs", "reviews", "compensation", "certificates"].includes(section);
    if (role === "평가 담당자") return section === "reviews";
    if (role === "보상 담당자") return section === "compensation";
    return false;
  }

  function canDeleteEmployee() {
    return currentRole() === "시스템 관리자";
  }

  function canViewSalarySection() {
    return ["시스템 관리자", "HR 관리자", "보상 담당자"].includes(currentRole());
  }

  function canWriteSalary() {
    return ["시스템 관리자", "보상 담당자"].includes(currentRole());
  }

  function canIssueCertificate() {
    return ["시스템 관리자", "HR 관리자"].includes(currentRole());
  }

  function canViewSalary(employeeId) {
    if (canViewSalarySection()) return true;
    return currentProfile().employeeId && currentProfile().employeeId === employeeId;
  }

  function visibleEmployees() {
    const rows = list(state.data.employees);
    if (["시스템 관리자", "HR 관리자", "보상 담당자", "평가 담당자"].includes(currentRole())) return rows;
    if (currentRole() === "조직장") {
      const employee = employeeById(currentProfile().employeeId);
      return rows.filter((item) => item.orgId === employee?.orgId || item.id === employee?.id);
    }
    return rows.filter((item) => item.id === currentProfile().employeeId);
  }

  function filteredEmployees(baseRows = visibleEmployees()) {
    const query = normalizeKey(state.filters.employeeQuery);
    return baseRows.filter((item) => {
      const matchQuery = !query || [item.name, item.email, item.employeeNo, item.jobTitle, item.jobFamily, item.grade, orgName(item.orgId)]
        .some((value) => normalizeKey(value).includes(query));
      const matchOrg = !state.filters.employeeOrg || item.orgId === state.filters.employeeOrg;
      const matchGrade = !state.filters.employeeGrade || item.grade === state.filters.employeeGrade;
      const matchType = !state.filters.employeeType || item.employmentType === state.filters.employeeType;
      const matchStatus = !state.filters.employeeStatus || item.status === state.filters.employeeStatus;
      return matchQuery && matchOrg && matchGrade && matchType && matchStatus;
    });
  }

  function filteredReviewResults(rows) {
    const query = normalizeKey(state.filters.reviewQuery);
    return rows.filter((item) => {
      const employee = employeeById(item.employeeId);
      const matchQuery = !query || [employeeName(item.employeeId), employee?.employeeNo, orgName(employee?.orgId), cycleName(item.cycleId)]
        .some((value) => normalizeKey(value).includes(query));
      const matchCycle = !state.filters.reviewCycle || item.cycleId === state.filters.reviewCycle;
      const matchGrade = !state.filters.reviewGrade || item.grade === state.filters.reviewGrade;
      const status = item.derived ? "draft" : item.status;
      const matchStatus = !state.filters.reviewStatus || status === state.filters.reviewStatus;
      return matchQuery && matchCycle && matchGrade && matchStatus;
    });
  }

  function filteredCompItems(rows) {
    const query = normalizeKey(state.filters.compQuery);
    return rows.filter((item) => {
      const employee = employeeById(item.employeeId);
      const matchQuery = !query || [employeeName(item.employeeId), employee?.employeeNo, orgName(employee?.orgId), compPlanName(item.planId), item.memo]
        .some((value) => normalizeKey(value).includes(query));
      const matchPlan = !state.filters.compPlan || item.planId === state.filters.compPlan;
      const matchStatus = !state.filters.compStatus || item.status === state.filters.compStatus;
      return matchQuery && matchPlan && matchStatus;
    });
  }

  function filteredCertificateIssued(rows) {
    const query = normalizeKey(state.filters.certificateQuery);
    const from = state.filters.certificateFrom ? new Date(`${state.filters.certificateFrom}T00:00:00`) : null;
    const to = state.filters.certificateTo ? new Date(`${state.filters.certificateTo}T23:59:59`) : null;
    return rows.filter((item) => {
      const issuedAt = new Date(item.issuedAt || "");
      const matchQuery = !query || [item.issueNo, employeeName(item.employeeId), item.type, item.purpose, item.submitTo, item.issuedBy]
        .some((value) => normalizeKey(value).includes(query));
      const matchType = !state.filters.certificateType || item.type === state.filters.certificateType;
      const matchFrom = !from || (!Number.isNaN(issuedAt.getTime()) && issuedAt >= from);
      const matchTo = !to || (!Number.isNaN(issuedAt.getTime()) && issuedAt <= to);
      return matchQuery && matchType && matchFrom && matchTo;
    });
  }

  function list(collection) {
    return Object.values(collection || {}).sort((a, b) => String(b.updatedAt || b.createdAt || b.id).localeCompare(String(a.updatedAt || a.createdAt || a.id)));
  }

  function latestAudit(limit) {
    return list(state.data.auditLogs).slice(0, limit);
  }

  function reviewCriteriaRows() {
    const rows = list(state.data.settings.reviewCriteria);
    return rows.length ? rows : list(defaultReviewCriteria(nowStamp()));
  }

  function reviewGradeRows() {
    const rows = list(state.data.settings.reviewGrades);
    const source = rows.length ? rows : list(defaultReviewGrades(nowStamp()));
    return source.sort((a, b) => gradeRank(a.grade) - gradeRank(b.grade));
  }

  function compensationRuleRows() {
    const rows = list(state.data.settings.compensationRules);
    const source = rows.length ? rows : list(defaultCompensationRules(nowStamp()));
    return source.sort((a, b) => gradeRank(a.grade) - gradeRank(b.grade));
  }

  function certificateTemplateRows() {
    const rows = list(state.data.certificates.templates);
    return rows.length ? rows : list(defaultCertificateTemplates(nowStamp()));
  }

  function defaultCodes() {
    return {
      employmentTypes: ["정규직", "계약직", "인턴", "파견"],
      employeeStatuses: ["재직", "휴직", "퇴직"],
      jobFamilies: ["개발직", "사무직", "영업직", "관리직", "전문직"],
      grades: ["S1", "S2", "S3", "M1", "M2", "EX"],
      sites: ["서울 본사", "부산 지점", "원격"]
    };
  }

  function codeCatalog() {
    return [
      { key: "employmentTypes", label: "고용형태", description: "구성원 등록과 일괄 업로드에서 사용" },
      { key: "employeeStatuses", label: "재직상태", description: "재직, 휴직, 퇴직 등 인원 상태" },
      { key: "jobFamilies", label: "직군", description: "조직 통계와 구성원 분류 기준" },
      { key: "grades", label: "직급", description: "구성원 필터와 연봉 기초정보 기준" },
      { key: "sites", label: "사업장", description: "조직 등록과 사업장별 통계 기준" }
    ];
  }

  function codeValues(key) {
    const values = state.data.settings.codes?.[key];
    const defaults = defaultCodes()[key] || [];
    const source = Array.isArray(values) && values.length ? values : defaults;
    return uniqueValues(source.map((item) => String(item || "").trim()).filter(Boolean));
  }

  function codeSelectOptions(key, selected = "") {
    const values = codeValues(key);
    const normalizedSelected = String(selected || "").trim();
    if (normalizedSelected && !values.includes(normalizedSelected)) values.unshift(normalizedSelected);
    return values.map(toOption);
  }

  function uniqueValues(values) {
    return [...new Set(values)];
  }

  function certificateTypeOptions() {
    return uniqueValues([
      ...certificateTemplateRows().map((item) => item.type || item.name),
      ...list(state.data.certificates.issued).map((item) => item.type)
    ].map((item) => String(item || "").trim()).filter(Boolean)).sort((a, b) => a.localeCompare(b));
  }

  function gradeRank(grade) {
    const order = ["S", "A", "B", "C", "D"];
    const index = order.indexOf(String(grade || "").toUpperCase());
    return index === -1 ? 99 : index;
  }

  function resetPagination() {
    state.pagination = {};
  }

  function pageScope(name) {
    return `${state.section}:${state.tab || "default"}:${name}`;
  }

  function paginateRows(name, rows, pageSize = DEFAULT_PAGE_SIZE) {
    const key = pageScope(name);
    const total = rows.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(Math.max(Number(state.pagination[key] || 1), 1), pageCount);
    state.pagination[key] = current;
    const start = (current - 1) * pageSize;
    return {
      key,
      total,
      pageSize,
      page: current,
      pageCount,
      from: total ? start + 1 : 0,
      to: Math.min(start + pageSize, total),
      rows: rows.slice(start, start + pageSize)
    };
  }

  function renderPager(page) {
    if (!page || page.total <= page.pageSize) return "";
    const pages = pageWindow(page.page, page.pageCount).map((item) => `
      <button type="button" class="pager-page${item === page.page ? " active" : ""}" data-page-key="${escapeAttr(page.key)}" data-page-value="${item}" aria-current="${item === page.page ? "page" : "false"}">${item}</button>
    `).join("");
    return `
      <div class="pagination" aria-label="페이지 이동">
        <span class="pager-summary">${page.from}-${page.to} / ${page.total}건</span>
        <div class="pager-buttons">
          <button type="button" data-page-key="${escapeAttr(page.key)}" data-page-value="1" ${page.page === 1 ? "disabled" : ""}>처음</button>
          <button type="button" data-page-key="${escapeAttr(page.key)}" data-page-value="${Math.max(1, page.page - 1)}" ${page.page === 1 ? "disabled" : ""}>이전</button>
          ${pages}
          <button type="button" data-page-key="${escapeAttr(page.key)}" data-page-value="${Math.min(page.pageCount, page.page + 1)}" ${page.page === page.pageCount ? "disabled" : ""}>다음</button>
          <button type="button" data-page-key="${escapeAttr(page.key)}" data-page-value="${page.pageCount}" ${page.page === page.pageCount ? "disabled" : ""}>마지막</button>
        </div>
      </div>
    `;
  }

  function pageWindow(page, pageCount) {
    const end = Math.min(pageCount, Math.max(5, page + 2));
    const start = Math.max(1, Math.min(page - 2, end - 4));
    const result = [];
    for (let index = start; index <= end; index += 1) result.push(index);
    return result;
  }

  function employeeById(id) {
    return state.data.employees[id] || null;
  }

  function employeeName(id) {
    if (!id) return "-";
    return employeeById(id)?.name || id;
  }

  function orgName(id) {
    if (!id) return "-";
    return state.data.orgs[id]?.name || id;
  }

  function requestName(id) {
    return id || "-";
  }

  function cycleName(id) {
    return state.data.reviews.cycles[id]?.title || id || "-";
  }

  function salaryForEmployee(employeeId) {
    return list(state.data.salaryBasics).find((item) => item.employeeId === employeeId) || null;
  }

  function latestReviewForEmployee(employeeId) {
    return list(state.data.reviews.results).find((item) => item.employeeId === employeeId) || null;
  }

  function compensationRuleForGrade(grade) {
    return compensationRuleRows().find((item) => String(item.grade || "").toUpperCase() === String(grade || "").toUpperCase()) || null;
  }

  function orgOptions(excludeId = "") {
    return list(state.data.orgs)
      .filter((item) => item.id !== excludeId)
      .map((item) => ({ value: item.id, label: item.name }));
  }

  function resolveOrgId(value) {
    const key = normalizeKey(value);
    if (!key) return "";
    const org = list(state.data.orgs).find((item) => normalizeKey(item.id) === key || normalizeKey(item.name) === key);
    return org?.id || "";
  }

  function resolveEmployeeId(value) {
    const key = normalizeKey(value);
    if (!key) return "";
    const employee = list(state.data.employees).find((item) =>
      normalizeKey(item.id) === key ||
      normalizeKey(item.employeeNo) === key ||
      normalizeKey(item.name) === key ||
      sameEmail(item.email, value)
    );
    return employee?.id || "";
  }

  function employeeOptions(selectedId = "") {
    const options = visibleEmployees().map((item) => ({ value: item.id, label: `${item.name} (${item.employeeNo || item.id})` }));
    if (selectedId && !options.some((item) => item.value === selectedId)) {
      const employee = employeeById(selectedId);
      if (employee) options.unshift({ value: employee.id, label: employee.name });
    }
    return options;
  }

  function compPlanName(id) {
    if (!id) return "-";
    return state.data.compensationPlans[id]?.title || id;
  }

  function compensationItemRows(rows) {
    return rows.map((item) => {
      const employee = employeeById(item.employeeId);
      return [
        employeeName(item.employeeId),
        orgName(employee?.orgId),
        `${money(item.currentAnnualSalary)}만원`,
        `${money(item.proposedIncrease)}만원`,
        `${money(item.proposedAnnualSalary)}만원`,
        statusLabel(item.status)
      ];
    });
  }

  function certificateTemplateForRequest(request) {
    if (request.templateId && state.data.certificates.templates[request.templateId]) return state.data.certificates.templates[request.templateId];
    return certificateTemplateRows().find((item) => item.id === request.templateId || item.type === request.type || item.name === request.type) || null;
  }

  function generateCertificateIssueNo(issuedAt = nowStamp()) {
    const meta = state.data.meta || {};
    const date = new Date(issuedAt);
    const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
    const prefix = String(meta.certificateNoPrefix || "CERT").trim().replace(/[^a-zA-Z0-9_-]/g, "") || "CERT";
    const digits = clamp(Number(meta.certificateNoDigits || 6), 3, 9);
    const existing = new Set(list(state.data.certificates.issued).map((item) => item.issueNo));
    const yearPrefix = `${prefix}-${year}-`;
    let sequence = list(state.data.certificates.issued)
      .filter((item) => String(item.issueNo || "").startsWith(yearPrefix))
      .length + 1;
    let candidate = `${yearPrefix}${String(sequence).padStart(digits, "0")}`;
    while (existing.has(candidate)) {
      sequence += 1;
      candidate = `${yearPrefix}${String(sequence).padStart(digits, "0")}`;
    }
    return candidate;
  }

  function buildCertificateDocument(request, overrides = {}) {
    const template = overrides.template || certificateTemplateForRequest(request) || fallbackCertificateTemplate(request.type);
    const issuedAt = overrides.issuedAt || request.issuedAt || nowStamp();
    const issueNo = overrides.issueNo || request.issueNo || "발급 전";
    const employee = employeeById(request.employeeId) || {};
    const vars = certificateVars(employee, request, issueNo, issuedAt);
    return {
      templateId: template.id || "",
      templateVersion: Number(template.version || request.templateVersion || 1),
      issueNo,
      title: applyTemplate(template.title || template.name || request.type || "증명서", vars),
      body: applyTemplate(template.body || defaultCertificateBody(), vars),
      footer: applyTemplate(template.footer || "{{issuedAt}}\n{{companyName}}\n대표이사", vars),
      type: request.type || template.type || template.name || "",
      variables: vars
    };
  }

  function certificateVars(employee, request, issueNo, issuedAt) {
    const meta = state.data.meta || {};
    return {
      companyName: meta.companyName || "회사명",
      legalName: meta.legalName || meta.companyName || "회사명",
      representativeName: meta.representativeName || "",
      businessNo: meta.businessNo || "",
      companyAddress: meta.companyAddress || "",
      hrContact: meta.hrContact || "",
      environment: meta.environment || "운영",
      employeeName: employee.name || employeeName(request.employeeId),
      employeeNo: employee.employeeNo || "-",
      orgName: orgName(employee.orgId),
      jobTitle: employee.jobTitle || "-",
      grade: employee.grade || "-",
      hireDate: employee.hireDate || "-",
      workStartDate: request.workStartDate || employee.hireDate || "-",
      workEndDate: request.workEndDate || (employee.status === "재직" ? "현재" : "-"),
      careerPeriod: `${request.workStartDate || employee.hireDate || "-"} ~ ${request.workEndDate || (employee.status === "재직" ? "현재" : "-")}`,
      duties: request.duties || employee.jobTitle || "-",
      employmentType: employee.employmentType || "-",
      status: employee.status || "-",
      certificateType: request.type || "",
      purpose: request.purpose || "-",
      submitTo: request.submitTo || "-",
      issueNo,
      requestedAt: formatDateOnly(request.requestedAt),
      issuedAt: formatDateOnly(issuedAt),
      today: formatDateOnly(nowStamp()),
      sealImage: meta.sealImage || ""
    };
  }

  function applyTemplate(template, vars) {
    return String(template || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => vars[key] ?? "");
  }

  function fallbackCertificateTemplate(type = "증명서") {
    return {
      id: "",
      name: type,
      title: type,
      body: defaultCertificateBody(),
      footer: "{{issuedAt}}\n{{legalName}}\n대표이사 {{representativeName}}"
    };
  }

  function defaultCertificateBody() {
    return [
      "위 사람은 {{hireDate}}부터 현재까지 {{companyName}} 소속 구성원으로 재직 중임을 증명합니다.",
      "",
      "본 증명서는 신청인의 요청에 따라 {{submitTo}} 제출 용도로 발급합니다."
    ].join("\n");
  }

  function templatePreviewText(body) {
    return String(body || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, "[$1]").slice(0, 180);
  }

  function openCertificateDocument(document, title = "증명서 문서") {
    els.modalRoot.classList.remove("hidden");
    els.modalRoot.innerHTML = `
      <section class="modal certificate-modal" role="dialog" aria-modal="true">
        <header><h2>${escapeHtml(title)}</h2></header>
        <div class="certificate-doc" id="certificateDoc">
          ${renderCertificateDocument(document)}
        </div>
        <footer>
          <button class="button" type="button" data-close-modal>닫기</button>
          <button class="button primary" type="button" data-print-document>인쇄</button>
        </footer>
      </section>
    `;
  }

  function renderCertificateDocument(document) {
    const metaData = state.data.meta || {};
    const storedVars = document.variables || {};
    const vars = {
      companyName: metaData.companyName || "회사명",
      environment: metaData.environment || "운영",
      ...storedVars,
      sealImage: storedVars.sealImage || metaData.sealImage || ""
    };
    const title = document.title || "증명서";
    vars.certificateType = vars.certificateType || document.type || title;
    const statement = certificateStatementText(document.body || "", vars);
    const issueDate = vars.issuedAt || formatDateOnly(nowStamp());
    return `
      <div class="doc-watermark">CERTIFICATE</div>
      <div class="doc-title-block">
        <h1>${escapeHtml(title)}</h1>
      </div>
      <div class="doc-meta-grid">
        <div><span>발급일</span><strong>${escapeHtml(issueDate)}</strong></div>
        <div><span>제출처</span><strong>${escapeHtml(vars.submitTo || "-")}</strong></div>
        <div><span>용도</span><strong>${escapeHtml(vars.purpose || "-")}</strong></div>
      </div>
      <table class="doc-info-table">
        <tbody>
          ${certificateInfoRows(vars).map(([label, value]) => `
            <tr>
              <th>${escapeHtml(label)}</th>
              <td>${escapeHtml(value || "-")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <section class="doc-statement">
        <span>증명 내용</span>
        <p>${formatDocumentText(statement)}</p>
      </section>
      <div class="doc-footer">
        <div class="doc-issued">${formatDocumentText(certificateFooterText(document.footer || `${issueDate}\n${vars.companyName || "회사명"}\n대표이사`))}</div>
        <div class="doc-seal ${vars.sealImage ? "has-image" : ""}" aria-label="회사 직인">
          ${vars.sealImage ? `<img src="${escapeAttr(vars.sealImage)}" alt="회사 직인" />` : `<span>직인</span>`}
        </div>
      </div>
    `;
  }

  function certificateInfoRows(vars) {
    const commonRows = [
      ["성명", vars.employeeName],
      ["사번", vars.employeeNo],
      ["소속", vars.orgName],
      ["직무 / 직급", [vars.jobTitle, vars.grade].filter((value) => value && value !== "-").join(" / ")],
      ["고용형태", vars.employmentType]
    ];
    if (vars.certificateType === "경력증명서") {
      return [
        ...commonRows,
        ["근무기간", vars.careerPeriod],
        ["담당업무", vars.duties],
        ["퇴사일", vars.workEndDate === "현재" ? "-" : vars.workEndDate],
        ["재직상태", vars.status]
      ];
    }
    return [
      ...commonRows,
      ["재직상태", vars.status],
      ["입사일", vars.hireDate]
    ];
  }

  function certificateStatementText(body, vars) {
    const fieldPattern = /^(성명|사번|소속|최종\s*소속|직무|직급|입사일|근무기간|담당업무|퇴사일|고용형태|재직상태|용도|제출처)\s*:/;
    const text = String(body || "")
      .split(/\r?\n/)
      .filter((line) => !fieldPattern.test(line.trim()))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text) return text;
    return `위 사람은 ${vars.companyName || "회사"}에 재직 중임을 증명합니다.`;
  }

  function certificateFooterText(footer) {
    return String(footer || "")
      .replace(/\s*\(인\)\s*$/gm, "")
      .replace(/\s*\(직인\)\s*$/gm, "")
      .trim();
  }

  function formatDocumentText(value) {
    return escapeHtml(value).replace(/\n/g, "<br />");
  }

  function printModalDocument() {
    const doc = byId("certificateDoc");
    if (!doc) return;
    const win = window.open("", "_blank", "width=900,height=1100");
    if (!win) return toast("팝업 차단을 해제한 뒤 다시 시도하세요.");
    win.document.write(`
      <!doctype html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8" />
          <title>증명서 인쇄</title>
          <style>
            * { box-sizing: border-box; }
            @page { size: A4; margin: 10mm; }
            body { margin: 0; padding: 12px; background: #f4f6f8; font-family: "Noto Sans KR", "Apple SD Gothic Neo", sans-serif; color: #111827; }
            .certificate-doc { position: relative; width: 720px; min-height: 930px; margin: 0 auto; padding: 42px; overflow: hidden; background: #fff; border: 1px solid #cfd8df; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
            .certificate-doc::before { content: ""; position: absolute; inset: 22px; border: 2px solid #0b7a6f; pointer-events: none; }
            .certificate-doc::after { content: ""; position: absolute; inset: 31px; border: 1px solid #d6e4e1; pointer-events: none; }
            .doc-watermark { position: absolute; top: 43%; left: 50%; transform: translate(-50%, -50%) rotate(-18deg); color: rgba(11, 122, 111, 0.055); font-size: 70px; font-weight: 900; letter-spacing: 0; white-space: nowrap; }
            .doc-header, .doc-title-block, .doc-meta-grid, .doc-info-table, .doc-statement, .doc-footer { position: relative; z-index: 1; }
            .doc-header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; padding-bottom: 22px; border-bottom: 2px solid #111827; }
            .doc-brand { display: grid; gap: 6px; }
            .doc-brand span, .doc-no span, .doc-meta-grid span, .doc-statement span { color: #667085; font-size: 12px; font-weight: 800; letter-spacing: 0; text-transform: uppercase; }
            .doc-brand strong { font-size: 21px; }
            .doc-no { display: grid; gap: 6px; text-align: right; }
            .doc-no strong { font-size: 14px; }
            .doc-title-block { margin: 24px 0 22px; text-align: center; }
            .doc-title-block h1 { margin: 0; font-size: 30px; letter-spacing: 0; }
            .doc-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #cfd8df; background: #f8fbfa; }
            .doc-meta-grid div { padding: 10px 13px; border-right: 1px solid #cfd8df; }
            .doc-meta-grid div:last-child { border-right: 0; }
            .doc-meta-grid strong { display: block; margin-top: 5px; font-size: 15px; }
            .doc-info-table { width: 100%; margin-top: 18px; border-collapse: collapse; table-layout: fixed; }
            .doc-info-table th, .doc-info-table td { border: 1px solid #cfd8df; padding: 9px 12px; text-align: left; font-size: 14px; }
            .doc-info-table th { width: 132px; background: #f3f6f7; color: #344054; font-weight: 800; }
            .doc-statement { margin-top: 20px; padding: 16px 20px; border-left: 4px solid #0b7a6f; background: #fbfcfd; }
            .doc-statement p { margin: 8px 0 0; font-size: 15px; line-height: 1.65; }
            .doc-footer { position: relative; display: block; margin-top: 42px; min-height: 92px; }
            .doc-issued { text-align: center; font-size: 15px; line-height: 1.7; }
            .doc-seal { position: absolute; top: 58px; left: calc(50% + 132px); transform: translate(-50%, -50%); width: 58px; height: 58px; display: grid; place-items: center; border: 0; color: rgba(200, 62, 62, 0.55); font-weight: 900; font-size: 12px; opacity: 0.48; }
            .doc-seal.has-image { border: 0; border-radius: 0; opacity: 0.78; }
            .doc-seal img { max-width: 100%; max-height: 100%; object-fit: contain; }
            @media print { body { padding: 0; background: #fff; } .certificate-doc { width: 190mm; min-height: 0; height: 277mm; padding: 12mm; border: 0; box-shadow: none; page-break-inside: avoid; } .certificate-doc::before { inset: 6mm; } .certificate-doc::after { inset: 8.5mm; } }
          </style>
        </head>
        <body>${doc.outerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  function average(values) {
    const nums = values.map((value) => Number(value || 0)).filter((value) => Number.isFinite(value));
    return nums.length ? Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length) : 0;
  }

  function percent(value, total) {
    return total ? Math.round((Number(value || 0) / Number(total || 0)) * 100) : 0;
  }

  function countBy(rows, keyFn) {
    const counts = {};
    rows.forEach((row) => {
      const key = String(keyFn(row) || "미분류");
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }

  function orgHeadcountRows(ctx) {
    return ctx.orgs
      .map((org) => ({ label: org.name, count: ctx.activeEmployees.filter((employee) => employee.orgId === org.id).length }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }

  function orgSummaryRows(ctx) {
    return ctx.orgs.map((org) => {
      const activeCount = ctx.activeEmployees.filter((employee) => employee.orgId === org.id).length;
      const headcount = Number(org.headcount || 0);
      return [org.name, `${activeCount}명`, `${headcount}명`, `${percent(activeCount, headcount)}%`, employeeName(org.leaderId)];
    });
  }

  function orgDetailRows(ctx) {
    return ctx.orgs.map((org) => {
      const activeCount = ctx.activeEmployees.filter((employee) => employee.orgId === org.id).length;
      const headcount = Number(org.headcount || 0);
      return [org.name, orgName(org.parentId), `${activeCount}명`, `${headcount}명`, `${percent(activeCount, headcount)}%`, employeeName(org.leaderId), statusLabel(org.status)];
    });
  }

  function reviewResultsForStats(activeEmployees) {
    const employeeIds = new Set(activeEmployees.map((item) => item.id));
    const actual = list(state.data.reviews.results).filter((item) => employeeIds.has(item.employeeId));
    if (actual.length) return actual;
    const latestCycleId = list(state.data.reviews.cycles)[0]?.id || "";
    const grades = ["S", "A", "B", "B", "A", "C", "B", "A"];
    return activeEmployees.map((employee, index) => ({
      id: `derived-${employee.id}`,
      employeeId: employee.id,
      cycleId: latestCycleId,
      grade: grades[index % grades.length],
      score: clamp(94 - index * 3, 68, 99),
      status: "draft",
      derived: true
    }));
  }

  function reviewResultRows(ctx, results) {
    return results.map((item) => {
      const employee = employeeById(item.employeeId);
      return [
        employeeName(item.employeeId),
        orgName(employee?.orgId),
        cycleName(item.cycleId),
        item.grade || "미입력",
        item.score ? `${item.score}점` : "-",
        item.derived ? "예시" : statusLabel(item.status)
      ];
    });
  }

  function salaryBandRows(values) {
    return [
      { label: "5천 미만", count: values.filter((value) => value < 5000).length },
      { label: "5천~7천", count: values.filter((value) => value >= 5000 && value < 7000).length },
      { label: "7천~9천", count: values.filter((value) => value >= 7000 && value < 9000).length },
      { label: "9천 이상", count: values.filter((value) => value >= 9000).length }
    ];
  }

  function genderRows(employees) {
    return countBy(employees, (item) => item.gender || "미입력");
  }

  function ageBandRows(employees) {
    const bands = [
      { label: "20대 이하", count: 0 },
      { label: "30대", count: 0 },
      { label: "40대", count: 0 },
      { label: "50대 이상", count: 0 },
      { label: "미입력", count: 0 }
    ];
    employees.forEach((employee) => {
      const age = ageFromBirthDate(employee.birthDate);
      if (!age) bands[4].count += 1;
      else if (age < 30) bands[0].count += 1;
      else if (age < 40) bands[1].count += 1;
      else if (age < 50) bands[2].count += 1;
      else bands[3].count += 1;
    });
    return bands;
  }

  function tenureRows(employees) {
    const bands = [
      { label: "1년 미만", count: 0 },
      { label: "1~3년", count: 0 },
      { label: "3~5년", count: 0 },
      { label: "5년 이상", count: 0 },
      { label: "미입력", count: 0 }
    ];
    employees.forEach((employee) => {
      const tenure = tenureYears(employee.hireDate);
      if (tenure === null) bands[4].count += 1;
      else if (tenure < 1) bands[0].count += 1;
      else if (tenure < 3) bands[1].count += 1;
      else if (tenure < 5) bands[2].count += 1;
      else bands[3].count += 1;
    });
    return bands;
  }

  function demographicOrgRows(ctx) {
    return ctx.orgs.map((org) => {
      const members = ctx.employees.filter((employee) => employee.orgId === org.id);
      const ages = members.map((item) => ageFromBirthDate(item.birthDate)).filter(Boolean);
      const tenures = members.map((item) => tenureYears(item.hireDate)).filter((value) => value !== null);
      return [
        org.name,
        `${members.length}명`,
        `${members.filter((item) => item.gender === "남성").length}명`,
        `${members.filter((item) => item.gender === "여성").length}명`,
        ages.length ? `${average(ages)}세` : "미입력",
        tenures.length ? `${average(tenures)}년` : "미입력"
      ];
    });
  }

  function certificateDetailRows(ctx) {
    return ctx.certificateIssued.map((item) => {
      const employee = employeeById(item.employeeId);
      return [
        employeeName(item.employeeId),
        orgName(employee?.orgId),
        item.type || "-",
        item.purpose || "-",
        item.submitTo || "-",
        formatDateTime(item.issuedAt)
      ];
    });
  }

  function statsTable(title, headers, rows, emptyText = "집계 데이터가 없습니다.") {
    const page = paginateRows(`stats-${title}`, rows, DENSE_PAGE_SIZE);
    return `
      <section class="table-panel">
        <div class="toolbar"><h2>${escapeHtml(title)}</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr>${headers.map((item) => `<th>${escapeHtml(item)}</th>`).join("")}</tr></thead>
            <tbody>
              ${page.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${headers.length}"><div class="empty">${escapeHtml(emptyText)}</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </section>
    `;
  }

  function monthLabel(value) {
    const date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return "미입력";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function groupSalary(rows, keyFn) {
    const grouped = {};
    rows.forEach((row) => {
      const key = keyFn(row);
      grouped[key] = grouped[key] || [];
      grouped[key].push(Number(row.annualSalary || 0));
    });
    return Object.entries(grouped).map(([label, values]) => ({
      label,
      count: values.length,
      average: Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)),
      min: Math.min(...values),
      max: Math.max(...values)
    })).sort((a, b) => a.label.localeCompare(b.label));
  }

  function salaryBandTable(title, rows, firstColumn) {
    const page = paginateRows(`salary-band-${title}`, rows, DENSE_PAGE_SIZE);
    return `
      <article class="table-panel">
        <div class="toolbar"><h2>${escapeHtml(title)}</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>${escapeHtml(firstColumn)}</th><th>인원</th><th>평균</th><th>최저</th><th>최고</th></tr></thead>
            <tbody>
              ${page.rows.map((item) => `
                <tr>
                  <td>${escapeHtml(item.label)}</td>
                  <td>${item.count}명</td>
                  <td>${money(item.average)}만원</td>
                  <td>${money(item.min)}만원</td>
                  <td>${money(item.max)}만원</td>
                </tr>
              `).join("") || `<tr><td colspan="5"><div class="empty">집계 데이터가 없습니다.</div></td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderPager(page)}
      </article>
    `;
  }

  function donutChart(rows, total) {
    const safeTotal = Math.max(1, total || rows.reduce((sum, item) => sum + item.count, 0));
    const colors = ["#0b7a6f", "#d39a2c", "#c84b4b", "#52708f"];
    let cursor = 0;
    const segments = rows.map((item, index) => {
      const start = cursor;
      const end = cursor + (Number(item.count || 0) / safeTotal) * 100;
      cursor = end;
      return `${colors[index % colors.length]} ${start}% ${end}%`;
    }).join(", ");
    return `
      <div class="donut-wrap">
        <div class="donut" style="background: conic-gradient(${segments || "#dbe3eb 0 100%"})">
          <div><strong>${total || 0}</strong><span>명</span></div>
        </div>
        <div class="legend-list">
          ${rows.map((item, index) => `
            <div class="legend-row">
              <i style="background:${colors[index % colors.length]}"></i>
              <span>${escapeHtml(item.label)}</span>
              <strong>${item.count}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function barList(rows, total) {
    const safeTotal = Math.max(1, total || rows.reduce((sum, item) => sum + Number(item.count || 0), 0));
    return `
      <div class="bar-list">
        ${rows.map((item) => {
          const width = clamp(Math.round((Number(item.count || 0) / safeTotal) * 100), item.count ? 8 : 0, 100);
          return `
            <div class="bar-row">
              <div class="bar-meta"><span>${escapeHtml(item.label)}</span><strong>${item.count}</strong></div>
              <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
            </div>
          `;
        }).join("") || `<div class="empty">표시할 데이터가 없습니다.</div>`}
      </div>
    `;
  }

  function funnelChart(rows) {
    const max = Math.max(1, ...rows.map((item) => Number(item.count || 0)));
    return `
      <div class="funnel-list">
        ${rows.map((item, index) => {
          const width = clamp(Math.round((Number(item.count || 0) / max) * 100), item.count ? 18 : 6, 100);
          return `
            <div class="funnel-row">
              <span>${escapeHtml(item.label)}</span>
              <div class="funnel-track"><div class="funnel-fill" style="width:${width}%; opacity:${1 - index * 0.12}"></div></div>
              <strong>${item.count}명</strong>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function stat(label, value, note) {
    return `<article class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note || "")}</small></article>`;
  }

  function meta(label, value) {
    return `<div class="meta-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "-")}</strong></div>`;
  }

  function timelineItem(title, note) {
    return `<div class="timeline-item"><strong>${escapeHtml(title || "-")}</strong><small>${escapeHtml(note || "")}</small></div>`;
  }

  function badge(status) {
    const label = statusLabel(status);
    const cls = ["approved", "active", "open", "재직", "hired", "closed", "confirmed", "issued"].includes(status) || label.includes("승인") || label.includes("완료") ? "ok"
      : ["pending", "requested", "planning", "review", "reviewing", "processing", "draft"].includes(status) || label.includes("대기") ? "warn"
      : ["rejected", "disabled", "퇴직"].includes(status) || label.includes("반려") ? "danger" : "";
    return `<span class="badge ${cls}">${escapeHtml(label)}</span>`;
  }

  function statusLabel(status) {
    const labels = {
      active: "활성",
      inactive: "비활성",
      pending: "대기",
      approved: "승인",
      rejected: "반려",
      requested: "요청",
      reviewing: "검토중",
      issued: "발급완료",
      open: "진행",
      closed: "종료",
      planning: "계획",
      review: "검토",
      confirmed: "확정",
      draft: "초안",
      processing: "진행중",
      screening: "서류검토",
      interview: "면접",
      offer: "처우협의",
      hired: "합격",
      disabled: "비활성"
    };
    return labels[status] || status || "-";
  }

  function stageLabel(stage) {
    return statusLabel(stage);
  }

  function option(value, label, selected) {
    return `<option value="${escapeAttr(value)}" ${String(value) === String(selected ?? "") ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }

  function toOption(value) {
    return { value, label: statusLabel(value) };
  }

  function validateRequired(values, keys) {
    const missing = keys.filter((key) => !String(values[key] || "").trim());
    if (missing.length) throw new Error("필수값을 입력하세요.");
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
  }

  function sameEmail(a, b) {
    return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
  }

  function normalizeKey(value) {
    return String(value || "").trim().toLowerCase();
  }

  function parseDelimitedRows(text) {
    const lines = String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const rows = lines.map(splitDelimitedLine).filter((row) => row.some((cell) => cell));
    if (rows.length && looksLikeBulkHeader(rows[0])) rows.shift();
    return rows;
  }

  function looksLikeBulkHeader(row) {
    const first = normalizeKey(row[0]);
    return ["조직명", "사번", "employeeNo", "employee no", "org", "organization"].some((label) => first === normalizeKey(label));
  }

  function splitDelimitedLine(line) {
    const delimiter = line.includes("\t") ? "\t" : ",";
    const result = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && quoted && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  function isBootstrapAdminEmail(email) {
    return BOOTSTRAP_ADMIN_EMAILS.includes(String(email || "").trim().toLowerCase());
  }

  function nowStamp() {
    return new Date().toISOString();
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function ageFromBirthDate(value) {
    if (!value) return null;
    const birth = new Date(value);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
    return age >= 0 ? age : null;
  }

  function tenureYears(value) {
    if (!value) return null;
    const start = new Date(value);
    if (Number.isNaN(start.getTime())) return null;
    const diff = Date.now() - start.getTime();
    if (diff < 0) return 0;
    return Math.round((diff / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10;
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function money(value) {
    return new Intl.NumberFormat("ko-KR").format(Number(value || 0));
  }

  function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  function formatDateOnly(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function toast(message) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    els.toastRoot.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function defaultReviewCriteria(now) {
    return {
      "criterion-performance": { id: "criterion-performance", name: "성과 목표 달성", category: "성과", weight: 50, status: "active", description: "개인/조직 목표 달성도와 핵심 결과 기여도를 평가합니다.", createdAt: now, updatedAt: now },
      "criterion-competency": { id: "criterion-competency", name: "직무 역량", category: "역량", weight: 30, status: "active", description: "직무 전문성, 문제 해결, 품질과 실행력을 평가합니다.", createdAt: now, updatedAt: now },
      "criterion-collaboration": { id: "criterion-collaboration", name: "협업과 태도", category: "조직기여", weight: 10, status: "active", description: "협업, 커뮤니케이션, 조직 가치 실천 수준을 평가합니다.", createdAt: now, updatedAt: now },
      "criterion-leadership": { id: "criterion-leadership", name: "리더십/성장", category: "리더십", weight: 10, status: "active", description: "리더십, 성장 가능성, 지식 공유와 영향력을 평가합니다.", createdAt: now, updatedAt: now }
    };
  }

  function defaultReviewGrades(now) {
    return {
      "grade-s": { id: "grade-s", grade: "S", scoreMin: 95, scoreMax: 100, targetRatio: 5, status: "active", description: "탁월한 성과와 조직 기여가 확인된 최상위 등급", createdAt: now, updatedAt: now },
      "grade-a": { id: "grade-a", grade: "A", scoreMin: 88, scoreMax: 94, targetRatio: 20, status: "active", description: "기대 수준을 명확히 초과한 우수 등급", createdAt: now, updatedAt: now },
      "grade-b": { id: "grade-b", grade: "B", scoreMin: 75, scoreMax: 87, targetRatio: 55, status: "active", description: "기대 수준을 충족한 표준 등급", createdAt: now, updatedAt: now },
      "grade-c": { id: "grade-c", grade: "C", scoreMin: 60, scoreMax: 74, targetRatio: 15, status: "active", description: "개선 과제가 필요한 등급", createdAt: now, updatedAt: now },
      "grade-d": { id: "grade-d", grade: "D", scoreMin: 0, scoreMax: 59, targetRatio: 5, status: "active", description: "성과 개선 계획이 필요한 등급", createdAt: now, updatedAt: now }
    };
  }

  function defaultCompensationRules(now) {
    return {
      "compRule-s": { id: "compRule-s", grade: "S", targetRaiseRate: 9, minRaiseRate: 7, maxRaiseRate: 12, budgetWeight: 1.4, status: "active", guidance: "핵심성과자 유지와 리텐션 목적의 상위 조정 구간입니다.", createdAt: now, updatedAt: now },
      "compRule-a": { id: "compRule-a", grade: "A", targetRaiseRate: 6, minRaiseRate: 4, maxRaiseRate: 8, budgetWeight: 1.15, status: "active", guidance: "우수 성과자에게 시장 경쟁력과 내부 형평을 함께 반영합니다.", createdAt: now, updatedAt: now },
      "compRule-b": { id: "compRule-b", grade: "B", targetRaiseRate: 4, minRaiseRate: 2, maxRaiseRate: 5, budgetWeight: 1, status: "active", guidance: "표준 성과자 기준 조정 구간입니다.", createdAt: now, updatedAt: now },
      "compRule-c": { id: "compRule-c", grade: "C", targetRaiseRate: 1, minRaiseRate: 0, maxRaiseRate: 2, budgetWeight: 0.55, status: "active", guidance: "개선 계획과 함께 제한적 조정을 검토합니다.", createdAt: now, updatedAt: now },
      "compRule-d": { id: "compRule-d", grade: "D", targetRaiseRate: 0, minRaiseRate: 0, maxRaiseRate: 0, budgetWeight: 0, status: "active", guidance: "성과 개선 계획 우선 대상이며 정기 조정 제외를 기본으로 검토합니다.", createdAt: now, updatedAt: now }
    };
  }

  function defaultCertificateTemplates(now) {
    return {
      "tmpl-001": { id: "tmpl-001", name: "재직증명서", type: "재직증명서", title: "재직증명서", useCase: "금융기관/관공서 제출", owner: "People팀", status: "active", description: "재직 상태와 입사일, 직무를 포함합니다.", body: "위 사람은 {{hireDate}}부터 현재까지 {{companyName}} 소속 구성원으로 재직 중임을 증명합니다.\n\n본 증명서는 신청인의 요청에 따라 {{submitTo}} 제출 용도로 발급합니다.", footer: "{{issuedAt}}\n{{legalName}}\n대표이사 {{representativeName}}", createdAt: now, updatedAt: now },
      "tmpl-002": careerCertificateTemplate(now),
      "tmpl-003": { id: "tmpl-003", name: "퇴직증명서", type: "퇴직증명서", title: "퇴직증명서", useCase: "퇴직 사실 확인", owner: "People팀", status: "active", description: "퇴직일과 최종 소속을 포함합니다.", body: "위 사람은 {{companyName}}에서 근무한 사실이 있음을 증명합니다.\n\n최종 소속 및 직무 정보는 인사 시스템에 등록된 이력 기준으로 확인되었습니다.", footer: "{{issuedAt}}\n{{legalName}}\n대표이사 {{representativeName}}", createdAt: now, updatedAt: now },
      "tmpl-004": { id: "tmpl-004", name: "원천징수영수증", type: "원천징수영수증", title: "원천징수영수증 발급 확인서", useCase: "세무 제출", owner: "경영지원팀", status: "active", description: "세무 제출용 발급 확인 문구를 포함합니다.", body: "위 사람의 원천징수영수증 발급이 처리되었음을 확인합니다.\n\n본 확인서는 세무 및 행정 제출 목적으로 발급합니다.", footer: "{{issuedAt}}\n{{legalName}}\n담당부서", createdAt: now, updatedAt: now }
    };
  }

  function careerCertificateTemplate(now) {
    return {
      id: "tmpl-002",
      name: "경력증명서",
      type: "경력증명서",
      title: "경력증명서",
      useCase: "이직/자격요건/경력 산정 제출",
      owner: "People팀",
      status: "active",
      description: "근무기간, 담당업무, 퇴사일을 포함해 경력 확인용으로 발급합니다.",
      body: "위 사람은 {{companyName}}에서 {{careerPeriod}} 동안 아래 담당 업무를 수행한 경력이 있음을 증명합니다.\n\n담당 업무: {{duties}}\n\n본 증명서는 {{submitTo}} 제출을 위한 경력 확인 용도로 발급합니다.",
      footer: "{{issuedAt}}\n{{legalName}}\n대표이사 {{representativeName}}",
      createdAt: now,
      updatedAt: now
    };
  }

  function createSeedData() {
    const now = nowStamp();
    return {
      meta: {
        schemaVersion: SCHEMA_VERSION,
        companyName: "",
        legalName: "",
        representativeName: "",
        businessNo: "",
        companyAddress: "",
        hrContact: "",
        environment: "Firebase 운영",
        certificateNoPrefix: "CERT",
        certificateNoDigits: 6,
        createdAt: now,
        updatedAt: now
      },
      profiles: {},
      orgs: {},
      employees: {},
      reviews: {
        cycles: {},
        results: {}
      },
      compensationPlans: {},
      compensationItems: {},
      certificates: {
        requests: {},
        templateVersions: {},
        templates: {
          "tmpl-001": { id: "tmpl-001", name: "재직증명서", type: "재직증명서", title: "재직증명서", useCase: "금융기관/관공서 제출", owner: "People팀", status: "active", description: "재직 상태와 입사일, 직무를 포함합니다.", body: "위 사람은 {{hireDate}}부터 현재까지 {{companyName}} 소속 구성원으로 재직 중임을 증명합니다.\n\n본 증명서는 신청인의 요청에 따라 {{submitTo}} 제출 용도로 발급합니다.", footer: "{{issuedAt}}\n{{legalName}}\n대표이사 {{representativeName}}", updatedAt: now },
          "tmpl-002": careerCertificateTemplate(now),
          "tmpl-003": { id: "tmpl-003", name: "퇴직증명서", type: "퇴직증명서", title: "퇴직증명서", useCase: "퇴직 사실 확인", owner: "People팀", status: "draft", description: "퇴직일과 최종 소속을 포함합니다.", body: "위 사람은 {{companyName}}에서 근무한 사실이 있음을 증명합니다.\n\n최종 소속 및 직무 정보는 인사 시스템에 등록된 이력 기준으로 확인되었습니다.", footer: "{{issuedAt}}\n{{legalName}}\n대표이사 {{representativeName}}", updatedAt: now },
          "tmpl-004": { id: "tmpl-004", name: "원천징수영수증", type: "원천징수영수증", title: "원천징수영수증 발급 확인서", useCase: "세무 제출", owner: "경영지원팀", status: "active", description: "세무 제출용 발급 확인 문구를 포함합니다.", body: "위 사람의 원천징수영수증 발급이 처리되었음을 확인합니다.\n\n본 확인서는 세무 및 행정 제출 목적으로 발급합니다.", footer: "{{issuedAt}}\n{{legalName}}\n담당부서", updatedAt: now }
        },
        issued: {}
      },
      salaryBasics: {},
      salaryHistory: {},
      approvals: {},
      auditLogs: {},
      settings: {
        roles: Object.fromEntries(ROLE_LABELS.map((role) => [role, { id: role, name: role }])),
        reviewCriteria: defaultReviewCriteria(now),
        reviewGrades: defaultReviewGrades(now),
        compensationRules: defaultCompensationRules(now),
        codes: defaultCodes()
      }
    };
  }
})();
