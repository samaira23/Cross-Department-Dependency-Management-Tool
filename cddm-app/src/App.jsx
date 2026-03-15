import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import GraphView from "./pages/GraphView";
import AdminDashboard from "./pages/AdminDashboard";
import "./styles/global.css";
import axios from "axios";

const initialData = {
	departments: [],
	users: [],
	tasks: [],
	dependencies: [],
};

function getCookie(name) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) {
		return parts.pop().split(";").shift();
	}
	return null;
}

export default function App() {
	const [page, setPage] = useState(null);
	const [user, setUser] = useState(null);
	const [data, setData] = useState(initialData);

	// Check login on app load
	useEffect(() => {
		const token = getCookie("access_token");
		const username = getCookie("username");

		if (token && username) {
			setUser(username);
			setPage("admin");
			loadData();
		} else {
			setPage("login");
		}
	}, []);

	const loadData = async () => {
		const users = await getUserData();
		const departments = await getDepartmentData();
		const dependencies = await getDepData();
		const tasks = await getNodeData();

		setData({
			users,
			departments,
			dependencies,
			tasks,
		});
	};

	const handleLogin = (username) => {
		document.cookie = `username=${username}; path=/`;
		setUser(username);
		setPage("admin");
		loadData();
	};

	const getDepData = async () => {
		const auth_token = getCookie("access_token");

		const res = await axios.get(
			`${import.meta.env.VITE_BACKEND_URL}/api/dependency/read`,
			{
				headers: {
					Authorization: `Bearer ${auth_token}`,
				},
			}
		);

		if (res.status === 200) {
			console.log("Successfully fetched dependencies");
			return res.data.dependencies;
		}

		return [];
	};

	const getNodeData = async () => {
		const auth_token = getCookie("access_token");

		const res = await axios.get(
			`${import.meta.env.VITE_BACKEND_URL}/api/node/read`,
			{
				headers: {
					Authorization: `Bearer ${auth_token}`,
				},
			}
		);

		if (res.status === 200) {
			console.log("Fetched tasks successfully");

			const resData = res.data;
			const tasks = [];

			for (let i = 0; i < resData.length; i++) {
				tasks.push({
					id: resData[i].id,
					name: resData[i].name,
					department: resData[i].dept_id,
				});
			}

			return tasks;
		}

		return [];
	};

	const getUserData = async () => {
		const auth_token = getCookie("access_token");

		const res = await axios.get(
			`${import.meta.env.VITE_BACKEND_URL}/api/user/list`,
			{
				headers: {
					Authorization: `Bearer ${auth_token}`,
				},
			}
		);

		if (res.status === 200) {
			console.log("Users Obtained Successfully");
			return res.data.users;
		}

		return [];
	};

	const getDepartmentData = async () => {
		const auth_token = getCookie("access_token");

		const res = await axios.get(
			`${import.meta.env.VITE_BACKEND_URL}/api/department/read`,
			{
				headers: {
					Authorization: `Bearer ${auth_token}`,
				},
			}
		);

		if (res.status === 200) {
			console.log("Fetched departments successfully");
			return res.data;
		}

		return [];
	};

	const handleLogout = () => {
		document.cookie = "access_token=; Max-Age=0; path=/";
		document.cookie = "username=; Max-Age=0; path=/";
		setUser(null);
		setPage("login");
	};

	return (
		<div className="app">
			{page === "login" && <LoginPage onLogin={handleLogin} />}

			{page === "admin" && (
				<AdminDashboard
					user={user}
					data={data}
					setData={setData}
					onLogout={handleLogout}
					onGraphView={() => setPage("graph")}
					reloadData={loadData}
				/>
			)}

			{page === "graph" && (
				<GraphView
					user={user}
					data={data}
					onLogout={handleLogout}
					onBack={() => setPage("admin")}
				/>
			)}
		</div>
	);
}
