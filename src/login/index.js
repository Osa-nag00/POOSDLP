import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import cors from 'cors';
import path from "path";
import passport from 'passport';
import './auth.js';
import { User } from './models/userModel.js';

function isLoggedIn(request, response, next) {
    request.user ? next() : response.sendStatus(401);
}

const __dirname = path.resolve();
const templatePath = path.join(__dirname, '../templates');
dotenv.config({ path: '../../.env' });

const app = express();
app.use(session({ secret: 'cats' }));
app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.urlencoded({extended:false}));

// Middleware for parsing request body, handling CORS policy
app.use(express.json());
app.use(cors());

// Route for Home Page
app.get('/', (request, response) => {
    response.render("login");
});

// Route for Sign Up
app.get('/signup', (request, response) => {
    response.render("signup");
});

app.post("/signup", async (request, response) => {
    try {
        // If user did not enter username or password
        if (!request.body.username || 
            !request.body.password || 
            !request.body.email) {
            return response.status(400).json({
                error: 'Enter all required fields: username, password, e-mail',
            });
        }

        // If username already exists in the database
        const username = await User.findOne({ username: request.body.username });
        if (username) {
            return response.status(400).json({
                error: 'Username already exists. Please choose another.',
            });
        }

        // If email already exists
        const email = await User.findOne({ email: request.body.email });
        if (email) {
            return response.status(400).json({
                error: 'E-mail already exists. Please choose another.',
            });
        }

        // Else create a new user
        const newUser = {
            username: request.body.username,
            password: request.body.password,
            email: request.body.email,
        };

        const user = await User.create(newUser);

        response.render("home");
    }

    catch(error) {
        console.log(error.message);
        response.status(500).json({ error });
    }
});

// Route for Log In
app.post('/login', async (request, response) => {
    try {
        // check if the user exists 
        const user = await User.findOne({ username: request.body.username });

        if (user) { 
            // check if password matches 
            const result = request.body.password === user.password; 
            if (result) { 
              response.render("home"); 
            } 
            
            else { 
              response.status(400).json({ error: "Incorrect password" }); 
            }
        } 
        
        else { 
            response.status(400).json({ error: "Username not found" }); 
        }
    }

    catch(error) {
        response.status(400).json({ error });
    }
})

// Route for Google Authentication (OAuth)
app.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get('/google/callback',
    passport.authenticate('google', {
        successRedirect: '/protected',
        failureRedirect: '/auth/failure',
    })
);

app.get('/auth/failure', (request, response) => {
    response.status(400).json({ error: "Unable to authenticate with Google" });
});

// Route for when User is authenticated (shows Game page)
app.get('/protected', isLoggedIn, (request, response) => {
    response.render("home");
});

app.get('/logout', function(request, response, next) {
    if (request.user) {
        request.session.destroy();
        response.redirect("/");
    }

    else {
        response.redirect("/");
    }
});

// Connect to database
mongoose
    .connect(process.env.mongoDBURL)
    .then(() => {
        console.log('App connected to database');

        // server only runs if database connection is successful
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port: ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log(error);
    })
