export function serveAsset(request,asset){
 const headers={'content-type':asset.type,'cache-control':asset.type.startsWith('text/html')?'no-cache':'public,max-age=3600','accept-ranges':'bytes','x-content-type-options':'nosniff',etag:asset.etag};
 if(request.headers.get('if-none-match')===asset.etag)return new Response(null,{status:304,headers});
 const data=asset.data;const range=request.headers.get('range');
 if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(match){let start=match[1]?Number(match[1]):Math.max(0,data.length-Number(match[2])),end=match[1]?(match[2]?Number(match[2]):data.length-1):data.length-1;
  if(start>=data.length||end<start)return new Response(null,{status:416,headers:{...headers,'content-range':`bytes */${data.length}`}});end=Math.min(end,data.length-1);const part=data.slice(start,end+1);return new Response(request.method==='HEAD'?null:part,{status:206,headers:{...headers,'content-range':`bytes ${start}-${end}/${data.length}`,'content-length':String(part.length)}});}}
 return new Response(request.method==='HEAD'?null:data,{headers:{...headers,'content-length':String(data.length)}});
}
