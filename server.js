const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

let waiting = { Hombre: [], Mujer: [] };

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        let data = JSON.parse(message);

        if (data.type === 'register') {
            ws.user = { nombre: data.nombre, sexo: data.sexo, foto: data.foto };
            waiting[data.sexo].push(ws);

            // Intenta emparejar
            let otherSexo = data.sexo === 'Hombre' ? 'Mujer' : 'Hombre';
            if (waiting[otherSexo].length > 0) {
                let pareja = waiting[otherSexo].shift();
                let yo = waiting[data.sexo].shift();

                // Envía datos de la pareja a cada uno
                pareja.send(JSON.stringify({ type: 'match', user: ws.user }));
                yo.send(JSON.stringify({ type: 'match', user: pareja.user }));

                // Guarda referencia para señalización
                pareja.pareja = yo;
                yo.pareja = pareja;
            }
        }

        // Señalización WebRTC (opcional)
        if (data.type === 'signal' && ws.pareja) {
            ws.pareja.send(JSON.stringify({ type: 'signal', signal: data.signal }));
        }
    });

    ws.on('close', function() {
        if (ws.user && waiting[ws.user.sexo]) {
            waiting[ws.user.sexo] = waiting[ws.user.sexo].filter(u => u !== ws);
        }
        if (ws.pareja) {
            ws.pareja.send(JSON.stringify({ type: 'end' }));
            ws.pareja.pareja = null;
        }
    });
});

console.log('Servidor WebSocket corriendo en ws://localhost:3000');