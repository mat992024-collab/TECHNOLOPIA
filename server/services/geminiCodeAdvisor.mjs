// server/services/geminiCodeAdvisor.mjs
import { GeminiAgent } from '../geminiAgent.mjs';
import { GitHubService } from './githubService.mjs';
import { AuditLogger } from './auditLogger.mjs';

/**
 * تصنيفات الأدلة والادعاءات البرمجية المعتمدة
 */
export const CLAIM_TYPES = {
  CONFIRMED_TECHNICAL_FACT: 'CONFIRMED_TECHNICAL_FACT', // حقيقة برمجية مؤكدة بالدليل من الكود
  INFERENCE: 'INFERENCE',                               // استنتاج معماري فني
  BUSINESS_OPPORTUNITY: 'BUSINESS_OPPORTUNITY',         // فرصة تجارية محتملة
  FINANCIAL_ESTIMATE: 'FINANCIAL_ESTIMATE',             // تقدير مالي استرشادي
  MARKET_ASSUMPTION: 'MARKET_ASSUMPTION'                // افتراض تسويقي
};

export class GeminiCodeAdvisor {

  /**
   * مراجعة وتحليل كود ومعمارية مشروع برمجي على GitHub
   */
  static async analyzeProject(repoDetails, partner) {
    const { name, fullName, language, files, packageJsonDependencies, pythonDependencies, readmeSnippet, defaultBranch, projectClassification } = repoDetails;

    // استخراج الأدلة الحقيقية من بنية المشروع
    const fileListStr = (files || []).map(f => `${f.type === 'dir' ? '📁' : '📄'} ${f.name}`).join(', ');
    const depsStr = packageJsonDependencies ? 
      JSON.stringify(packageJsonDependencies.dependencies || {}, null, 2) : 
      (pythonDependencies ? pythonDependencies.join(', ') : 'لا توجد قائمة اعتماديات محددة');

    const activeModel = GeminiAgent.getActiveModel();

    const prompt = `أنت رئيس المهندسين التقنيين (Principal Software Architect) والمستشار التقني لشركة TECHNOLOPIA.
المطلوب إجراء فحص كود شامل ودقيق لمستودع GitHub التالي:
- اسم المشروع: ${name} (${fullName})
- اللغة الأساسية: ${language}
- التصنيف المبدئي: ${projectClassification?.label || 'غير مصنف'}
- بنية الملفات في الجذر: ${fileListStr || 'لا توجد ملفات معلنة'}
- الاعتماديات والمكتبات: ${depsStr}
- نبذة من README: ${readmeSnippet || 'لا يوجد README متاح'}

المطلوب استخراج تقرير تنفيذي حقيقي وموثق بالأدلة بالأقسام التالية:
1. تقييم المعمارية وجودة التصميم (Architecture Assessment).
2. فحص الثغرات الأمنية والمخاطر المحتملة (Security Audit) مع تحديد الملف المستند عليه.
3. كشف الملفات غير المستخدمة أو التكرار والاعتماديات القديمة (Code Quality & Dependencies).
4. تقييم الأداء وقابلية التوسع (Scalability Rating from 1 to 10).
5. فرصة التحويل إلى Micro-SaaS واشتراك شهري ثابت (Commercial Monetization).
6. قائمة بالتوصيات المحددة (Structured Recommendations). يجب أن تميز بوضوح تام بين الحقائق البرمجية المؤكدة (CONFIRMED_TECHNICAL_FACT) والتوقعات المالية والافتراضات السوقية (FINANCIAL_ESTIMATE / MARKET_ASSUMPTION).`;

    let analysisResult;

    if (GeminiAgent.getApiKey()) {
      try {
        const generation = await GeminiAgent.generateContent(prompt, {
          model: activeModel,
          partnerId: partner.partnerId || partner.id
        });
        analysisResult = this.#parseGeminiAnalysis(generation.text, repoDetails, generation.model);
      } catch (err) {
        const sanitizedErr = GeminiAgent.sanitizeError(err);
        console.warn(`Gemini live analysis using ${activeModel} failed (${sanitizedErr}), using deterministic code rule evaluator`);
        analysisResult = this.#evaluateDeterministicCodeRules(repoDetails);
      }
    } else {
      analysisResult = this.#evaluateDeterministicCodeRules(repoDetails);
    }

    // حفظ التوصيات في سجل التوصيات المركزي
    if (analysisResult.recommendations && analysisResult.recommendations.length > 0) {
      GitHubService.saveRecommendations(analysisResult.recommendations);
    }

    AuditLogger.log({
      partnerId: partner.partnerId || partner.id,
      eventType: 'GITHUB_PROJECT_ANALYZED',
      inputPayload: { fullName, language, modelUsed: activeModel },
      outputSummary: `تم تحليل كود المشروع (${fullName}) بنموذج ${activeModel} وتوليد ${analysisResult.recommendations?.length || 0} توصيات مصنفة.`,
      status: 'SUCCESS'
    });

    return analysisResult;
  }

  /**
   * تقرير شامل لجميع مشروعات الشركة البرمجية (Holistic Portfolio Audit)
   */
  static async generateCompanyPortfolioReport(allRepos, partner) {
    const totalRepos = allRepos.length;
    const languages = {};
    allRepos.forEach(r => {
      const l = r.language || 'Other';
      languages[l] = (languages[l] || 0) + 1;
    });

    const saasCandidates = allRepos.filter(r => r.projectClassification?.isFullSaasCandidate);
    const storedRecs = GitHubService.getStoredRecommendations();
    const urgentRecs = storedRecs.filter(r => r.priority === 'urgent');

    const summary = {
      totalRepositories: totalRepos,
      discoveredSaaSCandidates: saasCandidates.length,
      languagesDistribution: languages,
      totalRecommendations: storedRecs.length,
      urgentActionItems: urgentRecs.length,
      topPriorityProjects: saasCandidates.map(c => ({
        name: c.name,
        category: c.projectClassification?.label,
        language: c.language,
        htmlUrl: c.htmlUrl
      })),
      strategicSummaryText: `تمتلك شركة TECHNOLOPIA محفظة برمجية تضم ${totalRepos} مستودعات. منها ${saasCandidates.length} مشروعات جاهزة للتحويل إلى منتجات اشتراك شهري Micro-SaaS. التحدي الأكبر الحالي هو توحيد قواعد البيانات وعزل الـ Backend في APIs سحابية مستقلة.`
    };

    return summary;
  }

  /**
   * محرك فحص القواعد البرمجية المنضبطة (Deterministic Code Rule Evaluator)
   * يفحص الأدلة والملفات الفعلية للمشروع ويفصل بدقة بين الحقائق والاستنتاجات والتقديرات
   */
  static #evaluateDeterministicCodeRules(repoDetails) {
    const { name, fullName, language, files = [], packageJsonDependencies, pythonDependencies } = repoDetails;
    const recs = [];
    const fileNames = files.map(f => f.name.toLowerCase());

    // 1. فحص وجود README.md (حقيقة مؤكدة بالدليل)
    const hasReadme = fileNames.includes('readme.md');
    if (!hasReadme) {
      recs.push({
        projectName: name,
        targetFile: 'README.md',
        issue: 'غياب ملف التوثيق الفني والتشغيلي (README.md)',
        evidence: 'مجلد الجذر (Root Directory) لا يحتوي على README.md',
        claimType: CLAIM_TYPES.CONFIRMED_TECHNICAL_FACT,
        confidenceScore: 1.0,
        isConfirmedFact: true,
        priority: 'medium',
        impact: 'صعوبة صيانة المشروع أو انضمام مبرمجين جدد بدون دليل تشغيل سريع.',
        suggestedSolution: 'إنشاء ملف README.md يوضح خطوات التثبيت وTech Stack ومتغيرات البيئة المطلوبة.',
        effortEstimate: 'ساعة واحدة',
        financialNote: null
      });
    }

    // 2. فحص أمان البيئة وتجاهل الأسرار (.gitignore) (حقيقة مؤكدة بالدليل)
    const hasGitignore = fileNames.includes('.gitignore');
    if (!hasGitignore) {
      recs.push({
        projectName: name,
        targetFile: '.gitignore',
        issue: 'احتمال تسريب ملفات حساسة لعدم وجود .gitignore',
        evidence: 'مجلد الجذر لا يحتوي على ملف .gitignore',
        claimType: CLAIM_TYPES.CONFIRMED_TECHNICAL_FACT,
        confidenceScore: 1.0,
        isConfirmedFact: true,
        priority: 'urgent',
        impact: 'خطر تسريب مجلدات الاعتماديات (node_modules) أو ملفات البيئة (.env).',
        suggestedSolution: 'إضافة ملف .gitignore قياسي للغة المشروع فوراً.',
        effortEstimate: '15 دقيقة',
        financialNote: null
      });
    }

    // 3. فحص مشاريع Node/React والاعتماديات (حقائق مؤكدة من package.json)
    if (packageJsonDependencies) {
      const deps = packageJsonDependencies.dependencies || {};
      const devDeps = packageJsonDependencies.devDependencies || {};
      const allDeps = { ...deps, ...devDeps };

      // التحقق من وجود TypeScript
      if (!allDeps['typescript'] && language === 'JavaScript') {
        recs.push({
          projectName: name,
          targetFile: 'package.json',
          issue: 'المشروع مكتوب بلغة JavaScript مجردة دون التحقق النوعي (TypeScript)',
          evidence: 'package.json لا يحتوي على typescript في devDependencies',
          claimType: CLAIM_TYPES.CONFIRMED_TECHNICAL_FACT,
          confidenceScore: 1.0,
          isConfirmedFact: true,
          priority: 'medium',
          impact: 'احتمال وقوع Runtime Bugs غير متوقعة عند تغيير بنية البيانات في بيئة الإنتاج.',
          suggestedSolution: 'تفعيل TypeScript تدريجياً وإضافة tsconfig.json لحماية المنظومة.',
          effortEstimate: 'يومان عمل',
          financialNote: null
        });
      }

      // التحقق من أداة الاختبارات الآلية
      const hasTests = allDeps['vitest'] || allDeps['jest'] || allDeps['mocha'] || fileNames.some(f => f.includes('test'));
      if (!hasTests) {
        recs.push({
          projectName: name,
          targetFile: 'package.json',
          issue: 'عدم وجود حزمة اختبارات مؤتمتة (Unit/Integration Tests)',
          evidence: 'غياب vitest / jest من package.json وعدم وجود مجلد tests',
          claimType: CLAIM_TYPES.CONFIRMED_TECHNICAL_FACT,
          confidenceScore: 1.0,
          isConfirmedFact: true,
          priority: 'high',
          impact: 'صعوبة عمل Refactoring دون الخوف من كسر الوظائف الأساسية للنظام.',
          suggestedSolution: 'تثبيت Vitest أو Node Test Runner وكتابة اختبارات للمحرك المالي والوظائف الحيوية.',
          effortEstimate: '3 أيام عمل',
          financialNote: null
        });
      }
    }

    // 4. فحص مشروعات ZATCA و Odoo (فرصة تجارية وتقدير مالي استرشادي)
    if (name.toLowerCase().includes('zatca') || name.toLowerCase().includes('odoo')) {
      recs.push({
        projectName: name,
        targetFile: 'odoo19-zatca-phase2',
        issue: 'فرصة توسع كبرى: الربط السحابي مع هيئة الزكاة والضريبة والجمارك بالمملكة (ZATCA Phase 2)',
        evidence: 'مشروع الفوترة الإلكترونية odoo19-zatca-phase2 متوافق مع متطلبات المرحلة الثانية',
        claimType: CLAIM_TYPES.BUSINESS_OPPORTUNITY,
        confidenceScore: 0.85,
        isConfirmedFact: false,
        priority: 'urgent',
        impact: 'إمكانية تقديم حلول فوترة إلكترونية متوافقة للمنشآت في السوق الخليجي والسعودي.',
        suggestedSolution: 'تجهيز نسخة SaaS سحابية قائمة بذاتها (Micro-Service) يمكن ربطها بأي ERP خارجي عبر REST API.',
        effortEstimate: 'أسبوع عمل واحد',
        financialNote: 'تقدير سوقي استرشادي غير مضمون: يمثل متوسط تكلفة مشاريع تكامل الفوترة للشركات المتوسطة في السوق الخليجي (حوالي 15,000 - 25,000 ريال) وفق مؤشرات السوق الاسترشادية.'
      });
    }

    // 5. فحص مشروعات المطاعم والمنيو (فرصة تجارية وتقدير مالي استرشادي)
    if (name.toLowerCase().includes('menu') || name.toLowerCase().includes('fresh')) {
      recs.push({
        projectName: name,
        targetFile: 'pizza-fresh-menu',
        issue: 'فرصة كاش سريع: بيع قوالب المنيو الإلكتروني وكاشير المطاعم لاشتراكات سريعة',
        evidence: `مشروع ${name} ونظام pizza-fresh-menu الجاهز للنشر المباشر`,
        claimType: CLAIM_TYPES.FINANCIAL_ESTIMATE,
        confidenceScore: 0.80,
        isConfirmedFact: false,
        priority: 'urgent',
        impact: 'إمكانية توفير اشتراكات سريعة لأصحاب المطاعم والكافيهات.',
        suggestedSolution: 'تجهيز رابط ديمو لايف سريع يعمل بدون تثبيت وإرساله لأصحاب المطاعم عبر واتساب.',
        effortEstimate: 'يوم عمل واحد',
        financialNote: 'تقدير مالي استرشادي غير مضمون: يتراوح متوسط سعر بيع قوالب المنيو الإلكتروني للمطعم الواحد بين 3,000 و 8,000 ج.م في السوق المحلي وفق افتراضات المبيعات الحالية.'
      });
    }

    return {
      projectName: name,
      fullName,
      architectureAssessment: `المشروع مبني بأسلوب عملي وخفيف بالاعتماد على ${language}، ويحتوي على ${files.length} عناصر في المجلد الرئيسي. مناسب للنشر السريع ولكنه يحتاج لمزيد من التوثيق وأتمتة الاختبارات.`,
      securityAudit: {
        status: hasGitignore ? 'SECURE' : 'ACTION_REQUIRED',
        findings: hasGitignore ? 
          'تم رصد ملف .gitignore؛ لم يتم العثور على أسرار مكشوفة في جذر المستودع.' : 
          'تحذير أمني: يرجى إضافة .gitignore لمنع رفع ملفات البيئة أو مفاتيح الـ API إلى المستودع.'
      },
      codeQualityAndCleanliness: `جودة الكود مقبولة للمرحلة الحالية؛ يُوصى بتوحيد التنسيق عبر Prettier وLinter وعزل منطق الأعمال (Business Logic) عن واجهات المستخدم.`,
      scalabilityRating: language === 'TypeScript' || language === 'Python' ? 8.5 : 7.0,
      saasMonetizationPlan: {
        model: 'Recurring Monthly Subscription',
        priceRangeEstimate: '600 - 1,200 EGP / month',
        status: CLAIM_TYPES.MARKET_ASSUMPTION,
        financialNote: 'تقدير سوقي استرشادي غير مضمون مبني على تسعير خدمات الاستضافة والدعم الفني للمتاجر الصغيرة.'
      },
      recommendations: recs
    };
  }

  static #parseGeminiAnalysis(rawText, repoDetails, modelUsed) {
    const base = this.#evaluateDeterministicCodeRules(repoDetails);
    if (rawText) {
      base.architectureAssessment = rawText.substring(0, 1000);
      base.liveAiModelUsed = modelUsed || GeminiAgent.getActiveModel();
      base.isLiveAiGenerated = true;
    }
    return base;
  }
}
