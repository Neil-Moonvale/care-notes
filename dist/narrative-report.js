import {activeSources} from './reconstruction-core.js';
const fail=()=>{throw Error('evidence_invalid');};
const text=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
export function validateReport(sources,report){
 if(!report||!Array.isArray(report.statements)||!report.statements.length||report.statements.length>12||!Array.isArray(report.questions)||report.questions.length>3)fail();
 const byId=new Map(sources.map(s=>[s.id,s]));
 for(const statement of report.statements){
  if(!text(statement.text,1800)||!Array.isArray(statement.evidence)||!statement.evidence.length||statement.evidence.length>40)fail();
  for(const e of statement.evidence){const s=byId.get(e.sourceId);if(!s||e.sourceVersion!==s.version||!text(e.quote,24000)||!s.text.includes(e.quote))fail();}
 }
 for(const q of report.questions)if(!text(q.text,500)||!Array.isArray(q.sourceIds)||!q.sourceIds.length||q.sourceIds.length>40||q.sourceIds.some(id=>!byId.has(id)))fail();
 return structuredClone(report);
}
const snapshot=sources=>sources.map(({id,version,text,author,recordedAt})=>({id,version,text,author,recordedAt}));
export function attachReport(ledger,report,metadata){
 const sources=activeSources(ledger);
 if(!['zh','en','es','fr','ja','ko'].includes(metadata?.language)||!text(metadata.model,128)||!text(metadata.createdAt,50)||!Number.isFinite(Date.parse(metadata.createdAt)))fail();
 return {...ledger,report:{report:validateReport(sources,report),sources:snapshot(sources),kind:metadata.kind==='fixture'?'fixture':'model',language:metadata.language,model:metadata.model,createdAt:metadata.createdAt}};
}
export function currentReport(ledger){
 const saved=ledger.report;if(!saved||JSON.stringify(snapshot(activeSources(ledger)))!==JSON.stringify(saved.sources))return null;
 try{validateReport(activeSources(ledger),saved.report);return saved;}catch{return null;}
}
export const narrativeCopy={
 zh:['AI 简明报告','先读这段经过','最值得确认的问题','展开原话依据','AI 根据原文撰写，仍需你核对；引用校验不代表结论已经证实。','原文已变化，请重新整理生成报告。','旧版提取记录：尚未生成简明报告。','一次调用同时生成报告和提取细节。','报告使用生成时选择的语言；切换界面不会翻译已保存的报告。'],
 en:['AI plain-language report','What happened','Questions worth clarifying','Show original evidence','Written by AI from your accounts; review it. Citation checks do not establish that conclusions are true.','Accounts changed. Generate a new report.','Legacy extraction: no plain-language report yet.','One call produces the report and extraction details.','Reports retain their generation language; changing the interface does not translate saved reports.'],
 es:['Informe claro de IA','Qué ocurrió','Preguntas por aclarar','Ver evidencia original','Redactado por IA a partir de sus relatos; revíselo. Validar citas no confirma las conclusiones.','Los relatos cambiaron. Genere otro informe.','Extracción anterior: aún sin informe claro.','Una llamada genera el informe y los detalles.','El informe conserva el idioma de generación; cambiar la interfaz no lo traduce.'],
 fr:['Rapport IA en langage clair','Ce qui s’est passé','Questions à clarifier','Voir les sources originales','Rédigé par IA à partir de vos récits ; vérifiez-le. Contrôler les citations ne prouve pas les conclusions.','Les récits ont changé. Régénérez le rapport.','Ancienne extraction : aucun rapport rédigé.','Un appel génère le rapport et les détails.','Le rapport garde sa langue de génération ; changer l’interface ne le traduit pas.'],
 ja:['AIの分かりやすい報告','何があったか','確認したい質問','原文の根拠を開く','AIが記述から作成しました。確認が必要です。引用の検証は結論の正しさを保証しません。','原文が変わりました。報告を再生成してください。','旧版の抽出記録：文章の報告はまだありません。','1回の呼び出しで報告と抽出の詳細を生成します。','報告は生成時の言語で保存されます。画面の言語を変えても翻訳されません。'],
 ko:['읽기 쉬운 AI 보고서','무슨 일이 있었나','확인할 질문','원문 근거 펼치기','AI가 원문을 바탕으로 작성했습니다. 검토가 필요하며 인용 확인이 결론을 입증하지는 않습니다.','원문이 바뀌었습니다. 보고서를 다시 생성하세요.','이전 추출 기록: 아직 서술형 보고서가 없습니다.','한 번의 호출로 보고서와 추출 세부 정보를 생성합니다.','보고서는 생성 당시 언어를 유지합니다. 화면 언어를 바꿔도 번역되지 않습니다.']
};
