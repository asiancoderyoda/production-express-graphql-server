import 'dotenv'
import App from './app';
import IndexRoute from './routes/index.route';
// import AuthRoute from '@routes/auth.route';

const app = new App([new IndexRoute()]);

async function start() {
    await app.start();
}

start()

// "watch": "tsc -w",
// "start": "node dist/server.js",
// "start2": "ts-node src/server.ts",
// "dev": "nodemon --exec ts-node src/server.ts",
// "dev2": "nodemon dist/server.js"
// "build": "tsc && npx tsc-alias",
// "start": "npm run build && cross-env NODE_ENV=production node dist/server.js",
// "dev": "cross-env NODE_ENV=development nodemon"