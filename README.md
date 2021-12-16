# production-express-graphql-server
Production ready opiniated express server starter template, with all the abstraction included that you need to create a scalable stateless server.

## Setup
Steps to run this project in development mode:

1. Run `npm install` command
2. Setup database settings inside **ormconfig.json** file at the root directory
3. Enable `"logging": true` in **ormconfig.json**,
4. Your **ormconfig.json** should point to the dist folder during development
```json
"entities": [
  "dist/entities/**/*.js"
],
"migrations": [
    "dist/migrations/**/*.js"
],
"subscribers": [
    "dist/subscribers/**/*.js"
],
"cli": {
    "entitiesDir": "dist/entities",
    "migrationsDir": "dist/migrations",
    "subscribersDir": "dist/subscribers"
}
```
5. Open up two terminals, one for watch mode `npm run watch` and one for running nodemon `npm run dev`

You are good to go!!!

## Usage
In express.js (and other Node.js frameworks) we use middleware for authentication/authorization, like passport.js or the custom ones. However, in GraphQL's resolver architecture we don't have middleware so we have to imperatively call the auth checking function and manually pass context data to each resolver, which might be a bit tedious.

TypeGraphQl handles this with the help of decorators
To enforce authentication on a field, query or mutation declare a `@Authorized()` decorator

Take the example of a query. To enforce Authorization we do this

```ts
@Authorized()
@Query(() => String)
checkUser(
    @Ctx() {user}: OrmContext
) {
    return `Hello ${user.userName}!`;
}
```


