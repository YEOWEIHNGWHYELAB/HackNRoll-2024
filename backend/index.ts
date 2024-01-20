import Koa from 'koa';

const app = new Koa();

const port = 1234;
app.listen(port, () => {
    console.log(`🚀 Server is running on port http://localhost:${port}/`);
});
