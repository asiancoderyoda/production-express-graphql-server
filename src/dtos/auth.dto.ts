import { Service } from "typedi";
import { FieldErrorResponse } from "../interfaces/httpResponse.intenterface";
import { validateEmail, validatePassword } from "../utils/patterns.utils";
import ResponseUtil from "../utils/response.utils";

interface RegisterInput {
    userName: string;
    email: string;
    password: string;
  }

interface LoginInput {
  email: string;
  password: string;
}

@Service()
class AuthDto {
    private readonly responseCode
    constructor() {
        this.responseCode = new ResponseUtil().ResponseCode
    }

    public registerDto(args: RegisterInput): FieldErrorResponse {
        if(args.userName.length < 3 || args.userName.length > 20) {
            return {
                errors: [{ field: "userName", message: "User Name must be between 3 and 20 characters" }],
                code: this.responseCode.InvalidInput,
            }
        }  
        if(!validateEmail(args.email)) {
            return {
                errors: [{ field: "email", message: "Invalid Email ID" }],
                code: this.responseCode.InvalidInput,
            }
        }
        if(!validatePassword(args.password)) {
            return {
                errors: [{ field: "password", message: "Invalid Password. Should contain 8-20 characters, 1 Upper Case, 1 Lower Case, 1 digit, 1 Special Character" }],
                code: this.responseCode.InvalidInput,
            }
        }
        return {
            errors: [],
            code: this.responseCode.Success,
        }
    }

    public loginDto(args: LoginInput): FieldErrorResponse {
        if(!validateEmail(args.email)) {
            return {
                errors: [{ field: "email", message: "Invalid Email ID" }],
                code: this.responseCode.InvalidInput,
            }
        }
        if(!validatePassword(args.password)) {
            return {
                errors: [{ field: "password", message: "Invalid Password. Should contain 8-20 characters, 1 Upper Case, 1 Lower Case, 1 digit, 1 Special Character" }],
                code: this.responseCode.InvalidInput,
            }
        }
        return {
            errors: [],
            code: this.responseCode.Success,
        }
    }
}

export default AuthDto;