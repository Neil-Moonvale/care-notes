// Public development/fault-injection cases. Not held-out model accuracy evidence.
export const source=(id,text,author='Caregiver')=>({id,version:1,text,author,recordedAt:'2026-09-07T10:00:00+08:00'});
export const windowAt=(day='05',start='00',end='08')=>({start:`2026-09-${day}T${start}:00:00+08:00`,end:`2026-09-${day}T${end}:00:00+08:00`,quote:''});
export const claim=(s,overrides={})=>({id:s.id,sourceId:s.id,sourceVersion:s.version,quote:s.text,subject:'recipient',observer:s.author,topic:'sleep',basis:'observed',polarity:'affirmed',time:{start:null,end:null,quote:''},...overrides});
const link=(from,to,type='same_event')=>({from,to,type});
function pair(id,a,b,ca,cb,relations,expected){const sources=[source('a',a),source('b',b)];return {id,sources,proposal:{claims:[claim(sources[0],ca),claim(sources[1],cb)],relations},expected};}
const t=(phrase,day='05',start='00',end='08')=>({...windowAt(day,start,end),quote:phrase});
export const cases=[
 pair('non_observation','I did not see the evening medication taken.','I do not know whether it was taken.',{topic:'medication',polarity:'denied'},{topic:'medication',basis:'uncertain',polarity:'unknown'},[link('a','b','contradicts')],{unknown:['a','b'],withdrawn:['not_opposing_accounts']}),
 pair('compatible_accounts','On September 5 I did not see them sleeping when I passed the door.','On September 5 I slept between two and five.',{basis:'not_observed',polarity:'unknown',time:t('On September 5')},{basis:'reported',time:t('On September 5','05','02','05')},[link('a','b'),link('a','b','contradicts')],{unknown:['a'],proposed:['same_event'],withdrawn:['not_opposing_accounts']}),
 pair('opposing_accounts','On September 5 from noon to one, they did not eat any lunch.','On September 5 from noon to one, I ate lunch.',{topic:'food',polarity:'denied',time:t('On September 5','05','12','13')},{topic:'food',basis:'reported',time:t('On September 5','05','12','13')},[link('a','b','contradicts')],{proposed:['contradicts']}),
 pair('reported_lineage','I saw them awake.','I heard the caregiver say they were awake.',{},{basis:'reported'},[link('b','a','reported_from')],{proposed:['reported_from']}),
 pair('repeated_events','On September 5 breakfast was eaten at eight.','On September 5 dinner was eaten at six in the evening.',{topic:'food',time:t('On September 5','05','08','09')},{topic:'food',time:t('On September 5','05','18','19')},[link('a','b')],{withdrawn:['different_periods']}),
 pair('date_question','I slept for three hours, but cannot place the night.','On September 5 they said they slept for three hours.',{basis:'reported'},{basis:'reported',time:t('On September 5')},[link('a','b')],{questions:['time']}),
 pair('different_people','Alex slept.','Sam slept.',{subject:'Alex'},{subject:'Sam'},[link('a','b')],{withdrawn:['different_subject_or_topic']}),
 pair('unestablished_conflict','They did not eat lunch; I cannot place the day.','I ate lunch; I cannot place the day.',{topic:'food',polarity:'denied'},{topic:'food'},[link('a','b','contradicts')],{withdrawn:['period_not_established']}),
 pair('order_cycle','First account.','Second account.',{}, {},[link('a','b','before'),link('b','a','before')],{withdrawn:['cycle','cycle']}),
 pair('lineage_cycle','A said B told them.','B said A told them.',{basis:'reported'},{basis:'reported'},[link('a','b','reported_from'),link('b','a','reported_from')],{withdrawn:['cycle','cycle']}),
 pair('unsupported_order','On September 5 they ate dinner.','On September 5 they ate breakfast.',{topic:'food',time:t('On September 5','05','18','19')},{topic:'food',time:t('On September 5','05','08','09')},[link('a','b','before')],{withdrawn:['time_order_not_supported']}),
 pair('uncertain_is_unknown','不确定晚上的药有没有吃。','昨晚的药我没有亲眼看到她吃。',{topic:'medication',polarity:'affirmed'},{topic:'medication',polarity:'denied'},[link('a','b','contradicts')],{unknown:['a','b'],withdrawn:['not_opposing_accounts']}),
];
