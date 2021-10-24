import { Request, Response, NextFunction } from 'express'

class IndexController {
    constructor() {
        
    }

    public index(req: Request, res: Response, next: NextFunction) {
        try {
            res.status(200).send(
                `<h2 style="border: 2px solid green">Hello Cupcakes</h2>`
            )
        } catch (err) {
            next(err)  
        }
    } 
}

export default IndexController;