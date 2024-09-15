const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: JwtStrategy } = require('passport-jwt');
const { Employee } = require('../../models');
const { verifyPassword } = require('./cryptoHelper');

function extractJwtFromCookie(req) {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['jwt'];
    }
    return token;
}

passport.use(new JwtStrategy({
    jwtFromRequest: extractJwtFromCookie,
    secretOrKey: process.env.JWT_SECRET
}, (jwt_payload, done) => {
    const retrievedEmployee = Employee.findByPk(jwt_payload.id);
    if (retrievedEmployee)
        return done(null, retrievedEmployee);
    return done(null, false);
}));

passport.use(new LocalStrategy(
    {
        usernameField: 'emailAddress',
        passwordField: 'password'
    },
    async (emailAddress, password, done) => {
        const retrievedEmployee = await Employee.findOne({ where: { email: emailAddress } });
        if (!retrievedEmployee)
            return done(null, false, { message: 'Account Not Found' });
        verifyPassword(retrievedEmployee.password, retrievedEmployee.salt, password)
            .then((isMatch) => {
                if (!isMatch)
                    return done(null, false, { message: 'Incorrect password' });
                return done(null, retrievedEmployee);
            })
            .catch((err) => done(err));
    }));

passport.serializeUser((employee, done) => {
    done(null, employee.id);
});

passport.deserializeUser(async (id, done) => {
    let retrievedEmployee = await Employee.findByPk(id);
    done(null, retrievedEmployee);
});
