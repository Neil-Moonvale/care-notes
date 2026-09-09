import {makeDemo,validateBackup} from './core.js';
export const demoKey=lang=>`care-notes.demo.v2.${lang}`;

const TRANSLATIONS={
 es:{when:'Anoche',text:{
  'demo-sleep-family':'Anoche no vi que durmiera. Creo que estuvo despierta toda la noche.',
  'demo-sleep-self':'Dormí unas tres horas después de medianoche.',
  'demo-food':'Comió medio cuenco de arroz y tomó un poco de sopa al mediodía.',
  'demo-food-self':'Después tomé un poco más de sopa, pero no recuerdo cuánto comí.',
  'demo-med':'No sé si tomó la medicación de la noche. No lo vi.',
  'demo-self':'Esta tarde me sentía cansada y quería estar tranquila.'
 }},
 fr:{when:'La nuit dernière',text:{
  'demo-sleep-family':'La nuit dernière, je ne l’ai pas vue dormir. Je pense qu’elle est restée éveillée.',
  'demo-sleep-self':'J’ai dormi environ trois heures après minuit.',
  'demo-food':'À midi, elle a mangé un demi-bol de riz et un peu de soupe.',
  'demo-food-self':'Plus tard, j’ai repris un peu de soupe, mais je ne me souviens pas de la quantité mangée.',
  'demo-med':'Je ne sais pas si le médicament du soir a été pris. Je ne l’ai pas vu.',
  'demo-self':'Cet après-midi, je me sentais fatiguée et j’avais envie d’être au calme.'
 }},
 ja:{when:'昨夜',text:{
  'demo-sleep-family':'昨夜、眠っているところは見ていません。ずっと起きていたように思います。',
  'demo-sleep-self':'夜中を過ぎてから3時間くらい眠りました。',
  'demo-food':'昼食にご飯を半分ほどと、スープを少し食べました。',
  'demo-food-self':'その後スープをもう少し飲みましたが、どのくらい食べたかは覚えていません。',
  'demo-med':'夜の薬を飲んだかは分かりません。私は見ていません。',
  'demo-self':'今日の午後は疲れていて、静かに過ごしたいと思いました。'
 }},
 ko:{when:'어젯밤',text:{
  'demo-sleep-family':'어젯밤에 자는 모습을 보지 못했습니다. 계속 깨어 있었던 것 같습니다.',
  'demo-sleep-self':'자정이 지난 뒤 세 시간 정도 잤습니다.',
  'demo-food':'점심에 밥 반 공기와 국을 조금 먹었습니다.',
  'demo-food-self':'그 뒤 국을 조금 더 먹었지만 얼마나 먹었는지는 기억나지 않습니다.',
  'demo-med':'저녁 약을 먹었는지 확실하지 않습니다. 직접 보지는 못했습니다.',
  'demo-self':'오늘 오후에는 피곤해서 조용히 있고 싶었습니다.'
 }}
};

export function localizedDemo(lang){
 const rs=makeDemo(lang!=='zh');
 const food=rs.find(r=>r.id==='demo-food');
 if(food){
  rs.push({...food,id:'demo-food-self',source:'self',certainty:'uncertain',time:'13:10',group:'',review:'pending',reviewNote:'',text:lang==='zh'?'后来我又喝了点汤，具体吃了多少记不清。':'Later I had some more soup, but I do not remember how much I ate.'});
 }
 const translation=TRANSLATIONS[lang];
 if(translation){
  for(const r of rs){
   r.text=translation.text[r.id];
   if(r.id.startsWith('demo-sleep'))r.when=translation.when;
  }
 }
 return rs;
}
export function loadLocalizedDemo(storage,lang){
 const saved=storage.getItem(demoKey(lang));
 if(saved!==null)return validateBackup(JSON.parse(saved));
 // Keep old edited examples in their original language. Never touch personal records.
 const legacy=storage.getItem('care-notes.demo.v1');
 if(legacy!==null){
  const parsed=validateBackup(JSON.parse(legacy));
  const text=parsed.map(r=>r.text).join(' ');
  const oldLang=/[\u3400-\u9fff]/.test(text)?'zh':'en';
  if(lang===oldLang)return parsed;
 }
 return localizedDemo(lang);
}
