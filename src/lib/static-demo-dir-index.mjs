const DEMO_PREFIXES = ['/arena/demo/', '/relay/demo/'];

export function rewriteStaticDemoIndex(url) {
  if (!url) return url;
  const qi = url.indexOf('?');
  const path = qi === -1 ? url : url.slice(0, qi);
  const query = qi === -1 ? '' : url.slice(qi);
  return DEMO_PREFIXES.some((prefix) => path.startsWith(prefix)) && path.endsWith('/')
    ? `${path}index.html${query}`
    : url;
}

export default function staticDemoDirIndexDev() {
  return {
    name: 'static-demo-dir-index-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        req.url = rewriteStaticDemoIndex(req.url);
        next();
      });
    },
  };
}
