import express from 'express'
import { MongoClient } from 'mongodb'
import { MONGOPW } from './config.js'
import { ResponseError } from './utils/ResponseError.js'
import { minOfArray } from './utils/Utils.js'
import cookieParse from 'cookie-parser'
import { CheckAuth } from './utils/Auth.js'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()

app.use(express.json())
app.use(cookieParse())
app.use(cors({ credentials: true, origin: 'http://localhost:3001' }))
//for react app
app.use(express.static(path.resolve(__dirname, './client/build')))

const url = `mongodb+srv://partheev:${MONGOPW}@cluster0.kqwvw.mongodb.net`

const client = await MongoClient.connect(url, { maxPoolSize: 10 })

const usersClient = client.db('jackfruit').collection('users')
const usersDataClient = client.db('jackfruit').collection('usersData')

app.post('/api/signup', async (req, res) => {
    const { email, name, password } = req.body
    try {
        await usersClient.insertOne({ email, name, password })
        res.send({ message: 'User created.' })
    } catch (e) {
        ResponseError(res)
    }
})

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const foundUser = await usersClient.findOne({ email })
        if (foundUser.password !== password) {
            return ResponseError(res, 400, 'Invalid credentials.')
        }
        res.cookie('userId', foundUser._id, {
            maxAge: 1000 * 60 * 60 * 24,
        })
        res.send({ message: 'Signed in successful.', userId: foundUser._id })
    } catch (e) {
        ResponseError(res)
    }
})

app.post('/api/auth', CheckAuth, (req, res) => {
    res.send({ message: 'Authorized successful.' })
})
app.post('/api/logout', (req, res) => {
    res.cookie('userId', '', {
        maxAge: 0,
    })
    res.send({ message: 'Logout successful.' })
})

app.post('/api/taxableData', CheckAuth, async (req, res) => {
    const { Bas, LTA, HRA, FA, Inv, Rent, CityType, Med } = req.body
    if (!Bas || !LTA || !HRA || !FA || !Inv || !Rent || !CityType || !Med) {
        return ResponseError(res, 400, 'Invalid Data.')
    }

    const userId = req.cookies.userId
    let AppHRA

    if (CityType === 'MetroCity') {
        AppHRA = minOfArray([Bas * (1 / 2), Rent - Bas * (1 / 10), HRA])
    } else {
        AppHRA = minOfArray([Bas * (40 / 100), Rent - Bas * (1 / 10), HRA])
    }

    const TaxInc = Bas + LTA + HRA + FA - AppHRA - Inv - Med
    const data = {
        userId,
        Bas,
        LTA,
        HRA,
        FA,
        Inv,
        Rent,
        CityType,
        Med,
        AppHRA,
        TaxInc,
    }
    try {
        await usersDataClient.insertOne(data)
        res.send(data)
    } catch (e) {
        return ResponseError(res)
    }
})

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, './client/build', 'index.html'))
})
app.all('*', (req, res) => {
    res.send({ message: 'API not found.' })
})

app.listen(process.env.PORT, () => {
    console.log('listening on port ' + process.env.PORT + '..........')
})
