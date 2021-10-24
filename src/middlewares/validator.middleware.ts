import { Request, Response, NextFunction } from 'express';
import { Result, ValidationError, validationResult } from 'express-validator';

const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors: Result<ValidationError> = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const extractedErrors: Array<Object> = []
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }))
  
    return res.status(422).json({errors: extractedErrors})
}

export default validate