const tls = require('tls');
const https = require('https');
const crypto = require('crypto');

function sha256(s) {
    return crypto.createHash('sha256').update(s).digest('base64');
}

const options = {
    hostname: 'github.com',
    port: 443,
    path: '/',
    method: 'GET',
    checkServerIdentity: function(host, cert) {
        // Make sure the certificate is issued to the host we are connected to
        const err = tls.checkServerIdentity(host, cert);
        if (err) {
            return err;
        }

        // Pin the public key, similar to HPKP pin-sha25 pinning
        const pubkey256 = 'pL1+qb9HTMRZJmuC/bB/ZI9d302BYrrqiVuRyW+DGrU=';
        if (sha256(cert.pubkey) !== pubkey256) {
            const msg = 'Certificate verification error: ' +
                `The public key of '${cert.subject.CN}' ` +
                'does not match our pinned fingerprint';
            return new Error(msg);
        }

        // Pin the exact certificate, rather then the pub key
        const cert256 = '25:FE:39:32:D9:63:8C:8A:FC:A1:9A:29:87:' +
            'D8:3E:4C:1D:98:DB:71:E4:1A:48:03:98:EA:22:6A:BD:8B:93:16';
        if (cert.fingerprint256 !== cert256) {
            const msg = 'Certificate verification error: ' +
                `The certificate of '${cert.subject.CN}' ` +
                'does not match our pinned fingerprint';
            return new Error(msg);
        }

        // This loop is informational only.
        // Print the certificate and public key fingerprints of all certs in the
        // chain. Its common to pin the public key of the issuer on the public
        // internet, while pinning the public key of the service in sensitive
        // environments.
        do {
            console.log('Subject Common Name:', cert.subject.CN);
            console.log('  Certificate SHA256 fingerprint:', cert.fingerprint256);

            hash = crypto.createHash('sha256');
            console.log('  Public key ping-sha256:', sha256(cert.pubkey));

            lastprint256 = cert.fingerprint256;
            cert = cert.issuerCertificate;
        } while (cert.fingerprint256 !== lastprint256);

    },
};

options.agent = new https.Agent(options);

let sslService = {

    testSsl: () => {
        const req = https.request(options, (res) => {
            console.log('All OK. Server matched our pinned cert or public key');
            console.log('statusCode:', res.statusCode);
            // Print the HPKP values
            console.log('headers:', res.headers['public-key-pins']);

            res.on('data', (d) => {
                return true;
            });
        });

        req.on('error', (e) => {
            console.error(e.message);
            return false;
        });
        req.end();

        return true;
    }

};
module.exports = sslService;