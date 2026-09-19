import {attachReport} from './narrative-report.js';
import {createLedger,activeSources,addAnalysis,reviseSource} from './reconstruction-core.js';
import {reconstructionCopy} from './reconstruction-copy.js';

export function demoLedger(language='en') {
  const t=reconstructionCopy[language]||reconstructionCopy.en;
  const sources=t.texts.map((text,i)=>({id:`e${i+1}`,text,author:t.names[i],recordedAt:'2026-09-05T21:00:00+08:00',version:1}));
  const claims=sources.map((s,i)=>({id:s.id,sourceId:s.id,sourceVersion:1,quote:s.text,subject:'recipient',observer:i===2?t.names[0]:s.author,topic:i===3?'medication':'sleep',basis:['not_observed','observed','reported','not_observed'][i],polarity:['unknown','affirmed','denied','unknown'][i],time:i===0||i===3?{start:'2026-09-05T00:00:00+08:00',end:'2026-09-06T00:00:00+08:00',quote:t.dateQuote}:{start:null,end:null,quote:''}}));
  const ledger=addAnalysis(createLedger(sources),{claims,relations:[{from:'e1',to:'e2',type:'same_event'},{from:'e3',to:'e1',type:'reported_from'}]},{method:'fixture'});
  const paragraphs={
    zh:['这组记录主要涉及睡眠和一次服药情况。9月5日凌晨，家属两次经过房门时听到了声音；这只能说明那两个时点的观察，不能确定她整夜没睡。','本人说凌晨两点到五点睡了约三小时，但没有说明是哪一天。需要先确认日期，才能判断与家属的描述是否指向同一晚。另一位家属转述的“整夜没睡”来自家属甲，并不是新的独立观察。','9月5日晚是否服药，目前仍不知道。家属没有亲眼看到服药，不能据此写成漏服。'],
    en:['These accounts concern sleep and one medication occasion. On September 5, a relative heard sounds while passing the door twice overnight. Those two observations do not establish that the person stayed awake all night.','The person reports sleeping about three hours, from 2 to 5 a.m., without specifying the date. Clarify the date before treating this as the same night. Another relative’s all-night claim is a retelling of the first relative, not an independent observation.','Whether the evening medication was taken on September 5 remains unknown. Not witnessing it does not establish a missed dose.'],
    es:['Los relatos tratan del sueño y una toma de medicación. El 5 de septiembre, un familiar oyó sonidos al pasar dos veces por la puerta de madrugada. Esas observaciones no demuestran que la persona pasara toda la noche despierta.','La persona dice haber dormido unas tres horas, de dos a cinco, sin precisar el día. Hay que aclarar la fecha antes de considerarlo la misma noche. El relato de otro familiar sobre toda la noche repite al primero; no es una observación independiente.','No se sabe si tomó la medicación la noche del 5 de septiembre. No haberlo visto no demuestra que omitiera la toma.'],
    fr:['Ces récits portent sur le sommeil et une prise de médicament. Le 5 septembre, un proche a entendu des bruits en passant deux fois devant la porte pendant la nuit. Cela ne prouve pas que la personne soit restée éveillée toute la nuit.','La personne rapporte environ trois heures de sommeil, de deux à cinq heures, sans préciser le jour. Il faut clarifier la date avant de parler de la même nuit. Le récit d’un autre proche reprend les propos du premier : ce n’est pas une observation indépendante.','La prise du médicament le soir du 5 septembre reste inconnue. Ne pas l’avoir vue ne prouve pas une omission.'],
    ja:['今回の記述は睡眠と1回の服薬についてです。9月5日未明、家族は2回、部屋の前を通った際に音を聞きました。この2時点の観察だけで、一晩中眠らなかったとは判断できません。','本人は午前2時から5時まで約3時間眠ったと話していますが、日付は不明です。同じ夜の話か、まず日付を確認する必要があります。別の家族の「一晩中眠らなかった」という話は最初の家族からの伝聞で、独立した観察ではありません。','9月5日夜に服薬したかは不明です。家族が服薬を見ていないことから、飲み忘れたとは言えません。'],
    ko:['이번 기록은 수면과 한 차례의 복약에 관한 것입니다. 9월 5일 새벽, 가족은 방문 앞을 두 번 지나며 소리를 들었습니다. 두 시점의 관찰만으로 밤새 자지 않았다고 판단할 수는 없습니다.','본인은 새벽 두 시부터 다섯 시까지 약 세 시간 잤다고 하지만 날짜는 불명확합니다. 같은 밤인지 먼저 확인해야 합니다. 다른 가족의 밤새 못 잤다는 말은 첫 가족에게 들은 것으로, 별도의 관찰이 아닙니다.','9월 5일 저녁 약을 먹었는지는 아직 모릅니다. 가족이 직접 보지 못했다는 사실만으로 복약을 빠뜨렸다고 할 수는 없습니다.']
  };
  const refs=[[0],[0,1,2],[3]];
  return attachReport(ledger,{statements:(paragraphs[language]||paragraphs.en).map((text,i)=>({text,evidence:refs[i].map(j=>({sourceId:sources[j].id,sourceVersion:1,quote:sources[j].text}))})),questions:[{text:t.timeQuestion,sourceIds:['e2']}]},{language,model:'Care Notes example',kind:'fixture',createdAt:'2026-09-05T21:00:00+08:00'});
}
// Explicit manual correction, not free-text understanding or a model response.
export function correctDemoDate(ledger,language='en') {
  const t=reconstructionCopy[language]||reconstructionCopy.en;
  const old=activeSources(ledger).find(s=>s.id==='e2');
  if(!old||old.version!==1||old.text!==t.texts[1])throw Error('demo_changed');
  const revised=reviseSource(ledger,'e2',{text:t.correction},1);
  const source=activeSources(revised).find(s=>s.id==='e2');
  return addAnalysis(revised,{claims:[{id:'e2',sourceId:'e2',sourceVersion:2,quote:source.text,subject:'recipient',observer:source.author,topic:'sleep',basis:'observed',polarity:'affirmed',time:{start:'2026-09-04T02:00:00+08:00',end:'2026-09-04T05:00:00+08:00',quote:t.correctionQuote}}],relations:[]},{method:'manual',sources:[source]});
}
