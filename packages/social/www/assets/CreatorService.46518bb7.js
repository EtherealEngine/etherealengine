import{A as c}from"./AlertService.5d8abaff.js";import{c as s}from"./feathers.32f4d4e8.js";import{u}from"./upload.bd537b46.js";import{q as l}from"./_app.f0a72417.js";const o={setStateCreators:r=>({type:"SET_STATE_CREATORS",splashTimeout:r}),creatorLoggedRetrieved:r=>({type:"CURRENT_CREATOR_RETRIEVED",creator:r}),creatorRetrieved:r=>({type:"CREATOR_RETRIEVED",creator:r}),fetchingCreators:()=>({type:"CREATORS_FETCH"}),fetchingCurrentCreator:()=>({type:"CURRENT_CREATOR_FETCH"}),fetchingCreator:()=>({type:"CREATOR_FETCH"}),creatorsRetrieved:r=>({type:"CREATORS_RETRIEVED",creators:r}),creatorNotificationList:r=>({type:"CREATOR_NOTIFICATION_LIST_RETRIEVED",notifications:r}),updateCreatorAsFollowed:()=>({type:"SET_CREATOR_AS_FOLLOWED"}),updateCreatorNotFollowed:()=>({type:"SET_CREATOR_NOT_FOLLOWED"}),updateCreatorAsBlocked:r=>({type:"SET_CREATOR_AS_BLOCKED",creatorId:r}),updateCreatorAsUnBlocked:r=>({type:"SET_CREATOR_AS_UN_BLOCKED",blokedCreatorId:r}),creatorBlockedUsers:r=>({type:"CREATOR_BLOCKED_RETRIEVED",creators:r}),creatorFollowers:r=>({type:"CREATOR_FOLLOWERS_RETRIEVED",creators:r}),creatorFollowing:r=>({type:"CREATOR_FOLLOWING_RETRIEVED",creators:r})},i={createCreator:r=>async(e,t)=>{try{e(o.fetchingCurrentCreator());let a=Math.floor(Math.random()*1e3)+1,n=r??{name:r?.name||"User"+a,username:r?.username||"user_"+a};const E=await s.service("creator").create(n);e(o.creatorLoggedRetrieved(E))}catch(a){console.log(a),c.dispatchAlertError(e,a.message)}},getLoggedCreator:()=>async r=>{try{r(o.fetchingCurrentCreator());const e=await s.service("creator").find({query:{action:"current"}});r(o.creatorLoggedRetrieved(e))}catch(e){console.log(e),c.dispatchAlertError(r,e.message)}},getCreators:r=>async(e,t)=>{try{e(o.fetchingCreators());const a=await s.service("creator").find({query:{}});e(o.creatorsRetrieved(a))}catch(a){console.log(a),c.dispatchAlertError(e,a.message)}},getCreator:r=>async e=>{try{e(o.fetchingCreator());const t=await s.service("creator").get(r);e(o.creatorRetrieved(t))}catch(t){console.log(t),c.dispatchAlertError(e,t.message)}},updateCreator:(r,e)=>async t=>{try{if(t(o.fetchingCurrentCreator()),r.newAvatar){const n=await u(r.newAvatar,null);r.avatarId=n.file_id,delete r.newAvatar}const a=await s.service("creator").patch(r.id,r);a&&(t(o.creatorLoggedRetrieved(a)),e&&e("succes"))}catch(a){console.log(a),c.dispatchAlertError(t,a.message),e&&e(a.message)}},getCreatorNotificationList:()=>async r=>{try{r(o.fetchingCreator());const e=await s.service("notifications").find({query:{action:"byCurrentCreator"}});r(o.creatorNotificationList(e))}catch(e){console.log(e),c.dispatchAlertError(r,e.message)}},followCreator:r=>async e=>{try{await s.service("follow-creator").create({creatorId:r})&&e(o.updateCreatorAsFollowed())}catch(t){console.log(t),c.dispatchAlertError(e,t.message)}},unFollowCreator:r=>async e=>{try{await s.service("follow-creator").remove(r)&&e(o.updateCreatorNotFollowed())}catch(t){console.log(t),c.dispatchAlertError(e,t.message)}},blockCreator:r=>async e=>{try{await s.service("block-creator").create({creatorId:r})&&e(o.updateCreatorAsBlocked(r))}catch(t){console.log(t),c.dispatchAlertError(e,t.message)}},unBlockCreator:r=>async e=>{try{const t=await s.service("block-creator").remove({blokedCreatorId:r});t&&(l(i.getBlockedList,e)(t),l(i.getCreators,e)())}catch(t){console.log(t),c.dispatchAlertError(e,t.message)}},getBlockedList:r=>async e=>{try{const t=await s.service("block-creator").find({query:{action:"blocked",creatorId:r}});e(o.creatorBlockedUsers(t.data))}catch(t){console.log(t),c.dispatchAlertError(e,t.message)}},getFollowersList:r=>async e=>{try{const t=await s.service("follow-creator").find({query:{action:"followers",creatorId:r}});e(o.creatorFollowers(t.data))}catch(t){console.log(t),c.dispatchAlertError(e,t.message)}},getFollowingList:r=>async e=>{try{const t=await s.service("follow-creator").find({query:{action:"following",creatorId:r}});e(o.creatorFollowing(t.data))}catch(t){console.log(t),c.dispatchAlertError(e,t.message)}}};export{i as C,o as a};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3JlYXRvclNlcnZpY2UuNDY1MThiYjcuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2NsaWVudC1jb3JlL3NyYy9zb2NpYWwvcmVkdWNlcnMvY3JlYXRvci9DcmVhdG9yQWN0aW9ucy50cyIsIi4uLy4uLy4uL2NsaWVudC1jb3JlL3NyYy9zb2NpYWwvcmVkdWNlcnMvY3JlYXRvci9DcmVhdG9yU2VydmljZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBhdXRob3IgVGFueWEgVnlrbGl1ayA8dGFueWEudnlrbGl1a0BnbWFpbC5jb20+XG4gKi9cblxuaW1wb3J0IHsgQ3JlYXRvciwgQ3JlYXRvclNob3J0LCBDcmVhdG9yTm90aWZpY2F0aW9uIH0gZnJvbSAnQHhyZW5naW5lL2NvbW1vbi9zcmMvaW50ZXJmYWNlcy9DcmVhdG9yJ1xuXG5leHBvcnQgY29uc3QgQ3JlYXRvckFjdGlvbiA9IHtcbiAgc2V0U3RhdGVDcmVhdG9yczogKHNwbGFzaFRpbWVvdXQ6IGJvb2xlYW4pID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ1NFVF9TVEFURV9DUkVBVE9SUycgYXMgY29uc3QsXG4gICAgICBzcGxhc2hUaW1lb3V0XG4gICAgfVxuICB9LFxuICBjcmVhdG9yTG9nZ2VkUmV0cmlldmVkOiAoY3JlYXRvcjogQ3JlYXRvcikgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnQ1VSUkVOVF9DUkVBVE9SX1JFVFJJRVZFRCcgYXMgY29uc3QsXG4gICAgICBjcmVhdG9yXG4gICAgfVxuICB9LFxuICBjcmVhdG9yUmV0cmlldmVkOiAoY3JlYXRvcjogQ3JlYXRvcikgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnQ1JFQVRPUl9SRVRSSUVWRUQnIGFzIGNvbnN0LFxuICAgICAgY3JlYXRvclxuICAgIH1cbiAgfSxcbiAgZmV0Y2hpbmdDcmVhdG9yczogKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnQ1JFQVRPUlNfRkVUQ0gnIGFzIGNvbnN0XG4gICAgfVxuICB9LFxuICBmZXRjaGluZ0N1cnJlbnRDcmVhdG9yOiAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdDVVJSRU5UX0NSRUFUT1JfRkVUQ0gnIGFzIGNvbnN0XG4gICAgfVxuICB9LFxuICBmZXRjaGluZ0NyZWF0b3I6ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ0NSRUFUT1JfRkVUQ0gnIGFzIGNvbnN0XG4gICAgfVxuICB9LFxuICBjcmVhdG9yc1JldHJpZXZlZDogKGNyZWF0b3JzOiBDcmVhdG9yU2hvcnRbXSkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnQ1JFQVRPUlNfUkVUUklFVkVEJyBhcyBjb25zdCxcbiAgICAgIGNyZWF0b3JzXG4gICAgfVxuICB9LFxuICBjcmVhdG9yTm90aWZpY2F0aW9uTGlzdDogKG5vdGlmaWNhdGlvbnM6IENyZWF0b3JOb3RpZmljYXRpb25bXSkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnQ1JFQVRPUl9OT1RJRklDQVRJT05fTElTVF9SRVRSSUVWRUQnIGFzIGNvbnN0LFxuICAgICAgbm90aWZpY2F0aW9uc1xuICAgIH1cbiAgfSxcbiAgdXBkYXRlQ3JlYXRvckFzRm9sbG93ZWQ6ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ1NFVF9DUkVBVE9SX0FTX0ZPTExPV0VEJyBhcyBjb25zdFxuICAgIH1cbiAgfSxcbiAgdXBkYXRlQ3JlYXRvck5vdEZvbGxvd2VkOiAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdTRVRfQ1JFQVRPUl9OT1RfRk9MTE9XRUQnIGFzIGNvbnN0XG4gICAgfVxuICB9LFxuICB1cGRhdGVDcmVhdG9yQXNCbG9ja2VkOiAoY3JlYXRvcklkOiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ1NFVF9DUkVBVE9SX0FTX0JMT0NLRUQnIGFzIGNvbnN0LFxuICAgICAgY3JlYXRvcklkXG4gICAgfVxuICB9LFxuICB1cGRhdGVDcmVhdG9yQXNVbkJsb2NrZWQ6IChibG9rZWRDcmVhdG9ySWQ6IHN0cmluZykgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnU0VUX0NSRUFUT1JfQVNfVU5fQkxPQ0tFRCcgYXMgY29uc3QsXG4gICAgICBibG9rZWRDcmVhdG9ySWRcbiAgICB9XG4gIH0sXG4gIGNyZWF0b3JCbG9ja2VkVXNlcnM6IChjcmVhdG9yczogQ3JlYXRvclNob3J0W10pID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ0NSRUFUT1JfQkxPQ0tFRF9SRVRSSUVWRUQnIGFzIGNvbnN0LFxuICAgICAgY3JlYXRvcnNcbiAgICB9XG4gIH0sXG4gIGNyZWF0b3JGb2xsb3dlcnM6IChjcmVhdG9yczogQ3JlYXRvclNob3J0W10pID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ0NSRUFUT1JfRk9MTE9XRVJTX1JFVFJJRVZFRCcgYXMgY29uc3QsXG4gICAgICBjcmVhdG9yc1xuICAgIH1cbiAgfSxcbiAgY3JlYXRvckZvbGxvd2luZzogKGNyZWF0b3JzOiBDcmVhdG9yU2hvcnRbXSkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnQ1JFQVRPUl9GT0xMT1dJTkdfUkVUUklFVkVEJyBhcyBjb25zdCxcbiAgICAgIGNyZWF0b3JzXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCB0eXBlIENyZWF0b3JBY3Rpb25UeXBlID0gUmV0dXJuVHlwZTx0eXBlb2YgQ3JlYXRvckFjdGlvbltrZXlvZiB0eXBlb2YgQ3JlYXRvckFjdGlvbl0+XG4iLCIvKipcbiAqIEBhdXRob3IgVGFueWEgVnlrbGl1ayA8dGFueWEudnlrbGl1a0BnbWFpbC5jb20+XG4gKi9cbmltcG9ydCB7IEFsZXJ0U2VydmljZSB9IGZyb20gJy4uLy4uLy4uL2NvbW1vbi9yZWR1Y2Vycy9hbGVydC9BbGVydFNlcnZpY2UnXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tICcuLi8uLi8uLi9mZWF0aGVycydcbmltcG9ydCB7IENyZWF0b3IgfSBmcm9tICdAeHJlbmdpbmUvY29tbW9uL3NyYy9pbnRlcmZhY2VzL0NyZWF0b3InXG5pbXBvcnQgeyB1cGxvYWQgfSBmcm9tICdAeHJlbmdpbmUvZW5naW5lL3NyYy9zY2VuZS9mdW5jdGlvbnMvdXBsb2FkJ1xuaW1wb3J0IHsgRGlzcGF0Y2gsIGJpbmRBY3Rpb25DcmVhdG9ycyB9IGZyb20gJ3JlZHV4J1xuXG5pbXBvcnQgeyBDcmVhdG9yQWN0aW9uIH0gZnJvbSAnLi9DcmVhdG9yQWN0aW9ucydcblxuZXhwb3J0IGNvbnN0IENyZWF0b3JTZXJ2aWNlID0ge1xuICBjcmVhdGVDcmVhdG9yOiAoY3JlYXRvcj86IENyZWF0b3IpID0+IHtcbiAgICByZXR1cm4gYXN5bmMgKGRpc3BhdGNoOiBEaXNwYXRjaCwgZ2V0U3RhdGU6IGFueSk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBkaXNwYXRjaChDcmVhdG9yQWN0aW9uLmZldGNoaW5nQ3VycmVudENyZWF0b3IoKSlcbiAgICAgICAgbGV0IHVzZXJOdW1iZXIgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwKSArIDFcblxuICAgICAgICBsZXQgY3JlYXRvckluZm8gPVxuICAgICAgICAgIGNyZWF0b3IgIT0gbnVsbFxuICAgICAgICAgICAgPyBjcmVhdG9yXG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBjcmVhdG9yPy5uYW1lIHx8ICdVc2VyJyArIHVzZXJOdW1iZXIsXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IGNyZWF0b3I/LnVzZXJuYW1lIHx8ICd1c2VyXycgKyB1c2VyTnVtYmVyXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICBjb25zdCBjcmVhdG9yUmVzcG9uc2UgPSBhd2FpdCBjbGllbnQuc2VydmljZSgnY3JlYXRvcicpLmNyZWF0ZShjcmVhdG9ySW5mbylcbiAgICAgICAgZGlzcGF0Y2goQ3JlYXRvckFjdGlvbi5jcmVhdG9yTG9nZ2VkUmV0cmlldmVkKGNyZWF0b3JSZXNwb25zZSkpXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICBBbGVydFNlcnZpY2UuZGlzcGF0Y2hBbGVydEVycm9yKGRpc3BhdGNoLCBlcnIubWVzc2FnZSlcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGdldExvZ2dlZENyZWF0b3I6ICgpID0+IHtcbiAgICByZXR1cm4gYXN5bmMgKGRpc3BhdGNoOiBEaXNwYXRjaCk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBkaXNwYXRjaChDcmVhdG9yQWN0aW9uLmZldGNoaW5nQ3VycmVudENyZWF0b3IoKSlcbiAgICAgICAgY29uc3QgY3JlYXRvciA9IGF3YWl0IGNsaWVudC5zZXJ2aWNlKCdjcmVhdG9yJykuZmluZCh7IHF1ZXJ5OiB7IGFjdGlvbjogJ2N1cnJlbnQnIH0gfSlcbiAgICAgICAgZGlzcGF0Y2goQ3JlYXRvckFjdGlvbi5jcmVhdG9yTG9nZ2VkUmV0cmlldmVkKGNyZWF0b3IpKVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgQWxlcnRTZXJ2aWNlLmRpc3BhdGNoQWxlcnRFcnJvcihkaXNwYXRjaCwgZXJyLm1lc3NhZ2UpXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBnZXRDcmVhdG9yczogKGxpbWl0PzogbnVtYmVyKSA9PiB7XG4gICAgcmV0dXJuIGFzeW5jIChkaXNwYXRjaDogRGlzcGF0Y2gsIGdldFN0YXRlOiBhbnkpOiBQcm9taXNlPGFueT4gPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZGlzcGF0Y2goQ3JlYXRvckFjdGlvbi5mZXRjaGluZ0NyZWF0b3JzKCkpXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBjbGllbnQuc2VydmljZSgnY3JlYXRvcicpLmZpbmQoeyBxdWVyeToge30gfSlcbiAgICAgICAgZGlzcGF0Y2goQ3JlYXRvckFjdGlvbi5jcmVhdG9yc1JldHJpZXZlZChyZXN1bHRzKSlcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgIEFsZXJ0U2VydmljZS5kaXNwYXRjaEFsZXJ0RXJyb3IoZGlzcGF0Y2gsIGVyci5tZXNzYWdlKVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZ2V0Q3JlYXRvcjogKGNyZWF0b3JJZCkgPT4ge1xuICAgIHJldHVybiBhc3luYyAoZGlzcGF0Y2g6IERpc3BhdGNoKTogUHJvbWlzZTxhbnk+ID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRpc3BhdGNoKENyZWF0b3JBY3Rpb24uZmV0Y2hpbmdDcmVhdG9yKCkpXG4gICAgICAgIGNvbnN0IGNyZWF0b3IgPSBhd2FpdCBjbGllbnQuc2VydmljZSgnY3JlYXRvcicpLmdldChjcmVhdG9ySWQpXG4gICAgICAgIGRpc3BhdGNoKENyZWF0b3JBY3Rpb24uY3JlYXRvclJldHJpZXZlZChjcmVhdG9yKSlcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgIEFsZXJ0U2VydmljZS5kaXNwYXRjaEFsZXJ0RXJyb3IoZGlzcGF0Y2gsIGVyci5tZXNzYWdlKVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgdXBkYXRlQ3JlYXRvcjogKGNyZWF0b3I6IENyZWF0b3IsIGNhbGxCYWNrPzogRnVuY3Rpb24pID0+IHtcbiAgICByZXR1cm4gYXN5bmMgKGRpc3BhdGNoOiBEaXNwYXRjaCk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBkaXNwYXRjaChDcmVhdG9yQWN0aW9uLmZldGNoaW5nQ3VycmVudENyZWF0b3IoKSlcbiAgICAgICAgaWYgKGNyZWF0b3IubmV3QXZhdGFyKSB7XG4gICAgICAgICAgY29uc3Qgc3RvcmVkQXZhdGFyID0gYXdhaXQgdXBsb2FkKGNyZWF0b3IubmV3QXZhdGFyLCBudWxsKVxuICAgICAgICAgIC8vQHRzLWlnbm9yZSBlcnJvciB0aGF0IHRoaXMgdmFycyBhcmUgdm9pZCBiZWNhdXNlIHVwbG9hZCBpcyBkZWZpbmVzIGFzIHZvaWQgZnVudGlvblxuICAgICAgICAgIGNyZWF0b3IuYXZhdGFySWQgPSBzdG9yZWRBdmF0YXIuZmlsZV9pZFxuICAgICAgICAgIGRlbGV0ZSBjcmVhdG9yLm5ld0F2YXRhclxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHVwZGF0ZWRDcmVhdG9yID0gYXdhaXQgY2xpZW50LnNlcnZpY2UoJ2NyZWF0b3InKS5wYXRjaChjcmVhdG9yLmlkLCBjcmVhdG9yKVxuICAgICAgICBpZiAodXBkYXRlZENyZWF0b3IpIHtcbiAgICAgICAgICBkaXNwYXRjaChDcmVhdG9yQWN0aW9uLmNyZWF0b3JMb2dnZWRSZXRyaWV2ZWQodXBkYXRlZENyZWF0b3IpKVxuICAgICAgICAgIGlmIChjYWxsQmFjaykge1xuICAgICAgICAgICAgY2FsbEJhY2soJ3N1Y2NlcycpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICBBbGVydFNlcnZpY2UuZGlzcGF0Y2hBbGVydEVycm9yKGRpc3BhdGNoLCBlcnIubWVzc2FnZSlcbiAgICAgICAgaWYgKGNhbGxCYWNrKSB7XG4gICAgICAgICAgY2FsbEJhY2soZXJyLm1lc3NhZ2UpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tTk9UIHVzZWQgZm9yIG5vd1xuICBnZXRDcmVhdG9yTm90aWZpY2F0aW9uTGlzdDogKCkgPT4ge1xuICAgIHJldHVybiBhc3luYyAoZGlzcGF0Y2g6IERpc3BhdGNoKTogUHJvbWlzZTxhbnk+ID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRpc3BhdGNoKENyZWF0b3JBY3Rpb24uZmV0Y2hpbmdDcmVhdG9yKCkpXG4gICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbkxpc3QgPSBhd2FpdCBjbGllbnQuc2VydmljZSgnbm90aWZpY2F0aW9ucycpLmZpbmQoeyBxdWVyeTogeyBhY3Rpb246ICdieUN1cnJlbnRDcmVhdG9yJyB9IH0pXG4gICAgICAgIGRpc3BhdGNoKENyZWF0b3JBY3Rpb24uY3JlYXRvck5vdGlmaWNhdGlvbkxpc3Qobm90aWZpY2F0aW9uTGlzdCkpXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICBBbGVydFNlcnZpY2UuZGlzcGF0Y2hBbGVydEVycm9yKGRpc3BhdGNoLCBlcnIubWVzc2FnZSlcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGZvbGxvd0NyZWF0b3I6IChjcmVhdG9ySWQ6IHN0cmluZykgPT4ge1xuICAgIHJldHVybiBhc3luYyAoZGlzcGF0Y2g6IERpc3BhdGNoKTogUHJvbWlzZTxhbnk+ID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGZvbGxvdyA9IGF3YWl0IGNsaWVudC5zZXJ2aWNlKCdmb2xsb3ctY3JlYXRvcicpLmNyZWF0ZSh7IGNyZWF0b3JJZCB9KVxuICAgICAgICBmb2xsb3cgJiYgZGlzcGF0Y2goQ3JlYXRvckFjdGlvbi51cGRhdGVDcmVhdG9yQXNGb2xsb3dlZCgpKVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgQWxlcnRTZXJ2aWNlLmRpc3BhdGNoQWxlcnRFcnJvcihkaXNwYXRjaCwgZXJyLm1lc3NhZ2UpXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB1bkZvbGxvd0NyZWF0b3I6IChjcmVhdG9ySWQ6IHN0cmluZykgPT4ge1xuICAgIHJldHVybiBhc3luYyAoZGlzcGF0Y2g6IERpc3BhdGNoKTogUHJvbWlzZTxhbnk+ID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGZvbGxvdyA9IGF3YWl0IGNsaWVudC5zZXJ2aWNlKCdmb2xsb3ctY3JlYXRvcicpLnJlbW92ZShjcmVhdG9ySWQpXG4gICAgICAgIGZvbGxvdyAmJiBkaXNwYXRjaChDcmVhdG9yQWN0aW9uLnVwZGF0ZUNyZWF0b3JOb3RGb2xsb3dlZCgpKVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgQWxlcnRTZXJ2aWNlLmRpc3BhdGNoQWxlcnRFcnJvcihkaXNwYXRjaCwgZXJyLm1lc3NhZ2UpXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBibG9ja0NyZWF0b3I6IChjcmVhdG9ySWQ6IHN0cmluZykgPT4ge1xuICAgIHJldHVybiBhc3luYyAoZGlzcGF0Y2g6IERpc3BhdGNoKTogUHJvbWlzZTxhbnk+ID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGZvbGxvdyA9IGF3YWl0IGNsaWVudC5zZXJ2aWNlKCdibG9jay1jcmVhdG9yJykuY3JlYXRlKHsgY3JlYXRvcklkIH0pXG4gICAgICAgIGZvbGxvdyAmJiBkaXNwYXRjaChDcmVhdG9yQWN0aW9uLnVwZGF0ZUNyZWF0b3JBc0Jsb2NrZWQoY3JlYXRvcklkKSlcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgIEFsZXJ0U2VydmljZS5kaXNwYXRjaEFsZXJ0RXJyb3IoZGlzcGF0Y2gsIGVyci5tZXNzYWdlKVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgdW5CbG9ja0NyZWF0b3I6IChibG9rZWRDcmVhdG9ySWQ6IHN0cmluZykgPT4ge1xuICAgIHJldHVybiBhc3luYyAoZGlzcGF0Y2g6IERpc3BhdGNoKTogUHJvbWlzZTxhbnk+ID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGZvbGxvdyA9IGF3YWl0IGNsaWVudC5zZXJ2aWNlKCdibG9jay1jcmVhdG9yJykucmVtb3ZlKHsgYmxva2VkQ3JlYXRvcklkIH0pXG4gICAgICAgIGlmIChmb2xsb3cpIHtcbiAgICAgICAgICBiaW5kQWN0aW9uQ3JlYXRvcnMoQ3JlYXRvclNlcnZpY2UuZ2V0QmxvY2tlZExpc3QsIGRpc3BhdGNoKShmb2xsb3cpXG4gICAgICAgICAgYmluZEFjdGlvbkNyZWF0b3JzKENyZWF0b3JTZXJ2aWNlLmdldENyZWF0b3JzLCBkaXNwYXRjaCkoKVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICBBbGVydFNlcnZpY2UuZGlzcGF0Y2hBbGVydEVycm9yKGRpc3BhdGNoLCBlcnIubWVzc2FnZSlcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGdldEJsb2NrZWRMaXN0OiAoY3JlYXRvcklkOiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gYXN5bmMgKGRpc3BhdGNoOiBEaXNwYXRjaCk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBsaXN0ID0gYXdhaXQgY2xpZW50LnNlcnZpY2UoJ2Jsb2NrLWNyZWF0b3InKS5maW5kKHsgcXVlcnk6IHsgYWN0aW9uOiAnYmxvY2tlZCcsIGNyZWF0b3JJZCB9IH0pXG4gICAgICAgIGRpc3BhdGNoKENyZWF0b3JBY3Rpb24uY3JlYXRvckJsb2NrZWRVc2VycyhsaXN0LmRhdGEpKVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgQWxlcnRTZXJ2aWNlLmRpc3BhdGNoQWxlcnRFcnJvcihkaXNwYXRjaCwgZXJyLm1lc3NhZ2UpXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBnZXRGb2xsb3dlcnNMaXN0OiAoY3JlYXRvcklkOiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gYXN5bmMgKGRpc3BhdGNoOiBEaXNwYXRjaCk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBsaXN0ID0gYXdhaXQgY2xpZW50LnNlcnZpY2UoJ2ZvbGxvdy1jcmVhdG9yJykuZmluZCh7IHF1ZXJ5OiB7IGFjdGlvbjogJ2ZvbGxvd2VycycsIGNyZWF0b3JJZCB9IH0pXG4gICAgICAgIGRpc3BhdGNoKENyZWF0b3JBY3Rpb24uY3JlYXRvckZvbGxvd2VycyhsaXN0LmRhdGEpKVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgQWxlcnRTZXJ2aWNlLmRpc3BhdGNoQWxlcnRFcnJvcihkaXNwYXRjaCwgZXJyLm1lc3NhZ2UpXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBnZXRGb2xsb3dpbmdMaXN0OiAoY3JlYXRvcklkOiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gYXN5bmMgKGRpc3BhdGNoOiBEaXNwYXRjaCk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBsaXN0ID0gYXdhaXQgY2xpZW50LnNlcnZpY2UoJ2ZvbGxvdy1jcmVhdG9yJykuZmluZCh7IHF1ZXJ5OiB7IGFjdGlvbjogJ2ZvbGxvd2luZycsIGNyZWF0b3JJZCB9IH0pXG4gICAgICAgIGRpc3BhdGNoKENyZWF0b3JBY3Rpb24uY3JlYXRvckZvbGxvd2luZyhsaXN0LmRhdGEpKVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgQWxlcnRTZXJ2aWNlLmRpc3BhdGNoQWxlcnRFcnJvcihkaXNwYXRjaCwgZXJyLm1lc3NhZ2UpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjBLQU1hLEdBQWdCLENBQzNCLGlCQUFrQixBQUFDLEdBQ1YsRUFDTCxLQUFNLHFCQUNOLGtCQUdKLHVCQUF3QixBQUFDLEdBQ2hCLEVBQ0wsS0FBTSw0QkFDTixZQUdKLGlCQUFrQixBQUFDLEdBQ1YsRUFDTCxLQUFNLG9CQUNOLFlBR0osaUJBQWtCLElBQ1QsRUFDTCxLQUFNLG1CQUdWLHVCQUF3QixJQUNmLEVBQ0wsS0FBTSwwQkFHVixnQkFBaUIsSUFDUixFQUNMLEtBQU0sa0JBR1Ysa0JBQW1CLEFBQUMsR0FDWCxFQUNM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
