import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardSection } from './components/sections/DashboardSection';
import { ProfitCalculatorSection } from './components/sections/ProfitCalculatorSection';
import { FinancialManagementSection } from './components/sections/FinancialManagementSection';
import { DevelopmentFundSection } from './components/sections/DevelopmentFundSection';
import { SadaqahFundSection } from './components/sections/SadaqahFundSection';
import { PartnerAccountSection } from './components/sections/PartnerAccountSection';
import { AiCeoSection } from './components/sections/AiCeoSection';
import { ProjectsHubSection } from './components/sections/ProjectsHubSection';
import { ProjectsSection } from './components/sections/ProjectsSection';
import { TasksSection } from './components/sections/TasksSection';
import { CrmSection } from './components/sections/CrmSection';
import { MarketingSalesSection } from './components/sections/MarketingSalesSection';
import { SkillsDevelopmentSection } from './components/sections/SkillsDevelopmentSection';
import { TokenMonitorSection } from './components/sections/TokenMonitorSection';
import { SettingsSection } from './components/sections/SettingsSection';
import { GovernanceDecisionsSection } from './components/sections/GovernanceDecisionsSection';
import { PullToRefresh } from './components/PullToRefresh';
import { NotificationService } from './services/notificationService';

import { PartnerId, PartnerProfile, CompanyMeta } from './types/company';
import { ProjectItem, TaskItem } from './types/projects';
import { ClientItem, PipelineStage } from './types/crm';
import { FinancialTransaction, ProfitDistributionCycle, CompanyDevUsage, SadaqahDonationRecord, FourWayProfitSplit } from './types/finance';
import { StrategicDecision, CompanyMemoryItem } from './types/decisions';

import { AppStorageService } from './services/storageService';
import { isFirebaseConnected } from './services/firebase';
import { FirestoreSyncService } from './services/firestoreSyncService';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentPartner, setCurrentPartner] = useState<PartnerId>('mohamed');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // الحالات المركزية للبيانات
  const [partners, setPartners] = useState<PartnerProfile[]>(() => AppStorageService.getPartners());
  const [companyMeta, setCompanyMeta] = useState<CompanyMeta>(() => AppStorageService.getCompanyMeta());
  const [projects, setProjects] = useState<ProjectItem[]>(() => AppStorageService.getProjects());
  const [tasks, setTasks] = useState<TaskItem[]>(() => AppStorageService.getTasks());
  const [clients, setClients] = useState<ClientItem[]>(() => AppStorageService.getClients());
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => AppStorageService.getTransactions());
  const [profitCycles, setProfitCycles] = useState<ProfitDistributionCycle[]>(() => AppStorageService.getProfitCycles());
  const [devUsages, setDevUsages] = useState<CompanyDevUsage[]>(() => AppStorageService.getDevUsages());
  const [sadaqahRecords, setSadaqahRecords] = useState<SadaqahDonationRecord[]>(() => AppStorageService.getSadaqahRecords());
  const [decisions, setDecisions] = useState<StrategicDecision[]>(() => AppStorageService.getDecisions());
  const [memories, setMemories] = useState<CompanyMemoryItem[]>(() => AppStorageService.getMemories());

  const isFirebaseActive = isFirebaseConnected();

  // تفعيل المزامنة اللحظية مع Cloud Firestore
  useEffect(() => {
    FirestoreSyncService.initializeAndSeedIfEmpty();

    const unsubTx = FirestoreSyncService.subscribeTransactions((items) => {
      setTransactions(items);
      AppStorageService.saveTransactions(items);
    });

    const unsubCycles = FirestoreSyncService.subscribeProfitCycles((items) => {
      setProfitCycles(items);
      AppStorageService.saveProfitCycles(items);
    });

    const unsubProjects = FirestoreSyncService.subscribeProjects((items) => {
      setProjects(items);
      AppStorageService.saveProjects(items);
    });

    const unsubTasks = FirestoreSyncService.subscribeTasks((items) => {
      setTasks(items);
      AppStorageService.saveTasks(items);
    });

    const unsubClients = FirestoreSyncService.subscribeClients((items) => {
      setClients(items);
      AppStorageService.saveClients(items);
    });

    const unsubDev = FirestoreSyncService.subscribeDevUsages((items) => {
      setDevUsages(items);
      AppStorageService.saveDevUsages(items);
    });

    const unsubSadaqah = FirestoreSyncService.subscribeSadaqah((items) => {
      setSadaqahRecords(items);
      AppStorageService.saveSadaqahRecords(items);
    });

    const unsubMeta = FirestoreSyncService.subscribeMeta((meta) => {
      setCompanyMeta(meta);
      AppStorageService.saveCompanyMeta(meta);
    });

    const unsubDecisions = FirestoreSyncService.subscribeDecisions((items) => {
      setDecisions(items);
      AppStorageService.saveDecisions(items);
    });

    const unsubMemories = FirestoreSyncService.subscribeMemories((items) => {
      setMemories(items);
      AppStorageService.saveMemories(items);
    });

    return () => {
      unsubTx();
      unsubCycles();
      unsubProjects();
      unsubTasks();
      unsubClients();
      unsubDev();
      unsubSadaqah();
      unsubMeta();
      unsubDecisions();
      unsubMemories();
    };
  }, []);

  // فحص دوري لمواعيد تسليم المهام وإرسال تنبيهات الهاتف والكمبيوتر للشريك
  useEffect(() => {
    NotificationService.checkTasksDue(tasks, currentPartner);
    const interval = setInterval(() => {
      NotificationService.checkTasksDue(tasks, currentPartner);
    }, 45000);
    return () => clearInterval(interval);
  }, [tasks, currentPartner]);

  // دالة السحب للتحديث (Pull to Refresh) مع مزامنة فورية
  const handleRefresh = async () => {
    NotificationService.checkTasksDue(tasks, currentPartner);
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const pendingApprovalsCount = profitCycles.filter(c => {
    if (c.status === 'approved') return false;
    if (currentPartner === 'mohamed') return !c.mohamedApproved;
    if (currentPartner === 'tarek') return !c.tarekApproved;
    return false;
  }).length;

  const handleAddTransaction = (newTxData: Omit<FinancialTransaction, 'id' | 'createdAt'>) => {
    const newTx: FinancialTransaction = {
      ...newTxData,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    AppStorageService.saveTransactions(updated);
    FirestoreSyncService.saveTransaction(newTx);
    AppStorageService.logAction(
      currentPartner, 
      'تسجيل معاملة مالية', 
      `${newTx.type === 'revenue' ? 'إيراد' : 'مصروف'} بقيمة ${newTx.amount} ج.م - ${newTx.title}`, 
      'finance'
    );
  };

  const handleApproveCycle = (cycleId: string, partner: PartnerId) => {
    const targetCycle = profitCycles.find(c => c.id === cycleId);
    if (!targetCycle) return;

    const isMohamed = partner === 'mohamed';
    const isTarek = partner === 'tarek';

    const mohamedApproved = isMohamed ? true : targetCycle.mohamedApproved;
    const tarekApproved = isTarek ? true : targetCycle.tarekApproved;
    const nowIso = new Date().toISOString();
    const bothApproved = mohamedApproved && tarekApproved;

    const updatedCycle: ProfitDistributionCycle = {
      ...targetCycle,
      mohamedApproved,
      mohamedApprovedAt: isMohamed ? nowIso : targetCycle.mohamedApprovedAt,
      tarekApproved,
      tarekApprovedAt: isTarek ? nowIso : targetCycle.tarekApprovedAt,
      status: bothApproved ? ('approved' as const) : ('pending_approval' as const)
    };

    const updated = profitCycles.map(c => c.id === cycleId ? updatedCycle : c);
    setProfitCycles(updated);
    AppStorageService.saveProfitCycles(updated);
    FirestoreSyncService.saveProfitCycle(updatedCycle);

    AppStorageService.logAction(
      partner,
      'اعتماد دورة أرباح',
      `تم اعتماد الدورة من الشريك ${partner === 'mohamed' ? 'محمد البحر' : 'طارق حافظ'}`,
      'finance'
    );
  };

  const handleCreateNewCycle = (cycleData: Omit<ProfitDistributionCycle, 'id' | 'createdAt'>) => {
    const newCycle: ProfitDistributionCycle = {
      ...cycleData,
      id: `cycle-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newCycle, ...profitCycles];
    setProfitCycles(updated);
    AppStorageService.saveProfitCycles(updated);
    FirestoreSyncService.saveProfitCycle(newCycle);
    AppStorageService.logAction(
      currentPartner,
      'إنشاء دورة أرباح جديدة',
      `دورة ${newCycle.periodName} بقيمة صافي ربح ${newCycle.netDistributableProfit} ج.م`,
      'finance'
    );
  };

  const handleCreateCycleFromCalculation = (split: FourWayProfitSplit, note: string) => {
    const newCycle: ProfitDistributionCycle = {
      id: `cycle-calc-${Date.now()}`,
      periodName: note || `دورة أرباح حاسبة ${new Date().toLocaleDateString('ar-EG')}`,
      startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      collectedRevenue: split.collectedRevenue,
      totalExpenses: split.totalExpenses,
      netDistributableProfit: split.netDistributableProfit,
      tarekShare: split.tarekShare,
      mohamedShare: split.mohamedShare,
      companyDevShare: split.companyDevShare,
      sadaqahShare: split.sadaqahShare,
      status: 'pending_approval',
      mohamedApproved: currentPartner === 'mohamed',
      mohamedApprovedAt: currentPartner === 'mohamed' ? new Date().toISOString() : undefined,
      tarekApproved: currentPartner === 'tarek',
      tarekApprovedAt: currentPartner === 'tarek' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString()
    };
    const updated = [newCycle, ...profitCycles];
    setProfitCycles(updated);
    AppStorageService.saveProfitCycles(updated);
    FirestoreSyncService.saveProfitCycle(newCycle);
  };

  const handleAddProject = (projectData: Omit<ProjectItem, 'id'>) => {
    const newProj: ProjectItem = {
      ...projectData,
      id: `proj-${Date.now()}`
    };
    const updated = [newProj, ...projects];
    setProjects(updated);
    AppStorageService.saveProjects(updated);
    FirestoreSyncService.saveProject(newProj);
    AppStorageService.logAction(currentPartner, 'إضافة مشروع جديد', newProj.name, 'project');
  };

  const handleUpdateProjectStatus = (projectId: string, status: ProjectItem['status']) => {
    const target = projects.find(p => p.id === projectId);
    if (!target) return;
    const updatedProj = { ...target, status };
    const updated = projects.map(p => p.id === projectId ? updatedProj : p);
    setProjects(updated);
    AppStorageService.saveProjects(updated);
    FirestoreSyncService.saveProject(updatedProj);
  };

  const handleAddTask = (taskData: Omit<TaskItem, 'id' | 'createdAt'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    AppStorageService.saveTasks(updated);
    FirestoreSyncService.saveTask(newTask);
    AppStorageService.logAction(currentPartner, 'إسناد مهمة جديدة', newTask.title, 'task');
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskItem['status']) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    const nowIso = new Date().toISOString();
    const updatedTask = { 
      ...target, 
      status,
      completedAt: status === 'completed' ? nowIso : target.completedAt 
    };
    const updated = tasks.map(t => t.id === taskId ? updatedTask : t);
    setTasks(updated);
    AppStorageService.saveTasks(updated);
    FirestoreSyncService.saveTask(updatedTask);
  };

  const handleUpdateTask = (updatedTask: TaskItem) => {
    const updated = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(updated);
    AppStorageService.saveTasks(updated);
    FirestoreSyncService.saveTask(updatedTask);
  };

  const handleUpdateProject = (updatedProj: ProjectItem) => {
    const updated = projects.map(p => p.id === updatedProj.id ? updatedProj : p);
    setProjects(updated);
    AppStorageService.saveProjects(updated);
    FirestoreSyncService.saveProject(updatedProj);
  };

  const handleAddClient = (clientData: Omit<ClientItem, 'id' | 'createdAt'>) => {
    const newClient: ClientItem = {
      ...clientData,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newClient, ...clients];
    setClients(updated);
    AppStorageService.saveClients(updated);
    FirestoreSyncService.saveClient(newClient);
    AppStorageService.logAction(currentPartner, 'تسجيل عميل جديد', newClient.name, 'crm');
  };

  const handleUpdateClientStage = (clientId: string, stage: PipelineStage) => {
    const target = clients.find(c => c.id === clientId);
    if (!target) return;
    const updatedClient = { ...target, stage };
    const updated = clients.map(c => c.id === clientId ? updatedClient : c);
    setClients(updated);
    AppStorageService.saveClients(updated);
    FirestoreSyncService.saveClient(updatedClient);
  };

  const handleAddDevUsage = (usageData: Omit<CompanyDevUsage, 'id'>) => {
    const newUsage: CompanyDevUsage = {
      ...usageData,
      id: `dev-${Date.now()}`
    };
    const updated = [newUsage, ...devUsages];
    setDevUsages(updated);
    AppStorageService.saveDevUsages(updated);
    FirestoreSyncService.saveDevUsage(newUsage);
    AppStorageService.logAction(currentPartner, 'صرف من صندوق التطوير', `${newUsage.toolName} بمبلغ ${newUsage.amount} ج.م`, 'finance');
  };

  const handleAddDonation = (donationData: Omit<SadaqahDonationRecord, 'id'>) => {
    const newDonation: SadaqahDonationRecord = {
      ...donationData,
      id: `sadaqah-${Date.now()}`
    };
    const updated = [newDonation, ...sadaqahRecords];
    setSadaqahRecords(updated);
    AppStorageService.saveSadaqahRecords(updated);
    FirestoreSyncService.saveSadaqah(newDonation);
    AppStorageService.logAction(currentPartner, 'تسجيل صدقة مخرجة', `مبلغ ${newDonation.amount} ج.م - ${newDonation.notes}`, 'finance');
  };

  const handleAddDecision = (decisionData: Omit<StrategicDecision, 'id' | 'createdAt'>) => {
    const newDec: StrategicDecision = {
      ...decisionData,
      id: `dec-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newDec, ...decisions];
    setDecisions(updated);
    AppStorageService.saveDecisions(updated);
    FirestoreSyncService.saveDecision(newDec);
    AppStorageService.logAction(currentPartner, 'طرح قرار استراتيجي جديد', newDec.title, 'system');
  };

  const handleApproveDecision = (decisionId: string, partner: PartnerId) => {
    const target = decisions.find(d => d.id === decisionId);
    if (!target) return;

    const isMohamed = partner === 'mohamed';
    const isTarek = partner === 'tarek';

    const mohamedApproved = isMohamed ? true : target.mohamedApproved;
    const tarekApproved = isTarek ? true : target.tarekApproved;
    const bothApproved = mohamedApproved && tarekApproved;
    const nowIso = new Date().toISOString();

    const updatedDec: StrategicDecision = {
      ...target,
      mohamedApproved,
      mohamedApprovedAt: isMohamed ? nowIso : target.mohamedApprovedAt,
      tarekApproved,
      tarekApprovedAt: isTarek ? nowIso : target.tarekApprovedAt,
      status: bothApproved ? 'approved' : 'pending'
    };

    const updated = decisions.map(d => d.id === decisionId ? updatedDec : d);
    setDecisions(updated);
    AppStorageService.saveDecisions(updated);
    FirestoreSyncService.saveDecision(updatedDec);
    AppStorageService.logAction(partner, 'اعتماد قرار استراتيجي', `تم توقيع قرار ${updatedDec.title}`, 'system');
  };

  const handleAddMemory = (memoryData: Omit<CompanyMemoryItem, 'id' | 'createdAt'>) => {
    const newMem: CompanyMemoryItem = {
      ...memoryData,
      id: `mem-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newMem, ...memories];
    setMemories(updated);
    AppStorageService.saveMemories(updated);
    FirestoreSyncService.saveMemory(newMem);
    AppStorageService.logAction(currentPartner, 'إضافة ذاكرة مؤسسية', newMem.topic, 'system');
  };

  const handleExecuteAiAction = (action: any) => {
    if (action.type === 'create_task') {
      handleAddTask({
        title: action.payload.title,
        description: 'مهمة منبثقة بتوجيه من المدير التنفيذي الذكي',
        assignedTo: action.payload.assignedTo || currentPartner,
        priority: action.payload.priority || 'high',
        status: 'todo',
        dueDate: action.payload.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        isPrivate: false,
        createdBy: currentPartner
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      
      {/* الشريط العلوي المصمم للموبايل والديسكتوب */}
      <Navbar
        currentPartner={currentPartner}
        partners={partners}
        companyMeta={companyMeta}
        pendingApprovalsCount={pendingApprovalsCount}
        onPartnerSwitch={setCurrentPartner}
        onOpenCeo={() => setActiveTab('ai_ceo')}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        isFirebaseActive={isFirebaseActive}
        onRefresh={handleRefresh}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* القائمة الجانبية (تعمل كـ Drawer في الموبايل وقائمة أنيقة في الديسكتوب) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentPartner={currentPartner}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        {/* مساحة المحتوى الرئيسية مع مسافة سفلية لحماية أزرار الموبايل وميزة السحب للتحديث */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 overflow-y-auto pb-24 md:pb-8">
          <PullToRefresh onRefresh={handleRefresh}>
            {activeTab === 'dashboard' && (
            <DashboardSection
              currentPartner={currentPartner}
              partners={partners}
              companyMeta={companyMeta}
              projects={projects}
              tasks={tasks}
              transactions={transactions}
              profitCycles={profitCycles}
              onNavigate={setActiveTab}
              onOpenNewTransaction={() => setActiveTab('finance')}
              onOpenNewProject={() => setActiveTab('projects')}
            />
          )}

          {activeTab === 'profit_calculator' && (
            <ProfitCalculatorSection
              onCreateCycleFromCalculation={handleCreateCycleFromCalculation}
            />
          )}

          {activeTab === 'finance' && (
            <FinancialManagementSection
              currentPartner={currentPartner}
              transactions={transactions}
              profitCycles={profitCycles}
              projects={projects}
              onAddTransaction={handleAddTransaction}
              onApproveCycle={handleApproveCycle}
              onCreateNewCycle={handleCreateNewCycle}
            />
          )}

          {activeTab === 'dev_fund' && (
            <DevelopmentFundSection
              currentPartner={currentPartner}
              profitCycles={profitCycles}
              devUsages={devUsages}
              onAddDevUsage={handleAddDevUsage}
            />
          )}

          {activeTab === 'sadaqah_fund' && (
            <SadaqahFundSection
              currentPartner={currentPartner}
              profitCycles={profitCycles}
              sadaqahRecords={sadaqahRecords}
              onAddDonation={handleAddDonation}
            />
          )}

          {activeTab === 'mohamed_account' && (
            <PartnerAccountSection
              partnerId="mohamed"
              partners={partners}
              profitCycles={profitCycles}
              tasks={tasks}
            />
          )}

          {activeTab === 'tarek_account' && (
            <PartnerAccountSection
              partnerId="tarek"
              partners={partners}
              profitCycles={profitCycles}
              tasks={tasks}
            />
          )}

          {activeTab === 'ai_ceo' && (
            <AiCeoSection
              currentPartner={currentPartner}
              partners={partners}
              onExecuteAction={handleExecuteAiAction}
            />
          )}

          {activeTab === 'governance' && (
            <GovernanceDecisionsSection
              currentPartner={currentPartner}
              decisions={decisions}
              memories={memories}
              onAddDecision={handleAddDecision}
              onApproveDecision={handleApproveDecision}
              onAddMemory={handleAddMemory}
            />
          )}

          {activeTab === 'projects_hub' && (
            <ProjectsHubSection
              currentPartner={currentPartner}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsSection
              projects={projects}
              currentPartner={currentPartner}
              onAddProject={handleAddProject}
              onUpdateStatus={handleUpdateProjectStatus}
              onUpdateProject={handleUpdateProject}
              onOpenProjectsHub={() => setActiveTab('projects_hub')}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksSection
              tasks={tasks}
              currentPartner={currentPartner}
              onAddTask={handleAddTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onUpdateTask={handleUpdateTask}
            />
          )}

          {activeTab === 'crm' && (
            <CrmSection
              clients={clients}
              currentPartner={currentPartner}
              onAddClient={handleAddClient}
              onUpdateStage={handleUpdateClientStage}
            />
          )}

          {activeTab === 'marketing' && (
            <MarketingSalesSection />
          )}

          {activeTab === 'skills' && (
            <SkillsDevelopmentSection partners={partners} />
          )}

          {activeTab === 'token_monitor' && (
            <TokenMonitorSection />
          )}

          {activeTab === 'settings' && (
            <SettingsSection
              companyMeta={companyMeta}
              onUpdateMeta={(meta) => {
                setCompanyMeta(meta);
                FirestoreSyncService.saveMeta(meta);
              }}
            />
          )}
          </PullToRefresh>
        </main>

      </div>

      {/* شريط التنقل السفلي الثابت لشاشات الموبايل (Native App Style) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenMore={() => setIsSidebarOpen(true)}
        pendingApprovalsCount={pendingApprovalsCount}
      />

    </div>
  );
}

export default App;
