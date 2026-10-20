
// const WebSocket = require('ws');

// const server = new WebSocket.Server({
//   host: '0.0.0.0',
//   port: 8080,
// });

// console.log('PhoneWheel receiver listening on port 8080');

// server.on('connection', (socket) => {
//   console.log('Phone connected! 🏎️');

//   socket.on('message', (message) => {
//     try {
//       const data = JSON.parse(message.toString());

//       if (typeof data.steering === 'number') {
//         const steering = Math.max(
//           -100,
//           Math.min(100, data.steering)
//         );

//         process.stdout.write(
//           `\rSteering: ${steering.toFixed(1).padStart(6)}%   `
//         );
//       }
//     } catch {
//       console.log('\nInvalid message received');
//     }
//   });

//   socket.on('close', () => {
//     console.log('\nPhone disconnected');
//   });

//   socket.on('error', (error) => {
//     console.error('\nSocket error:', error.message);
//   });
// });

// server.on('error', (error) => {
//   console.error('Server error:', error.message);
// });

// const bridgeServer = new WebSocket.Server({
//   host: '127.0.0.1',
//   port: 8082,
// });

// console.log('Python bridge endpoint listening on port 8082');

// bridgeServer.on('connection', (socket) => {
//   console.log('Python controller bridge connected! 🎮');

//   socket.on('close', () => {
//     console.log('Python bridge disconnected');
//   });
// });

// server.on('connection', (socket) => {
//   console.log('Phone connected! 🏎️');

//   socket.on('message', (message) => {
//     try {
//       const data = JSON.parse(message.toString());

//       if (typeof data.steering === 'number' &&
//           Number.isFinite(data.steering)) {
//         const steering = Math.max(
//           -100,
//           Math.min(100, data.steering)
//         );

//         process.stdout.write(
//           `\rSteering: ${steering.toFixed(1).padStart(6)}%   `
//         );

//         // Forward the live value to every connected Python bridge.
//         const payload = JSON.stringify({ steering });

//         for (const client of bridgeServer.clients) {
//           if (client.readyState === WebSocket.OPEN) {
//             client.send(payload);
//           }
//         }
//       }
//     } catch {
//       console.log('\nInvalid message received');
//     }
//   });

//   socket.on('close', () => {
//     console.log('\nPhone disconnected');
//   });

//   socket.on('error', (error) => {
//     console.error('\nSocket error:', error.message);
//   });
// });

// server.on('error', (error) => {
//   console.error('Phone server error:', error.message);
// });

// bridgeServer.on('error', (error) => {
//   console.error('Bridge server error:', error.message);
// });



const WebSocket = require('ws');

const server = new WebSocket.Server({
  host: '0.0.0.0',
  port: 8080,
});

const bridgeServer = new WebSocket.Server({
  host: '127.0.0.1',
  port: 8082,
});

console.log('PhoneWheel receiver listening on port 8080');
console.log('Python bridge endpoint listening on port 8082');

bridgeServer.on('connection', (socket) => {
  console.log('Python controller bridge connected! 🎮');

  socket.on('close', () => {
    console.log('Python bridge disconnected');
  });

  socket.on('error', (error) => {
    console.error('Bridge socket error:', error.message);
  });
});

server.on('connection', (socket) => {
  console.log('Phone connected! 🏎️');

  socket.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (
        typeof data.steering !== 'number' ||
        !Number.isFinite(data.steering)
      ) {
        return;
      }

      const steering = Math.max(-100, Math.min(100, data.steering));

      const throttle =
        typeof data.throttle === 'number' && Number.isFinite(data.throttle)
          ? Math.max(0, Math.min(100, data.throttle))
          : 0;

      const brake =
        typeof data.brake === 'number' && Number.isFinite(data.brake)
          ? Math.max(0, Math.min(100, data.brake))
          : 0;

      const payload = JSON.stringify({
        steering,
        throttle,
        brake,
      });

      process.stdout.write(
        `\rSteer: ${steering.toFixed(0).padStart(4)}% | ` +
        `Accel: ${throttle.toFixed(0).padStart(3)}% | ` +
        `Brake: ${brake.toFixed(0).padStart(3)}%   `
      );

      for (const client of bridgeServer.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    } catch {
      console.log('\nInvalid message received');
    }
  });

  socket.on('close', () => {
    console.log('\nPhone disconnected');
  });

  socket.on('error', (error) => {
    console.error('\nPhone socket error:', error.message);
  });
});

server.on('error', (error) => {
  console.error('Phone server error:', error.message);
});

bridgeServer.on('error', (error) => {
  console.error('Bridge server error:', error.message);
});
