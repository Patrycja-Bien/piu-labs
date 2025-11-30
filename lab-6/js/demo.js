import { createAjax } from './ajax.js';

const api = createAjax({
    baseURL: 'https://jsonplaceholder.typicode.com/',
    timeout: 6000,
    headers: {
        Accept: 'application/json',
    },
});

async function runDemo() {
    try {
        const todo = await api.get('/todos/1');
        console.log('GET /todos/1 ->', todo);

        const newPost = await api.post('/posts', {
            title: 'Ajax Demo',
            body: 'Hello',
            userId: 1,
        });
        console.log('POST /posts ->', newPost);
    } catch (e) {
        console.error('Ajax error:', e.message);
    }
}

runDemo();
