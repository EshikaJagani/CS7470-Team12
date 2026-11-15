(function(root,factory){if(typeof module==='object')module.exports=factory();else root.MQ=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SETTINGS={tiltDegrees:24,holdMs:850,stillMs:1400,momentumThreshold:2.4,momentumPulses:3,staleMs:650,cooldownMs:450};
  const GESTURES={left:{name:'Steer left',hint:'Tilt your phone gently left and hold.',icon:'←'},right:{name:'Steer right',hint:'Tilt your phone gently right and hold.',icon:'→'},jump:{name:'Jump the gap',hint:'Tip the top of your phone gently forward and hold.',icon:'↑'},steady:{name:'Stay steady',hint:'Keep your phone comfortably still.',icon:'◇'},momentum:{name:'Build momentum',hint:'Make three small forward-and-back motions.',icon:'✧'}};
  const SEQUENCES=[{gesture:'left',place:'Whispering woods',story:'A fallen rock blocks the trail. Guide your horse left.',reward:'You passed the rock'},{gesture:'right',place:'Whispering woods',story:'The trees close in around another obstacle. Guide your horse right.',reward:'You found the open trail'},{gesture:'steady',place:'Shifting ridge',story:'The ground moves under the horse. Stay steady until it settles.',reward:'Your horse found its footing'},{gesture:'jump',place:'Shifting ridge',story:'A narrow gap opens ahead. Lean forward to make the jump.',reward:'You cleared the gap'},{gesture:'momentum',place:'Mountain pass',story:'The trail climbs sharply. Build momentum to reach the top.',reward:'You made the climb'},{gesture:'steady',place:'Mountain pass',story:'The final stretch is unstable. Stay steady to reach the overlook.',reward:'You reached the overlook'}];
  function finite(x){return typeof x==='number'&&Number.isFinite(x);}
  function angleDiff(a,b){return ((a-b+540)%360)-180;}
  function mean(a){return a.reduce((s,x)=>s+x,0)/a.length;}
  function circularMean(a){return Math.atan2(mean(a.map(x=>Math.sin(x*Math.PI/180))),mean(a.map(x=>Math.cos(x*Math.PI/180))))*180/Math.PI;}
  function calibrate(samples){if(samples.length<15)throw Error('Need at least 15 fresh orientation samples.');return {beta:circularMean(samples.map(x=>x.beta)),gamma:circularMean(samples.map(x=>x.gamma))};}
  class Recognizer{
    constructor(settings={}){this.settings={...SETTINGS,...settings};this.reset();}
    reset(){this.started=null;this.pulses=0;this.lastPulse=-Infinity;this.armed=true;this.done=false;this.last=null;}
    readMotion(sample,gesture,baseline,now){
      const s=this.settings;
      if(this.done)return {progress:1,success:false,reason:'Complete'};
      if(!sample||!baseline||!finite(sample.beta)||!finite(sample.gamma)||!finite(sample.at)||now-sample.at>s.staleMs||sample.at>now+100){this.started=null;this.last=null;return {progress:0,success:false,reason:'Waiting for fresh motion data'};}
      const roll=angleDiff(sample.gamma,baseline.gamma),pitch=angleDiff(sample.beta,baseline.beta);
      let valid=false,progress=0,reason='Follow the movement prompt';
      if(gesture==='momentum'){
        const fresh=finite(sample.motionAt)&&now-sample.motionAt<=s.staleMs;
        const energy=fresh&&finite(sample.energy)?sample.energy:0;
        if(energy<s.momentumThreshold*.4)this.armed=true;
        if(fresh&&energy>=s.momentumThreshold&&this.armed&&now-this.lastPulse>=s.cooldownMs){this.pulses++;this.lastPulse=now;this.armed=false;}
        progress=Math.min(1,this.pulses/s.momentumPulses);reason=fresh?`${this.pulses} of ${s.momentumPulses} gentle motions`:'Waiting for fresh acceleration data';
      }else{
        if(gesture==='left')valid=roll<=-s.tiltDegrees&&Math.abs(pitch)<40;
        if(gesture==='right')valid=roll>=s.tiltDegrees&&Math.abs(pitch)<40;
        if(gesture==='jump')valid=pitch<=-s.tiltDegrees&&Math.abs(roll)<40;
        if(gesture==='steady'){
          const freshMotion=finite(sample.motionAt)&&now-sample.motionAt<=s.staleMs;
          const moving=finite(sample.energy)&&sample.energy>1.6;
          const delta=this.last?Math.hypot(angleDiff(sample.beta,this.last.beta),angleDiff(sample.gamma,this.last.gamma)):0;
          valid=freshMotion&&Math.abs(roll)<12&&Math.abs(pitch)<12&&delta<3&&!moving;
        }
        if(valid){if(this.started===null)this.started=now;progress=Math.min(1,(now-this.started)/(gesture==='steady'?s.stillMs:s.holdMs));reason=gesture==='steady'?'Stay comfortably steady':'Hold this position';}else{this.started=null;reason=gesture==='steady'?'Return to neutral and hold still':'Move toward the target';}
      }
      this.last={beta:sample.beta,gamma:sample.gamma};
      const success=progress>=1;if(success)this.done=true;
      return {progress,success,reason,roll,pitch};
    }
  }
  function csv(rows){if(!rows.length)return '';const keys=Object.keys(rows[0]);const escape=x=>'"'+String(x??'').replace(/"/g,'""')+'"';return [keys.map(escape).join(','),...rows.map(r=>keys.map(k=>escape(r[k])).join(','))].join('\r\n');}
  return {SETTINGS,GESTURES,SEQUENCES,Recognizer,calibrate,angleDiff,csv};
});
