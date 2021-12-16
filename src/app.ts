import "reflect-metadata";
import * as orm from "typeorm";
import {ApolloServer} from 'apollo-server-express';
import express from "express";
import morgan from "morgan"; 
import compression from 'compression';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from "helmet";
import {buildSchema} from 'type-graphql';
import { Container } from "typedi";
import { Routes } from "./interfaces/routes.interface";
import IndexResolver from "./resolvers/index.resolver";
import UserResolver from "./resolvers/auth.resolver";
import { OrmContext } from "./interfaces/orm.context.interface";
import { AuthorizedUser } from "./interfaces/users.interface";
import LoggerUtils from "./utils/logger.utils";
import { ApolloServerLoaderPlugin } from "type-graphql-dataloader";
import { useContainer } from "typeorm";
import AuthService from "./services/auth.service";

class App {
    public apolloServer: ApolloServer;
    public app: express.Application;
    public port: string | number;
    public env: string;
    public errLogger = new LoggerUtils().getLogger("error");

    constructor(routes: Routes[]) {
        this.app = express();
        this.port = process.env.PORT || 8092;
        this.env = process.env.NODE_ENV || "development";

        useContainer(Container);
        orm.useContainer(Container);

        this.initializeMiddlewares();
        this.initializeRoutes(routes);
    }

    public async configureApollo() {
        try {
            this.apolloServer = new ApolloServer({
                schema: await buildSchema({
                    resolvers: [IndexResolver, UserResolver],
                    authChecker: ({ context: { user } }: { context: { user: AuthorizedUser } }) => {
                        if (user) return true;
                        return false;
                    },
                    container: Container,
                    validate: true,
                }),
                context: ({req, res}): OrmContext => {
                    const authSerice = new AuthService();
                    let user: AuthorizedUser | null = null;
                    const bearerTokenCombi = req.headers['authorization'] ? req.headers['authorization'] : '';
                    authSerice.verifyUser(bearerTokenCombi, (jwtUser) => {
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
                },
                plugins: [
                    ApolloServerLoaderPlugin({
                        typeormGetConnection: () => orm.getConnection(),
                    })
                ],
            });
            await this.apolloServer.start()
            await this.apolloServer.applyMiddleware({app:this.app})
        } catch (error) {
            this.errLogger.error("Service: Apollo Server - Error: " + error);
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
                    const conn = await orm.createConnection();
                    await conn.runMigrations();
                    */
                    const conn = await orm.createConnection();
                    await conn.runMigrations();
                    console.log(`==================================`);
                    console.log(`======= ENV: ${this.env} =========`);
                    console.log(`✔ App listening on the port ${this.port}🤞`);
                    console.log(`==================================`);
                } catch (err) {
                    this.errLogger.error("Service: App Server - Error: " + err);
                }
            })  
        } catch (error) {
            this.errLogger.error("Service: App Server - Error: " + error);  
        }
    }

    public getServer(): express.Application {
        return this.app;
    }

    private initializeMiddlewares() {
        this.app.use(morgan("dev"));
        this.app.use(cors());
        /*
        ----------------------------- For production use only ---------------------------
        ---- Using this in development won't allow you to use graphql sandbox ----
        */
       if(process.env.NODE_ENV === "production") {
            // this.app.use(hpp());
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
       }
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