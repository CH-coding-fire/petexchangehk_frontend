import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
//hello world
import CardGroup from './components/UI/CardGroup';
import NavBar from './components/Layout/Navbar';
import {
	Routes,
	Route,
	Navigate,
	useNavigate,
	useParams,
	useLocation,
	HashRouter,
} from 'react-router-dom';
import LoginForm from './components/Form/LoginForm';
import FormikContainer from './components/Form/FormikContainer';
import { useState } from 'react';
import { useEffect } from 'react';
import BuildNickName from './components/Form/BuildNickname';
import axios from 'axios';
import Search from './components/Form/Search';
import { QueryContext } from './Context/QueryContext';
// import { UserContext } from './Context/UserContext';
import { useContext } from 'react';
import TestSameValue from './components/UI/TestSameValue';

axios.defaults.withCredentials = true;

export const targetServerURL =
				`${(process.env.REACT_APP_LOCAL_BACKEND_8080
				|| process.env.REACT_APP_BACKEND_URL)}`

function App() {
	const [user, setUser] = useState('');
	// const [nickname, setNickname] = useState(null);
	const navigate = useNavigate();
	let params = useParams();
	let { pathname } = useLocation();
	const [query, setQuery] = useState(null);
	const [queryContext, setQueryContext] = useState(null)
	// const [userContext, setUserContext] = useContext(null)

	//The reason I use useEffect is want the app to load the user status once
	//every time the app is loaded.
	console.log('FUCK YOU BITCH WHY VERCEL IS NOT UPDATING')
	useEffect(() => {
		const getUser = async () => {

			axios.get(`${targetServerURL}/auth/login/success/`)
				.then(async (response) => {
					const user = response.data
					if (user.success === false) {
						console.log('the server said no user')
						return
					}
					console.log('userInfo from App.jsx', user)
					setUser(user);
					if(!user.nickname){
					navigate('/createnickname')
					}
				})
				.catch((err) => {
					console.log('ERROR!!', err);
				})



// const targetRoute = '/auth/login/success/'
			// fetch(`${targetServerURL}${targetRoute}`, {
			// 	method: 'GET',
			// 	credentials: 'include',
			// 	// headers: {
			// 		// Accept: 'application/json',
			// 		// 'Content-Type': 'application/json',
			// 	// },
			// })
			// 	.then(async (response) => {
			// 		if (response.status === 200 || response.status === 204) {
			// 			console.log('going to pass response.json()')
			// 			return response.json();
			// 		}
			// 		throw new Error('authentication has been failed');
			// 	})
			// 	.then(async (user) => {
			// 		if (user.success === false) {
			// 			console.log('the server said no user')
			// 			return
			// 		}
			// 		console.log('user from App.jsx', user)
			// 		setUser(user);
			// 		if(!user.nickname){
			// 		navigate('/createnickname')
			// 		}
			// 	})
			// 	.catch((err) => {
			// 		console.log('ERROR!!', err);
			// 	})
			// 	;
		};
		getUser();
	}, []);
	if (user && user.nickname == null && pathname !== '/createnickname') {
		navigate('/createnickname');
		console.log('no nick name');
	}
	const searchQueryHandler = (query) => {
		console.log('query:', query);
		// setQuery(query)
	}
	return (
		<QueryContext.Provider value={{ queryContext, setQueryContext }}>
			<NavBar className='position-sticky' user={user} />
			{/* <TestSameValue/> */}
			<div className="no_padding_body">
				<Routes>
					<Route exact path="/" element={<CardGroup user={user} query={query}/>} />
					<Route
						path="/findAdopter"
						element={user ? <FormikContainer /> : <Navigate to="/login" />}
					/>
					<Route path="/info" element={<div>领养须知</div>} />
					<Route path="/createnickname" element={<BuildNickName />} />
					<Route
						path="/login"
						element={user ? <Navigate to="/" /> : <LoginForm />}
					/>
					<Route
						path="/search"
						element={<Search searchQueryHandler={searchQueryHandler}/>}
					/>
					<Route
						path="/.well-known/pki-validation/3B9904FB619246AC9422A8FD1D2B4005.txt"
						element={<div>hello</div>}
					/>
					<Route path="*" element={<div>404 Cannot find the page</div>} />
				</Routes>
			</div>
			</QueryContext.Provider>

	);
}
export default App;
