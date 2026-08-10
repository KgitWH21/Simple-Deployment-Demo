import { useOutletContext } from "react-router-dom";
import AuthForm from "../components/AuthForm";

const AuthPage = () => {
    const {setUser} = useOutletContext()

    return (
        <>
            <h1>Authentication Page</h1>
            <AuthForm setUser={setUser} />
        </>
    )
}

export default AuthPage;