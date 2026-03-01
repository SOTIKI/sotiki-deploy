FROM node:22-alpine
WORKDIR /app
RUN node -e "require('http').createServer((req,res)=>{ \
  if(req.url==='/health') return res.end(JSON.stringify({status:'ok',stub:true})); \
  res.end(JSON.stringify({stub:true})); \
}).listen(3000,()=>console.log('[stub] listening on :3000'))" > server.js
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]