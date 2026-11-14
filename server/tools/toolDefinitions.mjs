// server/tools/toolDefinitions.mjs

/**
 * مصفوفة الصلاحيات ومستويات الأمان لكل أداة
 */
export const TOOL_PERMISSIONS = {
  get_company_overview: {
    level: 'READ_ONLY',
    description: 'قراءة النظرة العامة للشركة (متاح تلقائياً)',
    requiresApproval: false
  },
  get_projects: {
    level: 'READ_ONLY',
    description: 'استعراض المشروعات الحقيقية والفلترة (متاح تلقائياً)',
    requiresApproval: false
  },
  get_project_details: {
    level: 'READ_ONLY',
    description: 'قراءة التفاصيل والمهام المرتبطة بمشروع معين',
    requiresApproval: false
  },
  get_tasks: {
    level: 'READ_ONLY',
    description: 'استعراض المهام الفعلية وحالاتها ومواعيدها',
    requiresApproval: false
  },
  get_financial_summary: {
    level: 'READ_ONLY',
    description: 'قراءة الإيرادات والمصروفات والتقسيم الرباعي 25%',
    requiresApproval: false
  },
  get_crm_leads: {
    level: 'READ_ONLY',
    description: 'قراءة قائمة العملاء الحقيقيين ومسار المبيعات',
    requiresApproval: false
  },
  get_audit_logs: {
    level: 'READ_ONLY',
    description: 'استعراض سجل التدقيق الشفاف للعمليات السابقة',
    requiresApproval: false
  },
  propose_project_improvement: {
    level: 'DRAFT_PROPOSAL',
    description: 'اقتراح تحسين استباقي لمشروع وحفظه كمسودة تنتظر اعتماد الشريك',
    requiresApproval: true
  },
  draft_new_task: {
    level: 'DRAFT_PROPOSAL',
    description: 'صياغة مهمة مفصلة بخطوات واضحة وحفظها كمسودة تنتظر اعتماد الشريك',
    requiresApproval: true
  },
  github_get_accounts: {
    level: 'READ_ONLY',
    description: 'استعراض حسابات GitHub المتصلة وحالة الربط دون كشف أي توكنات',
    requiresApproval: false
  },
  github_list_repositories: {
    level: 'READ_ONLY',
    description: 'قراءة المستودعات المصرح بها في الحسابين واكتشاف التقنيات مع إزالة التكرار',
    requiresApproval: false
  },
  github_analyze_repository: {
    level: 'READ_ONLY',
    description: 'تحليل كود ومعمارية مستودع واكتشاف الثغرات الأمنية وفرص التحويل لـ SaaS',
    requiresApproval: false
  }
};

/**
 * تعريفات الأدوات الرسمية المتوافقة مع معيار Google Gen AI (Gemini Function Declarations)
 */
export const GEMINI_TOOL_DECLARATIONS = [
  {
    name: 'get_company_overview',
    description: 'الحصول على نظرة عامة شاملة لشركة TECHNOLOPIA تشمل عدد المشروعات النشطة، عدد المهام المعلقة، عدد العملاء، والرصيد المالي الحقيقي.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'get_projects',
    description: 'قراءة المشروعات الحقيقية للشركة وفلترتها حسب الحالة أو الشريك المسؤول مع تفاصيل التقنيات المستخدمة ونسب الإنجاز.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: {
          type: 'STRING',
          description: 'حالة المشروع (active, planning, completed)',
          enum: ['active', 'planning', 'completed']
        },
        assignedTo: {
          type: 'STRING',
          description: 'الشريك المسؤول عن المشروع (mohamed, tarek, both)',
          enum: ['mohamed', 'tarek', 'both']
        }
      }
    }
  },
  {
    name: 'get_project_details',
    description: 'قراءة التفاصيل العميقة لمشروع محدد تشمل متطلباته، مراحله، والمهام المرتبطة به.',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId: {
          type: 'STRING',
          description: 'معرف المشروع المطلوب قراءته (مثال: proj-1 أو proj-7)'
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_tasks',
    description: 'قراءة المهام الفعلية للشركة ومواعيد تسليمها والأولويات ومن المكلف بها.',
    parameters: {
      type: 'OBJECT',
      properties: {
        assignedTo: {
          type: 'STRING',
          description: 'الشريك المكلف بالمهمة (mohamed, tarek, both)',
          enum: ['mohamed', 'tarek', 'both']
        },
        status: {
          type: 'STRING',
          description: 'حالة المهمة (todo, in_progress, completed)',
          enum: ['todo', 'in_progress', 'completed']
        },
        priority: {
          type: 'STRING',
          description: 'أولوية المهمة (urgent, high, normal)',
          enum: ['urgent', 'high', 'normal']
        }
      }
    }
  },
  {
    name: 'get_financial_summary',
    description: 'قراءة الملخص المالي الحقيقي للشركة (الإيرادات الفعلية، المصروفات المعتمدة، وتوزيع الأرباح الأربعة 25% لكل شريك وصندوق التطوير والصدقة). لا تعيد أي بيانات وهمية.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'get_crm_leads',
    description: 'قراءة قائمة العملاء الحقيقيين المسجلين في CRM ومراحل التواصل والعروض المقدمة.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: {
          type: 'STRING',
          description: 'حالة العميل في مسار المبيعات'
        }
      }
    }
  },
  {
    name: 'get_audit_logs',
    description: 'استعراض سجل التدقيق الأمني والعمليات التي نفذها المساعد التنفيذي.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: {
          type: 'INTEGER',
          description: 'الحد الأقصى لعدد السجلات المطلوبة (افتراضي 20)'
        }
      }
    }
  },
  {
    name: 'propose_project_improvement',
    description: 'اقتراح تحسين استباقي لمشروع معين. يتم حفظ الاقتراح كمسودة بانتظار مراجعة وموافقة الشريكين (لا يعدل بيانات المشروع مباشرة).',
    parameters: {
      type: 'OBJECT',
      properties: {
        projectId: {
          type: 'STRING',
          description: 'معرف المشروع المراد تحسينه (مثال: proj-1)'
        },
        title: {
          type: 'STRING',
          description: 'عنوان مقترح التحسين'
        },
        category: {
          type: 'STRING',
          description: 'نوع التحسين',
          enum: ['technical', 'business', 'ux', 'security']
        },
        problemDiagnosis: {
          type: 'STRING',
          description: 'تشخيص المشكلة الحالية أو فرصة النمو المستهدفة'
        },
        proposedSolution: {
          type: 'STRING',
          description: 'تفاصيل الحل المقترح وخطوات تنفيذه'
        },
        expectedImpact: {
          type: 'STRING',
          description: 'الأثر المتوقع على نمو المشروع أو المبيعات'
        }
      },
      required: ['projectId', 'title', 'category', 'problemDiagnosis', 'proposedSolution', 'expectedImpact']
    }
  },
  {
    name: 'draft_new_task',
    description: 'صياغة مهمة جديدة ومفصلة بخطوات واضحة. يتم حفظ المهمة كمسودة تنتظر اعتماد الشريك قبل إدراجها في خطة العمل الفعلية.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: {
          type: 'STRING',
          description: 'عنوان المهمة التفصيلي'
        },
        description: {
          type: 'STRING',
          description: 'وصف المهمة وخلفيتها'
        },
        assignedTo: {
          type: 'STRING',
          description: 'الشريك المكلف بالمهمة',
          enum: ['mohamed', 'tarek', 'both']
        },
        priority: {
          type: 'STRING',
          description: 'أولوية المهمة',
          enum: ['urgent', 'high', 'normal']
        },
        dueDate: {
          type: 'STRING',
          description: 'تاريخ الاستحقاق المقترح (YYYY-MM-DD)'
        },
        steps: {
          type: 'ARRAY',
          description: 'قائمة بالخطوات التنفيذية المتسلسلة لإنجاز المهمة',
          items: {
            type: 'STRING'
          }
        }
      },
      required: ['title', 'description', 'assignedTo', 'priority', 'dueDate', 'steps']
    }
  },
  {
    name: 'github_get_accounts',
    description: 'استعراض حسابات GitHub المتصلة بالمنصة (الحساب الأول والثاني) وحالة التوثيق دون كشف أي توكنات.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'github_list_repositories',
    description: 'استعراض كافة مستودعات GitHub المصرح بها في الحسابين واكتشاف لغات البرمجة والتقنيات والمشروعات مع منع التكرار.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'github_analyze_repository',
    description: 'تحليل معمق لكود ومعمارية مشروع على GitHub، واكتشاف الأخطاء والثغرات الأمنية وفرص التحويل لـ Micro-SaaS.',
    parameters: {
      type: 'OBJECT',
      properties: {
        repoName: {
          type: 'STRING',
          description: 'اسم المستودع المراد تحليله (مثال: TECHNOLOPIA أو pizza-fresh-menu أو odoo19-zatca-phase2)'
        }
      },
      required: ['repoName']
    }
  }
];
