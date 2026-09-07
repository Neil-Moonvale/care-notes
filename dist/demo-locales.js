import {makeDemo,validateBackup} from './core.js';
export const demoKey=lang=>`care-notes.demo.v2.${lang}`;
export function localizedDemo(lang){
 const rs=makeDemo(lang!=='zh');
 const food=rs.find(r=>r.id==='demo-food');
 if(food){
  rs.push({...food,id:'demo-food-self',source:'self',certainty:'uncertain',time:'13:10',group:'',review:'pending',reviewNote:'',text:lang==='zh'?'后来我又喝了点汤，具体吃了多少记不清。':'Later I had some more soup, but I do not remember how much I ate.'});
 }
 if(lang==='es'){
  const text={
   'demo-sleep-family':'Anoche no vi que durmiera. Creo que estuvo despierta toda la noche.',
   'demo-sleep-self':'Dormí unas tres horas después de medianoche.',
   'demo-food':'Comió medio cuenco de arroz y tomó un poco de sopa al mediodía.',
   'demo-food-self':'Después tomé un poco más de sopa, pero no recuerdo cuánto comí.',
   'demo-med':'No sé si tomó la medicación de la noche. No lo vi.',
   'demo-self':'Esta tarde me sentía cansada y quería estar tranquila.'
  };
  for(const r of rs){r.text=text[r.id];if(r.when)r.when=r.id.startsWith('demo-sleep')?'Anoche':r.when;}
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
