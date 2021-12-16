import { OrmContext } from "../interfaces/orm.context.interface";
import { Ctx, Query, Resolver } from "type-graphql";
import { Service } from "typedi";

@Service()
@Resolver()
class IndexResolver {
    @Query(() => String)
    hello(
        @Ctx() {user}: OrmContext
    ) {
        if(!user) {
            return "Hello Cupcake! Please Login";
        }
        return `Hello ${user.userName}!`;
    }
}

export default IndexResolver