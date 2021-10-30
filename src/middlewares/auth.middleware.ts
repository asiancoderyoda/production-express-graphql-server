import argon2 from "argon2";
import jwt from "jsonwebtoken"
import LoggerUtils from "src/utils/logger.utils";
import AuthService from '../services/auth.service';

class AuthUtil {
    private authService: AuthService = new AuthService();

    private AUTH_EXPIRES_IN = process.env.JWTKEY_EXPIRY || '1h';
    private REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_KEY_EXPIRY || '24h';

    public errLogger = new LoggerUtils().getLogger("error");

    public async authenticate(userName: string, password: string) {
        const user = await this.authService.login(userName)
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

export default AuthUtil;