import { Logger } from "log4js";
import argon2 from "argon2";
import jwt from "jsonwebtoken"
import { UserEntity } from "../entities/User";
import { User } from "../interfaces/users.interface";
import { EntityRepository, Repository } from "typeorm";
import LoggerUtils from "../utils/logger.utils";
import { Service } from "typedi";

@Service()
@EntityRepository(UserEntity)
class AuthService extends Repository<UserEntity> {
    
    public readonly errLogger: Logger
    constructor() {
        super()
        this.errLogger = new LoggerUtils().getLogger("Error")
    }

    private AUTH_EXPIRES_IN = process.env.JWTKEY_EXPIRY || '1h';
    private REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_KEY_EXPIRY || '24h';

    public async register(userName: string, email: string, password: string): Promise<User | string> {
        try {
            const prevUser = await this.findOne({ where: { email } });
            if (prevUser) {
                return "User already exists";
            }
            await this.queryRunner?.startTransaction();
            const newUser = this.create({ userName, email, password });
            await this.save(newUser);
            await this.queryRunner?.commitTransaction();
            return newUser;
        } catch (error) {
            await this.queryRunner?.rollbackTransaction();
            this.errLogger.error("Service: DBC AuthService register Error: " + error);
            throw new Error(error);
        } finally {
            await this.queryRunner?.release();
        }
    }

    public async login(email: string): Promise<User | undefined> {
        try {
            const user = await this.findOne({ where: { email } });
            return user;
        } catch (error) {
            this.errLogger.error("Service: DBC AuthService login Error: " + error);
            throw new Error(error);
        }
    }

    public async authenticate(userName: string, password: string) {
        const user = await this.findOne({ where: { email: userName } });
        if (!user) {
            return {
                errors: [{ field: "email", message: "User not found" }],
            }
        }
        const match =  await argon2.verify(user.password, password);
        if (!match) {
            return {
                errors: [{ field: "password", message: "Incorrect Password" }],
            }
        }
        const jwtUser = {
            id: user.id,
            email: user.email,
            userName: user.userName,
        }
        const token = jwt.sign(jwtUser, process.env.JWT_KEY || 'jwt_secret', { expiresIn: this.AUTH_EXPIRES_IN });
        const refreshToken = jwt.sign(jwtUser, process.env.JWT_REFRESH_KEY || 'jwt_secret', { expiresIn: this.REFRESH_EXPIRES_IN });
        return {
            user: user,
            token: token,
            refreshToken: refreshToken,
            errors: [],
        };
    }
    
    public verifyUser(bearerTokenCombi: string, callback: (user: null | undefined | jwt.JwtPayload) => void) {
        const token = bearerTokenCombi ? bearerTokenCombi.split(' ')[1] : null;
        if (!token) {
            return callback(null);
        }
        jwt.verify(token, process.env.JWT_KEY || 'jwt_secret', (err, decoded) => {
            if (err) {
                this.errLogger.error("Service: auth.middleware - verify user - Error: " + err);
                return callback(null);
            }
            return callback(decoded);
        })
    }
}

export default AuthService;