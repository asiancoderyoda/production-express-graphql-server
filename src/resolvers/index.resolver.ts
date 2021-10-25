import { OrmContext } from "../../src/interfaces/orm.context.interface";
import { Ctx, Query, Resolver } from "type-graphql";

@Resolver()
class IndexResolver {
    // @Authorized()
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