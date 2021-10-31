import { UserEntity } from "../entities/User";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import { OrmContext } from "../interfaces/orm.context.interface";
import AuthService from "../services/auth.service";
import { User } from "../interfaces/users.interface";
import argon2 from "argon2";
import { validateEmail, validatePassword } from "../utils/patterns.utils";
import AuthUtil from "../middlewares/auth.middleware";
import LoggerUtils from "../utils/logger.utils";
import ResponseUtil from "../utils/response.utils";

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

@Resolver()
class UserResolver {
    public authService: AuthService = new AuthService();
    public authUtil: AuthUtil = new AuthUtil();
    public responseUtil: ResponseUtil = new ResponseUtil();
    public responseCode = this.responseUtil.ResponseCode
    public responseMessage = this.responseUtil.getResponseMsg;
    public errLogger = new LoggerUtils().getLogger("error");

    @Mutation(() => UserResponse)
    async register(
        @Arg("options", () => UserNamePasswordInput) options: UserNamePasswordInput,
        @Ctx() { orm }: OrmContext
    ): Promise<UserResponse> {
        try {
            if(options.userName.length < 3 || options.userName.length > 20) {
                return {
                    errors: [{ field: "userName", message: "User name must be between 3 and 20 characters" }],
                    code: this.responseCode.InvalidInput,
                }
            }  
            if(!validateEmail(options.email)) {
                return {
                    errors: [{ field: "email", message: "Invalid email" }],
                    code: this.responseCode.InvalidInput,
                }
            }
            if(!validatePassword(options.password)) {
                return {
                    errors: [{ field: "password", message: "Invalid Password. Should contain 8-20 characters, 1 Upper Case, 1 Lower Case, 1 digit, 1 Special Character" }],
                    code: this.responseCode.InvalidInput,
                }
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
            if(!validateEmail(options.email)) {
                return {
                    errors: [{ field: "email", message: "Invalid email" }],
                    code: this.responseCode.InvalidInput,
                }
            }
            if(!validatePassword(options.password)) {
                return {
                    errors: [{ field: "password", message: "Invalid Password. Should contain 8-20 characters, 1 Upper Case, 1 Lower Case, 1 digit, 1 Special Character" }],
                    code: this.responseCode.InvalidInput,
                }
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