import { Service } from "typedi";

@Service()
class ResponseUtil {
    public ResponseCode = {
        Success: 0,
        InvalidInput: 1,
    }

    public getResponseMsg  = (code: number) => {
        switch (code) {
            case this.ResponseCode.Success:
                return 'Success';
            case this.ResponseCode.InvalidInput:
                return 'Invalid Input';
            default:
                return 'Internal Server Error';
        }
    }
}

export default ResponseUtil;