import dns from 'node:dns';
import { Resolver } from 'node:dns/promises';

// Test with default DNS
console.log('=== Default DNS servers ===');
console.log('Servers:', dns.getServers());

try {
  const records = await dns.promises.resolveSrv('_mongodb._tcp.nodejs.prexbjw.mongodb.net');
  console.log('SRV records (default):', records);
} catch (e) {
  console.log('Default DNS failed:', e.code, e.message);
}

// Test with Google DNS
console.log('\n=== Google DNS (8.8.8.8) ===');
const resolver = new Resolver();
resolver.setServers(['8.8.8.8']);

try {
  const records = await resolver.resolveSrv('_mongodb._tcp.nodejs.prexbjw.mongodb.net');
  console.log('SRV records (Google):', records);
} catch (e) {
  console.log('Google DNS failed:', e.code, e.message);
}

// Test with Cloudflare DNS
console.log('\n=== Cloudflare DNS (1.1.1.1) ===');
const resolver2 = new Resolver();
resolver2.setServers(['1.1.1.1']);

try {
  const records = await resolver2.resolveSrv('_mongodb._tcp.nodejs.prexbjw.mongodb.net');
  console.log('SRV records (Cloudflare):', records);
} catch (e) {
  console.log('Cloudflare DNS failed:', e.code, e.message);
}

// Test basic connectivity
console.log('\n=== Basic DNS test (google.com) ===');
try {
  const addrs = await dns.promises.resolve4('google.com');
  console.log('google.com resolved:', addrs);
} catch (e) {
  console.log('google.com failed:', e.code, e.message);
}

// Test if the Atlas hostname resolves at all
console.log('\n=== Resolve nodejs.prexbjw.mongodb.net directly ===');
try {
  const addrs = await dns.promises.resolve4('nodejs.prexbjw.mongodb.net');
  console.log('Direct A record:', addrs);
} catch (e) {
  console.log('Direct resolve failed:', e.code, e.message);
}

// Try TXT record (also used by mongodb+srv)
console.log('\n=== TXT record for nodejs.prexbjw.mongodb.net ===');
try {
  const txt = await dns.promises.resolveTxt('nodejs.prexbjw.mongodb.net');
  console.log('TXT records:', txt);
} catch (e) {
  console.log('TXT resolve failed:', e.code, e.message);
}
