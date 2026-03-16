import { useState } from "react";
import "./LoginPage.css";
import axios from "axios";

export default function LoginPage({ onLogin }) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const api_url = import.meta.env.VITE_BACKEND_URL;

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!username || !password) {
			setError("Please enter credentials");
			return;
		}
		try {
			const res = await axios.post(`${api_url}/api/user/login`, { username, password }, {
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const resdata = res.data;
			console.log(resdata);
			document.cookie = `access_token=${resdata['access_token']}; path=/`;
			document.cookie = `username=${username}; path=/`;
			setLoading(true);
			setTimeout(() => {
				setLoading(false);
				onLogin(username);
			}, 800);
		} catch (err) {
			setError("Invalid Credentials")
		}
	};

	const handleForgot = () => {
		alert("Please contact and admin")
	}

	return (
		<div className="login-root">
			{/* diagonal decorative line */}
			<div className="login-diagonal" />

			<div className="login-left">
				<div className="login-card">
					<h2 className="login-title">Login</h2>
					<div className="login-card2">
						<form onSubmit={handleSubmit} className="login-form">
							<input
								className="login-input"
								type="text"
								placeholder="Username"
								value={username}
								onChange={(e) => { setUsername(e.target.value); setError(""); }}
								autoComplete="username"
								name="username"
							/>
							<input
								className="login-input login-input--dark"
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => { setPassword(e.target.value); setError(""); }}
								autoComplete="current-password"
								name="password"
							/>
							{error && <p className="login-error">{error}</p>}
							<button className="login-btn" type="submit" disabled={loading}>
								{loading ? "Signing in..." : "Sign In"}
							</button>

						</form>
					</div>

					<p className="login-forgot" onClick={handleForgot}>Forgot Password?</p>
				</div>
			</div>

			<div className="login-right">
				<div className="login-brand">
					<div className="login-brand-letters">
						<span>C</span>
						<span>D</span>
						<span>D</span>
						<span>M</span>
					</div>
					<p className="login-brand-sub">{import.meta.env.VITE_COMPANY_NAME}</p>
				</div>
			</div>
		</div >
	);
}
