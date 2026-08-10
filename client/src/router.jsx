import { createBrowserRouter } from 'react-router-dom'
import AuthPage from "./pages/AuthPage"
import HomePage from "./pages/HomePage"
import ErrorPage from "./pages/ErrorPage"
import App from "./App"
import { redirectIfLoggedIn, homeLoader, userConfirmation } from './utilites'

const router = createBrowserRouter([
    {
        path:"/",
        element: <App/>,
        loader: userConfirmation,
        errorElement: <ErrorPage />,
        children:[
            {
                index:true,
                element:<AuthPage/>,
                loader:redirectIfLoggedIn,
            },
            {
                path:"home",
                element: <HomePage />,
                loader:homeLoader,
            }
        ]
    }
])

export default router