import{c as r,d as f,g as l,b as v,r as b}from"./avatarFunctions.c7a0e273.js";import"./three.module.0404e109.js";import"./index.0040ebb6.js";import"./vendor.c8b8cc93.js";const u=r("SoundEffect"),p=r("BackgroundMusic"),m=r("PlaySoundEffect");async function j(n){const g=f([u]),y=f([p]),S=f([u,m]);let a=!1,c=[],x,i;const E=o=>{a?o():c.push(o)},d=()=>{if(!a){if(console.log("starting audio"),a=!0,v.instance.dispatchEvent({type:v.EVENTS.START_SUSPENDED_CONTEXTS}),window.AudioContext=window.AudioContext||window.webkitAudioContext,window.AudioContext){i=new window.AudioContext;const o=i.createBuffer(1,1,22050),t=i.createBufferSource();t.buffer=o,t.connect(i.destination),t.start?t.start(0):t.play&&t.play(0)}c.forEach(o=>o()),c=null}},C=o=>{const t=o.getComponent(p);t.src&&!x&&(t.audio=new Audio,t.audio.loop=!0,t.audio.volume=t.volume,t.audio.addEventListener("loadeddata",()=>{t.audio.play()}),t.audio.src=t.src)},h=o=>{const t=o.getComponent(p);t&&t.audio&&t.audio.pause()},A=o=>{const t=l(o,u),e=l(o,m),s=t.audio[e.index];s.volume=Math.min(Math.max(e.volume,0),1),s.play(),b(o,m)};return window.addEventListener("touchstart",d,!0),window.addEventListener("touchend",d,!0),window.addEventListener("click",d,!0),()=>{for(const o of g.enter(n)){const t=l(o,u);t.src.forEach((e,s)=>{if(!e)return;const w=new Audio;t.audio[s]=w,w.src=e})}for(const o of y.enter(n))E(()=>C(o));for(const o of y.exit(n))h(o);for(const o of S.enter(n))E(()=>A(o))}}export{j as default};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXVkaW9TeXN0ZW0uYmVmYTdiMmEuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2VuZ2luZS9zcmMvYXVkaW8vY29tcG9uZW50cy9Tb3VuZEVmZmVjdC50cyIsIi4uLy4uLy4uL2VuZ2luZS9zcmMvYXVkaW8vY29tcG9uZW50cy9CYWNrZ3JvdW5kTXVzaWMudHMiLCIuLi8uLi8uLi9lbmdpbmUvc3JjL2F1ZGlvL2NvbXBvbmVudHMvUGxheVNvdW5kRWZmZWN0LnRzIiwiLi4vLi4vLi4vZW5naW5lL3NyYy9hdWRpby9zeXN0ZW1zL0F1ZGlvU3lzdGVtLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZU1hcHBlZENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2Vjcy9mdW5jdGlvbnMvQ29tcG9uZW50RnVuY3Rpb25zJ1xuXG5leHBvcnQgdHlwZSBTb3VuZEVmZmVjdFR5cGUgPSB7XG4gIC8qKiBBdWRpbyB0cmFjayBjb250YWluZXIuICovXG4gIGF1ZGlvOiBhbnlbXVxuICAvKiogU291cmNlIG9mIHRoZSBhdWRpbyB0cmFjay4gKi9cbiAgc3JjOiBhbnlbXVxufVxuXG5leHBvcnQgY29uc3QgU291bmRFZmZlY3QgPSBjcmVhdGVNYXBwZWRDb21wb25lbnQ8U291bmRFZmZlY3RUeXBlPignU291bmRFZmZlY3QnKVxuIiwiaW1wb3J0IHsgY3JlYXRlTWFwcGVkQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vZWNzL2Z1bmN0aW9ucy9Db21wb25lbnRGdW5jdGlvbnMnXG5cbi8qKiBDb21wb25lbnQgY2xhc3MgZm9yIGJhY2tncm91bmQgbXVzaWMuICovXG5leHBvcnQgdHlwZSBCYWNrZ3JvdW5kTXVzaWNUeXBlID0ge1xuICAvKiogQXVkaW8gdHJhY2sgY29udGFpbmVyLiAqL1xuICBhdWRpbzogYW55XG4gIC8qKiBTb3VyY2Ugb2YgdGhlIGF1ZGlvIHRyYWNrLiAqL1xuICBzcmM6IGFueVxuICAvKiogVm9sdW1uZSBvZiB0aGUgc291bmQgdHJhY2suICoqRGVmYXVsdCoqIHZhbHVlIGlzIDAuNS4gKi9cbiAgdm9sdW1lOiBudW1iZXJcbn1cblxuZXhwb3J0IGNvbnN0IEJhY2tncm91bmRNdXNpYyA9IGNyZWF0ZU1hcHBlZENvbXBvbmVudDxCYWNrZ3JvdW5kTXVzaWNUeXBlPignQmFja2dyb3VuZE11c2ljJylcbiIsImltcG9ydCB7IGNyZWF0ZU1hcHBlZENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2Vjcy9mdW5jdGlvbnMvQ29tcG9uZW50RnVuY3Rpb25zJ1xuXG5leHBvcnQgdHlwZSBQbGF5U291bmRFZmZlY3RUeXBlID0ge1xuICAvKiogQXVkaW8gdHJhY2sgaW5kZXggdG8gcGxheS4gKi9cbiAgaW5kZXg6IG51bWJlclxuICAvKiogVm9sdW1lIG9mIHRoZSB0cmFjay4gKi9cbiAgdm9sdW1lOiBudW1iZXJcbn1cblxuZXhwb3J0IGNvbnN0IFBsYXlTb3VuZEVmZmVjdCA9IGNyZWF0ZU1hcHBlZENvbXBvbmVudDxQbGF5U291bmRFZmZlY3RUeXBlPignUGxheVNvdW5kRWZmZWN0JylcbiIsImltcG9ydCB7IFNvdW5kRWZmZWN0IH0gZnJvbSAnLi4vY29tcG9uZW50cy9Tb3VuZEVmZmVjdCdcbmltcG9ydCB7IEJhY2tncm91bmRNdXNpYyB9IGZyb20gJy4uL2NvbXBvbmVudHMvQmFja2dyb3VuZE11c2ljJ1xuaW1wb3J0IHsgUGxheVNvdW5kRWZmZWN0IH0gZnJvbSAnLi4vY29tcG9uZW50cy9QbGF5U291bmRFZmZlY3QnXG5pbXBvcnQgeyBkZWZpbmVRdWVyeSwgZ2V0Q29tcG9uZW50LCByZW1vdmVDb21wb25lbnQgfSBmcm9tICcuLi8uLi9lY3MvZnVuY3Rpb25zL0NvbXBvbmVudEZ1bmN0aW9ucydcbmltcG9ydCB7IEVuZ2luZUV2ZW50cyB9IGZyb20gJy4uLy4uL2Vjcy9jbGFzc2VzL0VuZ2luZUV2ZW50cydcbmltcG9ydCB7IFN5c3RlbSB9IGZyb20gJy4uLy4uL2Vjcy9jbGFzc2VzL1N5c3RlbSdcbmltcG9ydCB7IFdvcmxkIH0gZnJvbSAnLi4vLi4vZWNzL2NsYXNzZXMvV29ybGQnXG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIEF1ZGlvU3lzdGVtKHdvcmxkOiBXb3JsZCk6IFByb21pc2U8U3lzdGVtPiB7XG4gIGNvbnN0IHNvdW5kRWZmZWN0UXVlcnkgPSBkZWZpbmVRdWVyeShbU291bmRFZmZlY3RdKVxuICBjb25zdCBtdXNpY1F1ZXJ5ID0gZGVmaW5lUXVlcnkoW0JhY2tncm91bmRNdXNpY10pXG4gIGNvbnN0IHBsYXlRdWVyeSA9IGRlZmluZVF1ZXJ5KFtTb3VuZEVmZmVjdCwgUGxheVNvdW5kRWZmZWN0XSlcblxuICAvKiogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIHN5c3RlbSBpcyByZWFkeSBvciBub3QuICovXG4gIGxldCBhdWRpb1JlYWR5ID0gZmFsc2VcbiAgLyoqIENhbGxiYWNrcyB0byBiZSBjYWxsZWQgYWZ0ZXIgc3lzdGVtIGlzIHJlYWR5LiAqL1xuICBsZXQgY2FsbGJhY2tzOiBhbnlbXSA9IFtdXG4gIC8qKiBBdWRpbyBFbGVtZW50LiAqL1xuICBsZXQgYXVkaW86IGFueVxuICAvKiogQXVkaW8gQ29udGV4dC4gKi9cbiAgbGV0IGNvbnRleHQ6IEF1ZGlvQ29udGV4dFxuXG4gIC8qKlxuICAgKiBDYWxsIHRoZSBjYWxsYmFja3Mgd2hlbiBzeXN0ZW0gaXMgcmVhZHkgb3IgcHVzaCBjYWxsYmFja3MgaW4gYXJyYXkgb3RoZXJ3aXNlLlxuICAgKiBAcGFyYW0gY2IgQ2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gc3lzdGVtIGlzIHJlYWR5LlxuICAgKi9cbiAgY29uc3Qgd2hlblJlYWR5ID0gKGNiKTogdm9pZCA9PiB7XG4gICAgaWYgKGF1ZGlvUmVhZHkpIHtcbiAgICAgIGNiKClcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2tzLnB1c2goY2IpXG4gICAgfVxuICB9XG5cbiAgLyoqIEVuYWJsZSBhbmQgc3RhcnQgYXVkaW8gc3lzdGVtLiAqL1xuICBjb25zdCBzdGFydEF1ZGlvID0gKCk6IHZvaWQgPT4ge1xuICAgIGlmIChhdWRpb1JlYWR5KSByZXR1cm5cbiAgICBjb25zb2xlLmxvZygnc3RhcnRpbmcgYXVkaW8nKVxuICAgIGF1ZGlvUmVhZHkgPSB0cnVlXG4gICAgRW5naW5lRXZlbnRzLmluc3RhbmNlLmRpc3BhdGNoRXZlbnQoe1xuICAgICAgdHlwZTogRW5naW5lRXZlbnRzLkVWRU5UUy5TVEFSVF9TVVNQRU5ERURfQ09OVEVYVFNcbiAgICB9KVxuICAgIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8ICh3aW5kb3cgYXMgYW55KS53ZWJraXRBdWRpb0NvbnRleHRcbiAgICBpZiAod2luZG93LkF1ZGlvQ29udGV4dCkge1xuICAgICAgY29udGV4dCA9IG5ldyB3aW5kb3cuQXVkaW9Db250ZXh0KClcbiAgICAgIC8vIENyZWF0ZSBlbXB0eSBidWZmZXJcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGNvbnRleHQuY3JlYXRlQnVmZmVyKDEsIDEsIDIyMDUwKVxuICAgICAgY29uc3Qgc291cmNlID0gY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKVxuICAgICAgc291cmNlLmJ1ZmZlciA9IGJ1ZmZlclxuICAgICAgLy8gQ29ubmVjdCB0byBvdXRwdXQgKHNwZWFrZXJzKVxuICAgICAgc291cmNlLmNvbm5lY3QoY29udGV4dC5kZXN0aW5hdGlvbilcbiAgICAgIC8vIFBsYXkgc291bmRcbiAgICAgIGlmIChzb3VyY2Uuc3RhcnQpIHtcbiAgICAgICAgc291cmNlLnN0YXJ0KDApXG4gICAgICB9IGVsc2UgaWYgKChzb3VyY2UgYXMgYW55KS5wbGF5KSB7XG4gICAgICAgIDsoc291cmNlIGFzIGFueSkucGxheSgwKVxuICAgICAgfVxuICAgIH1cblxuICAgIGNhbGxiYWNrcy5mb3JFYWNoKChjYikgPT4gY2IoKSlcbiAgICBjYWxsYmFja3MgPSBudWxsXG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgQmFja2dyb3VuZCBtdXNpYyBpZiBhdmFpbGFibGUuXG4gICAqIEBwYXJhbSBlbnQgRW50aXR5IHRvIGdldCB0aGUge0BsaW5rIGF1ZGlvL2NvbXBvbmVudHMvQmFja2dyb3VuZE11c2ljLkJhY2tncm91bmRNdXNpYyB8IEJhY2tncm91bmRNdXNpY30gQ29tcG9uZW50LlxuICAgKi9cbiAgY29uc3Qgc3RhcnRCYWNrZ3JvdW5kTXVzaWMgPSAoZW50KTogdm9pZCA9PiB7XG4gICAgY29uc3QgbXVzaWMgPSBlbnQuZ2V0Q29tcG9uZW50KEJhY2tncm91bmRNdXNpYylcbiAgICBpZiAobXVzaWMuc3JjICYmICFhdWRpbykge1xuICAgICAgbXVzaWMuYXVkaW8gPSBuZXcgQXVkaW8oKVxuICAgICAgbXVzaWMuYXVkaW8ubG9vcCA9IHRydWVcbiAgICAgIG11c2ljLmF1ZGlvLnZvbHVtZSA9IG11c2ljLnZvbHVtZVxuICAgICAgbXVzaWMuYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcignbG9hZGVkZGF0YScsICgpID0+IHtcbiAgICAgICAgbXVzaWMuYXVkaW8ucGxheSgpXG4gICAgICB9KVxuICAgICAgbXVzaWMuYXVkaW8uc3JjID0gbXVzaWMuc3JjXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN0b3AgQmFja2dyb3VuZCBNdXNpYy5cbiAgICogQHBhcmFtIGVudCBFbnRpdHkgdG8gZ2V0IHRoZSB7QGxpbmsgYXVkaW8vY29tcG9uZW50cy9CYWNrZ3JvdW5kTXVzaWMuQmFja2dyb3VuZE11c2ljIHwgQmFja2dyb3VuZE11c2ljfSBDb21wb25lbnQuXG4gICAqL1xuICBjb25zdCBzdG9wQmFja2dyb3VuZE11c2ljID0gKGVudCk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IG11c2ljID0gZW50LmdldENvbXBvbmVudChCYWNrZ3JvdW5kTXVzaWMpXG4gICAgaWYgKG11c2ljICYmIG11c2ljLmF1ZGlvKSB7XG4gICAgICBtdXNpYy5hdWRpby5wYXVzZSgpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBsYXkgc291bmQgZWZmZWN0LlxuICAgKiBAcGFyYW0gZW50IEVudGl0eSB0byBnZXQgdGhlIHtAbGluayBhdWRpby9jb21wb25lbnRzL1BsYXlTb3VuZEVmZmVjdC5QbGF5U291bmRFZmZlY3QgfCBQbGF5U291bmRFZmZlY3R9IENvbXBvbmVudC5cbiAgICovXG4gIGNvbnN0IHBsYXlTb3VuZEVmZmVjdCA9IChlbnQpOiB2b2lkID0+IHtcbiAgICBjb25zdCBzb3VuZCA9IGdldENvbXBvbmVudChlbnQsIFNvdW5kRWZmZWN0KVxuICAgIGNvbnN0IHBsYXlUYWcgPSBnZXRDb21wb25lbnQoZW50LCBQbGF5U291bmRFZmZlY3QpXG4gICAgY29uc3QgYXVkaW8gPSBzb3VuZC5hdWRpb1twbGF5VGFnLmluZGV4XVxuICAgIGF1ZGlvLnZvbHVtZSA9IE1hdGgubWluKE1hdGgubWF4KHBsYXlUYWcudm9sdW1lLCAwKSwgMSlcbiAgICBhdWRpby5wbGF5KClcbiAgICByZW1vdmVDb21wb25lbnQoZW50LCBQbGF5U291bmRFZmZlY3QpXG4gIH1cblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHN0YXJ0QXVkaW8sIHRydWUpXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHN0YXJ0QXVkaW8sIHRydWUpXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHN0YXJ0QXVkaW8sIHRydWUpXG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiBzb3VuZEVmZmVjdFF1ZXJ5LmVudGVyKHdvcmxkKSkge1xuICAgICAgY29uc3QgZWZmZWN0ID0gZ2V0Q29tcG9uZW50KGVudGl0eSwgU291bmRFZmZlY3QpXG4gICAgICBpZiAoIWF1ZGlvKSB7XG4gICAgICAgIGVmZmVjdC5zcmMuZm9yRWFjaCgoc3JjLCBpKSA9PiB7XG4gICAgICAgICAgaWYgKCFzcmMpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGF1ZGlvID0gbmV3IEF1ZGlvKClcbiAgICAgICAgICBlZmZlY3QuYXVkaW9baV0gPSBhdWRpb1xuICAgICAgICAgIGF1ZGlvLnNyYyA9IHNyY1xuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIG11c2ljUXVlcnkuZW50ZXIod29ybGQpKSB7XG4gICAgICB3aGVuUmVhZHkoKCkgPT4gc3RhcnRCYWNrZ3JvdW5kTXVzaWMoZW50aXR5KSlcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiBtdXNpY1F1ZXJ5LmV4aXQod29ybGQpKSB7XG4gICAgICBzdG9wQmFja2dyb3VuZE11c2ljKGVudGl0eSlcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiBwbGF5UXVlcnkuZW50ZXIod29ybGQpKSB7XG4gICAgICB3aGVuUmVhZHkoKCkgPT4gcGxheVNvdW5kRWZmZWN0KGVudGl0eSkpXG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IitLQVNhLEdBQWMsRUFBdUMsZUNHckQsRUFBa0IsRUFBMkMsbUJDSDdELEVBQWtCLEVBQTJDLG9DQ0RoQyxFQUErQixNQUNqRSxHQUFtQixFQUFZLENBQUMsSUFDaEMsRUFBYSxFQUFZLENBQUMsSUFDMUIsRUFBWSxFQUFZLENBQUMsRUFBYSxPQUd4QyxHQUFhLEdBRWIsRUFBbUIsR0FFbkIsRUFFQSxPQU1FLEdBQVksQUFBQyxHQUFhLENBQzFCLFFBR1EsS0FBSyxJQUtiLEVBQWEsSUFBWSxJQUN6QixlQUNJLElBQUksb0JBQ0MsS0FDQSxTQUFTLGNBQWMsQ0FDbEMsS0FBTSxFQUFhLE9BQU8sa0NBRXJCLGFBQWUsT0FBTyxjQUFpQixPQUFlLG1CQUN6RCxPQUFPLGFBQWMsR0FDYixHQUFJLFFBQU8sa0JBRWYsR0FBUyxFQUFRLGFBQWEsRUFBRyxFQUFHLE9BQ3BDLEVBQVMsRUFBUSx1QkFDaEIsT0FBUyxJQUVULFFBQVEsRUFBUSxhQUVuQixFQUFPLFFBQ0YsTUFBTSxHQUNILEVBQWUsTUFDdkIsRUFBZSxLQUFLLEtBSWhCLFFBQVEsQUFBQyxHQUFPLE9BQ2QsT0FPUixFQUF1QixBQUFDLEdBQWMsTUFDcEMsR0FBUSxFQUFJLGFBQWEsR0FDM0IsRUFBTSxLQUFPLENBQUMsTUFDVixNQUFRLEdBQUksU0FDWixNQUFNLEtBQU8sS0FDYixNQUFNLE9BQVMsRUFBTSxTQUNyQixNQUFNLGlCQUFpQixhQUFjLElBQU0sR0FDekMsTUFBTSxXQUVSLE1BQU0sSUFBTSxFQUFNLE1BUXRCLEVBQXNCLEFBQUMsR0FBYyxNQUNuQyxHQUFRLEVBQUksYUFBYSxHQUMzQixHQUFTLEVBQU0sU0FDWCxNQUFNLFNBUVYsRUFBa0IsQUFBQyxHQUFjLE1BQy9CLEdBQVEsRUFBYSxFQUFLLEdBQzFCLEVBQVUsRUFBYSxFQUFLLEdBQzVCLEVBQVEsRUFBTSxNQUFNLEVBQVEsU0FDNUIsT0FBUyxLQUFLLElBQUksS0FBSyxJQUFJLEVBQVEsT0FBUSxHQUFJLEtBQy9DLFNBQ1UsRUFBSyxrQkFHaEIsaUJBQWlCLGFBQWMsRUFBWSxXQUMzQyxpQkFBaUIsV0FBWSxFQUFZLFdBQ3pDLGlCQUFpQixRQUFTLEVBQVksSUFFdEMsSUFBTSxVQUNBLEtBQVUsR0FBaUIsTUFBTSxHQUFRLE1BQzVDLEdBQVMsRUFBYSxFQUFRLEtBRTNCLElBQUksUUFBUSxDQUFDLEVBQUssSUFBTSxJQUN6QixDQUFDLGNBSUMsR0FBUSxHQUFJLFNBQ1gsTUFBTSxHQUFLLElBQ1osSUFBTSxhQUtQLEtBQVUsR0FBVyxNQUFNLEtBQzFCLElBQU0sRUFBcUIsYUFHNUIsS0FBVSxHQUFXLEtBQUssS0FDZixZQUdYLEtBQVUsR0FBVSxNQUFNLEtBQ3pCLElBQU0sRUFBZ0IifQ==
