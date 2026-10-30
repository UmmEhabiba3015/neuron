// Main Compact Transport: MediaRecorder keeps the audio. Nothing measures the sound: the waveform is a
// fixed decorative shape (v4 B6).
(() => {
 'use strict';
 class JournalAudioSession {
  constructor(stream){
   this.stream=stream;this.chunks=[];this.cancelled=false;
  }
  async start(){
   // The microphone is never connected to the speakers: no live monitoring or feedback.
   const mime=['audio/ogg;codecs=opus','audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg'].find(type=>MediaRecorder.isTypeSupported?.(type));
   try{this.recorder=mime?new MediaRecorder(this.stream,{mimeType:mime}):new MediaRecorder(this.stream);}
   catch(error){if(!mime)throw error;this.recorder=new MediaRecorder(this.stream);}
   this.recorder.addEventListener('dataavailable',event=>{if(event.data.size)this.chunks.push(event.data);});
   await Promise.resolve();
   if(this.cancelled)return false;
   this.stream.getAudioTracks().forEach(track=>track.enabled=true);
   this.recorder.start();
   return true;
  }
  pause(){
   this.recorder.pause();
   this.stream.getAudioTracks().forEach(track=>track.enabled=false);
  }
  resume(){
   this.stream.getAudioTracks().forEach(track=>track.enabled=true);this.recorder.resume();
  }
  // The memo so far, while paused (v4 C5: the player): the recorder hands over what it holds, and every chunk from the
  // start makes one playable file. Recording carries on from the end when it resumes.
  snapshot(){
   return new Promise(resolve=>{
    const done=()=>resolve(new Blob(this.chunks,{type:this.recorder.mimeType||this.chunks[0]?.type||'application/octet-stream'}));
    if(!this.recorder||this.recorder.state==='inactive'){done();return;}
    this.recorder.addEventListener('dataavailable',()=>setTimeout(done),{once:true});
    this.recorder.requestData();
   });
  }
  release(){
   this.stream.getTracks().forEach(track=>track.stop());
  }
  stop(){
   return new Promise((resolve,reject)=>{
    this.recorder.addEventListener('stop',()=>{
     const blob=new Blob(this.chunks,{type:this.recorder.mimeType||this.chunks[0]?.type||'application/octet-stream'});
     this.release();blob.size?resolve({blob}):reject(Error('No audio was captured.'));
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
