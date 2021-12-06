import { UserEntity } from "../entities/User";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import { OrmContext } from "../interfaces/orm.context.interface";
import AuthService from "../services/auth.service";
import { User } from "../interfaces/users.interface";
import argon2 from "argon2";
import AuthUtil from "../middlewares/auth.middleware";
import LoggerUtils from "../utils/logger.utils";
import ResponseUtil from "../utils/response.utils";
import AuthDto from "../dtos/auth.dto";
import { Service } from "typedi";
import { Logger } from "log4js";

@InputType()
class UserNamePasswordInput {
  @Field(() => String)
  userName: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;
}

@InputType()
class LoginInput {
  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => Number, { nullable: false })
  code: number;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => UserEntity, { nullable: true })
  user?: User;

  @Field(() => String, { nullable: true })
  accessToken?: string;

  @Field(() => String, { nullable: true })
  refreshToken?: string;
}
// https://github.com/JayJayDee/TypeGraphQL-TypeORM-Example/blob/master/src/graphql-resolvers/player-resolver.ts
@Service()
@Resolver()
class UserResolver {
    // public authService: AuthService = new AuthService();
    // public authUtil: AuthUtil = new AuthUtil();
    // public responseUtil: ResponseUtil = new ResponseUtil();
    // public responseCode = this.responseUtil.ResponseCode
    // public errLogger = new LoggerUtils().getLogger("error");
    // public dto: AuthDto = new AuthDto();

    constructor(
        private readonly authService: AuthService,
        private readonly authUtil: AuthUtil,
        private readonly errLogger: Logger,
        private readonly dto: AuthDto,
        public responseUtil: ResponseUtil
    ) {
        this.errLogger = new LoggerUtils().getLogger("error");
    }

    public responseCode = this.responseUtil.ResponseCode

    @Mutation(() => UserResponse)
    async register(
        @Arg("options", () => UserNamePasswordInput) options: UserNamePasswordInput,
        @Ctx() { orm }: OrmContext
    ): Promise<UserResponse> {
        try {
            const fieldErrors = this.dto.registerDto({...options})
            if (fieldErrors.code !== this.responseCode.Success) {
                return fieldErrors;
            }
            const hashedPassword = await argon2.hash(options.password);
            const response: User | string = await this.authService.register(options.userName, options.email, hashedPassword);
            if (typeof response === "string") {
                return {
                    errors: [{ field: "email", message: response }],
                    code: this.responseCode.InvalidInput,
                }
            }
            return {
                user: response,
                code: this.responseCode.Success,
            };
        } catch (error) {
            this.errLogger.error("Resolver: auth.resolver register - Error: " + error);
            throw new Error(error);
        }
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options", () => LoginInput) options: LoginInput,
        @Ctx() { orm, req }: OrmContext
    ): Promise<UserResponse> {
        try {
            const fieldErrors = this.dto.loginDto({...options})
            if (fieldErrors.code !== this.responseCode.Success) {
                return fieldErrors;
            }
            const user = await this.authUtil.authenticate(options.email, options.password);
            if(user.errors.length > 0) {
                return {
                    errors: [...user.errors],
                    code: this.responseCode.InvalidInput,
                }
            }
            return {
                user: user.user,
                accessToken: user.token,
                refreshToken: user.refreshToken,
                code: this.responseCode.Success,
            };
        } catch (error) {
            this.errLogger.error("Resolver: auth.resolver login - Error: " + error);
            throw new Error(error);
        }
    }
    
}

export default UserResolver