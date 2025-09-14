import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";

export default function configurePassport(db) {
	passport.serializeUser((user, done) => done(null, user.id));
	passport.deserializeUser(async (id, done) => {
		try {
			const res = await db.query(
				"select id, email, google_id from users where id=$1",
				[id]
			);
			done(null, res.rows[0] || null);
		} catch (err) {
			done(err);
		}
	});

	//local strategy
	passport.use(
		new LocalStrategy(
			{ usernameField: "email" },
			async (email, password, done) => {
				try {
					const res = await db.query("select * from users where email=$1", [
						email,
					]);
					if (res.rows.length === 0)
						return done(null, false, { message: "No user" });

					const user = res.rows[0];
					if (!user.password)
						return done(null, false, { message: "Use Google sign in" });

					const match = await bcrypt.compare(password, user.password);
					if (!match)
						return done(null, false, { message: "Wrong credentials" });

					return done(null, user);
				} catch (err) {
					return done(err);
				}
			}
		)
	);

	//google strategy
	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
				userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
			},
			async (accessToken, refreshToken, profile, done) => {
				try {
					const googleId = profile.id;
					const email =
						profile.emails && profile.emails[0] && profile.emails[0].value;

					let res = await db.query(
						"select * from users where google_id=$1 or email=$2",
						[googleId, email]
					);
					if (res.rows.length === 0) {
						res = await db.query(
							"insert into users (email, google_id) values ($1, $2) returning *",
							[email, googleId]
						);
					} else if (!res.rows[0].google_id) {
						await db.query("update users set google_id=$1 where id=$2", [
							googleId,
							res.rows[0].id,
						]);
						res = await db.query("select * from users where id=$1", [
							res.rows[0].id,
						]);
					}
					done(null, res.rows[0]);
				} catch (err) {
					done(err);
				}
			}
		)
	);
	return passport;
}
