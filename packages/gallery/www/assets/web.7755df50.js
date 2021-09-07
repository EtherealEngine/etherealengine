import{W as e}from"./index.fd7201a9.js";import"./vendor.40ddfb4b.js";import"./_app.e67b0e96.js";import"./index.b0bd5cc1.js";import"./selector.e2ee45bf.js";import"./index.1d867f8f.js";import"./service.0737f8c0.js";import"./upload.8895077e.js";import"./feathers.42c2841d.js";import"./selector.d1cb6f6a.js";import"./service.d8de8161.js";import"./selector.8a0da25a.js";import"./Slide.1e39d9a9.js";import"./Paper.24cff5e5.js";import"./capitalize.f4eb3e2e.js";import"./Typography.9d0f0940.js";import"./Modal.c801ca2c.js";import"./Dialog.c787f71e.js";import"./Backdrop.9ef065d7.js";import"./Button.31285e4e.js";import"./Box.cb35bf4d.js";import"./CardMedia.d28b7db0.js";import"./makeStyles.dc74902c.js";import"./Avatar.073c615c.js";var o=function(e,o,t,s){return new(t||(t=Promise))((function(i,n){function r(e){try{u(s.next(e))}catch(o){n(o)}}function c(e){try{u(s.throw(e))}catch(o){n(o)}}function u(e){var o;e.done?i(e.value):(o=e.value,o instanceof t?o:new t((function(e){e(o)}))).then(r,c)}u((s=s.apply(e,o||[])).next())}))};class t extends e{constructor(){super({name:"XRPlugin",platforms:["web"]})}initialize(e){return o(this,void 0,void 0,(function*(){return console.log("Initialize called to plugin on web"),new Promise(((e,o)=>{e({status:"web"})}))}))}start(e){return o(this,void 0,void 0,(function*(){return new Promise(((o,t)=>{navigator.mediaDevices.getUserMedia({audio:!e.disableAudio,video:!0});const s=document.getElementById("video"),i=e.parent?document.getElementById(e.parent):document.body;if(s)t({message:"camera already started"});else{const s=document.createElement("video");s.id="video",s.setAttribute("class",e.className||""),s.setAttribute("style","-webkit-transform: scaleX(-1); transform: scaleX(-1);"),i.appendChild(s),navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&navigator.mediaDevices.getUserMedia({video:!0}).then((function(e){s.srcObject=e,s.play(),o({})}),(e=>{t(e)}))}}))}))}handleTap(){return o(this,void 0,void 0,(function*(){}))}stop(){return o(this,void 0,void 0,(function*(){const e=document.getElementById("video");if(e){e.pause();const t=e.srcObject.getTracks();for(var o=0;o<t.length;o++){t[o].stop()}e.remove()}}))}transcodeVideo(e){return o(this,void 0,void 0,(function*(){return new Promise(((e,o)=>{e({status:"success",path:""})}))}))}createThumbnail(e){return o(this,void 0,void 0,(function*(){return new Promise(((e,o)=>{e({status:"success",path:""})}))}))}trim(e){return o(this,void 0,void 0,(function*(){return new Promise(((e,o)=>{e({status:"success",path:""})}))}))}getVideoInfo(){return o(this,void 0,void 0,(function*(){return new Promise(((e,o)=>{e({status:"success"})}))}))}execFFMPEG(e){return o(this,void 0,void 0,(function*(){return console.log("execFFMPEG called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}execFFPROBE(e){return o(this,void 0,void 0,(function*(){return console.log("execFFPROBE called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}getXRDataForFrame(e){return o(this,void 0,void 0,(function*(){return console.log("getXRDataForFrame called to plugin on web"),new Promise(((e,o)=>{e({data:{hasData:!1}})}))}))}startRecording(e,t,s,i,n,r){return o(this,void 0,void 0,(function*(){return console.log("startRecording called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}stopRecording(e){return o(this,void 0,void 0,(function*(){return console.log("stopRecording called to plugin on web"),new Promise(((e,o)=>{e({result:"success",filePath:""})}))}))}getRecordingStatus(e){return o(this,void 0,void 0,(function*(){return console.log("getRecordingStatus called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}takePhoto(e){return o(this,void 0,void 0,(function*(){return console.log("takePhoto called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}saveRecordingToVideo(e){return o(this,void 0,void 0,(function*(){return console.log("saveRecordingToVideo called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}shareMedia(e){return o(this,void 0,void 0,(function*(){return console.log("shareMedia called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}showVideo(e){return o(this,void 0,void 0,(function*(){return console.log("showVideo called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}hideVideo(e){return o(this,void 0,void 0,(function*(){return console.log("showVideo called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}playVideo(e){return o(this,void 0,void 0,(function*(){return console.log("playVideo called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}pauseVideo(e){return o(this,void 0,void 0,(function*(){return console.log("pauseVideo called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}scrubTo(e){return o(this,void 0,void 0,(function*(){return console.log("scrubTo called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}deleteVideo(e){return o(this,void 0,void 0,(function*(){return console.log("deleteVideo called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}saveVideoTo(e){return o(this,void 0,void 0,(function*(){return console.log("saveVideoTo called to plugin on web"),new Promise(((e,o)=>{e({status:"success"})}))}))}clearAnchors(){}}export{t as XRPluginWeb};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViLjc3NTVkZjUwLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvd2VieHItbmF0aXZlL2Rpc3Qvd2ViLmpzIl0sInNvdXJjZXNDb250ZW50IjpbInZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuaW1wb3J0IHsgV2ViUGx1Z2luIH0gZnJvbSAnQGNhcGFjaXRvci9jb3JlJztcbmV4cG9ydCBjbGFzcyBYUlBsdWdpbldlYiBleHRlbmRzIFdlYlBsdWdpbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKHtcbiAgICAgICAgICAgIG5hbWU6ICdYUlBsdWdpbicsXG4gICAgICAgICAgICBwbGF0Zm9ybXM6IFsnd2ViJ10sXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0aWFsaXplKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhbGl6ZSBjYWxsZWQgdG8gcGx1Z2luIG9uIHdlYlwiKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgXykgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdGF0dXM6IFwid2ViXCIgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHN0YXJ0KG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoe1xuICAgICAgICAgICAgICAgICAgICBhdWRpbzogIW9wdGlvbnMuZGlzYWJsZUF1ZGlvLFxuICAgICAgICAgICAgICAgICAgICB2aWRlbzogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZpZGVvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ2aWRlb1wiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBvcHRpb25zLnBhcmVudCA/IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG9wdGlvbnMucGFyZW50KSA6IGRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICAgICAgaWYgKCF2aWRlbykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2aWRlb0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidmlkZW9cIik7XG4gICAgICAgICAgICAgICAgICAgIHZpZGVvRWxlbWVudC5pZCA9IFwidmlkZW9cIjtcbiAgICAgICAgICAgICAgICAgICAgdmlkZW9FbGVtZW50LnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIG9wdGlvbnMuY2xhc3NOYW1lIHx8IFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICB2aWRlb0VsZW1lbnQuc2V0QXR0cmlidXRlKFwic3R5bGVcIiwgXCItd2Via2l0LXRyYW5zZm9ybTogc2NhbGVYKC0xKTsgdHJhbnNmb3JtOiBzY2FsZVgoLTEpO1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKHZpZGVvRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYXZpZ2F0b3IubWVkaWFEZXZpY2VzICYmIG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBOb3QgYWRkaW5nIGB7IGF1ZGlvOiB0cnVlIH1gIHNpbmNlIHdlIG9ubHkgd2FudCB2aWRlbyBub3dcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgdmlkZW86IHRydWUgfSkudGhlbihmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy92aWRlby5zcmMgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChzdHJlYW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvRWxlbWVudC5zcmNPYmplY3QgPSBzdHJlYW07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9FbGVtZW50LnBsYXkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoeyBtZXNzYWdlOiBcImNhbWVyYSBhbHJlYWR5IHN0YXJ0ZWRcIiB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGhhbmRsZVRhcCgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHN0b3AoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBjb25zdCB2aWRlbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidmlkZW9cIik7XG4gICAgICAgICAgICBpZiAodmlkZW8pIHtcbiAgICAgICAgICAgICAgICB2aWRlby5wYXVzZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0ID0gdmlkZW8uc3JjT2JqZWN0O1xuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNrcyA9IHN0LmdldFRyYWNrcygpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0cmFjayA9IHRyYWNrc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2suc3RvcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2aWRlby5yZW1vdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHRyYW5zY29kZVZpZGVvKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN0YXR1czogXCJzdWNjZXNzXCIsIHBhdGg6IFwiXCIgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIDtcbiAgICBjcmVhdGVUaHVtYm5haWwob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3RhdHVzOiBcInN1Y2Nlc3NcIiwgcGF0aDogXCJcIiB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgO1xuICAgIHRyaW0ob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3RhdHVzOiBcInN1Y2Nlc3NcIiwgcGF0aDogXCJcIiB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgO1xuICAgIGdldFZpZGVvSW5mbygpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN0YXR1czogXCJzdWNjZXNzXCIgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIDtcbiAgICBleGVjRkZNUEVHKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXhlY0ZGTVBFRyBjYWxsZWQgdG8gcGx1Z2luIG9uIHdlYlwiKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN0YXR1czogXCJzdWNjZXNzXCIgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGV4ZWNGRlBST0JFKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXhlY0ZGUFJPQkUgY2FsbGVkIHRvIHBsdWdpbiBvbiB3ZWJcIik7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdGF0dXM6IFwic3VjY2Vzc1wiIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRYUkRhdGFGb3JGcmFtZShvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImdldFhSRGF0YUZvckZyYW1lIGNhbGxlZCB0byBwbHVnaW4gb24gd2ViXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgZGF0YTogeyBoYXNEYXRhOiBmYWxzZSB9IH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzdGFydFJlY29yZGluZyhpc0F1ZGlvLCB3aWR0aCwgaGVpZ2h0LCBiaXRSYXRlLCBkcGksIGZpbGVQYXRoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInN0YXJ0UmVjb3JkaW5nIGNhbGxlZCB0byBwbHVnaW4gb24gd2ViXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3RhdHVzOiBcInN1Y2Nlc3NcIiB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgc3RvcFJlY29yZGluZyhvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInN0b3BSZWNvcmRpbmcgY2FsbGVkIHRvIHBsdWdpbiBvbiB3ZWJcIik7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyByZXN1bHQ6IFwic3VjY2Vzc1wiLCBmaWxlUGF0aDogXCJcIiB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0UmVjb3JkaW5nU3RhdHVzKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0UmVjb3JkaW5nU3RhdHVzIGNhbGxlZCB0byBwbHVnaW4gb24gd2ViXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3RhdHVzOiBcInN1Y2Nlc3NcIiB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgdGFrZVBob3RvKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidGFrZVBob3RvIGNhbGxlZCB0byBwbHVnaW4gb24gd2ViXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3RhdHVzOiBcInN1Y2Nlc3NcIiB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgc2F2ZVJlY29yZGluZ1RvVmlkZW8ob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJzYXZlUmVjb3JkaW5nVG9WaWRlbyBjYWxsZWQgdG8gcGx1Z2luIG9uIHdlYlwiKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN0YXR1czogXCJzdWNjZXNzXCIgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHNoYXJlTWVkaWEob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJzaGFyZU1lZGlhIGNhbGxlZCB0byBwbHVnaW4gb24gd2ViXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3RhdHVzOiBcInN1Y2Nlc3NcIiB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgc2hvd1ZpZGVvKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2hvd1ZpZGVvIGNhbGxlZCB0byBwbHVnaW4gb24gd2ViXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3RhdHVzOiBcInN1Y2Nlc3NcIiB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaGlkZVZpZGVvKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2hvd1ZpZGVvIGNhbGxlZCB0byBwbHVnaW4gb24gd2ViXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3RhdHVzOiBcInN1Y2Nlc3NcIiB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcGxheVZpZGVvKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicGxheVZpZGVvIGNhbGxlZCB0byBwbHVnaW4gb24gd2ViXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3RhdHVzOiBcInN1Y2Nlc3NcIiB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcGF1c2VWaWRlbyhvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBhdXNlVmlkZW8gY2FsbGVkIHRvIHBsdWdpbiBvbiB3ZWJcIik7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdGF0dXM6IFwic3VjY2Vzc1wiIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzY3J1YlRvKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2NydWJUbyBjYWxsZWQgdG8gcGx1Z2luIG9uIHdlYlwiKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN0YXR1czogXCJzdWNjZXNzXCIgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRlbGV0ZVZpZGVvKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZGVsZXRlVmlkZW8gY2FsbGVkIHRvIHBsdWdpbiBvbiB3ZWJcIik7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdGF0dXM6IFwic3VjY2Vzc1wiIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzYXZlVmlkZW9UbyhvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInNhdmVWaWRlb1RvIGNhbGxlZCB0byBwbHVnaW4gb24gd2ViXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3RhdHVzOiBcInN1Y2Nlc3NcIiB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY2xlYXJBbmNob3JzKCkge1xuICAgIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXdlYi5qcy5tYXAiXSwibmFtZXMiOlsiX19hd2FpdGVyIiwidGhpc0FyZyIsIl9hcmd1bWVudHMiLCJQIiwiZ2VuZXJhdG9yIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ2YWx1ZSIsIm5leHQiLCJlIiwicmVzdWx0IiwiZG9uZSIsInRoZW4iLCJmdWxmaWxsZWQiLCJyZWplY3RlZCIsImFwcGx5IiwiV2ViUGx1Z2luIiwiY29uc3RydWN0b3IiLCJuYW1lIiwicGxhdGZvcm1zIiwiaW5pdGlhbGl6ZSIsIm9wdGlvbnMiLCJ0aGlzIiwibG9nIiwiXyIsInN0YXR1cyIsInN0YXJ0IiwibWVkaWFEZXZpY2VzIiwiZ2V0VXNlck1lZGlhIiwiYXVkaW8iLCJkaXNhYmxlQXVkaW8iLCJ2aWRlbyIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJwYXJlbnQiLCJib2R5IiwibWVzc2FnZSIsInZpZGVvRWxlbWVudCIsImNyZWF0ZUVsZW1lbnQiLCJpZCIsInNldEF0dHJpYnV0ZSIsImNsYXNzTmFtZSIsImFwcGVuZENoaWxkIiwibmF2aWdhdG9yIiwic3RyZWFtIiwic3JjT2JqZWN0IiwicGxheSIsImVyciIsImhhbmRsZVRhcCIsInN0b3AiLCJwYXVzZSIsInRyYWNrcyIsImdldFRyYWNrcyIsImkiLCJsZW5ndGgiLCJyZW1vdmUiLCJ0cmFuc2NvZGVWaWRlbyIsInBhdGgiLCJjcmVhdGVUaHVtYm5haWwiLCJ0cmltIiwiZ2V0VmlkZW9JbmZvIiwiZXhlY0ZGTVBFRyIsImV4ZWNGRlBST0JFIiwiZ2V0WFJEYXRhRm9yRnJhbWUiLCJkYXRhIiwiaGFzRGF0YSIsInN0YXJ0UmVjb3JkaW5nIiwiaXNBdWRpbyIsIndpZHRoIiwiaGVpZ2h0IiwiYml0UmF0ZSIsImRwaSIsImZpbGVQYXRoIiwic3RvcFJlY29yZGluZyIsImdldFJlY29yZGluZ1N0YXR1cyIsInRha2VQaG90byIsInNhdmVSZWNvcmRpbmdUb1ZpZGVvIiwic2hhcmVNZWRpYSIsInNob3dWaWRlbyIsImhpZGVWaWRlbyIsInBsYXlWaWRlbyIsInBhdXNlVmlkZW8iLCJzY3J1YlRvIiwiZGVsZXRlVmlkZW8iLCJzYXZlVmlkZW9UbyIsImNsZWFyQW5jaG9ycyJdLCJtYXBwaW5ncyI6Im90QkFBQSxJQUFJQSxFQUF3QyxTQUFVQyxFQUFTQyxFQUFZQyxFQUFHQyxVQUVuRSxVQUFlQyxXQUFVLFNBQVVDLEVBQVNDLGNBQzVCQyxTQUFvQkosRUFBVUssS0FBS0QsVUFBa0JFLEtBQVlBLGVBQ2xFRixTQUFvQkosUUFBbUJJLFVBQWtCRSxLQUFZQSxlQUN6RUMsT0FKSEgsSUFJb0JJLEtBQU9OLEVBQVFLLEVBQU9ILFFBSjFDQSxFQUl5REcsRUFBT0gsTUFKaERBLGFBQWlCTCxFQUFJSyxFQUFRLElB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
