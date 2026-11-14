// server/services/githubService.mjs
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { AuditLogger } from './auditLogger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SECURE_ACCOUNTS_FILE = path.resolve(__dirname, '../data/github_accounts_secure.json');
const RECOMMENDATIONS_FILE = path.resolve(__dirname, '../../backups/tecnolobia_github_recommendations.json');
const CACHE_FILE = path.resolve(__dirname, '../../backups/tecnolobia_github_repos_cache.json');

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/**
 * اشتقاق مفتاح التشفير المتماثل بأمان من متغير البيئة
 */
function getMasterEncryptionKey() {
  const secret = process.env.GITHUB_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'TECNOLOBIA_EXECUTIVE_SECURE_KEY_2026_COFOUNDERS';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * تشفير التوكن بخوارزمية AES-256-GCM مع التحقق التوثيقي
 */
function encryptToken(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') return null;
  const key = getMasterEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag
  };
}

/**
 * فك تشفير التوكن والتحقق من سلامته التوثيقية
 */
function decryptToken(payload) {
  if (!payload) return null;
  // دعم التوافق مع التوكنات النصية القديمة قبل الترحيل
  if (typeof payload === 'string') return payload;
  if (!payload.encrypted || !payload.iv || !payload.authTag) return null;

  try {
    const key = getMasterEncryptionKey();
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(payload.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[SECURITY_ALERT] Failed to decrypt GitHub token:', err.message);
    return null;
  }
}

/**
 * كتابة ذرية آمنة متوافقة مع أنظمة التشغيل المختلفة
 */
function writeJsonAtomic(filePath, data) {
  const content = JSON.stringify(data, null, 2);
  const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
  try {
    fs.writeFileSync(tmpPath, content, 'utf8');
    try {
      fs.renameSync(tmpPath, filePath);
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EEXIST') {
        fs.copyFileSync(tmpPath, filePath);
        try { fs.unlinkSync(tmpPath); } catch (_) {}
      } else {
        throw err;
      }
    }
  } catch (e) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

/**
 * خدمة التكامل مع GitHub وحوكمة المشروعات البرمجية
 * تعمل حصرياً في وضع القراءة فقط (Strict Read-Only) وتدعم حسابين منفصلين مشفرين بـ AES-256-GCM
 */
export class GitHubService {

  /**
   * قراءة ملف التوكنات الآمن من الخادم فقط (مشفر بـ AES-256-GCM ومحمي من المتصفح والـ Git)
   */
  static #getSecureStore() {
    if (!fs.existsSync(SECURE_ACCOUNTS_FILE)) {
      const initial = {
        account_1: {
          slotId: 'account_1',
          ownerPartnerId: 'mohamed',
          slotName: 'الحساب الرئيسي (م. محمد البحر)',
          encryptedToken: process.env.GITHUB_TOKEN_1 ? encryptToken(process.env.GITHUB_TOKEN_1) : null,
          connectedAt: null,
          username: null
        },
        account_2: {
          slotId: 'account_2',
          ownerPartnerId: 'tarek',
          slotName: 'الحساب الإضافي (م. طارق حافظ)',
          encryptedToken: process.env.GITHUB_TOKEN_2 ? encryptToken(process.env.GITHUB_TOKEN_2) : null,
          connectedAt: null,
          username: null
        }
      };
      writeJsonAtomic(SECURE_ACCOUNTS_FILE, initial);
      return initial;
    }

    try {
      const raw = JSON.parse(fs.readFileSync(SECURE_ACCOUNTS_FILE, 'utf8'));
      // ترحيل تلقائي للبيانات القديمة غير المشفرة
      let needsSave = false;
      for (const slotId of ['account_1', 'account_2']) {
        if (!raw[slotId]) {
          raw[slotId] = {
            slotId,
            ownerPartnerId: slotId === 'account_1' ? 'mohamed' : 'tarek',
            slotName: slotId === 'account_1' ? 'الحساب الرئيسي (م. محمد البحر)' : 'الحساب الإضافي (م. طارق حافظ)',
            encryptedToken: null,
            connectedAt: null,
            username: null
          };
          needsSave = true;
        } else {
          // ترقية التوكن النصي إلى توكن مشفر
          if (raw[slotId].token && !raw[slotId].encryptedToken) {
            raw[slotId].encryptedToken = encryptToken(raw[slotId].token);
            delete raw[slotId].token;
            needsSave = true;
          }
          if (!raw[slotId].ownerPartnerId) {
            raw[slotId].ownerPartnerId = slotId === 'account_1' ? 'mohamed' : 'tarek';
            needsSave = true;
          }
        }
      }
      if (needsSave) {
        writeJsonAtomic(SECURE_ACCOUNTS_FILE, raw);
      }
      return raw;
    } catch (e) {
      return {
        account_1: { slotId: 'account_1', ownerPartnerId: 'mohamed', encryptedToken: null },
        account_2: { slotId: 'account_2', ownerPartnerId: 'tarek', encryptedToken: null }
      };
    }
  }

  static #saveSecureStore(store) {
    writeJsonAtomic(SECURE_ACCOUNTS_FILE, store);
  }

  /**
   * استخراج التوكن مفكوك التشفير في الذاكرة المؤقتة فقط للطلب الصادر
   */
  static #getDecryptedToken(slot) {
    if (!slot) return null;
    if (slot.encryptedToken) {
      return decryptToken(slot.encryptedToken);
    }
    if (slot.token) {
      return slot.token;
    }
    return null;
  }

  /**
   * طلب آمن ومحمي بنظام القراءة فقط (GET فقط، ويمنع نهائياً POST أو PUT أو DELETE على GitHub)
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
   * حالة الحسابين المتصلين دون تسريب أي توكنات أو مفاتيح تشفير (Zero Token Leakage)
   */
  static async getAccountsStatus() {
    const store = this.#getSecureStore();
    const result = {};

    for (const slotId of ['account_1', 'account_2']) {
      const slot = store[slotId];
      const token = this.#getDecryptedToken(slot);
      const ownerPartnerId = slot?.ownerPartnerId || (slotId === 'account_1' ? 'mohamed' : 'tarek');

      if (!slot || !token) {
        result[slotId] = {
          slotId,
          ownerPartnerId,
          slotName: slot?.slotName || (slotId === 'account_1' ? 'الحساب الرئيسي (م. محمد البحر)' : 'الحساب الإضافي (م. طارق حافظ)'),
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
          const { data: user, scopes } = await this.#safeGithubGet('/user', token);
          result[slotId] = {
            slotId,
            ownerPartnerId,
            slotName: slot.slotName || (slotId === 'account_1' ? 'الحساب الرئيسي (م. محمد البحر)' : 'الحساب الإضافي (م. طارق حافظ)'),
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
            ownerPartnerId,
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
   * ربط حساب جديد برمز تصريح قراءة فقط آمن ومشفر بـ AES-256-GCM
   * مع التحقق الصارم من ملكية الشريك للخانة المحددة (Partner Isolation)
   */
  static async connectAccount(slotId, token, partner) {
    if (!['account_1', 'account_2'].includes(slotId)) {
      throw new Error('معرف الحساب غير صالح. المتاح: account_1 أو account_2');
    }
    if (!token || typeof token !== 'string') {
      throw new Error('رمز الدخول (Personal Access Token أو OAuth Token) مطلوب');
    }

    const partnerId = partner?.partnerId || partner?.id;

    // حظر تعديل حساب الشريك الآخر (Cross-Partner Account Isolation)
    if (slotId === 'account_1' && partnerId !== 'mohamed') {
      const err = new Error('مرفوض أمنياً: خانة الحساب الرئيسي (account_1) مخصصة حصرياً للشريك التقني م. محمد البحر.');
      err.code = 'FORBIDDEN_PARTNER_ACCESS';
      throw err;
    }
    if (slotId === 'account_2' && partnerId !== 'tarek') {
      const err = new Error('مرفوض أمنياً: خانة الحساب الإضافي (account_2) مخصصة حصرياً لشريك الأعمال م. طارق حافظ.');
      err.code = 'FORBIDDEN_PARTNER_ACCESS';
      throw err;
    }

    // التحقق من صحة الرمز لدى GitHub
    const { data: user, scopes } = await this.#safeGithubGet('/user', token.trim());

    const store = this.#getSecureStore();
    store[slotId] = {
      slotId,
      ownerPartnerId: slotId === 'account_1' ? 'mohamed' : 'tarek',
      encryptedToken: encryptToken(token.trim()), // تشفير AES-256-GCM
      username: user.login,
      displayName: user.name || user.login,
      avatarUrl: user.avatar_url,
      connectedAt: new Date().toISOString(),
      slotName: slotId === 'account_1' ? `حساب ${user.login} (الرئيسي)` : `حساب ${user.login} (الإضافي)`
    };
    this.#saveSecureStore(store);

    AuditLogger.log({
      partnerId,
      eventType: 'GITHUB_ACCOUNT_CONNECTED',
      inputPayload: { slotId, username: user.login, scopes },
      outputSummary: `تم ربط وتشفير حساب GitHub (${user.login}) في خانة ${slotId} بنجاح بتقنية AES-256-GCM.`,
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
   * إلغاء ربط الحساب وسحب التوكن من السيرفر مع التحقق من صلاحيات الشريك
   */
  static disconnectAccount(slotId, partner) {
    const partnerId = partner?.partnerId || partner?.id;

    if (slotId === 'account_1' && partnerId !== 'mohamed') {
      const err = new Error('مرفوض أمنياً: لا تملك صلاحية إلغاء ربط الحساب الرئيسي العائد للشريك الآخر.');
      err.code = 'FORBIDDEN_PARTNER_ACCESS';
      throw err;
    }
    if (slotId === 'account_2' && partnerId !== 'tarek') {
      const err = new Error('مرفوض أمنياً: لا تملك صلاحية إلغاء ربط الحساب الإضافي العائد للشريك الآخر.');
      err.code = 'FORBIDDEN_PARTNER_ACCESS';
      throw err;
    }

    const store = this.#getSecureStore();
    if (!store[slotId]) return { success: true };

    const oldUsername = store[slotId].username || 'unknown';
    store[slotId] = {
      slotId,
      ownerPartnerId: slotId === 'account_1' ? 'mohamed' : 'tarek',
      encryptedToken: null,
      username: null,
      connectedAt: null,
      slotName: slotId === 'account_1' ? 'الحساب الرئيسي (م. محمد البحر)' : 'الحساب الإضافي (م. طارق حافظ)'
    };
    this.#saveSecureStore(store);

    AuditLogger.log({
      partnerId,
      eventType: 'GITHUB_ACCOUNT_DISCONNECTED',
      inputPayload: { slotId, username: oldUsername },
      outputSummary: `تم إلغاء ربط حساب GitHub (${oldUsername}) ومحو التوكن المشفر نهائياً.`,
      status: 'SUCCESS'
    });

    return { success: true, message: `تم إلغاء ربط الحساب (${slotId}) بنجاح ومحو بيانات الاعتماد.` };
  }

  /**
   * استعراض واكتشاف كافة المستودعات في الحسابين مع إزالة التكرار (Deduplication)
   */
  static async listAllRepositories() {
    const store = this.#getSecureStore();
    const reposMap = new Map();

    for (const slotId of ['account_1', 'account_2']) {
      const slot = store[slotId];
      const token = this.#getDecryptedToken(slot);
      if (!token) continue;

      try {
        const { data: repos } = await this.#safeGithubGet('/user/repos?per_page=100&sort=updated', token);
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
    
    // حفظ نسخة كاش للسرعة والعمل الاحتياطي
    if (repoList.length > 0) {
      writeJsonAtomic(CACHE_FILE, repoList);
    } else if (fs.existsSync(CACHE_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      } catch (e) {}
    }

    return repoList;
  }

  /**
   * تفاصيل عميقة لمستودع محدد (الفروع، آخر الكوميتس، بنية الملفات، والـ package.json)
   */
  static async getRepositoryDetails(owner, repo) {
    const store = this.#getSecureStore();
    const token = this.#getDecryptedToken(store.account_1) || this.#getDecryptedToken(store.account_2);

    // 1. البيانات الأساسية للمستودع
    let repoData;
    try {
      const res = await this.#safeGithubGet(`/repos/${owner}/${repo}`, token);
      repoData = res.data;
    } catch (err) {
      // محاولة استرجاع البيانات من الكاش المحلي في حال غياب الاتصال الحي
      if (fs.existsSync(CACHE_FILE)) {
        const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        const found = cached.find(r => r.name.toLowerCase() === repo.toLowerCase() || r.fullName.toLowerCase() === `${owner}/${repo}`.toLowerCase());
        if (found) {
          repoData = {
            name: found.name,
            full_name: found.fullName,
            description: found.description,
            html_url: found.htmlUrl,
            private: found.isPrivate,
            language: found.language,
            default_branch: found.defaultBranch,
            open_issues_count: found.openIssuesCount
          };
        }
      }
      if (!repoData) throw err;
    }

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
    const name = (repo.name || '').toLowerCase();
    const desc = (repo.description || '').toLowerCase();

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
   * حفظ توصيات جديدة مع حماية البيانات والتوثيق
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

    writeJsonAtomic(RECOMMENDATIONS_FILE, updated);
    return updated;
  }

  /**
   * تحديث حالة توصية (اعتماد / تجاهل / تمت المراجعة) داخل النظام المحلي فقط
   */
  static updateRecommendationStatus(id, newStatus, partner) {
    const list = this.getStoredRecommendations();
    const item = list.find(r => r.id === id);
    if (!item) throw new Error(`التوصية (${id}) غير موجودة.`);

    const partnerId = partner?.partnerId || partner?.id;
    item.status = newStatus;
    item.reviewedBy = partnerId;
    item.reviewedAt = new Date().toISOString();

    writeJsonAtomic(RECOMMENDATIONS_FILE, list);

    AuditLogger.log({
      partnerId,
      eventType: 'RECOMMENDATION_STATUS_UPDATED',
      inputPayload: { id, newStatus },
      outputSummary: `تم تحديث حالة التوصية (${item.issue}) إلى ${newStatus}.`,
      status: 'SUCCESS'
    });

    return item;
  }

  /**
   * حظر صريح ومطلق لأي عمليات كتابة أو تعديل على GitHub (Strict Read-Only Enforcement)
   */
  static createCommit() {
    throw new Error('READ_ONLY_VIOLATION: محظور أمنياً: نظام TECHNOLOPIA يعمل في وضع القراءة فقط (Strict Read-Only) ويمنع إنشاء Commit على GitHub.');
  }

  static pushBranch() {
    throw new Error('READ_ONLY_VIOLATION: محظور أمنياً: نظام TECHNOLOPIA يعمل في وضع القراءة فقط (Strict Read-Only) ويمنع عمل Push إلى GitHub.');
  }

  static createPullRequest() {
    throw new Error('READ_ONLY_VIOLATION: محظور أمنياً: نظام TECHNOLOPIA يعمل في وضع القراءة فقط (Strict Read-Only) ويمنع فتح Pull Request على GitHub.');
  }

  static deleteRepository() {
    throw new Error('READ_ONLY_VIOLATION: محظور أمنياً: نظام TECHNOLOPIA يعمل في وضع القراءة فقط (Strict Read-Only) ويمنع حذف أو تعديل مستودعات GitHub.');
  }
}
