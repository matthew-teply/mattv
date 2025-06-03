import os from "os";

export class ServiceNetwork {
    getLocalIP() {
        const interfaces = os.networkInterfaces();

        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }

        return '127.0.0.1'; // fallback if no external interface found
    }
}
