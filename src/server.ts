import 'dotenv'
import App from './app';
import IndexRoute from './routes/index.route';

const app = new App([new IndexRoute()]);

async function start() {
    await app.start();
}

start()