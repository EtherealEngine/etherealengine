import{r as t,j as u}from"./vendor.475cb2ff.js";import{_ as p,t as b,R as B,v as w,Q as D}from"./_app.f0a72417.js";import{w as x,c as k}from"./capitalize.fc001633.js";var L=t.exports.createContext(),A=L,W=function(e){return{root:{display:"table",width:"100%",borderCollapse:"collapse",borderSpacing:0,"& caption":p({},e.typography.body2,{padding:e.spacing(2),color:e.palette.text.secondary,textAlign:"left",captionSide:"bottom"})},stickyHeader:{borderCollapse:"separate"}}},M="table",I=t.exports.forwardRef(function(e,s){var o=e.classes,n=e.className,a=e.component,r=a===void 0?M:a,l=e.padding,g=l===void 0?"normal":l,v=e.size,f=v===void 0?"medium":v,m=e.stickyHeader,c=m===void 0?!1:m,C=u(e,["classes","className","component","padding","size","stickyHeader"]),i=t.exports.useMemo(function(){return{padding:g,size:f,stickyHeader:c}},[g,f,c]);return t.exports.createElement(A.Provider,{value:i},t.exports.createElement(r,p({role:r===M?null:"table",ref:s,className:b(o.root,n,c&&o.stickyHeader)},C)))}),re=x(W,{name:"MuiTable"})(I),J=t.exports.createContext(),h=J,O={root:{display:"table-row-group"}},Q={variant:"body"},P="tbody",X=t.exports.forwardRef(function(e,s){var o=e.classes,n=e.className,a=e.component,r=a===void 0?P:a,l=u(e,["classes","className","component"]);return t.exports.createElement(h.Provider,{value:Q},t.exports.createElement(r,p({className:b(o.root,n),ref:s,role:r===P?null:"rowgroup"},l)))}),le=x(O,{name:"MuiTableBody"})(X),q=function(e){return{root:p({},e.typography.body2,{display:"table-cell",verticalAlign:"inherit",borderBottom:`1px solid
    `.concat(e.palette.type==="light"?B(w(e.palette.divider,1),.88):D(w(e.palette.divider,1),.68)),textAlign:"left",padding:16}),head:{color:e.palette.text.primary,lineHeight:e.typography.pxToRem(24),fontWeight:e.typography.fontWeightMedium},body:{color:e.palette.text.primary},footer:{color:e.palette.text.secondary,lineHeight:e.typography.pxToRem(21),fontSize:e.typography.pxToRem(12)},sizeSmall:{padding:"6px 24px 6px 16px","&:last-child":{paddingRight:16},"&$paddingCheckbox":{width:24,padding:"0 12px 0 16px","&:last-child":{paddingLeft:12,paddingRight:16},"& > *":{padding:0}}},paddingCheckbox:{width:48,padding:"0 0 0 4px","&:last-child":{paddingLeft:0,paddingRight:4}},paddingNone:{padding:0,"&:last-child":{padding:0}},alignLeft:{textAlign:"left"},alignCenter:{textAlign:"center"},alignRight:{textAlign:"right",flexDirection:"row-reverse"},alignJustify:{textAlign:"justify"},stickyHeader:{position:"sticky",top:0,left:0,zIndex:2,backgroundColor:e.palette.background.default}}},F=t.exports.forwardRef(function(e,s){var o=e.align,n=o===void 0?"inherit":o,a=e.classes,r=e.className,l=e.component,g=e.padding,v=e.scope,f=e.size,m=e.sortDirection,c=e.variant,C=u(e,["align","classes","className","component","padding","scope","size","sortDirection","variant"]),i=t.exports.useContext(A),y=t.exports.useContext(h),T=y&&y.variant==="head",R,$;l?($=l,R=T?"columnheader":"cell"):$=T?"th":"td";var N=v;!N&&T&&(N="col");var z=g||(i&&i.padding?i.padding:"normal"),H=f||(i&&i.size?i.size:"medium"),_=c||y&&y.variant,E=null;return m&&(E=m==="asc"?"ascending":"descending"),t.exports.createElement($,p({ref:s,className:b(a.root,a[_],r,n!=="inherit"&&a["align".concat(k(n))],z!=="normal"&&a["padding".concat(k(z))],H!=="medium"&&a["size".concat(k(H))],_==="head"&&i&&i.stickyHeader&&a.stickyHeader),"aria-sort":E,role:R,scope:N},C))}),ne=x(q,{name:"MuiTableCell"})(F),G={root:{width:"100%",overflowX:"auto"}},K=t.exports.forwardRef(function(e,s){var o=e.classes,n=e.className,a=e.component,r=a===void 0?"div":a,l=u(e,["classes","className","component"]);return t.exports.createElement(r,p({ref:s,className:b(o.root,n)},l))}),se=x(G,{name:"MuiTableContainer"})(K),U={root:{display:"table-header-group"}},V={variant:"head"},j="thead",Y=t.exports.forwardRef(function(e,s){var o=e.classes,n=e.className,a=e.component,r=a===void 0?j:a,l=u(e,["classes","className","component"]);return t.exports.createElement(h.Provider,{value:V},t.exports.createElement(r,p({className:b(o.root,n),ref:s,role:r===j?null:"rowgroup"},l)))}),ie=x(U,{name:"MuiTableHead"})(Y),Z=function(e){return{root:{color:"inherit",display:"table-row",verticalAlign:"middle",outline:0,"&$hover:hover":{backgroundColor:e.palette.action.hover},"&$selected, &$selected:hover":{backgroundColor:w(e.palette.secondary.main,e.palette.action.selectedOpacity)}},selected:{},hover:{},head:{},footer:{}}},S="tr",ee=t.exports.forwardRef(function(e,s){var o=e.classes,n=e.className,a=e.component,r=a===void 0?S:a,l=e.hover,g=l===void 0?!1:l,v=e.selected,f=v===void 0?!1:v,m=u(e,["classes","className","component","hover","selected"]),c=t.exports.useContext(h);return t.exports.createElement(r,p({ref:s,className:b(o.root,n,c&&{head:o.head,footer:o.footer}[c.variant],g&&o.hover,f&&o.selected),role:r===S?null:"row"},m))}),de=x(Z,{name:"MuiTableRow"})(ee);export{se as T,re as a,ie as b,de as c,ne as d,le as e};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGFibGVSb3cuMjgxOWQxNmYuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AbWF0ZXJpYWwtdWkvY29yZS9lc20vVGFibGUvVGFibGVDb250ZXh0LmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BtYXRlcmlhbC11aS9jb3JlL2VzbS9UYWJsZS9UYWJsZS5qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AbWF0ZXJpYWwtdWkvY29yZS9lc20vVGFibGUvVGFibGVsdmwyQ29udGV4dC5qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AbWF0ZXJpYWwtdWkvY29yZS9lc20vVGFibGVCb2R5L1RhYmxlQm9keS5qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AbWF0ZXJpYWwtdWkvY29yZS9lc20vVGFibGVDZWxsL1RhYmxlQ2VsbC5qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AbWF0ZXJpYWwtdWkvY29yZS9lc20vVGFibGVDb250YWluZXIvVGFibGVDb250YWluZXIuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQG1hdGVyaWFsLXVpL2NvcmUvZXNtL1RhYmxlSGVhZC9UYWJsZUhlYWQuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQG1hdGVyaWFsLXVpL2NvcmUvZXNtL1RhYmxlUm93L1RhYmxlUm93LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0Jztcbi8qKlxuICogQGlnbm9yZSAtIGludGVybmFsIGNvbXBvbmVudC5cbiAqL1xuXG52YXIgVGFibGVDb250ZXh0ID0gUmVhY3QuY3JlYXRlQ29udGV4dCgpO1xuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICBUYWJsZUNvbnRleHQuZGlzcGxheU5hbWUgPSAnVGFibGVDb250ZXh0Jztcbn1cblxuZXhwb3J0IGRlZmF1bHQgVGFibGVDb250ZXh0OyIsImltcG9ydCBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMgZnJvbSBcIkBiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzXCI7XG5pbXBvcnQgX2V4dGVuZHMgZnJvbSBcIkBiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2V4dGVuZHNcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY2xzeCBmcm9tICdjbHN4JztcbmltcG9ydCB7IGNoYWluUHJvcFR5cGVzIH0gZnJvbSAnQG1hdGVyaWFsLXVpL3V0aWxzJztcbmltcG9ydCB3aXRoU3R5bGVzIGZyb20gJy4uL3N0eWxlcy93aXRoU3R5bGVzJztcbmltcG9ydCBUYWJsZUNvbnRleHQgZnJvbSAnLi9UYWJsZUNvbnRleHQnO1xuZXhwb3J0IHZhciBzdHlsZXMgPSBmdW5jdGlvbiBzdHlsZXModGhlbWUpIHtcbiAgcmV0dXJuIHtcbiAgICAvKiBTdHlsZXMgYXBwbGllZCB0byB0aGUgcm9vdCBlbGVtZW50LiAqL1xuICAgIHJvb3Q6IHtcbiAgICAgIGRpc3BsYXk6ICd0YWJsZScsXG4gICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgYm9yZGVyQ29sbGFwc2U6ICdjb2xsYXBzZScsXG4gICAgICBib3JkZXJTcGFjaW5nOiAwLFxuICAgICAgJyYgY2FwdGlvbic6IF9leHRlbmRzKHt9LCB0aGVtZS50eXBvZ3JhcGh5LmJvZHkyLCB7XG4gICAgICAgIHBhZGRpbmc6IHRoZW1lLnNwYWNpbmcoMiksXG4gICAgICAgIGNvbG9yOiB0aGVtZS5wYWxldHRlLnRleHQuc2Vjb25kYXJ5LFxuICAgICAgICB0ZXh0QWxpZ246ICdsZWZ0JyxcbiAgICAgICAgY2FwdGlvblNpZGU6ICdib3R0b20nXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICAvKiBTdHlsZXMgYXBwbGllZCB0byB0aGUgcm9vdCBlbGVtZW50IGlmIGBzdGlja3lIZWFkZXI9e3RydWV9YC4gKi9cbiAgICBzdGlja3lIZWFkZXI6IHtcbiAgICAgIGJvcmRlckNvbGxhcHNlOiAnc2VwYXJhdGUnXG4gICAgfVxuICB9O1xufTtcbnZhciBkZWZhdWx0Q29tcG9uZW50ID0gJ3RhYmxlJztcbnZhciBUYWJsZSA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFRhYmxlKHByb3BzLCByZWYpIHtcbiAgdmFyIGNsYXNzZXMgPSBwcm9wcy5jbGFzc2VzLFxuICAgICAgY2xhc3NOYW1lID0gcHJvcHMuY2xhc3NOYW1lLFxuICAgICAgX3Byb3BzJGNvbXBvbmVudCA9IHByb3BzLmNvbXBvbmVudCxcbiAgICAgIENvbXBvbmVudCA9IF9wcm9wcyRjb21wb25lbnQgPT09IHZvaWQgMCA/IGRlZmF1bHRDb21wb25lbnQgOiBfcHJvcHMkY29tcG9uZW50LFxuICAgICAgX3Byb3BzJHBhZGRpbmcgPSBwcm9wcy5wYWRkaW5nLFxuICAgICAgcGFkZGluZyA9IF9wcm9wcyRwYWRkaW5nID09PSB2b2lkIDAgPyAnbm9ybWFsJyA6IF9wcm9wcyRwYWRkaW5nLFxuICAgICAgX3Byb3BzJHNpemUgPSBwcm9wcy5zaXplLFxuICAgICAgc2l6ZSA9IF9wcm9wcyRzaXplID09PSB2b2lkIDAgPyAnbWVkaXVtJyA6IF9wcm9wcyRzaXplLFxuICAgICAgX3Byb3BzJHN0aWNreUhlYWRlciA9IHByb3BzLnN0aWNreUhlYWRlcixcbiAgICAgIHN0aWNreUhlYWRlciA9IF9wcm9wcyRzdGlja3lIZWFkZXIgPT09IHZvaWQgMCA/IGZhbHNlIDogX3Byb3BzJHN0aWNreUhlYWRlcixcbiAgICAgIG90aGVyID0gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKHByb3BzLCBbXCJjbGFzc2VzXCIsIFwiY2xhc3NOYW1lXCIsIFwiY29tcG9uZW50XCIsIFwicGFkZGluZ1wiLCBcInNpemVcIiwgXCJzdGlja3lIZWFkZXJcIl0pO1xuXG4gIHZhciB0YWJsZSA9IFJlYWN0LnVzZU1lbW8oZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwYWRkaW5nOiBwYWRkaW5nLFxuICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgIHN0aWNreUhlYWRlcjogc3RpY2t5SGVhZGVyXG4gICAgfTtcbiAgfSwgW3BhZGRpbmcsIHNpemUsIHN0aWNreUhlYWRlcl0pO1xuICByZXR1cm4gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUVsZW1lbnQoVGFibGVDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IHRhYmxlXG4gIH0sIC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVFbGVtZW50KENvbXBvbmVudCwgX2V4dGVuZHMoe1xuICAgIHJvbGU6IENvbXBvbmVudCA9PT0gZGVmYXVsdENvbXBvbmVudCA/IG51bGwgOiAndGFibGUnLFxuICAgIHJlZjogcmVmLFxuICAgIGNsYXNzTmFtZTogY2xzeChjbGFzc2VzLnJvb3QsIGNsYXNzTmFtZSwgc3RpY2t5SGVhZGVyICYmIGNsYXNzZXMuc3RpY2t5SGVhZGVyKVxuICB9LCBvdGhlcikpKTtcbn0pO1xucHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gVGFibGUucHJvcFR5cGVzID0ge1xuICAvKipcbiAgICogVGhlIGNvbnRlbnQgb2YgdGhlIHRhYmxlLCBub3JtYWxseSBgVGFibGVIZWFkYCBhbmQgYFRhYmxlQm9keWAuXG4gICAqL1xuICBjaGlsZHJlbjogUHJvcFR5cGVzLm5vZGUuaXNSZXF1aXJlZCxcblxuICAvKipcbiAgICogT3ZlcnJpZGUgb3IgZXh0ZW5kIHRoZSBzdHlsZXMgYXBwbGllZCB0byB0aGUgY29tcG9uZW50LlxuICAgKiBTZWUgW0NTUyBBUEldKCNjc3MpIGJlbG93IGZvciBtb3JlIGRldGFpbHMuXG4gICAqL1xuICBjbGFzc2VzOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG5cbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIGNsYXNzTmFtZTogUHJvcFR5cGVzLnN0cmluZyxcblxuICAvKipcbiAgICogVGhlIGNvbXBvbmVudCB1c2VkIGZvciB0aGUgcm9vdCBub2RlLlxuICAgKiBFaXRoZXIgYSBzdHJpbmcgdG8gdXNlIGEgSFRNTCBlbGVtZW50IG9yIGEgY29tcG9uZW50LlxuICAgKi9cbiAgY29tcG9uZW50OiBQcm9wVHlwZXNcbiAgLyogQHR5cGVzY3JpcHQtdG8tcHJvcHR5cGVzLWlnbm9yZSAqL1xuICAuZWxlbWVudFR5cGUsXG5cbiAgLyoqXG4gICAqIEFsbG93cyBUYWJsZUNlbGxzIHRvIGluaGVyaXQgcGFkZGluZyBvZiB0aGUgVGFibGUuXG4gICAqIGBkZWZhdWx0YCBpcyBkZXByZWNhdGVkLCB1c2UgYG5vcm1hbGAgaW5zdGVhZC5cbiAgICovXG4gIHBhZGRpbmc6IGNoYWluUHJvcFR5cGVzKFByb3BUeXBlcy5vbmVPZihbJ25vcm1hbCcsICdjaGVja2JveCcsICdub25lJywgJ2RlZmF1bHQnXSksIGZ1bmN0aW9uIChwcm9wcykge1xuICAgIGlmIChwcm9wcy5wYWRkaW5nID09PSAnZGVmYXVsdCcpIHtcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoJ01hdGVyaWFsLVVJOiBwYWRkaW5nPVwiZGVmYXVsdFwiIHdhcyByZW5hbWVkIHRvIHBhZGRpbmc9XCJub3JtYWxcIiBmb3IgY29uc2lzdGVuY3kuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH0pLFxuXG4gIC8qKlxuICAgKiBBbGxvd3MgVGFibGVDZWxscyB0byBpbmhlcml0IHNpemUgb2YgdGhlIFRhYmxlLlxuICAgKi9cbiAgc2l6ZTogUHJvcFR5cGVzLm9uZU9mKFsnc21hbGwnLCAnbWVkaXVtJ10pLFxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGhlYWRlciBzdGlja3kuXG4gICAqXG4gICAqIOKaoO+4jyBJdCBkb2Vzbid0IHdvcmsgd2l0aCBJRSAxMS5cbiAgICovXG4gIHN0aWNreUhlYWRlcjogUHJvcFR5cGVzLmJvb2xcbn0gOiB2b2lkIDA7XG5leHBvcnQgZGVmYXVsdCB3aXRoU3R5bGVzKHN0eWxlcywge1xuICBuYW1lOiAnTXVpVGFibGUnXG59KShUYWJsZSk7IiwiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuLyoqXG4gKiBAaWdub3JlIC0gaW50ZXJuYWwgY29tcG9uZW50LlxuICovXG5cbnZhciBUYWJsZWx2bDJDb250ZXh0ID0gUmVhY3QuY3JlYXRlQ29udGV4dCgpO1xuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICBUYWJsZWx2bDJDb250ZXh0LmRpc3BsYXlOYW1lID0gJ1RhYmxlbHZsMkNvbnRleHQnO1xufVxuXG5leHBvcnQgZGVmYXVsdCBUYWJsZWx2bDJDb250ZXh0OyIsImltcG9ydCBfZXh0ZW5kcyBmcm9tIFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vZXh0ZW5kc1wiO1xuaW1wb3J0IF9vYmplY3RXaXRob3V0UHJvcGVydGllcyBmcm9tIFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vb2JqZWN0V2l0aG91dFByb3BlcnRpZXNcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY2xzeCBmcm9tICdjbHN4JztcbmltcG9ydCB3aXRoU3R5bGVzIGZyb20gJy4uL3N0eWxlcy93aXRoU3R5bGVzJztcbmltcG9ydCBUYWJsZWx2bDJDb250ZXh0IGZyb20gJy4uL1RhYmxlL1RhYmxlbHZsMkNvbnRleHQnO1xuZXhwb3J0IHZhciBzdHlsZXMgPSB7XG4gIC8qIFN0eWxlcyBhcHBsaWVkIHRvIHRoZSByb290IGVsZW1lbnQuICovXG4gIHJvb3Q6IHtcbiAgICBkaXNwbGF5OiAndGFibGUtcm93LWdyb3VwJ1xuICB9XG59O1xudmFyIHRhYmxlbHZsMiA9IHtcbiAgdmFyaWFudDogJ2JvZHknXG59O1xudmFyIGRlZmF1bHRDb21wb25lbnQgPSAndGJvZHknO1xudmFyIFRhYmxlQm9keSA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFRhYmxlQm9keShwcm9wcywgcmVmKSB7XG4gIHZhciBjbGFzc2VzID0gcHJvcHMuY2xhc3NlcyxcbiAgICAgIGNsYXNzTmFtZSA9IHByb3BzLmNsYXNzTmFtZSxcbiAgICAgIF9wcm9wcyRjb21wb25lbnQgPSBwcm9wcy5jb21wb25lbnQsXG4gICAgICBDb21wb25lbnQgPSBfcHJvcHMkY29tcG9uZW50ID09PSB2b2lkIDAgPyBkZWZhdWx0Q29tcG9uZW50IDogX3Byb3BzJGNvbXBvbmVudCxcbiAgICAgIG90aGVyID0gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKHByb3BzLCBbXCJjbGFzc2VzXCIsIFwiY2xhc3NOYW1lXCIsIFwiY29tcG9uZW50XCJdKTtcblxuICByZXR1cm4gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUVsZW1lbnQoVGFibGVsdmwyQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiB0YWJsZWx2bDJcbiAgfSwgLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUVsZW1lbnQoQ29tcG9uZW50LCBfZXh0ZW5kcyh7XG4gICAgY2xhc3NOYW1lOiBjbHN4KGNsYXNzZXMucm9vdCwgY2xhc3NOYW1lKSxcbiAgICByZWY6IHJlZixcbiAgICByb2xlOiBDb21wb25lbnQgPT09IGRlZmF1bHRDb21wb25lbnQgPyBudWxsIDogJ3Jvd2dyb3VwJ1xuICB9LCBvdGhlcikpKTtcbn0pO1xucHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gVGFibGVCb2R5LnByb3BUeXBlcyA9IHtcbiAgLyoqXG4gICAqIFRoZSBjb250ZW50IG9mIHRoZSBjb21wb25lbnQsIG5vcm1hbGx5IGBUYWJsZVJvd2AuXG4gICAqL1xuICBjaGlsZHJlbjogUHJvcFR5cGVzLm5vZGUsXG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlIG9yIGV4dGVuZCB0aGUgc3R5bGVzIGFwcGxpZWQgdG8gdGhlIGNvbXBvbmVudC5cbiAgICogU2VlIFtDU1MgQVBJXSgjY3NzKSBiZWxvdyBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKi9cbiAgY2xhc3NlczogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBjbGFzc05hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgLyoqXG4gICAqIFRoZSBjb21wb25lbnQgdXNlZCBmb3IgdGhlIHJvb3Qgbm9kZS5cbiAgICogRWl0aGVyIGEgc3RyaW5nIHRvIHVzZSBhIEhUTUwgZWxlbWVudCBvciBhIGNvbXBvbmVudC5cbiAgICovXG4gIGNvbXBvbmVudDogUHJvcFR5cGVzXG4gIC8qIEB0eXBlc2NyaXB0LXRvLXByb3B0eXBlcy1pZ25vcmUgKi9cbiAgLmVsZW1lbnRUeXBlXG59IDogdm9pZCAwO1xuZXhwb3J0IGRlZmF1bHQgd2l0aFN0eWxlcyhzdHlsZXMsIHtcbiAgbmFtZTogJ011aVRhYmxlQm9keSdcbn0pKFRhYmxlQm9keSk7IiwiaW1wb3J0IF9vYmplY3RXaXRob3V0UHJvcGVydGllcyBmcm9tIFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vb2JqZWN0V2l0aG91dFByb3BlcnRpZXNcIjtcbmltcG9ydCBfZXh0ZW5kcyBmcm9tIFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vZXh0ZW5kc1wiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjbHN4IGZyb20gJ2Nsc3gnO1xuaW1wb3J0IHsgY2hhaW5Qcm9wVHlwZXMgfSBmcm9tICdAbWF0ZXJpYWwtdWkvdXRpbHMnO1xuaW1wb3J0IHdpdGhTdHlsZXMgZnJvbSAnLi4vc3R5bGVzL3dpdGhTdHlsZXMnO1xuaW1wb3J0IGNhcGl0YWxpemUgZnJvbSAnLi4vdXRpbHMvY2FwaXRhbGl6ZSc7XG5pbXBvcnQgeyBkYXJrZW4sIGFscGhhLCBsaWdodGVuIH0gZnJvbSAnLi4vc3R5bGVzL2NvbG9yTWFuaXB1bGF0b3InO1xuaW1wb3J0IFRhYmxlQ29udGV4dCBmcm9tICcuLi9UYWJsZS9UYWJsZUNvbnRleHQnO1xuaW1wb3J0IFRhYmxlbHZsMkNvbnRleHQgZnJvbSAnLi4vVGFibGUvVGFibGVsdmwyQ29udGV4dCc7XG5leHBvcnQgdmFyIHN0eWxlcyA9IGZ1bmN0aW9uIHN0eWxlcyh0aGVtZSkge1xuICByZXR1cm4ge1xuICAgIC8qIFN0eWxlcyBhcHBsaWVkIHRvIHRoZSByb290IGVsZW1lbnQuICovXG4gICAgcm9vdDogX2V4dGVuZHMoe30sIHRoZW1lLnR5cG9ncmFwaHkuYm9keTIsIHtcbiAgICAgIGRpc3BsYXk6ICd0YWJsZS1jZWxsJyxcbiAgICAgIHZlcnRpY2FsQWxpZ246ICdpbmhlcml0JyxcbiAgICAgIC8vIFdvcmthcm91bmQgZm9yIGEgcmVuZGVyaW5nIGJ1ZyB3aXRoIHNwYW5uZWQgY29sdW1ucyBpbiBDaHJvbWUgNjIuMC5cbiAgICAgIC8vIFJlbW92ZXMgdGhlIGFscGhhIChzZXRzIGl0IHRvIDEpLCBhbmQgbGlnaHRlbnMgb3IgZGFya2VucyB0aGUgdGhlbWUgY29sb3IuXG4gICAgICBib3JkZXJCb3R0b206IFwiMXB4IHNvbGlkXFxuICAgIFwiLmNvbmNhdCh0aGVtZS5wYWxldHRlLnR5cGUgPT09ICdsaWdodCcgPyBsaWdodGVuKGFscGhhKHRoZW1lLnBhbGV0dGUuZGl2aWRlciwgMSksIDAuODgpIDogZGFya2VuKGFscGhhKHRoZW1lLnBhbGV0dGUuZGl2aWRlciwgMSksIDAuNjgpKSxcbiAgICAgIHRleHRBbGlnbjogJ2xlZnQnLFxuICAgICAgcGFkZGluZzogMTZcbiAgICB9KSxcblxuICAgIC8qIFN0eWxlcyBhcHBsaWVkIHRvIHRoZSByb290IGVsZW1lbnQgaWYgYHZhcmlhbnQ9XCJoZWFkXCJgIG9yIGBjb250ZXh0LnRhYmxlLmhlYWRgLiAqL1xuICAgIGhlYWQ6IHtcbiAgICAgIGNvbG9yOiB0aGVtZS5wYWxldHRlLnRleHQucHJpbWFyeSxcbiAgICAgIGxpbmVIZWlnaHQ6IHRoZW1lLnR5cG9ncmFwaHkucHhUb1JlbSgyNCksXG4gICAgICBmb250V2VpZ2h0OiB0aGVtZS50eXBvZ3JhcGh5LmZvbnRXZWlnaHRNZWRpdW1cbiAgICB9LFxuXG4gICAgLyogU3R5bGVzIGFwcGxpZWQgdG8gdGhlIHJvb3QgZWxlbWVudCBpZiBgdmFyaWFudD1cImJvZHlcImAgb3IgYGNvbnRleHQudGFibGUuYm9keWAuICovXG4gICAgYm9keToge1xuICAgICAgY29sb3I6IHRoZW1lLnBhbGV0dGUudGV4dC5wcmltYXJ5XG4gICAgfSxcblxuICAgIC8qIFN0eWxlcyBhcHBsaWVkIHRvIHRoZSByb290IGVsZW1lbnQgaWYgYHZhcmlhbnQ9XCJmb290ZXJcImAgb3IgYGNvbnRleHQudGFibGUuZm9vdGVyYC4gKi9cbiAgICBmb290ZXI6IHtcbiAgICAgIGNvbG9yOiB0aGVtZS5wYWxldHRlLnRleHQuc2Vjb25kYXJ5LFxuICAgICAgbGluZUhlaWdodDogdGhlbWUudHlwb2dyYXBoeS5weFRvUmVtKDIxKSxcbiAgICAgIGZvbnRTaXplOiB0aGVtZS50eXBvZ3JhcGh5LnB4VG9SZW0oMTIpXG4gICAgfSxcblxuICAgIC8qIFN0eWxlcyBhcHBsaWVkIHRvIHRoZSByb290IGVsZW1lbnQgaWYgYHNpemU9XCJzbWFsbFwiYC4gKi9cbiAgICBzaXplU21hbGw6IHtcbiAgICAgIHBhZGRpbmc6ICc2cHggMjRweCA2cHggMTZweCcsXG4gICAgICAnJjpsYXN0LWNoaWxkJzoge1xuICAgICAgICBwYWRkaW5nUmlnaHQ6IDE2XG4gICAgICB9LFxuICAgICAgJyYkcGFkZGluZ0NoZWNrYm94Jzoge1xuICAgICAgICB3aWR0aDogMjQsXG4gICAgICAgIC8vIHByZXZlbnQgdGhlIGNoZWNrYm94IGNvbHVtbiBmcm9tIGdyb3dpbmdcbiAgICAgICAgcGFkZGluZzogJzAgMTJweCAwIDE2cHgnLFxuICAgICAgICAnJjpsYXN0LWNoaWxkJzoge1xuICAgICAgICAgIHBhZGRpbmdMZWZ0OiAxMixcbiAgICAgICAgICBwYWRkaW5nUmlnaHQ6IDE2XG4gICAgICAgIH0sXG4gICAgICAgICcmID4gKic6IHtcbiAgICAgICAgICBwYWRkaW5nOiAwXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyogU3R5bGVzIGFwcGxpZWQgdG8gdGhlIHJvb3QgZWxlbWVudCBpZiBgcGFkZGluZz1cImNoZWNrYm94XCJgLiAqL1xuICAgIHBhZGRpbmdDaGVja2JveDoge1xuICAgICAgd2lkdGg6IDQ4LFxuICAgICAgLy8gcHJldmVudCB0aGUgY2hlY2tib3ggY29sdW1uIGZyb20gZ3Jvd2luZ1xuICAgICAgcGFkZGluZzogJzAgMCAwIDRweCcsXG4gICAgICAnJjpsYXN0LWNoaWxkJzoge1xuICAgICAgICBwYWRkaW5nTGVmdDogMCxcbiAgICAgICAgcGFkZGluZ1JpZ2h0OiA0XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8qIFN0eWxlcyBhcHBsaWVkIHRvIHRoZSByb290IGVsZW1lbnQgaWYgYHBhZGRpbmc9XCJub25lXCJgLiAqL1xuICAgIHBhZGRpbmdOb25lOiB7XG4gICAgICBwYWRkaW5nOiAwLFxuICAgICAgJyY6bGFzdC1jaGlsZCc6IHtcbiAgICAgICAgcGFkZGluZzogMFxuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKiBTdHlsZXMgYXBwbGllZCB0byB0aGUgcm9vdCBlbGVtZW50IGlmIGBhbGlnbj1cImxlZnRcImAuICovXG4gICAgYWxpZ25MZWZ0OiB7XG4gICAgICB0ZXh0QWxpZ246ICdsZWZ0J1xuICAgIH0sXG5cbiAgICAvKiBTdHlsZXMgYXBwbGllZCB0byB0aGUgcm9vdCBlbGVtZW50IGlmIGBhbGlnbj1cImNlbnRlclwiYC4gKi9cbiAgICBhbGlnbkNlbnRlcjoge1xuICAgICAgdGV4dEFsaWduOiAnY2VudGVyJ1xuICAgIH0sXG5cbiAgICAvKiBTdHlsZXMgYXBwbGllZCB0byB0aGUgcm9vdCBlbGVtZW50IGlmIGBhbGlnbj1cInJpZ2h0XCJgLiAqL1xuICAgIGFsaWduUmlnaHQ6IHtcbiAgICAgIHRleHRBbGlnbjogJ3JpZ2h0JyxcbiAgICAgIGZsZXhEaXJlY3Rpb246ICdyb3ctcmV2ZXJzZSdcbiAgICB9LFxuXG4gICAgLyogU3R5bGVzIGFwcGxpZWQgdG8gdGhlIHJvb3QgZWxlbWVudCBpZiBgYWxpZ249XCJqdXN0aWZ5XCJgLiAqL1xuICAgIGFsaWduSnVzdGlmeToge1xuICAgICAgdGV4dEFsaWduOiAnanVzdGlmeSdcbiAgICB9LFxuXG4gICAgLyogU3R5bGVzIGFwcGxpZWQgdG8gdGhlIHJvb3QgZWxlbWVudCBpZiBgY29udGV4dC50YWJsZS5zdGlja3lIZWFkZXI9e3RydWV9YC4gKi9cbiAgICBzdGlja3lIZWFkZXI6IHtcbiAgICAgIHBvc2l0aW9uOiAnc3RpY2t5JyxcbiAgICAgIHRvcDogMCxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICB6SW5kZXg6IDIsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lLnBhbGV0dGUuYmFja2dyb3VuZC5kZWZhdWx0XG4gICAgfVxuICB9O1xufTtcbi8qKlxuICogVGhlIGNvbXBvbmVudCByZW5kZXJzIGEgYDx0aD5gIGVsZW1lbnQgd2hlbiB0aGUgcGFyZW50IGNvbnRleHQgaXMgYSBoZWFkZXJcbiAqIG9yIG90aGVyd2lzZSBhIGA8dGQ+YCBlbGVtZW50LlxuICovXG5cbnZhciBUYWJsZUNlbGwgPSAvKiNfX1BVUkVfXyovUmVhY3QuZm9yd2FyZFJlZihmdW5jdGlvbiBUYWJsZUNlbGwocHJvcHMsIHJlZikge1xuICB2YXIgX3Byb3BzJGFsaWduID0gcHJvcHMuYWxpZ24sXG4gICAgICBhbGlnbiA9IF9wcm9wcyRhbGlnbiA9PT0gdm9pZCAwID8gJ2luaGVyaXQnIDogX3Byb3BzJGFsaWduLFxuICAgICAgY2xhc3NlcyA9IHByb3BzLmNsYXNzZXMsXG4gICAgICBjbGFzc05hbWUgPSBwcm9wcy5jbGFzc05hbWUsXG4gICAgICBjb21wb25lbnQgPSBwcm9wcy5jb21wb25lbnQsXG4gICAgICBwYWRkaW5nUHJvcCA9IHByb3BzLnBhZGRpbmcsXG4gICAgICBzY29wZVByb3AgPSBwcm9wcy5zY29wZSxcbiAgICAgIHNpemVQcm9wID0gcHJvcHMuc2l6ZSxcbiAgICAgIHNvcnREaXJlY3Rpb24gPSBwcm9wcy5zb3J0RGlyZWN0aW9uLFxuICAgICAgdmFyaWFudFByb3AgPSBwcm9wcy52YXJpYW50LFxuICAgICAgb3RoZXIgPSBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMocHJvcHMsIFtcImFsaWduXCIsIFwiY2xhc3Nlc1wiLCBcImNsYXNzTmFtZVwiLCBcImNvbXBvbmVudFwiLCBcInBhZGRpbmdcIiwgXCJzY29wZVwiLCBcInNpemVcIiwgXCJzb3J0RGlyZWN0aW9uXCIsIFwidmFyaWFudFwiXSk7XG5cbiAgdmFyIHRhYmxlID0gUmVhY3QudXNlQ29udGV4dChUYWJsZUNvbnRleHQpO1xuICB2YXIgdGFibGVsdmwyID0gUmVhY3QudXNlQ29udGV4dChUYWJsZWx2bDJDb250ZXh0KTtcbiAgdmFyIGlzSGVhZENlbGwgPSB0YWJsZWx2bDIgJiYgdGFibGVsdmwyLnZhcmlhbnQgPT09ICdoZWFkJztcbiAgdmFyIHJvbGU7XG4gIHZhciBDb21wb25lbnQ7XG5cbiAgaWYgKGNvbXBvbmVudCkge1xuICAgIENvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICByb2xlID0gaXNIZWFkQ2VsbCA/ICdjb2x1bW5oZWFkZXInIDogJ2NlbGwnO1xuICB9IGVsc2Uge1xuICAgIENvbXBvbmVudCA9IGlzSGVhZENlbGwgPyAndGgnIDogJ3RkJztcbiAgfVxuXG4gIHZhciBzY29wZSA9IHNjb3BlUHJvcDtcblxuICBpZiAoIXNjb3BlICYmIGlzSGVhZENlbGwpIHtcbiAgICBzY29wZSA9ICdjb2wnO1xuICB9XG5cbiAgdmFyIHBhZGRpbmcgPSBwYWRkaW5nUHJvcCB8fCAodGFibGUgJiYgdGFibGUucGFkZGluZyA/IHRhYmxlLnBhZGRpbmcgOiAnbm9ybWFsJyk7XG4gIHZhciBzaXplID0gc2l6ZVByb3AgfHwgKHRhYmxlICYmIHRhYmxlLnNpemUgPyB0YWJsZS5zaXplIDogJ21lZGl1bScpO1xuICB2YXIgdmFyaWFudCA9IHZhcmlhbnRQcm9wIHx8IHRhYmxlbHZsMiAmJiB0YWJsZWx2bDIudmFyaWFudDtcbiAgdmFyIGFyaWFTb3J0ID0gbnVsbDtcblxuICBpZiAoc29ydERpcmVjdGlvbikge1xuICAgIGFyaWFTb3J0ID0gc29ydERpcmVjdGlvbiA9PT0gJ2FzYycgPyAnYXNjZW5kaW5nJyA6ICdkZXNjZW5kaW5nJztcbiAgfVxuXG4gIHJldHVybiAvKiNfX1BVUkVfXyovUmVhY3QuY3JlYXRlRWxlbWVudChDb21wb25lbnQsIF9leHRlbmRzKHtcbiAgICByZWY6IHJlZixcbiAgICBjbGFzc05hbWU6IGNsc3goY2xhc3Nlcy5yb290LCBjbGFzc2VzW3ZhcmlhbnRdLCBjbGFzc05hbWUsIGFsaWduICE9PSAnaW5oZXJpdCcgJiYgY2xhc3Nlc1tcImFsaWduXCIuY29uY2F0KGNhcGl0YWxpemUoYWxpZ24pKV0sIHBhZGRpbmcgIT09ICdub3JtYWwnICYmIGNsYXNzZXNbXCJwYWRkaW5nXCIuY29uY2F0KGNhcGl0YWxpemUocGFkZGluZykpXSwgc2l6ZSAhPT0gJ21lZGl1bScgJiYgY2xhc3Nlc1tcInNpemVcIi5jb25jYXQoY2FwaXRhbGl6ZShzaXplKSldLCB2YXJpYW50ID09PSAnaGVhZCcgJiYgdGFibGUgJiYgdGFibGUuc3RpY2t5SGVhZGVyICYmIGNsYXNzZXMuc3RpY2t5SGVhZGVyKSxcbiAgICBcImFyaWEtc29ydFwiOiBhcmlhU29ydCxcbiAgICByb2xlOiByb2xlLFxuICAgIHNjb3BlOiBzY29wZVxuICB9LCBvdGhlcikpO1xufSk7XG5wcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgPyBUYWJsZUNlbGwucHJvcFR5cGVzID0ge1xuICAvKipcbiAgICogU2V0IHRoZSB0ZXh0LWFsaWduIG9uIHRoZSB0YWJsZSBjZWxsIGNvbnRlbnQuXG4gICAqXG4gICAqIE1vbmV0YXJ5IG9yIGdlbmVyYWxseSBudW1iZXIgZmllbGRzICoqc2hvdWxkIGJlIHJpZ2h0IGFsaWduZWQqKiBhcyB0aGF0IGFsbG93c1xuICAgKiB5b3UgdG8gYWRkIHRoZW0gdXAgcXVpY2tseSBpbiB5b3VyIGhlYWQgd2l0aG91dCBoYXZpbmcgdG8gd29ycnkgYWJvdXQgZGVjaW1hbHMuXG4gICAqL1xuICBhbGlnbjogUHJvcFR5cGVzLm9uZU9mKFsnY2VudGVyJywgJ2luaGVyaXQnLCAnanVzdGlmeScsICdsZWZ0JywgJ3JpZ2h0J10pLFxuXG4gIC8qKlxuICAgKiBUaGUgdGFibGUgY2VsbCBjb250ZW50cy5cbiAgICovXG4gIGNoaWxkcmVuOiBQcm9wVHlwZXMubm9kZSxcblxuICAvKipcbiAgICogT3ZlcnJpZGUgb3IgZXh0ZW5kIHRoZSBzdHlsZXMgYXBwbGllZCB0byB0aGUgY29tcG9uZW50LlxuICAgKiBTZWUgW0NTUyBBUEldKCNjc3MpIGJlbG93IGZvciBtb3JlIGRldGFpbHMuXG4gICAqL1xuICBjbGFzc2VzOiBQcm9wVHlwZXMub2JqZWN0LFxuXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBjbGFzc05hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgLyoqXG4gICAqIFRoZSBjb21wb25lbnQgdXNlZCBmb3IgdGhlIHJvb3Qgbm9kZS5cbiAgICogRWl0aGVyIGEgc3RyaW5nIHRvIHVzZSBhIEhUTUwgZWxlbWVudCBvciBhIGNvbXBvbmVudC5cbiAgICovXG4gIGNvbXBvbmVudDogUHJvcFR5cGVzXG4gIC8qIEB0eXBlc2NyaXB0LXRvLXByb3B0eXBlcy1pZ25vcmUgKi9cbiAgLmVsZW1lbnRUeXBlLFxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwYWRkaW5nIGFwcGxpZWQgdG8gdGhlIGNlbGwuXG4gICAqIEJ5IGRlZmF1bHQsIHRoZSBUYWJsZSBwYXJlbnQgY29tcG9uZW50IHNldCB0aGUgdmFsdWUgKGBub3JtYWxgKS5cbiAgICogYGRlZmF1bHRgIGlzIGRlcHJlY2F0ZWQsIHVzZSBgbm9ybWFsYCBpbnN0ZWFkLlxuICAgKi9cbiAgcGFkZGluZzogY2hhaW5Qcm9wVHlwZXMoUHJvcFR5cGVzLm9uZU9mKFsnbm9ybWFsJywgJ2NoZWNrYm94JywgJ25vbmUnLCAnZGVmYXVsdCddKSwgZnVuY3Rpb24gKHByb3BzKSB7XG4gICAgaWYgKHByb3BzLnBhZGRpbmcgPT09ICdkZWZhdWx0Jykge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcignTWF0ZXJpYWwtVUk6IHBhZGRpbmc9XCJkZWZhdWx0XCIgd2FzIHJlbmFtZWQgdG8gcGFkZGluZz1cIm5vcm1hbFwiIGZvciBjb25zaXN0ZW5jeS4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfSksXG5cbiAgLyoqXG4gICAqIFNldCBzY29wZSBhdHRyaWJ1dGUuXG4gICAqL1xuICBzY29wZTogUHJvcFR5cGVzLnN0cmluZyxcblxuICAvKipcbiAgICogU3BlY2lmeSB0aGUgc2l6ZSBvZiB0aGUgY2VsbC5cbiAgICogQnkgZGVmYXVsdCwgdGhlIFRhYmxlIHBhcmVudCBjb21wb25lbnQgc2V0IHRoZSB2YWx1ZSAoYG1lZGl1bWApLlxuICAgKi9cbiAgc2l6ZTogUHJvcFR5cGVzLm9uZU9mKFsnbWVkaXVtJywgJ3NtYWxsJ10pLFxuXG4gIC8qKlxuICAgKiBTZXQgYXJpYS1zb3J0IGRpcmVjdGlvbi5cbiAgICovXG4gIHNvcnREaXJlY3Rpb246IFByb3BUeXBlcy5vbmVPZihbJ2FzYycsICdkZXNjJywgZmFsc2VdKSxcblxuICAvKipcbiAgICogU3BlY2lmeSB0aGUgY2VsbCB0eXBlLlxuICAgKiBCeSBkZWZhdWx0LCB0aGUgVGFibGVIZWFkLCBUYWJsZUJvZHkgb3IgVGFibGVGb290ZXIgcGFyZW50IGNvbXBvbmVudCBzZXQgdGhlIHZhbHVlLlxuICAgKi9cbiAgdmFyaWFudDogUHJvcFR5cGVzLm9uZU9mKFsnYm9keScsICdmb290ZXInLCAnaGVhZCddKVxufSA6IHZvaWQgMDtcbmV4cG9ydCBkZWZhdWx0IHdpdGhTdHlsZXMoc3R5bGVzLCB7XG4gIG5hbWU6ICdNdWlUYWJsZUNlbGwnXG59KShUYWJsZUNlbGwpOyIsImltcG9ydCBfZXh0ZW5kcyBmcm9tIFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vZXh0ZW5kc1wiO1xuaW1wb3J0IF9vYmplY3RXaXRob3V0UHJvcGVydGllcyBmcm9tIFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vb2JqZWN0V2l0aG91dFByb3BlcnRpZXNcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY2xzeCBmcm9tICdjbHN4JztcbmltcG9ydCB3aXRoU3R5bGVzIGZyb20gJy4uL3N0eWxlcy93aXRoU3R5bGVzJztcbmV4cG9ydCB2YXIgc3R5bGVzID0ge1xuICAvKiBTdHlsZXMgYXBwbGllZCB0byB0aGUgcm9vdCBlbGVtZW50LiAqL1xuICByb290OiB7XG4gICAgd2lkdGg6ICcxMDAlJyxcbiAgICBvdmVyZmxvd1g6ICdhdXRvJ1xuICB9XG59O1xudmFyIFRhYmxlQ29udGFpbmVyID0gLyojX19QVVJFX18qL1JlYWN0LmZvcndhcmRSZWYoZnVuY3Rpb24gVGFibGVDb250YWluZXIocHJvcHMsIHJlZikge1xuICB2YXIgY2xhc3NlcyA9IHByb3BzLmNsYXNzZXMsXG4gICAgICBjbGFzc05hbWUgPSBwcm9wcy5jbGFzc05hbWUsXG4gICAgICBfcHJvcHMkY29tcG9uZW50ID0gcHJvcHMuY29tcG9uZW50LFxuICAgICAgQ29tcG9uZW50ID0gX3Byb3BzJGNvbXBvbmVudCA9PT0gdm9pZCAwID8gJ2RpdicgOiBfcHJvcHMkY29tcG9uZW50LFxuICAgICAgb3RoZXIgPSBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMocHJvcHMsIFtcImNsYXNzZXNcIiwgXCJjbGFzc05hbWVcIiwgXCJjb21wb25lbnRcIl0pO1xuXG4gIHJldHVybiAvKiNfX1BVUkVfXyovUmVhY3QuY3JlYXRlRWxlbWVudChDb21wb25lbnQsIF9leHRlbmRzKHtcbiAgICByZWY6IHJlZixcbiAgICBjbGFzc05hbWU6IGNsc3goY2xhc3Nlcy5yb290LCBjbGFzc05hbWUpXG4gIH0sIG90aGVyKSk7XG59KTtcbnByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiA/IFRhYmxlQ29udGFpbmVyLnByb3BUeXBlcyA9IHtcbiAgLyoqXG4gICAqIFRoZSB0YWJsZSBpdHNlbGYsIG5vcm1hbGx5IGA8VGFibGUgLz5gXG4gICAqL1xuICBjaGlsZHJlbjogUHJvcFR5cGVzLm5vZGUsXG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlIG9yIGV4dGVuZCB0aGUgc3R5bGVzIGFwcGxpZWQgdG8gdGhlIGNvbXBvbmVudC5cbiAgICogU2VlIFtDU1MgQVBJXSgjY3NzKSBiZWxvdyBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKi9cbiAgY2xhc3NlczogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBjbGFzc05hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgLyoqXG4gICAqIFRoZSBjb21wb25lbnQgdXNlZCBmb3IgdGhlIHJvb3Qgbm9kZS5cbiAgICogRWl0aGVyIGEgc3RyaW5nIHRvIHVzZSBhIEhUTUwgZWxlbWVudCBvciBhIGNvbXBvbmVudC5cbiAgICovXG4gIGNvbXBvbmVudDogUHJvcFR5cGVzXG4gIC8qIEB0eXBlc2NyaXB0LXRvLXByb3B0eXBlcy1pZ25vcmUgKi9cbiAgLmVsZW1lbnRUeXBlXG59IDogdm9pZCAwO1xuZXhwb3J0IGRlZmF1bHQgd2l0aFN0eWxlcyhzdHlsZXMsIHtcbiAgbmFtZTogJ011aVRhYmxlQ29udGFpbmVyJ1xufSkoVGFibGVDb250YWluZXIpOyIsImltcG9ydCBfZXh0ZW5kcyBmcm9tIFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vZXh0ZW5kc1wiO1xuaW1wb3J0IF9vYmplY3RXaXRob3V0UHJvcGVydGllcyBmcm9tIFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vb2JqZWN0V2l0aG91dFByb3BlcnRpZXNcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY2xzeCBmcm9tICdjbHN4JztcbmltcG9ydCB3aXRoU3R5bGVzIGZyb20gJy4uL3N0eWxlcy93aXRoU3R5bGVzJztcbmltcG9ydCBUYWJsZWx2bDJDb250ZXh0IGZyb20gJy4uL1RhYmxlL1RhYmxlbHZsMkNvbnRleHQnO1xuZXhwb3J0IHZhciBzdHlsZXMgPSB7XG4gIC8qIFN0eWxlcyBhcHBsaWVkIHRvIHRoZSByb290IGVsZW1lbnQuICovXG4gIHJvb3Q6IHtcbiAgICBkaXNwbGF5OiAndGFibGUtaGVhZGVyLWdyb3VwJ1xuICB9XG59O1xudmFyIHRhYmxlbHZsMiA9IHtcbiAgdmFyaWFudDogJ2hlYWQnXG59O1xudmFyIGRlZmF1bHRDb21wb25lbnQgPSAndGhlYWQnO1xudmFyIFRhYmxlSGVhZCA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFRhYmxlSGVhZChwcm9wcywgcmVmKSB7XG4gIHZhciBjbGFzc2VzID0gcHJvcHMuY2xhc3NlcyxcbiAgICAgIGNsYXNzTmFtZSA9IHByb3BzLmNsYXNzTmFtZSxcbiAgICAgIF9wcm9wcyRjb21wb25lbnQgPSBwcm9wcy5jb21wb25lbnQsXG4gICAgICBDb21wb25lbnQgPSBfcHJvcHMkY29tcG9uZW50ID09PSB2b2lkIDAgPyBkZWZhdWx0Q29tcG9uZW50IDogX3Byb3BzJGNvbXBvbmVudCxcbiAgICAgIG90aGVyID0gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKHByb3BzLCBbXCJjbGFzc2VzXCIsIFwiY2xhc3NOYW1lXCIsIFwiY29tcG9uZW50XCJdKTtcblxuICByZXR1cm4gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUVsZW1lbnQoVGFibGVsdmwyQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiB0YWJsZWx2bDJcbiAgfSwgLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUVsZW1lbnQoQ29tcG9uZW50LCBfZXh0ZW5kcyh7XG4gICAgY2xhc3NOYW1lOiBjbHN4KGNsYXNzZXMucm9vdCwgY2xhc3NOYW1lKSxcbiAgICByZWY6IHJlZixcbiAgICByb2xlOiBDb21wb25lbnQgPT09IGRlZmF1bHRDb21wb25lbnQgPyBudWxsIDogJ3Jvd2dyb3VwJ1xuICB9LCBvdGhlcikpKTtcbn0pO1xucHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gVGFibGVIZWFkLnByb3BUeXBlcyA9IHtcbiAgLyoqXG4gICAqIFRoZSBjb250ZW50IG9mIHRoZSBjb21wb25lbnQsIG5vcm1hbGx5IGBUYWJsZVJvd2AuXG4gICAqL1xuICBjaGlsZHJlbjogUHJvcFR5cGVzLm5vZGUsXG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlIG9yIGV4dGVuZCB0aGUgc3R5bGVzIGFwcGxpZWQgdG8gdGhlIGNvbXBvbmVudC5cbiAgICogU2VlIFtDU1MgQVBJXSgjY3NzKSBiZWxvdyBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKi9cbiAgY2xhc3NlczogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBjbGFzc05hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgLyoqXG4gICAqIFRoZSBjb21wb25lbnQgdXNlZCBmb3IgdGhlIHJvb3Qgbm9kZS5cbiAgICogRWl0aGVyIGEgc3RyaW5nIHRvIHVzZSBhIEhUTUwgZWxlbWVudCBvciBhIGNvbXBvbmVudC5cbiAgICovXG4gIGNvbXBvbmVudDogUHJvcFR5cGVzXG4gIC8qIEB0eXBlc2NyaXB0LXRvLXByb3B0eXBlcy1pZ25vcmUgKi9cbiAgLmVsZW1lbnRUeXBlXG59IDogdm9pZCAwO1xuZXhwb3J0IGRlZmF1bHQgd2l0aFN0eWxlcyhzdHlsZXMsIHtcbiAgbmFtZTogJ011aVRhYmxlSGVhZCdcbn0pKFRhYmxlSGVhZCk7IiwiaW1wb3J0IF9leHRlbmRzIGZyb20gXCJAYmFiZWwvcnVudGltZS9oZWxwZXJzL2VzbS9leHRlbmRzXCI7XG5pbXBvcnQgX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzIGZyb20gXCJAYmFiZWwvcnVudGltZS9oZWxwZXJzL2VzbS9vYmplY3RXaXRob3V0UHJvcGVydGllc1wiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjbHN4IGZyb20gJ2Nsc3gnO1xuaW1wb3J0IHdpdGhTdHlsZXMgZnJvbSAnLi4vc3R5bGVzL3dpdGhTdHlsZXMnO1xuaW1wb3J0IFRhYmxlbHZsMkNvbnRleHQgZnJvbSAnLi4vVGFibGUvVGFibGVsdmwyQ29udGV4dCc7XG5pbXBvcnQgeyBhbHBoYSB9IGZyb20gJy4uL3N0eWxlcy9jb2xvck1hbmlwdWxhdG9yJztcbmV4cG9ydCB2YXIgc3R5bGVzID0gZnVuY3Rpb24gc3R5bGVzKHRoZW1lKSB7XG4gIHJldHVybiB7XG4gICAgLyogU3R5bGVzIGFwcGxpZWQgdG8gdGhlIHJvb3QgZWxlbWVudC4gKi9cbiAgICByb290OiB7XG4gICAgICBjb2xvcjogJ2luaGVyaXQnLFxuICAgICAgZGlzcGxheTogJ3RhYmxlLXJvdycsXG4gICAgICB2ZXJ0aWNhbEFsaWduOiAnbWlkZGxlJyxcbiAgICAgIC8vIFdlIGRpc2FibGUgdGhlIGZvY3VzIHJpbmcgZm9yIG1vdXNlLCB0b3VjaCBhbmQga2V5Ym9hcmQgdXNlcnMuXG4gICAgICBvdXRsaW5lOiAwLFxuICAgICAgJyYkaG92ZXI6aG92ZXInOiB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogdGhlbWUucGFsZXR0ZS5hY3Rpb24uaG92ZXJcbiAgICAgIH0sXG4gICAgICAnJiRzZWxlY3RlZCwgJiRzZWxlY3RlZDpob3Zlcic6IHtcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBhbHBoYSh0aGVtZS5wYWxldHRlLnNlY29uZGFyeS5tYWluLCB0aGVtZS5wYWxldHRlLmFjdGlvbi5zZWxlY3RlZE9wYWNpdHkpXG4gICAgICB9XG4gICAgfSxcblxuICAgIC8qIFBzZXVkby1jbGFzcyBhcHBsaWVkIHRvIHRoZSByb290IGVsZW1lbnQgaWYgYHNlbGVjdGVkPXt0cnVlfWAuICovXG4gICAgc2VsZWN0ZWQ6IHt9LFxuXG4gICAgLyogUHNldWRvLWNsYXNzIGFwcGxpZWQgdG8gdGhlIHJvb3QgZWxlbWVudCBpZiBgaG92ZXI9e3RydWV9YC4gKi9cbiAgICBob3Zlcjoge30sXG5cbiAgICAvKiBTdHlsZXMgYXBwbGllZCB0byB0aGUgcm9vdCBlbGVtZW50IGlmIHRhYmxlIHZhcmlhbnQ9XCJoZWFkXCIuICovXG4gICAgaGVhZDoge30sXG5cbiAgICAvKiBTdHlsZXMgYXBwbGllZCB0byB0aGUgcm9vdCBlbGVtZW50IGlmIHRhYmxlIHZhcmlhbnQ9XCJmb290ZXJcIi4gKi9cbiAgICBmb290ZXI6IHt9XG4gIH07XG59O1xudmFyIGRlZmF1bHRDb21wb25lbnQgPSAndHInO1xuLyoqXG4gKiBXaWxsIGF1dG9tYXRpY2FsbHkgc2V0IGR5bmFtaWMgcm93IGhlaWdodFxuICogYmFzZWQgb24gdGhlIG1hdGVyaWFsIHRhYmxlIGVsZW1lbnQgcGFyZW50IChoZWFkLCBib2R5LCBldGMpLlxuICovXG5cbnZhciBUYWJsZVJvdyA9IC8qI19fUFVSRV9fKi9SZWFjdC5mb3J3YXJkUmVmKGZ1bmN0aW9uIFRhYmxlUm93KHByb3BzLCByZWYpIHtcbiAgdmFyIGNsYXNzZXMgPSBwcm9wcy5jbGFzc2VzLFxuICAgICAgY2xhc3NOYW1lID0gcHJvcHMuY2xhc3NOYW1lLFxuICAgICAgX3Byb3BzJGNvbXBvbmVudCA9IHByb3BzLmNvbXBvbmVudCxcbiAgICAgIENvbXBvbmVudCA9IF9wcm9wcyRjb21wb25lbnQgPT09IHZvaWQgMCA/IGRlZmF1bHRDb21wb25lbnQgOiBfcHJvcHMkY29tcG9uZW50LFxuICAgICAgX3Byb3BzJGhvdmVyID0gcHJvcHMuaG92ZXIsXG4gICAgICBob3ZlciA9IF9wcm9wcyRob3ZlciA9PT0gdm9pZCAwID8gZmFsc2UgOiBfcHJvcHMkaG92ZXIsXG4gICAgICBfcHJvcHMkc2VsZWN0ZWQgPSBwcm9wcy5zZWxlY3RlZCxcbiAgICAgIHNlbGVjdGVkID0gX3Byb3BzJHNlbGVjdGVkID09PSB2b2lkIDAgPyBmYWxzZSA6IF9wcm9wcyRzZWxlY3RlZCxcbiAgICAgIG90aGVyID0gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKHByb3BzLCBbXCJjbGFzc2VzXCIsIFwiY2xhc3NOYW1lXCIsIFwiY29tcG9uZW50XCIsIFwiaG92ZXJcIiwgXCJzZWxlY3RlZFwiXSk7XG5cbiAgdmFyIHRhYmxlbHZsMiA9IFJlYWN0LnVzZUNvbnRleHQoVGFibGVsdmwyQ29udGV4dCk7XG4gIHJldHVybiAvKiNfX1BVUkVfXyovUmVhY3QuY3JlYXRlRWxlbWVudChDb21wb25lbnQsIF9leHRlbmRzKHtcbiAgICByZWY6IHJlZixcbiAgICBjbGFzc05hbWU6IGNsc3goY2xhc3Nlcy5yb290LCBjbGFzc05hbWUsIHRhYmxlbHZsMiAmJiB7XG4gICAgICAnaGVhZCc6IGNsYXNzZXMuaGVhZCxcbiAgICAgICdmb290ZXInOiBjbGFzc2VzLmZvb3RlclxuICAgIH1bdGFibGVsdmwyLnZhcmlhbnRdLCBob3ZlciAmJiBjbGFzc2VzLmhvdmVyLCBzZWxlY3RlZCAmJiBjbGFzc2VzLnNlbGVjdGVkKSxcbiAgICByb2xlOiBDb21wb25lbnQgPT09IGRlZmF1bHRDb21wb25lbnQgPyBudWxsIDogJ3JvdydcbiAgfSwgb3RoZXIpKTtcbn0pO1xucHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiID8gVGFibGVSb3cucHJvcFR5cGVzID0ge1xuICAvKipcbiAgICogU2hvdWxkIGJlIHZhbGlkIDx0cj4gY2hpbGRyZW4gc3VjaCBhcyBgVGFibGVDZWxsYC5cbiAgICovXG4gIGNoaWxkcmVuOiBQcm9wVHlwZXMubm9kZSxcblxuICAvKipcbiAgICogT3ZlcnJpZGUgb3IgZXh0ZW5kIHRoZSBzdHlsZXMgYXBwbGllZCB0byB0aGUgY29tcG9uZW50LlxuICAgKiBTZWUgW0NTUyBBUEldKCNjc3MpIGJlbG93IGZvciBtb3JlIGRldGFpbHMuXG4gICAqL1xuICBjbGFzc2VzOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG5cbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIGNsYXNzTmFtZTogUHJvcFR5cGVzLnN0cmluZyxcblxuICAvKipcbiAgICogVGhlIGNvbXBvbmVudCB1c2VkIGZvciB0aGUgcm9vdCBub2RlLlxuICAgKiBFaXRoZXIgYSBzdHJpbmcgdG8gdXNlIGEgSFRNTCBlbGVtZW50IG9yIGEgY29tcG9uZW50LlxuICAgKi9cbiAgY29tcG9uZW50OiBQcm9wVHlwZXNcbiAgLyogQHR5cGVzY3JpcHQtdG8tcHJvcHR5cGVzLWlnbm9yZSAqL1xuICAuZWxlbWVudFR5cGUsXG5cbiAgLyoqXG4gICAqIElmIGB0cnVlYCwgdGhlIHRhYmxlIHJvdyB3aWxsIHNoYWRlIG9uIGhvdmVyLlxuICAgKi9cbiAgaG92ZXI6IFByb3BUeXBlcy5ib29sLFxuXG4gIC8qKlxuICAgKiBJZiBgdHJ1ZWAsIHRoZSB0YWJsZSByb3cgd2lsbCBoYXZlIHRoZSBzZWxlY3RlZCBzaGFkaW5nLlxuICAgKi9cbiAgc2VsZWN0ZWQ6IFByb3BUeXBlcy5ib29sXG59IDogdm9pZCAwO1xuZXhwb3J0IGRlZmF1bHQgd2l0aFN0eWxlcyhzdHlsZXMsIHtcbiAgbmFtZTogJ011aVRhYmxlUm93J1xufSkoVGFibGVSb3cpOyJdLCJuYW1lcyI6WyJSZWFjdC5jcmVhdGVDb250ZXh0Iiwic3R5bGVzIiwiZGVmYXVsdENvbXBvbmVudCIsIlJlYWN0LmZvcndhcmRSZWYiLCJSZWFjdC51c2VNZW1vIiwiUmVhY3QuY3JlYXRlRWxlbWVudCIsIlRhYmxlQ29udGV4dCIsInRhYmxlbHZsMiIsIlRhYmxlbHZsMkNvbnRleHQiLCJSZWFjdC51c2VDb250ZXh0Il0sIm1hcHBpbmdzIjoidUtBS0EsR0FBSSxHQUFlQSw0QkFNSixFQ0hKQyxFQUFTLFNBQWdCLEVBQU8sQ0FDekMs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
