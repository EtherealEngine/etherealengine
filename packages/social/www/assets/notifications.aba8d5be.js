import{u as n,R as t,r as f}from"./vendor.475cb2ff.js";import{A as d}from"./index.e9ab7b95.js";import{f as p,a as u}from"./_app.f0a72417.js";import{C as v}from"./CreatorService.46518bb7.js";import{C,a as j}from"./CardContent.1f497982.js";import{A as c}from"./Avatar.7391d47d.js";import{T as m}from"./Typography.19cbe78d.js";import{A as b}from"./index.07b783b7.js";import{s as _}from"./index.module.bb0750b5.js";import"./PopupsStateService.a3af5f05.js";import"./AlertService.5d8abaff.js";import"./index.7b02be28.js";import"./Slide.a5edb72c.js";import"./capitalize.fc001633.js";import"./ownerWindow.3d7152ce.js";import"./ButtonBase.fb193a96.js";import"./Modal.58912532.js";import"./Dialog.016d78d4.js";import"./Backdrop.724616ec.js";import"./Button.a7dce846.js";import"./feathers.32f4d4e8.js";import"./upload.bd537b46.js";import"./createSvgIcon.896642b4.js";const h="_commentItem_1voii_1",y="_commentCard_1voii_10",E="_flamesCount_1voii_13";var a={commentItem:h,commentCard:y,flamesCount:E};const N=({notification:e})=>{const r=p(),{t:o}=n(),s=i=>{switch(i){case"feed-fire":return o("social:notification.feedFire");case"feed-bookmark":return o("social:notification.feedBookmarked");case"comment":return o("social:notification.comment");case"comment-fire":return o("social:notification.commentFire");case"follow":return o("social:notification.follow");case"unfollow":return o("social:notification.unfollow");default:return o("social:notification.followed")}};return t.createElement(C,{className:a.commentItem,square:!1,elevation:0,key:e.id},t.createElement(c,{onClick:()=>r.push("/creator?creatorId="+e.creatorAuthorId),className:a.authorAvatar,src:e.avatar}),t.createElement(j,{className:a.commentCard},t.createElement(m,{variant:"h2"},e.creator_username,s(e.type),e.comment_text&&' "'+e.comment_text+'"')),e.type!=="follow"&&e.type!=="unfollow"&&t.createElement("section",{className:a.fire},t.createElement(c,{variant:"rounded",onClick:()=>r.push("/feed?feedId="+e.feedId),className:a.authorAvatar,src:e.previewUrl})))},w="_commentsContainer_29854_1";var A={commentsContainer:w};const k=({creatorsState:e})=>{const{t:r}=n(),o=u();f.exports.useEffect(()=>{o(v.getCreatorNotificationList())},[]);const s=e&&e.creators?e.currentCreatorNotifications:null;return t.createElement("section",{className:A.notificationsContainer},t.createElement(m,{variant:"h2"},r("social:notification.activity")),s&&s.map((i,l)=>t.createElement(N,{key:l,notification:i})))};var I=k;function X(){return t.createElement("div",{className:_.viewport},t.createElement(b,null),t.createElement(I,null),t.createElement(d,null))}export{X as default};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9ucy5hYmE4ZDViZS5qcyIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbXBvbmVudHMvTm90aWZpY2F0aW9uQ2FyZC9pbmRleC50c3giLCIuLi8uLi9zcmMvY29tcG9uZW50cy9Ob3RpZmljYXRpb25MaXN0L2luZGV4LnRzeCIsIi4uLy4uL3NyYy9wYWdlcy9ub3RpZmljYXRpb25zLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBhdXRob3IgVGFueWEgVnlrbGl1ayA8dGFueWEudnlrbGl1a0BnbWFpbC5jb20+XG4gKi9cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUhpc3RvcnkgfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJ1xuaW1wb3J0IFR5cG9ncmFwaHkgZnJvbSAnQG1hdGVyaWFsLXVpL2NvcmUvVHlwb2dyYXBoeSdcbmltcG9ydCBBdmF0YXIgZnJvbSAnQG1hdGVyaWFsLXVpL2NvcmUvQXZhdGFyJ1xuaW1wb3J0IENhcmQgZnJvbSAnQG1hdGVyaWFsLXVpL2NvcmUvQ2FyZCdcbmltcG9ydCBDYXJkQ29udGVudCBmcm9tICdAbWF0ZXJpYWwtdWkvY29yZS9DYXJkQ29udGVudCdcbmltcG9ydCBzdHlsZXMgZnJvbSAnLi9Ob3RpZmljYXRpb25DYXJkLm1vZHVsZS5zY3NzJ1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0J1xuXG5jb25zdCBOb3RpZmljYXRpb25DYXJkID0gKHsgbm90aWZpY2F0aW9uIH06IGFueSkgPT4ge1xuICBjb25zdCBoaXN0b3J5ID0gdXNlSGlzdG9yeSgpXG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKVxuICBjb25zdCBjaGVja05vdGlmaWNhdGlvbkFjdGlvbiA9ICh0eXBlKSA9PiB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdmZWVkLWZpcmUnOlxuICAgICAgICByZXR1cm4gdCgnc29jaWFsOm5vdGlmaWNhdGlvbi5mZWVkRmlyZScpXG4gICAgICBjYXNlICdmZWVkLWJvb2ttYXJrJzpcbiAgICAgICAgcmV0dXJuIHQoJ3NvY2lhbDpub3RpZmljYXRpb24uZmVlZEJvb2ttYXJrZWQnKVxuICAgICAgY2FzZSAnY29tbWVudCc6XG4gICAgICAgIHJldHVybiB0KCdzb2NpYWw6bm90aWZpY2F0aW9uLmNvbW1lbnQnKVxuICAgICAgY2FzZSAnY29tbWVudC1maXJlJzpcbiAgICAgICAgcmV0dXJuIHQoJ3NvY2lhbDpub3RpZmljYXRpb24uY29tbWVudEZpcmUnKVxuICAgICAgY2FzZSAnZm9sbG93JzpcbiAgICAgICAgcmV0dXJuIHQoJ3NvY2lhbDpub3RpZmljYXRpb24uZm9sbG93JylcbiAgICAgIGNhc2UgJ3VuZm9sbG93JzpcbiAgICAgICAgcmV0dXJuIHQoJ3NvY2lhbDpub3RpZmljYXRpb24udW5mb2xsb3cnKVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHQoJ3NvY2lhbDpub3RpZmljYXRpb24uZm9sbG93ZWQnKVxuICAgIH1cbiAgfVxuICByZXR1cm4gKFxuICAgIDxDYXJkIGNsYXNzTmFtZT17c3R5bGVzLmNvbW1lbnRJdGVtfSBzcXVhcmU9e2ZhbHNlfSBlbGV2YXRpb249ezB9IGtleT17bm90aWZpY2F0aW9uLmlkfT5cbiAgICAgIDxBdmF0YXJcbiAgICAgICAgb25DbGljaz17KCkgPT4gaGlzdG9yeS5wdXNoKCcvY3JlYXRvcj9jcmVhdG9ySWQ9JyArIG5vdGlmaWNhdGlvbi5jcmVhdG9yQXV0aG9ySWQpfVxuICAgICAgICBjbGFzc05hbWU9e3N0eWxlcy5hdXRob3JBdmF0YXJ9XG4gICAgICAgIHNyYz17bm90aWZpY2F0aW9uLmF2YXRhcn1cbiAgICAgIC8+XG4gICAgICA8Q2FyZENvbnRlbnQgY2xhc3NOYW1lPXtzdHlsZXMuY29tbWVudENhcmR9PlxuICAgICAgICA8VHlwb2dyYXBoeSB2YXJpYW50PVwiaDJcIj5cbiAgICAgICAgICB7bm90aWZpY2F0aW9uLmNyZWF0b3JfdXNlcm5hbWV9XG4gICAgICAgICAge2NoZWNrTm90aWZpY2F0aW9uQWN0aW9uKG5vdGlmaWNhdGlvbi50eXBlKX1cbiAgICAgICAgICB7bm90aWZpY2F0aW9uLmNvbW1lbnRfdGV4dCAmJiAnIFwiJyArIG5vdGlmaWNhdGlvbi5jb21tZW50X3RleHQgKyAnXCInfVxuICAgICAgICA8L1R5cG9ncmFwaHk+XG4gICAgICA8L0NhcmRDb250ZW50PlxuICAgICAge25vdGlmaWNhdGlvbi50eXBlICE9PSAnZm9sbG93JyAmJiBub3RpZmljYXRpb24udHlwZSAhPT0gJ3VuZm9sbG93JyAmJiAoXG4gICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT17c3R5bGVzLmZpcmV9PlxuICAgICAgICAgIDxBdmF0YXJcbiAgICAgICAgICAgIHZhcmlhbnQ9XCJyb3VuZGVkXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhpc3RvcnkucHVzaCgnL2ZlZWQ/ZmVlZElkPScgKyBub3RpZmljYXRpb24uZmVlZElkKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17c3R5bGVzLmF1dGhvckF2YXRhcn1cbiAgICAgICAgICAgIHNyYz17bm90aWZpY2F0aW9uLnByZXZpZXdVcmx9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgKX1cbiAgICA8L0NhcmQ+XG4gIClcbn1cblxuZXhwb3J0IGRlZmF1bHQgTm90aWZpY2F0aW9uQ2FyZFxuIiwiLyoqXG4gKiBAYXV0aG9yIFRhbnlhIFZ5a2xpdWsgPHRhbnlhLnZ5a2xpdWtAZ21haWwuY29tPlxuICovXG5pbXBvcnQgVHlwb2dyYXBoeSBmcm9tICdAbWF0ZXJpYWwtdWkvY29yZS9UeXBvZ3JhcGh5J1xuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgY29ubmVjdCwgdXNlRGlzcGF0Y2ggfSBmcm9tICdyZWFjdC1yZWR1eCdcbmltcG9ydCB7IGJpbmRBY3Rpb25DcmVhdG9ycywgRGlzcGF0Y2ggfSBmcm9tICdyZWR1eCdcbmltcG9ydCB7IHVzZUNyZWF0b3JTdGF0ZSB9IGZyb20gJ0B4cmVuZ2luZS9jbGllbnQtY29yZS9zcmMvc29jaWFsL3JlZHVjZXJzL2NyZWF0b3IvQ3JlYXRvclN0YXRlJ1xuaW1wb3J0IHsgQ3JlYXRvclNlcnZpY2UgfSBmcm9tICdAeHJlbmdpbmUvY2xpZW50LWNvcmUvc3JjL3NvY2lhbC9yZWR1Y2Vycy9jcmVhdG9yL0NyZWF0b3JTZXJ2aWNlJ1xuaW1wb3J0IE5vdGlmaWNhdGlvbkNhcmQgZnJvbSAnLi4vTm90aWZpY2F0aW9uQ2FyZCdcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCdcblxuaW1wb3J0IHN0eWxlcyBmcm9tICcuL05vdGlmaWNhdGlvbkxpc3QubW9kdWxlLnNjc3MnXG5cbmludGVyZmFjZSBQcm9wcyB7XG4gIGNyZWF0b3JzU3RhdGU/OiBhbnlcbn1cbmNvbnN0IE5vdGlmaWNhdGlvbkxpc3QgPSAoeyBjcmVhdG9yc1N0YXRlIH06IFByb3BzKSA9PiB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKVxuICBjb25zdCBkaXNwYXRjaCA9IHVzZURpc3BhdGNoKClcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGRpc3BhdGNoKENyZWF0b3JTZXJ2aWNlLmdldENyZWF0b3JOb3RpZmljYXRpb25MaXN0KCkpXG4gIH0sIFtdKVxuICBjb25zdCBub3RpZmljYXRpb25MaXN0ID0gY3JlYXRvcnNTdGF0ZSAmJiBjcmVhdG9yc1N0YXRlLmNyZWF0b3JzID8gY3JlYXRvcnNTdGF0ZS5jdXJyZW50Q3JlYXRvck5vdGlmaWNhdGlvbnMgOiBudWxsXG4gIHJldHVybiAoXG4gICAgPHNlY3Rpb24gY2xhc3NOYW1lPXtzdHlsZXMubm90aWZpY2F0aW9uc0NvbnRhaW5lcn0+XG4gICAgICA8VHlwb2dyYXBoeSB2YXJpYW50PVwiaDJcIj57dCgnc29jaWFsOm5vdGlmaWNhdGlvbi5hY3Rpdml0eScpfTwvVHlwb2dyYXBoeT5cbiAgICAgIHtub3RpZmljYXRpb25MaXN0ICYmIG5vdGlmaWNhdGlvbkxpc3QubWFwKChpdGVtLCBrZXkpID0+IDxOb3RpZmljYXRpb25DYXJkIGtleT17a2V5fSBub3RpZmljYXRpb249e2l0ZW19IC8+KX1cbiAgICA8L3NlY3Rpb24+XG4gIClcbn1cblxuZXhwb3J0IGRlZmF1bHQgTm90aWZpY2F0aW9uTGlzdFxuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuXG5pbXBvcnQgQXBwRm9vdGVyIGZyb20gJ0B4cmVuZ2luZS9zb2NpYWwvc3JjL2NvbXBvbmVudHMvRm9vdGVyJ1xuaW1wb3J0IE5vdGlmaWNhdGlvbkxpc3QgZnJvbSAnQHhyZW5naW5lL3NvY2lhbC9zcmMvY29tcG9uZW50cy9Ob3RpZmljYXRpb25MaXN0J1xuaW1wb3J0IEFwcEhlYWRlciBmcm9tICdAeHJlbmdpbmUvc29jaWFsL3NyYy9jb21wb25lbnRzL0hlYWRlcidcblxuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHN0eWxlcyBmcm9tICcuL2luZGV4Lm1vZHVsZS5zY3NzJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBOb3RpZmljYXRpb25zUGFnZSgpIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnZpZXdwb3J0fT5cbiAgICAgIDxBcHBIZWFkZXIgLz5cbiAgICAgIDxOb3RpZmljYXRpb25MaXN0IC8+XG4gICAgICA8QXBwRm9vdGVyIC8+XG4gICAgPC9kaXY+XG4gIClcbn1cbiJdLCJuYW1lcyI6WyJzdHlsZXMiLCJOb3RpZmljYXRpb25MaXN0Il0sIm1hcHBpbmdzIjoiNjlCQVlBLEtBQU0sR0FBbUIsQ0FBQyxDQUFFLGtCQUF3QixNQUM1QyxHQUFVLElBQ1YsQ0FBRSxLQUFNLElBQ1IsRUFBMEIsQUFBQyxHQUFTLFFBQ2hDLE9BQ0Qsa0JBQ0ksR0FBRSxvQ0FDTixzQkFDSSxHQUFFLDBDQUNOLGdCQUNJLEdBQUUsbUNBQ04scUJBQ0ksR0FBRSx1Q0FDTixlQUNJLEdBQUUsa0NBQ04saUJBQ0ksR0FBRSw4Q0FFRixHQUFFLHlEQUlaLEVBQUQsQ0FBTSxVQUFXQSxFQUFPLFlBQWEsT0FBUSxHQUFPLFVBQVcsRUFBRyxJQUFLLEVBQWEsb0JBQ2pGLEVBQUQsQ0FDRSxRQUFTLElBQU0sRUFBUSxLQUFLLHNCQUF3QixFQUFhLGlCQUNqRSxVQUFXQSxFQUFPLGFBQ2xCLElBQUssRUFBYSx5QkFFbkIsRUFBRCxDQUFhLFVBQVdBLEVBQU8sNkJBQzVCLEVBQUQsQ0FBWSxRQUFRLE1BQ2pCLEVBQWEsaUJBQ2IsRUFBd0IsRUFBYSxNQUNyQyxFQUFhLGNBQWdCLEtBQU8sRUFBYSxhQUFlLE1BR3BFLEVBQWEsT0FBUyxVQUFZLEVBQWEsT0FBUyw0QkFDdEQsVUFBRCxDQUFTLFVBQVdBLEVBQU8sc0JBQ3hCLEVBQUQsQ0FDRSxRQUFRLFVBQ1IsUUFBUyxJQUFNLEVBQVEsS0FBSyxnQkFBa0IsRUFBYSxRQUMzRCxVQUFXQSxFQUFPLGFBQ2xCLElBQUssRUFBYSwyRUNwQzlCLEtBQU0sR0FBbUIsQ0FBQyxDQUFFLG1CQUEyQixNQUMvQyxDQUFFLEtBQU0sSUFDUixFQUFXLHdCQUVQLElBQU0sR0FDTCxFQUFlLCtCQUN2QixTQUNHLEdBQW1CLEdBQWlCLEVBQWMsU0FBVyxFQUFjLDRCQUE4Qiw0QkFFNUcsVUFBRCxDQUFTLFVBQVcsRUFBTyx3Q0FDeEIsRUFBRCxDQUFZLFFBQVEsTUFBTSxFQUFFLGlDQUMzQixHQUFvQixFQUFpQixJQUFJLENBQUMsRUFBTSxvQkFBUyxFQUFELENBQWtCLE1BQVUsYUFBYyxPQUt6RyxNQUFlLGNDeEI2Qix3QkFFdkMsTUFBRCxDQUFLLFVBQVdBLEVBQU8sMEJBQ3BCLEVBQUQsc0JBQ0NDLEVBQUQsc0JBQ0MsRUFBRCJ9
