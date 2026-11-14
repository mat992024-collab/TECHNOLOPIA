// scripts/model-cascade-audit.mjs
import { GoogleGenAI } from '@google/genai';
import { GEMINI_TOOL_DECLARATIONS } from '../server/tools/toolDefinitions.mjs';
import { ToolExecutors } from '../server/tools/toolExecutors.mjs';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY is not set');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { apiVersion: 'v1beta' }
});

const MODELS_TO_AUDIT = [
  { id: 'gemini-3.8-flash', tier: 'Primary Target (Preview/Experimental)', category: 'Gemini 3 Series' },
  { id: 'gemini-3-flash-preview', tier: 'Alternative Preview', category: 'Gemini 3 Preview Series' },
  { id: 'gemini-flash-lite-latest', tier: 'Production Stable (Lite)', category: 'Gemini Flash-Lite Series' },
  { id: 'gemini-flash-latest', tier: 'Production Stable (Full)', category: 'Gemini Flash Series' }
];

async function auditModel(modelConfig) {
  const modelName = modelConfig.id;
  console.log(`\n======================================================`);
  console.log(`AUDITING MODEL: ${modelName} (${modelConfig.tier})`);
  console.log(`======================================================`);

  const auditReport = {
    model: modelName,
    tier: modelConfig.tier,
    textGen: { status: null, httpCode: null, latencyMs: null, response: null, error: null },
    functionCalling: { status: null, httpCode: null, latencyMs: null, toolCalled: null, finalReply: null, error: null }
  };

  // 1. Text Generation Test (Arabic Executive Tone)
  console.log(`[1] Testing Arabic Text Generation...`);
  const t0 = performance.now();
  try {
    const res = await ai.models.generateContent({
      model: modelName,
      contents: 'أنت المساعد التنفيذي لشركة تكنولوبيا. عرّف بنفسك ودورك للشريكين محمد البحر وطارق حافظ في جملة واحدة مركزة باللغة العربية.',
      config: { temperature: 0.2 }
    });
    const latency = Math.round(performance.now() - t0);
    auditReport.textGen.status = 'SUCCESS';
    auditReport.textGen.httpCode = 200;
    auditReport.textGen.latencyMs = latency;
    auditReport.textGen.response = (res.text || '').trim();
    console.log(`   -> SUCCESS (HTTP 200) in ${latency}ms`);
    console.log(`   -> Response: "${auditReport.textGen.response.substring(0, 120)}..."`);
  } catch (err) {
    const latency = Math.round(performance.now() - t0);
    const httpStatus = err.status || err.statusCode || (err.message?.includes('503') ? 503 : (err.message?.includes('429') ? 429 : (err.message?.includes('404') ? 404 : 500)));
    auditReport.textGen.status = 'FAILED';
    auditReport.textGen.httpCode = httpStatus;
    auditReport.textGen.latencyMs = latency;
    auditReport.textGen.error = err.message || String(err);
    console.log(`   -> FAILED (HTTP ${httpStatus}) in ${latency}ms`);
    console.log(`   -> Error: ${auditReport.textGen.error.substring(0, 160)}`);
  }

  // 2. Function Calling Test
  console.log(`[2] Testing Real Function Calling...`);
  const t1 = performance.now();
  try {
    const contents = [
      { role: 'user', parts: [{ text: 'ما هي مشروعات شركة تكنولوبيا الحالية؟ استدع الدالة المناسبة.' }] }
    ];

    const res1 = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS.filter(t => t.name === 'get_projects') }],
        temperature: 0.2
      }
    });

    const fc = res1.functionCalls?.[0];
    if (fc && fc.name === 'get_projects') {
      auditReport.functionCalling.toolCalled = fc.name;

      // تنفيذ الأداة الحقيقية
      const toolExec = await ToolExecutors.execute('get_projects', {}, { id: 'mohamed', name: 'المهندس محمد البحر' });
      
      // التوافق مع Gemini 3 و Thought Signatures
      const modelTurn = res1.candidates?.[0]?.content || { role: 'model', parts: [{ functionCall: fc }] };
      contents.push(modelTurn);
      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name: fc.name,
            response: { output: toolExec.data }
          }
        }]
      });

      // جولة التوليد الثانية مع الرد
      const res2 = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS.filter(t => t.name === 'get_projects') }],
          temperature: 0.2
        }
      });

      const latency = Math.round(performance.now() - t1);
      auditReport.functionCalling.status = 'SUCCESS';
      auditReport.functionCalling.httpCode = 200;
      auditReport.functionCalling.latencyMs = latency;
      auditReport.functionCalling.finalReply = (res2.text || '').trim();
      console.log(`   -> SUCCESS (HTTP 200) Function Calling Loop in ${latency}ms`);
      console.log(`   -> Tool Executed: ${fc.name} (returned ${toolExec.data.length} projects)`);
      console.log(`   -> Final Synthesis: "${auditReport.functionCalling.finalReply.substring(0, 120)}..."`);
    } else {
      const latency = Math.round(performance.now() - t1);
      auditReport.functionCalling.status = 'NO_TOOL_TRIGGERED';
      auditReport.functionCalling.httpCode = 200;
      auditReport.functionCalling.latencyMs = latency;
      auditReport.functionCalling.finalReply = (res1.text || '').trim();
      console.log(`   -> WARNING: Model replied with direct text instead of functionCall in ${latency}ms`);
    }
  } catch (err) {
    const latency = Math.round(performance.now() - t1);
    const httpStatus = err.status || err.statusCode || (err.message?.includes('503') ? 503 : (err.message?.includes('429') ? 429 : 500));
    auditReport.functionCalling.status = 'FAILED';
    auditReport.functionCalling.httpCode = httpStatus;
    auditReport.functionCalling.latencyMs = latency;
    auditReport.functionCalling.error = err.message || String(err);
    console.log(`   -> FAILED (HTTP ${httpStatus}) in ${latency}ms`);
    console.log(`   -> Error: ${auditReport.functionCalling.error.substring(0, 160)}`);
  }

  return auditReport;
}

async function runAudit() {
  console.log(`======================================================`);
  console.log(`TECHNOLOPIA — Phase 3.3 Final Model Cascade Audit`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`======================================================`);

  const results = [];
  for (const m of MODELS_TO_AUDIT) {
    const res = await auditModel(m);
    results.push(res);
  }

  console.log(`\n\n======================================================`);
  console.log(`FINAL CASCADE AUDIT SUMMARY TABLE (JSON)`);
  console.log(`======================================================`);
  console.log(JSON.stringify(results, null, 2));
}

runAudit();
