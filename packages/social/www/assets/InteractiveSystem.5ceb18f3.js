import{ag as E,c2 as q,V as y,ak as A,a3 as z,aq as J,G as K,Q as Y,a9 as Z}from"./three.module.493739a3.js";import{O as l,v as P,i as $,A as oo,w as j,C as V,u as eo,L as to,x as H,y as no,c as so,f as ao,z as ro,e as k}from"./[projectId].a008d20c.js";import{c as G,g as t,h as d,r as g,a as b,d as w,A as io,E as M,b as N}from"./avatarFunctions.6d66cf01.js";import{H as U}from"./HighlightComponent.9014c62c.js";import{T as I}from"./SystemUpdateType.772fc25d.js";import{B}from"./BoundingBoxComponent.a58053fa.js";import{T as L,E as X}from"./tween.esm.78508545.js";import{T as f}from"./TweenComponent.b7ca1b88.js";import"./WebXRFunctions.87bd8924.js";import"./index.7b02be28.js";import"./vendor.475cb2ff.js";import"./_app.f0a72417.js";import"./AuthService.e8999ddc.js";import"./AlertService.5d8abaff.js";import"./feathers.32f4d4e8.js";import"./index.81138b53.js";import"./upload.bd537b46.js";import"./XRHandsInputComponent.3d76e9a2.js";import"./addControllerModels.14512c2e.js";const F=G("InteractiveFocusedComponent"),Q=G("SubFocusedComponent"),co=(o,c)=>{const e=t(o,I),{value:p}=t(o,l);let m=0;const a=t(c,B);if(a)a.box.getCenter(e.position),m=a.box.max.y;else{const r=t(c,l).value;e.position.copy(r.position),r.geometry&&(m=r.geometry.boundingBox?.max.y??0)}d(o,f)&&(t(o,f).tween.stop(),g(o,f)),p.visible=!0,b(o,f,{tween:new L(e).to({position:{y:m+.5},scale:{x:1,y:1,z:1}},1500).easing(X.Exponential.Out).start().onComplete(()=>{g(o,f)})})},mo=o=>{const c=t(o,I),{value:e}=t(o,l);d(o,f)&&(t(o,f).tween.stop(),g(o,f)),b(o,f,{tween:new L(c).to({position:{y:c.position.y-.5},scale:{x:0,y:0,z:0}},1500).easing(X.Exponential.In).start().onComplete(()=>{e.visible=!1,g(o,f)})})},po=2,_=new E,uo=new E().makePerspective(-.1,.1,-.1,.1,.1,2),R=new q;new y;const lo=(o,c)=>{const e=t(o,P);if(!$(o)){e.subFocusedArray=[],e.focusedInteractive=null;return}const p=t(o,I);if(!t(o,oo)||!c.length)return;e.frustumCamera.updateMatrixWorld(),e.frustumCamera.matrixWorldInverse.copy(e.frustumCamera.matrixWorld).invert(),_.multiplyMatrices(uo,e.frustumCamera.matrixWorldInverse),R.setFromProjectionMatrix(_);const a=c.map(s=>{const C=t(s,B);if(!C.box)return[s,!1,0];if(C.dynamic){const O=t(s,l),v=new A;return v.copy(C.box),v.applyMatrix4(O.value.matrixWorld),[s,R.intersectsBox(v),v.distanceToPoint(p.position)]}else return[s,R.intersectsBox(C.box),C.box.distanceToPoint(p.position)]}).filter(s=>s[1]);if(!a.length){e.subFocusedArray=[],e.focusedInteractive=null;return}e.subFocusedArray=a.map(s=>[t(s[0],l).value,s[3]]);const[r,h,S]=a.sort((s,C)=>s[2]-C[2])[0],T=t(r,j).data?.interactionDistance??po;S<T&&(e.focusedInteractive=r)},fo=o=>{const c=d(o,V)&&eo(t(o,V).body),e=b(o,B,{dynamic:c,box:new A}),p=t(o,l).value,m=t(o,I);p.position.copy(m.position),p.rotation.setFromQuaternion(m.rotation),e.dynamic||p.updateMatrixWorld();let a=!1;p.traverse(r=>{if(r instanceof z){r.geometry.boundingBox||r.geometry.computeBoundingBox();const h=new A().copy(r.geometry.boundingBox);e.dynamic||h.applyMatrix4(r.matrixWorld),a?e.box.union(h):(e.box.copy(h),a=!0)}}),a||(e.box=new A(new y(-.05,-.05,-.05).add(m.position),new y(.05,.05,.05).add(m.position)))},bo=new y(0,1,0);async function Ro(o){const c=w([P]),e=w([j]),p=w([B]),m=w([j,F]),a=w([j,Q]),r=w([to,io]),h=w([H]),S=no.instance.create3dText("INTERACT",new y(.8,1,.2)),D=.1,T=new z(S,new J({color:13938487,emissive:13938487,emissiveIntensity:1}));T.scale.setScalar(D);const x=so(),s=new K().add(T);return b(x,l,{value:s}),M.scene.add(s),b(x,ao,{}),b(x,I,{position:new y,rotation:new Y,scale:new y(1,1,1)}).scale.setScalar(0),s.visible=!1,()=>{const{elapsedTime:O}=o;for(const n of e.enter(o))!d(n,B)&&d(n,l)&&fo(n);const v=e(o);for(const n of c(o))if(v.length){lo(n,p(o));const i=t(n,P);i.focusedInteractive&&(d(i.focusedInteractive,F)||b(i.focusedInteractive,F,{interacts:n}));for(const u of v)u!==i.focusedInteractive&&d(u,F)&&g(u,F),i.subFocusedArray.some(W=>W[0].entity===u)?d(u,Q)||b(u,Q,{subInteracts:u}):g(u,Q)}for(const n of m.exit())mo(x);for(const n of m.enter())co(x,n);for(const n of a.enter())b(n,U,{color:16711680,hiddenColor:255,edgeStrength:1});for(const n of a.exit())g(n,U);for(const n of h.enter()){const i=t(n,j);d(n,ro)?t(n,l).value?.toggle():N.instance.dispatchEvent({type:N.EVENTS.OBJECT_ACTIVATION,...i.data}),g(n,H)}for(const n of r()){const i=t(x,l).value;if(!!i.visible)if(i.children[0].position.y=Math.sin(O*1.8)*.05,M.activeCameraFollowTarget&&d(M.activeCameraFollowTarget,k))i.children[0].setRotationFromAxisAngle(bo,Z.degToRad(t(M.activeCameraFollowTarget,k).theta));else{const{x:u,z:W}=t(n,I).position;i.lookAt(u,i.position.y,W)}}}}export{Ro as default};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3RpdmVTeXN0ZW0uNWNlYjE4ZjMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2VuZ2luZS9zcmMvaW50ZXJhY3Rpb24vY29tcG9uZW50cy9JbnRlcmFjdGl2ZUZvY3VzZWRDb21wb25lbnQudHMiLCIuLi8uLi8uLi9lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2NvbXBvbmVudHMvU3ViRm9jdXNlZENvbXBvbmVudC50cyIsIi4uLy4uLy4uL2VuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZnVuY3Rpb25zL2ludGVyYWN0VGV4dC50cyIsIi4uLy4uLy4uL2VuZ2luZS9zcmMvYXZhdGFyL2Z1bmN0aW9ucy9nZXRJbnRlcmFjdGl2ZUlzSW5SZWFjaERpc3RhbmNlLnRzIiwiLi4vLi4vLi4vZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9mdW5jdGlvbnMvaW50ZXJhY3RCb3hSYXljYXN0LnRzIiwiLi4vLi4vLi4vZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9mdW5jdGlvbnMvY3JlYXRlQm94Q29tcG9uZW50LnRzIiwiLi4vLi4vLi4vZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9zeXN0ZW1zL0ludGVyYWN0aXZlU3lzdGVtLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEVudGl0eSB9IGZyb20gJy4uLy4uL2Vjcy9jbGFzc2VzL0VudGl0eSdcbmltcG9ydCB7IGNyZWF0ZU1hcHBlZENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2Vjcy9mdW5jdGlvbnMvQ29tcG9uZW50RnVuY3Rpb25zJ1xuXG5leHBvcnQgdHlwZSBJbnRlcmFjdGl2ZUZvY3VzZWRDb21wb25lbnRUeXBlID0ge1xuICBpbnRlcmFjdHM6IEVudGl0eVxufVxuXG5leHBvcnQgY29uc3QgSW50ZXJhY3RpdmVGb2N1c2VkQ29tcG9uZW50ID1cbiAgY3JlYXRlTWFwcGVkQ29tcG9uZW50PEludGVyYWN0aXZlRm9jdXNlZENvbXBvbmVudFR5cGU+KCdJbnRlcmFjdGl2ZUZvY3VzZWRDb21wb25lbnQnKVxuIiwiaW1wb3J0IHsgRW50aXR5IH0gZnJvbSAnLi4vLi4vZWNzL2NsYXNzZXMvRW50aXR5J1xuaW1wb3J0IHsgY3JlYXRlTWFwcGVkQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vZWNzL2Z1bmN0aW9ucy9Db21wb25lbnRGdW5jdGlvbnMnXG5cbi8qKlxuICogQGF1dGhvciBIeWRyYUZpcmUgPGdpdGh1Yi5jb20vSHlkcmFGaXJlPlxuICovXG5cbmV4cG9ydCB0eXBlIFN1YkZvY3VzZWRUeXBlID0ge1xuICBzdWJJbnRlcmFjdHM6IEVudGl0eVxufVxuXG5leHBvcnQgY29uc3QgU3ViRm9jdXNlZENvbXBvbmVudCA9IGNyZWF0ZU1hcHBlZENvbXBvbmVudDxTdWJGb2N1c2VkVHlwZT4oJ1N1YkZvY3VzZWRDb21wb25lbnQnKVxuIiwiaW1wb3J0IHsgRWFzaW5nLCBUd2VlbiB9IGZyb20gJ0B0d2VlbmpzL3R3ZWVuLmpzJ1xuaW1wb3J0IHsgTWVzaCB9IGZyb20gJ3RocmVlJ1xuaW1wb3J0IHsgRW50aXR5IH0gZnJvbSAnLi4vLi4vZWNzL2NsYXNzZXMvRW50aXR5J1xuaW1wb3J0IHsgYWRkQ29tcG9uZW50LCBnZXRDb21wb25lbnQsIGhhc0NvbXBvbmVudCwgcmVtb3ZlQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vZWNzL2Z1bmN0aW9ucy9Db21wb25lbnRGdW5jdGlvbnMnXG5pbXBvcnQgeyBPYmplY3QzRENvbXBvbmVudCB9IGZyb20gJy4uLy4uL3NjZW5lL2NvbXBvbmVudHMvT2JqZWN0M0RDb21wb25lbnQnXG5pbXBvcnQgeyBUcmFuc2Zvcm1Db21wb25lbnQgfSBmcm9tICcuLi8uLi90cmFuc2Zvcm0vY29tcG9uZW50cy9UcmFuc2Zvcm1Db21wb25lbnQnXG5pbXBvcnQgeyBUd2VlbkNvbXBvbmVudCB9IGZyb20gJy4uLy4uL3RyYW5zZm9ybS9jb21wb25lbnRzL1R3ZWVuQ29tcG9uZW50J1xuaW1wb3J0IHsgQm91bmRpbmdCb3hDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL0JvdW5kaW5nQm94Q29tcG9uZW50J1xuXG5leHBvcnQgY29uc3Qgc2hvd0ludGVyYWN0VGV4dCA9IChpbnRlcmFjdFRleHRFbnRpdHk6IEVudGl0eSwgZm9jdXNFbnRpdHk6IEVudGl0eSkgPT4ge1xuICBjb25zdCB0cmFuc2Zvcm0gPSBnZXRDb21wb25lbnQoaW50ZXJhY3RUZXh0RW50aXR5LCBUcmFuc2Zvcm1Db21wb25lbnQpXG4gIGNvbnN0IHsgdmFsdWUgfSA9IGdldENvbXBvbmVudChpbnRlcmFjdFRleHRFbnRpdHksIE9iamVjdDNEQ29tcG9uZW50KVxuICBsZXQgeVRhcmdldCA9IDBcblxuICBjb25zdCBiYiA9IGdldENvbXBvbmVudChmb2N1c0VudGl0eSwgQm91bmRpbmdCb3hDb21wb25lbnQpXG4gIGlmIChiYikge1xuICAgIGJiLmJveC5nZXRDZW50ZXIodHJhbnNmb3JtLnBvc2l0aW9uKVxuICAgIHlUYXJnZXQgPSBiYi5ib3gubWF4LnlcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBvYmozZCA9IGdldENvbXBvbmVudChmb2N1c0VudGl0eSwgT2JqZWN0M0RDb21wb25lbnQpLnZhbHVlIGFzIE1lc2hcbiAgICB0cmFuc2Zvcm0ucG9zaXRpb24uY29weShvYmozZC5wb3NpdGlvbilcbiAgICBpZiAob2JqM2QuZ2VvbWV0cnkpIHtcbiAgICAgIHlUYXJnZXQgPSBvYmozZC5nZW9tZXRyeS5ib3VuZGluZ0JveD8ubWF4LnkgPz8gMFxuICAgIH1cbiAgfVxuXG4gIGlmIChoYXNDb21wb25lbnQoaW50ZXJhY3RUZXh0RW50aXR5LCBUd2VlbkNvbXBvbmVudCkpIHtcbiAgICBnZXRDb21wb25lbnQoaW50ZXJhY3RUZXh0RW50aXR5LCBUd2VlbkNvbXBvbmVudCkudHdlZW4uc3RvcCgpIC8vIGRvZXNuJ3QgdHJpZ2dlciBvbkNvbXBsZXRlXG4gICAgcmVtb3ZlQ29tcG9uZW50KGludGVyYWN0VGV4dEVudGl0eSwgVHdlZW5Db21wb25lbnQpXG4gIH1cbiAgdmFsdWUudmlzaWJsZSA9IHRydWVcblxuICBhZGRDb21wb25lbnQoaW50ZXJhY3RUZXh0RW50aXR5LCBUd2VlbkNvbXBvbmVudCwge1xuICAgIHR3ZWVuOiBuZXcgVHdlZW48YW55Pih0cmFuc2Zvcm0pXG4gICAgICAudG8oXG4gICAgICAgIHtcbiAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgeTogeVRhcmdldCArIDAuNVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc2NhbGU6IHtcbiAgICAgICAgICAgIHg6IDEsXG4gICAgICAgICAgICB5OiAxLFxuICAgICAgICAgICAgejogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgMTUwMFxuICAgICAgKVxuICAgICAgLmVhc2luZyhFYXNpbmcuRXhwb25lbnRpYWwuT3V0KVxuICAgICAgLnN0YXJ0KClcbiAgICAgIC5vbkNvbXBsZXRlKCgpID0+IHtcbiAgICAgICAgcmVtb3ZlQ29tcG9uZW50KGludGVyYWN0VGV4dEVudGl0eSwgVHdlZW5Db21wb25lbnQpXG4gICAgICB9KVxuICB9KVxufVxuXG5leHBvcnQgY29uc3QgaGlkZUludGVyYWN0VGV4dCA9IChpbnRlcmFjdFRleHRFbnRpdHk6IEVudGl0eSkgPT4ge1xuICBjb25zdCB0cmFuc2Zvcm0gPSBnZXRDb21wb25lbnQoaW50ZXJhY3RUZXh0RW50aXR5LCBUcmFuc2Zvcm1Db21wb25lbnQpXG4gIGNvbnN0IHsgdmFsdWUgfSA9IGdldENvbXBvbmVudChpbnRlcmFjdFRleHRFbnRpdHksIE9iamVjdDNEQ29tcG9uZW50KVxuXG4gIGlmIChoYXNDb21wb25lbnQoaW50ZXJhY3RUZXh0RW50aXR5LCBUd2VlbkNvbXBvbmVudCkpIHtcbiAgICBnZXRDb21wb25lbnQoaW50ZXJhY3RUZXh0RW50aXR5LCBUd2VlbkNvbXBvbmVudCkudHdlZW4uc3RvcCgpIC8vIGRvZXNuJ3QgdHJpZ2dlciBvbkNvbXBsZXRlXG4gICAgcmVtb3ZlQ29tcG9uZW50KGludGVyYWN0VGV4dEVudGl0eSwgVHdlZW5Db21wb25lbnQpXG4gIH1cblxuICBhZGRDb21wb25lbnQoaW50ZXJhY3RUZXh0RW50aXR5LCBUd2VlbkNvbXBvbmVudCwge1xuICAgIHR3ZWVuOiBuZXcgVHdlZW48YW55Pih0cmFuc2Zvcm0pXG4gICAgICAudG8oXG4gICAgICAgIHtcbiAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgeTogdHJhbnNmb3JtLnBvc2l0aW9uLnkgLSAwLjVcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNjYWxlOiB7XG4gICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgIHo6IDBcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIDE1MDBcbiAgICAgIClcbiAgICAgIC5lYXNpbmcoRWFzaW5nLkV4cG9uZW50aWFsLkluKVxuICAgICAgLnN0YXJ0KClcbiAgICAgIC5vbkNvbXBsZXRlKCgpID0+IHtcbiAgICAgICAgdmFsdWUudmlzaWJsZSA9IGZhbHNlXG4gICAgICAgIHJlbW92ZUNvbXBvbmVudChpbnRlcmFjdFRleHRFbnRpdHksIFR3ZWVuQ29tcG9uZW50KVxuICAgICAgfSlcbiAgfSlcbn1cbiIsImltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICd0aHJlZSdcbmltcG9ydCB7IFBhcml0eVZhbHVlIH0gZnJvbSAnLi4vLi4vY29tbW9uL2VudW1zL1Bhcml0eVZhbHVlJ1xuaW1wb3J0IHsgRW50aXR5IH0gZnJvbSAnLi4vLi4vZWNzL2NsYXNzZXMvRW50aXR5J1xuaW1wb3J0IHsgZ2V0Q29tcG9uZW50IH0gZnJvbSAnLi4vLi4vZWNzL2Z1bmN0aW9ucy9Db21wb25lbnRGdW5jdGlvbnMnXG5pbXBvcnQgeyBUcmFuc2Zvcm1Db21wb25lbnQgfSBmcm9tICcuLi8uLi90cmFuc2Zvcm0vY29tcG9uZW50cy9UcmFuc2Zvcm1Db21wb25lbnQnXG5pbXBvcnQgeyBnZXRIYW5kUG9zaXRpb24sIGlzSW5YUiB9IGZyb20gJy4uLy4uL3hyL2Z1bmN0aW9ucy9XZWJYUkZ1bmN0aW9ucydcblxuZXhwb3J0IGNvbnN0IGludGVyYWN0aXZlUmVhY2hEaXN0YW5jZSA9IDJcbmV4cG9ydCBjb25zdCBpbnRlcmFjdGl2ZVJlYWNoRGlzdGFuY2VWUiA9IDJcblxuZXhwb3J0IGNvbnN0IGdldEludGVyYWN0aXZlSXNJblJlYWNoRGlzdGFuY2UgPSAoXG4gIGVudGl0eVVzZXI6IEVudGl0eSxcbiAgaW50ZXJhY3RpdmVQb3NpdGlvbjogVmVjdG9yMyxcbiAgc2lkZTogUGFyaXR5VmFsdWVcbik6IGJvb2xlYW4gPT4ge1xuICBpZiAoaXNJblhSKGVudGl0eVVzZXIpKSB7XG4gICAgaWYgKHNpZGUgPT09IFBhcml0eVZhbHVlLkxFRlQpIHtcbiAgICAgIGNvbnN0IGxlZnRIYW5kUG9zaXRpb24gPSBnZXRIYW5kUG9zaXRpb24oZW50aXR5VXNlciwgUGFyaXR5VmFsdWUuTEVGVClcbiAgICAgIGlmIChsZWZ0SGFuZFBvc2l0aW9uKSB7XG4gICAgICAgIHJldHVybiBsZWZ0SGFuZFBvc2l0aW9uLmRpc3RhbmNlVG8oaW50ZXJhY3RpdmVQb3NpdGlvbikgPCBpbnRlcmFjdGl2ZVJlYWNoRGlzdGFuY2VWUlxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByaWdodEhhbmRQb3NpdGlvbiA9IGdldEhhbmRQb3NpdGlvbihlbnRpdHlVc2VyLCBQYXJpdHlWYWx1ZS5SSUdIVClcbiAgICAgIGlmIChyaWdodEhhbmRQb3NpdGlvbikge1xuICAgICAgICByZXR1cm4gcmlnaHRIYW5kUG9zaXRpb24uZGlzdGFuY2VUbyhpbnRlcmFjdGl2ZVBvc2l0aW9uKSA8IGludGVyYWN0aXZlUmVhY2hEaXN0YW5jZVZSXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHVzZXJQb3NpdGlvbiA9IGdldENvbXBvbmVudChlbnRpdHlVc2VyLCBUcmFuc2Zvcm1Db21wb25lbnQpLnBvc2l0aW9uXG4gICAgaWYgKHVzZXJQb3NpdGlvbi5kaXN0YW5jZVRvKGludGVyYWN0aXZlUG9zaXRpb24pIDwgaW50ZXJhY3RpdmVSZWFjaERpc3RhbmNlKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cbiIsImltcG9ydCB7IEJveDMsIEZydXN0dW0sIE1hdHJpeDQsIFZlY3RvcjMgfSBmcm9tICd0aHJlZSdcbmltcG9ydCB7IEVudGl0eSB9IGZyb20gJy4uLy4uL2Vjcy9jbGFzc2VzL0VudGl0eSdcbmltcG9ydCB7IGdldENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2Vjcy9mdW5jdGlvbnMvQ29tcG9uZW50RnVuY3Rpb25zJ1xuaW1wb3J0IHsgT2JqZWN0M0RDb21wb25lbnQgfSBmcm9tICcuLi8uLi9zY2VuZS9jb21wb25lbnRzL09iamVjdDNEQ29tcG9uZW50J1xuaW1wb3J0IHsgQXZhdGFyQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vYXZhdGFyL2NvbXBvbmVudHMvQXZhdGFyQ29tcG9uZW50J1xuaW1wb3J0IHsgVHJhbnNmb3JtQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vdHJhbnNmb3JtL2NvbXBvbmVudHMvVHJhbnNmb3JtQ29tcG9uZW50J1xuaW1wb3J0IHsgQm91bmRpbmdCb3hDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL0JvdW5kaW5nQm94Q29tcG9uZW50J1xuaW1wb3J0IHsgSW50ZXJhY3RhYmxlQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9JbnRlcmFjdGFibGVDb21wb25lbnQnXG5pbXBvcnQgeyBJbnRlcmFjdG9yQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9JbnRlcmFjdG9yQ29tcG9uZW50J1xuaW1wb3J0IHsgaW50ZXJhY3RpdmVSZWFjaERpc3RhbmNlIH0gZnJvbSAnLi4vLi4vYXZhdGFyL2Z1bmN0aW9ucy9nZXRJbnRlcmFjdGl2ZUlzSW5SZWFjaERpc3RhbmNlJ1xuaW1wb3J0IHsgaXNFbnRpdHlMb2NhbENsaWVudCB9IGZyb20gJy4uLy4uL25ldHdvcmtpbmcvZnVuY3Rpb25zL2lzRW50aXR5TG9jYWxDbGllbnQnXG5pbXBvcnQgeyBBdmF0YXJDb250cm9sbGVyQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vYXZhdGFyL2NvbXBvbmVudHMvQXZhdGFyQ29udHJvbGxlckNvbXBvbmVudCdcblxuY29uc3QgbWF0NCA9IG5ldyBNYXRyaXg0KClcbmNvbnN0IHByb2plY3Rpb25NYXRyaXggPSBuZXcgTWF0cml4NCgpLm1ha2VQZXJzcGVjdGl2ZShcbiAgLTAuMSwgLy8geDFcbiAgMC4xLCAvLyB4MlxuICAtMC4xLCAvLyB5MVxuICAwLjEsIC8vIHkyXG4gIDAuMSwgLy8gbmVhclxuICAyIC8vIGZhclxuKVxuY29uc3QgZnJ1c3R1bSA9IG5ldyBGcnVzdHVtKClcbmNvbnN0IHZlYzMgPSBuZXcgVmVjdG9yMygpXG5cbnR5cGUgUmF5Y2FzdFJlc3VsdCA9IFtFbnRpdHksIGJvb2xlYW4sIG51bWJlcj8sIG51bWJlcj9dXG5cbi8qKlxuICogQ2hlY2tzIGlmIGVudGl0eSBjYW4gaW50ZXJhY3Qgd2l0aCBhbnkgb2YgZW50aXRpZXMgbGlzdGVkIGluICdpbnRlcmFjdGl2ZScgYXJyYXksIGNoZWNraW5nIGRpc3RhbmNlLCBndWFyZHMgYW5kIHJheWNhc3RcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHlcbiAqIEBwYXJhbSB7RW50aXR5W119IHJheWNhc3RMaXN0XG4gKi9cblxuZXhwb3J0IGNvbnN0IGludGVyYWN0Qm94UmF5Y2FzdCA9IChlbnRpdHk6IEVudGl0eSwgcmF5Y2FzdExpc3Q6IEVudGl0eVtdKTogdm9pZCA9PiB7XG4gIGNvbnN0IGludGVyYWN0cyA9IGdldENvbXBvbmVudChlbnRpdHksIEludGVyYWN0b3JDb21wb25lbnQpXG4gIGlmICghaXNFbnRpdHlMb2NhbENsaWVudChlbnRpdHkpKSB7XG4gICAgaW50ZXJhY3RzLnN1YkZvY3VzZWRBcnJheSA9IFtdXG4gICAgaW50ZXJhY3RzLmZvY3VzZWRJbnRlcmFjdGl2ZSA9IG51bGwhXG4gICAgcmV0dXJuXG4gIH1cblxuICBjb25zdCB0cmFuc2Zvcm0gPSBnZXRDb21wb25lbnQoZW50aXR5LCBUcmFuc2Zvcm1Db21wb25lbnQpXG4gIGNvbnN0IGNvbnRyb2xsZXIgPSBnZXRDb21wb25lbnQoZW50aXR5LCBBdmF0YXJDb250cm9sbGVyQ29tcG9uZW50KVxuXG4gIGlmICghY29udHJvbGxlcikgcmV0dXJuXG5cbiAgaWYgKCFyYXljYXN0TGlzdC5sZW5ndGgpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGludGVyYWN0cy5mcnVzdHVtQ2FtZXJhLnVwZGF0ZU1hdHJpeFdvcmxkKClcbiAgaW50ZXJhY3RzLmZydXN0dW1DYW1lcmEubWF0cml4V29ybGRJbnZlcnNlLmNvcHkoaW50ZXJhY3RzLmZydXN0dW1DYW1lcmEubWF0cml4V29ybGQpLmludmVydCgpXG5cbiAgbWF0NC5tdWx0aXBseU1hdHJpY2VzKHByb2plY3Rpb25NYXRyaXgsIGludGVyYWN0cy5mcnVzdHVtQ2FtZXJhLm1hdHJpeFdvcmxkSW52ZXJzZSlcbiAgZnJ1c3R1bS5zZXRGcm9tUHJvamVjdGlvbk1hdHJpeChtYXQ0KVxuXG4gIGNvbnN0IHN1YkZvY3VzZWRBcnJheSA9IHJheWNhc3RMaXN0XG4gICAgLm1hcCgoZW50aXR5SW4pOiBSYXljYXN0UmVzdWx0ID0+IHtcbiAgICAgIGNvbnN0IGJvdW5kaW5nQm94ID0gZ2V0Q29tcG9uZW50KGVudGl0eUluLCBCb3VuZGluZ0JveENvbXBvbmVudClcbiAgICAgIGlmICghYm91bmRpbmdCb3guYm94KSB7XG4gICAgICAgIHJldHVybiBbZW50aXR5SW4sIGZhbHNlLCAwXVxuICAgICAgfVxuICAgICAgaWYgKGJvdW5kaW5nQm94LmR5bmFtaWMpIHtcbiAgICAgICAgY29uc3Qgb2JqZWN0M0QgPSBnZXRDb21wb25lbnQoZW50aXR5SW4sIE9iamVjdDNEQ29tcG9uZW50KVxuICAgICAgICBjb25zdCBhYWJiID0gbmV3IEJveDMoKVxuICAgICAgICBhYWJiLmNvcHkoYm91bmRpbmdCb3guYm94KVxuICAgICAgICBhYWJiLmFwcGx5TWF0cml4NChvYmplY3QzRC52YWx1ZS5tYXRyaXhXb3JsZClcbiAgICAgICAgcmV0dXJuIFtlbnRpdHlJbiwgZnJ1c3R1bS5pbnRlcnNlY3RzQm94KGFhYmIpLCBhYWJiLmRpc3RhbmNlVG9Qb2ludCh0cmFuc2Zvcm0ucG9zaXRpb24pXVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFtlbnRpdHlJbiwgZnJ1c3R1bS5pbnRlcnNlY3RzQm94KGJvdW5kaW5nQm94LmJveCksIGJvdW5kaW5nQm94LmJveC5kaXN0YW5jZVRvUG9pbnQodHJhbnNmb3JtLnBvc2l0aW9uKV1cbiAgICAgIH1cbiAgICB9KVxuICAgIC5maWx0ZXIoKHZhbHVlKSA9PiB2YWx1ZVsxXSlcblxuICBpZiAoIXN1YkZvY3VzZWRBcnJheS5sZW5ndGgpIHtcbiAgICBpbnRlcmFjdHMuc3ViRm9jdXNlZEFycmF5ID0gW11cbiAgICBpbnRlcmFjdHMuZm9jdXNlZEludGVyYWN0aXZlID0gbnVsbCFcbiAgICByZXR1cm5cbiAgfVxuXG4gIGludGVyYWN0cy5zdWJGb2N1c2VkQXJyYXkgPSBzdWJGb2N1c2VkQXJyYXkubWFwKCh2OiBhbnkpID0+IFtnZXRDb21wb25lbnQodlswXSwgT2JqZWN0M0RDb21wb25lbnQpLnZhbHVlLCB2WzNdXSlcblxuICBjb25zdCBbZW50aXR5SW50ZXJhY3RhYmxlLCBkb2VzSW50ZXJzZWN0RnJ1c3RydW0sIGRpc3RhbmNlVG9QbGF5ZXJdID0gc3ViRm9jdXNlZEFycmF5LnNvcnQoXG4gICAgKGE6IGFueSwgYjogYW55KSA9PiBhWzJdIC0gYlsyXVxuICApWzBdXG5cbiAgY29uc3QgaW50ZXJhY3RhYmxlID0gZ2V0Q29tcG9uZW50KGVudGl0eUludGVyYWN0YWJsZSwgSW50ZXJhY3RhYmxlQ29tcG9uZW50KVxuICBjb25zdCBkaXN0YW5jZSA9IGludGVyYWN0YWJsZS5kYXRhPy5pbnRlcmFjdGlvbkRpc3RhbmNlID8/IGludGVyYWN0aXZlUmVhY2hEaXN0YW5jZVxuXG4gIGNvbnN0IHJlc3VsdElzQ2xvc2VFbm91Z2ggPSBkaXN0YW5jZVRvUGxheWVyISA8IGRpc3RhbmNlXG4gIGlmIChyZXN1bHRJc0Nsb3NlRW5vdWdoKSB7XG4gICAgaW50ZXJhY3RzLmZvY3VzZWRJbnRlcmFjdGl2ZSA9IGVudGl0eUludGVyYWN0YWJsZVxuICB9XG59XG4iLCJpbXBvcnQgeyBCb3gzLCBNZXNoLCBWZWN0b3IzIH0gZnJvbSAndGhyZWUnXG5pbXBvcnQgeyBFbnRpdHkgfSBmcm9tICcuLi8uLi9lY3MvY2xhc3Nlcy9FbnRpdHknXG5pbXBvcnQgeyBhZGRDb21wb25lbnQsIGdldENvbXBvbmVudCwgaGFzQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vZWNzL2Z1bmN0aW9ucy9Db21wb25lbnRGdW5jdGlvbnMnXG5pbXBvcnQgeyBpc0R5bmFtaWNCb2R5LCBpc1N0YXRpY0JvZHkgfSBmcm9tICcuLi8uLi9waHlzaWNzL2NsYXNzZXMvUGh5c2ljcydcbmltcG9ydCB7IENvbGxpZGVyQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vcGh5c2ljcy9jb21wb25lbnRzL0NvbGxpZGVyQ29tcG9uZW50J1xuaW1wb3J0IHsgT2JqZWN0M0RDb21wb25lbnQgfSBmcm9tICcuLi8uLi9zY2VuZS9jb21wb25lbnRzL09iamVjdDNEQ29tcG9uZW50J1xuaW1wb3J0IHsgVHJhbnNmb3JtQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vdHJhbnNmb3JtL2NvbXBvbmVudHMvVHJhbnNmb3JtQ29tcG9uZW50J1xuaW1wb3J0IHsgQm91bmRpbmdCb3hDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL0JvdW5kaW5nQm94Q29tcG9uZW50J1xuXG5leHBvcnQgY29uc3QgY3JlYXRlQm94Q29tcG9uZW50ID0gKGVudGl0eTogRW50aXR5KSA9PiB7XG4gIGNvbnN0IGR5bmFtaWMgPSBoYXNDb21wb25lbnQoZW50aXR5LCBDb2xsaWRlckNvbXBvbmVudCkgJiYgaXNEeW5hbWljQm9keShnZXRDb21wb25lbnQoZW50aXR5LCBDb2xsaWRlckNvbXBvbmVudCkuYm9keSlcblxuICBjb25zdCBjYWxjQm91bmRpbmdCb3ggPSBhZGRDb21wb25lbnQoZW50aXR5LCBCb3VuZGluZ0JveENvbXBvbmVudCwgeyBkeW5hbWljLCBib3g6IG5ldyBCb3gzKCkgfSlcblxuICBjb25zdCBvYmplY3QzRCA9IGdldENvbXBvbmVudChlbnRpdHksIE9iamVjdDNEQ29tcG9uZW50KS52YWx1ZVxuICBjb25zdCB0cmFuc2Zvcm0gPSBnZXRDb21wb25lbnQoZW50aXR5LCBUcmFuc2Zvcm1Db21wb25lbnQpXG5cbiAgb2JqZWN0M0QucG9zaXRpb24uY29weSh0cmFuc2Zvcm0ucG9zaXRpb24pXG4gIG9iamVjdDNELnJvdGF0aW9uLnNldEZyb21RdWF0ZXJuaW9uKHRyYW5zZm9ybS5yb3RhdGlvbilcbiAgaWYgKCFjYWxjQm91bmRpbmdCb3guZHluYW1pYykgb2JqZWN0M0QudXBkYXRlTWF0cml4V29ybGQoKVxuXG4gIGxldCBoYXNCb3hFeHBhbmRlZCA9IGZhbHNlXG5cbiAgLy8gZXhwYW5kIGJvdW5kaW5nIGJveCB0b1xuICBvYmplY3QzRC50cmF2ZXJzZSgob2JqM2Q6IE1lc2gpID0+IHtcbiAgICBpZiAob2JqM2QgaW5zdGFuY2VvZiBNZXNoKSB7XG4gICAgICBpZiAoIW9iajNkLmdlb21ldHJ5LmJvdW5kaW5nQm94KSBvYmozZC5nZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKVxuICAgICAgY29uc3QgYWFiYiA9IG5ldyBCb3gzKCkuY29weShvYmozZC5nZW9tZXRyeS5ib3VuZGluZ0JveCEpXG4gICAgICBpZiAoIWNhbGNCb3VuZGluZ0JveC5keW5hbWljKSBhYWJiLmFwcGx5TWF0cml4NChvYmozZC5tYXRyaXhXb3JsZClcbiAgICAgIGlmIChoYXNCb3hFeHBhbmRlZCkge1xuICAgICAgICBjYWxjQm91bmRpbmdCb3guYm94LnVuaW9uKGFhYmIpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxjQm91bmRpbmdCb3guYm94LmNvcHkoYWFiYilcbiAgICAgICAgaGFzQm94RXhwYW5kZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9KVxuICAvLyBpZiBubyBtZXNoZXMsIGNyZWF0ZSBhIHNtYWxsIGJiIHNvIGludGVyYWN0YWJsZXMgc3RpbGwgZGV0ZWN0IGl0XG4gIGlmICghaGFzQm94RXhwYW5kZWQpIHtcbiAgICBjYWxjQm91bmRpbmdCb3guYm94ID0gbmV3IEJveDMoXG4gICAgICBuZXcgVmVjdG9yMygtMC4wNSwgLTAuMDUsIC0wLjA1KS5hZGQodHJhbnNmb3JtLnBvc2l0aW9uKSxcbiAgICAgIG5ldyBWZWN0b3IzKDAuMDUsIDAuMDUsIDAuMDUpLmFkZCh0cmFuc2Zvcm0ucG9zaXRpb24pXG4gICAgKVxuICB9XG59XG4iLCJpbXBvcnQgeyBHcm91cCwgTWF0aFV0aWxzLCBNZXNoLCBNZXNoUGhvbmdNYXRlcmlhbCwgUXVhdGVybmlvbiwgVmVjdG9yMyB9IGZyb20gJ3RocmVlJ1xuaW1wb3J0IHsgRm9sbG93Q2FtZXJhQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY2FtZXJhL2NvbXBvbmVudHMvRm9sbG93Q2FtZXJhQ29tcG9uZW50J1xuaW1wb3J0IHsgRW5naW5lRXZlbnRzIH0gZnJvbSAnLi4vLi4vZWNzL2NsYXNzZXMvRW5naW5lRXZlbnRzJ1xuaW1wb3J0IHtcbiAgYWRkQ29tcG9uZW50LFxuICBkZWZpbmVRdWVyeSxcbiAgZ2V0Q29tcG9uZW50LFxuICBoYXNDb21wb25lbnQsXG4gIHJlbW92ZUNvbXBvbmVudFxufSBmcm9tICcuLi8uLi9lY3MvZnVuY3Rpb25zL0NvbXBvbmVudEZ1bmN0aW9ucydcbmltcG9ydCB7IGNyZWF0ZUVudGl0eSB9IGZyb20gJy4uLy4uL2Vjcy9mdW5jdGlvbnMvRW50aXR5RnVuY3Rpb25zJ1xuaW1wb3J0IHsgTG9jYWxJbnB1dFRhZ0NvbXBvbmVudCB9IGZyb20gJy4uLy4uL2lucHV0L2NvbXBvbmVudHMvTG9jYWxJbnB1dFRhZ0NvbXBvbmVudCdcbmltcG9ydCB7IEhpZ2hsaWdodENvbXBvbmVudCB9IGZyb20gJy4uLy4uL3JlbmRlcmVyL2NvbXBvbmVudHMvSGlnaGxpZ2h0Q29tcG9uZW50J1xuaW1wb3J0IHsgT2JqZWN0M0RDb21wb25lbnQgfSBmcm9tICcuLi8uLi9zY2VuZS9jb21wb25lbnRzL09iamVjdDNEQ29tcG9uZW50J1xuaW1wb3J0IHsgQXZhdGFyQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vYXZhdGFyL2NvbXBvbmVudHMvQXZhdGFyQ29tcG9uZW50J1xuaW1wb3J0IHsgVHJhbnNmb3JtQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vdHJhbnNmb3JtL2NvbXBvbmVudHMvVHJhbnNmb3JtQ29tcG9uZW50J1xuaW1wb3J0IHsgQm91bmRpbmdCb3hDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL0JvdW5kaW5nQm94Q29tcG9uZW50J1xuaW1wb3J0IHsgSW50ZXJhY3RhYmxlQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9JbnRlcmFjdGFibGVDb21wb25lbnQnXG5pbXBvcnQgeyBJbnRlcmFjdGl2ZUZvY3VzZWRDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL0ludGVyYWN0aXZlRm9jdXNlZENvbXBvbmVudCdcbmltcG9ydCB7IEludGVyYWN0b3JDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL0ludGVyYWN0b3JDb21wb25lbnQnXG5pbXBvcnQgeyBTdWJGb2N1c2VkQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9TdWJGb2N1c2VkQ29tcG9uZW50J1xuaW1wb3J0IHsgRm9udE1hbmFnZXIgfSBmcm9tICcuLi8uLi94cnVpL2NsYXNzZXMvRm9udE1hbmFnZXInXG5pbXBvcnQgeyBoaWRlSW50ZXJhY3RUZXh0LCBzaG93SW50ZXJhY3RUZXh0IH0gZnJvbSAnLi4vZnVuY3Rpb25zL2ludGVyYWN0VGV4dCdcbmltcG9ydCB7IGludGVyYWN0Qm94UmF5Y2FzdCB9IGZyb20gJy4uL2Z1bmN0aW9ucy9pbnRlcmFjdEJveFJheWNhc3QnXG5pbXBvcnQgeyBJbnRlcmFjdGVkQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9JbnRlcmFjdGVkQ29tcG9uZW50J1xuaW1wb3J0IEF1ZGlvU291cmNlIGZyb20gJy4uLy4uL3NjZW5lL2NsYXNzZXMvQXVkaW9Tb3VyY2UnXG5pbXBvcnQgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9lY3MvY2xhc3Nlcy9FbmdpbmUnXG5pbXBvcnQgeyBjcmVhdGVCb3hDb21wb25lbnQgfSBmcm9tICcuLi9mdW5jdGlvbnMvY3JlYXRlQm94Q29tcG9uZW50J1xuaW1wb3J0IHsgQXVkaW9UYWdDb21wb25lbnQgfSBmcm9tICcuLi8uLi9hdWRpby9jb21wb25lbnRzL0F1ZGlvVGFnQ29tcG9uZW50J1xuaW1wb3J0IHsgUGVyc2lzdFRhZ0NvbXBvbmVudCB9IGZyb20gJy4uLy4uL3NjZW5lL2NvbXBvbmVudHMvUGVyc2lzdFRhZ0NvbXBvbmVudCdcbmltcG9ydCB7IFN5c3RlbSB9IGZyb20gJy4uLy4uL2Vjcy9jbGFzc2VzL1N5c3RlbSdcbmltcG9ydCB7IFdvcmxkIH0gZnJvbSAnLi4vLi4vZWNzL2NsYXNzZXMvV29ybGQnXG5cbmNvbnN0IHVwVmVjID0gbmV3IFZlY3RvcjMoMCwgMSwgMClcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gSW50ZXJhY3RpdmVTeXN0ZW0od29ybGQ6IFdvcmxkKTogUHJvbWlzZTxTeXN0ZW0+IHtcbiAgY29uc3QgaW50ZXJhY3RvcnNRdWVyeSA9IGRlZmluZVF1ZXJ5KFtJbnRlcmFjdG9yQ29tcG9uZW50XSlcbiAgY29uc3QgaW50ZXJhY3RpdmVRdWVyeSA9IGRlZmluZVF1ZXJ5KFtJbnRlcmFjdGFibGVDb21wb25lbnRdKVxuICBjb25zdCBib3VuZGluZ0JveFF1ZXJ5ID0gZGVmaW5lUXVlcnkoW0JvdW5kaW5nQm94Q29tcG9uZW50XSlcbiAgY29uc3QgZm9jdXNRdWVyeSA9IGRlZmluZVF1ZXJ5KFtJbnRlcmFjdGFibGVDb21wb25lbnQsIEludGVyYWN0aXZlRm9jdXNlZENvbXBvbmVudF0pXG4gIGNvbnN0IHN1YmZvY3VzUXVlcnkgPSBkZWZpbmVRdWVyeShbSW50ZXJhY3RhYmxlQ29tcG9uZW50LCBTdWJGb2N1c2VkQ29tcG9uZW50XSlcbiAgY29uc3QgbG9jYWxVc2VyUXVlcnkgPSBkZWZpbmVRdWVyeShbTG9jYWxJbnB1dFRhZ0NvbXBvbmVudCwgQXZhdGFyQ29tcG9uZW50XSlcbiAgY29uc3QgaW50ZXJhY3RlZFF1ZXJ5ID0gZGVmaW5lUXVlcnkoW0ludGVyYWN0ZWRDb21wb25lbnRdKVxuXG4gIGNvbnN0IGdlb21ldHJ5ID0gRm9udE1hbmFnZXIuaW5zdGFuY2UuY3JlYXRlM2RUZXh0KCdJTlRFUkFDVCcsIG5ldyBWZWN0b3IzKDAuOCwgMSwgMC4yKSlcblxuICBjb25zdCB0ZXh0U2l6ZSA9IDAuMVxuICBjb25zdCB0ZXh0ID0gbmV3IE1lc2goZ2VvbWV0cnksIG5ldyBNZXNoUGhvbmdNYXRlcmlhbCh7IGNvbG9yOiAweGQ0YWYzNywgZW1pc3NpdmU6IDB4ZDRhZjM3LCBlbWlzc2l2ZUludGVuc2l0eTogMSB9KSlcbiAgdGV4dC5zY2FsZS5zZXRTY2FsYXIodGV4dFNpemUpXG5cbiAgY29uc3QgaW50ZXJhY3RUZXh0RW50aXR5ID0gY3JlYXRlRW50aXR5KClcbiAgY29uc3QgdGV4dEdyb3VwID0gbmV3IEdyb3VwKCkuYWRkKHRleHQpXG4gIGFkZENvbXBvbmVudChpbnRlcmFjdFRleHRFbnRpdHksIE9iamVjdDNEQ29tcG9uZW50LCB7IHZhbHVlOiB0ZXh0R3JvdXAgfSlcbiAgRW5naW5lLnNjZW5lLmFkZCh0ZXh0R3JvdXApXG4gIGFkZENvbXBvbmVudChpbnRlcmFjdFRleHRFbnRpdHksIFBlcnNpc3RUYWdDb21wb25lbnQsIHt9KVxuICBjb25zdCB0cmFuc2Zvcm1Db21wb25lbnQgPSBhZGRDb21wb25lbnQoaW50ZXJhY3RUZXh0RW50aXR5LCBUcmFuc2Zvcm1Db21wb25lbnQsIHtcbiAgICBwb3NpdGlvbjogbmV3IFZlY3RvcjMoKSxcbiAgICByb3RhdGlvbjogbmV3IFF1YXRlcm5pb24oKSxcbiAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSlcbiAgfSlcbiAgdHJhbnNmb3JtQ29tcG9uZW50LnNjYWxlLnNldFNjYWxhcigwKVxuICB0ZXh0R3JvdXAudmlzaWJsZSA9IGZhbHNlXG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBjb25zdCB7IGVsYXBzZWRUaW1lIH0gPSB3b3JsZFxuXG4gICAgZm9yIChjb25zdCBlbnRpdHkgb2YgaW50ZXJhY3RpdmVRdWVyeS5lbnRlcih3b3JsZCkpIHtcbiAgICAgIGlmICghaGFzQ29tcG9uZW50KGVudGl0eSwgQm91bmRpbmdCb3hDb21wb25lbnQpICYmIGhhc0NvbXBvbmVudChlbnRpdHksIE9iamVjdDNEQ29tcG9uZW50KSkge1xuICAgICAgICBjcmVhdGVCb3hDb21wb25lbnQoZW50aXR5KVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGludGVyYWN0aXZlcyA9IGludGVyYWN0aXZlUXVlcnkod29ybGQpXG5cbiAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiBpbnRlcmFjdG9yc1F1ZXJ5KHdvcmxkKSkge1xuICAgICAgaWYgKGludGVyYWN0aXZlcy5sZW5ndGgpIHtcbiAgICAgICAgaW50ZXJhY3RCb3hSYXljYXN0KGVudGl0eSwgYm91bmRpbmdCb3hRdWVyeSh3b3JsZCkpXG4gICAgICAgIGNvbnN0IGludGVyYWN0cyA9IGdldENvbXBvbmVudChlbnRpdHksIEludGVyYWN0b3JDb21wb25lbnQpXG4gICAgICAgIGlmIChpbnRlcmFjdHMuZm9jdXNlZEludGVyYWN0aXZlKSB7XG4gICAgICAgICAgaWYgKCFoYXNDb21wb25lbnQoaW50ZXJhY3RzLmZvY3VzZWRJbnRlcmFjdGl2ZSwgSW50ZXJhY3RpdmVGb2N1c2VkQ29tcG9uZW50KSkge1xuICAgICAgICAgICAgYWRkQ29tcG9uZW50KGludGVyYWN0cy5mb2N1c2VkSW50ZXJhY3RpdmUsIEludGVyYWN0aXZlRm9jdXNlZENvbXBvbmVudCwgeyBpbnRlcmFjdHM6IGVudGl0eSB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVubWFyayBhbGwgdW5mb2N1c2VkXG4gICAgICAgIGZvciAoY29uc3QgZW50aXR5SW50ZXIgb2YgaW50ZXJhY3RpdmVzKSB7XG4gICAgICAgICAgaWYgKGVudGl0eUludGVyICE9PSBpbnRlcmFjdHMuZm9jdXNlZEludGVyYWN0aXZlICYmIGhhc0NvbXBvbmVudChlbnRpdHlJbnRlciwgSW50ZXJhY3RpdmVGb2N1c2VkQ29tcG9uZW50KSkge1xuICAgICAgICAgICAgcmVtb3ZlQ29tcG9uZW50KGVudGl0eUludGVyLCBJbnRlcmFjdGl2ZUZvY3VzZWRDb21wb25lbnQpXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpbnRlcmFjdHMuc3ViRm9jdXNlZEFycmF5LnNvbWUoKHYpID0+IHZbMF0uZW50aXR5ID09PSBlbnRpdHlJbnRlcikpIHtcbiAgICAgICAgICAgIGlmICghaGFzQ29tcG9uZW50KGVudGl0eUludGVyLCBTdWJGb2N1c2VkQ29tcG9uZW50KSkge1xuICAgICAgICAgICAgICBhZGRDb21wb25lbnQoZW50aXR5SW50ZXIsIFN1YkZvY3VzZWRDb21wb25lbnQsIHsgc3ViSW50ZXJhY3RzOiBlbnRpdHlJbnRlciB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW1vdmVDb21wb25lbnQoZW50aXR5SW50ZXIsIFN1YkZvY3VzZWRDb21wb25lbnQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcmVtb3ZhbCBpcyB0aGUgZmlyc3QgYmVjYXVzZSB0aGUgaGludCBtdXN0IGZpcnN0IGJlIGRlbGV0ZWQsIGFuZCB0aGVuIGEgbmV3IG9uZSBhcHBlYXJzXG4gICAgZm9yIChjb25zdCBlbnRpdHkgb2YgZm9jdXNRdWVyeS5leGl0KCkpIHtcbiAgICAgIGhpZGVJbnRlcmFjdFRleHQoaW50ZXJhY3RUZXh0RW50aXR5KVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIGZvY3VzUXVlcnkuZW50ZXIoKSkge1xuICAgICAgc2hvd0ludGVyYWN0VGV4dChpbnRlcmFjdFRleHRFbnRpdHksIGVudGl0eSlcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiBzdWJmb2N1c1F1ZXJ5LmVudGVyKCkpIHtcbiAgICAgIGFkZENvbXBvbmVudChlbnRpdHksIEhpZ2hsaWdodENvbXBvbmVudCwgeyBjb2xvcjogMHhmZjAwMDAsIGhpZGRlbkNvbG9yOiAweDAwMDBmZiwgZWRnZVN0cmVuZ3RoOiAxIH0pXG4gICAgfVxuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIHN1YmZvY3VzUXVlcnkuZXhpdCgpKSB7XG4gICAgICByZW1vdmVDb21wb25lbnQoZW50aXR5LCBIaWdobGlnaHRDb21wb25lbnQpXG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBlbnRpdHkgb2YgaW50ZXJhY3RlZFF1ZXJ5LmVudGVyKCkpIHtcbiAgICAgIGNvbnN0IGludGVyYWN0aXZlQ29tcG9uZW50ID0gZ2V0Q29tcG9uZW50KGVudGl0eSwgSW50ZXJhY3RhYmxlQ29tcG9uZW50KVxuICAgICAgaWYgKGhhc0NvbXBvbmVudChlbnRpdHksIEF1ZGlvVGFnQ29tcG9uZW50KSkge1xuICAgICAgICBjb25zdCBtZWRpYU9iamVjdCA9IGdldENvbXBvbmVudChlbnRpdHksIE9iamVjdDNEQ29tcG9uZW50KS52YWx1ZSBhcyBBdWRpb1NvdXJjZVxuICAgICAgICBtZWRpYU9iamVjdD8udG9nZ2xlKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIEVuZ2luZUV2ZW50cy5pbnN0YW5jZS5kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICB0eXBlOiBFbmdpbmVFdmVudHMuRVZFTlRTLk9CSkVDVF9BQ1RJVkFUSU9OLFxuICAgICAgICAgIC4uLmludGVyYWN0aXZlQ29tcG9uZW50LmRhdGFcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIHJlbW92ZUNvbXBvbmVudChlbnRpdHksIEludGVyYWN0ZWRDb21wb25lbnQpXG4gICAgfVxuXG4gICAgLy8gVE9ETzogbW92ZSB0byBmcmVlIHVwZGF0ZVxuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIGxvY2FsVXNlclF1ZXJ5KCkpIHtcbiAgICAgIC8vIGFuaW1hdGUgdGhlIGludGVyYWN0IHRleHQgdXAgYW5kIGRvd24gaWYgaXQncyB2aXNpYmxlXG4gICAgICBjb25zdCBpbnRlcmFjdFRleHRPYmplY3QgPSBnZXRDb21wb25lbnQoaW50ZXJhY3RUZXh0RW50aXR5LCBPYmplY3QzRENvbXBvbmVudCkudmFsdWVcbiAgICAgIGlmICghaW50ZXJhY3RUZXh0T2JqZWN0LnZpc2libGUpIGNvbnRpbnVlXG4gICAgICBpbnRlcmFjdFRleHRPYmplY3QuY2hpbGRyZW5bMF0ucG9zaXRpb24ueSA9IE1hdGguc2luKGVsYXBzZWRUaW1lICogMS44KSAqIDAuMDVcbiAgICAgIGlmIChFbmdpbmUuYWN0aXZlQ2FtZXJhRm9sbG93VGFyZ2V0ICYmIGhhc0NvbXBvbmVudChFbmdpbmUuYWN0aXZlQ2FtZXJhRm9sbG93VGFyZ2V0LCBGb2xsb3dDYW1lcmFDb21wb25lbnQpKSB7XG4gICAgICAgIGludGVyYWN0VGV4dE9iamVjdC5jaGlsZHJlblswXS5zZXRSb3RhdGlvbkZyb21BeGlzQW5nbGUoXG4gICAgICAgICAgdXBWZWMsXG4gICAgICAgICAgTWF0aFV0aWxzLmRlZ1RvUmFkKGdldENvbXBvbmVudChFbmdpbmUuYWN0aXZlQ2FtZXJhRm9sbG93VGFyZ2V0LCBGb2xsb3dDYW1lcmFDb21wb25lbnQpLnRoZXRhKVxuICAgICAgICApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB7IHgsIHogfSA9IGdldENvbXBvbmVudChlbnRpdHksIFRyYW5zZm9ybUNvbXBvbmVudCkucG9zaXRpb25cbiAgICAgICAgaW50ZXJhY3RUZXh0T2JqZWN0Lmxvb2tBdCh4LCBpbnRlcmFjdFRleHRPYmplY3QucG9zaXRpb24ueSwgeilcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBp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
