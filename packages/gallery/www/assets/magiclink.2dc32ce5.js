var e=Object.defineProperty,t=Object.defineProperties,r=Object.getOwnPropertyDescriptors,a=Object.getOwnPropertySymbols,o=Object.prototype.hasOwnProperty,s=Object.prototype.propertyIsEnumerable,n=(t,r,a)=>r in t?e(t,r,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[r]=a,i=(e,t)=>{for(var r in t||(t={}))o.call(t,r)&&n(e,r,t[r]);if(a)for(var r of a(t))s.call(t,r)&&n(e,r,t[r]);return e},m=(e,a)=>t(e,r(a));import{r as c,u as l,R as p}from"./vendor.40ddfb4b.js";import{v as d,m as f,h as u,i as b}from"./service.2cb21ce4.js";import{ax as y,b as j,ay as E}from"./_app.e67b0e96.js";import{s as h}from"./Auth.module.2ea06a41.js";import{E as v}from"./EmptyLayout.6bc3f5e1.js";import{C as g}from"./Container.8fcf9e42.js";import{T as w}from"./Typography.9d0f0940.js";import{T as x}from"./TextField.cbc648d1.js";import{B as P}from"./Button.31285e4e.js";import{B as k}from"./Box.cb35bf4d.js";import{c as O}from"./feathers.42c2841d.js";import"./index.b0bd5cc1.js";import"./index.1d867f8f.js";import"./capitalize.f4eb3e2e.js";import"./Paper.24cff5e5.js";import"./IconButton.32d4e708.js";import"./createSvgIcon.f2e498dd.js";import"./useControlled.e1604cb7.js";import"./Dialog.c787f71e.js";import"./Modal.c801ca2c.js";import"./Backdrop.9ef065d7.js";import"./DialogTitle.bed0cd09.js";import"./InputLabel.7f84de76.js";import"./Popover.1d8a9ca1.js";import"./List.52b49b17.js";var B=e=>{const{resetPassword:t,token:r}=e,[a,o]=c.exports.useState({password:""}),{t:s}=l();return p.createElement(v,null,p.createElement(g,{component:"main",maxWidth:"xs"},p.createElement("div",{className:h.paper},p.createElement(w,{component:"h1",variant:"h5"},s("user:auth.resetPassword.header")),p.createElement(w,{variant:"body2",color:"textSecondary",align:"center"},s("user:auth.resetPassword.description")),p.createElement("form",{className:h.form,noValidate:!0,onSubmit:o=>(o=>{o.preventDefault(),t(r,a.password),e.completeAction&&e.completeAction()})(o)},p.createElement(x,{variant:"outlined",margin:"normal",required:!0,fullWidth:!0,id:"password",label:s("user:auth.resetPassword.lbl-password"),name:"password",autoComplete:"password",autoFocus:!0,onChange:e=>(e=>{e.preventDefault(),o(m(i({},a),{[e.target.name]:e.target.value}))})(e)}),p.createElement(P,{type:"submit",fullWidth:!0,variant:"contained",color:"primary",className:h.submit},s("user:auth.resetPassword.lbl-submit"))))))};const S=e=>{const{verifyEmail:t,token:r}=e,{t:a}=l();return c.exports.useEffect((()=>{t(r)}),[]),p.createElement(v,null,p.createElement(g,{component:"main",maxWidth:"md"},p.createElement("div",{className:h.paper},p.createElement(w,{component:"h1",variant:"h5"},a("user:auth.verifyEmail.header")),p.createElement(k,{mt:3},p.createElement(w,{variant:"body2",color:"textSecondary",align:"center"},a("user:auth.verifyEmail.processing"))))))},C=e=>{const{auth:t,loginUserByJwt:r,refreshConnections:a,token:o,type:s}=e,{t:n}=l();return c.exports.useEffect((()=>{if("login"===s)r(o,"/","/");else if("connection"===s){const e=t.get("user");e&&a(e.id),window.location.href="/profile-connections"}}),[]),p.createElement(g,{component:"main",maxWidth:"md"},p.createElement(k,{mt:3},p.createElement(w,{variant:"body2",color:"textSecondary",align:"center"},n("user:magikLink.wait"))))};var D=y(O(null,(e=>({verifyEmail:j(d,e),resetPassword:j(f,e),loginUserByJwt:j(u,e),refreshConnections:j(b,e)})))((e=>{const t=new URLSearchParams(E().search),r=t.get("token"),a=t.get("type");return"verify"===a?p.createElement(S,m(i({},e),{type:a,token:r})):"reset"===a?p.createElement(B,m(i({},e),{type:a,token:r})):p.createElement(C,m(i({},e),{token:r,type:a}))})));const L=()=>p.createElement(D,null);export{L as AuthMagicLinkPage,L as default};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFnaWNsaW5rLjJkYzMyY2U1LmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9jbGllbnQtY29yZS9zcmMvdXNlci9jb21wb25lbnRzL0F1dGgvUmVzZXRQYXNzd29yZC50c3giLCIuLi8uLi8uLi9jbGllbnQtY29yZS9zcmMvdXNlci9jb21wb25lbnRzL0F1dGgvVmVyaWZ5RW1haWwudHN4IiwiLi4vLi4vLi4vY2xpZW50LWNvcmUvc3JjL3VzZXIvY29tcG9uZW50cy9NYWdpY0xpbmsvQXV0aE1hZ2ljTGluay50c3giLCIuLi8uLi9zcmMvcGFnZXMvYXV0aC9tYWdpY2xpbmsudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IEJ1dHRvbiBmcm9tICdAbWF0ZXJpYWwtdWkvY29yZS9CdXR0b24nXG5pbXBvcnQgVGV4dEZpZWxkIGZyb20gJ0BtYXRlcmlhbC11aS9jb3JlL1RleHRGaWVsZCdcbmltcG9ydCBUeXBvZ3JhcGh5IGZyb20gJ0BtYXRlcmlhbC11aS9jb3JlL1R5cG9ncmFwaHknXG5pbXBvcnQgQ29udGFpbmVyIGZyb20gJ0BtYXRlcmlhbC11aS9jb3JlL0NvbnRhaW5lcidcblxuaW1wb3J0IHN0eWxlcyBmcm9tICcuL0F1dGgubW9kdWxlLnNjc3MnXG5pbXBvcnQgeyBFbXB0eUxheW91dCB9IGZyb20gJy4uLy4uLy4uL2NvbW1vbi9jb21wb25lbnRzL0xheW91dC9FbXB0eUxheW91dCdcbmltcG9ydCB7IHJlc2V0UGFzc3dvcmQgfSBmcm9tICcuLi8uLi9yZWR1Y2Vycy9hdXRoL3NlcnZpY2UnXG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnXG5cbmludGVyZmFjZSBQcm9wcyB7XG4gIGNvbXBsZXRlQWN0aW9uPzogYW55XG4gIHJlc2V0UGFzc3dvcmQ6IHR5cGVvZiByZXNldFBhc3N3b3JkXG4gIHRva2VuOiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgKHByb3BzOiBQcm9wcyk6IGFueSA9PiB7XG4gIGNvbnN0IHsgcmVzZXRQYXNzd29yZCwgdG9rZW4gfSA9IHByb3BzXG4gIGNvbnN0IGluaXRpYWxTdGF0ZSA9IHsgcGFzc3dvcmQ6ICcnIH1cbiAgY29uc3QgW3N0YXRlLCBzZXRTdGF0ZV0gPSB1c2VTdGF0ZShpbml0aWFsU3RhdGUpXG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKVxuXG4gIGNvbnN0IGhhbmRsZUlucHV0ID0gKGU6IGFueSk6IHZvaWQgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHNldFN0YXRlKHsgLi4uc3RhdGUsIFtlLnRhcmdldC5uYW1lXTogZS50YXJnZXQudmFsdWUgfSlcbiAgfVxuICBjb25zdCBoYW5kbGVSZXNldCA9IChlOiBhbnkpOiB2b2lkID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICByZXNldFBhc3N3b3JkKHRva2VuLCBzdGF0ZS5wYXNzd29yZClcbiAgICBpZiAocHJvcHMuY29tcGxldGVBY3Rpb24pIHByb3BzLmNvbXBsZXRlQWN0aW9uKClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEVtcHR5TGF5b3V0PlxuICAgICAgPENvbnRhaW5lciBjb21wb25lbnQ9XCJtYWluXCIgbWF4V2lkdGg9XCJ4c1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnBhcGVyfT5cbiAgICAgICAgICA8VHlwb2dyYXBoeSBjb21wb25lbnQ9XCJoMVwiIHZhcmlhbnQ9XCJoNVwiPlxuICAgICAgICAgICAge3QoJ3VzZXI6YXV0aC5yZXNldFBhc3N3b3JkLmhlYWRlcicpfVxuICAgICAgICAgIDwvVHlwb2dyYXBoeT5cbiAgICAgICAgICA8VHlwb2dyYXBoeSB2YXJpYW50PVwiYm9keTJcIiBjb2xvcj1cInRleHRTZWNvbmRhcnlcIiBhbGlnbj1cImNlbnRlclwiPlxuICAgICAgICAgICAge3QoJ3VzZXI6YXV0aC5yZXNldFBhc3N3b3JkLmRlc2NyaXB0aW9uJyl9XG4gICAgICAgICAgPC9UeXBvZ3JhcGh5PlxuICAgICAgICAgIDxmb3JtIGNsYXNzTmFtZT17c3R5bGVzLmZvcm19IG5vVmFsaWRhdGUgb25TdWJtaXQ9eyhlKSA9PiBoYW5kbGVSZXNldChlKX0+XG4gICAgICAgICAgICA8VGV4dEZpZWxkXG4gICAgICAgICAgICAgIHZhcmlhbnQ9XCJvdXRsaW5lZFwiXG4gICAgICAgICAgICAgIG1hcmdpbj1cIm5vcm1hbFwiXG4gICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgIGZ1bGxXaWR0aFxuICAgICAgICAgICAgICBpZD1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgbGFiZWw9e3QoJ3VzZXI6YXV0aC5yZXNldFBhc3N3b3JkLmxibC1wYXNzd29yZCcpfVxuICAgICAgICAgICAgICBuYW1lPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGhhbmRsZUlucHV0KGUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxCdXR0b24gdHlwZT1cInN1Ym1pdFwiIGZ1bGxXaWR0aCB2YXJpYW50PVwiY29udGFpbmVkXCIgY29sb3I9XCJwcmltYXJ5XCIgY2xhc3NOYW1lPXtzdHlsZXMuc3VibWl0fT5cbiAgICAgICAgICAgICAge3QoJ3VzZXI6YXV0aC5yZXNldFBhc3N3b3JkLmxibC1zdWJtaXQnKX1cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L0NvbnRhaW5lcj5cbiAgICA8L0VtcHR5TGF5b3V0PlxuICApXG59XG4iLCJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgQm94IGZyb20gJ0BtYXRlcmlhbC11aS9jb3JlL0JveCdcbmltcG9ydCBUeXBvZ3JhcGh5IGZyb20gJ0BtYXRlcmlhbC11aS9jb3JlL1R5cG9ncmFwaHknXG5pbXBvcnQgQ29udGFpbmVyIGZyb20gJ0BtYXRlcmlhbC11aS9jb3JlL0NvbnRhaW5lcidcbmltcG9ydCB7IEVtcHR5TGF5b3V0IH0gZnJvbSAnLi4vLi4vLi4vY29tbW9uL2NvbXBvbmVudHMvTGF5b3V0L0VtcHR5TGF5b3V0J1xuaW1wb3J0IHsgdmVyaWZ5RW1haWwgfSBmcm9tICcuLi8uLi9yZWR1Y2Vycy9hdXRoL3NlcnZpY2UnXG5pbXBvcnQgc3R5bGVzIGZyb20gJy4vQXV0aC5tb2R1bGUuc2NzcydcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCdcblxuaW50ZXJmYWNlIFByb3BzIHtcbiAgYXV0aDogYW55XG4gIHR5cGU6IHN0cmluZ1xuICB0b2tlbjogc3RyaW5nXG4gIHZlcmlmeUVtYWlsOiB0eXBlb2YgdmVyaWZ5RW1haWxcbn1cblxuZXhwb3J0IGNvbnN0IFZlcmlmeUVtYWlsID0gKHByb3BzOiBQcm9wcyk6IGFueSA9PiB7XG4gIGNvbnN0IHsgdmVyaWZ5RW1haWwsIHRva2VuIH0gPSBwcm9wc1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKClcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHZlcmlmeUVtYWlsKHRva2VuKVxuICB9LCBbXSlcblxuICByZXR1cm4gKFxuICAgIDxFbXB0eUxheW91dD5cbiAgICAgIDxDb250YWluZXIgY29tcG9uZW50PVwibWFpblwiIG1heFdpZHRoPVwibWRcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5wYXBlcn0+XG4gICAgICAgICAgPFR5cG9ncmFwaHkgY29tcG9uZW50PVwiaDFcIiB2YXJpYW50PVwiaDVcIj5cbiAgICAgICAgICAgIHt0KCd1c2VyOmF1dGgudmVyaWZ5RW1haWwuaGVhZGVyJyl9XG4gICAgICAgICAgPC9UeXBvZ3JhcGh5PlxuXG4gICAgICAgICAgPEJveCBtdD17M30+XG4gICAgICAgICAgICA8VHlwb2dyYXBoeSB2YXJpYW50PVwiYm9keTJcIiBjb2xvcj1cInRleHRTZWNvbmRhcnlcIiBhbGlnbj1cImNlbnRlclwiPlxuICAgICAgICAgICAgICB7dCgndXNlcjphdXRoLnZlcmlmeUVtYWlsLnByb2Nlc3NpbmcnKX1cbiAgICAgICAgICAgIDwvVHlwb2dyYXBoeT5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L0NvbnRhaW5lcj5cbiAgICA8L0VtcHR5TGF5b3V0PlxuICApXG59XG4iLCJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VMb2NhdGlvbiwgd2l0aFJvdXRlciB9IGZyb20gJ3JlYWN0LXJvdXRlci1kb20nXG5pbXBvcnQgeyBsb2dpblVzZXJCeUp3dCwgcmVmcmVzaENvbm5lY3Rpb25zLCB2ZXJpZnlFbWFpbCwgcmVzZXRQYXNzd29yZCB9IGZyb20gJy4uLy4uL3JlZHVjZXJzL2F1dGgvc2VydmljZSdcbmltcG9ydCB7IERpc3BhdGNoLCBiaW5kQWN0aW9uQ3JlYXRvcnMgfSBmcm9tICdyZWR1eCdcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCdcbmltcG9ydCBCb3ggZnJvbSAnQG1hdGVyaWFsLXVpL2NvcmUvQm94J1xuaW1wb3J0IFR5cG9ncmFwaHkgZnJvbSAnQG1hdGVyaWFsLXVpL2NvcmUvVHlwb2dyYXBoeSdcbmltcG9ydCBDb250YWluZXIgZnJvbSAnQG1hdGVyaWFsLXVpL2NvcmUvQ29udGFpbmVyJ1xuaW1wb3J0IFJlc2V0UGFzc3dvcmQgZnJvbSAnLi4vQXV0aC9SZXNldFBhc3N3b3JkJ1xuaW1wb3J0IHsgVmVyaWZ5RW1haWwgfSBmcm9tICcuLi9BdXRoL1ZlcmlmeUVtYWlsJ1xuaW1wb3J0IHsgVXNlciB9IGZyb20gJ0B4cmVuZ2luZS9jb21tb24vc3JjL2ludGVyZmFjZXMvVXNlcidcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCdcblxuaW50ZXJmYWNlIFByb3BzIHtcbiAgYXV0aDogYW55XG4gIHZlcmlmeUVtYWlsOiB0eXBlb2YgdmVyaWZ5RW1haWxcbiAgcmVzZXRQYXNzd29yZDogdHlwZW9mIHJlc2V0UGFzc3dvcmRcbiAgbG9naW5Vc2VyQnlKd3Q6IHR5cGVvZiBsb2dpblVzZXJCeUp3dFxuICByZWZyZXNoQ29ubmVjdGlvbnM6IHR5cGVvZiByZWZyZXNoQ29ubmVjdGlvbnNcbiAgdHlwZTogc3RyaW5nXG4gIHRva2VuOiBzdHJpbmdcbn1cblxuY29uc3QgbWFwRGlzcGF0Y2hUb1Byb3BzID0gKGRpc3BhdGNoOiBEaXNwYXRjaCk6IGFueSA9PiAoe1xuICB2ZXJpZnlFbWFpbDogYmluZEFjdGlvbkNyZWF0b3JzKHZlcmlmeUVtYWlsLCBkaXNwYXRjaCksXG4gIHJlc2V0UGFzc3dvcmQ6IGJpbmRBY3Rpb25DcmVhdG9ycyhyZXNldFBhc3N3b3JkLCBkaXNwYXRjaCksXG4gIGxvZ2luVXNlckJ5Snd0OiBiaW5kQWN0aW9uQ3JlYXRvcnMobG9naW5Vc2VyQnlKd3QsIGRpc3BhdGNoKSxcbiAgcmVmcmVzaENvbm5lY3Rpb25zOiBiaW5kQWN0aW9uQ3JlYXRvcnMocmVmcmVzaENvbm5lY3Rpb25zLCBkaXNwYXRjaClcbn0pXG5cbmNvbnN0IEF1dGhNYWdpY0xpbmsgPSAocHJvcHM6IFByb3BzKTogYW55ID0+IHtcbiAgY29uc3QgeyBhdXRoLCBsb2dpblVzZXJCeUp3dCwgcmVmcmVzaENvbm5lY3Rpb25zLCB0b2tlbiwgdHlwZSB9ID0gcHJvcHNcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAodHlwZSA9PT0gJ2xvZ2luJykge1xuICAgICAgbG9naW5Vc2VyQnlKd3QodG9rZW4sICcvJywgJy8nKVxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2Nvbm5lY3Rpb24nKSB7XG4gICAgICBjb25zdCB1c2VyID0gYXV0aC5nZXQoJ3VzZXInKSBhcyBVc2VyXG4gICAgICBpZiAodXNlcikge1xuICAgICAgICByZWZyZXNoQ29ubmVjdGlvbnModXNlci5pZClcbiAgICAgIH1cbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy9wcm9maWxlLWNvbm5lY3Rpb25zJ1xuICAgIH1cbiAgfSwgW10pXG5cbiAgcmV0dXJuIChcbiAgICA8Q29udGFpbmVyIGNvbXBvbmVudD1cIm1haW5cIiBtYXhXaWR0aD1cIm1kXCI+XG4gICAgICA8Qm94IG10PXszfT5cbiAgICAgICAgPFR5cG9ncmFwaHkgdmFyaWFudD1cImJvZHkyXCIgY29sb3I9XCJ0ZXh0U2Vjb25kYXJ5XCIgYWxpZ249XCJjZW50ZXJcIj5cbiAgICAgICAgICB7dCgndXNlcjptYWdpa0xpbmsud2FpdCcpfVxuICAgICAgICA8L1R5cG9ncmFwaHk+XG4gICAgICA8L0JveD5cbiAgICA8L0NvbnRhaW5lcj5cbiAgKVxufVxuXG5jb25zdCBBdXRoTWFnaWNMaW5rV3JhcHBlciA9IChwcm9wczogYW55KTogYW55ID0+IHtcbiAgY29uc3Qgc2VhcmNoID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh1c2VMb2NhdGlvbigpLnNlYXJjaClcbiAgY29uc3QgdG9rZW4gPSBzZWFyY2guZ2V0KCd0b2tlbicpIGFzIHN0cmluZ1xuICBjb25zdCB0eXBlID0gc2VhcmNoLmdldCgndHlwZScpIGFzIHN0cmluZ1xuXG4gIGlmICh0eXBlID09PSAndmVyaWZ5Jykge1xuICAgIHJldHVybiA8VmVyaWZ5RW1haWwgey4uLnByb3BzfSB0eXBlPXt0eXBlfSB0b2tlbj17dG9rZW59IC8+XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3Jlc2V0Jykge1xuICAgIHJldHVybiA8UmVzZXRQYXNzd29yZCB7Li4ucHJvcHN9IHR5cGU9e3R5cGV9IHRva2VuPXt0b2tlbn0gLz5cbiAgfVxuICByZXR1cm4gPEF1dGhNYWdpY0xpbmsgey4uLnByb3BzfSB0b2tlbj17dG9rZW59IHR5cGU9e3R5cGV9IC8+XG59XG5cbmV4cG9ydCBkZWZhdWx0IHdpdGhSb3V0ZXIoY29ubmVjdChudWxsLCBtYXBEaXNwYXRjaFRvUHJvcHMpKEF1dGhNYWdpY0xpbmtXcmFwcGVyKSlcbiIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCBBdXRoTWFnaWNMaW5rIGZyb20gJ0B4cmVuZ2luZS9jbGllbnQtY29yZS9zcmMvdXNlci9jb21wb25lbnRzL01hZ2ljTGluay9BdXRoTWFnaWNMaW5rJ1xuXG5leHBvcnQgY29uc3QgQXV0aE1hZ2ljTGlua1BhZ2UgPSAoKSA9PiA8QXV0aE1hZ2ljTGluayAvPlxuXG5leHBvcnQgZGVmYXVsdCBBdXRoTWFnaWNMaW5rUGFnZVxuIl0sIm5hbWVzIjpbInByb3BzIiwicmVzZXRQYXNzd29yZCIsInRva2VuIiwic3RhdGUiLCJzZXRTdGF0ZSIsInVzZVN0YXRlIiwicGFzc3dvcmQiLCJ0IiwidXNlVHJhbnNsYXRpb24iLCJFbXB0eUxheW91dCIsIkNvbnRhaW5lciIsImNvbXBvbmVudCIsIm1heFdpZHRoIiwiY2xhc3NOYW1lIiwic3R5bGVzIiwicGFwZXIiLCJUeXBvZ3JhcGh5IiwidmFyaWFudCIsImNvbG9yIiwiYWxpZ24iLCJmb3JtIiwibm9WYWxpZGF0ZSIsIm9uU3VibWl0IiwiZSIsInByZXZlbnREZWZhdWx0IiwiY29tcGxldGVBY3Rpb24iLCJoYW5kbGVSZXNldCIsIlRleHRGaWVsZCIsIm1hcmdpbiIsInJlcXVpcmVkIiwiZnVsbFdpZHRoIiwiaWQiLCJsYWJlbCIsIm5hbWUiLCJhdXRvQ29tcGxldGUiLCJhdXRvRm9jdXMiLCJvbkNoYW5nZSIsIl9fc3ByZWFkUHJvcHMiLCJ0YXJnZXQiLCJ2YWx1ZSIsImhhbmRsZUlucHV0IiwiQnV0dG9uIiwidHlwZSIsInN1Ym1pdCIsIlZlcmlmeUVtYWlsIiwidmVyaWZ5RW1haWwiLCJCb3giLCJtdCIsIkF1dGhNYWdpY0xpbmsiLCJhdXRoIiwibG9naW5Vc2VyQnlKd3QiLCJyZWZyZXNoQ29ubmVjdGlvbnMiLCJ1c2VyIiwiZ2V0IiwibG9jYXRpb24iLCJocmVmIiwid2l0aFJvdXRlciIsImNvbm5lY3QiLCJkaXNwYXRjaCIsImJpbmRBY3Rpb25DcmVhdG9ycyIsInNlYXJjaCIsIlVSTFNlYXJjaFBhcmFtcyIsInVzZUxvY2F0aW9uIiwiUmVzZXRQYXNzd29yZCIsIkF1dGhNYWdpY0xpbmtQYWdlIl0sIm1hcHBpbmdzIjoidTFDQWlCQSxNQUFnQkEsVUFDTkMsc0JBQWVDLEdBQVVGLEdBRTFCRyxFQUFPQyxHQUFZQyxtQkFETCxDQUFFQyxTQUFVLE1BRTNCQyxFQUFFQSxHQUFNQywyQkFhWEMsRUFBRCxxQkFDR0MsRUFBRCxDQUFXQyxVQUFVLE9BQU9DLFNBQVMsc0JBQ2xDLE1BQUQsQ0FBS0MsVUFBV0MsRUFBT0MsdUJBQ3BCQyxFQUFELENBQVlMLFVBQVUsS0FBS00sUUFBUSxNQUNoQ1YsRUFBRSxtREFFSlMsRUFBRCxDQUFZQyxRQUFRLFFBQVFDLE1BQU0sZ0JBQWdCQyxNQUFNLFVBQ3JEWixFQUFFLHdEQUVKLE9BQUQsQ0FBTU0sVUFBV0MsRUFBT00sS0FBTUMsWUFBVSxFQUFDQyxTQUFXQyxHQWhCeEMsQ0FBQ0EsTUFDakJDLG1CQUNZdEIsRUFBT0MsRUFBTUcsVUFDdkJOLEVBQU15QixrQkFBc0JBLGtCQWFnQ0MsQ0FBWUgsb0JBQ25FSSxFQUFELENBQ0VWLFFBQVEsV0FDUlcsT0FBTyxTQUNQQyxVQUFRLEVBQ1JDLFdBQVMsRUFDVEMsR0FBRyxXQUNIQyxNQUFPekIsRUFBRSx3Q0FDVDBCLEtBQUssV0FDTEMsYUFBYSxXQUNiQyxXQUFTLEVBQ1RDLFNBQVdiLEdBL0JILENBQUNBLE1BQ2pCQyxtQkFDT2EsT0FBS2xDLEdBQUwsRUFBYW9CLEVBQUVlLE9BQU9MLE1BQU9WLEVBQUVlLE9BQU9DLFVBNkJwQkMsQ0FBWWpCLHFCQUU5QmtCLEVBQUQsQ0FBUUMsS0FBSyxTQUFTWixXQUFTLEVBQUNiLFFBQVEsWUFBWUMsTUFBTSxVQUFVTCxVQUFXQyxFQUFPNkIsUUFDbkZwQyxFQUFFLGtEQ3pDSnFDLEVBQWU1QyxVQUNsQjZDLG9CQUFhM0MsR0FBVUYsR0FDekJPLEVBQUVBLEdBQU1DLGdDQUVKLE9BQ0lOLEtBQ1gsb0JBR0FPLEVBQUQscUJBQ0dDLEVBQUQsQ0FBV0MsVUFBVSxPQUFPQyxTQUFTLHNCQUNsQyxNQUFELENBQUtDLFVBQVdDLEVBQU9DLHVCQUNwQkMsRUFBRCxDQUFZTCxVQUFVLEtBQUtNLFFBQVEsTUFDaENWLEVBQUUsaURBR0p1QyxFQUFELENBQUtDLEdBQUksbUJBQ04vQixFQUFELENBQVlDLFFBQVEsUUFBUUMsTUFBTSxnQkFBZ0JDLE1BQU0sVUFDckRaLEVBQUUsMENDSlh5QyxFQUFpQmhELFVBQ2ZpRCxLQUFFQSxFQUFNQyxpQkFBZ0JDLDJCQUFvQmpELE9BQU93QyxHQUFTMUMsR0FDNURPLEVBQUVBLEdBQU1DLGdDQUVKLFFBQ0ssVUFBVGtDLElBQ2F4QyxFQUFPLElBQUssYUFDVCxlQUFUd0MsRUFBdUIsT0FDMUJVLEVBQU9ILEVBQUtJLElBQUksUUFDbEJELEtBQ2lCQSxFQUFLckIsV0FFbkJ1QixTQUFTQyxLQUFPLDBCQUV4QixvQkFHQTdDLEVBQUQsQ0FBV0MsVUFBVSxPQUFPQyxTQUFTLHNCQUNsQ2tDLEVBQUQsQ0FBS0MsR0FBSSxtQkFDTi9CLEVBQUQsQ0FBWUMsUUFBUSxRQUFRQyxNQUFNLGdCQUFnQkMsTUFBTSxVQUNyRFosRUFBRSwyQkFvQmIsTUFBZWlELEVBQVdDLEVBQVEsTUEvQ05DLEtBQzFCYixZQUFhYyxFQUFtQmQsRUFBYWEsR0FDN0N6RCxjQUFlMEQsRUFBbUIxRCxFQUFleUQsR0FDakRSLGVBQWdCUyxFQUFtQlQsRUFBZ0JRLEdBQ25EUCxtQkFBb0JRLEVBQW1CUixFQUFvQk8sTUEyQ25DRCxFQWJJekQsVUFDdEI0RCxFQUFTLElBQUlDLGdCQUFnQkMsSUFBY0YsUUFDM0MxRCxFQUFRMEQsRUFBT1AsSUFBSSxTQUNuQlgsRUFBT2tCLEVBQU9QLElBQUksY0FFWCxXQUFUWCxrQkFDTUUsRUFBRFAsT0FBaUJyQyxHQUFqQixDQUF3QjBDLEtBQUFBLEVBQVl4QyxNQUFBQSxLQUN6QixVQUFUd0Msa0JBQ0RxQixFQUFEMUIsT0FBbUJyQyxHQUFuQixDQUEwQjBDLEtBQUFBLEVBQVl4QyxNQUFBQSxxQkFFdkM4QyxFQUFEWCxPQUFtQnJDLEdBQW5CLENBQTBCRSxNQUFBQSxFQUFjd0MsS0FBQUEsZUNoRXBDc0IsRUFBb0Isb0JBQU9oQixFQUFEIn0=
