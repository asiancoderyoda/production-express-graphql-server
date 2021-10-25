import "reflect-metadata";
import * as orm from "typeorm";
import {ApolloServer} from 'apollo-server-express';
import express from "express";
import morgan from "morgan"; 
import compression from 'compression';
import cors from 'cors';
import bodyParser from 'body-parser';
// import helmet from "helmet";
import {buildSchema} from 'type-graphql';
import { Routes } from "./interfaces/routes.interface";
import IndexResolver from "./resolvers/index.resolver";
import AuthResolver from "./resolvers/auth.resolver";
import { OrmContext } from "./interfaces/orm.context.interface";
import AuthUtil from "./middlewares/auth.middleware";
import { AuthorizedUser } from "./interfaces/users.interface";

class App {
    public apolloServer: ApolloServer;
    public app: express.Application;
    public port: string | number;
    public env: string;

    constructor(routes: Routes[]) {
        this.app = express();
        this.port = process.env.PORT || 8092;
        this.env = process.env.NODE_ENV || "development";

        this.initializeMiddlewares();
        this.initializeRoutes(routes);
    }

    public async configureApollo() {
        try {
            this.apolloServer = new ApolloServer({
                schema: await buildSchema({
                    resolvers: [IndexResolver, AuthResolver],
                    authChecker: ({ context: { user } }: { context: { user: AuthorizedUser } }) => {
                        if (user) {
                            return true;
                        }
                        return false;
                    },
                    validate: true
                }),
                context: ({req, res}): OrmContext => {
                    const authUtil: AuthUtil = new AuthUtil();
                    let user: AuthorizedUser | null = null;
                    const bearerTokenCombi = req.headers['authorization'] ? req.headers['authorization'] : '';
                    authUtil.verifyUser(bearerTokenCombi, (jwtUser) => {
                        if(jwtUser) {
                            const authorizedUser: AuthorizedUser = {
                                id: jwtUser.id,
                                userName: jwtUser.userName,
                                email: jwtUser.email,
                            }
                            user = authorizedUser;
                        }
                    });
                    return {orm: orm, req, res, user: user};
                }
            })
            await this.apolloServer.start()
            await this.apolloServer.applyMiddleware({app:this.app})
        } catch (error) {
            console.log(error)
        }
    }

    public async start() {
        try {
            await this.configureApollo();
            this.app.listen(this.port, async() => {
                try {
                    /*
                    for creating your migrations folder and files:
                    npx typeorm migrations:create -n Test
    
                    for auto generating migration queries
                    npx ts-node ./node_modules/.bin/typeorm migration:generate -n Test2
                    OR
                    npx ts-node ./node_modules/typeorm/cli.js migration:generate -n Test2
                    either one will work
    
                    for running migration:
                    npx ts-node ./node_modules/typeorm/cli.js migration:run
    
                    for running auto migrations... on server start
                    const conn = await createConnection();
                    await conn.runMigrations();
                    */
                    await orm.createConnection();
                    console.log(`==================================`);
                    console.log(`======= ENV: ${this.env} =========`);
                    console.log(`✔ App listening on the port ${this.port}🤞`);
                    console.log(`==================================`);
                } catch (err) {
                    console.error(err);
                }
            })  
        } catch (error) {
            console.log(error)   
        }
    }

    public getServer(): express.Application {
        return this.app;
    }

    private initializeMiddlewares() {
        this.app.use(morgan("dev"));
        this.app.use(cors());
        /*
        ---- For production use ----
        this.app.use(hpp());
        this.app.use(helmet.contentSecurityPolicy());
        this.app.use(helmet.dnsPrefetchControl());
        this.app.use(helmet.expectCt());
        this.app.use(helmet.frameguard());
        this.app.use(helmet.hidePoweredBy());
        this.app.use(helmet.hsts());
        this.app.use(helmet.ieNoOpen());
        this.app.use(helmet.noSniff());
        this.app.use(helmet.permittedCrossDomainPolicies());
        this.app.use(helmet.referrerPolicy());
        this.app.use(helmet.xssFilter());
        */
        this.app.use(compression());
        this.app.use(express.json({limit: '15mb'}));
        this.app.use(express.urlencoded({limit: '15mb', extended: true}));
        this.app.use(bodyParser.urlencoded({limit: '15mb', extended: true}));
    }
    
    private initializeRoutes(routes: Routes[]) {
        routes.forEach(route => {
          this.app.use('/', route.router);
        });
    }
}

export default App;