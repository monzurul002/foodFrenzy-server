const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const multer = require("multer")
const storage = multer.diskStorage({});
const upload = multer({ storage: storage });
const cloudinary = require('cloudinary').v2
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000;

const cors = require("cors");
app.use(express.json())
app.use(cors())
require('dotenv').config()

//cloundianry cofig
cloudinary.config({
    cloud_name: 'dj7z2d6lv',
    api_key: '775228647313376',
    api_secret: 'kv06GEzPWW0OVgMhZYj8S7VuWGg',

});

// const tokenVerify = (req, res, next) =



app.get("/", (req, res) => {
    res.send("<h1 >Welocome to fooFrenzy</h1>")
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.tc2rlfo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        //   database and collection
        const menuCollection = client.db("foodFrenzy").collection("menu");
        const cartCollection = client.db("foodFrenzy").collection("cart")
        //menu collection
        app.get("/menu", async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result)
        })

        app.get("/menu/single/:id", async (req, res) => {
            const { id } = req.params;
            const filter = { _id: (id) };
            const result = await menuCollection.findOne(filter);
            res.send(result)
        })
        app.post("/menu/addItem", upload.single("image"), async (req, res) => {
            const { name, category, price, recipe, email } = req.body;
            const itemInfo = { name, category, price, recipe, email };
            const image = req.file;

            try {
                const uploadImage = await cloudinary.uploader
                    .upload(image.path)
                itemInfo.image = uploadImage.url;

                const result = await menuCollection.insertOne(itemInfo);
                res.send(result)

            }
            catch (error) {
                console.log(error);
            }

        })

        // get menu by email;
        app.get("/menu/myitem/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email }
            const result = await menuCollection.find(filter).toArray();

            res.send(result)
        })

        app.delete("/menu/:id", async (req, res) => {
            const { id } = req.params;
            const filter = { _id: new ObjectId(id) }
            const result = await menuCollection.deleteOne(filter);
            res.send(result)
        })


        //cart collection
        app.post("/cart", async (req, res) => {
            const cartInfo = req.body;

            const filter = { menuItemId: cartInfo.menuItemId }
            const found = await cartCollection.find(filter).toArray();



            const foundItem = found.find(item => item.email === cartInfo.email)

            if (found === null || !foundItem) {

                const result = await cartCollection.insertOne(cartInfo);
                return res.send(result)
            } else {
                return res.send({ message: "Item already been added" })
            }
        })



        app.get("/cart/:email", async (req, res) => {
            const email = req.params.email;
            const result = await cartCollection.find({ email }).toArray();
            res.send(result)
        })
        // app.get("/cart/:id", async (req, res) => {
        //     const { id } = req.params;

        //     const result = await cartCollection.findOne({ _id: new ObjectId(id) })
        //     console.log(result);
        //     res.send(result)
        // })

        app.put("/cart/:id", async (req, res) => {
            const { id } = req.params;
            const filter = { _id: new ObjectId(id) }
            const { quantity } = req.body;

            const updateDoc = {
                $set: {
                    quantity: parseInt(quantity, 10)
                }
            }
            const result = await cartCollection.updateOne(filter, updateDoc, { upsert: true });
            res.send(result)
        })

        app.delete("/cart/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(filter);

            res.send(result)
        })

        //jwt authenticaton
        app.post("/jwt", async (req, res) => {
            const userEmail = req.query;
            const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN, { expiresIn: "1d" })

            res.send({ token })

        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
app.listen(port, () => {
    console.log("Server is running.");
})

