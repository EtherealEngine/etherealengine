import{u as b,r as u,R as a}from"./vendor.475cb2ff.js";import{A as l}from"./AuthService.e8999ddc.js";import{an as j,a as k,ao as S,h as g}from"./_app.f0a72417.js";import{C as p}from"./Container.6d032d94.js";import"./AlertService.5d8abaff.js";import"./index.7b02be28.js";import"./feathers.32f4d4e8.js";import"./avatarFunctions.6d66cf01.js";import"./three.module.493739a3.js";import"./capitalize.fc001633.js";const v=F=>{const{t:o}=b(),s=k(),m={error:"",token:""},[t,f]=u.exports.useState(m),e=new URLSearchParams(S().search);return u.exports.useEffect(()=>{const n=e.get("error"),c=e.get("token"),h=e.get("type"),d=e.get("path"),i=e.get("instanceId");if(!n)if(h==="connection"){const r=g().user;s(l.refreshConnections(r.id.value))}else{let r=`${d}`;i!=null&&(r+=`?instanceId=${i}`),s(l.loginUserByJwt(c,r||"/","/"))}f({...t,error:n,token:c})},[]),t.error&&t.error!==""?a.createElement(p,null,o("user:oauth.authFailed",{service:"Facebook"}),a.createElement("br",null),t.error):a.createElement(p,null,o("user:oauth.authenticating"))},C=j(v),$=()=>a.createElement(C,null);export{$ as FacebookHomePage,$ as default};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFjZWJvb2suMjlhYjAzYzEuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2NsaWVudC1jb3JlL3NyYy91c2VyL2NvbXBvbmVudHMvT2F1dGgvRmFjZWJvb2tDYWxsYmFjay50c3giLCIuLi8uLi9zcmMvcGFnZXMvYXV0aC9vYXV0aC9mYWNlYm9vay50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlTG9jYXRpb24sIHdpdGhSb3V0ZXIgfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJ1xuaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEF1dGhTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vcmVkdWNlcnMvYXV0aC9BdXRoU2VydmljZSdcbmltcG9ydCBDb250YWluZXIgZnJvbSAnQG1hdGVyaWFsLXVpL2NvcmUvQ29udGFpbmVyJ1xuaW1wb3J0IHsgdXNlQXV0aFN0YXRlIH0gZnJvbSAnLi4vLi4vcmVkdWNlcnMvYXV0aC9BdXRoU3RhdGUnXG5pbXBvcnQgeyBiaW5kQWN0aW9uQ3JlYXRvcnMsIERpc3BhdGNoIH0gZnJvbSAncmVkdXgnXG5pbXBvcnQgeyBjb25uZWN0LCB1c2VEaXNwYXRjaCB9IGZyb20gJ3JlYWN0LXJlZHV4J1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0J1xuXG5jb25zdCBtYXBTdGF0ZVRvUHJvcHMgPSAoc3RhdGU6IGFueSk6IGFueSA9PiB7XG4gIHJldHVybiB7fVxufVxuXG5jb25zdCBGYWNlYm9va0NhbGxiYWNrQ29tcG9uZW50ID0gKHByb3BzKTogYW55ID0+IHtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpXG4gIGNvbnN0IGRpc3BhdGNoID0gdXNlRGlzcGF0Y2goKVxuICBjb25zdCBpbml0aWFsU3RhdGUgPSB7IGVycm9yOiAnJywgdG9rZW46ICcnIH1cbiAgY29uc3QgW3N0YXRlLCBzZXRTdGF0ZV0gPSB1c2VTdGF0ZShpbml0aWFsU3RhdGUpXG4gIGNvbnN0IHNlYXJjaCA9IG5ldyBVUkxTZWFyY2hQYXJhbXModXNlTG9jYXRpb24oKS5zZWFyY2gpXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBlcnJvciA9IHNlYXJjaC5nZXQoJ2Vycm9yJykgYXMgc3RyaW5nXG4gICAgY29uc3QgdG9rZW4gPSBzZWFyY2guZ2V0KCd0b2tlbicpIGFzIHN0cmluZ1xuICAgIGNvbnN0IHR5cGUgPSBzZWFyY2guZ2V0KCd0eXBlJykgYXMgc3RyaW5nXG4gICAgY29uc3QgcGF0aCA9IHNlYXJjaC5nZXQoJ3BhdGgnKSBhcyBzdHJpbmdcbiAgICBjb25zdCBpbnN0YW5jZUlkID0gc2VhcmNoLmdldCgnaW5zdGFuY2VJZCcpIGFzIHN0cmluZ1xuXG4gICAgaWYgKCFlcnJvcikge1xuICAgICAgaWYgKHR5cGUgPT09ICdjb25uZWN0aW9uJykge1xuICAgICAgICBjb25zdCB1c2VyID0gdXNlQXV0aFN0YXRlKCkudXNlclxuICAgICAgICBkaXNwYXRjaChBdXRoU2VydmljZS5yZWZyZXNoQ29ubmVjdGlvbnModXNlci5pZC52YWx1ZSkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcmVkaXJlY3RTdWNjZXNzID0gYCR7cGF0aH1gXG4gICAgICAgIGlmIChpbnN0YW5jZUlkICE9IG51bGwpIHJlZGlyZWN0U3VjY2VzcyArPSBgP2luc3RhbmNlSWQ9JHtpbnN0YW5jZUlkfWBcbiAgICAgICAgZGlzcGF0Y2goQXV0aFNlcnZpY2UubG9naW5Vc2VyQnlKd3QodG9rZW4sIHJlZGlyZWN0U3VjY2VzcyB8fCAnLycsICcvJykpXG4gICAgICB9XG4gICAgfVxuXG4gICAgc2V0U3RhdGUoeyAuLi5zdGF0ZSwgZXJyb3IsIHRva2VuIH0pXG4gIH0sIFtdKVxuXG4gIHJldHVybiBzdGF0ZS5lcnJvciAmJiBzdGF0ZS5lcnJvciAhPT0gJycgPyAoXG4gICAgPENvbnRhaW5lcj5cbiAgICAgIHt0KCd1c2VyOm9hdXRoLmF1dGhGYWlsZWQnLCB7IHNlcnZpY2U6ICdGYWNlYm9vaycgfSl9XG4gICAgICA8YnIgLz5cbiAgICAgIHtzdGF0ZS5lcnJvcn1cbiAgICA8L0NvbnRhaW5lcj5cbiAgKSA6IChcbiAgICA8Q29udGFpbmVyPnt0KCd1c2VyOm9hdXRoLmF1dGhlbnRpY2F0aW5nJyl9PC9Db250YWluZXI+XG4gIClcbn1cblxuZXhwb3J0IGNvbnN0IEZhY2Vib29rQ2FsbGJhY2sgPSB3aXRoUm91dGVyKEZhY2Vib29rQ2FsbGJhY2tDb21wb25lbnQpIGFzIGFueVxuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgRmFjZWJvb2tDYWxsYmFjayB9IGZyb20gJ0B4cmVuZ2luZS9jbGllbnQtY29yZS9zcmMvdXNlci9jb21wb25lbnRzL09hdXRoL0ZhY2Vib29rQ2FsbGJhY2snXG5cbmV4cG9ydCBjb25zdCBGYWNlYm9va0hvbWVQYWdlID0gKCkgPT4gPEZhY2Vib29rQ2FsbGJhY2sgLz5cblxuZXhwb3J0IGRlZmF1bHQgRmFjZWJvb2tIb21lUGFnZVxuIl0sIm5hbWVzIjpbInVzZVN0YXRlIl0sIm1hcHBpbmdzIjoidVpBYUEsS0FBTSxHQUE0QixBQUFDLEdBQWUsTUFDMUMsQ0FBRSxLQUFNLElBQ1IsRUFBVyxJQUNYLEVBQWUsQ0FBRSxNQUFPLEdBQUksTUFBTyxJQUNuQyxDQUFDLEVBQU8sR0FBWUEsbUJBQVMsR0FDN0IsRUFBUyxHQUFJLGlCQUFnQixJQUFjLG1DQUV2QyxJQUFNLE1BQ1IsR0FBUSxFQUFPLElBQUksU0FDbkIsRUFBUSxFQUFPLElBQUksU0FDbkIsRUFBTyxFQUFPLElBQUksUUFDbEIsRUFBTyxFQUFPLElBQUksUUFDbEIsRUFBYSxFQUFPLElBQUksaUJBRTFCLENBQUMsS0FDQyxJQUFTLGFBQWMsTUFDbkIsR0FBTyxJQUFlLE9BQ25CLEVBQVksbUJBQW1CLEVBQUssR0FBRyxZQUMzQyxJQUNELEdBQWtCLEdBQUcsSUFDckIsR0FBYyxVQUF5QixlQUFlLE9BQ2pELEVBQVksZUFBZSxFQUFPLEdBQW1CLElBQUssUUFJOUQsSUFBSyxFQUFPLFFBQU8sV0FDM0IsSUFFSSxFQUFNLE9BQVMsRUFBTSxRQUFVLG1CQUNuQyxFQUFELEtBQ0csRUFBRSx3QkFBeUIsQ0FBRSxRQUFTLDZCQUN0QyxLQUFELE1BQ0MsRUFBTSx1QkFHUixFQUFELEtBQVksRUFBRSwrQkFJTCxFQUFtQixFQUFXLEdDakQ5QixFQUFtQixvQkFBTyxFQUFEIn0=
