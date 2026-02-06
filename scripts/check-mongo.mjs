import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://admin:1234@direchentt-headless-adm.03s5pj6.mongodb.net/direchentt-headless-admin?retryWrites=true&w=majority";

async function checkStore() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('direchentt-headless-admin');
        const stores = db.collection('stores');

        const store = await stores.findOne({ storeId: "5112334" });
        console.log("STORE DATA IN MONGO:");
        console.log(JSON.stringify(store, null, 2));

    } finally {
        await client.close();
    }
}

checkStore().catch(console.error);
