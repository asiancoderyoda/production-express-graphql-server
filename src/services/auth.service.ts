import { UserEntity } from "../entities/User";
import { User } from "../interfaces/users.interface";
import { getRepository } from "typeorm";

class AuthService {
    public users = UserEntity;
    private userRepository = getRepository(this.users);

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
            throw new Error(error);
        }
    }
}

export default AuthService;