import { Request, Response } from "express";
import * as orm from "typeorm";
import { AuthorizedUser } from "./users.interface";
// import { User } from "./users.interface";
export interface OrmContext {
    orm: typeof orm
    req: Request
    res: Response
    user: AuthorizedUser | null
}