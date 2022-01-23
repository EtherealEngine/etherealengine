import{B as l,aj as M,s as R,M as c,a3 as T,ay as L,U as k,g as p}from"./three.module.493739a3.js";const P=typeof self=="object"&&self.constructor&&self.constructor.name==="DedicatedWorkerGlobalScope",S=(a,e)=>(Object.entries(e).forEach(t=>{const[r,s]=t;a[r]=s}),a),q=(a,e)=>P?document.createElement(a,e):S(document.createElement(a),e),z=(a,e)=>(a+e)%e;class N{frameRate=30;speed=1;loop=!0;encoderWindowSize=8;encoderByteLength=16;videoSize=1024;scene;renderer;mesh;meshFilePath;material;failMaterial;bufferGeometry;_scale=1;_video=null;_videoTexture=null;meshBuffer=new Map;_worker;onMeshBuffering=null;onFrameShow=null;rendererCallback=null;fileHeader;tempBufferObject;manifestFilePath;counterCtx;actorCtx;numberOfFrames;maxNumberOfFrames;actorCanvas;currentFrame=0;lastFrameRequested=0;targetFramesToRequest=30;set paused(e){e?(this._video.pause(),this.hasPlayed=!1,this.stopOnNextFrame=!1):this.play()}bufferLoop=()=>{const e=this.lastFrameRequested<this.currentFrame;for(const[s,i]of this.meshBuffer.entries())(e&&s>this.lastFrameRequested&&s<this.currentFrame||!e&&s<this.currentFrame)&&(i&&i instanceof l&&i?.dispose(),this.meshBuffer.delete(s));const t=this.targetFramesToRequest*2,r=this.meshBuffer.size>=t;if(r)this._video.paused&&this.hasPlayed&&this._video.play();else if(z(this.lastFrameRequested-this.currentFrame,this.numberOfFrames)<=t*2){const s=Math.max(this.lastFrameRequested+t,this.lastFrameRequested+this.targetFramesToRequest)%this.numberOfFrames,i={frameStart:this.lastFrameRequested,frameEnd:s};console.log("Posting request",i),this._worker.postMessage({type:"request",payload:i}),this.lastFrameRequested=s,!r&&typeof this.onMeshBuffering=="function"&&this.onMeshBuffering(this.meshBuffer.size/t)}requestAnimationFrame(()=>this.bufferLoop())};hasPlayed=!1;stopOnNextFrame=!1;constructor({scene:e,renderer:t,manifestFilePath:r=null,meshFilePath:s,videoFilePath:i,targetFramesToRequest:d=90,frameRate:y=30,loop:g=!0,scale:F=1,encoderWindowSize:v=8,encoderByteLength:x=16,videoSize:b=1024,video:B=null,onMeshBuffering:w=null,onFrameShow:_=null,rendererCallback:C=null,worker:f=null}){this.onMeshBuffering=w,this.onFrameShow=_,this.rendererCallback=C,this.encoderWindowSize=v,this.encoderByteLength=x,this.maxNumberOfFrames=Math.pow(2,this.encoderByteLength)-2,this.videoSize=b,this.targetFramesToRequest=d,this._worker=f??new Worker("./workerFunction.ts"),this.scene=e,this.renderer=t,this.meshFilePath=s,this.manifestFilePath=r??s.replace("uvol","manifest"),this.loop=g,this._scale=F,this._video=B??q("video",{crossorigin:"",playsInline:"true",preload:"auto",loop:!0,src:i,style:{display:"none",position:"fixed",zIndex:"-1",top:"0",left:"0",width:"1px"},playbackRate:1}),this._video.setAttribute("crossorigin",""),this._video.setAttribute("preload","auto"),this.frameRate=y;const m=document.createElement("canvas");m.width=this.encoderByteLength,m.height=1,this.counterCtx=m.getContext("2d"),this.actorCanvas=document.createElement("canvas"),this.actorCtx=this.actorCanvas.getContext("2d"),this.actorCtx.canvas.width=this.actorCtx.canvas.height=this.videoSize,this.counterCtx.canvas.setAttribute("crossOrigin","Anonymous"),this.actorCtx.canvas.setAttribute("crossOrigin","Anonymous"),this.actorCtx.fillStyle="#ACC",this.actorCtx.fillRect(0,0,this.actorCtx.canvas.width,this.actorCtx.canvas.height),this._videoTexture=new M(this.actorCtx.canvas),this._videoTexture.encoding=R,this.material=new c({map:this._videoTexture}),this.failMaterial=new c({color:"#555555"}),this.mesh=new T(new L(1e-5,1e-5),this.material),this.mesh.scale.set(this._scale,this._scale,this._scale),this.scene.add(this.mesh);const O=h=>{for(const n of h){let u=new l;u.setIndex(new k(n.bufferGeometry.index,1)),u.setAttribute("position",new p(n.bufferGeometry.position,3)),u.setAttribute("uv",new p(n.bufferGeometry.uv,2)),this.meshBuffer.set(n.keyframeNumber,u)}if(typeof this.onMeshBuffering=="function"){const n=this.targetFramesToRequest*2;this.onMeshBuffering(this.meshBuffer.size/n)}};f.onmessage=h=>{switch(h.data.type){case"initialized":console.log("Worker initialized"),Promise.resolve().then(()=>{this.bufferLoop()});break;case"framedata":Promise.resolve().then(()=>{O(h.data.payload)});break}};const o=new XMLHttpRequest;o.onreadystatechange=()=>{o.readyState===4&&(this.fileHeader=JSON.parse(o.responseText),this.frameRate=this.fileHeader.frameRate,this.numberOfFrames=this.fileHeader.frameData.length,this.numberOfFrames>this.maxNumberOfFrames&&console.error("There are more frames (%d) in file then our decoder can handle(%d) with provided encoderByteLength(%d)",this.numberOfFrames,this.maxNumberOfFrames,this.encoderByteLength),f.postMessage({type:"initialize",payload:{targetFramesToRequest:d,meshFilePath:s,numberOfFrames:this.numberOfFrames,fileHeader:this.fileHeader}}))},o.open("GET",this.manifestFilePath,!0),o.send()}handleRender(e){!this.fileHeader||this.processFrame(e)}processFrame(e){const t=this.getCurrentFrameNumber();if(t>this.numberOfFrames){console.warn("video texture is not ready? frameToPlay:",t);return}if(this.currentFrame===t)return;this.currentFrame=t,this.stopOnNextFrame&&(this._video.pause(),this.hasPlayed=!1,this.stopOnNextFrame=!1),this.meshBuffer.has(t)?(this.mesh.material=this.material,this.material.needsUpdate=!0,this.mesh.material.needsUpdate=!0,this.mesh.geometry=this.meshBuffer.get(t),this.mesh.geometry.attributes.position.needsUpdate=!0,this.mesh.geometry.needsUpdate=!0,this.currentFrame=t,typeof this.onFrameShow=="function"&&this.onFrameShow(t),this.rendererCallback&&this.rendererCallback(),e&&e()):(this._video.paused||this._video.pause(),typeof this.onMeshBuffering=="function"&&this.onMeshBuffering(0),this.mesh.material=this.failMaterial)}getCurrentFrameNumber(){const e=this.encoderWindowSize*this.encoderByteLength,t=this.encoderWindowSize/2;this.actorCtx.drawImage(this._video,0,0),this.counterCtx.drawImage(this.actorCtx.canvas,0,this.videoSize-t,e,t,0,0,this.encoderByteLength,1);const r=this.counterCtx.getImageData(0,0,this.encoderByteLength,1);let s=0;for(let i=0;i<this.encoderByteLength;i++)s+=Math.round(r.data[i*4]/255)*Math.pow(2,i);return s=Math.max(s-1,0),this._videoTexture.needsUpdate=this.currentFrame!==s,s}get video(){return this._video}play(){this.hasPlayed=!0,this._video.playsInline=!0,this.mesh.visible=!0,this._video.play()}playOneFrame(){this.stopOnNextFrame=!0,this.play()}dispose(){if(this._worker?.terminate(),this._video&&(this._video.pause(),this._video=null,this._videoTexture.dispose(),this._videoTexture=null),this.meshBuffer){for(let e=0;e<this.meshBuffer.size;e++){const t=this.meshBuffer.get(e);t&&t instanceof l&&t?.dispose()}this.meshBuffer.clear()}}}export{N as default};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGxheWVyLjEwOTFhNmFhLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdm9sdW1ldHJpYy93ZWIvZGVjb2Rlci91dGlscy50cyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92b2x1bWV0cmljL3dlYi9kZWNvZGVyL1BsYXllci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby1yZXN0cmljdGVkLWdsb2JhbHMgKi9cbmNvbnN0IGlzV2ViV29ya2VyID0gdHlwZW9mIHNlbGYgPT09ICdvYmplY3QnXG4gICYmIHNlbGYuY29uc3RydWN0b3JcbiAgJiYgc2VsZi5jb25zdHJ1Y3Rvci5uYW1lID09PSAnRGVkaWNhdGVkV29ya2VyR2xvYmFsU2NvcGUnO1xuY29uc3QgYXBwbHlFbGVtZW50QXJndW1lbnRzID0gKGVsOiBhbnksIGFyZ3M6IGFueSkgPT4ge1xuICBPYmplY3QuZW50cmllcyhhcmdzKS5mb3JFYWNoKChlbnRyeTogYW55KSA9PiB7XG4gICAgY29uc3QgW2tleSwgdmFsdWVdID0gZW50cnk7XG4gICAgZWxba2V5XSA9IHZhbHVlO1xuICB9KTtcbiAgcmV0dXJuIGVsO1xufTtcblxuZXhwb3J0IGNvbnN0IGNyZWF0ZUVsZW1lbnQgPSAodHlwZTogc3RyaW5nLCBhcmdzOiBhbnkpID0+IHtcbiAgcmV0dXJuIGlzV2ViV29ya2VyID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlLCBhcmdzKSA6IGFwcGx5RWxlbWVudEFyZ3VtZW50cyhkb2N1bWVudC5jcmVhdGVFbGVtZW50KHR5cGUpLCBhcmdzKTtcbn07XG5cbmV4cG9ydCBjb25zdCBtb2R1bG9CeSA9IChudW1iZXIsIG1vZHVsbykgPT4gKG51bWJlciArIG1vZHVsbykgJSBtb2R1bG87XG4iLCJpbXBvcnQge1xuICBCdWZmZXJHZW9tZXRyeSxcbiAgRmxvYXQzMkJ1ZmZlckF0dHJpYnV0ZSxcbiAgTWVzaCxcbiAgTWVzaEJhc2ljTWF0ZXJpYWwsXG4gIE9iamVjdDNELFxuICBQbGFuZUJ1ZmZlckdlb21ldHJ5LFxuICBSZW5kZXJlcixcbiAgc1JHQkVuY29kaW5nLFxuICBUZXh0dXJlLFxuICBVaW50MzJCdWZmZXJBdHRyaWJ1dGUsXG4gIFdlYkdMUmVuZGVyZXJcbn0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgbW9kdWxvQnksIGNyZWF0ZUVsZW1lbnQgfSBmcm9tICcuL3V0aWxzJztcblxudHlwZSBBZHZhbmNlZEhUTUxWaWRlb0VsZW1lbnQgPSBIVE1MVmlkZW9FbGVtZW50ICYgeyByZXF1ZXN0VmlkZW9GcmFtZUNhbGxiYWNrOiAoY2FsbGJhY2s6IChudW1iZXIsIHsgfSkgPT4gdm9pZCkgPT4gdm9pZCB9O1xudHlwZSBvbk1lc2hCdWZmZXJpbmdDYWxsYmFjayA9IChwcm9ncmVzczogbnVtYmVyKSA9PiB2b2lkO1xudHlwZSBvbkZyYW1lU2hvd0NhbGxiYWNrID0gKGZyYW1lOiBudW1iZXIpID0+IHZvaWQ7XG50eXBlIG9uUmVuZGVyaW5nQ2FsbGJhY2sgPSAoKSA9PiB2b2lkO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQbGF5ZXIge1xuICAvLyBQdWJsaWMgRmllbGRzXG4gIHB1YmxpYyBmcmFtZVJhdGU6IG51bWJlciA9IDMwO1xuICBwdWJsaWMgc3BlZWQ6IG51bWJlciA9IDEuMDsgLy8gTXVsdGlwbGllZCBieSBmcmFtZXJhdGUgZm9yIGZpbmFsIHBsYXliYWNrIG91dHB1dCByYXRlXG4gIHB1YmxpYyBsb29wOiBib29sZWFuID0gdHJ1ZTtcbiAgcHVibGljIGVuY29kZXJXaW5kb3dTaXplID0gODsgLy8gbGVuZ3RoIG9mIHRoZSBkYXRhYm94XG4gIHB1YmxpYyBlbmNvZGVyQnl0ZUxlbmd0aCA9IDE2O1xuICBwdWJsaWMgdmlkZW9TaXplID0gMTAyNDtcblxuICAvLyBUaHJlZSBvYmplY3RzXG4gIHB1YmxpYyBzY2VuZTogT2JqZWN0M0Q7XG4gIHB1YmxpYyByZW5kZXJlcjogUmVuZGVyZXI7XG4gIHB1YmxpYyBtZXNoOiBNZXNoO1xuICBwdWJsaWMgbWVzaEZpbGVQYXRoOiBTdHJpbmc7XG4gIHB1YmxpYyBtYXRlcmlhbDogTWVzaEJhc2ljTWF0ZXJpYWw7XG4gIHB1YmxpYyBmYWlsTWF0ZXJpYWw6IE1lc2hCYXNpY01hdGVyaWFsO1xuICBwdWJsaWMgYnVmZmVyR2VvbWV0cnk6IEJ1ZmZlckdlb21ldHJ5O1xuXG4gIC8vIFByaXZhdGUgRmllbGRzXG4gIHByaXZhdGUgcmVhZG9ubHkgX3NjYWxlOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIF92aWRlbzogSFRNTFZpZGVvRWxlbWVudCB8IEFkdmFuY2VkSFRNTFZpZGVvRWxlbWVudCA9IG51bGw7XG4gIHByaXZhdGUgX3ZpZGVvVGV4dHVyZSA9IG51bGw7XG4gIHByaXZhdGUgbWVzaEJ1ZmZlcjogTWFwPG51bWJlciwgQnVmZmVyR2VvbWV0cnk+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF93b3JrZXI6IFdvcmtlcjtcbiAgcHJpdmF0ZSBvbk1lc2hCdWZmZXJpbmc6IG9uTWVzaEJ1ZmZlcmluZ0NhbGxiYWNrIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgb25GcmFtZVNob3c6IG9uRnJhbWVTaG93Q2FsbGJhY2sgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZW5kZXJlckNhbGxiYWNrOiBvblJlbmRlcmluZ0NhbGxiYWNrIHwgbnVsbCA9IG51bGw7XG4gIGZpbGVIZWFkZXI6IGFueTtcbiAgdGVtcEJ1ZmZlck9iamVjdDogQnVmZmVyR2VvbWV0cnk7XG5cbiAgcHJpdmF0ZSBtYW5pZmVzdEZpbGVQYXRoOiBhbnk7XG4gIHByaXZhdGUgY291bnRlckN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xuICBwcml2YXRlIGFjdG9yQ3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XG5cbiAgcHJpdmF0ZSBudW1iZXJPZkZyYW1lczogbnVtYmVyO1xuICBwcml2YXRlIG1heE51bWJlck9mRnJhbWVzOiBudW1iZXI7XG4gIHByaXZhdGUgYWN0b3JDYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xuICBjdXJyZW50RnJhbWU6IG51bWJlciA9IDA7XG4gIGxhc3RGcmFtZVJlcXVlc3RlZDogbnVtYmVyID0gMDtcbiAgdGFyZ2V0RnJhbWVzVG9SZXF1ZXN0OiBudW1iZXIgPSAzMDtcblxuICBzZXQgcGF1c2VkKHZhbHVlKXtcbiAgICBpZighdmFsdWUpIHRoaXMucGxheSgpO1xuICAgIGVsc2Uge1xuICAgICAgdGhpcy5fdmlkZW8ucGF1c2UoKTtcbiAgICAgIHRoaXMuaGFzUGxheWVkID0gZmFsc2U7XG4gICAgICB0aGlzLnN0b3BPbk5leHRGcmFtZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGJ1ZmZlckxvb3AgPSAoKSA9PiB7XG5cbiAgICBjb25zdCBpc09uTG9vcCA9IHRoaXMubGFzdEZyYW1lUmVxdWVzdGVkIDwgdGhpcy5jdXJyZW50RnJhbWU7XG4gICAgXG4gICAgZm9yIChjb25zdCBba2V5LCBidWZmZXJdIG9mIHRoaXMubWVzaEJ1ZmZlci5lbnRyaWVzKCkpIHtcbiAgICAgIC8vIElmIGtleSBpcyBiZXR3ZWVuIGN1cnJlbnQga2V5ZnJhbWUgYW5kIGxhc3QgcmVxdWVzdGVkLCBkb24ndCBkZWxldGVcbiAgICAgIGlmICgoaXNPbkxvb3AgJiYgKGtleSA+IHRoaXMubGFzdEZyYW1lUmVxdWVzdGVkICYmIGtleSA8IHRoaXMuY3VycmVudEZyYW1lKSkgfHxcbiAgICAgICAgKCFpc09uTG9vcCAmJiBrZXkgPCB0aGlzLmN1cnJlbnRGcmFtZSkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJEZXN0cm95aW5nXCIsIGtleSk7XG4gICAgICAgIGlmIChidWZmZXIgJiYgYnVmZmVyIGluc3RhbmNlb2YgQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgICAgICBidWZmZXI/LmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1lc2hCdWZmZXIuZGVsZXRlKGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbWluaW11bUJ1ZmZlckxlbmd0aCA9IHRoaXMudGFyZ2V0RnJhbWVzVG9SZXF1ZXN0ICogMjtcbiAgICBjb25zdCBtZXNoQnVmZmVySGFzRW5vdWdoVG9QbGF5ID0gdGhpcy5tZXNoQnVmZmVyLnNpemUgPj0gbWluaW11bUJ1ZmZlckxlbmd0aDtcblxuICAgIGlmIChtZXNoQnVmZmVySGFzRW5vdWdoVG9QbGF5KSB7XG4gICAgICBpZih0aGlzLl92aWRlby5wYXVzZWQgJiYgdGhpcy5oYXNQbGF5ZWQpXG4gICAgICAgIHRoaXMuX3ZpZGVvLnBsYXkoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpZiAobW9kdWxvQnkodGhpcy5sYXN0RnJhbWVSZXF1ZXN0ZWQgLSB0aGlzLmN1cnJlbnRGcmFtZSwgdGhpcy5udW1iZXJPZkZyYW1lcykgPD0gbWluaW11bUJ1ZmZlckxlbmd0aCAqIDIpIHtcbiAgICAgICAgY29uc3QgbmV3TGFzdEZyYW1lID0gTWF0aC5tYXgodGhpcy5sYXN0RnJhbWVSZXF1ZXN0ZWQgKyBtaW5pbXVtQnVmZmVyTGVuZ3RoLCB0aGlzLmxhc3RGcmFtZVJlcXVlc3RlZCArIHRoaXMudGFyZ2V0RnJhbWVzVG9SZXF1ZXN0KSAlIHRoaXMubnVtYmVyT2ZGcmFtZXM7XG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICAgICAgZnJhbWVTdGFydDogdGhpcy5sYXN0RnJhbWVSZXF1ZXN0ZWQsXG4gICAgICAgICAgZnJhbWVFbmQ6IG5ld0xhc3RGcmFtZVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKFwiUG9zdGluZyByZXF1ZXN0XCIsIHBheWxvYWQpO1xuICAgICAgICB0aGlzLl93b3JrZXIucG9zdE1lc3NhZ2UoeyB0eXBlOiBcInJlcXVlc3RcIiwgcGF5bG9hZCB9KTsgLy8gU2VuZCBkYXRhIHRvIG91ciB3b3JrZXIuXG4gICAgICAgIHRoaXMubGFzdEZyYW1lUmVxdWVzdGVkID0gbmV3TGFzdEZyYW1lO1xuXG4gICAgICAgIGlmICghbWVzaEJ1ZmZlckhhc0Vub3VnaFRvUGxheSAmJiB0eXBlb2YgdGhpcy5vbk1lc2hCdWZmZXJpbmcgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdidWZmZXJpbmcgJywgdGhpcy5tZXNoQnVmZmVyLnNpemUgLyBtaW5pbXVtQnVmZmVyTGVuZ3RoLCcsICBoYXZlOiAnLCB0aGlzLm1lc2hCdWZmZXIuc2l6ZSwgJywgbmVlZDogJywgbWluaW11bUJ1ZmZlckxlbmd0aCApXG4gICAgICAgICAgdGhpcy5vbk1lc2hCdWZmZXJpbmcodGhpcy5tZXNoQnVmZmVyLnNpemUgLyBtaW5pbXVtQnVmZmVyTGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB0aGlzLmJ1ZmZlckxvb3AoKSk7XG4gIH1cblxuICBoYXNQbGF5ZWQgPSBmYWxzZTtcblxuICBzdG9wT25OZXh0RnJhbWUgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcih7XG4gICAgICAgICAgICAgICAgc2NlbmUsXG4gICAgICAgICAgICAgICAgcmVuZGVyZXIsXG4gICAgICAgICAgICAgICAgbWFuaWZlc3RGaWxlUGF0aCA9IG51bGwsXG4gICAgICAgICAgICAgICAgbWVzaEZpbGVQYXRoLFxuICAgICAgICAgICAgICAgIHZpZGVvRmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgdGFyZ2V0RnJhbWVzVG9SZXF1ZXN0ID0gOTAsXG4gICAgICAgICAgICAgICAgZnJhbWVSYXRlID0gMzAsXG4gICAgICAgICAgICAgICAgbG9vcCA9IHRydWUsXG4gICAgICAgICAgICAgICAgc2NhbGUgPSAxLFxuICAgICAgICAgICAgICAgIGVuY29kZXJXaW5kb3dTaXplID0gOCxcbiAgICAgICAgICAgICAgICBlbmNvZGVyQnl0ZUxlbmd0aCA9IDE2LFxuICAgICAgICAgICAgICAgIHZpZGVvU2l6ZSA9IDEwMjQsXG4gICAgICAgICAgICAgICAgdmlkZW8gPSBudWxsLFxuICAgICAgICAgICAgICAgIG9uTWVzaEJ1ZmZlcmluZyA9IG51bGwsXG4gICAgICAgICAgICAgICAgb25GcmFtZVNob3cgPSBudWxsLFxuICAgICAgICAgICAgICAgIHJlbmRlcmVyQ2FsbGJhY2sgPSBudWxsLFxuICAgICAgICAgICAgICAgIHdvcmtlciA9IG51bGxcbiAgICAgICAgICAgICAgfToge1xuICAgIHNjZW5lOiBPYmplY3QzRCxcbiAgICByZW5kZXJlcjogV2ViR0xSZW5kZXJlcixcbiAgICBtYW5pZmVzdEZpbGVQYXRoPzogc3RyaW5nLFxuICAgIG1lc2hGaWxlUGF0aDogc3RyaW5nLFxuICAgIHZpZGVvRmlsZVBhdGg6IHN0cmluZyxcbiAgICB0YXJnZXRGcmFtZXNUb1JlcXVlc3Q/OiBudW1iZXIsXG4gICAgZnJhbWVSYXRlPzogbnVtYmVyLFxuICAgIGxvb3A/OiBib29sZWFuLFxuICAgIGF1dG9wbGF5PzogYm9vbGVhbixcbiAgICBzY2FsZT86IG51bWJlcixcbiAgICB2aWRlbz86IGFueSxcbiAgICBlbmNvZGVyV2luZG93U2l6ZT86IG51bWJlcixcbiAgICBlbmNvZGVyQnl0ZUxlbmd0aD86IG51bWJlcixcbiAgICB2aWRlb1NpemU/OiBudW1iZXIsXG4gICAgb25NZXNoQnVmZmVyaW5nPzogb25NZXNoQnVmZmVyaW5nQ2FsbGJhY2tcbiAgICBvbkZyYW1lU2hvdz86IG9uRnJhbWVTaG93Q2FsbGJhY2ssXG4gICAgcmVuZGVyZXJDYWxsYmFjaz86IG9uUmVuZGVyaW5nQ2FsbGJhY2ssXG4gICAgd29ya2VyPzogV29ya2VyXG4gIH0pIHtcblxuICAgIHRoaXMub25NZXNoQnVmZmVyaW5nID0gb25NZXNoQnVmZmVyaW5nO1xuICAgIHRoaXMub25GcmFtZVNob3cgPSBvbkZyYW1lU2hvdztcbiAgICB0aGlzLnJlbmRlcmVyQ2FsbGJhY2sgPSByZW5kZXJlckNhbGxiYWNrO1xuXG4gICAgdGhpcy5lbmNvZGVyV2luZG93U2l6ZSA9IGVuY29kZXJXaW5kb3dTaXplO1xuICAgIHRoaXMuZW5jb2RlckJ5dGVMZW5ndGggPSBlbmNvZGVyQnl0ZUxlbmd0aDtcbiAgICB0aGlzLm1heE51bWJlck9mRnJhbWVzID0gTWF0aC5wb3coMiwgdGhpcy5lbmNvZGVyQnl0ZUxlbmd0aCktMjtcbiAgICB0aGlzLnZpZGVvU2l6ZSA9IHZpZGVvU2l6ZTtcblxuICAgIHRoaXMudGFyZ2V0RnJhbWVzVG9SZXF1ZXN0ID0gdGFyZ2V0RnJhbWVzVG9SZXF1ZXN0O1xuXG4gICAgdGhpcy5fd29ya2VyID0gd29ya2VyID8/IChuZXcgV29ya2VyKCcuL3dvcmtlckZ1bmN0aW9uLnRzJykpOyAvLyBzcGF3biBuZXcgd29ya2VyO1xuXG4gICAgdGhpcy5zY2VuZSA9IHNjZW5lO1xuICAgIHRoaXMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICB0aGlzLm1lc2hGaWxlUGF0aCA9IG1lc2hGaWxlUGF0aDtcbiAgICB0aGlzLm1hbmlmZXN0RmlsZVBhdGggPSBtYW5pZmVzdEZpbGVQYXRoID8/IG1lc2hGaWxlUGF0aC5yZXBsYWNlKCd1dm9sJywgJ21hbmlmZXN0Jyk7XG4gICAgdGhpcy5sb29wID0gbG9vcDtcbiAgICB0aGlzLl9zY2FsZSA9IHNjYWxlO1xuICAgIHRoaXMuX3ZpZGVvID0gdmlkZW8gPz8gY3JlYXRlRWxlbWVudCgndmlkZW8nLCB7XG4gICAgICBjcm9zc29yaWdpbjogXCJcIixcbiAgICAgIHBsYXlzSW5saW5lOiBcInRydWVcIixcbiAgICAgIHByZWxvYWQ6IFwiYXV0b1wiLFxuICAgICAgbG9vcDogdHJ1ZSxcbiAgICAgIHNyYzogdmlkZW9GaWxlUGF0aCxcbiAgICAgIHN0eWxlOiB7XG4gICAgICAgIGRpc3BsYXk6IFwibm9uZVwiLFxuICAgICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICAgICAgekluZGV4OiAnLTEnLFxuICAgICAgICB0b3A6ICcwJyxcbiAgICAgICAgbGVmdDogJzAnLFxuICAgICAgICB3aWR0aDogJzFweCdcbiAgICAgIH0sXG4gICAgICBwbGF5YmFja1JhdGU6IDFcbiAgICB9KTtcblxuICAgIHRoaXMuX3ZpZGVvLnNldEF0dHJpYnV0ZSgnY3Jvc3NvcmlnaW4nLCAnJyk7XG4gICAgdGhpcy5fdmlkZW8uc2V0QXR0cmlidXRlKCdwcmVsb2FkJywgJ2F1dG8nKTtcblxuICAgIHRoaXMuZnJhbWVSYXRlID0gZnJhbWVSYXRlO1xuXG4gICAgY29uc3QgY291bnRlckNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpIGFzIEhUTUxDYW52YXNFbGVtZW50O1xuICAgIGNvdW50ZXJDYW52YXMud2lkdGggPSB0aGlzLmVuY29kZXJCeXRlTGVuZ3RoO1xuICAgIGNvdW50ZXJDYW52YXMuaGVpZ2h0ID0gMTtcblxuICAgIHRoaXMuY291bnRlckN0eCA9IGNvdW50ZXJDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLmFjdG9yQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcbiAgICB0aGlzLmFjdG9yQ3R4ID0gdGhpcy5hY3RvckNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgdGhpcy5hY3RvckN0eC5jYW52YXMud2lkdGggPSB0aGlzLmFjdG9yQ3R4LmNhbnZhcy5oZWlnaHQgPSB0aGlzLnZpZGVvU2l6ZTtcbiAgICB0aGlzLmNvdW50ZXJDdHguY2FudmFzLnNldEF0dHJpYnV0ZSgnY3Jvc3NPcmlnaW4nLCAnQW5vbnltb3VzJyk7XG4gICAgdGhpcy5hY3RvckN0eC5jYW52YXMuc2V0QXR0cmlidXRlKCdjcm9zc09yaWdpbicsICdBbm9ueW1vdXMnKTtcblxuICAgIHRoaXMuYWN0b3JDdHguZmlsbFN0eWxlID0gJyNBQ0MnO1xuICAgIHRoaXMuYWN0b3JDdHguZmlsbFJlY3QoMCwgMCwgdGhpcy5hY3RvckN0eC5jYW52YXMud2lkdGgsIHRoaXMuYWN0b3JDdHguY2FudmFzLmhlaWdodCk7XG5cbiAgICB0aGlzLl92aWRlb1RleHR1cmUgPSBuZXcgVGV4dHVyZSh0aGlzLmFjdG9yQ3R4LmNhbnZhcyk7XG4gICAgdGhpcy5fdmlkZW9UZXh0dXJlLmVuY29kaW5nID0gc1JHQkVuY29kaW5nO1xuICAgIHRoaXMubWF0ZXJpYWwgPSBuZXcgTWVzaEJhc2ljTWF0ZXJpYWwoeyBtYXA6IHRoaXMuX3ZpZGVvVGV4dHVyZSB9KTtcblxuICAgIHRoaXMuZmFpbE1hdGVyaWFsID0gbmV3IE1lc2hCYXNpY01hdGVyaWFsKHsgY29sb3I6ICcjNTU1NTU1JyB9KTtcbiAgICB0aGlzLm1lc2ggPSBuZXcgTWVzaChuZXcgUGxhbmVCdWZmZXJHZW9tZXRyeSgwLjAwMDAxLCAwLjAwMDAxKSwgdGhpcy5tYXRlcmlhbCk7XG4gICAgdGhpcy5tZXNoLnNjYWxlLnNldCh0aGlzLl9zY2FsZSwgdGhpcy5fc2NhbGUsIHRoaXMuX3NjYWxlKTtcbiAgICB0aGlzLnNjZW5lLmFkZCh0aGlzLm1lc2gpO1xuXG5cbiAgICBjb25zdCBoYW5kbGVGcmFtZURhdGEgPSAobWVzc2FnZXMpID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGByZWNlaXZlZCBmcmFtZXMgJHttZXNzYWdlc1swXS5rZXlmcmFtZU51bWJlcn0gLSAke21lc3NhZ2VzW21lc3NhZ2VzLmxlbmd0aC0xXS5rZXlmcmFtZU51bWJlcn1gKVxuICAgICAgZm9yIChjb25zdCBmcmFtZURhdGEgb2YgbWVzc2FnZXMpIHtcbiAgICAgICAgbGV0IGdlb21ldHJ5ID0gbmV3IEJ1ZmZlckdlb21ldHJ5KCk7XG4gICAgICAgIGdlb21ldHJ5LnNldEluZGV4KFxuICAgICAgICAgIG5ldyBVaW50MzJCdWZmZXJBdHRyaWJ1dGUoZnJhbWVEYXRhLmJ1ZmZlckdlb21ldHJ5LmluZGV4LCAxKVxuICAgICAgICApO1xuICAgICAgICBnZW9tZXRyeS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgICBuZXcgRmxvYXQzMkJ1ZmZlckF0dHJpYnV0ZShmcmFtZURhdGEuYnVmZmVyR2VvbWV0cnkucG9zaXRpb24sIDMpXG4gICAgICAgICk7XG4gICAgICAgIGdlb21ldHJ5LnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAndXYnLFxuICAgICAgICAgIG5ldyBGbG9hdDMyQnVmZmVyQXR0cmlidXRlKGZyYW1lRGF0YS5idWZmZXJHZW9tZXRyeS51diwgMilcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLm1lc2hCdWZmZXIuc2V0KGZyYW1lRGF0YS5rZXlmcmFtZU51bWJlciwgZ2VvbWV0cnkgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9uTWVzaEJ1ZmZlcmluZyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNvbnN0IG1pbmltdW1CdWZmZXJMZW5ndGggPSB0aGlzLnRhcmdldEZyYW1lc1RvUmVxdWVzdCAqIDI7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdidWZmZXJpbmcgJywgdGhpcy5tZXNoQnVmZmVyLnNpemUgLyBtaW5pbXVtQnVmZmVyTGVuZ3RoLCcsICBoYXZlOiAnLCB0aGlzLm1lc2hCdWZmZXIuc2l6ZSwgJywgbmVlZDogJywgbWluaW11bUJ1ZmZlckxlbmd0aCApXG4gICAgICAgIHRoaXMub25NZXNoQnVmZmVyaW5nKHRoaXMubWVzaEJ1ZmZlci5zaXplIC8gbWluaW11bUJ1ZmZlckxlbmd0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgd29ya2VyLm9ubWVzc2FnZSA9IChlKSA9PiB7XG4gICAgICBzd2l0Y2ggKGUuZGF0YS50eXBlKSB7XG4gICAgICAgIGNhc2UgJ2luaXRpYWxpemVkJzpcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIldvcmtlciBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyTG9vcCgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdmcmFtZWRhdGEnOlxuICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgaGFuZGxlRnJhbWVEYXRhKGUuZGF0YS5wYXlsb2FkKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSAhPT0gNCkgcmV0dXJuO1xuICAgICAgdGhpcy5maWxlSGVhZGVyID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgIHRoaXMuZnJhbWVSYXRlID0gdGhpcy5maWxlSGVhZGVyLmZyYW1lUmF0ZTtcblxuICAgICAgLy8gR2V0IGNvdW50IG9mIGZyYW1lcyBhc3NvY2lhdGVkIHdpdGgga2V5ZnJhbWVcbiAgICAgIHRoaXMubnVtYmVyT2ZGcmFtZXMgPSB0aGlzLmZpbGVIZWFkZXIuZnJhbWVEYXRhLmxlbmd0aDtcblxuICAgICAgaWYgKHRoaXMubnVtYmVyT2ZGcmFtZXMgPiB0aGlzLm1heE51bWJlck9mRnJhbWVzKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RoZXJlIGFyZSBtb3JlIGZyYW1lcyAoJWQpIGluIGZpbGUgdGhlbiBvdXIgZGVjb2RlciBjYW4gaGFuZGxlKCVkKSB3aXRoIHByb3ZpZGVkIGVuY29kZXJCeXRlTGVuZ3RoKCVkKScsIHRoaXMubnVtYmVyT2ZGcmFtZXMsIHRoaXMubWF4TnVtYmVyT2ZGcmFtZXMsIHRoaXMuZW5jb2RlckJ5dGVMZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICB3b3JrZXIucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImluaXRpYWxpemVcIiwgcGF5bG9hZDogeyB0YXJnZXRGcmFtZXNUb1JlcXVlc3QsIG1lc2hGaWxlUGF0aCwgbnVtYmVyT2ZGcmFtZXM6IHRoaXMubnVtYmVyT2ZGcmFtZXMsIGZpbGVIZWFkZXI6IHRoaXMuZmlsZUhlYWRlciB9IH0pOyAvLyBTZW5kIGRhdGEgdG8gb3VyIHdvcmtlci5cbiAgICB9O1xuXG4gICAgeGhyLm9wZW4oJ0dFVCcsIHRoaXMubWFuaWZlc3RGaWxlUGF0aCwgdHJ1ZSk7IC8vIHRydWUgZm9yIGFzeW5jaHJvbm91c1xuICAgIHhoci5zZW5kKCk7XG4gIH1cblxuICAvKipcbiAgICogZW11bGF0ZWQgdmlkZW8gZnJhbWUgY2FsbGJhY2tcbiAgICogYnJpZGdlIGZyb20gdmlkZW8udGltZXVwZGF0ZSBldmVudCB0byB2aWRlb1VwZGF0ZUhhbmRsZXJcbiAgICogQHBhcmFtIGNiXG4gICAqL1xuICBoYW5kbGVSZW5kZXIoY2I/OiBvblJlbmRlcmluZ0NhbGxiYWNrKSB7XG4gICAgaWYgKCF0aGlzLmZpbGVIZWFkZXIpIC8vIHx8ICh0aGlzLl92aWRlby5jdXJyZW50VGltZSA9PT0gMCB8fCB0aGlzLl92aWRlby5wYXVzZWQpKVxuICAgICAgcmV0dXJuO1xuXG4gICAgLy8gVE9ETzogaGFuZGxlIHBhdXNlZCBzdGF0ZVxuICAgIHRoaXMucHJvY2Vzc0ZyYW1lKGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBzeW5jIG1lc2ggZnJhbWUgdG8gdmlkZW8gdGV4dHVyZSBmcmFtZVxuICAgKiBjYWxscyB0aGlzLnJlbmRlcmVyQ2FsbGJhY2sgYW5kIHByb3ZpZGVkIGNhbGxiYWNrIGlmIGZyYW1lIGlzIGNoYW5nZWQgYW5kIHJlbmRlciBuZWVkcyB1cGRhdGVcbiAgICogQHBhcmFtIGNiXG4gICAqL1xuICBwcm9jZXNzRnJhbWUoY2I/OiBvblJlbmRlcmluZ0NhbGxiYWNrKSB7XG4gICAgY29uc3QgZnJhbWVUb1BsYXkgPSB0aGlzLmdldEN1cnJlbnRGcmFtZU51bWJlcigpO1xuXG4gICAgaWYgKGZyYW1lVG9QbGF5ID4gdGhpcy5udW1iZXJPZkZyYW1lcykge1xuICAgICAgY29uc29sZS53YXJuKCd2aWRlbyB0ZXh0dXJlIGlzIG5vdCByZWFkeT8gZnJhbWVUb1BsYXk6JywgZnJhbWVUb1BsYXkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmN1cnJlbnRGcmFtZSA9PT0gZnJhbWVUb1BsYXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnRGcmFtZSA9IGZyYW1lVG9QbGF5O1xuXG4gICAgaWYgKHRoaXMuc3RvcE9uTmV4dEZyYW1lKSB7XG4gICAgICB0aGlzLl92aWRlby5wYXVzZSgpO1xuICAgICAgdGhpcy5oYXNQbGF5ZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuc3RvcE9uTmV4dEZyYW1lID0gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgaGFzRnJhbWUgPSB0aGlzLm1lc2hCdWZmZXIuaGFzKGZyYW1lVG9QbGF5KTtcbiAgICAvLyBJZiBrZXlmcmFtZSBjaGFuZ2VkLCBzZXQgbWVzaCBidWZmZXIgdG8gbmV3IGtleWZyYW1lXG5cbiAgICBpZiAoIWhhc0ZyYW1lKSB7XG4gICAgICBpZiAoIXRoaXMuX3ZpZGVvLnBhdXNlZCkge1xuICAgICAgICB0aGlzLl92aWRlby5wYXVzZSgpO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9uTWVzaEJ1ZmZlcmluZyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRoaXMub25NZXNoQnVmZmVyaW5nKDApO1xuICAgICAgfVxuICAgICAgdGhpcy5tZXNoLm1hdGVyaWFsID0gdGhpcy5mYWlsTWF0ZXJpYWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWVzaC5tYXRlcmlhbCA9IHRoaXMubWF0ZXJpYWw7XG4gICAgICB0aGlzLm1hdGVyaWFsLm5lZWRzVXBkYXRlID0gdHJ1ZTtcblxuICAgICAgdGhpcy5tZXNoLm1hdGVyaWFsLm5lZWRzVXBkYXRlID0gdHJ1ZTtcblxuICAgICAgdGhpcy5tZXNoLmdlb21ldHJ5ID0gdGhpcy5tZXNoQnVmZmVyLmdldChmcmFtZVRvUGxheSkgYXMgQnVmZmVyR2VvbWV0cnk7XG4gICAgICB0aGlzLm1lc2guZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAodGhpcy5tZXNoLmdlb21ldHJ5IGFzIGFueSkubmVlZHNVcGRhdGUgPSB0cnVlO1xuXG4gICAgICB0aGlzLmN1cnJlbnRGcmFtZSA9IGZyYW1lVG9QbGF5O1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMub25GcmFtZVNob3cgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aGlzLm9uRnJhbWVTaG93KGZyYW1lVG9QbGF5KTtcbiAgICAgIH1cbiAgICAgIGlmKHRoaXMucmVuZGVyZXJDYWxsYmFjaykgdGhpcy5yZW5kZXJlckNhbGxiYWNrKCk7XG4gICAgICBpZihjYikgY2IoKTtcbiAgICB9XG4gIH1cblxuICBnZXRDdXJyZW50RnJhbWVOdW1iZXIoKTpudW1iZXIge1xuICAgIGNvbnN0IGVuY29kZXJXaW5kb3dXaWR0aCA9IHRoaXMuZW5jb2RlcldpbmRvd1NpemUgKiB0aGlzLmVuY29kZXJCeXRlTGVuZ3RoO1xuICAgIGNvbnN0IGVuY29kZXJXaW5kb3dIZWlnaHQgPSB0aGlzLmVuY29kZXJXaW5kb3dTaXplIC8gMjtcbiAgICAvLyB0aGlzLmFjdG9yQ3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLnZpZGVvU2l6ZSwgdGhpcy52aWRlb1NpemUpO1xuICAgIHRoaXMuYWN0b3JDdHguZHJhd0ltYWdlKHRoaXMuX3ZpZGVvLCAwLCAwKTtcblxuICAgIC8vIHRoaXMuY291bnRlckN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5lbmNvZGVyQnl0ZUxlbmd0aCwgMSk7XG4gICAgdGhpcy5jb3VudGVyQ3R4LmRyYXdJbWFnZShcbiAgICAgIHRoaXMuYWN0b3JDdHguY2FudmFzLFxuICAgICAgMCxcbiAgICAgIHRoaXMudmlkZW9TaXplIC0gZW5jb2RlcldpbmRvd0hlaWdodCxcbiAgICAgIGVuY29kZXJXaW5kb3dXaWR0aCxcbiAgICAgIGVuY29kZXJXaW5kb3dIZWlnaHQsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIHRoaXMuZW5jb2RlckJ5dGVMZW5ndGgsIDEpO1xuXG4gICAgY29uc3QgaW1nRGF0YSA9IHRoaXMuY291bnRlckN0eC5nZXRJbWFnZURhdGEoMCwgMCwgdGhpcy5lbmNvZGVyQnl0ZUxlbmd0aCwgMSk7XG5cbiAgICBsZXQgZnJhbWVUb1BsYXkgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5lbmNvZGVyQnl0ZUxlbmd0aDsgaSsrKSB7XG4gICAgICBmcmFtZVRvUGxheSArPSBNYXRoLnJvdW5kKGltZ0RhdGEuZGF0YVtpICogNF0gLyAyNTUpICogTWF0aC5wb3coMiwgaSk7XG4gICAgfVxuXG4gICAgZnJhbWVUb1BsYXkgPSBNYXRoLm1heChmcmFtZVRvUGxheSAtIDEsIDApO1xuXG4gICAgdGhpcy5fdmlkZW9UZXh0dXJlLm5lZWRzVXBkYXRlID0gdGhpcy5jdXJyZW50RnJhbWUgIT09IGZyYW1lVG9QbGF5O1xuXG4gICAgcmV0dXJuIGZyYW1lVG9QbGF5O1xuICB9XG5cbiAgZ2V0IHZpZGVvKCk6YW55IHtcbiAgICByZXR1cm4gdGhpcy5fdmlkZW87XG4gIH1cblxuICAvLyBTdGFydCBsb29wIHRvIGNoZWNrIGlmIHdlJ3JlIHJlYWR5IHRvIHBsYXlcbiAgcGxheSgpIHtcbiAgICB0aGlzLmhhc1BsYXllZCA9IHRydWU7XG4gICAgdGhpcy5fdmlkZW8ucGxheXNJbmxpbmUgPSB0cnVlO1xuICAgIHRoaXMubWVzaC52aXNpYmxlID0gdHJ1ZVxuICAgIHRoaXMuX3ZpZGVvLnBsYXkoKVxuICB9XG5cbiAgcGxheU9uZUZyYW1lKCkge1xuICAgIHRoaXMuc3RvcE9uTmV4dEZyYW1lID0gdHJ1ZTtcbiAgICB0aGlzLnBsYXkoKTtcbiAgfVxuXG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5fd29ya2VyPy50ZXJtaW5hdGUoKTtcbiAgICBpZiAodGhpcy5fdmlkZW8pIHtcbiAgICAgIHRoaXMuX3ZpZGVvLnBhdXNlKCk7XG4gICAgICB0aGlzLl92aWRlbyA9IG51bGw7XG4gICAgICB0aGlzLl92aWRlb1RleHR1cmUuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5fdmlkZW9UZXh0dXJlID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMubWVzaEJ1ZmZlcikge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm1lc2hCdWZmZXIuc2l6ZTsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMubWVzaEJ1ZmZlci5nZXQoaSk7XG4gICAgICAgIGlmIChidWZmZXIgJiYgYnVmZmVyIGluc3RhbmNlb2YgQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgICAgICBidWZmZXI/LmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5tZXNoQnVmZmVyLmNsZWFyKCk7XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOlsiUGxhbmVCdWZmZXJHZW9tZXRyeSJdLCJtYXBwaW5ncyI6Im1HQUNBLEtBQU0sR0FBYyxNQUFPLE9BQVMsVUFDL0IsS0FBSyxhQUNMLEtBQUssWUFBWSxPQUFTLDZCQUN6QixFQUF3QixDQUFDLEVBQVMsWUFDL0IsUUFBUSxHQUFNLFFBQVEsQUFBQyxHQUFlLE1BQ3JDLENBQUMsRUFBSyxHQUFTLElBQ2xCLEdBQU8sSUFFTCxHQUdJLEVBQWdCLENBQUMsRUFBYyxJQUNuQyxFQUFjLFNBQVMsY0FBYyxFQUFNLEdBQVEsRUFBc0IsU0FBUyxjQUFjLEdBQU8sR0FHbkcsRUFBVyxDQUFDLEVBQVEsT0FBcUIsR0FBVSxTQ0lwQyxDQUVuQixVQUFvQixHQUNwQixNQUFnQixFQUNoQixLQUFnQixHQUNoQixrQkFBb0IsRUFDcEIsa0JBQW9CLEdBQ3BCLFVBQVksS0FHWixNQUNBLFNBQ0EsS0FDQSxhQUNBLFNBQ0EsYUFDQSxlQUdVLE9BQWlCLEVBQzFCLE9BQXNELEtBQ3RELGNBQWdCLEtBQ2hCLFdBQTBDLEdBQUksS0FDOUMsUUFDQSxnQkFBa0QsS0FDbEQsWUFBMEMsS0FDMUMsaUJBQStDLEtBQ3ZELFdBQ0EsaUJBRVEsaUJBQ0EsV0FDQSxTQUVBLGVBQ0Esa0JBQ0EsWUFDUixhQUF1QixFQUN2QixtQkFBNkIsRUFDN0Isc0JBQWdDLE1BRTVCLFFBQU8sRUFBTSxDQUNYLFFBRUcsT0FBTyxhQUNQ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
