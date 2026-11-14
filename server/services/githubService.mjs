// server/services/githubService.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuditLogger } from './auditLogger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SECURE_ACCOUNTS_FILE = path.resolve(__dirname, '../data/github_accounts_secure.json');
const RECOMMENDATIONS_FILE = path.resolve(__dirname, '../../backups/tecnolobia_github_recommendations.json');
const CACHE_FILE = path.resolve(__dirname, '../../backups/tecnolobia_github_repos_cache.json');

/**
 * خدمة التكامل مع GitHub وحوكمة المشروعات البرمجية
 * تعمل حصرياً في وضع القراءة فقط (Strict Read-Only) وتدعم حسابين منفصلين
 */
export class GitHubService {

  /**
   * قراءة ملف التوكنات الآمن من الخادم فقط (محمي من المتصفح والـ Git)
   */
  static #getSecureStore() {
    if (!fs.existsSync(SECURE_ACCOUNTS_FILE)) {
      const initial = {
        account_1: { token: process.env.GITHUB_TOKEN_1 || null, connectedAt: null, slotName: 'الحساب الرئيسي' },
        account_2: { token: process.env.GITHUB_TOKEN_2 || null, connectedAt: null, slotName: 'الحساب الإضافي' }
      };
      fs.writeFileSync(SECURE_ACCOUNTS_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    try {
      return JSON.parse(fs.readFileSync(SECURE_ACCOUNTS_FILE, 'utf8'));
    } catch (e) {
      return { account_1: { token: null }, account_2: { token: null } };
    }
  }

  static #saveSecureStore(store) {
    fs.writeFileSync(SECURE_ACCOUNTS_FILE, JSON.stringify(store, null, 2), 'utf8');
  }

  /**
   * طلب آمن ومحمي بنظام القراءة فقط (GET فقط، ويمنع نهائياً POST أو PUT أو DELETE)
   */
  static async #safeGithubGet(endpoint, token) {
    const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
    const headers = {
      'User-Agent': 'TECHNOLOPIA-Projects-Hub-v1',
      'Accept': 'application/vnd.github.v3+json'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const res = await fetch(url, {
      method: 'GET', // حظر مطلق لأي أفعال تعديل
      headers
    });

    const scopesHeader = res.headers.get('x-oauth-scopes') || '';
    const rateLimitRemaining = res.headers.get('x-ratelimit-remaining');

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const error = new Error(errBody.message || `GitHub API error (${res.status})`);
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    return { data, scopes: scopesHeader.split(',').map(s => s.trim()).filter(Boolean), rateLimitRemaining };
  }

  /**
   * حالة الحسابين المتصلين دون تسريب أي توكنات
   */
  static async getAccountsStatus() {
    const store = this.#getSecureStore();
    const result = {};

    for (const slotId of ['account_1', 'account_2']) {
      const slot = store[slotId];
      if (!slot || !slot.token) {
        result[slotId] = {
          slotId,
          slotName: slot?.slotName || (slotId === 'account_1' ? 'الحساب الرئيسي' : 'الحساب الثاني'),
          connected: false,
          username: null,
          displayName: null,
          avatarUrl: null,
          profileUrl: null,
          scopes: [],
          repoCount: 0,
          connectedAt: null,
          lastVerifiedAt: null
        };
      } else {
        try {
          const { data: user, scopes } = await this.#safeGithubGet('/user', slot.token);
          result[slotId] = {
            slotId,
            slotName: slot.slotName || (slotId === 'account_1' ? 'الحساب الرئيسي' : 'الحساب الثاني'),
            connected: true,
            username: user.login,
            displayName: user.name || user.login,
            avatarUrl: user.avatar_url,
            profileUrl: user.html_url,
            scopes,
            repoCount: (user.public_repos || 0) + (user.total_private_repos || 0),
            publicRepos: user.public_repos || 0,
            privateRepos: user.total_private_repos || 0,
            connectedAt: slot.connectedAt || new Date().toISOString(),
            lastVerifiedAt: new Date().toISOString()
          };
        } catch (err) {
          result[slotId] = {
            slotId,
            slotName: slot.slotName,
            connected: false,
            error: 'انتهت صلاحية الرمز أو تم إلغاؤه من GitHub',
            username: null,
            scopes: [],
            repoCount: 0
          };
        }
      }
    }

    return result;
  }

  /**
   * ربط حساب جديد برمز تصريح قراءة فقط آمن
   */
  static async connectAccount(slotId, token, partner) {
    if (!['account_1', 'account_2'].includes(slotId)) {
      throw new Error('معرف الحساب غير صالح. المتاح: account_1 أو account_2');
    }
    if (!token || typeof token !== 'string') {
      throw new Error('رمز الدخول (Personal Access Token أو OAuth Token) مطلوب');
    }

    // التحقق من صحة الرمز لدى GitHub
    const { data: user, scopes } = await this.#safeGithubGet('/user', token.trim());

    const store = this.#getSecureStore();
    store[slotId] = {
      token: token.trim(),
      username: user.login,
      displayName: user.name || user.login,
      avatarUrl: user.avatar_url,
      connectedAt: new Date().toISOString(),
      slotName: slotId === 'account_1' ? `حساب ${user.login} (الرئيسي)` : `حساب ${user.login} (الإضافي)`
    };
    this.#saveSecureStore(store);

    AuditLogger.log({
      partnerId: partner.id,
      eventType: 'GITHUB_ACCOUNT_CONNECTED',
      inputPayload: { slotId, username: user.login, scopes },
      outputSummary: `تم ربط حساب GitHub (${user.login}) في خانة ${slotId} بنجاح.`,
      status: 'SUCCESS'
    });

    return {
      success: true,
      slotId,
      username: user.login,
      displayName: user.name || user.login,
      avatarUrl: user.avatar_url,
      scopes,
      connectedAt: store[slotId].connectedAt
    };
  }

  /**
   * إلغاء ربط الحساب وسحب التوكن من السيرفر
   */
  static disconnectAccount(slotId, partner) {
    const store = this.#getSecureStore();
    if (!store[slotId]) return { success: true };

    const oldUsername = store[slotId].username || 'unknown';
    store[slotId] = {
      token: null,
      connectedAt: null,
      slotName: slotId === 'account_1' ? 'الحساب الرئيسي' : 'الحساب الثاني'
    };
    this.#saveSecureStore(store);

    AuditLogger.log({
      partnerId: partner.id,
      eventType: 'GITHUB_ACCOUNT_DISCONNECTED',
      inputPayload: { slotId, username: oldUsername },
      outputSummary: `تم إلغاء ربط حساب GitHub (${oldUsername}) وسحب التوكن بالكامل.`,
      status: 'SUCCESS'
    });

    return { success: true, message: `تم إلغاء ربط الحساب (${slotId}) بنجاح.` };
  }

  /**
   * استعراض واكتشاف كافة المستودعات في الحسابين مع إزالة التكرار (Deduplication)
   */
  static async listAllRepositories() {
    const store = this.#getSecureStore();
    const reposMap = new Map();

    for (const slotId of ['account_1', 'account_2']) {
      const slot = store[slotId];
      if (!slot || !slot.token) continue;

      try {
        const { data: repos } = await this.#safeGithubGet('/user/repos?per_page=100&sort=updated', slot.token);
        if (Array.isArray(repos)) {
          for (const r of repos) {
            const key = r.name.toLowerCase();
            if (reposMap.has(key)) {
              // تم اكتشاف المستودع في الحسابين: منع التكرار وتحديث الحسابات المرتبطة
              const existing = reposMap.get(key);
              if (!existing.linkedAccounts.includes(slotId)) {
                existing.linkedAccounts.push(slotId);
              }
              if (r.permissions?.admin) existing.canAdmin = true;
            } else {
              reposMap.set(key, {
                id: r.id,
                name: r.name,
                fullName: r.full_name,
                owner: r.owner?.login,
                avatarUrl: r.owner?.avatar_url,
                description: r.description || 'لا يوجد وصف رسمي متاح',
                htmlUrl: r.html_url,
                isPrivate: r.private,
                language: r.language || 'غير محدد',
                defaultBranch: r.default_branch || 'main',
                openIssuesCount: r.open_issues_count || 0,
                stars: r.stargazers_count || 0,
                forks: r.forks_count || 0,
                updatedAt: r.updated_at,
                pushedAt: r.pushed_at,
                createdAt: r.created_at,
                linkedAccounts: [slotId],
                projectClassification: this.#classifyProject(r)
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Could not fetch repos for ${slotId}:`, err.message);
      }
    }

    const repoList = Array.from(reposMap.values());
    
    // حفظ نسخة كاش للسرعة والعمل بدون إنترنت
    if (repoList.length > 0) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(repoList, null, 2), 'utf8');
    }

    return repoList;
  }

  /**
   * تفاصيل عميقة لمستودع محدد (الفروع، آخر الكوميتس، بنية الملفات، والـ package.json)
   */
  static async getRepositoryDetails(owner, repo) {
    const store = this.#getSecureStore();
    const token = store.account_1?.token || store.account_2?.token;

    // 1. البيانات الأساسية للمستودع
    const { data: repoData } = await this.#safeGithubGet(`/repos/${owner}/${repo}`, token);

    // 2. آخر 5 Commits
    let commits = [];
    try {
      const { data: commitList } = await this.#safeGithubGet(`/repos/${owner}/${repo}/commits?per_page=5`, token);
      commits = commitList.map(c => ({
        sha: c.sha.substring(0, 7),
        message: c.commit.message,
        author: c.commit.author?.name || c.author?.login,
        date: c.commit.author?.date
      }));
    } catch (e) {
      commits = [];
    }

    // 3. الفروع (Branches)
    let branches = [];
    try {
      const { data: branchList } = await this.#safeGithubGet(`/repos/${owner}/${repo}/branches?per_page=20`, token);
      branches = branchList.map(b => b.name);
    } catch (e) {
      branches = [repoData.default_branch || 'main'];
    }

    // 4. بنية المجلدات في الجذر (Top-level File Tree)
    let files = [];
    let packageJsonContent = null;
    let requirementsTxtContent = null;
    let readmeSnippet = null;

    try {
      const { data: contents } = await this.#safeGithubGet(`/repos/${owner}/${repo}/contents`, token);
      if (Array.isArray(contents)) {
        files = contents.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type, // 'file' | 'dir'
          size: item.size
        }));

        // فحص package.json إن وجد
        const pkgFile = contents.find(f => f.name === 'package.json');
        if (pkgFile && pkgFile.download_url) {
          try {
            const raw = await (await fetch(pkgFile.download_url)).text();
            packageJsonContent = JSON.parse(raw);
          } catch (e) {}
        }

        // فحص requirements.txt إن وجد
        const reqFile = contents.find(f => f.name === 'requirements.txt');
        if (reqFile && reqFile.download_url) {
          try {
            requirementsTxtContent = await (await fetch(reqFile.download_url)).text();
          } catch (e) {}
        }

        // فحص README.md إن وجد
        const readmeFile = contents.find(f => f.name.toLowerCase() === 'readme.md');
        if (readmeFile && readmeFile.download_url) {
          try {
            const rawReadme = await (await fetch(readmeFile.download_url)).text();
            readmeSnippet = rawReadme.substring(0, 800);
          } catch (e) {}
        }
      }
    } catch (e) {
      files = [];
    }

    // 5. عدد Pull Requests المفتوحة
    let openPrsCount = 0;
    try {
      const { data: prs } = await this.#safeGithubGet(`/repos/${owner}/${repo}/pulls?state=open&per_page=1`, token);
      openPrsCount = prs.length;
    } catch (e) {}

    return {
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description || 'لا يوجد وصف',
      htmlUrl: repoData.html_url,
      isPrivate: repoData.private,
      language: repoData.language || 'غير محدد',
      defaultBranch: repoData.default_branch || 'main',
      branches,
      latestCommits: commits,
      lastCommitDate: commits[0]?.date || repoData.pushed_at,
      openIssuesCount: repoData.open_issues_count || 0,
      openPrsCount,
      files,
      packageJsonDependencies: packageJsonContent ? {
        dependencies: packageJsonContent.dependencies || {},
        devDependencies: packageJsonContent.devDependencies || {}
      } : null,
      pythonDependencies: requirementsTxtContent ? requirementsTxtContent.split('\n').filter(Boolean) : null,
      readmeSnippet,
      projectClassification: this.#classifyProject(repoData, files, packageJsonContent)
    };
  }

  /**
   * تصنيف طبيعة المشروع بذكاء ومنع افتراض الاستقلالية دون فحص
   */
  static #classifyProject(repo, files = [], pkg = null) {
    const name = repo.name.toLowerCase();
    const desc = (repo.description || '').toLowerCase();
    const fileNames = files.map(f => f.name.toLowerCase());

    if (name.includes('pos') || name.includes('cashier') || name.includes('كاشير') || name.includes('fresh')) {
      return { type: 'RESTAURANT_POS', label: 'نظام كاشير ومطاعم', isFullSaasCandidate: true };
    }
    if (name.includes('menu') || name.includes('qr')) {
      return { type: 'QR_MENU', label: 'منيو إلكتروني QR', isFullSaasCandidate: true };
    }
    if (name.includes('erp') || name.includes('zatca') || name.includes('odoo')) {
      return { type: 'ENTERPRISE_ERP', label: 'نظام إدارة مؤسسي / فوترة', isFullSaasCandidate: true };
    }
    if (name.includes('delivery') || name.includes('carrier')) {
      return { type: 'DELIVERY_LOGISTICS', label: 'لوجستيات وتوصيل', isFullSaasCandidate: true };
    }
    if (name.includes('portfolio') || name.includes('elghandour')) {
      return { type: 'PORTFOLIO_SITE', label: 'موقع أعمال وبورتفوليو', isFullSaasCandidate: false };
    }
    if (name === 'technolobia') {
      return { type: 'PLATFORM_CORE', label: 'منصة TECHNOLOPIA المركزية', isFullSaasCandidate: true };
    }

    if (repo.language === 'Kotlin' || repo.language === 'Java') {
      return { type: 'MOBILE_APP', label: 'تطبيق أندرويد للهواتف', isFullSaasCandidate: true };
    }

    return { type: 'UTILITY_OR_SUBMODULE', label: 'وحدة برمجية / مشروع تجريبي', isFullSaasCandidate: false };
  }

  /**
   * استرجاع التوصيات المسجلة السابقة
   */
  static getStoredRecommendations() {
    if (!fs.existsSync(RECOMMENDATIONS_FILE)) return [];
    try {
      return JSON.parse(fs.readFileSync(RECOMMENDATIONS_FILE, 'utf8'));
    } catch (e) {
      return [];
    }
  }

  /**
   * حفظ توصيات جديدة من Gemini
   */
  static saveRecommendations(recs) {
    const existing = this.getStoredRecommendations();
    const updated = [...existing];

    recs.forEach(r => {
      const id = r.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const index = updated.findIndex(x => x.projectName === r.projectName && x.issue === r.issue);
      if (index >= 0) {
        updated[index] = { ...updated[index], ...r, updatedAt: new Date().toISOString() };
      } else {
        updated.push({
          id,
          createdAt: new Date().toISOString(),
          status: 'pending',
          ...r
        });
      }
    });

    fs.writeFileSync(RECOMMENDATIONS_FILE, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  }

  /**
   * تحديث حالة توصية (اعتماد / تجاهل / تمت المراجعة)
   */
  static updateRecommendationStatus(id, newStatus, partner) {
    const list = this.getStoredRecommendations();
    const item = list.find(r => r.id === id);
    if (!item) throw new Error(`التوصية (${id}) غير موجودة.`);

    item.status = newStatus;
    item.reviewedBy = partner.id;
    item.reviewedAt = new Date().toISOString();

    fs.writeFileSync(RECOMMENDATIONS_FILE, JSON.stringify(list, null, 2), 'utf8');

    AuditLogger.log({
      partnerId: partner.id,
      eventType: 'RECOMMENDATION_STATUS_UPDATED',
      inputPayload: { id, newStatus },
      outputSummary: `تم تحديث حالة التوصية (${item.issue}) إلى ${newStatus}.`,
      status: 'SUCCESS'
    });

    return item;
  }
}
