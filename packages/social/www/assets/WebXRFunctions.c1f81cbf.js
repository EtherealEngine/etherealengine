import{E as e,u as d,r as f,a as i,h as y,g as c,A as X}from"./avatarFunctions.c7a0e273.js";import{Q as g,V as l,G as R}from"./three.module.0404e109.js";import{X as p,d as m,F as H,e as I,P as h,N as u}from"./[projectId].d5e44847.js";import{T as v}from"./SystemUpdateType.4e88f289.js";import{X as x}from"./XRHandsInputComponent.9ef816f1.js";import{i as j}from"./addControllerModels.086e1687.js";const F=new g().setFromAxisAngle(new l(0,1,0),Math.PI),b=()=>{const o=e.xrRenderer.getController(0),a=e.xrRenderer.getController(1),r=e.xrRenderer.getControllerGrip(0),n=e.xrRenderer.getControllerGrip(1),t=new R;e.scene.remove(e.camera),t.add(e.camera);const s=new R,C=d();f(C.localClientEntity,I),i(C.localClientEntity,p,{head:s,container:t,controllerLeft:o,controllerRight:a,controllerGripLeft:r,controllerGripRight:n}),S(),m(e.userId,()=>u.setXRMode({userId:e.userId,enabled:!0}))},N=()=>{e.xrSession.end(),e.xrSession=null,e.scene.add(e.camera),i(d().localClientEntity,I,H),f(d().localClientEntity,p),m(e.userId,()=>u.setXRMode({userId:e.userId,enabled:!1}))},S=()=>{const o=d(),a=[e.xrRenderer.getHand(0),e.xrRenderer.getHand(1)];let r=!1;a.forEach(n=>{n.addEventListener("connected",t=>{const s=t.data;!s.hand||n.userData.mesh||(y(o.localClientEntity,x)||i(o.localClientEntity,x,{hands:a}),j(n,s.handedness),r||(m(e.userId,()=>u.xrHandsConnected({userId:e.userId})),r=!0))})})},w=new l;new l;new l(1,1,1);const E=new g,P=(o,a=h.NONE)=>{c(o,X);const r=c(o,v),n=c(o,p);if(n){const t=a===h.LEFT?n.controllerLeft:n.controllerRight;if(t)return t.updateMatrixWorld(!0),{position:t.getWorldPosition(w),rotation:t.getWorldQuaternion(E)}}return{position:w.set(-.35,1,0).applyQuaternion(r.rotation).add(r.position),rotation:E.copy(r.rotation).multiply(F)}};export{N as e,P as g,b as s};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2ViWFJGdW5jdGlvbnMuYzFmODFjYmYuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2VuZ2luZS9zcmMveHIvZnVuY3Rpb25zL1dlYlhSRnVuY3Rpb25zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEVuZ2luZSB9IGZyb20gJy4uLy4uL2Vjcy9jbGFzc2VzL0VuZ2luZSdcbmltcG9ydCB7IEdyb3VwLCBPYmplY3QzRCwgUXVhdGVybmlvbiwgVmVjdG9yMyB9IGZyb20gJ3RocmVlJ1xuaW1wb3J0IHsgRm9sbG93Q2FtZXJhQ29tcG9uZW50LCBGb2xsb3dDYW1lcmFEZWZhdWx0VmFsdWVzIH0gZnJvbSAnLi4vLi4vY2FtZXJhL2NvbXBvbmVudHMvRm9sbG93Q2FtZXJhQ29tcG9uZW50J1xuaW1wb3J0IHsgYWRkQ29tcG9uZW50LCBnZXRDb21wb25lbnQsIGhhc0NvbXBvbmVudCwgcmVtb3ZlQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vZWNzL2Z1bmN0aW9ucy9Db21wb25lbnRGdW5jdGlvbnMnXG5pbXBvcnQgeyBBdmF0YXJDb21wb25lbnQgfSBmcm9tICcuLi8uLi9hdmF0YXIvY29tcG9uZW50cy9BdmF0YXJDb21wb25lbnQnXG5pbXBvcnQgeyBYUklucHV0U291cmNlQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vYXZhdGFyL2NvbXBvbmVudHMvWFJJbnB1dFNvdXJjZUNvbXBvbmVudCdcbmltcG9ydCB7IEVudGl0eSB9IGZyb20gJy4uLy4uL2Vjcy9jbGFzc2VzL0VudGl0eSdcbmltcG9ydCB7IFBhcml0eVZhbHVlIH0gZnJvbSAnLi4vLi4vY29tbW9uL2VudW1zL1Bhcml0eVZhbHVlJ1xuaW1wb3J0IHsgVHJhbnNmb3JtQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vdHJhbnNmb3JtL2NvbXBvbmVudHMvVHJhbnNmb3JtQ29tcG9uZW50J1xuaW1wb3J0IHsgZGlzcGF0Y2hGcm9tIH0gZnJvbSAnLi4vLi4vbmV0d29ya2luZy9mdW5jdGlvbnMvZGlzcGF0Y2hGcm9tJ1xuaW1wb3J0IHsgTmV0d29ya1dvcmxkQWN0aW9uIH0gZnJvbSAnLi4vLi4vbmV0d29ya2luZy9mdW5jdGlvbnMvTmV0d29ya1dvcmxkQWN0aW9uJ1xuaW1wb3J0IHsgdXNlV29ybGQgfSBmcm9tICcuLi8uLi9lY3MvZnVuY3Rpb25zL1N5c3RlbUhvb2tzJ1xuaW1wb3J0IHsgWFJIYW5kc0lucHV0Q29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9YUkhhbmRzSW5wdXRDb21wb25lbnQnXG5pbXBvcnQgeyBpbml0aWFsaXplSGFuZE1vZGVsIH0gZnJvbSAnLi9hZGRDb250cm9sbGVyTW9kZWxzJ1xuXG5jb25zdCByb3RhdGUxODBvblkgPSBuZXcgUXVhdGVybmlvbigpLnNldEZyb21BeGlzQW5nbGUobmV3IFZlY3RvcjMoMCwgMSwgMCksIE1hdGguUEkpXG5cbi8qKlxuICogQGF1dGhvciBKb3NoIEZpZWxkIDxnaXRodWIuY29tL0hleGFGaWVsZD5cbiAqIEByZXR1cm5zIHt2b2lkfVxuICovXG5cbmV4cG9ydCBjb25zdCBzdGFydFdlYlhSID0gKCk6IHZvaWQgPT4ge1xuICBjb25zdCBjb250cm9sbGVyTGVmdCA9IEVuZ2luZS54clJlbmRlcmVyLmdldENvbnRyb2xsZXIoMClcbiAgY29uc3QgY29udHJvbGxlclJpZ2h0ID0gRW5naW5lLnhyUmVuZGVyZXIuZ2V0Q29udHJvbGxlcigxKVxuICBjb25zdCBjb250cm9sbGVyR3JpcExlZnQgPSBFbmdpbmUueHJSZW5kZXJlci5nZXRDb250cm9sbGVyR3JpcCgwKVxuICBjb25zdCBjb250cm9sbGVyR3JpcFJpZ2h0ID0gRW5naW5lLnhyUmVuZGVyZXIuZ2V0Q29udHJvbGxlckdyaXAoMSlcbiAgY29uc3QgY29udGFpbmVyID0gbmV3IEdyb3VwKClcblxuICBFbmdpbmUuc2NlbmUucmVtb3ZlKEVuZ2luZS5jYW1lcmEpXG4gIGNvbnRhaW5lci5hZGQoRW5naW5lLmNhbWVyYSlcbiAgY29uc3QgaGVhZCA9IG5ldyBHcm91cCgpXG5cbiAgY29uc3Qgd29ybGQgPSB1c2VXb3JsZCgpXG5cbiAgcmVtb3ZlQ29tcG9uZW50KHdvcmxkLmxvY2FsQ2xpZW50RW50aXR5LCBGb2xsb3dDYW1lcmFDb21wb25lbnQpXG5cbiAgYWRkQ29tcG9uZW50KHdvcmxkLmxvY2FsQ2xpZW50RW50aXR5LCBYUklucHV0U291cmNlQ29tcG9uZW50LCB7XG4gICAgaGVhZCxcbiAgICBjb250YWluZXIsXG4gICAgY29udHJvbGxlckxlZnQsXG4gICAgY29udHJvbGxlclJpZ2h0LFxuICAgIGNvbnRyb2xsZXJHcmlwTGVmdCxcbiAgICBjb250cm9sbGVyR3JpcFJpZ2h0XG4gIH0pXG5cbiAgYmluZFhSSGFuZEV2ZW50cygpXG4gIGRpc3BhdGNoRnJvbShFbmdpbmUudXNlcklkLCAoKSA9PiBOZXR3b3JrV29ybGRBY3Rpb24uc2V0WFJNb2RlKHsgdXNlcklkOiBFbmdpbmUudXNlcklkLCBlbmFibGVkOiB0cnVlIH0pKVxufVxuXG4vKipcbiAqIEBhdXRob3IgSm9zaCBGaWVsZCA8Z2l0aHViLmNvbS9IZXhhRmllbGQ+XG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuXG5leHBvcnQgY29uc3QgZW5kWFIgPSAoKTogdm9pZCA9PiB7XG4gIEVuZ2luZS54clNlc3Npb24uZW5kKClcbiAgRW5naW5lLnhyU2Vzc2lvbiA9IG51bGwhXG4gIEVuZ2luZS5zY2VuZS5hZGQoRW5naW5lLmNhbWVyYSlcblxuICBhZGRDb21wb25lbnQodXNlV29ybGQoKS5sb2NhbENsaWVudEVudGl0eSwgRm9sbG93Q2FtZXJhQ29tcG9uZW50LCBGb2xsb3dDYW1lcmFEZWZhdWx0VmFsdWVzKVxuICByZW1vdmVDb21wb25lbnQodXNlV29ybGQoKS5sb2NhbENsaWVudEVudGl0eSwgWFJJbnB1dFNvdXJjZUNvbXBvbmVudClcblxuICBkaXNwYXRjaEZyb20oRW5naW5lLnVzZXJJZCwgKCkgPT4gTmV0d29ya1dvcmxkQWN0aW9uLnNldFhSTW9kZSh7IHVzZXJJZDogRW5naW5lLnVzZXJJZCwgZW5hYmxlZDogZmFsc2UgfSkpXG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgWFIgaGFuZCBjb250cm9sbGVycyBmb3IgbG9jYWwgY2xpZW50XG4gKiBAYXV0aG9yIE1vaHNlbiBIZXlkYXJpIDxnaXRodWIuY29tL21vaHNlbmhleWRhcmk+XG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqL1xuXG5leHBvcnQgY29uc3QgYmluZFhSSGFuZEV2ZW50cyA9ICgpID0+IHtcbiAgY29uc3Qgd29ybGQgPSB1c2VXb3JsZCgpXG4gIGNvbnN0IGhhbmRzID0gW0VuZ2luZS54clJlbmRlcmVyLmdldEhhbmQoMCksIEVuZ2luZS54clJlbmRlcmVyLmdldEhhbmQoMSldXG4gIGxldCBldmVudFNlbnQgPSBmYWxzZVxuXG4gIGhhbmRzLmZvckVhY2goKGNvbnRyb2xsZXI6IGFueSkgPT4ge1xuICAgIGNvbnRyb2xsZXIuYWRkRXZlbnRMaXN0ZW5lcignY29ubmVjdGVkJywgKGV2KSA9PiB7XG4gICAgICBjb25zdCB4cklucHV0U291cmNlID0gZXYuZGF0YVxuXG4gICAgICBpZiAoIXhySW5wdXRTb3VyY2UuaGFuZCB8fCBjb250cm9sbGVyLnVzZXJEYXRhLm1lc2gpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmICghaGFzQ29tcG9uZW50KHdvcmxkLmxvY2FsQ2xpZW50RW50aXR5LCBYUkhhbmRzSW5wdXRDb21wb25lbnQpKSB7XG4gICAgICAgIGFkZENvbXBvbmVudCh3b3JsZC5sb2NhbENsaWVudEVudGl0eSwgWFJIYW5kc0lucHV0Q29tcG9uZW50LCB7XG4gICAgICAgICAgaGFuZHNcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgaW5pdGlhbGl6ZUhhbmRNb2RlbChjb250cm9sbGVyLCB4cklucHV0U291cmNlLmhhbmRlZG5lc3MpXG5cbiAgICAgIGlmICghZXZlbnRTZW50KSB7XG4gICAgICAgIGRpc3BhdGNoRnJvbShFbmdpbmUudXNlcklkLCAoKSA9PiBOZXR3b3JrV29ybGRBY3Rpb24ueHJIYW5kc0Nvbm5lY3RlZCh7IHVzZXJJZDogRW5naW5lLnVzZXJJZCB9KSlcbiAgICAgICAgZXZlbnRTZW50ID0gdHJ1ZVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG59XG5cbi8qKlxuICogQGF1dGhvciBKb3NoIEZpZWxkIDxnaXRodWIuY29tL0hleGFGaWVsZD5cbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5cbmV4cG9ydCBjb25zdCBpc0luWFIgPSAoZW50aXR5OiBFbnRpdHkpID0+IHtcbiAgcmV0dXJuIGhhc0NvbXBvbmVudChlbnRpdHksIFhSSW5wdXRTb3VyY2VDb21wb25lbnQpXG59XG5cbmNvbnN0IHZlYzMgPSBuZXcgVmVjdG9yMygpXG5jb25zdCB2MyA9IG5ldyBWZWN0b3IzKClcbmNvbnN0IHVuaWZvcm1TY2FsZSA9IG5ldyBWZWN0b3IzKDEsIDEsIDEpXG5jb25zdCBxdWF0ID0gbmV3IFF1YXRlcm5pb24oKVxuXG4vKipcbiAqIEdldHMgdGhlIGhhbmQgcG9zaXRpb24gaW4gd29ybGQgc3BhY2VcbiAqIEBhdXRob3IgSm9zaCBGaWVsZCA8Z2l0aHViLmNvbS9IZXhhRmllbGQ+XG4gKiBAcGFyYW0gZW50aXR5IHRoZSBwbGF5ZXIgZW50aXR5XG4gKiBAcGFyYW0gaGFuZCB3aGljaCBoYW5kIHRvIGdldFxuICogQHJldHVybnMge1ZlY3RvcjN9XG4gKi9cblxuZXhwb3J0IGNvbnN0IGdldEhhbmRQb3NpdGlvbiA9IChlbnRpdHk6IEVudGl0eSwgaGFuZDogUGFyaXR5VmFsdWUgPSBQYXJpdHlWYWx1ZS5OT05FKTogVmVjdG9yMyA9PiB7XG4gIGNvbnN0IGF2YXRhciA9IGdldENvbXBvbmVudChlbnRpdHksIEF2YXRhckNvbXBvbmVudClcbiAgY29uc3QgdHJhbnNmb3JtID0gZ2V0Q29tcG9uZW50KGVudGl0eSwgVHJhbnNmb3JtQ29tcG9uZW50KVxuICBjb25zdCB4cklucHV0U291cmNlQ29tcG9uZW50ID0gZ2V0Q29tcG9uZW50KGVudGl0eSwgWFJJbnB1dFNvdXJjZUNvbXBvbmVudClcbiAgaWYgKHhySW5wdXRTb3VyY2VDb21wb25lbnQpIHtcbiAgICBjb25zdCByaWdIYW5kOiBPYmplY3QzRCA9XG4gICAgICBoYW5kID09PSBQYXJpdHlWYWx1ZS5MRUZUID8geHJJbnB1dFNvdXJjZUNvbXBvbmVudC5jb250cm9sbGVyTGVmdCA6IHhySW5wdXRTb3VyY2VDb21wb25lbnQuY29udHJvbGxlclJpZ2h0XG4gICAgaWYgKHJpZ0hhbmQpIHtcbiAgICAgIHJpZ0hhbmQudXBkYXRlTWF0cml4V29ybGQodHJ1ZSlcbiAgICAgIHJldHVybiByaWdIYW5kLmdldFdvcmxkUG9zaXRpb24odmVjMylcbiAgICB9XG4gIH1cbiAgLy8gVE9ETzogcmVwbGFjZSAoLTAuNSwgMCwgMCkgd2l0aCBhbmltYXRpb24gaGFuZCBwb3NpdGlvbiBvbmNlIG5ldyBhbmltYXRpb24gcmlnIGlzIGluXG4gIHJldHVybiB2ZWMzLnNldCgtMC4zNSwgMSwgMCkuYXBwbHlRdWF0ZXJuaW9uKHRyYW5zZm9ybS5yb3RhdGlvbikuYWRkKHRyYW5zZm9ybS5wb3NpdGlvbilcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBoYW5kIHJvdGF0aW9uIGluIHdvcmxkIHNwYWNlXG4gKiBAYXV0aG9yIEpvc2ggRmllbGQgPGdpdGh1Yi5jb20vSGV4YUZpZWxkPlxuICogQHBhcmFtIGVudGl0eSB0aGUgcGxheWVyIGVudGl0eVxuICogQHBhcmFtIGhhbmQgd2hpY2ggaGFuZCB0byBnZXRcbiAqIEByZXR1cm5zIHtRdWF0ZXJuaW9ufVxuICovXG5cbmV4cG9ydCBjb25zdCBnZXRIYW5kUm90YXRpb24gPSAoZW50aXR5OiBFbnRpdHksIGhhbmQ6IFBhcml0eVZhbHVlID0gUGFyaXR5VmFsdWUuTk9ORSk6IFF1YXRlcm5pb24gPT4ge1xuICBjb25zdCBhdmF0YXIgPSBnZXRDb21wb25lbnQoZW50aXR5LCBBdmF0YXJDb21wb25lbnQpXG4gIGNvbnN0IHRyYW5zZm9ybSA9IGdldENvbXBvbmVudChlbnRpdHksIFRyYW5zZm9ybUNvbXBvbmVudClcbiAgY29uc3QgeHJJbnB1dFNvdXJjZUNvbXBvbmVudCA9IGdldENvbXBvbmVudChlbnRpdHksIFhSSW5wdXRTb3VyY2VDb21wb25lbnQpXG4gIGlmICh4cklucHV0U291cmNlQ29tcG9uZW50KSB7XG4gICAgY29uc3QgcmlnSGFuZDogT2JqZWN0M0QgPVxuICAgICAgaGFuZCA9PT0gUGFyaXR5VmFsdWUuTEVGVCA/IHhySW5wdXRTb3VyY2VDb21wb25lbnQuY29udHJvbGxlckxlZnQgOiB4cklucHV0U291cmNlQ29tcG9uZW50LmNvbnRyb2xsZXJSaWdodFxuICAgIGlmIChyaWdIYW5kKSB7XG4gICAgICByaWdIYW5kLnVwZGF0ZU1hdHJpeFdvcmxkKHRydWUpXG4gICAgICByZXR1cm4gcmlnSGFuZC5nZXRXb3JsZFF1YXRlcm5pb24ocXVhdClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHF1YXQuY29weSh0cmFuc2Zvcm0ucm90YXRpb24pLm11bHRpcGx5KHJvdGF0ZTE4MG9uWSlcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBoYW5kIHRyYW5zZm9ybSBpbiB3b3JsZCBzcGFjZVxuICogQGF1dGhvciBKb3NoIEZpZWxkIDxnaXRodWIuY29tL0hleGFGaWVsZD5cbiAqIEBwYXJhbSBlbnRpdHkgdGhlIHBsYXllciBlbnRpdHlcbiAqIEBwYXJhbSBoYW5kIHdoaWNoIGhhbmQgdG8gZ2V0XG4gKiBAcmV0dXJucyB7IHBvc2l0aW9uOiBWZWN0b3IzLCByb3RhdGlvbjogUXVhdGVybmlvbiB9XG4gKi9cblxuZXhwb3J0IGNvbnN0IGdldEhhbmRUcmFuc2Zvcm0gPSAoXG4gIGVudGl0eTogRW50aXR5LFxuICBoYW5kOiBQYXJpdHlWYWx1ZSA9IFBhcml0eVZhbHVlLk5PTkVcbik6IHsgcG9zaXRpb246IFZlY3RvcjM7IHJvdGF0aW9uOiBRdWF0ZXJuaW9uIH0gPT4ge1xuICBjb25zdCBhdmF0YXIgPSBnZXRDb21wb25lbnQoZW50aXR5LCBBdmF0YXJDb21wb25lbnQpXG4gIGNvbnN0IHRyYW5zZm9ybSA9IGdldENvbXBvbmVudChlbnRpdHksIFRyYW5zZm9ybUNvbXBvbmVudClcbiAgY29uc3QgeHJJbnB1dFNvdXJjZUNvbXBvbmVudCA9IGdldENvbXBvbmVudChlbnRpdHksIFhSSW5wdXRTb3VyY2VDb21wb25lbnQpXG4gIGlmICh4cklucHV0U291cmNlQ29tcG9uZW50KSB7XG4gICAgY29uc3QgcmlnSGFuZDogT2JqZWN0M0QgPVxuICAgICAgaGFuZCA9PT0gUGFyaXR5VmFsdWUuTEVGVCA/IHhySW5wdXRTb3VyY2VDb21wb25lbnQuY29udHJvbGxlckxlZnQgOiB4cklucHV0U291cmNlQ29tcG9uZW50LmNvbnRyb2xsZXJSaWdodFxuICAgIGlmIChyaWdIYW5kKSB7XG4gICAgICByaWdIYW5kLnVwZGF0ZU1hdHJpeFdvcmxkKHRydWUpXG4gICAgICByZXR1cm4ge1xuICAgICAgICBwb3NpdGlvbjogcmlnSGFuZC5nZXRXb3JsZFBvc2l0aW9uKHZlYzMpLFxuICAgICAgICByb3RhdGlvbjogcmlnSGFuZC5nZXRXb3JsZFF1YXRlcm5pb24ocXVhdClcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICAvLyBUT0RPOiByZXBsYWNlICgtMC41LCAwLCAwKSB3aXRoIGFuaW1hdGlvbiBoYW5kIHBvc2l0aW9uIG9uY2UgbmV3IGFuaW1hdGlvbiByaWcgaXMgaW5cbiAgICBwb3NpdGlvbjogdmVjMy5zZXQoLTAuMzUsIDEsIDApLmFwcGx5UXVhdGVybmlvbih0cmFuc2Zvcm0ucm90YXRpb24pLmFkZCh0cmFuc2Zvcm0ucG9zaXRpb24pLFxuICAgIHJvdGF0aW9uOiBxdWF0LmNvcHkodHJhbnNmb3JtLnJvdGF0aW9uKS5tdWx0aXBseShyb3RhdGUxODBvblkpXG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBoZWFkIHRyYW5zZm9ybSBpbiB3b3JsZCBzcGFjZVxuICogQGF1dGhvciBKb3NoIEZpZWxkIDxnaXRodWIuY29tL0hleGFGaWVsZD5cbiAqIEBwYXJhbSBlbnRpdHkgdGhlIHBsYXllciBlbnRpdHlcbiAqIEByZXR1cm5zIHsgcG9zaXRpb246IFZlY3RvcjMsIHJvdGF0aW9uOiBRdWF0ZXJuaW9uIH1cbiAqL1xuXG5leHBvcnQgY29uc3QgZ2V0SGVhZFRyYW5zZm9ybSA9IChlbnRpdHk6IEVudGl0eSk6IHsgcG9zaXRpb246IFZlY3RvcjM7IHJvdGF0aW9uOiBRdWF0ZXJuaW9uOyBzY2FsZTogVmVjdG9yMyB9ID0+IHtcbiAgY29uc3QgeHJJbnB1dFNvdXJjZUNvbXBvbmVudCA9IGdldENvbXBvbmVudChlbnRpdHksIFhSSW5wdXRTb3VyY2VDb21wb25lbnQpXG4gIGlmICh4cklucHV0U291cmNlQ29tcG9uZW50KSB7XG4gICAgRW5naW5lLmNhbWVyYS5tYXRyaXguZGVjb21wb3NlKHZlYzMsIHF1YXQsIHYzKVxuICAgIHJldHVybiB7XG4gICAgICBwb3NpdGlvbjogdmVjMyxcbiAgICAgIHJvdGF0aW9uOiBxdWF0LFxuICAgICAgc2NhbGU6IHVuaWZvcm1TY2FsZVxuICAgIH1cbiAgfVxuICBjb25zdCBjYW1lcmFUcmFuc2Zvcm0gPSBnZXRDb21wb25lbnQoRW5naW5lLmFjdGl2ZUNhbWVyYUVudGl0eSwgVHJhbnNmb3JtQ29tcG9uZW50KVxuICByZXR1cm4ge1xuICAgIHBvc2l0aW9uOiBjYW1lcmFUcmFuc2Zvcm0ucG9zaXRpb24sXG4gICAgcm90YXRpb246IGNhbWVyYVRyYW5zZm9ybS5yb3RhdGlvbixcbiAgICBzY2FsZTogdW5pZm9ybVNjYWxlXG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiMllBZUEsS0FBTSxHQUFlLEdBQUksS0FBYSxpQkFBaUIsR0FBSSxHQUFRLEVBQUcsRUFBRyxHQUFJLEtBQUssSUFPckUsRUFBYSxJQUFZLE1BQzlCLEdBQWlCLEVBQU8sV0FBVyxjQUFjLEdBQ2pELEVBQWtCLEVBQU8sV0FBVyxjQUFjLEdBQ2xELEVBQXFCLEVBQU8sV0FBVyxrQkFBa0IsR0FDekQsRUFBc0IsRUFBTyxXQUFXLGtCQUFrQixHQUMxRCxFQUFZLEdBQUksS0FFZixNQUFNLE9BQU8sRUFBTyxVQUNqQixJQUFJLEVBQU8sYUFDZixHQUFPLEdBQUksR0FFWCxFQUFRLE1BRUUsRUFBTSxrQkFBbUIsS0FFNUIsRUFBTSxrQkFBbUIsRUFBd0IsQ0FDNUQsT0FDQSxZQUNBLGlCQUNBLGtCQUNBLHFCQUNBLDhCQUlXLEVBQU8sT0FBUSxJQUFNLEVBQW1CLFVBQVUsQ0FBRSxPQUFRLEVBQU8sT0FBUSxRQUFTLE9BUXRGLEVBQVEsSUFBWSxHQUN4QixVQUFVLFFBQ1YsVUFBWSxPQUNaLE1BQU0sSUFBSSxFQUFPLFVBRVgsSUFBVyxrQkFBbUIsRUFBdUIsS0FDbEQsSUFBVyxrQkFBbUIsS0FFakMsRUFBTyxPQUFRLElBQU0sRUFBbUIsVUFBVSxDQUFFLE9BQVEsRUFBTyxPQUFRLFFBQVMsT0FTdEYsRUFBbUIsSUFBTSxNQUM5QixHQUFRLElBQ1IsRUFBUSxDQUFDLEVBQU8sV0FBVyxRQUFRLEdBQUksRUFBTyxXQUFXLFFBQVEsT0FDbkUsR0FBWSxLQUVWLFFBQVEsQUFBQyxHQUFvQixHQUN0QixpQkFBaUIsWUFBYSxBQUFDLEdBQU8sTUFDekMsR0FBZ0IsRUFBRyxLQUVyQixDQUFDLEVBQWMsTUFBUSxFQUFXLFNBQVMsTUFJMUMsR0FBYSxFQUFNLGtCQUFtQixNQUM1QixFQUFNLGtCQUFtQixFQUF1QixDQUMzRCxZQUlnQixFQUFZLEVBQWMsWUFFekMsTUFDVSxFQUFPLE9BQVEsSUFBTSxFQUFtQixpQkFBaUIsQ0FBRSxPQUFRLEVBQU8sWUFDM0UsVUFlZCxFQUFPLEdBQUksR0FDTixHQUFJLEdBQ00sR0FBSSxHQUFRLEVBQUcsRUFBRyxHQUN2QyxLQUFNLEdBQU8sR0FBSSxHQXlESixFQUFtQixDQUM5QixFQUNBLEVBQW9CLEVBQVksT0FDZ0IsQ0FDakMsRUFBYSxFQUFRLFFBQzlCLEdBQVksRUFBYSxFQUFRLEdBQ2pDLEVBQXlCLEVBQWEsRUFBUSxNQUNoRCxFQUF3QixNQUNwQixHQUNKLElBQVMsRUFBWSxLQUFPLEVBQXVCLGVBQWlCLEVBQXVCLG1CQUN6RixXQUNNLGtCQUFrQixJQUNuQixDQUNMLFNBQVUsRUFBUSxpQkFBaUIsR0FDbkMsU0FBVSxFQUFRLG1CQUFtQixVQUlwQyxDQUVMLFNBQVUsRUFBSyxJQUFJLEtBQU8sRUFBRyxHQUFHLGdCQUFnQixFQUFVLFVBQVUsSUFBSSxFQUFVLFVBQ2xGLFNBQVUsRUFBSyxLQUFLLEVBQVUsVUFBVSxTQUFTIn0=
