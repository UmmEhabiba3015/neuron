// Main Compact Transport: microphone samples drive the waveform; MediaRecorder keeps audio.
(() => {
 'use strict';
 class JournalAudioSession {
  constructor(stream,onLevel){
   this.stream=stream;this.onLevel=onLevel;this.levels=[];this.chunks=[];
   this.cancelled=false;this.level=0;this.timer=null;
  }
  async start(){
   const Context=window.AudioContext||window.webkitAudioContext;
   this.context=new Context();this.analyser=this.context.createAnalyser();this.analyser.fftSize=2048;
   this.samples=new Float32Array(this.analyser.fftSize);
   this.source=this.context.createMediaStreamSource(this.stream);this.source.connect(this.analyser);
   // Never connect the microphone to the speakers: no live monitoring or feedback.
   const mime=['audio/ogg;codecs=opus','audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg'].find(type=>MediaRecorder.isTypeSupported?.(type));
   try{this.recorder=mime?new MediaRecorder(this.stream,{mimeType:mime}):new MediaRecorder(this.stream);}
   catch(error){if(!mime)throw error;this.recorder=new MediaRecorder(this.stream);}
   this.recorder.addEventListener('dataavailable',event=>{if(event.data.size)this.chunks.push(event.data);});
   await this.context.resume();
   if(this.cancelled)return false;
   this.stream.getAudioTracks().forEach(track=>track.enabled=true);
   this.recorder.start();this.sample();this.timer=setInterval(()=>this.sample(),40);
   return true;
  }
  sample(){
   this.analyser.getFloatTimeDomainData(this.samples);
   const mean=this.samples.reduce((sum,value)=>sum+value,0)/this.samples.length;
   const rms=Math.sqrt(this.samples.reduce((sum,value)=>sum+(value-mean)**2,0)/this.samples.length);
   // A quiet floor, perceptual gain and short attack/release retain speech envelopes.
   const target=Math.min(1,Math.sqrt(Math.max(0,rms-.002))*2);
   this.level+=(target-this.level)*(target>this.level ? .65 : .2);
   this.levels.push(this.level);this.onLevel(this.level,this.levels);
  }
  pause(){
   clearInterval(this.timer);this.timer=null;this.recorder.pause();
   this.stream.getAudioTracks().forEach(track=>track.enabled=false);
  }
  resume(){
   this.stream.getAudioTracks().forEach(track=>track.enabled=true);this.recorder.resume();
   this.sample();this.timer=setInterval(()=>this.sample(),40);
  }
  release(){
   clearInterval(this.timer);this.timer=null;this.stream.getTracks().forEach(track=>track.stop());
   this.source?.disconnect();
   if(this.context&&this.context.state!=='closed')this.context.close().catch(()=>{});
  }
  stop(){
   clearInterval(this.timer);this.timer=null;
   return new Promise((resolve,reject)=>{
    this.recorder.addEventListener('stop',()=>{
     const blob=new Blob(this.chunks,{type:this.recorder.mimeType||this.chunks[0]?.type||'application/octet-stream'});
     this.release();blob.size?resolve({blob,levels:this.levels}):reject(Error('No audio was captured.'));
    },{once:true});
    this.recorder.addEventListener('error',()=>{this.release();reject(Error('Audio could not be kept.'));},{once:true});
    this.recorder.stop();
    // Let the encoder flush before ending tracks; mute while it finishes.
    this.stream.getAudioTracks().forEach(track=>track.enabled=false);
   });
  }
  cancel(){
   this.cancelled=true;
   if(this.recorder&&this.recorder.state!=='inactive')this.recorder.stop();
   this.release();
  }
 }
 window.JournalAudioSession=JournalAudioSession;
})();
