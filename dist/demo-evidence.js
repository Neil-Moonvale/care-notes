const base={subject:'person_a',human_confirmed:false,privacy_level:'personal'};
const p=(n)=>String(n).padStart(2,'0');
function event(id,sourceType,sourceId,observedAt,eventType,value,{unit=null,confidence=.99,privacy='personal',rawReference='',note='',claimKey='',baselineMetric='',direction='',humanConfirmed=false,relatedMetric=''}={}){
  return {
    ...base,event_id:id,source_type:sourceType,source_id:sourceId,observed_at:observedAt,
    received_at:new Date(Date.parse(observedAt)+60_000).toISOString(),event_type:eventType,value,unit,confidence,
    privacy_level:privacy,raw_reference:rawReference||id,note:note||undefined,claim_key:claimKey||undefined,
    baseline_metric:baselineMetric||undefined,deviation_direction:direction||undefined,human_confirmed:humanConfirmed,
    related_metric:relatedMetric||undefined,provenance:{adapter:'simulator',adapter_version:'0.1',derived:false}
  };
}

export function fictionalSevenDayEvidence(){
  const events=[];
  const sleeps=[7.4,7.7,7.2,7.5];
  const nights=[1,2,1,1];
  for(let i=0;i<4;i++){
    const day=p(i+1);
    events.push(event(`ev_d${i+1}_sleep`,'health_connect','watch',`2026-09-${day}T07:30:00+08:00`,'sleep_duration',sleeps[i],{unit:'hours',confidence:.96,baselineMetric:'sleep_duration',direction:'lower',rawReference:`hc:sleep:${day}`}));
    events.push(event(`ev_d${i+1}_night`,'home_assistant','living_room_motion',`2026-09-${day}T06:00:00+08:00`,'night_activity_count',nights[i],{unit:'events',privacy:'household',baselineMetric:'night_activity_count',direction:'higher',rawReference:`ha:night:${day}`}));
  }
  events.push(
    event('ev_0505_phone','phone','android_usage_window','2026-09-05T03:31:00+08:00','phone_activity','screen_active'),
    event('ev_0505_door','home_assistant','front_door_lock','2026-09-05T04:08:00+08:00','door_event','unlocked_then_locked',{privacy:'household'}),
    event('ev_0505_night','home_assistant','living_room_motion','2026-09-05T05:50:00+08:00','night_activity_count',8,{unit:'events',privacy:'household',baselineMetric:'night_activity_count',direction:'higher'}),
    event('ev_0505_sleep','health_connect','watch','2026-09-05T07:30:00+08:00','sleep_duration',4.0,{unit:'hours',confidence:.91,baselineMetric:'sleep_duration',direction:'lower'}),
    event('ev_0505_breakfast_a','caregiver_note','caregiver_a','2026-09-05T08:20:00+08:00','caregiver_observation','very_little',{privacy:'household',humanConfirmed:true,claimKey:'breakfast_2026-09-05_amount',note:'早餐几乎没怎么吃。'}),
    event('ev_0505_breakfast_b','caregiver_note','caregiver_b','2026-09-05T09:05:00+08:00','caregiver_observation','half_bowl',{privacy:'household',humanConfirmed:true,claimKey:'breakfast_2026-09-05_amount',note:'我后来看到碗里大约少了一半，但没看到什么时候吃的。'}),
    event('ev_0505_med_status','medication','pillbox_sensor','2026-09-05T21:00:00+08:00','sensor_status','sensor_offline',{relatedMetric:'medication_status'}),
    event('ev_0605_night','frigate','living_room_camera','2026-09-06T05:50:00+08:00','night_activity_count',7,{unit:'events',confidence:.94,privacy:'household',baselineMetric:'night_activity_count',direction:'higher'}),
    event('ev_0605_sleep','health_connect','watch','2026-09-06T07:30:00+08:00','sleep_duration',3.8,{unit:'hours',confidence:.89,baselineMetric:'sleep_duration',direction:'lower'}),
    event('ev_0605_note','caregiver_note','caregiver_a','2026-09-06T12:35:00+08:00','caregiver_observation','meal_reduced',{privacy:'household',humanConfirmed:true,note:'午饭只吃了几口。'}),
    event('ev_0705_sleep','health_connect','watch','2026-09-07T07:30:00+08:00','sleep_duration',6.3,{unit:'hours',confidence:.92,baselineMetric:'sleep_duration',direction:'lower'})
  );
  return {format:'care-notes-evidence-demo',version:1,fictional:true,subject:'person_a',baseline_before:'2026-09-05T00:00:00+08:00',events};
}
