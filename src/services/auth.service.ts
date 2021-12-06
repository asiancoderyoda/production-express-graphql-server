import { UserEntity } from "../entities/User";
import { User } from "../interfaces/users.interface";
import { getRepository, Repository } from "typeorm";
import LoggerUtils from "../utils/logger.utils";
import { Service } from "typedi";
import { Logger } from "log4js";

@Service()
class AuthService {
    // private userRepository: Repository<UserEntity>
    // constructor() {
    //     this.userRepository = getRepository(UserEntity);
    // }
    // private errLogger = this.Logger.getLogger("error");
    // public users = UserEntity;
    // public errLogger = new LoggerUtils().getLogger("error");

    constructor(
        private readonly userRepository: Repository<UserEntity>,
        private readonly errLogger: Logger
    ) {
        this.userRepository = getRepository(UserEntity);
        this.errLogger = new LoggerUtils().getLogger("error");
    }

    public async register(userName: string, email: string, password: string): Promise<User | string> {
        try {
            const prevUser = await this.userRepository.findOne({ where: { email } });
            if (prevUser) {
                return "User already exists";
            }
            await this.userRepository.queryRunner?.startTransaction();
            const newUser = this.userRepository.create({ userName, email, password });
            await this.userRepository.save(newUser);
            await this.userRepository.queryRunner?.commitTransaction();
            return newUser;
        } catch (error) {
            await this.userRepository.queryRunner?.rollbackTransaction();
            this.errLogger.error("Service: DBC AuthService register Error: " + error);
            throw new Error(error);
        } finally {
            await this.userRepository.queryRunner?.release();
        }
    }

    public async login(email: string): Promise<User | undefined> {
        try {
            const user = await this.userRepository.findOne({ where: { email } });
            return user;
        } catch (error) {
            this.errLogger.error("Service: DBC AuthService login Error: " + error);
            throw new Error(error);
        }
    }
}

export default AuthService;