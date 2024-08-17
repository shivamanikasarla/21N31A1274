const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/shiva');

const db = mongoose.connection;


db.on('connected', () => {
    console.log('Connected to the MongoDB');
});


const registrationSchema = new mongoose.Schema({
    company_Name: String,
    client_ID: String,
    client_Secret: String,
    owner_Name: String,
    owner_Email: String,
    roll_No: String,
});

// Create a model based on the schema
const Registration = mongoose.model('Registrations', registrationSchema);

// POST endpoint for obtaining Authorization Token
app.post('/test/auth', async (req, res) => {
    // Extract registration data from request body
    const { company_Name, client_ID, client_Secret, owner_Name, owner_Email, roll_No } = req.body;

    try {
        // Check if the provided clientID and clientSecret match the stored data
        const registration = await Registration.findOne({ company_Name, client_ID, client_Secret });

        // If registration data is found, generate JWT token
        if (registration) {
            const token = jwt.sign(
                {
                    company_Name: registration.company_Name,
                    owner_Name: registration.owner_Name,
                    owner_Email: registration.owner_Email,
                    roll_No: registration.roll_No,
                },
                'your_main_key', 
                { expiresIn: '9d' } // Token expiration time (7 days)
            );

            // Respond with the generated token
            res.status(200).json({
                token_type: 'Bearer',
                access_token: token,
                expires_in: Math.floor(Date.now() / 1000) + 980000, // Current timestamp + 9 days (in seconds)
            });
        } else {
            // If registration data doesn't match, return error
            res.status(401).json({ error: 'Unauthorized user' });
        }
    } catch (error) {
        console.error('Error generating authorization token:', error);
        res.status(500).json({ error: 'Failed to generate authorization token' });
    }
});

// POST endpoint for registration
app.post('/test/register', async (req, res) => {
    
    const { companyName, ownerName, rollNo, ownerEmail, accessCode } = req.body;

    // Generate clientID (UUID)
    const clientID = uuidv4();

    // Generate clientSecret (Random string)
    const clientSecret = generateRandomString();


    try {
        const registration = new Registration({
            company_Name,
            client_ID,
            client_Secret,
            owner_Name,
            owner_Email,
            roll_No,
        });
        await registration.save();
        // Respond with registration details
        res.json({
            company_Name,
            client_ID,
            client_Secret,
            owner_Name,
            owner_Email,
            roll_No,
        });
    } catch (error) {
        console.error('Error  for saving registration:', error);
        res.status(500).json({ error: 'unsucessful to register the  company' });
    }
});

// GET endpoint to fetch all registration data
app.get('/test/register', async (req, res) => {
    try {
        const registrations = await Registration.find();
        res.json(registrations);
    } catch (error) {
        console.error('Error  to fetching registration:', error);
        res.status(500).json({ error: 'Failed to fetch registration' });
    }
});

// Function to generate random string for clientSecret
function generateRandomString() {
    return crypto.randomBytes(16).toString('hex');
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on the port ${PORT}`);
});
